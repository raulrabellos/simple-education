import { conflict } from '../utils/httpError.js';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../utils/password.js';

/** Formato público do usuário (nunca inclui o hash da senha). */
export function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, schoolYear: row.school_year ?? null };
}

const duplicateEmail = () => conflict('Este e-mail já está cadastrado.');

export async function registerUser(db, { name, email, password, schoolYear }) {
  if (await db.get('SELECT 1 FROM users WHERE email = ?', [email])) throw duplicateEmail();

  const passwordHash = await hashPassword(password);
  try {
    const { insertId } = await db.run(
      'INSERT INTO users (name, email, password_hash, school_year) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, schoolYear]
    );
    return findUserById(db, insertId);
  } catch (err) {
    // Proteção contra dois cadastros simultâneos com o mesmo e-mail.
    if (err.code === 'ER_DUP_ENTRY') throw duplicateEmail();
    throw err;
  }
}

/** Retorna o usuário se e-mail e senha conferem; caso contrário, null. */
export async function authenticate(db, email, password) {
  const row = await db.get(
    'SELECT id, name, email, school_year, password_hash FROM users WHERE email = ?',
    [email]
  );
  // Mesmo sem usuário, calcula um hash: o tempo de resposta não revela se o e-mail existe.
  const ok = await verifyPassword(password, row ? row.password_hash : DUMMY_HASH);
  return row && ok ? row : null;
}

/** Atualiza apenas os campos informados (nome e/ou ano escolar) do próprio aluno. */
export async function updateUser(db, userId, { name, schoolYear }) {
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('name = ?'); params.push(name); }
  if (schoolYear !== undefined) { sets.push('school_year = ?'); params.push(schoolYear); }
  if (sets.length) {
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...params, userId]);
  }
  return findUserById(db, userId);
}

export async function findUserById(db, id) {
  return db.get('SELECT id, name, email, school_year FROM users WHERE id = ?', [id]);
}
