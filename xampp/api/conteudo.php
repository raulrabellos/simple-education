<?php
/*
 * Conteúdos: matérias, assuntos (aulas), conclusão de aula e pesquisa.
 * Equivale a services/contentService.js e routes/content.js do Node.
 *
 * A página da aula NUNCA leva questões nem gabarito: as questões só saem
 * ao iniciar uma tentativa (tentativas.php), e sem a alternativa correta.
 */

declare(strict_types=1);

/** Colunas do resumo de um assunto (usado em várias consultas). */
const COLUNAS_ASSUNTO = '
  t.id, t.slug, t.title, t.summary, t.school_year, t.position,
  s.slug AS subject_slug, s.name AS subject_name,
  (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.active = 1) AS question_count
';

/** Formato público do resumo de um assunto, com o progresso do aluno. */
function resumoDoAssunto(array $linha, array $mapaProgresso): array
{
    return [
        'slug' => $linha['slug'],
        'title' => $linha['title'],
        'summary' => $linha['summary'],
        'schoolYear' => (int) $linha['school_year'],
        'subject' => ['slug' => $linha['subject_slug'], 'name' => $linha['subject_name']],
        'questionCount' => (int) $linha['question_count'],
        'progress' => progressoDe($mapaProgresso, (int) $linha['id']),
    ];
}

/** Id interno de um assunto pelo slug (404 se não existir). */
function idDoAssunto(PDO $db, string $slug): int
{
    $id = buscarValor($db, 'SELECT id FROM topics WHERE slug = ?', [$slug]);
    if (!$id) {
        throw naoEncontrado('Assunto não encontrado.');
    }
    return (int) $id;
}

/** GET /subjects — cards da página inicial (ex.: "Matemática"). */
function rotaListarMaterias(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $progresso = mapaDeProgresso($db, (int) $usuario['id']);
    $materias = buscarTodas($db, 'SELECT id, slug, name, description FROM subjects ORDER BY position, name');
    $assuntos = buscarTodas($db, 'SELECT id, subject_id FROM topics');

    $lista = [];
    foreach ($materias as $m) {
        $ids = [];
        foreach ($assuntos as $t) {
            if ((int) $t['subject_id'] === (int) $m['id']) {
                $ids[] = (int) $t['id'];
            }
        }
        $concluidos = 0;
        foreach ($ids as $id) {
            if (progressoDe($progresso, $id)['status'] === 'completed') {
                $concluidos++;
            }
        }
        $lista[] = [
            'slug' => $m['slug'],
            'name' => $m['name'],
            'description' => $m['description'],
            'topicCount' => count($ids),
            'topicsCompleted' => $concluidos,
        ];
    }
    return [200, ['subjects' => $lista]];
}

/** GET /subjects/{slug} — matéria com os assuntos agrupados por ano (tela "Conteúdos"). */
function rotaVerMateria(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $slug = lerSlug($req->parametros['slug']);

    $materia = buscarUma($db, 'SELECT id, slug, name, description FROM subjects WHERE slug = ?', [$slug]);
    if ($materia === null) {
        throw naoEncontrado('Matéria não encontrada.');
    }

    $progresso = mapaDeProgresso($db, (int) $usuario['id']);
    $linhas = buscarTodas($db, '
        SELECT ' . COLUNAS_ASSUNTO . '
        FROM topics t JOIN subjects s ON s.id = t.subject_id
        WHERE t.subject_id = ? ORDER BY t.school_year, t.position
    ', [(int) $materia['id']]);

    $anos = [];
    foreach ([1, 2, 3] as $ano) {
        $assuntosDoAno = [];
        foreach ($linhas as $linha) {
            if ((int) $linha['school_year'] === $ano) {
                $assuntosDoAno[] = resumoDoAssunto($linha, $progresso);
            }
        }
        $anos[] = ['schoolYear' => $ano, 'topics' => $assuntosDoAno];
    }

    return [200, ['subject' => [
        'slug' => $materia['slug'],
        'name' => $materia['name'],
        'description' => $materia['description'],
        'years' => $anos,
    ]]];
}

/** GET /topics?year=1&subject=matematica — lista assuntos com filtros opcionais. */
function rotaListarAssuntos(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $ano = lerAnoOpcional($req->query['year'] ?? null);
    $materia = valorInformado($req->query['subject'] ?? null) ? lerSlug($req->query['subject'], 'subject') : null;

    $condicoes = [];
    $valores = [];
    if ($ano !== null) {
        $condicoes[] = 't.school_year = ?';
        $valores[] = $ano;
    }
    if ($materia !== null) {
        $condicoes[] = 's.slug = ?';
        $valores[] = $materia;
    }
    $where = count($condicoes) > 0 ? 'WHERE ' . implode(' AND ', $condicoes) : '';

    $progresso = mapaDeProgresso($db, (int) $usuario['id']);
    $linhas = buscarTodas($db, '
        SELECT ' . COLUNAS_ASSUNTO . '
        FROM topics t JOIN subjects s ON s.id = t.subject_id
        ' . $where . '
        ORDER BY s.position, t.school_year, t.position
    ', $valores);

    return [200, ['topics' => array_map(fn ($l) => resumoDoAssunto($l, $progresso), $linhas)]];
}

/** GET /topics/{slug} — página de estudo (aula): assunto + seções. Sem questões e sem gabarito. */
function rotaVerAssunto(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $slug = lerSlug($req->parametros['slug']);

    $linha = buscarUma($db, '
        SELECT ' . COLUNAS_ASSUNTO . ', t.objective
        FROM topics t JOIN subjects s ON s.id = t.subject_id
        WHERE t.slug = ?
    ', [$slug]);
    if ($linha === null) {
        throw naoEncontrado('Assunto não encontrado.');
    }

    $secoes = buscarTodas(
        $db,
        'SELECT kind, title, body FROM topic_sections WHERE topic_id = ? ORDER BY position',
        [(int) $linha['id']]
    );

    $assunto = resumoDoAssunto($linha, mapaDeProgresso($db, (int) $usuario['id']));
    $assunto['objective'] = $linha['objective'] ?? '';
    $assunto['sections'] = $secoes;
    return [200, ['topic' => $assunto]];
}

/** PUT /topics/{slug}/completion — marca a aula como concluída (idempotente: não muda a data). */
function rotaMarcarAulaConcluida(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $topicId = idDoAssunto($db, lerSlug($req->parametros['slug']));
    $usuarioId = (int) $usuario['id'];

    executarSql(
        $db,
        'INSERT INTO lesson_completions (user_id, topic_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE topic_id = topic_id',
        [$usuarioId, $topicId]
    );
    return [200, ['progress' => progressoDe(mapaDeProgresso($db, $usuarioId), $topicId)]];
}

/** DELETE /topics/{slug}/completion — desfaz a marcação (não afeta tentativas nem respostas). */
function rotaDesmarcarAulaConcluida(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $topicId = idDoAssunto($db, lerSlug($req->parametros['slug']));
    $usuarioId = (int) $usuario['id'];

    executarSql($db, 'DELETE FROM lesson_completions WHERE user_id = ? AND topic_id = ?', [$usuarioId, $topicId]);
    return [200, ['progress' => progressoDe(mapaDeProgresso($db, $usuarioId), $topicId)]];
}

/**
 * GET /search?q=funcao — pesquisa por título, resumo e texto das aulas,
 * ignorando acentos e maiúsculas. Cada palavra digitada precisa aparecer
 * (busca do tipo "E"). A coluna search_text já vem sem acentos e em minúsculas.
 */
function rotaPesquisar(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $bruto = isset($req->query['q']) && is_string($req->query['q']) ? $req->query['q'] : '';

    $busca = normalizarTexto($bruto);
    $tamanho = tamanhoJs($busca);
    if ($tamanho < 2 || $tamanho > 100) {
        throw erroValidacao('Digite de 2 a 100 caracteres para pesquisar.', ['q' => 'Tamanho inválido.']);
    }

    // Até 6 palavras diferentes.
    $palavras = array_slice(array_values(array_unique(explode(' ', $busca))), 0, 6);
    // No MySQL, a barra invertida é o caractere de escape padrão do LIKE.
    $condicoes = implode(' AND ', array_fill(0, count($palavras), 't.search_text LIKE ?'));
    $valores = array_map(fn ($p) => '%' . escaparLike($p) . '%', $palavras);

    $progresso = mapaDeProgresso($db, (int) $usuario['id']);
    $linhas = buscarTodas($db, '
        SELECT ' . COLUNAS_ASSUNTO . '
        FROM topics t JOIN subjects s ON s.id = t.subject_id
        WHERE ' . $condicoes . '
        ORDER BY t.school_year, t.position
    ', $valores);

    // Relevância: termo no título > termo no resumo > termo só no texto da aula.
    // Empates mantêm a ordem por ano (o usort do PHP 8 é estável).
    $relevancia = function (array $linha) use ($busca): int {
        if (str_contains(normalizarTexto($linha['title']), $busca)) {
            return 3;
        }
        if (str_contains(normalizarTexto($linha['summary']), $busca)) {
            return 2;
        }
        return 1;
    };
    usort($linhas, fn ($a, $b) => $relevancia($b) <=> $relevancia($a));

    return [200, [
        'query' => aparar($bruto),
        'total' => count($linhas),
        'results' => array_map(fn ($l) => resumoDoAssunto($l, $progresso), $linhas),
    ]];
}
