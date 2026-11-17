// npm run content:export-sql — gera os arquivos SQL da versão XAMPP (pasta xampp/):
//   xampp/api/sql/estrutura.sql  tabelas (estado final das migrations) + login_attempts
//   xampp/api/sql/conteudo.sql   matéria, 9 aulas, seções, 45 questões e alternativas
// Como funciona: cria um banco temporário no MySQL configurado em backend/.env, aplica as
// migrations e a carga de conteúdo da versão Node, copia a estrutura e os dados e apaga o banco.
// Rode de novo sempre que o conteúdo em backend/src/db/seed/content/ mudar.
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { BACKEND_ROOT, config } from '../../config.js';
import { createDb, dropDatabase } from '../connection.js';
import { runMigrations } from '../migrate.js';
import { seedContent } from './index.js';

const OUT_DIR = path.resolve(BACKEND_ROOT, '..', 'xampp', 'api', 'sql');
const TEMP_DB = { ...config.db, database: 'simple_education_export_tmp' };

// Ordem de criação respeita as chaves estrangeiras.
const TABLES = [
  'users', 'sessions', 'subjects', 'topics', 'topic_sections', 'questions',
  'question_options', 'attempts', 'attempt_answers', 'lesson_completions', 'attempt_questions',
];
const CONTENT_TABLES = ['subjects', 'topics', 'topic_sections', 'questions', 'question_options'];

const LOGIN_ATTEMPTS = `CREATE TABLE \`login_attempts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`ip\` varchar(45) NOT NULL,
  \`email\` varchar(120) NOT NULL,
  \`attempted_at\` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`idx_login_attempts\` (\`ip\`,\`email\`,\`attempted_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

const header = (what) => [
  `-- ${what} da versão XAMPP do Simple Education.`,
  '-- Gerado por "npm run content:export-sql" (backend/src/db/seed/export-sql.js). Não edite à mão.',
  '-- Executado automaticamente por xampp/api/instalar.php no primeiro acesso.',
  '',
];

await dropDatabase(TEMP_DB);
await runMigrations(TEMP_DB);
const db = createDb(TEMP_DB);
await seedContent(db);
await db.close();

const conn = await mysql.createConnection({ ...TEMP_DB, charset: 'utf8mb4', dateStrings: true });
try {
  const structure = header('Estrutura do banco');
  for (const table of TABLES) {
    const [[row]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    // AUTO_INCREMENT=N é só o contador do banco temporário: não faz parte da estrutura.
    const create = row['Create Table'].replace(/ AUTO_INCREMENT=\d+/, '');
    structure.push(`${create};`, '');
  }
  structure.push(`${LOGIN_ATTEMPTS};`, '');

  const content = header('Conteúdo pedagógico');
  for (const table of CONTENT_TABLES) {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\` ORDER BY 1`);
    for (const r of rows) {
      const cols = Object.keys(r).map((c) => `\`${c}\``).join(', ');
      content.push(conn.format(`INSERT INTO \`${table}\` (${cols}) VALUES (?);`, [Object.values(r)]));
    }
    content.push('');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'estrutura.sql'), structure.join('\n'));
  fs.writeFileSync(path.join(OUT_DIR, 'conteudo.sql'), content.join('\n'));
  console.log(`Gerados em ${path.relative(path.resolve(BACKEND_ROOT, '..'), OUT_DIR)}: estrutura.sql (${TABLES.length + 1} tabelas) e conteudo.sql.`);
} finally {
  await conn.end();
  await dropDatabase(TEMP_DB);
}
