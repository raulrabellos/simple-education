// npm run verificar — confere, passo a passo, se o computador está pronto para
// rodar o Simple Education e explica em português o que fazer em cada problema.
// Funciona mesmo antes do "npm install" (só usa módulos nativos do Node até
// confirmar que as dependências existem).
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, 'backend', '.env');
const MIN_NODE_MAJOR = 22;

const ok = (msg) => console.log(`  ✔ ${msg}`);
const warn = (msg) => console.log(`  ! ${msg}`);
function fail(title, hints = []) {
  console.log(`  ✖ ${title}`);
  for (const h of hints) console.log(`      → ${h}`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

/**
 * Executa todas as conferências e mostra o resultado de cada uma.
 * @returns {Promise<boolean>} true se o sistema pode ser iniciado.
 */
export async function runChecks() {
  console.log('\nConferindo se está tudo pronto para rodar o Simple Education...\n');

  // 1. Node.js
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < MIN_NODE_MAJOR) {
    fail(`Node.js ${process.versions.node} é antigo: o sistema precisa do Node.js ${MIN_NODE_MAJOR} ou mais recente.`, [
      'Baixe a versão "LTS" em https://nodejs.org, instale, feche e abra o VS Code de novo.',
    ]);
    return false;
  }
  ok(`Node.js ${process.versions.node}`);

  // 2. Dependências (npm install)
  let mysql;
  try {
    mysql = (await import('mysql2/promise')).default;
  } catch {
    fail('As dependências do projeto não estão instaladas.', [
      'No terminal, dentro da pasta do projeto, rode: npm install',
    ]);
    return false;
  }
  ok('Dependências instaladas');

  // 3. Configuração (backend/.env)
  const { config } = await import('../backend/src/config.js');
  const { explainDbError, checkServerVersion } = await import('../backend/src/db/diagnostics.js');
  const { createDatabaseIfMissing } = await import('../backend/src/db/connection.js');
  const db = config.db;
  const access = `usuário "${db.user}", ${db.password ? 'com senha' : 'senha vazia'}, ${db.host}:${db.port}`;
  if (fs.existsSync(ENV_FILE)) {
    ok(`Configuração lida de backend/.env (${access})`);
  } else {
    warn(`Arquivo backend/.env não encontrado: usando o padrão do XAMPP (${access}).`);
    console.log('      → Se o seu MySQL tem senha (MySQL Workbench/Server), rode "npm run iniciar" uma vez para criar o backend/.env e coloque a senha em DB_PASSWORD.');
  }

  // 4. Conexão com o MySQL e 5. versão
  let conn;
  try {
    conn = await mysql.createConnection({ host: db.host, port: db.port, user: db.user, password: db.password, connectTimeout: 5000 });
  } catch (err) {
    const { title, hints } = explainDbError(err, db);
    fail(title, hints);
    return false;
  }
  try {
    const [[row]] = await conn.query('SELECT VERSION() AS version');
    const v = checkServerVersion(row.version);
    ok(`Conectado ao MySQL em ${db.host}:${db.port}`);
    if (!v.ok) {
      fail(`${v.product} ${v.version} é antigo: o sistema precisa de ${v.product} ${v.minimum} ou mais recente.`, [
        'XAMPP: instale uma versão recente do XAMPP (8.x), que já vem com um MariaDB compatível.',
        'MySQL Server: instale o MySQL 8.0 (ou mais recente) pelo MySQL Installer.',
      ]);
      return false;
    }
    ok(`Versão compatível: ${v.product} ${v.version}`);
  } finally {
    await conn.end();
  }

  // 6. Permissão para criar o banco (o servidor cria as tabelas sozinho ao iniciar)
  try {
    await createDatabaseIfMissing(db);
    ok(`Banco "${db.database}" disponível`);
  } catch (err) {
    const { title, hints } = explainDbError(err, db);
    fail(title, hints);
    return false;
  }

  // 7. Porta do servidor
  if (!(await isPortFree(config.port))) {
    const { title, hints } = explainDbError({ code: 'EADDRINUSE' }, { ...db, appPort: config.port });
    fail(title, hints);
    return false;
  }
  ok(`Porta ${config.port} livre`);
  return true;
}

// Execução direta: npm run verificar
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const ready = await runChecks();
  console.log(ready
    ? '\nTudo pronto! Para abrir o sistema, rode: npm run iniciar\n'
    : '\nCorrija o item marcado com ✖ e rode "npm run verificar" de novo.\n');
  process.exitCode = ready ? 0 : 1;
}
