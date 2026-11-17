// npm run db:check — confere no BANCO a integridade do conteúdo pedagógico.
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { createDb } from './connection.js';
import { explainDbError, formatProblem } from './diagnostics.js';

const EXPECTED_TOPICS = 9;
const QUESTIONS_PER_TOPIC = 5;

/** Retorna a lista de problemas encontrados (vazia = tudo certo). */
export async function checkContent(db) {
  const problems = [];

  const topics = await db.all(`
    SELECT t.id, t.slug, t.school_year, t.objective,
      (SELECT COUNT(*) FROM topic_sections s WHERE s.topic_id = t.id AND s.kind = 'explicacao') AS explicacoes,
      (SELECT COUNT(*) FROM topic_sections s WHERE s.topic_id = t.id AND s.kind = 'formulas') AS formulas,
      (SELECT COUNT(*) FROM topic_sections s WHERE s.topic_id = t.id AND s.kind = 'exemplo') AS exemplos,
      (SELECT COUNT(*) FROM topic_sections s WHERE s.topic_id = t.id AND s.kind = 'resumo') AS resumos,
      (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.active = 1) AS questions
    FROM topics t
  `);

  if (topics.length !== EXPECTED_TOPICS) problems.push(`Deveria haver ${EXPECTED_TOPICS} aulas (há ${topics.length}).`);
  for (const year of [1, 2, 3]) {
    const n = topics.filter((t) => t.school_year === year).length;
    if (n !== 3) problems.push(`${year}º ano deveria ter 3 aulas (tem ${n}).`);
  }
  for (const t of topics) {
    if (!t.objective?.trim()) problems.push(`Aula "${t.slug}" sem objetivo de aprendizagem.`);
    if (t.explicacoes < 1) problems.push(`Aula "${t.slug}" sem explicação.`);
    if (t.formulas < 1) problems.push(`Aula "${t.slug}" sem conceitos e fórmulas.`);
    if (t.exemplos < 2) problems.push(`Aula "${t.slug}" com menos de 2 exemplos (${t.exemplos}).`);
    if (t.resumos < 1) problems.push(`Aula "${t.slug}" sem resumo.`);
    if (t.questions !== QUESTIONS_PER_TOPIC) problems.push(`Aula "${t.slug}" com ${t.questions} questões ativas (esperado ${QUESTIONS_PER_TOPIC}).`);
  }

  // Cada questão ativa: 4 alternativas (A, B, C, D), exatamente 1 correta, dificuldade e explicação.
  const badQuestions = await db.all(`
    SELECT q.code, COUNT(o.id) AS options, COALESCE(SUM(o.is_correct), 0) AS correct,
           GROUP_CONCAT(o.letter ORDER BY o.letter SEPARATOR '') AS letters,
           q.difficulty, CHAR_LENGTH(TRIM(q.explanation)) AS expl
    FROM questions q LEFT JOIN question_options o ON o.question_id = q.id
    WHERE q.active = 1
    GROUP BY q.id, q.code, q.difficulty, q.explanation
    HAVING COUNT(o.id) <> 4 OR COALESCE(SUM(o.is_correct), 0) <> 1 OR letters <> 'ABCD'
        OR q.difficulty NOT IN ('facil', 'medio', 'dificil') OR expl = 0 OR q.code IS NULL
  `);
  for (const q of badQuestions) {
    problems.push(`Questão "${q.code}": ${q.options} alternativas (${q.letters}), ${q.correct} correta(s), dificuldade "${q.difficulty}".`);
  }

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = createDb(config.db);
  try {
    const c = await db.get(`SELECT
      (SELECT COUNT(*) FROM topics) AS aulas,
      (SELECT COUNT(*) FROM topic_sections WHERE kind = 'exemplo') AS exemplos,
      (SELECT COUNT(*) FROM questions WHERE active = 1) AS ativas,
      (SELECT COUNT(*) FROM questions WHERE active = 0) AS arquivadas`);
    const dif = await db.all("SELECT difficulty, COUNT(*) AS n FROM questions WHERE active = 1 GROUP BY difficulty ORDER BY FIELD(difficulty, 'facil', 'medio', 'dificil')");
    console.log(`Aulas: ${c.aulas} | Exemplos resolvidos: ${c.exemplos} | Questões ativas: ${c.ativas} | Arquivadas (histórico): ${c.arquivadas}`);
    console.log(`Por dificuldade: ${dif.map((d) => `${d.difficulty} ${d.n}`).join(', ')}`);
    const problems = await checkContent(db);
    if (problems.length) {
      console.error('Problemas encontrados:\n- ' + problems.join('\n- '));
      process.exitCode = 1;
    } else {
      console.log('Conteúdo OK: 9 aulas completas, 45 questões, 4 alternativas e exatamente 1 correta em cada.');
    }
  } catch (err) {
    console.error(`Não foi possível conferir o conteúdo.\n${formatProblem(explainDbError(err, config.db))}`);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
