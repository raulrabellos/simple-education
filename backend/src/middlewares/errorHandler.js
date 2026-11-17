import { HttpError } from '../utils/httpError.js';

/** Converte qualquer erro em uma resposta JSON no formato { error: { code, message, details? } }. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Corpo da requisição inválido.' } });
  }
  // Registra só a mensagem e a pilha do erro (nunca corpo, cookies ou cabeçalhos da requisição).
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Requisição muito grande.' } });
  }
  console.error(`[erro] ${err.message}\n${err.stack ?? ""}`);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } });
}
