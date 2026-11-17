<?php
/*
 * API do Simple Education — versão XAMPP (PHP puro, sem Composer).
 *
 * Este arquivo é o ROTEADOR: toda chamada da API passa por aqui.
 * A rota vem depois de "index.php" no endereço (PATH_INFO), por exemplo:
 *
 *   POST  /simple-education/xampp/api/index.php/auth/login
 *   GET   /simple-education/xampp/api/index.php/topics/trigonometria
 *   GET   /simple-education/xampp/api/index.php/topics?year=1   (filtros na query string)
 *
 * As rotas, o JSON de entrada e de saída, os códigos de status e o formato de erro
 * são os mesmos da versão Node (veja docs/api.md), só sem o prefixo "/api".
 *
 * Ordem de cada requisição (igual à versão Node):
 *   1. cabeçalhos de segurança;
 *   2. lê o corpo JSON (400 se malformado, 413 se maior que 20 KB);
 *   3. confere a origem em POST/PUT/PATCH/DELETE (403 se vier de outro site);
 *   4. conecta no MySQL e instala o banco se faltar (503 se o MySQL não responder);
 *   5. carrega o aluno pelo cookie de sessão;
 *   6. chama a função da rota e devolve o JSON.
 */

declare(strict_types=1);

// Avisos do PHP nunca vão para a resposta (estragariam o JSON): vão só para o log do Apache.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Guarda tudo o que for impresso; enviarResposta() descarta antes de mandar o JSON.
ob_start();

// Se o PHP parar com um erro fatal (ex.: falta de memória), ainda responde JSON 500.
register_shutdown_function(function (): void {
    $erro = error_get_last();
    if ($erro === null || !in_array($erro['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        return;
    }
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (headers_sent()) {
        return;
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    // Erro de digitação no arquivo que a pessoa edita no Bloco de Notas: diz onde e como corrigir.
    if (basename((string) $erro['file']) === 'conexao.php') {
        http_response_code(503);
        echo json_encode(['error' => [
            'code' => 'DATABASE_UNAVAILABLE',
            'message' => "O arquivo xampp/api/conexao.php tem um erro de digitação (perto da linha {$erro['line']}).",
            'hint' => 'Abra o arquivo no Bloco de Notas e confira se cada valor está entre aspas simples, por exemplo: const DB_PASSWORD = \'minhasenha\'; (com o ponto e vírgula no fim). Salve e atualize a página.',
        ]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return;
    }
    http_response_code(500);
    echo '{"error":{"code":"INTERNAL_ERROR","message":"Erro interno. Tente novamente."}}';
});

require_once __DIR__ . '/conexao.php';
require_once __DIR__ . '/util.php';
require_once __DIR__ . '/instalar.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/usuarios.php';
require_once __DIR__ . '/progresso.php';
require_once __DIR__ . '/conteudo.php';
require_once __DIR__ . '/tentativas.php';

/** Tamanho máximo do corpo JSON: 20 KB, como na versão Node. */
const LIMITE_CORPO_BYTES = 20 * 1024;

/**
 * Tabela de rotas: [método, padrão do caminho, função que responde].
 * Trechos como (?<slug>[^/]+) viram $req->parametros['slug'].
 * O "i" no fim do padrão ignora maiúsculas no caminho, como o Express.
 */
function tabelaDeRotas(): array
{
    return [
        ['GET',    '#^/health$#i',                              'rotaSaude'],

        ['POST',   '#^/auth/register$#i',                       'rotaCadastro'],
        ['POST',   '#^/auth/login$#i',                          'rotaLogin'],
        ['POST',   '#^/auth/logout$#i',                         'rotaLogout'],
        ['GET',    '#^/auth/session$#i',                        'rotaSessao'],
        ['GET',    '#^/auth/me$#i',                             'rotaEu'],

        ['PATCH',  '#^/users/me$#i',                            'rotaAtualizarPerfil'],

        ['GET',    '#^/subjects$#i',                            'rotaListarMaterias'],
        ['GET',    '#^/subjects/(?<slug>[^/]+)$#i',             'rotaVerMateria'],
        ['GET',    '#^/topics$#i',                              'rotaListarAssuntos'],
        ['GET',    '#^/topics/(?<slug>[^/]+)$#i',               'rotaVerAssunto'],
        ['PUT',    '#^/topics/(?<slug>[^/]+)/completion$#i',    'rotaMarcarAulaConcluida'],
        ['DELETE', '#^/topics/(?<slug>[^/]+)/completion$#i',    'rotaDesmarcarAulaConcluida'],
        ['POST',   '#^/topics/(?<slug>[^/]+)/attempts$#i',      'rotaIniciarTentativa'],
        ['GET',    '#^/search$#i',                              'rotaPesquisar'],

        ['GET',    '#^/attempts$#i',                            'rotaHistoricoDeTentativas'],
        ['GET',    '#^/attempts/(?<id>[^/]+)$#i',               'rotaVerTentativa'],
        ['POST',   '#^/attempts/(?<id>[^/]+)/answers$#i',       'rotaResponderQuestao'],
        ['POST',   '#^/attempts/(?<id>[^/]+)/finish$#i',        'rotaFinalizarTentativa'],
        ['GET',    '#^/progress$#i',                            'rotaProgresso'],
    ];
}

/** GET /health — o PHP está respondendo (não consulta o banco, como na versão Node). */
function rotaSaude(?PDO $db, Requisicao $req): array
{
    return [200, ['status' => 'ok']];
}

/** Cabeçalhos enviados em todas as respostas. */
function enviarCabecalhosPadrao(): void
{
    header_remove('X-Powered-By');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('Cache-Control: no-store');
}

/**
 * Caminho da rota depois de "index.php" (ex.: "/auth/login").
 * Usa PATH_INFO; se o servidor não informar, calcula a partir do endereço.
 * Uma barra no final é ignorada ("/health/" = "/health"), como no Express.
 */
function lerRota(): string
{
    $rota = $_SERVER['PATH_INFO'] ?? $_SERVER['ORIG_PATH_INFO'] ?? null;
    if ($rota === null || $rota === '') {
        $caminho = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));
        $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
        $rota = ($script !== '' && str_starts_with($caminho, $script)) ? substr($caminho, strlen($script)) : '/';
    }
    if ($rota === '' || $rota[0] !== '/') {
        $rota = '/' . $rota;
    }
    if (strlen($rota) > 1 && substr($rota, -1) === '/') {
        $rota = substr($rota, 0, -1);
    }
    return $rota;
}

/**
 * Lê o corpo JSON da requisição (só quando Content-Type é application/json,
 * como o express.json()). Sem corpo → [].
 */
function lerCorpoJson(): array
{
    $tipo = (string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    if (!preg_match('#^\s*application/json\s*(;|$)#i', $tipo)) {
        return [];
    }

    $muitoGrande = new HttpErro(413, 'PAYLOAD_TOO_LARGE', 'Requisição muito grande.');
    $tamanhoInformado = $_SERVER['CONTENT_LENGTH'] ?? '';
    if ($tamanhoInformado !== '' && (int) $tamanhoInformado > LIMITE_CORPO_BYTES) {
        throw $muitoGrande;
    }
    // Lê no máximo 1 byte além do limite: suficiente para saber se passou.
    $bruto = file_get_contents('php://input', false, null, 0, LIMITE_CORPO_BYTES + 1);
    $bruto = $bruto === false ? '' : $bruto;
    if (strlen($bruto) > LIMITE_CORPO_BYTES) {
        throw $muitoGrande;
    }
    if ($bruto === '') {
        return [];
    }

    $invalido = new HttpErro(400, 'INVALID_JSON', 'Corpo da requisição inválido.');
    // Como o express.json() (modo strict): só aceita objeto {...} ou lista [...].
    if (!preg_match('/^[\x20\x09\x0A\x0D]*[\[{]/', $bruto)) {
        throw $invalido;
    }
    try {
        $dados = json_decode($bruto, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $erro) {
        throw $invalido;
    }
    return is_array($dados) ? $dados : [];
}

/**
 * Proteção contra requisições forjadas (CSRF), somada ao cookie SameSite=Lax:
 * em métodos que alteram dados, se o navegador enviar o cabeçalho Origin,
 * o endereço dele precisa ser o deste próprio servidor. Sem Origin, permite.
 */
function verificarOrigem(string $metodo): void
{
    if (!in_array($metodo, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }
    $origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origem === '') {
        return;
    }

    $partes = parse_url($origem);
    if (is_array($partes) && isset($partes['scheme'], $partes['host'])) {
        $esquema = strtolower($partes['scheme']);
        $hostDaOrigem = strtolower($partes['host']);
        $portasPadrao = ['http' => 80, 'https' => 443];
        if (isset($partes['port']) && ($portasPadrao[$esquema] ?? null) !== $partes['port']) {
            $hostDaOrigem .= ':' . $partes['port'];
        }
        $hostDoServidor = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        if ($hostDaOrigem === $hostDoServidor) {
            return;
        }
    }
    throw proibido('Origem da requisição não permitida.');
}

/** Monta e responde a requisição atual. */
function atenderRequisicao(): void
{
    enviarCabecalhosPadrao();

    $req = new Requisicao();
    $req->metodo = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    $req->rota = lerRota();
    $req->query = $_GET;
    $req->ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $cookie = $_COOKIE[SESSION_COOKIE_NAME] ?? null;
    $req->tokenSessao = is_string($cookie) && $cookie !== '' ? $cookie : null;

    // Pré-verificação de CORS do navegador: a versão Node responde 204 sem corpo.
    if ($req->metodo === 'OPTIONS') {
        enviarResposta(204, null);
        return;
    }

    $req->corpo = lerCorpoJson();
    verificarOrigem($req->metodo);

    // HEAD usa as mesmas rotas do GET (o Apache não envia o corpo).
    $metodoDaRota = $req->metodo === 'HEAD' ? 'GET' : $req->metodo;

    // Procura a rota na tabela.
    $funcao = null;
    foreach (tabelaDeRotas() as [$metodo, $padrao, $nomeDaFuncao]) {
        if ($metodo === $metodoDaRota && preg_match($padrao, $req->rota, $m)) {
            $funcao = $nomeDaFuncao;
            $req->parametros = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            break;
        }
    }

    if ($funcao === 'rotaSaude') {
        [$status, $corpo] = rotaSaude(null, $req);
        enviarResposta($status, $corpo);
        return;
    }

    $db = abrirBanco();
    $req->usuario = usuarioDaSessao($db, $req->tokenSessao);

    if ($funcao === null) {
        // Tudo em /users exige login (como o router.use(requireAuth) do Node).
        if (preg_match('#^/users(/|$)#i', $req->rota) && $req->usuario === null) {
            throw naoAutorizado();
        }
        throw naoEncontrado('Rota da API não encontrada.');
    }

    [$status, $corpo] = $funcao($db, $req);
    enviarResposta($status, $corpo);
}

try {
    atenderRequisicao();
} catch (HttpErro $erro) {
    foreach ($erro->cabecalhos as $nome => $valor) {
        header($nome . ': ' . $valor);
    }
    enviarResposta($erro->status, corpoDeErro($erro->codigo, $erro->getMessage(), $erro->detalhes));
} catch (BancoIndisponivel $erro) {
    enviarResposta(503, ['error' => [
        'code' => 'DATABASE_UNAVAILABLE',
        'message' => $erro->getMessage(),
        'hint' => $erro->dica,
    ]]);
} catch (Throwable $erro) {
    // Conexão com o MySQL caiu no meio da requisição → 503 com a explicação.
    if ($erro instanceof PDOException && in_array(codigoErroMysql($erro), [2002, 2003, 2006, 2013], true)) {
        $traduzido = traduzirErroDeConexao($erro);
        enviarResposta(503, ['error' => [
            'code' => 'DATABASE_UNAVAILABLE',
            'message' => $traduzido->getMessage(),
            'hint' => $traduzido->dica,
        ]]);
    } else {
        // Detalhes só no log do Apache (nunca na resposta).
        error_log('[erro] ' . get_class($erro) . ': ' . $erro->getMessage() . ' em ' . $erro->getFile() . ':' . $erro->getLine() . "\n" . $erro->getTraceAsString());
        enviarResposta(500, corpoDeErro('INTERNAL_ERROR', 'Erro interno. Tente novamente.'));
    }
}
