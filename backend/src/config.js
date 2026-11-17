import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const BACKEND_ROOT = path.resolve(here, '..');

// Carrega backend/.env, se existir (recurso nativo do Node 22).
const envFile = path.join(BACKEND_ROOT, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

function parseBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

function parseList(value, fallback) {
  if (!value) return fallback;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

const dbName = env.DB_NAME || 'simple_education';

export const config = {
  isProduction,
  port: Number(env.PORT) || 3001,
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD ?? '',
    database: dbName,
  },
  // Banco exclusivo dos testes: sempre separado do banco real e precisa terminar em "_test".
  testDbName: env.DB_NAME_TEST || `${dbName}_test`,
  sessionDays: Number(env.SESSION_DAYS) || 7,
  sessionCookieName: 'se_session',
  // Em produção (HTTPS) o cookie só trafega por conexão segura.
  // Localmente (http://localhost) precisa ficar false, senão o navegador descarta o cookie.
  cookieSecure: parseBool(env.COOKIE_SECURE, isProduction),
  // Origens que podem chamar a API de outro endereço (CORS).
  corsOrigins: parseList(env.CORS_ORIGINS, ['http://localhost:5173']),
  // Ative quando o servidor estiver atrás de um proxy reverso (Nginx, Render etc.).
  trustProxy: parseBool(env.TRUST_PROXY, false),
  loginMaxAttempts: Number(env.LOGIN_MAX_ATTEMPTS) || 5,
  loginWindowMinutes: Number(env.LOGIN_WINDOW_MINUTES) || 15,
  logRequests: parseBool(env.LOG_REQUESTS, true),
  // Pasta com o build do frontend, servida pelo Express no modo de apresentação.
  frontendDist: path.resolve(BACKEND_ROOT, '..', 'frontend', 'dist'),
};
