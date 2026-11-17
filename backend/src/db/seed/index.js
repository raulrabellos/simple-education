import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from '../../config.js';
import { createDb } from '../connection.js';
import { runMigrations } from '../migrate.js';
import { explainDbError, formatProblem } from '../diagnostics.js';
import { normalizeText } from '../../utils/normalize.js';
import ano1 from './content/ano1.js';
import ano2 from './content/ano2.js';
import ano3 from './content/ano3.js';

/*
 * CARGA INICIAL SINCRONIZÁVEL
 * ---------------------------
 * Pode ser executada quantas vezes for preciso (npm run db:seed, ou ao iniciar o servidor):
 * - Matéria e assuntos são localizados pelo slug e atualizados, nunca duplicados.
 * - As seções da aula são regravadas (não guardam dados de alunos).
 * - Cada questão tem um código estável (ex.: "funcoes-01"):
 *     • conteúdo igual → só atualiza explicação, dificuldade e ordem;
 *     • conteúdo mudou e NINGUÉM usou a questão → atualiza no lugar;
 *     • conteúdo mudou e ALGUÉM já usou → a antiga é arquivada (active = 0) e uma nova é criada,
 *       para o histórico do aluno continuar mostrando exatamente o que ele respondeu.
 * - Questões que saíram do conteúdo: apagadas se nunca usadas; arquivadas se usadas.
 * Nada aqui apaga tentativas, respostas ou aulas concluídas.
 */

export const LETTERS = ['A', 'B', 'C', 'D'];
export const DIFFICULTIES = ['facil', 'medio', 'dificil'];
export const QUESTIONS_PER_TOPIC = 5;

export const SUBJECT = {
  slug: 'matematica',
  name: 'Matemática',
  description: 'Conteúdos do 1º, 2º e 3º ano do Ensino Médio.',
};

export const CONTENT_BY_YEAR = { 1: ano1, 2: ano2, 3: ano3 };

/** Confere a definição do conteúdo antes de gravar qualquer coisa. Lança erro com a lista de problemas. */
export function validateContentDefinition(contentByYear = CONTENT_BY_YEAR) {
  const problems = [];
  const codes = new Set();
  const slugs = new Set();

  for (const [year, topics] of Object.entries(contentByYear)) {
    if (topics.length !== 3) problems.push(`${year}º ano deve ter 3 aulas (tem ${topics.length}).`);
    for (const t of topics) {
      const where = `Aula "${t.slug}"`;
      if (slugs.has(t.slug)) problems.push(`${where}: slug repetido.`);
      slugs.add(t.slug);
      for (const field of ['title', 'summary', 'objective']) {
        if (!t[field]?.trim()) problems.push(`${where}: falta ${field}.`);
      }
      const count = (kind) => t.sections.filter((s) => s.kind === kind).length;
      if (count('explicacao') < 1) problems.push(`${where}: falta a explicação.`);
      if (count('formulas') < 1) problems.push(`${where}: faltam conceitos e fórmulas.`);
      if (count('exemplo') < 2) problems.push(`${where}: precisa de pelo menos 2 exemplos resolvidos.`);
      if (count('resumo') < 1) problems.push(`${where}: falta o resumo.`);
      if (t.questions.length !== QUESTIONS_PER_TOPIC) {
        problems.push(`${where}: deve ter ${QUESTIONS_PER_TOPIC} questões (tem ${t.questions.length}).`);
      }

      for (const q of t.questions) {
        const qw = `Questão "${q.code}"`;
        if (!q.code || codes.has(q.code)) problems.push(`${qw}: código ausente ou repetido.`);
        codes.add(q.code);
        if (!DIFFICULTIES.includes(q.difficulty)) problems.push(`${qw}: dificuldade inválida.`);
        if (!q.statement?.trim() || !q.explanation?.trim()) problems.push(`${qw}: falta enunciado ou explicação.`);
        const letters = Object.keys(q.options ?? {});
        if (letters.join() !== LETTERS.join()) problems.push(`${qw}: deve ter exatamente as alternativas A, B, C e D.`);
        if (!LETTERS.includes(q.correct)) problems.push(`${qw}: a alternativa correta deve ser A, B, C ou D.`);
        const texts = Object.values(q.options ?? {}).map((x) => normalizeText(x));
        if (new Set(texts).size !== texts.length) problems.push(`${qw}: há alternativas com o mesmo texto.`);
      }
    }
  }
  if (problems.length) throw new Error(`Conteúdo inválido:\n- ${problems.join('\n- ')}`);
}

function questionHash(q) {
  return crypto.createHash('sha256')
    .update(JSON.stringify([q.statement, LETTERS.map((l) => q.options[l]), q.correct]))
    .digest('hex');
}

async function isQuestionUsed(tx, questionId) {
  return Boolean(await tx.value('SELECT 1 FROM attempt_questions WHERE question_id = ? LIMIT 1', [questionId]));
}

async function insertQuestion(tx, topicId, position, q) {
  const { insertId } = await tx.run(
    `INSERT INTO questions (topic_id, code, position, statement, explanation, difficulty, active, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [topicId, q.code, position, q.statement, q.explanation, q.difficulty, questionHash(q)]
  );
  await insertOptions(tx, insertId, q);
}

async function insertOptions(tx, questionId, q) {
  const rows = LETTERS.map((l) => [questionId, l, q.options[l], l === q.correct ? 1 : 0]);
  await tx.run('INSERT INTO question_options (question_id, letter, text, is_correct) VALUES ?', [rows]);
}

/** Retira uma questão de uso: apaga se nunca foi usada; senão arquiva (preserva histórico). */
async function retireQuestion(tx, questionId) {
  if (await isQuestionUsed(tx, questionId)) {
    const { affectedRows } = await tx.run(
      'UPDATE questions SET active = 0, code = NULL WHERE id = ? AND (active = 1 OR code IS NOT NULL)', [questionId]
    );
    return affectedRows ? 'archived' : 'unchanged';
  }
  await tx.run('DELETE FROM questions WHERE id = ?', [questionId]);
  return 'deleted';
}

/**
 * Sincroniza o banco com o conteúdo definido em ./content.
 * Retorna um resumo do que foi feito.
 */
export async function seedContent(db) {
  validateContentDefinition();
  const stats = { topicsCreated: 0, topicsUpdated: 0, questionsCreated: 0, questionsUpdated: 0, questionsUnchanged: 0, questionsArchived: 0, questionsDeleted: 0 };

  await db.transaction(async (tx) => {
    // Matéria
    let subjectId = await tx.value('SELECT id FROM subjects WHERE slug = ?', [SUBJECT.slug]);
    if (subjectId) {
      await tx.run('UPDATE subjects SET name = ?, description = ?, position = 1 WHERE id = ?', [SUBJECT.name, SUBJECT.description, subjectId]);
    } else {
      ({ insertId: subjectId } = await tx.run(
        'INSERT INTO subjects (slug, name, description, position) VALUES (?, ?, ?, 1)',
        [SUBJECT.slug, SUBJECT.name, SUBJECT.description]
      ));
    }

    for (const [year, topics] of Object.entries(CONTENT_BY_YEAR)) {
      for (const [topicIndex, t] of topics.entries()) {
        // Aula (assunto)
        const searchText = normalizeText(
          [t.title, t.summary, t.objective, ...t.sections.map((s) => `${s.title} ${s.body}`)].join(' ')
        );
        const values = [subjectId, Number(year), t.title, t.summary, t.objective, topicIndex + 1, searchText];
        let topicId = await tx.value('SELECT id FROM topics WHERE slug = ?', [t.slug]);
        if (topicId) {
          await tx.run(
            `UPDATE topics SET subject_id = ?, school_year = ?, title = ?, summary = ?, objective = ?, position = ?, search_text = ?
             WHERE id = ?`, [...values, topicId]
          );
          stats.topicsUpdated++;
        } else {
          ({ insertId: topicId } = await tx.run(
            `INSERT INTO topics (subject_id, school_year, title, summary, objective, position, search_text, slug)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [...values, t.slug]
          ));
          stats.topicsCreated++;
        }

        // Seções da aula: regravadas por completo.
        await tx.run('DELETE FROM topic_sections WHERE topic_id = ?', [topicId]);
        const sectionRows = t.sections.map((s, i) => [topicId, i + 1, s.kind, s.title, s.body]);
        await tx.run('INSERT INTO topic_sections (topic_id, position, kind, title, body) VALUES ?', [sectionRows]);

        // Questões
        const existing = await tx.all('SELECT id, code, content_hash FROM questions WHERE topic_id = ?', [topicId]);
        const byCode = new Map(existing.filter((e) => e.code).map((e) => [e.code, e]));
        const keptIds = new Set();

        for (const [qIndex, q] of t.questions.entries()) {
          const position = qIndex + 1;
          const row = byCode.get(q.code);
          const hash = questionHash(q);

          if (!row) {
            await insertQuestion(tx, topicId, position, q);
            stats.questionsCreated++;
          } else if (row.content_hash === hash) {
            await tx.run(
              'UPDATE questions SET position = ?, explanation = ?, difficulty = ?, active = 1 WHERE id = ?',
              [position, q.explanation, q.difficulty, row.id]
            );
            keptIds.add(row.id);
            stats.questionsUnchanged++;
          } else if (!(await isQuestionUsed(tx, row.id))) {
            await tx.run(
              `UPDATE questions SET position = ?, statement = ?, explanation = ?, difficulty = ?, active = 1, content_hash = ?
               WHERE id = ?`, [position, q.statement, q.explanation, q.difficulty, hash, row.id]
            );
            await tx.run('DELETE FROM question_options WHERE question_id = ?', [row.id]);
            await insertOptions(tx, row.id, q);
            keptIds.add(row.id);
            stats.questionsUpdated++;
          } else {
            await tx.run('UPDATE questions SET active = 0, code = NULL WHERE id = ?', [row.id]);
            await insertQuestion(tx, topicId, position, q);
            stats.questionsArchived++;
            stats.questionsCreated++;
          }
        }

        // Questões antigas que não estão mais no conteúdo (inclui as de versões anteriores, sem código).
        for (const e of existing) {
          if (keptIds.has(e.id) || (e.code && t.questions.some((q) => q.code === e.code))) continue;
          const result = await retireQuestion(tx, e.id);
          if (result === 'archived') stats.questionsArchived++;
          if (result === 'deleted') stats.questionsDeleted++;
        }
      }
    }
  });

  return stats;
}

// Execução direta: npm run db:seed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runMigrations(config.db);
    const db = createDb(config.db);
    const s = await seedContent(db);
    await db.close();
    console.log('Carga de conteúdo concluída (alunos e histórico preservados).');
    console.log(`Aulas: ${s.topicsCreated} criadas, ${s.topicsUpdated} atualizadas.`);
    console.log(`Questões: ${s.questionsCreated} criadas, ${s.questionsUpdated} atualizadas, ${s.questionsUnchanged} sem mudança, ${s.questionsArchived} arquivadas, ${s.questionsDeleted} removidas.`);
  } catch (err) {
    console.error(`Falha na carga de conteúdo.\n${formatProblem(explainDbError(err, config.db))}`);
    process.exit(1);
  }
}
