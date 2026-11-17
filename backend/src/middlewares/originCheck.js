import { forbidden } from '../utils/httpError.js';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Proteção contra requisições forjadas (CSRF), somada ao cookie SameSite=Lax:
 * em métodos que alteram dados, se o navegador enviar o cabeçalho Origin,
 * ele precisa ser o próprio servidor ou uma origem liberada em CORS_ORIGINS.
 * Navegadores sempre enviam Origin em POST/PUT/PATCH/DELETE entre sites.
 */
export function originCheck(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next();
    if (allowed.has(origin)) return next();
    try {
      if (new URL(origin).host === req.get('host')) return next();
    } catch {
      // Origin malformado: bloqueado abaixo.
    }
    next(forbidden('Origem da requisição não permitida.'));
  };
}
