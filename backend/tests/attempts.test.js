import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, registerAndLogin, otherStudent, answerKey } from './helpers.js';

const SLUG = 'matematica-financeira';

test('iniciar tentativa devolve questões sem gabarito nem explicação', async () => {
  const { app } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);

  assert.equal(body.attempt.status, 'in_progress');
  assert.equal(body.attempt.totalQuestions, 5);
  assert.equal(body.attempt.scorePercent, null);
  assert.equal(body.questions.length, 5);
  assert.equal(body.questions[0].options.length, 4);
  assert.ok(['facil', 'medio', 'dificil'].includes(body.questions[0].difficulty));
  assert.deepEqual(Object.keys(body.questions[0].options[0]).sort(), ['id', 'letter', 'text']);
  assert.doesNotMatch(JSON.stringify(body), /is_correct|isCorrect|correct(Option|Letter)|explanation/);
});

test('responder: correção no servidor, explicação só depois de responder', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body: start } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);
  const attemptId = start.attempt.id;
  const [q1, q2] = start.questions;

  const right = await agent.post(`/api/attempts/${attemptId}/answers`)
    .send({ questionId: q1.id, optionId: (await answerKey(db, q1.id)).correct }).expect(201);
  assert.equal(right.body.isCorrect, true);
  assert.ok(right.body.explanation.length > 0);
  assert.equal(right.body.attempt.correct, 1);

  const wrong = await agent.post(`/api/attempts/${attemptId}/answers`)
    .send({ questionId: q2.id, optionId: (await answerKey(db, q2.id)).wrong }).expect(201);
  assert.equal(wrong.body.isCorrect, false);
  assert.equal(wrong.body.correctOptionId, (await answerKey(db, q2.id)).correct);
  assert.equal(wrong.body.attempt.wrong, 1);

  // Detalhe: questões respondidas trazem gabarito; as não respondidas, não.
  const { body: detail } = await agent.get(`/api/attempts/${attemptId}`).expect(200);
  assert.ok(detail.questions[0].answer.explanation);
  assert.ok(detail.questions[1].answer.correctOptionId);
  for (const q of detail.questions.slice(2)) {
    assert.equal(q.answer, null);
    assert.doesNotMatch(JSON.stringify(q), /explanation|correct/);
  }
});

test('o frontend não consegue enviar a nota nem responder duas vezes', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body: start } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);
  const q = start.questions[0];
  const { wrong } = (await answerKey(db, q.id));

  // Campos extras como isCorrect/score são ignorados: quem decide é o servidor.
  const res = await agent.post(`/api/attempts/${start.attempt.id}/answers`)
    .send({ questionId: q.id, optionId: wrong, isCorrect: true, correctCount: 5, scorePercent: 100 }).expect(201);
  assert.equal(res.body.isCorrect, false);
  assert.equal(res.body.attempt.correct, 0);

  const again = await agent.post(`/api/attempts/${start.attempt.id}/answers`)
    .send({ questionId: q.id, optionId: (await answerKey(db, q.id)).correct }).expect(409);
  assert.equal(again.body.error.code, 'ALREADY_ANSWERED');
});

test('valida questão e alternativa que não pertencem à tentativa', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body: start } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);
  const id = start.attempt.id;

  const otherTopicQuestion = await db.value(
    "SELECT q.id FROM questions q JOIN topics t ON t.id = q.topic_id WHERE t.slug = 'trigonometria' LIMIT 1"
  );
  await agent.post(`/api/attempts/${id}/answers`)
    .send({ questionId: otherTopicQuestion, optionId: (await answerKey(db, otherTopicQuestion)).correct }).expect(400);

  const q1 = start.questions[0];
  const q2 = start.questions[1];
  await agent.post(`/api/attempts/${id}/answers`)
    .send({ questionId: q1.id, optionId: (await answerKey(db, q2.id)).correct }).expect(400);
  await agent.post(`/api/attempts/${id}/answers`).send({ questionId: 'abc', optionId: 1 }).expect(400);
  await agent.post(`/api/attempts/${id}/answers`).send({}).expect(400);
  await agent.post('/api/attempts/999999/answers').send({ questionId: q1.id, optionId: 1 }).expect(404);
});

test('finalizar calcula a nota no servidor, é idempotente e bloqueia novas respostas', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);
  const { body: start } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);
  const id = start.attempt.id;

  // 4 corretas, 1 sem responder → 80%.
  for (const q of start.questions.slice(0, 4)) {
    await agent.post(`/api/attempts/${id}/answers`).send({ questionId: q.id, optionId: (await answerKey(db, q.id)).correct }).expect(201);
  }
  const { body } = await agent.post(`/api/attempts/${id}/finish`).expect(200);
  assert.equal(body.attempt.status, 'finished');
  assert.equal(body.attempt.correct, 4);
  assert.equal(body.attempt.unanswered, 1);
  assert.equal(body.attempt.scorePercent, 80);
  assert.equal(body.attempt.mastered, true);

  const again = await agent.post(`/api/attempts/${id}/finish`).expect(200);
  assert.equal(again.body.attempt.finishedAt, body.attempt.finishedAt);

  const last = start.questions[4];
  const late = await agent.post(`/api/attempts/${id}/answers`)
    .send({ questionId: last.id, optionId: (await answerKey(db, last.id)).correct }).expect(409);
  assert.equal(late.body.error.code, 'ATTEMPT_FINISHED');

  // Mesmo finalizada, a questão não respondida continua sem gabarito.
  const { body: detail } = await agent.get(`/api/attempts/${id}`).expect(200);
  assert.equal(detail.questions[4].answer, null);
});

test('repetir os exercícios cria nova tentativa e preserva o histórico', async () => {
  const { app, db } = await setupTestApp();
  const agent = await registerAndLogin(app);

  const scores = [];
  for (const correctTarget of [2, 5]) {
    const { body: start } = await agent.post(`/api/topics/${SLUG}/attempts`).expect(201);
    for (const [i, q] of start.questions.entries()) {
      const key = (await answerKey(db, q.id));
      await agent.post(`/api/attempts/${start.attempt.id}/answers`)
        .send({ questionId: q.id, optionId: i < correctTarget ? key.correct : key.wrong }).expect(201);
    }
    const { body } = await agent.post(`/api/attempts/${start.attempt.id}/finish`).expect(200);
    scores.push(body.attempt.scorePercent);
  }
  assert.deepEqual(scores, [40, 100]);

  const history = await agent.get(`/api/attempts?topic=${SLUG}`).expect(200);
  assert.equal(history.body.total, 2);
  assert.deepEqual(history.body.items.map((a) => a.scorePercent), [100, 40]); // mais recente primeiro

  const page = await agent.get('/api/attempts?limit=1&offset=1').expect(200);
  assert.equal(page.body.items.length, 1);
  await agent.get('/api/attempts?limit=0').expect(400);
});

test('um aluno não acessa nem altera tentativas de outro aluno', async () => {
  const { app } = await setupTestApp();
  const ana = await registerAndLogin(app);
  const bruno = await registerAndLogin(app, otherStudent);

  const { body: start } = await ana.post(`/api/topics/${SLUG}/attempts`).expect(201);
  const id = start.attempt.id;
  const q = start.questions[0];

  await bruno.get(`/api/attempts/${id}`).expect(404);
  await bruno.post(`/api/attempts/${id}/answers`).send({ questionId: q.id, optionId: q.options[0].id }).expect(404);
  await bruno.post(`/api/attempts/${id}/finish`).expect(404);

  const brunoHistory = await bruno.get('/api/attempts').expect(200);
  assert.equal(brunoHistory.body.total, 0);

  // A tentativa da Ana continua intacta.
  const anaDetail = await ana.get(`/api/attempts/${id}`).expect(200);
  assert.equal(anaDetail.body.attempt.status, 'in_progress');
  assert.equal(anaDetail.body.attempt.answered, 0);
});
