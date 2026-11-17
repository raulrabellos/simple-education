<?php
/*
 * Progresso do aluno e a rota GET /progress.
 * Equivale a services/progressService.js do Node.
 *
 * Regras de progresso do Simple Education
 * ----------------------------------------
 * - Aula concluída: o aluno marcou, na página do assunto, que estudou o conteúdo.
 *   É uma ação explícita e independe dos exercícios.
 * - Exercício respondido: existe uma resposta registrada para a questão em uma tentativa.
 * - Exercício acertado: a resposta registrada é a alternativa correta (verificado no servidor).
 * - Tentativa finalizada: o aluno encerrou a tentativa. Só tentativas finalizadas
 *   contam para a nota. Nota = acertos / total de questões da tentativa
 *   (questões não respondidas contam como não acertadas).
 * - Assunto dominado: melhor nota entre as tentativas finalizadas >= LIMITE_DOMINIO.
 * - Status do assunto:
 *     not_started  → sem aula concluída e sem nenhuma tentativa;
 *     completed    → aula concluída E assunto dominado;
 *     in_progress  → qualquer outra situação.
 */

declare(strict_types=1);

/** Nota mínima (%) para o assunto ser considerado dominado (MASTERY_THRESHOLD no Node). */
const LIMITE_DOMINIO = 70;

/** Nota em % arredondada (0 se não houver questões). */
function notaPercentual(int $acertos, int $total): int
{
    return $total > 0 ? (int) round(($acertos * 100) / $total) : 0;
}

function progressoVazio(): array
{
    return [
        'status' => 'not_started',
        'lessonCompleted' => false,
        'lessonCompletedAt' => null,
        'attemptsStarted' => 0,
        'attemptsFinished' => 0,
        'questionsAnswered' => 0,
        'correctAnswers' => 0,
        'bestScore' => null,
        'lastScore' => null,
        'mastered' => false,
        'lastActivityAt' => null,
    ];
}

/** Calcula "dominado" e o status, e converte as datas para ISO 8601. */
function finalizarProgresso(array $p): array
{
    $p['mastered'] = $p['bestScore'] !== null && $p['bestScore'] >= LIMITE_DOMINIO;
    if ($p['lessonCompleted'] && $p['mastered']) {
        $p['status'] = 'completed';
    } elseif ($p['lessonCompleted'] || $p['attemptsStarted'] > 0) {
        $p['status'] = 'in_progress';
    } else {
        $p['status'] = 'not_started';
    }
    $p['lessonCompletedAt'] = paraIso($p['lessonCompletedAt']);
    $p['lastActivityAt'] = paraIso($p['lastActivityAt']);
    return $p;
}

/** A mais recente de duas datas "AAAA-MM-DD HH:MM:SS" (null conta como ausente). */
function maisRecente(?string $a, ?string $b): ?string
{
    if ($a === null) {
        return $b;
    }
    if ($b === null) {
        return $a;
    }
    return strcmp($a, $b) > 0 ? $a : $b;
}

/**
 * Monta um mapa topicId → progresso do aluno, usando apenas dados do próprio aluno.
 * Assuntos sem nenhuma atividade não aparecem no mapa (use progressoDe()).
 */
function mapaDeProgresso(PDO $db, int $usuarioId): array
{
    $mapa = [];
    $pegar = function (int $topicId) use (&$mapa): void {
        if (!isset($mapa[$topicId])) {
            $mapa[$topicId] = progressoVazio();
        }
    };

    // Aulas concluídas.
    foreach (buscarTodas($db, 'SELECT topic_id, completed_at FROM lesson_completions WHERE user_id = ?', [$usuarioId]) as $linha) {
        $id = (int) $linha['topic_id'];
        $pegar($id);
        $mapa[$id]['lessonCompleted'] = true;
        $mapa[$id]['lessonCompletedAt'] = $linha['completed_at'];
        $mapa[$id]['lastActivityAt'] = maisRecente($mapa[$id]['lastActivityAt'], $linha['completed_at']);
    }

    // Tentativas: iniciadas, finalizadas, melhor nota e última atividade.
    $sql = 'SELECT topic_id,
                   COUNT(*) AS started,
                   SUM(finished_at IS NOT NULL) AS finished,
                   MAX(CASE WHEN finished_at IS NOT NULL
                            THEN ROUND(correct_count * 100.0 / total_questions) END) AS best,
                   MAX(COALESCE(finished_at, started_at)) AS last_activity
            FROM attempts WHERE user_id = ? GROUP BY topic_id';
    foreach (buscarTodas($db, $sql, [$usuarioId]) as $linha) {
        $id = (int) $linha['topic_id'];
        $pegar($id);
        $mapa[$id]['attemptsStarted'] = (int) $linha['started'];
        $mapa[$id]['attemptsFinished'] = (int) $linha['finished'];
        $mapa[$id]['bestScore'] = $linha['best'] === null ? null : (int) round((float) $linha['best']);
        $mapa[$id]['lastActivityAt'] = maisRecente($mapa[$id]['lastActivityAt'], $linha['last_activity']);
    }

    // Nota da última tentativa finalizada de cada assunto.
    $sql = 'SELECT a.topic_id, a.correct_count, a.total_questions
            FROM attempts a
            WHERE a.user_id = ? AND a.finished_at IS NOT NULL
              AND a.id = (SELECT b.id FROM attempts b
                          WHERE b.user_id = a.user_id AND b.topic_id = a.topic_id AND b.finished_at IS NOT NULL
                          ORDER BY b.finished_at DESC, b.id DESC LIMIT 1)';
    foreach (buscarTodas($db, $sql, [$usuarioId]) as $linha) {
        $id = (int) $linha['topic_id'];
        $pegar($id);
        $mapa[$id]['lastScore'] = notaPercentual((int) $linha['correct_count'], (int) $linha['total_questions']);
    }

    // Questões respondidas e acertadas.
    $sql = 'SELECT a.topic_id, COUNT(*) AS answered, SUM(aa.is_correct) AS correct, MAX(aa.answered_at) AS last_answer
            FROM attempt_answers aa JOIN attempts a ON a.id = aa.attempt_id
            WHERE a.user_id = ? GROUP BY a.topic_id';
    foreach (buscarTodas($db, $sql, [$usuarioId]) as $linha) {
        $id = (int) $linha['topic_id'];
        $pegar($id);
        $mapa[$id]['questionsAnswered'] = (int) $linha['answered'];
        $mapa[$id]['correctAnswers'] = (int) $linha['correct'];
        $mapa[$id]['lastActivityAt'] = maisRecente($mapa[$id]['lastActivityAt'], $linha['last_answer']);
    }

    foreach ($mapa as $id => $p) {
        $mapa[$id] = finalizarProgresso($p);
    }
    return $mapa;
}

/** Progresso de um assunto (o padrão "não iniciado" se não houver dados). */
function progressoDe(array $mapa, int $topicId): array
{
    return $mapa[$topicId] ?? finalizarProgresso(progressoVazio());
}

/** GET /progress — resumo geral, por ano e por assunto (tela "Meu progresso"). */
function rotaProgresso(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $mapa = mapaDeProgresso($db, (int) $usuario['id']);
    $assuntos = buscarTodas($db, '
        SELECT t.id, t.slug, t.title, t.school_year, s.slug AS subject_slug, s.name AS subject_name
        FROM topics t JOIN subjects s ON s.id = t.subject_id
        ORDER BY s.position, t.school_year, t.position
    ');

    $zerado = [
        'topicsTotal' => 0, 'lessonsCompleted' => 0, 'topicsMastered' => 0, 'topicsCompleted' => 0,
        'attemptsFinished' => 0, 'questionsAnswered' => 0, 'correctAnswers' => 0, 'wrongAnswers' => 0, 'accuracy' => null,
    ];
    $totais = $zerado;
    $porAno = [1 => $zerado, 2 => $zerado, 3 => $zerado];

    // Soma o progresso de um assunto num grupo (total geral ou de um ano).
    $somar = function (array &$grupo, array $p): void {
        $grupo['topicsTotal'] += 1;
        $grupo['lessonsCompleted'] += $p['lessonCompleted'] ? 1 : 0;
        $grupo['topicsMastered'] += $p['mastered'] ? 1 : 0;
        $grupo['topicsCompleted'] += $p['status'] === 'completed' ? 1 : 0;
        $grupo['attemptsFinished'] += $p['attemptsFinished'];
        $grupo['questionsAnswered'] += $p['questionsAnswered'];
        $grupo['correctAnswers'] += $p['correctAnswers'];
    };

    $itens = [];
    foreach ($assuntos as $t) {
        $p = progressoDe($mapa, (int) $t['id']);
        $ano = (int) $t['school_year'];
        $somar($totais, $p);
        if (isset($porAno[$ano])) {
            $somar($porAno[$ano], $p);
        }
        $itens[] = [
            'topic' => [
                'slug' => $t['slug'],
                'title' => $t['title'],
                'schoolYear' => $ano,
                'subject' => ['slug' => $t['subject_slug'], 'name' => $t['subject_name']],
            ],
            'progress' => $p,
        ];
    }

    // Erros e aproveitamento (acertos ÷ respondidas, em %; null se nada foi respondido).
    $fecharGrupo = function (array $grupo): array {
        $grupo['wrongAnswers'] = $grupo['questionsAnswered'] - $grupo['correctAnswers'];
        $grupo['accuracy'] = $grupo['questionsAnswered'] > 0
            ? notaPercentual($grupo['correctAnswers'], $grupo['questionsAnswered'])
            : null;
        return $grupo;
    };
    $totais = $fecharGrupo($totais);

    $listaPorAno = [];
    foreach ([1, 2, 3] as $ano) {
        $listaPorAno[] = array_merge(['schoolYear' => $ano], $fecharGrupo($porAno[$ano]));
    }

    // "Continuar estudando": assunto em andamento com a atividade mais recente.
    $emAndamento = array_values(array_filter($itens, fn ($i) => $i['progress']['status'] === 'in_progress'));
    usort($emAndamento, fn ($a, $b) => strcmp(
        (string) ($b['progress']['lastActivityAt'] ?? ''),
        (string) ($a['progress']['lastActivityAt'] ?? '')
    ));
    $continuar = $emAndamento[0]['topic'] ?? null;

    return [200, [
        'masteryThreshold' => LIMITE_DOMINIO,
        'totals' => $totais,
        'byYear' => $listaPorAno,
        'topics' => $itens,
        'continueStudying' => $continuar,
    ]];
}
