<?php
/*
 * Instalação automática do banco.
 *
 * A cada requisição, abrirBanco() conecta no MySQL e confere (com uma consulta
 * rápida) se o banco simple_education_xampp e a tabela "topics" existem.
 * Se faltar, cria o banco e executa, nesta ordem:
 *   1. sql/estrutura.sql  (tabelas)
 *   2. sql/conteudo.sql   (matéria, aulas, seções, questões e alternativas)
 * Assim quem usa o XAMPP não precisa importar nada no phpMyAdmin.
 *
 * Também traduz os erros de conexão mais comuns em mensagens em português
 * com a solução (resposta 503).
 */

declare(strict_types=1);

// Versões mínimas: a estrutura usa restrições CHECK (MySQL 8.0.16+/MariaDB 10.2.1+);
// mantemos o mesmo mínimo da versão Node.
const VERSAO_MINIMA_MYSQL = '8.0.19';
const VERSAO_MINIMA_MARIADB = '10.2.1';

// Nome da "trava" do MySQL que impede duas instalações ao mesmo tempo.
const TRAVA_INSTALACAO = 'simple_education_xampp_instalacao';

/**
 * Conecta no MySQL, instala o banco se for preciso e devolve a conexão
 * já usando o banco do sistema.
 *
 * @throws BancoIndisponivel quando não é possível usar o MySQL (vira 503).
 */
function abrirBanco(): PDO
{
    if (!class_exists('PDO') || !in_array('mysql', PDO::getAvailableDrivers(), true)) {
        throw new BancoIndisponivel(
            'O PHP está sem a extensão pdo_mysql, necessária para falar com o MySQL.',
            'Use o PHP que vem com o XAMPP (ele já traz o pdo_mysql ligado) ou ative "extension=pdo_mysql" no php.ini e reinicie o Apache.'
        );
    }
    if (!preg_match('/^[A-Za-z0-9_]{1,64}$/D', DB_NAME)) {
        throw new BancoIndisponivel(
            'O nome do banco em DB_NAME é inválido.',
            'Em xampp/api/conexao.php, use só letras, números e "_" em DB_NAME (padrão: simple_education_xampp).'
        );
    }

    try {
        $db = conectarMysql();
    } catch (PDOException $erro) {
        throw traduzirErroDeConexao($erro);
    }

    try {
        if (!bancoEstaInstalado($db)) {
            instalarComTrava($db);
        }
        $db->exec('USE `' . DB_NAME . '`');
    } catch (PDOException $erro) {
        throw traduzirErroDeConexao($erro);
    }
    return $db;
}

// Tabela criada como ÚLTIMO passo da instalação. Se ela não existe, a instalação não
// terminou (ex.: o Apache ou o MySQL foi parado no meio do primeiro acesso).
const TABELA_INSTALACAO_CONCLUIDA = 'instalacao_concluida';

/** A instalação terminou por completo? (consulta barata, roda em toda requisição) */
function bancoEstaInstalado(PDO $db): bool
{
    return tabelaExiste($db, TABELA_INSTALACAO_CONCLUIDA);
}

function tabelaExiste(PDO $db, string $tabela): bool
{
    $quantidade = buscarValor(
        $db,
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [DB_NAME, $tabela]
    );
    return (int) $quantidade > 0;
}

/**
 * O banco existe mas a instalação não terminou. Sem nenhuma conta cadastrada,
 * apaga e deixa a instalação recomeçar do zero. Com contas, não apaga nada:
 * orienta a pessoa a decidir (apagar o banco perde as contas e o histórico).
 */
function descartarInstalacaoIncompleta(PDO $db): void
{
    $temContas = tabelaExiste($db, 'users')
        && (int) buscarValor($db, 'SELECT COUNT(*) FROM `' . DB_NAME . '`.`users`') > 0;
    if ($temContas) {
        throw new BancoIndisponivel(
            'A instalação do banco do sistema ficou incompleta (provavelmente o Apache ou o MySQL foi parado durante o primeiro acesso).',
            'Abra o phpMyAdmin (botão Admin do MySQL no XAMPP), apague o banco simple_education_xampp (aba Operações → Remover o banco de dados) e atualize esta página. Isso apaga as contas cadastradas.'
        );
    }
    error_log('[instalar] Instalação incompleta encontrada e sem contas: recriando o banco.');
    $db->exec('DROP DATABASE IF EXISTS `' . DB_NAME . '`');
}

/**
 * Garante que só uma requisição instala por vez.
 * GET_LOCK é uma trava do próprio MySQL: a segunda requisição espera a primeira
 * terminar e, ao conseguir a trava, vê que o banco já está pronto e segue em frente.
 */
function instalarComTrava(PDO $db): void
{
    $conseguiu = buscarValor($db, 'SELECT GET_LOCK(?, 90)', [TRAVA_INSTALACAO]);
    if ((int) $conseguiu !== 1) {
        throw new BancoIndisponivel(
            'O banco do sistema ainda está sendo instalado.',
            'Aguarde alguns segundos e atualize a página.'
        );
    }
    try {
        if (!bancoEstaInstalado($db)) {
            instalarBanco($db);
        }
    } finally {
        buscarValor($db, 'SELECT RELEASE_LOCK(?)', [TRAVA_INSTALACAO]);
    }
}

/** Cria o banco e executa estrutura.sql e conteudo.sql. */
function instalarBanco(PDO $db): void
{
    // A carga do conteúdo pode passar do tempo padrão do PHP (30 s) em máquinas lentas.
    if (function_exists('set_time_limit')) {
        @set_time_limit(180);
    }

    conferirVersaoDoServidor($db);

    $arquivos = [__DIR__ . '/sql/estrutura.sql', __DIR__ . '/sql/conteudo.sql'];
    foreach ($arquivos as $arquivo) {
        if (!is_readable($arquivo)) {
            throw new BancoIndisponivel(
                'Arquivo de instalação não encontrado: xampp/api/sql/' . basename($arquivo) . '.',
                'Baixe o projeto de novo (Code → Download ZIP, branch versao-xampp) e copie a pasta inteira para o htdocs.'
            );
        }
    }

    // Sobrou um banco de uma instalação que não terminou? Recomeça do zero (ou orienta).
    $tabelasAntes = (int) buscarValor(
        $db,
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
        [DB_NAME]
    );
    if ($tabelasAntes > 0) {
        descartarInstalacaoIncompleta($db);
    }

    $db->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $db->exec('USE `' . DB_NAME . '`');

    try {
        foreach ($arquivos as $arquivo) {
            foreach (separarComandosSql((string) file_get_contents($arquivo)) as $comando) {
                $db->exec($comando);
            }
        }
        // Último passo: marca a instalação como concluída.
        $db->exec('CREATE TABLE `' . TABELA_INSTALACAO_CONCLUIDA . '` (concluida_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
        $db->exec('INSERT INTO `' . TABELA_INSTALACAO_CONCLUIDA . '` () VALUES ()');
    } catch (PDOException $erro) {
        error_log('[instalar] Falha ao executar ' . ($arquivo ?? '?') . ': ' . $erro->getMessage());
        // Recém-criado e sem contas: apaga para a próxima tentativa começar do zero.
        try {
            $db->exec('DROP DATABASE IF EXISTS `' . DB_NAME . '`');
        } catch (PDOException $ignorado) {
            // Se nem isso der certo, a próxima requisição encontra a instalação incompleta e trata.
        }
        throw traduzirErroDeInstalacao($erro);
    }
}

/**
 * Separa um arquivo .sql em comandos, cortando em cada ";" que esteja FORA de textos
 * entre aspas e fora de comentários. Também descarta os comentários "-- ", "#" e "/* * /".
 * Executar um comando por vez permite saber exatamente qual falhou.
 */
function separarComandosSql(string $sql): array
{
    $comandos = [];
    $atual = '';
    $tamanho = strlen($sql);
    $aspa = null; // aspa que abriu o texto atual: ', " ou `

    for ($i = 0; $i < $tamanho; $i++) {
        $c = $sql[$i];
        $proximo = $i + 1 < $tamanho ? $sql[$i + 1] : '';

        if ($aspa !== null) {
            $atual .= $c;
            if ($c === '\\' && $aspa !== '`' && $proximo !== '') {
                // Caractere escapado (ex.: \' ou \n): copia junto e pula.
                $atual .= $proximo;
                $i++;
            } elseif ($c === $aspa) {
                if ($proximo === $aspa) {
                    // Aspa dobrada ('') dentro do texto.
                    $atual .= $proximo;
                    $i++;
                } else {
                    $aspa = null;
                }
            }
            continue;
        }

        // Comentário de linha: "-- " (ou "--" no fim da linha) e "#".
        if (($c === '-' && $proximo === '-' && ($i + 2 >= $tamanho || ctype_space($sql[$i + 2]))) || $c === '#') {
            $fim = strpos($sql, "\n", $i);
            $i = $fim === false ? $tamanho : $fim;
            $atual .= "\n";
            continue;
        }
        // Comentário de bloco /* ... */
        if ($c === '/' && $proximo === '*') {
            $fim = strpos($sql, '*/', $i + 2);
            $i = $fim === false ? $tamanho : $fim + 1;
            $atual .= ' ';
            continue;
        }

        if ($c === "'" || $c === '"' || $c === '`') {
            $aspa = $c;
            $atual .= $c;
            continue;
        }

        if ($c === ';') {
            if (trim($atual) !== '') {
                $comandos[] = trim($atual);
            }
            $atual = '';
            continue;
        }

        $atual .= $c;
    }

    if (trim($atual) !== '') {
        $comandos[] = trim($atual);
    }
    return $comandos;
}

/** Recusa versões antigas antes de começar (a estrutura usa recursos do MySQL 8.0.19+ / MariaDB 10.2+). */
function conferirVersaoDoServidor(PDO $db): void
{
    $versao = (string) buscarValor($db, 'SELECT VERSION()');
    $ehMariaDb = stripos($versao, 'mariadb') !== false;
    $produto = $ehMariaDb ? 'MariaDB' : 'MySQL';
    // Algumas versões do MariaDB se apresentam com o prefixo "5.5.5-".
    $limpa = $ehMariaDb ? preg_replace('/^5\.5\.5-/', '', $versao) : $versao;
    $minima = $ehMariaDb ? VERSAO_MINIMA_MARIADB : VERSAO_MINIMA_MYSQL;

    if (!preg_match('/^(\d+)\.(\d+)\.(\d+)/', (string) $limpa, $m)) {
        return; // Formato desconhecido: tenta instalar mesmo assim.
    }
    $numero = "{$m[1]}.{$m[2]}.{$m[3]}";
    if (version_compare($numero, $minima, '<')) {
        throw versaoAntiga("O {$produto} instalado ({$numero}) é antigo demais para o sistema (mínimo: {$produto} {$minima}).");
    }
}

function versaoAntiga(string $mensagem): BancoIndisponivel
{
    return new BancoIndisponivel(
        $mensagem,
        'Atualize o XAMPP: instale uma versão recente (8.x), que já vem com um MariaDB compatível. O sistema precisa de MySQL 8.0.19+ ou MariaDB 10.2+.'
    );
}

/** Erros durante a execução dos arquivos .sql. */
function traduzirErroDeInstalacao(PDOException $erro): BancoIndisponivel
{
    $codigo = codigoErroMysql($erro);
    if ($codigo === 1064) {
        // Erro de sintaxe: o MySQL/MariaDB não entendeu um comando da estrutura.
        return versaoAntiga('O MySQL recusou um comando de criação do banco: a versão do MySQL parece antiga demais.');
    }
    $conexao = traduzirErroDeConexao($erro);
    if ($conexao->getMessage() !== MENSAGEM_ERRO_DESCONHECIDO) {
        return $conexao;
    }
    return new BancoIndisponivel(
        "Não foi possível criar o banco do sistema (erro MySQL {$codigo}).",
        'Apague o banco simple_education_xampp no phpMyAdmin (botão Admin do MySQL no XAMPP), se ele existir, e atualize a página. Se continuar, veja o arquivo de log do Apache (botão Logs → error.log).'
    );
}

const MENSAGEM_ERRO_DESCONHECIDO = 'Não foi possível usar o banco de dados MySQL.';

/**
 * Traduz os erros mais comuns do MySQL em mensagem + dica, sem expor senha
 * nem detalhes internos. Os detalhes vão só para o log do Apache.
 */
function traduzirErroDeConexao(PDOException $erro): BancoIndisponivel
{
    $codigo = codigoErroMysql($erro);
    $texto = $erro->getMessage();

    if (in_array($codigo, [2002, 2003, 2006, 2013], true) || stripos($texto, 'refused') !== false) {
        return new BancoIndisponivel(
            'Não foi possível conectar ao MySQL.',
            'Abra o XAMPP Control Panel e clique em Start na linha do MySQL.'
        );
    }
    if ($codigo === 2005) {
        return new BancoIndisponivel(
            'O endereço do MySQL em DB_HOST não foi encontrado.',
            'Em xampp/api/conexao.php, use DB_HOST = \'localhost\' (o MySQL instalado no seu computador).'
        );
    }
    if ($codigo === 1045) {
        return new BancoIndisponivel(
            'O MySQL recusou o usuário ou a senha.',
            'Confira DB_USER e DB_PASSWORD em xampp/api/conexao.php (no XAMPP a senha é vazia).'
        );
    }
    if ($codigo === 1044 || $codigo === 1142) {
        return new BancoIndisponivel(
            'O usuário do MySQL não tem permissão para criar o banco do sistema.',
            'Use o usuário root em xampp/api/conexao.php (DB_USER = \'root\'), que tem essa permissão.'
        );
    }
    if ($codigo === 1064) {
        return versaoAntiga('O MySQL recusou um comando: a versão do MySQL parece antiga demais.');
    }

    error_log('[banco] ' . $texto);
    return new BancoIndisponivel(
        MENSAGEM_ERRO_DESCONHECIDO,
        'Confira se o MySQL está ligado no XAMPP Control Panel e os dados de acesso em xampp/api/conexao.php.'
    );
}
