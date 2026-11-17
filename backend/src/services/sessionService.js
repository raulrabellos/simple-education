import crypto from 'node:crypto';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Cria uma sessão e devolve o token puro (que vai apenas para o cookie). */
export async function createSession(db, userId, days) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.run(
    'INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))',
    [hashToken(token), userId, days]
  );
  return token;
}

/** Retorna o usuário dono de uma sessão válida (não vencida), ou null. */
export async function findUserBySessionToken(db, token) {
  if (!token || typeof token !== 'string') return null;
  return db.get(
    `SELECT u.id, u.name, u.email, u.school_year
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
    [hashToken(token)]
  );
}

export async function deleteSession(db, token) {
  if (!token || typeof token !== 'string') return;
  await db.run('DELETE FROM sessions WHERE id_hash = ?', [hashToken(token)]);
}

/** Remove sessões vencidas (chamado ao iniciar o servidor). */
export async function purgeExpiredSessions(db) {
  const { affectedRows } = await db.run('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  return affectedRows;
}
