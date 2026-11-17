/**
 * Cliente da API — único lugar das telas que faz requisições HTTP.
 *
 * - A API PHP fica em "api/index.php/<rota>", com caminho RELATIVO à pasta das telas,
 *   então funciona com qualquer nome de pasta dentro do htdocs do XAMPP.
 * - credentials: 'same-origin' envia o cookie de sessão (HttpOnly) em toda chamada.
 *   As telas nunca leem nem guardam o token: quem sabe se o aluno está logado é o servidor.
 * - Erros da API viram ApiError com status, código, mensagem, erros por campo e,
 *   quando houver, uma dica de solução (ex.: "clique em Start na linha do MySQL").
 */
const API_URL = 'api/index.php';

export class ApiError extends Error {
  constructor(status, code, message, details, hint) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details ?? {};
    // Dica de solução em português (resposta 503 de banco indisponível).
    this.hint = hint || '';
  }
}

// Chamado quando a API responde 401 (sessão expirou ou foi encerrada).
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar ao servidor. Verifique se ele está ligado e tente novamente.');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Resposta sem JSON (ex.: Apache devolvendo uma página de erro em HTML).
  }

  // Servidor fora do ar (500, 502, 503, 504) ou erro sem resposta JSON da API.
  if (!response.ok && (!data?.error && (response.status >= 500 || response.status === 0))) {
    throw new ApiError(response.status, 'SERVER_UNAVAILABLE', 'O servidor está indisponível no momento. Verifique se ele está ligado e tente novamente.');
  }

  if (!response.ok) {
    const err = data?.error;
    const apiError = new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? 'Ocorreu um erro inesperado. Tente novamente.',
      err?.details,
      typeof err?.hint === 'string' ? err.hint : ''
    );
    if (response.status === 401 && err?.code === 'UNAUTHORIZED' && onUnauthorized) onUnauthorized();
    throw apiError;
  }

  // Resposta 200 que não é JSON: o PHP não rodou (ex.: página aberta sem o Apache).
  if (data === null) {
    throw new ApiError(response.status, 'SERVER_UNAVAILABLE', 'O servidor está indisponível no momento. Verifique se ele está ligado e tente novamente.');
  }
  return data;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const patch = (path, body) => request('PATCH', path, body);
const del = (path) => request('DELETE', path);
const enc = encodeURIComponent;

/** Endpoints da API, agrupados por assunto. Documentação: docs/api.md */
export const api = {
  auth: {
    session: () => get('/auth/session'),
    me: () => get('/auth/me'),
    login: (email, password) => post('/auth/login', { email, password }),
    register: (data) => post('/auth/register', data),
    logout: () => post('/auth/logout'),
  },
  users: {
    updateMe: (changes) => patch('/users/me', changes),
  },
  content: {
    subjects: () => get('/subjects'),
    subject: (slug) => get(`/subjects/${enc(slug)}`),
    topic: (slug) => get(`/topics/${enc(slug)}`),
    completeLesson: (slug) => put(`/topics/${enc(slug)}/completion`),
    uncompleteLesson: (slug) => del(`/topics/${enc(slug)}/completion`),
    search: (q) => get(`/search?q=${enc(q)}`),
  },
  attempts: {
    start: (topicSlug) => post(`/topics/${enc(topicSlug)}/attempts`),
    answer: (attemptId, questionId, optionId) => post(`/attempts/${enc(attemptId)}/answers`, { questionId, optionId }),
    finish: (attemptId) => post(`/attempts/${enc(attemptId)}/finish`),
    detail: (attemptId) => get(`/attempts/${enc(attemptId)}`),
    list: ({ topic, limit = 10, offset = 0 } = {}) => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (topic) params.set('topic', topic);
      return get(`/attempts?${params}`);
    },
  },
  progress: {
    overview: () => get('/progress'),
  },
};
