import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, validStudent, registerAndLogin } from './helpers.js';

test('GET /api/health responde ok', async () => {
  const { app } = await setupTestApp();
  const res = await request(app).get('/api/health').expect(200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('cadastro cria o aluno, define cookie HttpOnly e não devolve a senha', async () => {
  const { app, db } = await setupTestApp();
  const res = await request(app).post('/api/auth/register').send(validStudent).expect(201);

  assert.equal(typeof res.body.user.id, 'number');
  assert.deepEqual({ ...res.body.user, id: undefined }, { id: undefined, name: 'Ana Souza', email: 'ana@example.com', schoolYear: 2 });
  const cookie = res.headers['set-cookie'].join(';');
  assert.match(cookie, /se_session=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);

  const stored = await db.value('SELECT password_hash FROM users WHERE id = ?', [res.body.user.id]);
  assert.notEqual(stored, validStudent.password);
  assert.doesNotMatch(JSON.stringify(res.body), /senhaSegura123|password/);
});

test('cadastro com dados inválidos retorna 400 com erro por campo', async () => {
  const { app } = await setupTestApp();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'A', email: 'nao-e-email', password: '123', schoolYear: 5 })
    .expect(400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(Object.keys(res.body.error.details).sort(), ['email', 'name', 'password', 'schoolYear']);
});

test('ano escolar é opcional no cadastro (plataforma aberta a não estudantes)', async () => {
  const { app } = await setupTestApp();
  const semAno = await request(app).post('/api/auth/register')
    .send({ name: 'Visitante', email: 'visitante@example.com', password: 'senhaSegura123' }).expect(201);
  assert.equal(semAno.body.user.schoolYear, null);
  const vazio = await request(app).post('/api/auth/register')
    .send({ name: 'Visitante 2', email: 'v2@example.com', password: 'senhaSegura123', schoolYear: '' }).expect(201);
  assert.equal(vazio.body.user.schoolYear, null);
});

test('cadastro com e-mail repetido (mesmo com maiúsculas) retorna 409', async () => {
  const { app } = await setupTestApp();
  await request(app).post('/api/auth/register').send(validStudent).expect(201);
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...validStudent, email: 'ANA@example.com' })
    .expect(409);
  assert.equal(res.body.error.code, 'CONFLICT');
});

test('/me exige sessão e devolve o aluno logado', async () => {
  const { app } = await setupTestApp();
  await request(app).get('/api/auth/me').expect(401);

  const agent = await registerAndLogin(app);
  const res = await agent.get('/api/auth/me').expect(200);
  assert.equal(res.body.user.name, 'Ana Souza');
});

test('login com senha errada retorna 401 com mensagem genérica', async () => {
  const { app } = await setupTestApp();
  await request(app).post('/api/auth/register').send(validStudent);

  const wrongPassword = await request(app)
    .post('/api/auth/login').send({ email: validStudent.email, password: 'outraSenha123' }).expect(401);
  const unknownEmail = await request(app)
    .post('/api/auth/login').send({ email: 'ninguem@example.com', password: 'outraSenha123' }).expect(401);
  assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
});

test('login correto cria sessão válida', async () => {
  const { app } = await setupTestApp();
  await request(app).post('/api/auth/register').send(validStudent);

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'Ana@Example.com', password: validStudent.password }).expect(200);
  await agent.get('/api/auth/me').expect(200);
});

test('logout apaga a sessão no banco e o cookie deixa de funcionar', async () => {
  const { app, db } = await setupTestApp();
  const register = await request(app).post('/api/auth/register').send(validStudent);
  const cookie = register.headers['set-cookie'][0].split(';')[0];

  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
  await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(204);
  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
  assert.equal(await db.value('SELECT COUNT(*) FROM sessions'), 0);
});

test('sessão vencida não é aceita', async () => {
  const { app, db } = await setupTestApp();
  const register = await request(app).post('/api/auth/register').send(validStudent);
  const cookie = register.headers['set-cookie'][0].split(';')[0];

  await db.run('UPDATE sessions SET expires_at = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)');
  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
});

test('bloqueia login após 5 tentativas erradas (429)', async () => {
  const { app } = await setupTestApp();
  await request(app).post('/api/auth/register').send(validStudent);
  const wrong = { email: validStudent.email, password: 'errada12345' };

  for (let i = 0; i < 5; i++) await request(app).post('/api/auth/login').send(wrong).expect(401);
  await request(app).post('/api/auth/login').send(wrong).expect(429);
  // Nem a senha certa passa enquanto o bloqueio está ativo.
  await request(app).post('/api/auth/login').send({ ...wrong, password: validStudent.password }).expect(429);
});

test('requisição de outra origem é bloqueada (403)', async () => {
  const { app } = await setupTestApp();
  await request(app)
    .post('/api/auth/register')
    .set('Origin', 'http://site-malicioso.com')
    .send(validStudent)
    .expect(403);
});

test('JSON malformado retorna 400 e rota inexistente retorna 404', async () => {
  const { app } = await setupTestApp();
  await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":')
    .expect(400);
  await request(app).get('/api/nao-existe').expect(404);
});

test('GET /api/auth/session responde 200 com user null sem login e com o aluno quando logado', async () => {
  const { app } = await setupTestApp();
  const anon = await request(app).get('/api/auth/session').expect(200);
  assert.deepEqual(anon.body, { user: null });
  const agent = await registerAndLogin(app);
  const logged = await agent.get('/api/auth/session').expect(200);
  assert.equal(logged.body.user.email, validStudent.email);
  await agent.post('/api/auth/logout').expect(204);
  assert.deepEqual((await agent.get('/api/auth/session').expect(200)).body, { user: null });
});
