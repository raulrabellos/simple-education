import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations } from '../src/db/migrate.js';
import { seedContent } from '../src/db/seed/index.js';
import { checkContent } from '../src/db/check.js';
import { setupTestApp, testDbConfig } from './helpers.js';

test('migrations já aplicadas não rodam de novo', async () => {
  assert.deepEqual(await runMigrations(testDbConfig), []);
});

test('carga criou 9 aulas (3 por ano), 45 questões com 4 alternativas e 1 correta', async () => {
  const { db } = await setupTestApp();
  const perYear = await db.all('SELECT school_year, COUNT(*) AS n FROM topics GROUP BY school_year ORDER BY school_year');
  assert.deepEqual(perYear.map((r) => [r.school_year, r.n]), [[1, 3], [2, 3], [3, 3]]);
  assert.equal(await db.value('SELECT COUNT(*) FROM questions WHERE active = 1'), 45);
  assert.equal(await db.value('SELECT COUNT(*) FROM question_options'), 45 * 4);
  assert.deepEqual(await checkContent(db), []);
});

test('rodar a carga de novo não duplica registros', async () => {
  const { db } = await setupTestApp();
  const count = () => db.get(`SELECT (SELECT COUNT(*) FROM topics) t, (SELECT COUNT(*) FROM topic_sections) s,
    (SELECT COUNT(*) FROM questions) q, (SELECT COUNT(*) FROM question_options) o, (SELECT COUNT(*) FROM subjects) m`);
  const before = await count();
  const ids = await db.all('SELECT id FROM questions ORDER BY id');
  const stats = await seedContent(db);
  assert.equal(stats.questionsCreated, 0);
  assert.equal(stats.questionsUnchanged, 45);
  assert.deepEqual(await count(), before);
  assert.deepEqual(await db.all('SELECT id FROM questions ORDER BY id'), ids, 'ids das questões preservados');
});

test('chaves estrangeiras e restrições estão ativas', async () => {
  const { db } = await setupTestApp();
  await assert.rejects(
    db.run('INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)', ['x', 999999, '2099-01-01']),
    (err) => err.code === 'ER_NO_REFERENCED_ROW_2'
  );
  await assert.rejects(
    db.run("INSERT INTO users (name, email, password_hash, school_year) VALUES ('X', 'x@x.com', 'h', 7)"),
    (err) => /CONSTRAINT|chk_users_school_year/i.test(err.message)
  );
});

test('acentos são preservados (utf8mb4)', async () => {
  const { db } = await setupTestApp();
  const title = await db.value("SELECT title FROM topics WHERE slug = 'analise-combinatoria-e-probabilidade'");
  assert.equal(title, 'Análise Combinatória e Probabilidade');
});

// ---------- Carga repetida x progresso dos alunos ----------
import request from 'supertest';
import { registerAndLogin, answerKey } from './helpers.js';

async function studentWithHistory(app, db) {
  const agent = await registerAndLogin(app);
  await agent.put('/api/topics/estatistica/completion').expect(200);
  const { body } = await agent.post('/api/topics/estatistica/attempts').expect(201);
  const q = body.questions[0];
  await agent.post(`/api/attempts/${body.attempt.id}/answers`)
    .send({ questionId: q.id, optionId: (await answerKey(db, q.id)).correct }).expect(201);
  await agent.post(`/api/attempts/${body.attempt.id}/finish`).expect(200);
  return { agent, attemptId: body.attempt.id, questionId: q.id };
}

test('carga repetida não apaga progresso, tentativas nem respostas', async () => {
  const { app, db } = await setupTestApp();
  const { agent, attemptId } = await studentWithHistory(app, db);
  const before = await agent.get('/api/progress').expect(200);

  await seedContent(db);
  await seedContent(db);

  const after = await agent.get('/api/progress').expect(200);
  assert.deepEqual(after.body.totals, before.body.totals);
  const detail = await agent.get(`/api/attempts/${attemptId}`).expect(200);
  assert.equal(detail.body.attempt.correct, 1);
  assert.equal(detail.body.questions.length, 5);
});

test('questão alterada e já usada é arquivada; o histórico continua mostrando a original', async () => {
  const { app, db } = await setupTestApp();
  const { agent, attemptId, questionId } = await studentWithHistory(app, db);
  const original = await db.get('SELECT code, statement FROM questions WHERE id = ?', [questionId]);
  // Simula que o conteúdo dessa questão mudou na definição.
  await db.run("UPDATE questions SET content_hash = 'versao-antiga' WHERE id = ?", [questionId]);

  const stats = await seedContent(db);
  assert.equal(stats.questionsArchived, 1);
  const old = await db.get('SELECT active, code FROM questions WHERE id = ?', [questionId]);
  assert.deepEqual(old, { active: 0, code: null });
  const replacement = await db.get('SELECT id, active FROM questions WHERE code = ?', [original.code]);
  assert.notEqual(replacement.id, questionId);
  assert.equal(await db.value('SELECT COUNT(*) FROM questions WHERE active = 1'), 45);

  // Histórico: a tentativa antiga ainda mostra a questão respondida, com a explicação.
  const detail = await agent.get(`/api/attempts/${attemptId}`).expect(200);
  const answered = detail.body.questions.find((q) => q.id === questionId);
  assert.equal(answered.statement, original.statement);
  assert.ok(answered.answer.explanation);

  // Nova tentativa usa a questão nova, nunca a arquivada.
  const { body } = await agent.post('/api/topics/estatistica/attempts').expect(201);
  const ids = body.questions.map((q) => q.id);
  assert.ok(ids.includes(replacement.id) && !ids.includes(questionId));

  // Rodar de novo não arquiva nem cria mais nada.
  const again = await seedContent(db);
  assert.equal(again.questionsArchived + again.questionsCreated, 0);
});

test('questão alterada que ninguém usou é atualizada no mesmo registro', async () => {
  const { db } = await setupTestApp();
  const q = await db.get("SELECT id FROM questions WHERE code = 'trigonometria-01'");
  await db.run("UPDATE questions SET content_hash = 'x', statement = 'texto antigo' WHERE id = ?", [q.id]);
  const stats = await seedContent(db);
  assert.equal(stats.questionsUpdated, 1);
  const row = await db.get('SELECT id, statement, active FROM questions WHERE code = ?', ['trigonometria-01']);
  assert.equal(row.id, q.id);
  assert.equal(row.active, 1);
  assert.equal(row.statement, 'Qual é o valor de cos 60°?');
  assert.equal(await db.value('SELECT COUNT(*) FROM question_options WHERE question_id = ?', [q.id]), 4);
});

test('questões antigas fora do conteúdo: apagadas se nunca usadas', async () => {
  const { db } = await setupTestApp();
  const topicId = await db.value("SELECT id FROM topics WHERE slug = 'estatistica'");
  const { insertId } = await db.run(
    "INSERT INTO questions (topic_id, position, statement, explanation) VALUES (?, 99, 'Questão antiga', 'x')", [topicId]
  );
  const stats = await seedContent(db);
  assert.equal(stats.questionsDeleted, 1);
  assert.equal(await db.value('SELECT COUNT(*) FROM questions WHERE id = ?', [insertId]), 0);
  void request;
});
