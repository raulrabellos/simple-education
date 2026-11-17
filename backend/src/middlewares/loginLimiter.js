import { HttpError } from '../utils/httpError.js';

/**
 * Limita tentativas de login com erro por IP + e-mail (em memória).
 * Depois de `max` erros dentro de `windowMs`, responde 429 até a janela acabar.
 * Suficiente para um servidor único; os contadores zeram se o servidor reiniciar.
 */
export function createLoginLimiter({ max = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const failures = new Map();

  const keyOf = (req) => `${req.ip}|${String(req.body?.email ?? '').trim().toLowerCase()}`;

  function cleanup(now) {
    for (const [key, entry] of failures) if (entry.resetAt <= now) failures.delete(key);
  }

  function check(req, res, next) {
    const entry = failures.get(keyOf(req));
    const now = Date.now();
    if (entry && entry.resetAt > now && entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'));
    }
    next();
  }

  function registerFailure(req) {
    const now = Date.now();
    if (failures.size > 10_000) cleanup(now);
    const key = keyOf(req);
    const entry = failures.get(key);
    if (!entry || entry.resetAt <= now) failures.set(key, { count: 1, resetAt: now + windowMs });
    else entry.count += 1;
  }

  function reset(req) {
    failures.delete(keyOf(req));
  }

  return { check, registerFailure, reset };
}
