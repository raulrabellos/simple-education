import { badRequest } from './httpError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Funções de validação: cada uma recebe o valor bruto do corpo da requisição,
 * devolve o valor limpo ou registra a mensagem de erro em `errors[campo]`.
 */
export function readName(value, errors, field = 'name') {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 2 || name.length > 80) errors[field] = 'Informe um nome entre 2 e 80 caracteres.';
  return name;
}

export function readEmail(value, errors, field = 'email') {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(email) || email.length > 120) errors[field] = 'Informe um e-mail válido.';
  return email;
}

export function readNewPassword(value, errors, field = 'password') {
  const password = typeof value === 'string' ? value : '';
  if (password.length < 8 || password.length > 72) errors[field] = 'A senha deve ter entre 8 e 72 caracteres.';
  return password;
}

/**
 * Ano escolar é opcional: a plataforma é aberta a qualquer pessoa.
 * null, "" ou ausente = "não informado". Se informado, precisa ser 1, 2 ou 3.
 */
export function readOptionalSchoolYear(value, errors, field = 'schoolYear') {
  if (value === undefined || value === null || value === '') return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1 || year > 3) {
    errors[field] = 'Escolha o 1º, 2º ou 3º ano, ou deixe sem informar.';
  }
  return year;
}

/** Lança erro 400 com os detalhes por campo, se houver algum erro. */
export function assertValid(errors) {
  if (Object.keys(errors).length > 0) {
    throw badRequest('Verifique os campos destacados.', errors);
  }
}
