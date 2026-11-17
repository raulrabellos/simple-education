import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, registerAndLogin, otherStudent, answerKey, validStudent, userIdByEmail } from './helpers.js';

async function doAttempt(agent, db, slug, correctCount) {
  const { body: start } = await agent.post(`/api/topics/${slug}/attempts`).expect(201);
  for (const [i, q] of start.questions.entries()) {
    const key = (await answerKey(db, q.id));
    await agent.post(`/api/attempts/${start.attempt.id}/answers`)
      .send({ questionId: q.id, optionId: i < correctCount ? key.correct : key.wrong }).expect(201);
  }
  return (await agent.post(`/api/attempts/${start.attempt.id}/finish`).expect(200)).body.attempt;
}

test('progresso diferencia aula concluída, exercícios respondidos e acertados', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);

  // Só fez exercícios (60%): em andamento, não dominado, aula não concluída.
  await doAttempt(agent, db, 'trigonometria', 3);
  // Concluiu a aula e fez exercícios com 80%: concluído.
  await agent.put('/api/topics/estatistica/completion').expect(200);
  await doAttempt(agent, db, 'estatistica', 4);
  // Só concluiu a aula: em andamento.
  await agent.put('/api/topics/geometria-espacial/completion').expect(200);

  const { body } = await agent.get('/api/progress').expect(200);
  const byslug = Object.fromEntries(body.topics.map((t) => [t.topic.slug, t.progress]));

  assert.equal(byslug.trigonometria.status, 'in_progress');
  assert.equal(byslug.trigonometria.lessonCompleted, false);
  assert.equal(byslug.trigonometria.bestScore, 60);
  assert.equal(byslug.trigonometria.mastered, false);

  assert.equal(byslug.estatistica.status, 'completed');
  assert.equal(byslug['geometria-espacial'].status, 'in_progress');
  assert.equal(byslug['geometria-espacial'].attemptsStarted, 0);
  assert.equal(byslug['funcoes-1-e-2-grau'].status, 'not_started');

  assert.equal(body.masteryThreshold, 70);
  assert.equal(body.totals.topicsTotal, 9);
  assert.equal(body.totals.lessonsCompleted, 2);
  assert.equal(body.totals.topicsCompleted, 1);
  assert.equal(body.totals.attemptsFinished, 2);
  assert.equal(body.totals.questionsAnswered, 10);
  assert.equal(body.totals.correctAnswers, 7);
  assert.equal(body.totals.wrongAnswers, 3);
  assert.equal(body.totals.accuracy, 70);
  assert.equal(body.byYear[1].schoolYear, 2);
  assert.equal(body.byYear[1].topicsTotal, 3);
  assert.ok(['trigonometria', 'geometria-espacial'].includes(body.continueStudying.slug));
});

test('melhor nota considera todas as tentativas finalizadas; tentativa aberta não conta', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  await doAttempt(agent, db, 'trigonometria', 5);
  await doAttempt(agent, db, 'trigonometria', 1);
  await agent.post('/api/topics/trigonometria/attempts').expect(201); // aberta, sem finalizar

  const { body } = await agent.get('/api/topics/trigonometria').expect(200);
  assert.equal(body.topic.progress.bestScore, 100);
  assert.equal(body.topic.progress.lastScore, 20);
  assert.equal(body.topic.progress.attemptsStarted, 3);
  assert.equal(body.topic.progress.attemptsFinished, 2);
});

test('progresso de um aluno não aparece para outro', async () => {
  const { app, db } = await setupTestApp();
  const ana = await registerAndLogin(app);
  const bruno = await registerAndLogin(app, otherStudent);
  await doAttempt(ana, db, 'estatistica', 5);
  await ana.put('/api/topics/estatistica/completion').expect(200);

  const { body } = await bruno.get('/api/progress').expect(200);
  assert.equal(body.totals.questionsAnswered, 0);
  assert.equal(body.totals.lessonsCompleted, 0);
  assert.equal(body.continueStudying, null);
});

test('PATCH /api/users/me altera nome e ano do próprio aluno', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);

  const res = await agent.patch('/api/users/me').send({ name: '  Ana   Clara  ', schoolYear: 3 }).expect(200);
  assert.equal(res.body.user.name, 'Ana Clara');
  assert.equal(res.body.user.schoolYear, 3);

  const onlyYear = await agent.patch('/api/users/me').send({ schoolYear: 1 }).expect(200);
  assert.equal(onlyYear.body.user.name, 'Ana Clara');

  const cleared = await agent.patch('/api/users/me').send({ schoolYear: null }).expect(200);
  assert.equal(cleared.body.user.schoolYear, null);
  await agent.patch('/api/users/me').send({ schoolYear: 1 }).expect(200);

  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.schoolYear, 1);
});

test('PATCH /api/users/me rejeita campos inválidos, e-mail, senha e id de outro aluno', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  await registerAndLogin(app, otherStudent);

  await agent.patch('/api/users/me').send({ schoolYear: 4 }).expect(400);
  await agent.patch('/api/users/me').send({ name: '' }).expect(400);
  await agent.patch('/api/users/me').send({}).expect(400);
  const brunoId = await userIdByEmail(db, otherStudent.email);
  const extra = await agent.patch('/api/users/me').send({ id: brunoId, name: 'Invasor' }).expect(400);
  assert.ok(extra.body.error.details.id);
  await agent.patch('/api/users/me').send({ email: 'novo@example.com' }).expect(400);
  await agent.patch('/api/users/me').send({ password: 'novaSenha123' }).expect(400);

  const bruno = await db.get('SELECT name FROM users WHERE id = ?', [brunoId]);
  assert.equal(bruno.name, otherStudent.name);
  await request(app).patch('/api/users/me').send({ name: 'Sem login' }).expect(401);
});

test('respostas nunca expõem senha, hash ou token de sessão', async () => {
  const { app, db } = await setupTestApp();
  const res = await request(app).post('/api/auth/register').send(validStudent).expect(201);
  const cookie = res.headers['set-cookie'][0].split(';')[0];
  const token = cookie.split('=')[1];
  const hash = await db.value('SELECT password_hash FROM users WHERE id = ?', [res.body.user.id]);

  for (const path of ['/api/auth/me', '/api/progress', '/api/subjects']) {
    const body = JSON.stringify((await request(app).get(path).set('Cookie', cookie)).body);
    assert.ok(!body.includes(hash) && !body.includes(token) && !body.includes(validStudent.password), path);
  }
  const stored = await db.value('SELECT id_hash FROM sessions');
  assert.notEqual(stored, token, 'o banco guarda apenas o hash do token');
});
