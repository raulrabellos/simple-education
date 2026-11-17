import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { loadSession } from './middlewares/auth.js';
import { originCheck } from './middlewares/originCheck.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { contentRoutes } from './routes/content.js';
import { attemptRoutes } from './routes/attempts.js';
import { notFound } from './utils/httpError.js';

/**
 * Monta a aplicação Express. Recebe o banco e a configuração por parâmetro
 * para que os testes usem um banco em memória, sem tocar no banco real.
 */
export function createApp({ db, config }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  if (config.logRequests) app.use(requestLogger);

  // Cabeçalhos básicos de segurança.
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
    });
    next();
  });

  const api = express.Router();

  // CORS apenas para as origens configuradas (padrão: o Vite em http://localhost:5173).
  // Outras origens não recebem os cabeçalhos e o navegador bloqueia a leitura da resposta.
  api.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }));
  api.use(express.json({ limit: '20kb' }));
  api.use(cookieParser());
  api.use(originCheck(config.corsOrigins));
  api.use(loadSession(db, config.sessionCookieName));
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  api.get('/health', (_req, res) => res.json({ status: 'ok' }));
  api.use('/auth', authRoutes({ db, config }));
  api.use('/users', userRoutes({ db }));
  api.use(contentRoutes({ db }));
  api.use(attemptRoutes({ db }));

  api.use((_req, _res, next) => next(notFound('Rota da API não encontrada.')));
  app.use('/api', api);

  // Modo de entrega: se o frontend já foi compilado (npm run build),
  // o próprio Express serve o site, tudo em uma única porta.
  const indexHtml = path.join(config.frontendDist, 'index.html');
  if (config.serveFrontend && fs.existsSync(indexHtml)) {
    app.use(express.static(config.frontendDist));
    app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(indexHtml) : next()));
  }

  app.use(errorHandler);
  return app;
}
