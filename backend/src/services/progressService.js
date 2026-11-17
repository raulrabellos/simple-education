import { toIso } from '../utils/normalize.js';

/**
 * Regras de progresso do Simple Education
 * ----------------------------------------
 * - Aula concluída: o aluno marcou, na página do assunto, que estudou o conteúdo.
 *   É uma ação explícita e independe dos exercícios.
 * - Exercício respondido: existe uma resposta registrada para a questão em uma tentativa.
 * - Exercício acertado: a resposta registrada é a alternativa correta (verificado no servidor).
 * - Tentativa finalizada: o aluno encerrou a tentativa. Só tentativas finalizadas
 *   contam para a nota. Nota = acertos / total de questões da tentativa
 *   (questões não respondidas contam como não acertadas).
 * - Assunto dominado: melhor nota entre as tentativas finalizadas >= MASTERY_THRESHOLD.
 * - Status do assunto:
 *     not_started  → sem aula concluída e sem nenhuma tentativa;
 *     completed    → aula concluída E assunto dominado;
 *     in_progress  → qualquer outra situação.
 * O limite de 70% é uma decisão do projeto e pode ser alterado aqui.
 */
export const MASTERY_THRESHOLD = 70;

export const scorePercent = (correct, total) => (total > 0 ? Math.round((correct * 100) / total) : 0);

function emptyProgress() {
  return {
    status: 'not_started',
    lessonCompleted: false,
    lessonCompletedAt: null,
    attemptsStarted: 0,
    attemptsFinished: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    bestScore: null,
    lastScore: null,
    mastered: false,
    lastActivityAt: null,
  };
}

function finalize(p) {
  p.mastered = p.bestScore !== null && p.bestScore >= MASTERY_THRESHOLD;
  if (p.lessonCompleted && p.mastered) p.status = 'completed';
  else if (p.lessonCompleted || p.attemptsStarted > 0) p.status = 'in_progress';
  else p.status = 'not_started';
  p.lessonCompletedAt = toIso(p.lessonCompletedAt);
  p.lastActivityAt = toIso(p.lastActivityAt);
  return p;
}

const latest = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

/** Monta um Map topicId → progresso do aluno, usando apenas dados do próprio aluno. */
export async function getProgressMap(db, userId) {
  const map = new Map();
  const get = (topicId) => {
    if (!map.has(topicId)) map.set(topicId, emptyProgress());
    return map.get(topicId);
  };

  for (const row of await db.all(
    'SELECT topic_id, completed_at FROM lesson_completions WHERE user_id = ?', [userId]
  )) {
    const p = get(row.topic_id);
    p.lessonCompleted = true;
    p.lessonCompletedAt = row.completed_at;
    p.lastActivityAt = latest(p.lastActivityAt, row.completed_at);
  }

  for (const row of await db.all(`
    SELECT topic_id,
           COUNT(*) AS started,
           SUM(finished_at IS NOT NULL) AS finished,
           MAX(CASE WHEN finished_at IS NOT NULL
                    THEN ROUND(correct_count * 100.0 / total_questions) END) AS best,
           MAX(COALESCE(finished_at, started_at)) AS last_activity
    FROM attempts WHERE user_id = ? GROUP BY topic_id
  `, [userId])) {
    const p = get(row.topic_id);
    p.attemptsStarted = row.started;
    p.attemptsFinished = Number(row.finished);
    p.bestScore = row.best === null ? null : Number(row.best);
    p.lastActivityAt = latest(p.lastActivityAt, row.last_activity);
  }

  // Nota da última tentativa finalizada de cada assunto.
  for (const row of await db.all(`
    SELECT a.topic_id, a.correct_count, a.total_questions
    FROM attempts a
    WHERE a.user_id = ? AND a.finished_at IS NOT NULL
      AND a.id = (SELECT b.id FROM attempts b
                  WHERE b.user_id = a.user_id AND b.topic_id = a.topic_id AND b.finished_at IS NOT NULL
                  ORDER BY b.finished_at DESC, b.id DESC LIMIT 1)
  `, [userId])) {
    get(row.topic_id).lastScore = scorePercent(row.correct_count, row.total_questions);
  }

  for (const row of await db.all(`
    SELECT a.topic_id, COUNT(*) AS answered, SUM(aa.is_correct) AS correct, MAX(aa.answered_at) AS last_answer
    FROM attempt_answers aa JOIN attempts a ON a.id = aa.attempt_id
    WHERE a.user_id = ? GROUP BY a.topic_id
  `, [userId])) {
    const p = get(row.topic_id);
    p.questionsAnswered = row.answered;
    p.correctAnswers = Number(row.correct);
    p.lastActivityAt = latest(p.lastActivityAt, row.last_answer);
  }

  for (const p of map.values()) finalize(p);
  return map;
}

/** Progresso de um assunto (retorna o padrão "não iniciado" se não houver dados). */
export function progressFor(map, topicId) {
  return map.get(topicId) ?? finalize(emptyProgress());
}

/** Resumo completo para a tela "Meu progresso". */
export async function getProgressOverview(db, userId) {
  const map = await getProgressMap(db, userId);
  const topics = await db.all(`
    SELECT t.id, t.slug, t.title, t.school_year, s.slug AS subject_slug, s.name AS subject_name
    FROM topics t JOIN subjects s ON s.id = t.subject_id
    ORDER BY s.position, t.school_year, t.position
  `);

  const blank = () => ({
    topicsTotal: 0, lessonsCompleted: 0, topicsMastered: 0, topicsCompleted: 0,
    attemptsFinished: 0, questionsAnswered: 0, correctAnswers: 0, wrongAnswers: 0, accuracy: null,
  });
  const totals = blank();
  const byYear = { 1: blank(), 2: blank(), 3: blank() };

  const topicItems = topics.map((t) => {
    const p = progressFor(map, t.id);
    for (const bucket of [totals, byYear[t.school_year]]) {
      bucket.topicsTotal += 1;
      bucket.lessonsCompleted += p.lessonCompleted ? 1 : 0;
      bucket.topicsMastered += p.mastered ? 1 : 0;
      bucket.topicsCompleted += p.status === 'completed' ? 1 : 0;
      bucket.attemptsFinished += p.attemptsFinished;
      bucket.questionsAnswered += p.questionsAnswered;
      bucket.correctAnswers += p.correctAnswers;
    }
    return {
      topic: { slug: t.slug, title: t.title, schoolYear: t.school_year, subject: { slug: t.subject_slug, name: t.subject_name } },
      progress: p,
    };
  });

  for (const bucket of [totals, ...Object.values(byYear)]) {
    bucket.wrongAnswers = bucket.questionsAnswered - bucket.correctAnswers;
    bucket.accuracy = bucket.questionsAnswered > 0 ? scorePercent(bucket.correctAnswers, bucket.questionsAnswered) : null;
  }

  // Sugestão para "Continuar estudando": assunto com atividade mais recente que ainda não foi concluído.
  const continueStudying = topicItems
    .filter((i) => i.progress.status === 'in_progress')
    .sort((a, b) => (b.progress.lastActivityAt ?? '').localeCompare(a.progress.lastActivityAt ?? ''))[0]?.topic ?? null;

  return {
    masteryThreshold: MASTERY_THRESHOLD,
    totals,
    byYear: [1, 2, 3].map((year) => ({ schoolYear: year, ...byYear[year] })),
    topics: topicItems,
    continueStudying,
  };
}
