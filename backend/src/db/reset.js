// npm run db:reset
// ATENÇÃO: apaga o banco inteiro (incluindo alunos e histórico) e recria tudo do zero.
// Use apenas em desenvolvimento ou para preparar a apresentação.
// Em produção (NODE_ENV=production) só roda com: npm run db:reset -- --force
import { config } from '../config.js';
import { createDb, dropDatabase } from './connection.js';
import { runMigrations } from './migrate.js';
import { seedContent } from './seed/index.js';
import { explainDbError, formatProblem } from './diagnostics.js';

if (config.isProduction && !process.argv.includes('--force')) {
  console.error('Recusado: NODE_ENV=production. Este comando apaga todos os dados. Use --force se tiver certeza.');
  process.exit(1);
}

try {
  await dropDatabase(config.db);
  const applied = await runMigrations(config.db);
  const db = createDb(config.db);
  await seedContent(db);
  await db.close();

  console.log(`Banco "${config.db.database}" recriado.`);
  console.log(`Migrations aplicadas: ${applied.join(', ')}`);
  console.log('Conteúdo pedagógico carregado.');
} catch (err) {
  console.error(`Não foi possível recriar o banco.\n${formatProblem(explainDbError(err, config.db))}`);
  process.exit(1);
}
