import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explainDbError, checkServerVersion, formatProblem } from '../src/db/diagnostics.js';

const DB = { host: 'localhost', port: 3306, user: 'root' };

function fakeError(code, message = `erro ${code}`) {
  const err = new Error(message);
  err.code = code;
  return err;
}

test('MySQL desligado: explica e dá o caminho no XAMPP e no Workbench', () => {
  const { title, hints } = explainDbError(fakeError('ECONNREFUSED'), DB);
  assert.match(title, /MySQL desligado/);
  assert.match(title, /localhost:3306/);
  assert.ok(hints.some((h) => /XAMPP/.test(h)));
  assert.ok(hints.some((h) => /Workbench|MySQL80/.test(h)));
});

test('MySQL fechou a conexão (desligando ou iniciando): mesma orientação de MySQL desligado', () => {
  const { title } = explainDbError(fakeError('PROTOCOL_CONNECTION_LOST'), DB);
  assert.match(title, /MySQL desligado/);
});

test('senha recusada: aponta DB_PASSWORD no backend/.env', () => {
  const { title, hints } = explainDbError(fakeError('ER_ACCESS_DENIED_ERROR'), DB);
  assert.match(title, /root/);
  assert.ok(hints.some((h) => /DB_PASSWORD/.test(h) && /backend\/\.env/.test(h)));
});

test('senha recusada: avisa que senha com # precisa de aspas no .env', () => {
  const { hints } = explainDbError(fakeError('ER_ACCESS_DENIED_ERROR'), DB);
  assert.ok(hints.some((h) => /#/.test(h) && /aspas/.test(h)));
});

test('sem permissão para criar o banco: sugere usar root', () => {
  const { hints } = explainDbError(fakeError('ER_DBACCESS_DENIED_ERROR'), DB);
  assert.ok(hints.some((h) => /root/.test(h)));
});

test('endereço do MySQL não encontrado: aponta DB_HOST', () => {
  const { hints } = explainDbError(fakeError('ENOTFOUND'), { ...DB, host: 'mysqll' });
  assert.ok(hints.some((h) => /DB_HOST/.test(h)));
});

test('erro de sintaxe na migration: indica MySQL antigo', () => {
  const { title } = explainDbError(fakeError('ER_PARSE_ERROR'), DB);
  assert.match(title, /antig/);
});

test('porta ocupada: explica que o sistema já pode estar aberto', () => {
  const { title, hints } = explainDbError(fakeError('EADDRINUSE'), { ...DB, appPort: 3001 });
  assert.match(title, /3001/);
  assert.ok(hints.some((h) => /PORT/.test(h)));
});

test('erro desconhecido: mantém a mensagem original', () => {
  const { title } = explainDbError(fakeError('XYZ', 'algo estranho aconteceu'), DB);
  assert.match(title, /algo estranho aconteceu/);
});

test('versões do MySQL e do MariaDB (XAMPP)', () => {
  assert.deepEqual(checkServerVersion('8.0.46'), { ok: true, product: 'MySQL', version: '8.0.46', minimum: '8.0.19' });
  assert.equal(checkServerVersion('8.0.18').ok, false);
  assert.equal(checkServerVersion('8.4.3').ok, true);
  assert.equal(checkServerVersion('5.7.44').ok, false);
  const xampp = checkServerVersion('10.4.32-MariaDB');
  assert.deepEqual(xampp, { ok: true, product: 'MariaDB', version: '10.4.32', minimum: '10.2.0' });
  assert.equal(checkServerVersion('10.1.48-MariaDB').ok, false);
  assert.equal(checkServerVersion('5.5.5-10.11.14-MariaDB-0ubuntu0.24.04.1').product, 'MariaDB');
  assert.equal(checkServerVersion('5.5.5-10.11.14-MariaDB-0ubuntu0.24.04.1').ok, true);
});

test('formatProblem junta título e dicas em texto para o terminal', () => {
  const text = formatProblem({ title: 'Título', hints: ['dica 1', 'dica 2'] });
  assert.match(text, /Título/);
  assert.match(text, /dica 1/);
  assert.match(text, /dica 2/);
});
