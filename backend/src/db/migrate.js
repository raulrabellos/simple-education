import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { createDatabaseIfMissing, migrationConnection } from './connection.js';
import { explainDbError, formatProblem } from './diagnostics.js';

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * Cria o banco (se não existir) e aplica, em ordem, as migrations ainda não
 * registradas em schema_migrations. Retorna a lista aplicada nesta execução.
 * Observação: no MySQL, comandos CREATE/ALTER não podem ser desfeitos por transação;
 * se uma migration falhar no meio, corrija o arquivo e recrie o banco (npm run db:reset).
 */
export async function runMigrations(dbConfig) {
  await createDatabaseIfMissing(dbConfig);
  const conn = await migrationConnection(dbConfig);
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(100) NOT NULL PRIMARY KEY,
      applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [rows] = await conn.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.version));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    const done = [];

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
      done.push(file);
    }
    return done;
  } finally {
    await conn.end();
  }
}

// Execução direta: npm run db:migrate
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const done = await runMigrations(config.db);
    console.log(done.length ? `Migrations aplicadas: ${done.join(', ')}` : 'Banco já está atualizado.');
  } catch (err) {
    console.error(`Não foi possível preparar o banco.\n${formatProblem(explainDbError(err, config.db))}`);
    process.exit(1);
  }
}
