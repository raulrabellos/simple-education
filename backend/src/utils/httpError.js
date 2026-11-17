/** Erro com status HTTP e código legível, convertido em JSON pelo errorHandler. */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, 'VALIDATION_ERROR', message, details);
export const unauthorized = (message = 'Você precisa entrar na sua conta.') => new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Acesso negado.') => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Recurso não encontrado.') => new HttpError(404, 'NOT_FOUND', message);
export const conflict = (message) => new HttpError(409, 'CONFLICT', message);
