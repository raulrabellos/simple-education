<?php
/*
 * Utilitários da API: erros HTTP, resposta JSON, acesso ao banco,
 * leitura e validação de dados e normalização de texto para a pesquisa.
 *
 * Equivalem a backend/src/utils/*.js da versão Node (branch main).
 */

declare(strict_types=1);

/* ============================================================================
 *  Erros HTTP
 * ========================================================================== */

/**
 * Erro com status HTTP e código legível. O index.php converte em JSON:
 *   { "error": { "code": "...", "message": "...", "details": { ... } } }
 */
final class HttpErro extends Exception
{
    public int $status;
    public string $codigo;
    /** Mensagens por campo (ex.: ["email" => "Informe um e-mail válido."]) ou null. */
    public ?array $detalhes;
    /** Cabeçalhos extras da resposta (ex.: Retry-After). */
    public array $cabecalhos;

    public function __construct(int $status, string $codigo, string $mensagem, ?array $detalhes = null, array $cabecalhos = [])
    {
        parent::__construct($mensagem);
        $this->status = $status;
        $this->codigo = $codigo;
        $this->detalhes = $detalhes;
        $this->cabecalhos = $cabecalhos;
    }
}

/**
 * Banco indisponível (MySQL desligado, senha recusada, versão antiga...).
 * Vira resposta 503 com uma mensagem e uma dica de solução em português.
 */
final class BancoIndisponivel extends Exception
{
    public string $dica;

    public function __construct(string $mensagem, string $dica)
    {
        parent::__construct($mensagem);
        $this->dica = $dica;
    }
}

function erroValidacao(string $mensagem, ?array $detalhes = null): HttpErro
{
    return new HttpErro(400, 'VALIDATION_ERROR', $mensagem, $detalhes);
}

function naoAutorizado(string $mensagem = 'Você precisa entrar na sua conta.'): HttpErro
{
    return new HttpErro(401, 'UNAUTHORIZED', $mensagem);
}

function proibido(string $mensagem = 'Acesso negado.'): HttpErro
{
    return new HttpErro(403, 'FORBIDDEN', $mensagem);
}

function naoEncontrado(string $mensagem = 'Recurso não encontrado.'): HttpErro
{
    return new HttpErro(404, 'NOT_FOUND', $mensagem);
}

function conflito(string $mensagem): HttpErro
{
    return new HttpErro(409, 'CONFLICT', $mensagem);
}

/* ============================================================================
 *  Dados da requisição
 * ========================================================================== */

/**
 * Tudo o que as rotas precisam saber sobre a requisição atual.
 * O index.php preenche e entrega para a função da rota.
 */
final class Requisicao
{
    /** GET, POST, PUT, PATCH ou DELETE. */
    public string $metodo = 'GET';
    /** Caminho da rota, ex.: "/topics/trigonometria". */
    public string $rota = '/';
    /** Valores dentro da rota, ex.: ["slug" => "trigonometria"]. */
    public array $parametros = [];
    /** Query string (?year=1&subject=matematica). */
    public array $query = [];
    /** Corpo JSON já convertido para array ([] quando não há corpo). */
    public array $corpo = [];
    /** Token do cookie de sessão (ou null). */
    public ?string $tokenSessao = null;
    /** Aluno logado (linha da tabela users, sem a senha) ou null. */
    public ?array $usuario = null;
    /** IP de quem fez a requisição (usado no limite de login). */
    public string $ip = '';
}

/* ============================================================================
 *  Resposta JSON
 * ========================================================================== */

/**
 * Envia a resposta: status, corpo em JSON (ou nada, quando $corpo é null) e encerra.
 * Descarta qualquer texto que tenha sido impresso antes (avisos do PHP, espaços),
 * para que o navegador receba sempre um JSON válido.
 */
function enviarResposta(int $status, $corpo): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($status);
    if ($corpo === null) {
        // 204: sem corpo.
        header_remove('Content-Type');
        return;
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        $corpo,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
}

/** Corpo de erro no formato padrão da API. */
function corpoDeErro(string $codigo, string $mensagem, ?array $detalhes = null): array
{
    $erro = ['code' => $codigo, 'message' => $mensagem];
    if ($detalhes !== null) {
        // (object) garante {"campo": "..."} no JSON, mesmo com chaves numéricas.
        $erro['details'] = (object) $detalhes;
    }
    return ['error' => $erro];
}

/* ============================================================================
 *  Acesso ao banco (sempre com consulta preparada)
 * ========================================================================== */

/**
 * Prepara e executa um SQL com "?" no lugar dos valores.
 * Cada valor é enviado separado do SQL, com o tipo certo (int, null ou texto):
 * nada digitado pelo usuário é colado dentro do comando.
 */
function executarSql(PDO $db, string $sql, array $parametros = []): PDOStatement
{
    $comando = $db->prepare($sql);
    $posicao = 1;
    foreach ($parametros as $valor) {
        if (is_int($valor)) {
            $comando->bindValue($posicao, $valor, PDO::PARAM_INT);
        } elseif (is_bool($valor)) {
            $comando->bindValue($posicao, $valor ? 1 : 0, PDO::PARAM_INT);
        } elseif ($valor === null) {
            $comando->bindValue($posicao, null, PDO::PARAM_NULL);
        } else {
            $comando->bindValue($posicao, (string) $valor, PDO::PARAM_STR);
        }
        $posicao++;
    }
    $comando->execute();
    return $comando;
}

/** Todas as linhas do resultado. */
function buscarTodas(PDO $db, string $sql, array $parametros = []): array
{
    return executarSql($db, $sql, $parametros)->fetchAll();
}

/** Primeira linha do resultado, ou null. */
function buscarUma(PDO $db, string $sql, array $parametros = []): ?array
{
    $linha = executarSql($db, $sql, $parametros)->fetch();
    return $linha === false ? null : $linha;
}

/** Primeiro valor da primeira linha (ex.: SELECT COUNT(*)), ou null. */
function buscarValor(PDO $db, string $sql, array $parametros = [])
{
    $valor = executarSql($db, $sql, $parametros)->fetchColumn();
    return $valor === false ? null : $valor;
}

/** "?, ?, ?" com a quantidade pedida (para IN (...) e INSERT de várias linhas). */
function marcadores(int $quantidade): string
{
    return implode(', ', array_fill(0, $quantidade, '?'));
}

/**
 * Executa várias operações em uma transação: ou todas são gravadas, ou nenhuma.
 * Uso: emTransacao($db, function () use (...) { ... });
 */
function emTransacao(PDO $db, callable $funcao)
{
    $db->beginTransaction();
    try {
        $resultado = $funcao();
        $db->commit();
        return $resultado;
    } catch (Throwable $erro) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $erro;
    }
}

/**
 * Código numérico do erro do MySQL (ex.: 1062 = valor duplicado, 2002 = sem conexão).
 * O PDO guarda esse número em lugares diferentes conforme o tipo de erro.
 */
function codigoErroMysql(PDOException $erro): int
{
    if (is_array($erro->errorInfo) && isset($erro->errorInfo[1]) && is_numeric($erro->errorInfo[1])) {
        return (int) $erro->errorInfo[1];
    }
    if (is_int($erro->getCode())) {
        return $erro->getCode();
    }
    // Ex.: "SQLSTATE[HY000] [2002] Connection refused"
    if (preg_match('/\[(\d{4})\]/', $erro->getMessage(), $m)) {
        return (int) $m[1];
    }
    return 0;
}

/* ============================================================================
 *  Datas
 * ========================================================================== */

/**
 * O banco grava datas em UTC no formato "AAAA-MM-DD HH:MM:SS".
 * A API devolve em ISO 8601 com "Z" (ex.: "2026-11-17T00:36:47Z"),
 * para o navegador converter ao fuso do aluno. Igual ao toIso() do Node.
 */
function paraIso($data): ?string
{
    if ($data === null || $data === '') {
        return null;
    }
    return str_replace(' ', 'T', (string) $data) . 'Z';
}

/* ============================================================================
 *  Texto
 * ========================================================================== */

// Espaços para o PCRE: \s comum + espaços Unicode (\p{Z}) + BOM.
// Equivale ao \s do JavaScript, que também reconhece esses espaços.
const ESPACOS_REGEX = '[\s\p{Z}\x{FEFF}]';

/** Remove espaços do começo e do fim (como o trim() do JavaScript). */
function aparar(string $texto): string
{
    $resultado = preg_replace('/^' . ESPACOS_REGEX . '+|' . ESPACOS_REGEX . '+$/u', '', $texto);
    return $resultado ?? ''; // null = texto com UTF-8 inválido
}

/**
 * Tamanho do texto contado como no JavaScript (.length = unidades UTF-16).
 * Assim os limites (nome 2–80, senha 8–72...) são os mesmos da versão Node.
 */
function tamanhoJs(string $texto): int
{
    if ($texto === '') {
        return 0;
    }
    $utf16 = mb_convert_encoding($texto, 'UTF-16LE', 'UTF-8');
    return intdiv(strlen($utf16), 2);
}

/**
 * Converte um valor como o Number() do JavaScript faz (para ler ids, ano, paginação):
 * números ficam iguais, true/false viram 1/0, null vira 0, texto numérico vira número
 * e o resto vira NAN (inválido).
 */
function numeroJs($valor): float
{
    if (is_int($valor) || is_float($valor)) {
        return (float) $valor;
    }
    if (is_bool($valor)) {
        return $valor ? 1.0 : 0.0;
    }
    if ($valor === null) {
        return 0.0;
    }
    if (!is_string($valor)) {
        return NAN;
    }
    $texto = aparar($valor);
    if ($texto === '') {
        return 0.0;
    }
    if (preg_match('/^0x[0-9a-f]+$/i', $texto)) {
        return (float) hexdec(substr($texto, 2));
    }
    if (preg_match('/^0b[01]+$/i', $texto)) {
        return (float) bindec(substr($texto, 2));
    }
    if (preg_match('/^0o[0-7]+$/i', $texto)) {
        return (float) octdec(substr($texto, 2));
    }
    // Decimal com sinal, ponto e expoente opcionais (ex.: "12", "-3", "1.5", "1e2", ".5").
    if (preg_match('/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i', $texto)) {
        return (float) $texto;
    }
    return NAN;
}

/** O número é inteiro (sem casas decimais)? Como Number.isInteger(). */
function ehInteiro(float $numero): bool
{
    return is_finite($numero) && floor($numero) === $numero;
}

/**
 * Remove acentos, converte para minúsculas e junta espaços repetidos.
 * Igual ao normalizeText() do Node, mas sem depender da extensão intl:
 * os acentos saem por uma tabela de troca de letras (strtr).
 */
function normalizarTexto($valor): string
{
    $texto = is_string($valor) ? $valor : (is_scalar($valor) ? (string) $valor : '');

    // Marcações do conteúdo: x^{2} → x2, a_{n} → an, **texto** → texto
    $texto = preg_replace('/[\^_]\{([^}]*)\}/u', '$1', $texto) ?? '';
    $texto = str_replace('**', '', $texto);

    $texto = strtr($texto, MAPA_SEM_ACENTOS);
    // Acentos "soltos" (letra + sinal combinante, U+0300 a U+036F).
    $texto = preg_replace('/[\x{0300}-\x{036F}]/u', '', $texto) ?? '';

    $texto = mb_strtolower($texto, 'UTF-8');
    $texto = preg_replace('/' . ESPACOS_REGEX . '+/u', ' ', $texto) ?? '';
    return aparar($texto);
}

/** Letras acentuadas → letra sem acento (português e outras línguas latinas comuns). */
const MAPA_SEM_ACENTOS = [
    'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'ā' => 'a',
    'Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'A', 'Ā' => 'A',
    'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'ē' => 'e',
    'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E', 'Ē' => 'E',
    'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'ī' => 'i',
    'Í' => 'I', 'Ì' => 'I', 'Î' => 'I', 'Ï' => 'I', 'Ī' => 'I',
    'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ō' => 'o',
    'Ó' => 'O', 'Ò' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O', 'Ō' => 'O',
    'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ū' => 'u',
    'Ú' => 'U', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U', 'Ū' => 'U',
    'ç' => 'c', 'Ç' => 'C',
    'ñ' => 'n', 'Ñ' => 'N',
    'ý' => 'y', 'ÿ' => 'y', 'Ý' => 'Y',
];

/** Escapa os curingas do LIKE (% e _) para que sejam tratados como texto. */
function escaparLike(string $valor): string
{
    return strtr($valor, ['\\' => '\\\\', '%' => '\\%', '_' => '\\_']);
}

/* ============================================================================
 *  Leitura de parâmetros da URL (equivale a utils/params.js)
 * ========================================================================== */

/**
 * O filtro da query string foi informado? (como "if (req.query.x)" no Node:
 * ausente ou vazio = não informado; "0" conta como informado).
 */
function valorInformado($valor): bool
{
    return $valor !== null && $valor !== '' && $valor !== [];
}

/** Lê um identificador numérico positivo (ex.: :id da URL ou campo do corpo). */
function lerId($valor, string $campo = 'id'): int
{
    $numero = numeroJs($valor);
    if (!ehInteiro($numero) || $numero <= 0 || $numero > 9007199254740991) {
        throw erroValidacao('Identificador inválido.', [$campo => 'Deve ser um número inteiro positivo.']);
    }
    return (int) $numero;
}

/** Lê o slug de um assunto/matéria (apenas letras minúsculas, números e hífen). */
function lerSlug($valor, string $campo = 'slug'): string
{
    $slug = is_string($valor) ? $valor : (is_int($valor) ? (string) $valor : '');
    if (!preg_match('/^[a-z0-9-]{1,80}$/D', $slug)) {
        throw erroValidacao('Endereço do conteúdo inválido.', [$campo => 'Formato inválido.']);
    }
    return $slug;
}

/** Lê o ano escolar opcional da query string (?year=1). */
function lerAnoOpcional($valor): ?int
{
    if ($valor === null || $valor === '') {
        return null;
    }
    $ano = numeroJs($valor);
    if (!in_array($ano, [1.0, 2.0, 3.0], true)) {
        throw erroValidacao('Ano escolar inválido.', ['year' => 'Use 1, 2 ou 3.']);
    }
    return (int) $ano;
}

/** Lê limit/offset de paginação com valores padrão seguros. */
function lerPaginacao(array $query, int $limitePadrao = 20, int $limiteMaximo = 50): array
{
    $limite = array_key_exists('limit', $query) ? numeroJs($query['limit']) : (float) $limitePadrao;
    $inicio = array_key_exists('offset', $query) ? numeroJs($query['offset']) : 0.0;
    if (!ehInteiro($limite) || $limite < 1 || $limite > $limiteMaximo) {
        throw erroValidacao('Paginação inválida.', ['limit' => "Use um número de 1 a {$limiteMaximo}."]);
    }
    if (!ehInteiro($inicio) || $inicio < 0) {
        throw erroValidacao('Paginação inválida.', ['offset' => 'Use um número maior ou igual a 0.']);
    }
    return ['limit' => (int) $limite, 'offset' => (int) $inicio];
}

/* ============================================================================
 *  Validação do corpo (equivale a utils/validate.js)
 *  Cada função recebe o valor bruto, devolve o valor limpo e, se houver
 *  problema, grava a mensagem em $erros[campo].
 * ========================================================================== */

function lerNome($valor, array &$erros, string $campo = 'name'): string
{
    $nome = is_string($valor) ? aparar(preg_replace('/' . ESPACOS_REGEX . '+/u', ' ', $valor) ?? '') : '';
    $tamanho = tamanhoJs($nome);
    if ($tamanho < 2 || $tamanho > 80) {
        $erros[$campo] = 'Informe um nome entre 2 e 80 caracteres.';
    }
    return $nome;
}

function lerEmail($valor, array &$erros, string $campo = 'email'): string
{
    $email = is_string($valor) ? mb_strtolower(aparar($valor), 'UTF-8') : '';
    $semEspaco = '[^\s\p{Z}\x{FEFF}@]+';
    $valido = preg_match('/^' . $semEspaco . '@' . $semEspaco . '\.' . $semEspaco . '$/Du', $email) === 1;
    if (!$valido || tamanhoJs($email) > 120) {
        $erros[$campo] = 'Informe um e-mail válido.';
    }
    return $email;
}

function lerNovaSenha($valor, array &$erros, string $campo = 'password'): string
{
    $senha = is_string($valor) ? $valor : '';
    $tamanho = tamanhoJs($senha);
    if ($tamanho < 8 || $tamanho > 72) {
        $erros[$campo] = 'A senha deve ter entre 8 e 72 caracteres.';
    }
    return $senha;
}

/**
 * Ano escolar é opcional: a plataforma é aberta a qualquer pessoa.
 * null, "" ou ausente = "não informado". Se informado, precisa ser 1, 2 ou 3.
 */
function lerAnoEscolarOpcional($valor, array &$erros, string $campo = 'schoolYear'): ?int
{
    if ($valor === null || $valor === '') {
        return null;
    }
    $ano = numeroJs($valor);
    if (!ehInteiro($ano) || $ano < 1 || $ano > 3) {
        $erros[$campo] = 'Escolha o 1º, 2º ou 3º ano, ou deixe sem informar.';
        return null;
    }
    return (int) $ano;
}

/** Lança erro 400 com os detalhes por campo, se houver algum erro. */
function exigirValido(array $erros): void
{
    if (count($erros) > 0) {
        throw erroValidacao('Verifique os campos destacados.', $erros);
    }
}
