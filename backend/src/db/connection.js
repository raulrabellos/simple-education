import mysql from 'mysql2/promise';

const VALID_DB_NAME = /^[A-Za-z0-9_]{1,64}$/;

function assertDbName(name) {
  if (!VALID_DB_NAME.test(name)) throw new Error(`Nome de banco inválido: ${name}`);
}

/**
 * Envolve o pool (ou uma conexão de transação) com funções simples.
 * Todas recebem o SQL com "?" e os valores separados: o mysql2 escapa cada valor,
 * então nada digitado pelo usuário é concatenado diretamente no SQL.
 */
function wrap(executor) {
  const db = {
    /** Todas as linhas do resultado. */
    async all(sql, params = []) {
      const [rows] = await executor.query(sql, params);
      return rows;
    },
    /** Primeira linha, ou null. */
    async get(sql, params = []) {
      return (await db.all(sql, params))[0] ?? null;
    },
    /** Primeiro valor da primeira linha (ex.: SELECT COUNT(*)), ou null. */
    async value(sql, params = []) {
      const row = await db.get(sql, params);
      return row ? Object.values(row)[0] : null;
    },
    /** INSERT/UPDATE/DELETE: devolve o id gerado e as linhas afetadas. */
    async run(sql, params = []) {
      const [result] = await executor.query(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    },
  };
  return db;
}

/**
 * Cria o acesso ao banco MySQL usado pela aplicação.
 * - dateStrings: datas chegam como texto "AAAA-MM-DD HH:MM:SS" (sem conversão de fuso).
 * - decimalNumbers: SUM/ROUND chegam como número, não como texto.
 * - time_zone '+00:00': todas as datas são gravadas em UTC.
 */
export function createDb(dbConfig) {
  assertDbName(dbConfig.database);
  const pool = mysql.createPool({
    ...dbConfig,
    charset: 'utf8mb4',
    dateStrings: true,
    decimalNumbers: true,
    connectionLimit: 10,
  });
  pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

  const db = wrap(pool);

  /** Executa várias operações em uma transação: ou todas são gravadas, ou nenhuma. */
  db.transaction = async (fn) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(wrap(conn));
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  db.close = () => pool.end();
  db.name = dbConfig.database;
  return db;
}

/** Conexão avulsa sem banco selecionado (para criar/apagar o banco). */
async function serverConnection(dbConfig, options = {}) {
  const { database: _ignored, ...rest } = dbConfig;
  return mysql.createConnection({ ...rest, charset: 'utf8mb4', ...options });
}

export async function createDatabaseIfMissing(dbConfig) {
  assertDbName(dbConfig.database);
  const conn = await serverConnection(dbConfig);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }
}

export async function dropDatabase(dbConfig) {
  assertDbName(dbConfig.database);
  const conn = await serverConnection(dbConfig);
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
  } finally {
    await conn.end();
  }
}

/** Conexão que aceita vários comandos SQL de uma vez (usada só pelas migrations). */
export async function migrationConnection(dbConfig) {
  assertDbName(dbConfig.database);
  const conn = await mysql.createConnection({ ...dbConfig, charset: 'utf8mb4', multipleStatements: true });
  await conn.query("SET time_zone = '+00:00'");
  return conn;
}
