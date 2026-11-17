import { findUserBySessionToken } from '../services/sessionService.js';
import { unauthorized } from '../utils/httpError.js';

/** Lê o cookie de sessão e, se válido, coloca o usuário em req.user. */
export function loadSession(db, cookieName) {
  return async (req, _res, next) => {
    req.sessionToken = req.cookies?.[cookieName] ?? null;
    req.user = await findUserBySessionToken(db, req.sessionToken);
    next();
  };
}

/** Bloqueia a rota para quem não está logado (401). */
export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}
