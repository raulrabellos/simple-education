import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, validStudent, registerAndLogin } from './helpers.js';

test('CORS: libera apenas origens configuradas, com credenciais', async () => {
  const { app } = await setupTestApp({ corsOrigins: ['http://localhost:5173'] });

  const allowed = await request(app).options('/api/auth/login')
    .set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-credentials'], 'true');

  const denied = await request(app).get('/api/health').set('Origin', 'http://outro-site.com');
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('origem liberada pode alterar dados; origem estranha recebe 403', async () => {
  const { app } = await setupTestApp({ corsOrigins: ['http://localhost:5173'] });
  await request(app).post('/api/auth/register').set('Origin', 'http://localhost:5173').send(validStudent).expect(201);

  const agent = await registerAndLogin(app, { ...validStudent, email: 'c@example.com' });
  await agent.patch('/api/users/me').set('Origin', 'http://site-malicioso.com').send({ name: 'Hackeado' }).expect(403);
  await agent.post('/api/auth/logout').set('Origin', 'null').expect(403);
  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.name, validStudent.name);
});

test('cookie fica Secure quando configurado para produção', async () => {
  const { app } = await setupTestApp({ cookieSecure: true });
  const res = await request(app).post('/api/auth/register').send(validStudent).expect(201);
  assert.match(res.headers['set-cookie'][0], /;\s*Secure/i);

  const { app: localApp } = await setupTestApp({ cookieSecure: false });
  const local = await request(localApp).post('/api/auth/register').send(validStudent).expect(201);
  assert.doesNotMatch(local.headers['set-cookie'][0], /;\s*Secure/i);
});

test('respostas da API não são guardadas em cache e têm cabeçalhos de segurança', async () => {
  const { app } = await setupTestApp();
  const res = await request(app).get('/api/health').expect(200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('erros seguem o formato padrão { error: { code, message } }', async () => {
  const { app } = await setupTestApp();
  const res = await request(app).get('/api/progress').expect(401);
  assert.deepEqual(Object.keys(res.body), ['error']);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
  assert.equal(typeof res.body.error.message, 'string');

  const big = await request(app).post('/api/auth/login')
    .send({ email: 'a@a.com', password: 'x'.repeat(30_000) }).expect(413);
  assert.equal(big.body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('limite de login é configurável', async () => {
  const { app } = await setupTestApp({ loginMaxAttempts: 2 });
  await request(app).post('/api/auth/register').send(validStudent);
  const wrong = { email: validStudent.email, password: 'errada12345' };
  await request(app).post('/api/auth/login').send(wrong).expect(401);
  await request(app).post('/api/auth/login').send(wrong).expect(401);
  const blocked = await request(app).post('/api/auth/login').send(wrong).expect(429);
  assert.ok(Number(blocked.headers['retry-after']) > 0);
});
