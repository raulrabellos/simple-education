import { config } from './config.js';
import { createDb } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { seedContent } from './db/seed/index.js';
import { purgeExpiredSessions } from './services/sessionService.js';
import { createApp } from './app.js';
import { explainDbError, formatProblem } from './db/diagnostics.js';

try {
  // Ao iniciar, garante que o banco existe, está atualizado e tem o conteúdo inicial.
  const applied = await runMigrations(config.db);
  if (applied.length) console.log(`Migrations aplicadas: ${applied.join(', ')}`);

  const db = createDb(config.db);
  const seed = await seedContent(db); // sincroniza o conteúdo sem apagar dados de alunos
  if (seed.questionsCreated || seed.questionsUpdated || seed.questionsArchived) {
    console.log(`Conteúdo sincronizado: ${seed.questionsCreated} questões criadas, ${seed.questionsUpdated} atualizadas, ${seed.questionsArchived} arquivadas.`);
  }
  await purgeExpiredSessions(db);

  const app = createApp({ db, config: { ...config, serveFrontend: true } });
  // No Express 5 o callback do listen também recebe o erro (ex.: porta ocupada).
  app.listen(config.port, (err) => {
    if (err) fail(err);
    const line = '='.repeat(60);
    console.log(`\n${line}`);
    console.log(`  Simple Education rodando em http://localhost:${config.port}`);
    console.log('  Abra esse endereço no navegador.');
    console.log('  Para parar o sistema, aperte Ctrl+C neste terminal.');
    console.log(`${line}\n`);
    console.log(`API em http://localhost:${config.port}/api`);
  });
} catch (err) {
  fail(err);
}

function fail(err) {
  const problem = explainDbError(err, { ...config.db, appPort: config.port });
  console.error(`Não foi possível iniciar.\n${formatProblem(problem)}`);
  process.exit(1);
}
