import { before, after } from 'node:test';
import request from 'supertest';
import { config } from '../src/config.js';
import { createDb, dropDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedContent } from '../src/db/seed/index.js';
import { createApp } from '../src/app.js';

/*
 * Os testes usam um banco MySQL SEPARADO (padrão: simple_education_test).
 * Proteções para nunca apagar dados reais:
 * - o nome do banco de teste precisa terminar em "_test";
 * - ele não pode ser o mesmo banco configurado em DB_NAME.
 * Cada arquivo de teste recria esse banco do zero; cada teste limpa os alunos.
 */
export const testDbConfig = { ...config.db, database: config.testDbName };

if (!testDbConfig.database.endsWith('_test') || testDbConfig.database === config.db.database) {
  throw new Error(`Banco de teste inválido ("${testDbConfig.database}"): use um nome terminado em "_test", diferente de DB_NAME.`);
}

let db;

before(async () => {
  await dropDatabase(testDbConfig);
  await runMigrations(testDbConfig);
  db = createDb(testDbConfig);
  await seedContent(db);
});

after(async () => {
  await db?.close();
});

/**
 * Devolve uma aplicação nova ligada ao banco de teste, sem nenhum aluno cadastrado.
 * O conteúdo (matéria, assuntos e questões) é mantido.
 */
export async function setupTestApp(overrides = {}) {
  await db.run('DELETE FROM users'); // apaga em cascata sessões, tentativas, respostas e aulas concluídas
  const app = createApp({ db, config: { ...config, serveFrontend: false, logRequests: false, ...overrides } });
  return { db, app };
}

export const validStudent = {
  name: 'Ana Souza',
  email: 'ana@example.com',
  password: 'senhaSegura123',
  schoolYear: 2,
};

export const otherStudent = {
  name: 'Bruno Lima',
  email: 'bruno@example.com',
  password: 'outraSenha456',
  schoolYear: 1,
};

/** Cadastra um aluno e devolve um "agente" que mantém o cookie de sessão. */
export async function registerAndLogin(app, student = validStudent) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(student).expect(201);
  return agent;
}

/** Busca no banco a alternativa correta e uma errada (usado só pelos testes). */
export async function answerKey(db, questionId) {
  const options = await db.all('SELECT id, is_correct FROM question_options WHERE question_id = ?', [questionId]);
  return {
    correct: options.find((o) => o.is_correct === 1).id,
    wrong: options.find((o) => o.is_correct === 0).id,
  };
}

/** Id do aluno pelo e-mail (os testes não dependem de ids fixos). */
export async function userIdByEmail(db, email) {
  return db.value('SELECT id FROM users WHERE email = ?', [email]);
}
