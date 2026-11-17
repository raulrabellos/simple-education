/**
 * Log simples: método, caminho (sem query string), status e duração.
 * Nunca registra corpo da requisição, cookies ou cabeçalhos (evita vazar senhas e sessões).
 */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const pathOnly = req.originalUrl.split('?')[0];
    console.log(`${req.method} ${pathOnly} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
}
