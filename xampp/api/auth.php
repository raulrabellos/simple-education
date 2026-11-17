<?php
/*
 * Autenticação: sessão (cookie + tabela sessions), senhas, limite de login
 * e as rotas /auth/register, /auth/login, /auth/logout, /auth/session e /auth/me.
 *
 * Equivale a services/sessionService.js, services/userService.js (parte de login),
 * middlewares/auth.js, middlewares/loginLimiter.js e routes/auth.js do Node.
 *
 * Não usa session_start(): a sessão fica na tabela "sessions", como na versão Node.
 * O navegador guarda só um token aleatório no cookie; o banco guarda só o
 * hash SHA-256 desse token. Quem visse o banco não conseguiria usar a sessão.
 */

declare(strict_types=1);

// Hash bcrypt fixo usado quando o e-mail não existe: password_verify gasta o mesmo
// tempo, então o tempo de resposta não revela quais e-mails estão cadastrados.
const HASH_FICTICIO = '$2y$10$D/C7AyTpSpwlXkMnfmj1lOhCkLOELpXedWejudbETIeUs3g/eAZB6';

/* ============================================================================
 *  Sessão
 * ========================================================================== */

function hashDoToken(string $token): string
{
    return hash('sha256', $token);
}

/** Cria uma sessão no banco e devolve o token puro (que vai só para o cookie). */
function criarSessao(PDO $db, int $usuarioId): string
{
    $token = bin2hex(random_bytes(32));
    executarSql(
        $db,
        'INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))',
        [hashDoToken($token), $usuarioId, SESSION_DAYS]
    );
    return $token;
}

/** Usuário dono de uma sessão válida (não vencida), ou null. */
function usuarioDaSessao(PDO $db, ?string $token): ?array
{
    if ($token === null || $token === '') {
        return null;
    }
    return buscarUma(
        $db,
        'SELECT u.id, u.name, u.email, u.school_year
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.id_hash = ? AND s.expires_at > CURRENT_TIMESTAMP',
        [hashDoToken($token)]
    );
}

function apagarSessao(PDO $db, ?string $token): void
{
    if ($token === null || $token === '') {
        return;
    }
    executarSql($db, 'DELETE FROM sessions WHERE id_hash = ?', [hashDoToken($token)]);
}

/** Remove as sessões vencidas (faxina barata, feita no login e no cadastro). */
function apagarSessoesVencidas(PDO $db): void
{
    executarSql($db, 'DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
}

/**
 * Opções do cookie de sessão: HttpOnly (o JavaScript da página não lê),
 * SameSite=Lax (não vai em formulários de outros sites) e Path=/.
 * Secure fica desligado porque o XAMPP roda em http://localhost
 * (com Secure, o navegador descartaria o cookie).
 */
function opcoesDoCookie(int $expira): array
{
    return [
        'expires'  => $expira,
        'path'     => '/',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

/** Cria a sessão e envia o cookie (validade de SESSION_DAYS dias). */
function iniciarSessao(PDO $db, int $usuarioId): void
{
    $token = criarSessao($db, $usuarioId);
    setcookie(SESSION_COOKIE_NAME, $token, opcoesDoCookie(time() + SESSION_DAYS * 24 * 60 * 60));
}

/** Apaga o cookie no navegador (data no passado). */
function apagarCookieDeSessao(): void
{
    setcookie(SESSION_COOKIE_NAME, '', opcoesDoCookie(1));
}

/** Bloqueia a rota para quem não está logado (401). */
function exigirLogin(Requisicao $req): array
{
    if ($req->usuario === null) {
        throw naoAutorizado();
    }
    return $req->usuario;
}

/** Formato público do usuário (nunca inclui o hash da senha). */
function usuarioPublico(array $linha): array
{
    return [
        'id' => (int) $linha['id'],
        'name' => $linha['name'],
        'email' => $linha['email'],
        'schoolYear' => $linha['school_year'] === null ? null : (int) $linha['school_year'],
    ];
}

/* ============================================================================
 *  Limite de tentativas de login (tabela login_attempts)
 *  O PHP não guarda nada na memória entre requisições, então os erros de login
 *  ficam no banco: um registro por erro, por IP + e-mail.
 * ========================================================================== */

/** E-mail usado como chave do limite (até 120 caracteres, o tamanho da coluna). */
function chaveEmailDoLimite(array $corpo): string
{
    $email = isset($corpo['email']) && is_scalar($corpo['email']) ? (string) $corpo['email'] : '';
    return mb_substr(mb_strtolower(aparar($email), 'UTF-8'), 0, 120, 'UTF-8');
}

/**
 * Responde 429 (com Retry-After em segundos) se já houve LOGIN_MAX_ATTEMPTS erros
 * na janela de LOGIN_WINDOW_MINUTES minutos para este IP + e-mail.
 */
function verificarLimiteDeLogin(PDO $db, string $ip, string $email): void
{
    // Faxina: erros mais antigos que a janela já não contam.
    executarSql(
        $db,
        'DELETE FROM login_attempts WHERE attempted_at <= CURRENT_TIMESTAMP - INTERVAL ? MINUTE',
        [LOGIN_WINDOW_MINUTES]
    );

    $situacao = buscarUma(
        $db,
        'SELECT COUNT(*) AS erros,
                TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP, MIN(attempted_at) + INTERVAL ? MINUTE) AS segundos
         FROM login_attempts
         WHERE ip = ? AND email = ? AND attempted_at > CURRENT_TIMESTAMP - INTERVAL ? MINUTE',
        [LOGIN_WINDOW_MINUTES, $ip, $email, LOGIN_WINDOW_MINUTES]
    );

    if ((int) $situacao['erros'] >= LOGIN_MAX_ATTEMPTS) {
        // Libera quando o erro mais antigo da janela "vence".
        $segundos = max(1, (int) $situacao['segundos']);
        throw new HttpErro(
            429,
            'TOO_MANY_ATTEMPTS',
            'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
            null,
            ['Retry-After' => (string) $segundos]
        );
    }
}

function registrarErroDeLogin(PDO $db, string $ip, string $email): void
{
    executarSql($db, 'INSERT INTO login_attempts (ip, email) VALUES (?, ?)', [$ip, $email]);
}

/** Login certo: zera os erros deste IP + e-mail. */
function limparErrosDeLogin(PDO $db, string $ip, string $email): void
{
    executarSql($db, 'DELETE FROM login_attempts WHERE ip = ? AND email = ?', [$ip, $email]);
}

/* ============================================================================
 *  Usuários (cadastro e conferência da senha)
 * ========================================================================== */

function buscarUsuarioPorId(PDO $db, int $id): ?array
{
    return buscarUma($db, 'SELECT id, name, email, school_year FROM users WHERE id = ?', [$id]);
}

function cadastrarUsuario(PDO $db, string $nome, string $email, string $senha, ?int $anoEscolar): array
{
    $emailRepetido = fn () => conflito('Este e-mail já está cadastrado.');

    if (buscarUma($db, 'SELECT 1 FROM users WHERE email = ?', [$email]) !== null) {
        throw $emailRepetido();
    }

    try {
        executarSql(
            $db,
            'INSERT INTO users (name, email, password_hash, school_year) VALUES (?, ?, ?, ?)',
            [$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $anoEscolar]
        );
    } catch (PDOException $erro) {
        // Proteção contra dois cadastros simultâneos com o mesmo e-mail.
        if (codigoErroMysql($erro) === 1062) {
            throw $emailRepetido();
        }
        throw $erro;
    }
    return buscarUsuarioPorId($db, (int) $db->lastInsertId());
}

/** Retorna o usuário se e-mail e senha conferem; caso contrário, null. */
function autenticar(PDO $db, string $email, string $senha): ?array
{
    $linha = buscarUma(
        $db,
        'SELECT id, name, email, school_year, password_hash FROM users WHERE email = ?',
        [$email]
    );
    // Mesmo sem usuário, confere um hash: o tempo de resposta não revela se o e-mail existe.
    $confere = password_verify($senha, $linha !== null ? $linha['password_hash'] : HASH_FICTICIO);
    if ($linha === null || !$confere) {
        return null;
    }
    unset($linha['password_hash']);
    return $linha;
}

/* ============================================================================
 *  Rotas /auth/...
 * ========================================================================== */

/** POST /auth/register — cadastra o aluno e já inicia a sessão. */
function rotaCadastro(PDO $db, Requisicao $req): array
{
    $corpo = $req->corpo;
    $erros = [];
    $nome = lerNome($corpo['name'] ?? null, $erros);
    $email = lerEmail($corpo['email'] ?? null, $erros);
    $senha = lerNovaSenha($corpo['password'] ?? null, $erros);
    $ano = lerAnoEscolarOpcional($corpo['schoolYear'] ?? null, $erros);
    exigirValido($erros);

    $usuario = cadastrarUsuario($db, $nome, $email, $senha, $ano);
    apagarSessoesVencidas($db);
    iniciarSessao($db, (int) $usuario['id']);
    return [201, ['user' => usuarioPublico($usuario)]];
}

/** POST /auth/login */
function rotaLogin(PDO $db, Requisicao $req): array
{
    $chaveEmail = chaveEmailDoLimite($req->corpo);
    verificarLimiteDeLogin($db, $req->ip, $chaveEmail);

    $email = is_string($req->corpo['email'] ?? null) ? mb_strtolower(aparar($req->corpo['email']), 'UTF-8') : '';
    $senha = is_string($req->corpo['password'] ?? null) ? $req->corpo['password'] : '';
    if ($email === '' || $senha === '') {
        throw new HttpErro(400, 'VALIDATION_ERROR', 'Informe e-mail e senha.');
    }

    $usuario = autenticar($db, $email, $senha);
    if ($usuario === null) {
        registrarErroDeLogin($db, $req->ip, $chaveEmail);
        throw new HttpErro(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    limparErrosDeLogin($db, $req->ip, $chaveEmail);
    apagarSessoesVencidas($db);
    // Se já havia uma sessão neste navegador, encerra antes de criar a nova.
    apagarSessao($db, $req->tokenSessao);
    iniciarSessao($db, (int) $usuario['id']);
    return [200, ['user' => usuarioPublico($usuario)]];
}

/** POST /auth/logout — apaga a sessão no banco e o cookie no navegador. */
function rotaLogout(PDO $db, Requisicao $req): array
{
    apagarSessao($db, $req->tokenSessao);
    apagarCookieDeSessao();
    return [204, null];
}

/**
 * GET /auth/session — consulta pública da sessão: sempre 200.
 * { "user": null } significa "não está logado".
 */
function rotaSessao(PDO $db, Requisicao $req): array
{
    return [200, ['user' => $req->usuario !== null ? usuarioPublico($req->usuario) : null]];
}

/** GET /auth/me — devolve o aluno logado (401 sem sessão). */
function rotaEu(PDO $db, Requisicao $req): array
{
    return [200, ['user' => usuarioPublico(exigirLogin($req))]];
}
