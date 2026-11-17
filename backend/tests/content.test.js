import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, registerAndLogin } from './helpers.js';

test('rotas de conteúdo exigem login', async () => {
  const { app } = await setupTestApp();
  for (const path of ['/api/subjects', '/api/subjects/matematica', '/api/topics', '/api/topics/trigonometria', '/api/search?q=seno', '/api/progress', '/api/attempts']) {
    const res = await request(app).get(path);
    assert.equal(res.status, 401, path);
  }
});

test('GET /api/subjects lista Matemática com 9 assuntos', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const res = await agent.get('/api/subjects').expect(200);
  assert.equal(res.body.subjects.length, 1);
  assert.equal(res.body.subjects[0].name, 'Matemática');
  assert.equal(res.body.subjects[0].topicCount, 9);
});

test('GET /api/subjects/matematica agrupa os assuntos por ano, na ordem das telas', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body } = await agent.get('/api/subjects/matematica').expect(200);

  const titles = body.subject.years.map((y) => y.topics.map((t) => t.title));
  assert.deepEqual(titles, [
    ['Funções (1º e 2º grau)', 'Progressões (PA e PG)', 'Função Exponencial e Logaritmos'],
    ['Geometria Espacial', 'Trigonometria', 'Análise Combinatória e Probabilidade'],
    ['Geometria Analítica', 'Estatística', 'Matemática Financeira'],
  ]);
  assert.equal(body.subject.years[0].topics[0].progress.status, 'not_started');
  await agent.get('/api/subjects/historia').expect(404);
});

test('GET /api/topics filtra por ano e valida o parâmetro', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body } = await agent.get('/api/topics?year=3').expect(200);
  assert.equal(body.topics.length, 3);
  assert.ok(body.topics.every((t) => t.schoolYear === 3));
  await agent.get('/api/topics?year=4').expect(400);
});

test('GET /api/topics/:slug traz a aula sem questões e sem gabarito', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body } = await agent.get('/api/topics/trigonometria').expect(200);

  assert.equal(body.topic.title, 'Trigonometria');
  assert.ok(body.topic.objective.length > 20);
  const kinds = body.topic.sections.map((s) => s.kind);
  assert.equal(kinds[0], 'explicacao');
  assert.ok(kinds.includes('formulas') && kinds.includes('resumo'));
  assert.ok(kinds.filter((k) => k === 'exemplo').length >= 2);
  assert.equal(body.topic.questionCount, 5);
  const raw = JSON.stringify(body);
  assert.doesNotMatch(raw, /is_correct|isCorrect|correctOption|explanation/);

  await agent.get('/api/topics/nao-existe').expect(404);
  await agent.get('/api/topics/Slug%20Inv%C3%A1lido').expect(400);
});

test('pesquisa ignora acentos e maiúsculas e valida o tamanho', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);

  const semAcento = await agent.get('/api/search?q=funcao').expect(200);
  const comAcento = await agent.get('/api/search?q=FUNÇÃO').expect(200);
  assert.deepEqual(semAcento.body.results.map((r) => r.slug), comAcento.body.results.map((r) => r.slug));
  assert.ok(semAcento.body.results.some((r) => r.slug === 'funcoes-1-e-2-grau'));

  const log = await agent.get('/api/search?q=logaritmo').expect(200);
  assert.deepEqual(log.body.results.map((r) => r.slug), ['funcao-exponencial-e-logaritmos']);

  const juros = await agent.get('/api/search?q=juros compostos').expect(200);
  assert.equal(juros.body.results[0].slug, 'matematica-financeira');

  const nada = await agent.get('/api/search?q=xyzabc').expect(200);
  assert.equal(nada.body.total, 0);

  // Curingas do LIKE são tratados como texto, não como "qualquer coisa".
  const curinga = await agent.get('/api/search?q=%25%25').expect(200);
  assert.equal(curinga.body.total, 0);

  await agent.get('/api/search?q=a').expect(400);
  await agent.get('/api/search').expect(400);
});

test('marcar e desmarcar aula concluída é idempotente', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);

  const first = await agent.put('/api/topics/estatistica/completion').expect(200);
  assert.equal(first.body.progress.lessonCompleted, true);
  assert.equal(first.body.progress.status, 'in_progress');
  await agent.put('/api/topics/estatistica/completion').expect(200);

  const undone = await agent.delete('/api/topics/estatistica/completion').expect(200);
  assert.equal(undone.body.progress.lessonCompleted, false);
  assert.equal(undone.body.progress.status, 'not_started');
  await agent.put('/api/topics/nao-existe/completion').expect(404);
});
