import { badRequest } from './httpError.js';

/** Lê um identificador numérico positivo (ex.: :id da URL ou campo do corpo). */
export function readId(value, field = 'id') {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw badRequest('Identificador inválido.', { [field]: 'Deve ser um número inteiro positivo.' });
  }
  return n;
}

/** Lê o slug de um assunto/matéria (apenas letras minúsculas, números e hífen). */
export function readSlug(value, field = 'slug') {
  const slug = String(value ?? '');
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    throw badRequest('Endereço do conteúdo inválido.', { [field]: 'Formato inválido.' });
  }
  return slug;
}

/** Lê o ano escolar opcional de uma query string. */
export function readOptionalYear(value) {
  if (value === undefined || value === '') return null;
  const year = Number(value);
  if (![1, 2, 3].includes(year)) {
    throw badRequest('Ano escolar inválido.', { year: 'Use 1, 2 ou 3.' });
  }
  return year;
}

/** Lê limit/offset de paginação com valores padrão seguros. */
export function readPagination(query, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw badRequest('Paginação inválida.', { limit: `Use um número de 1 a ${maxLimit}.` });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw badRequest('Paginação inválida.', { offset: 'Use um número maior ou igual a 0.' });
  }
  return { limit, offset };
}
