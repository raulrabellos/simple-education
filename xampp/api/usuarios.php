<?php
/*
 * Perfil do aluno: PATCH /users/me.
 * Equivale a routes/users.js e updateUser() de services/userService.js do Node.
 *
 * O aluno é sempre o da sessão: não existe rota que receba id de usuário.
 */

declare(strict_types=1);

/** Campos que o aluno pode alterar no próprio perfil. */
const CAMPOS_PERMITIDOS_PERFIL = ['name', 'schoolYear'];

/** PATCH /users/me — altera nome e/ou ano escolar do aluno logado. */
function rotaAtualizarPerfil(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $corpo = $req->corpo;

    // Qualquer outro campo (id, email, password...) é recusado.
    $desconhecidos = [];
    foreach (array_keys($corpo) as $campo) {
        if (!in_array((string) $campo, CAMPOS_PERMITIDOS_PERFIL, true)) {
            $desconhecidos[(string) $campo] = 'Campo não permitido.';
        }
    }
    if (count($desconhecidos) > 0) {
        throw erroValidacao('Só é possível alterar nome e ano escolar.', $desconhecidos);
    }

    $temNome = array_key_exists('name', $corpo);
    $temAno = array_key_exists('schoolYear', $corpo);
    if (!$temNome && !$temAno) {
        throw erroValidacao('Informe o nome e/ou o ano escolar.');
    }

    $erros = [];
    $alteracoes = [];
    $valores = [];
    if ($temNome) {
        $alteracoes[] = 'name = ?';
        $valores[] = lerNome($corpo['name'], $erros);
    }
    if ($temAno) {
        // schoolYear: null remove o ano.
        $alteracoes[] = 'school_year = ?';
        $valores[] = lerAnoEscolarOpcional($corpo['schoolYear'], $erros);
    }
    exigirValido($erros);

    $valores[] = (int) $usuario['id'];
    executarSql($db, 'UPDATE users SET ' . implode(', ', $alteracoes) . ' WHERE id = ?', $valores);

    return [200, ['user' => usuarioPublico(buscarUsuarioPorId($db, (int) $usuario['id']))]];
}
