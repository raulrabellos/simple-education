import { HttpError, notFound, badRequest } from '../utils/httpError.js';
import { MASTERY_THRESHOLD, scorePercent } from './progressService.js';
import { toIso } from '../utils/normalize.js';

/*
 * Regras de segurança das tentativas:
 * - O aluno é identificado SOMENTE pela sessão (req.user.id), nunca por dado enviado pelo frontend.
 * - Toda busca de tentativa filtra por user_id: a tentativa de outro aluno responde 404.
 * - O gabarito (alternativa correta) e a explicação só saem do servidor
 *   para questões que o aluno já respondeu naquela tentativa.
 * - Acertos e nota são calculados aqui; o frontend envia apenas a alternativa escolhida.
 * - Cada tentativa é um registro novo: repetir os exercícios preserva o histórico anterior.
 */

const attemptFinished = () => new HttpError(409, 'ATTEMPT_FINISHED', 'Esta tentativa já foi finalizada.');

const ATTEMPT_COLUMNS = `
  a.id, a.user_id, a.topic_id, a.started_at, a.finished_at, a.total_questions, a.correct_count,
  t.slug AS topic_slug, t.title AS topic_title, t.school_year,
  (SELECT COUNT(*) FROM attempt_answers aa WHERE aa.attempt_id = a.id) AS answered
`;

async function loadOwnAttempt(db, userId, attemptId) {
  const attempt = await db.get(`
    SELECT ${ATTEMPT_COLUMNS}
    FROM attempts a JOIN topics t ON t.id = a.topic_id
    WHERE a.id = ? AND a.user_id = ?
  `, [attemptId, userId]);
  if (!attempt) throw notFound('Tentativa não encontrada.');
  return attempt;
}

function toSummary(a) {
  const finished = a.finished_at !== null;
  const score = scorePercent(a.correct_count, a.total_questions);
  return {
    id: a.id,
    topic: { slug: a.topic_slug, title: a.topic_title, schoolYear: a.school_year },
    status: finished ? 'finished' : 'in_progress',
    startedAt: toIso(a.started_at),
    finishedAt: toIso(a.finished_at),
    totalQuestions: a.total_questions,
    answered: a.answered,
    correct: a.correct_count,
    wrong: a.answered - a.correct_count,
    unanswered: a.total_questions - a.answered,
    // A nota só existe depois de finalizar; antes disso é null.
    scorePercent: finished ? score : null,
    mastered: finished ? score >= MASTERY_THRESHOLD : null,
  };
}

/** Junta as alternativas (sem gabarito) às questões. */
async function withPublicOptions(db, questions) {
  if (questions.length === 0) return [];
  const options = await db.all(
    'SELECT id, question_id, letter, text FROM question_options WHERE question_id IN (?) ORDER BY letter',
    [questions.map((q) => q.id)]
  );
  return questions.map((q) => ({
    id: q.id,
    position: q.position,
    statement: q.statement,
    difficulty: q.difficulty,
    options: options.filter((o) => o.question_id === q.id).map(({ id, letter, text }) => ({ id, letter, text })),
  }));
}

/** Questões ATIVAS do assunto, SEM a indicação de alternativa correta e SEM explicação. */
async function activeQuestions(db, topicId) {
  const questions = await db.all(
    'SELECT id, position, statement, difficulty FROM questions WHERE topic_id = ? AND active = 1 ORDER BY position',
    [topicId]
  );
  return withPublicOptions(db, questions);
}

/** Questões que foram entregues ao aluno nesta tentativa (sem gabarito). */
async function attemptQuestions(db, attemptId) {
  const questions = await db.all(`
    SELECT q.id, aq.position, q.statement, q.difficulty
    FROM attempt_questions aq JOIN questions q ON q.id = aq.question_id
    WHERE aq.attempt_id = ? ORDER BY aq.position
  `, [attemptId]);
  return withPublicOptions(db, questions);
}

/** Inicia uma nova tentativa para o assunto e devolve as questões (sem gabarito). */
export async function startAttempt(db, userId, topicId) {
  const questions = await activeQuestions(db, topicId);
  if (questions.length === 0) {
    throw new HttpError(409, 'NO_QUESTIONS', 'Este assunto ainda não tem exercícios.');
  }
  // A tentativa e a lista de questões entregues são gravadas juntas.
  const attemptId = await db.transaction(async (tx) => {
    const { insertId } = await tx.run(
      'INSERT INTO attempts (user_id, topic_id, total_questions) VALUES (?, ?, ?)',
      [userId, topicId, questions.length]
    );
    await tx.run(
      'INSERT INTO attempt_questions (attempt_id, question_id, position) VALUES ?',
      [questions.map((q, i) => [insertId, q.id, i + 1])]
    );
    return insertId;
  });
  return {
    attempt: toSummary(await loadOwnAttempt(db, userId, attemptId)),
    questions: questions.map((q, i) => ({ ...q, position: i + 1 })),
  };
}

/** Registra e corrige a resposta de uma questão. */
export async function answerQuestion(db, userId, attemptId, questionId, optionId) {
  const attempt = await loadOwnAttempt(db, userId, attemptId);
  if (attempt.finished_at) throw attemptFinished();

  // A questão precisa ser uma das entregues nesta tentativa.
  const question = await db.get(`
    SELECT q.id, q.explanation
    FROM attempt_questions aq JOIN questions q ON q.id = aq.question_id
    WHERE aq.attempt_id = ? AND aq.question_id = ?
  `, [attemptId, questionId]);
  if (!question) throw badRequest('Esta questão não faz parte da tentativa.', { questionId: 'Questão inválida.' });

  const options = await db.all(
    'SELECT id, letter, is_correct FROM question_options WHERE question_id = ?', [questionId]
  );
  const selected = options.find((o) => o.id === optionId);
  if (!selected) throw badRequest('Alternativa inválida para esta questão.', { optionId: 'Alternativa inválida.' });
  const correct = options.find((o) => o.is_correct === 1);
  const isCorrect = selected.is_correct === 1;

  try {
    // Resposta e contador de acertos são gravados juntos (transação).
    await db.transaction(async (tx) => {
      await tx.run(
        'INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct) VALUES (?, ?, ?, ?)',
        [attemptId, questionId, optionId, isCorrect ? 1 : 0]
      );
      if (isCorrect) {
        await tx.run('UPDATE attempts SET correct_count = correct_count + 1 WHERE id = ?', [attemptId]);
      }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'ALREADY_ANSWERED', 'Esta questão já foi respondida nesta tentativa.');
    }
    throw err;
  }

  return {
    questionId,
    selectedOptionId: optionId,
    isCorrect,
    correctOptionId: correct.id,
    correctLetter: correct.letter,
    explanation: question.explanation,
    attempt: toSummary(await loadOwnAttempt(db, userId, attemptId)),
  };
}

/** Finaliza a tentativa. Chamar de novo apenas devolve o resultado (idempotente). */
export async function finishAttempt(db, userId, attemptId) {
  const attempt = await loadOwnAttempt(db, userId, attemptId);
  if (!attempt.finished_at) {
    await db.run(
      'UPDATE attempts SET finished_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND finished_at IS NULL',
      [attemptId, userId]
    );
  }
  return toSummary(await loadOwnAttempt(db, userId, attemptId));
}

/**
 * Detalhe da tentativa. Para cada questão, o gabarito e a explicação
 * aparecem apenas se o aluno já respondeu aquela questão.
 */
export async function getAttemptDetail(db, userId, attemptId) {
  const attempt = await loadOwnAttempt(db, userId, attemptId);
  // Junta a resposta do aluno com a alternativa correta e a explicação,
  // apenas para as questões que ele respondeu.
  const answered = await db.all(`
    SELECT aa.question_id, aa.option_id, aa.is_correct, aa.answered_at,
           q.explanation, o.id AS correct_option_id, o.letter AS correct_letter
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    JOIN question_options o ON o.question_id = aa.question_id AND o.is_correct = 1
    WHERE aa.attempt_id = ?
  `, [attemptId]);
  const byQuestion = new Map(answered.map((a) => [a.question_id, a]));

  const questions = (await attemptQuestions(db, attemptId)).map((q) => {
    const a = byQuestion.get(q.id);
    if (!a) return { ...q, answer: null };
    return {
      ...q,
      answer: {
        selectedOptionId: a.option_id,
        isCorrect: a.is_correct === 1,
        correctOptionId: a.correct_option_id,
        correctLetter: a.correct_letter,
        explanation: a.explanation,
        answeredAt: toIso(a.answered_at),
      },
    };
  });

  return { attempt: toSummary(attempt), questions };
}

/** Histórico de tentativas do aluno, da mais recente para a mais antiga. */
export async function listAttempts(db, userId, { topicId = null, limit, offset }) {
  const filter = topicId ? 'AND a.topic_id = ?' : '';
  const params = topicId ? [userId, topicId] : [userId];

  const total = await db.value(`SELECT COUNT(*) FROM attempts a WHERE a.user_id = ? ${filter}`, params);
  const rows = await db.all(`
    SELECT ${ATTEMPT_COLUMNS}
    FROM attempts a JOIN topics t ON t.id = a.topic_id
    WHERE a.user_id = ? ${filter}
    ORDER BY a.started_at DESC, a.id DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return { total, limit, offset, items: rows.map(toSummary) };
}
