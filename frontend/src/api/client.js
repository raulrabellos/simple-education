/**
 * Cliente da API — único lugar do frontend que faz requisições HTTP.
 *
 * - A URL base vem de VITE_API_URL (padrão: "/api", mesma origem do site).
 * - credentials: 'include' envia o cookie de sessão (HttpOnly) em toda chamada.
 *   O frontend nunca lê nem guarda o token: quem sabe se o aluno está logado é o servidor.
 * - Erros da API viram ApiError com status, código, mensagem e erros por campo.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details ?? {};
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
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
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
    // Resposta sem JSON (ex.: servidor fora do ar devolvendo HTML).
  }

  // Proxy/servidor fora do ar (502, 503, 504) ou erro sem resposta da API.
  if (!response.ok && (!data?.error && (response.status >= 500 || response.status === 0))) {
    throw new ApiError(response.status, 'SERVER_UNAVAILABLE', 'O servidor está indisponível no momento. Verifique se ele está ligado e tente novamente.');
  }

  if (!response.ok) {
    const err = data?.error;
    const apiError = new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? 'Ocorreu um erro inesperado. Tente novamente.',
      err?.details
    );
    if (response.status === 401 && err?.code === 'UNAUTHORIZED' && onUnauthorized) onUnauthorized();
    throw apiError;
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
    answer: (attemptId, questionId, optionId) => post(`/attempts/${attemptId}/answers`, { questionId, optionId }),
    finish: (attemptId) => post(`/attempts/${attemptId}/finish`),
    detail: (attemptId) => get(`/attempts/${attemptId}`),
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
