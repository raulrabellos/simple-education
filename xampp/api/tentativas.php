<?php
/*
 * Exercícios: tentativas, respostas, finalização, detalhe e histórico.
 * Equivale a services/attemptService.js e routes/attempts.js do Node.
 *
 * Regras de segurança das tentativas:
 * - O aluno é identificado SOMENTE pela sessão, nunca por dado enviado pela tela.
 * - Toda busca de tentativa filtra por user_id: a tentativa de outro aluno responde 404.
 * - O gabarito (alternativa correta) e a explicação só saem do servidor
 *   para questões que o aluno já respondeu naquela tentativa.
 * - Acertos e nota são calculados aqui; a tela envia apenas a alternativa escolhida.
 * - Cada tentativa é um registro novo: repetir os exercícios preserva o histórico anterior.
 */

declare(strict_types=1);

const COLUNAS_TENTATIVA = '
  a.id, a.user_id, a.topic_id, a.started_at, a.finished_at, a.total_questions, a.correct_count,
  t.slug AS topic_slug, t.title AS topic_title, t.school_year,
  (SELECT COUNT(*) FROM attempt_answers aa WHERE aa.attempt_id = a.id) AS answered
';

function tentativaJaFinalizada(): HttpErro
{
    return new HttpErro(409, 'ATTEMPT_FINISHED', 'Esta tentativa já foi finalizada.');
}

/** Busca uma tentativa DO PRÓPRIO aluno (404 se não existir ou for de outro aluno). */
function carregarTentativaDoAluno(PDO $db, int $usuarioId, int $tentativaId): array
{
    $tentativa = buscarUma($db, '
        SELECT ' . COLUNAS_TENTATIVA . '
        FROM attempts a JOIN topics t ON t.id = a.topic_id
        WHERE a.id = ? AND a.user_id = ?
    ', [$tentativaId, $usuarioId]);
    if ($tentativa === null) {
        throw naoEncontrado('Tentativa não encontrada.');
    }
    return $tentativa;
}

/** Formato público do resumo da tentativa. */
function resumoDaTentativa(array $a): array
{
    $finalizada = $a['finished_at'] !== null;
    $total = (int) $a['total_questions'];
    $acertos = (int) $a['correct_count'];
    $respondidas = (int) $a['answered'];
    $nota = notaPercentual($acertos, $total);

    return [
        'id' => (int) $a['id'],
        'topic' => ['slug' => $a['topic_slug'], 'title' => $a['topic_title'], 'schoolYear' => (int) $a['school_year']],
        'status' => $finalizada ? 'finished' : 'in_progress',
        'startedAt' => paraIso($a['started_at']),
        'finishedAt' => paraIso($a['finished_at']),
        'totalQuestions' => $total,
        'answered' => $respondidas,
        'correct' => $acertos,
        'wrong' => $respondidas - $acertos,
        'unanswered' => $total - $respondidas,
        // A nota só existe depois de finalizar; antes disso é null.
        'scorePercent' => $finalizada ? $nota : null,
        'mastered' => $finalizada ? $nota >= LIMITE_DOMINIO : null,
    ];
}

/**
 * Junta as alternativas às questões, SEM a indicação de alternativa correta
 * (a coluna is_correct nem é lida aqui).
 */
function comAlternativasPublicas(PDO $db, array $questoes): array
{
    if (count($questoes) === 0) {
        return [];
    }
    $ids = array_map(fn ($q) => (int) $q['id'], $questoes);
    $alternativas = buscarTodas(
        $db,
        'SELECT id, question_id, letter, text FROM question_options WHERE question_id IN (' . marcadores(count($ids)) . ') ORDER BY letter',
        $ids
    );

    $resultado = [];
    foreach ($questoes as $q) {
        $opcoes = [];
        foreach ($alternativas as $o) {
            if ((int) $o['question_id'] === (int) $q['id']) {
                $opcoes[] = ['id' => (int) $o['id'], 'letter' => $o['letter'], 'text' => $o['text']];
            }
        }
        $resultado[] = [
            'id' => (int) $q['id'],
            'position' => (int) $q['position'],
            'statement' => $q['statement'],
            'difficulty' => $q['difficulty'],
            'options' => $opcoes,
        ];
    }
    return $resultado;
}

/** Questões ATIVAS do assunto, sem gabarito e sem explicação. */
function questoesAtivas(PDO $db, int $topicId): array
{
    $questoes = buscarTodas(
        $db,
        'SELECT id, position, statement, difficulty FROM questions WHERE topic_id = ? AND active = 1 ORDER BY position',
        [$topicId]
    );
    return comAlternativasPublicas($db, $questoes);
}

/** Questões entregues ao aluno nesta tentativa (sem gabarito). */
function questoesDaTentativa(PDO $db, int $tentativaId): array
{
    $questoes = buscarTodas($db, '
        SELECT q.id, aq.position, q.statement, q.difficulty
        FROM attempt_questions aq JOIN questions q ON q.id = aq.question_id
        WHERE aq.attempt_id = ? ORDER BY aq.position
    ', [$tentativaId]);
    return comAlternativasPublicas($db, $questoes);
}

/** POST /topics/{slug}/attempts — inicia uma NOVA tentativa e devolve as questões (sem gabarito). */
function rotaIniciarTentativa(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $usuarioId = (int) $usuario['id'];
    $topicId = idDoAssunto($db, lerSlug($req->parametros['slug']));

    $questoes = questoesAtivas($db, $topicId);
    if (count($questoes) === 0) {
        throw new HttpErro(409, 'NO_QUESTIONS', 'Este assunto ainda não tem exercícios.');
    }

    // A tentativa e a lista de questões entregues são gravadas juntas.
    $tentativaId = emTransacao($db, function () use ($db, $usuarioId, $topicId, $questoes): int {
        executarSql(
            $db,
            'INSERT INTO attempts (user_id, topic_id, total_questions) VALUES (?, ?, ?)',
            [$usuarioId, $topicId, count($questoes)]
        );
        $id = (int) $db->lastInsertId();

        $linhas = [];
        $valores = [];
        foreach ($questoes as $i => $q) {
            $linhas[] = '(?, ?, ?)';
            array_push($valores, $id, $q['id'], $i + 1);
        }
        executarSql(
            $db,
            'INSERT INTO attempt_questions (attempt_id, question_id, position) VALUES ' . implode(', ', $linhas),
            $valores
        );
        return $id;
    });

    // As posições são renumeradas de 1 a N, na ordem entregue.
    foreach ($questoes as $i => $q) {
        $questoes[$i]['position'] = $i + 1;
    }

    return [201, [
        'attempt' => resumoDaTentativa(carregarTentativaDoAluno($db, $usuarioId, $tentativaId)),
        'questions' => $questoes,
    ]];
}

/**
 * POST /attempts/{id}/answers — corpo: { "questionId": 36, "optionId": 141 }.
 * A tela envia apenas a escolha; a correção é feita aqui.
 * Campos como isCorrect ou score enviados pela tela são ignorados.
 */
function rotaResponderQuestao(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $usuarioId = (int) $usuario['id'];
    $corpo = $req->corpo;

    $faltaQuestao = !array_key_exists('questionId', $corpo);
    $faltaAlternativa = !array_key_exists('optionId', $corpo);
    if ($faltaQuestao || $faltaAlternativa) {
        $detalhes = [];
        if ($faltaQuestao) {
            $detalhes['questionId'] = 'Obrigatório.';
        }
        if ($faltaAlternativa) {
            $detalhes['optionId'] = 'Obrigatório.';
        }
        throw erroValidacao('Informe a questão e a alternativa escolhida.', $detalhes);
    }

    $tentativaId = lerId($req->parametros['id']);
    $questaoId = lerId($corpo['questionId'], 'questionId');
    $alternativaId = lerId($corpo['optionId'], 'optionId');

    $tentativa = carregarTentativaDoAluno($db, $usuarioId, $tentativaId);
    if ($tentativa['finished_at'] !== null) {
        throw tentativaJaFinalizada();
    }

    // A questão precisa ser uma das entregues nesta tentativa.
    $questao = buscarUma($db, '
        SELECT q.id, q.explanation
        FROM attempt_questions aq JOIN questions q ON q.id = aq.question_id
        WHERE aq.attempt_id = ? AND aq.question_id = ?
    ', [$tentativaId, $questaoId]);
    if ($questao === null) {
        throw erroValidacao('Esta questão não faz parte da tentativa.', ['questionId' => 'Questão inválida.']);
    }

    $alternativas = buscarTodas(
        $db,
        'SELECT id, letter, is_correct FROM question_options WHERE question_id = ?',
        [$questaoId]
    );
    $escolhida = null;
    $correta = null;
    foreach ($alternativas as $o) {
        if ((int) $o['id'] === $alternativaId) {
            $escolhida = $o;
        }
        if ($correta === null && (int) $o['is_correct'] === 1) {
            $correta = $o;
        }
    }
    if ($escolhida === null) {
        throw erroValidacao('Alternativa inválida para esta questão.', ['optionId' => 'Alternativa inválida.']);
    }
    if ($correta === null) {
        throw new RuntimeException("A questão {$questaoId} está sem alternativa correta no banco.");
    }
    $acertou = (int) $escolhida['is_correct'] === 1;

    try {
        // Resposta e contador de acertos são gravados juntos (transação).
        emTransacao($db, function () use ($db, $tentativaId, $questaoId, $alternativaId, $acertou): void {
            executarSql(
                $db,
                'INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct) VALUES (?, ?, ?, ?)',
                [$tentativaId, $questaoId, $alternativaId, $acertou ? 1 : 0]
            );
            if ($acertou) {
                executarSql($db, 'UPDATE attempts SET correct_count = correct_count + 1 WHERE id = ?', [$tentativaId]);
            }
        });
    } catch (PDOException $erro) {
        // 1062 = resposta repetida (chave única tentativa + questão).
        if (codigoErroMysql($erro) === 1062) {
            throw new HttpErro(409, 'ALREADY_ANSWERED', 'Esta questão já foi respondida nesta tentativa.');
        }
        throw $erro;
    }

    return [201, [
        'questionId' => $questaoId,
        'selectedOptionId' => $alternativaId,
        'isCorrect' => $acertou,
        'correctOptionId' => (int) $correta['id'],
        'correctLetter' => $correta['letter'],
        'explanation' => $questao['explanation'],
        'attempt' => resumoDaTentativa(carregarTentativaDoAluno($db, $usuarioId, $tentativaId)),
    ]];
}

/** POST /attempts/{id}/finish — encerra a tentativa e calcula a nota. Chamar de novo devolve o mesmo resultado. */
function rotaFinalizarTentativa(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $usuarioId = (int) $usuario['id'];
    $tentativaId = lerId($req->parametros['id']);

    $tentativa = carregarTentativaDoAluno($db, $usuarioId, $tentativaId);
    if ($tentativa['finished_at'] === null) {
        executarSql(
            $db,
            'UPDATE attempts SET finished_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND finished_at IS NULL',
            [$tentativaId, $usuarioId]
        );
    }
    return [200, ['attempt' => resumoDaTentativa(carregarTentativaDoAluno($db, $usuarioId, $tentativaId))]];
}

/**
 * GET /attempts/{id} — detalhe da tentativa. Para cada questão, o gabarito e a
 * explicação aparecem apenas se o aluno já respondeu aquela questão (senão, answer: null).
 */
function rotaVerTentativa(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $usuarioId = (int) $usuario['id'];
    $tentativaId = lerId($req->parametros['id']);

    $tentativa = carregarTentativaDoAluno($db, $usuarioId, $tentativaId);

    // Resposta do aluno + alternativa correta + explicação, só das questões respondidas.
    $respondidas = buscarTodas($db, '
        SELECT aa.question_id, aa.option_id, aa.is_correct, aa.answered_at,
               q.explanation, o.id AS correct_option_id, o.letter AS correct_letter
        FROM attempt_answers aa
        JOIN questions q ON q.id = aa.question_id
        JOIN question_options o ON o.question_id = aa.question_id AND o.is_correct = 1
        WHERE aa.attempt_id = ?
    ', [$tentativaId]);
    $porQuestao = [];
    foreach ($respondidas as $r) {
        $porQuestao[(int) $r['question_id']] = $r;
    }

    $questoes = [];
    foreach (questoesDaTentativa($db, $tentativaId) as $q) {
        $r = $porQuestao[$q['id']] ?? null;
        $q['answer'] = $r === null ? null : [
            'selectedOptionId' => (int) $r['option_id'],
            'isCorrect' => (int) $r['is_correct'] === 1,
            'correctOptionId' => (int) $r['correct_option_id'],
            'correctLetter' => $r['correct_letter'],
            'explanation' => $r['explanation'],
            'answeredAt' => paraIso($r['answered_at']),
        ];
        $questoes[] = $q;
    }

    return [200, ['attempt' => resumoDaTentativa($tentativa), 'questions' => $questoes]];
}

/** GET /attempts?topic=estatistica&limit=20&offset=0 — histórico, do mais recente para o mais antigo. */
function rotaHistoricoDeTentativas(PDO $db, Requisicao $req): array
{
    $usuario = exigirLogin($req);
    $usuarioId = (int) $usuario['id'];
    $paginacao = lerPaginacao($req->query);
    $topicId = valorInformado($req->query['topic'] ?? null)
        ? idDoAssunto($db, lerSlug($req->query['topic'], 'topic'))
        : null;

    $filtro = $topicId !== null ? 'AND a.topic_id = ?' : '';
    $valores = $topicId !== null ? [$usuarioId, $topicId] : [$usuarioId];

    $total = (int) buscarValor($db, 'SELECT COUNT(*) FROM attempts a WHERE a.user_id = ? ' . $filtro, $valores);
    $linhas = buscarTodas($db, '
        SELECT ' . COLUNAS_TENTATIVA . '
        FROM attempts a JOIN topics t ON t.id = a.topic_id
        WHERE a.user_id = ? ' . $filtro . '
        ORDER BY a.started_at DESC, a.id DESC
        LIMIT ? OFFSET ?
    ', array_merge($valores, [$paginacao['limit'], $paginacao['offset']]));

    return [200, [
        'total' => $total,
        'limit' => $paginacao['limit'],
        'offset' => $paginacao['offset'],
        'items' => array_map('resumoDaTentativa', $linhas),
    ]];
}
