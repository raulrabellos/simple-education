import { notFound, badRequest } from '../utils/httpError.js';
import { escapeLike, normalizeText } from '../utils/normalize.js';
import { getProgressMap, progressFor } from './progressService.js';

const TOPIC_COLUMNS = `
  t.id, t.slug, t.title, t.summary, t.school_year, t.position,
  s.slug AS subject_slug, s.name AS subject_name,
  (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.active = 1) AS question_count
`;

function toTopicSummary(row, progressMap) {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    schoolYear: row.school_year,
    subject: { slug: row.subject_slug, name: row.subject_name },
    questionCount: row.question_count,
    progress: progressFor(progressMap, row.id),
  };
}

/** Lista as matérias (hoje apenas Matemática) com contagem de assuntos e progresso do aluno. */
export async function listSubjects(db, userId) {
  const progress = await getProgressMap(db, userId);
  const subjects = await db.all('SELECT id, slug, name, description FROM subjects ORDER BY position, name');
  const topics = await db.all('SELECT id, subject_id FROM topics');

  return subjects.map((s) => {
    const ids = topics.filter((t) => t.subject_id === s.id).map((t) => t.id);
    return {
      slug: s.slug,
      name: s.name,
      description: s.description,
      topicCount: ids.length,
      topicsCompleted: ids.filter((id) => progressFor(progress, id).status === 'completed').length,
    };
  });
}

/** Matéria com os assuntos agrupados por ano (tela "Conteúdos"). */
export async function getSubject(db, slug, userId) {
  const subject = await db.get('SELECT id, slug, name, description FROM subjects WHERE slug = ?', [slug]);
  if (!subject) throw notFound('Matéria não encontrada.');

  const progress = await getProgressMap(db, userId);
  const rows = await db.all(`
    SELECT ${TOPIC_COLUMNS}
    FROM topics t JOIN subjects s ON s.id = t.subject_id
    WHERE t.subject_id = ? ORDER BY t.school_year, t.position
  `, [subject.id]);

  return {
    slug: subject.slug,
    name: subject.name,
    description: subject.description,
    years: [1, 2, 3].map((year) => ({
      schoolYear: year,
      topics: rows.filter((r) => r.school_year === year).map((r) => toTopicSummary(r, progress)),
    })),
  };
}

/** Lista assuntos com filtros opcionais de ano e matéria. */
export async function listTopics(db, { year, subjectSlug }, userId) {
  const conditions = [];
  const params = [];
  if (year) { conditions.push('t.school_year = ?'); params.push(year); }
  if (subjectSlug) { conditions.push('s.slug = ?'); params.push(subjectSlug); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const progress = await getProgressMap(db, userId);
  const rows = await db.all(`
    SELECT ${TOPIC_COLUMNS}
    FROM topics t JOIN subjects s ON s.id = t.subject_id
    ${where}
    ORDER BY s.position, t.school_year, t.position
  `, params);
  return rows.map((r) => toTopicSummary(r, progress));
}

/** Página de estudo (aula): assunto + seções. Não inclui questões nem gabarito. */
export async function getTopic(db, slug, userId) {
  const row = await db.get(`
    SELECT ${TOPIC_COLUMNS}, t.objective
    FROM topics t JOIN subjects s ON s.id = t.subject_id
    WHERE t.slug = ?
  `, [slug]);
  if (!row) throw notFound('Assunto não encontrado.');

  const sections = await db.all(
    'SELECT kind, title, body FROM topic_sections WHERE topic_id = ? ORDER BY position', [row.id]
  );
  return { ...toTopicSummary(row, await getProgressMap(db, userId)), objective: row.objective ?? '', sections };
}

/** Retorna o id interno de um assunto pelo slug (404 se não existir). */
export async function findTopicId(db, slug) {
  const id = await db.value('SELECT id FROM topics WHERE slug = ?', [slug]);
  if (!id) throw notFound('Assunto não encontrado.');
  return id;
}

/**
 * Pesquisa por título, resumo e texto das aulas, ignorando acentos e maiúsculas.
 * Cada palavra digitada precisa aparecer no conteúdo (busca do tipo "E").
 */
export async function searchTopics(db, rawQuery, userId) {
  const query = normalizeText(rawQuery);
  if (query.length < 2 || query.length > 100) {
    throw badRequest('Digite de 2 a 100 caracteres para pesquisar.', { q: 'Tamanho inválido.' });
  }
  const words = [...new Set(query.split(' '))].slice(0, 6);
  // No MySQL, a barra invertida é o caractere de escape padrão do LIKE.
  const conditions = words.map(() => 't.search_text LIKE ?').join(' AND ');
  const params = words.map((w) => `%${escapeLike(w)}%`);

  const progress = await getProgressMap(db, userId);
  const rows = await db.all(`
    SELECT ${TOPIC_COLUMNS}
    FROM topics t JOIN subjects s ON s.id = t.subject_id
    WHERE ${conditions}
    ORDER BY t.school_year, t.position
  `, params);

  // Relevância: termo no título > termo na descrição > termo só no texto da aula.
  // Empates mantêm a ordem por ano (o sort é estável).
  const relevance = (r) => {
    if (normalizeText(r.title).includes(query)) return 3;
    if (normalizeText(r.summary).includes(query)) return 2;
    return 1;
  };
  rows.sort((a, b) => relevance(b) - relevance(a));

  return { query: String(rawQuery).trim(), total: rows.length, results: rows.map((r) => toTopicSummary(r, progress)) };
}

/** Marca a aula como concluída (idempotente: marcar de novo não muda a data). */
export async function markLessonCompleted(db, userId, topicId) {
  await db.run(
    'INSERT INTO lesson_completions (user_id, topic_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE topic_id = topic_id',
    [userId, topicId]
  );
  return progressFor(await getProgressMap(db, userId), topicId);
}

/** Desfaz a marcação de aula concluída (não afeta tentativas nem respostas). */
export async function unmarkLessonCompleted(db, userId, topicId) {
  await db.run('DELETE FROM lesson_completions WHERE user_id = ? AND topic_id = ?', [userId, topicId]);
  return progressFor(await getProgressMap(db, userId), topicId);
}
