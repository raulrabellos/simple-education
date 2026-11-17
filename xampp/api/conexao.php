<?php
/*
 * ============================================================================
 *  CONFIGURAÇÃO DO BANCO DE DADOS — Simple Education (versão XAMPP)
 * ============================================================================
 *
 *  Este é o ÚNICO arquivo que você precisa editar se o seu MySQL não estiver
 *  no padrão do XAMPP. Pode abrir no Bloco de Notas, mudar e salvar.
 *  Altere SOMENTE o que está entre as aspas (ou o número da porta).
 *
 *  Padrão do XAMPP: servidor "localhost", porta 3306, usuário "root" e senha vazia.
 * ============================================================================
 */

// (Este arquivo não usa declare(strict_types=1) de propósito: assim ele continua
// funcionando mesmo se o editor salvar com BOM, como o Bloco de Notas pode fazer.)

// Endereço do MySQL. "localhost" = o MySQL instalado neste computador.
const DB_HOST = 'localhost';

// Porta do MySQL. O XAMPP Control Panel mostra a porta ao lado de "MySQL" (normalmente 3306).
const DB_PORT = 3306;

// Usuário do MySQL. No XAMPP é "root".
const DB_USER = 'root';

// Senha do MySQL.
// XAMPP: deixe vazio. MySQL Workbench/Server: coloque a senha do root entre as aspas.
const DB_PASSWORD = '';

// Nome do banco do sistema. Ele é criado sozinho no primeiro acesso.
const DB_NAME = 'simple_education_xampp';

/*
 * ----------------------------------------------------------------------------
 *  Regras do sistema (normalmente não é preciso mudar)
 * ----------------------------------------------------------------------------
 */

// Quantos dias o aluno continua logado sem precisar entrar de novo.
const SESSION_DAYS = 7;

// Limite de login: depois de LOGIN_MAX_ATTEMPTS erros em LOGIN_WINDOW_MINUTES minutos
// (para o mesmo computador + e-mail), o login fica bloqueado até a janela passar.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

// Nome do cookie de sessão (o mesmo da versão Node).
const SESSION_COOKIE_NAME = 'se_session';

/*
 * ----------------------------------------------------------------------------
 *  Daqui para baixo é código: não precisa mexer.
 * ----------------------------------------------------------------------------
 */

/**
 * Abre uma conexão PDO com o servidor MySQL, SEM escolher o banco.
 * Quem escolhe o banco (com "USE") é o instalar.php, depois de conferir
 * se ele existe e criá-lo quando faltar.
 *
 * Opções usadas:
 * - ERRMODE_EXCEPTION: qualquer erro do MySQL vira exceção (nada falha em silêncio);
 * - FETCH_ASSOC: cada linha vem como array com o nome das colunas;
 * - EMULATE_PREPARES desligado: os valores vão separados do SQL para o próprio MySQL
 *   (consulta preparada de verdade) e os números chegam como int no PHP;
 * - MULTI_STATEMENTS desligado: um comando por vez. A instalação separa os arquivos
 *   .sql em comandos e executa um de cada vez (veja instalar.php), então não precisa
 *   de conexão com vários comandos;
 * - time_zone '+00:00': todas as datas são gravadas e lidas em UTC.
 *
 * Se o MySQL estiver desligado ou recusar a senha, o PDO lança PDOException;
 * o instalar.php converte isso numa mensagem em português (erro 503).
 */
function conectarMysql(): PDO
{
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=utf8mb4';

    $opcoes = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
        PDO::ATTR_TIMEOUT            => 5,
    ];
    if (defined('PDO::MYSQL_ATTR_MULTI_STATEMENTS')) {
        $opcoes[PDO::MYSQL_ATTR_MULTI_STATEMENTS] = false;
    }

    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, $opcoes);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}
