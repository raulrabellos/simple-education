import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

/** Gera o hash da senha no formato "salt:hash" (hexadecimal). */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

/** Compara a senha com o hash salvo usando comparação em tempo constante. */
export async function verifyPassword(password, stored) {
  const [salt, hashHex] = String(stored).split(':');
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

// Hash fixo usado quando o e-mail não existe, para o tempo de resposta
// do login não revelar quais e-mails estão cadastrados.
export const DUMMY_HASH = `${'0'.repeat(32)}:${'0'.repeat(KEY_LENGTH * 2)}`;
