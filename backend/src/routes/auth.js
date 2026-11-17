import { Router } from 'express';
import { createSession, deleteSession } from '../services/sessionService.js';
import { authenticate, registerUser, toPublicUser } from '../services/userService.js';
import { createLoginLimiter } from '../middlewares/loginLimiter.js';
import { requireAuth } from '../middlewares/auth.js';
import { HttpError } from '../utils/httpError.js';
import { assertValid, readEmail, readName, readNewPassword, readOptionalSchoolYear } from '../utils/validate.js';

export function authRoutes({ db, config }) {
  const router = Router();
  const limiter = createLoginLimiter({
    max: config.loginMaxAttempts,
    windowMs: config.loginWindowMinutes * 60 * 1000,
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  };

  async function startSession(res, userId) {
    const token = await createSession(db, userId, config.sessionDays);
    res.cookie(config.sessionCookieName, token, {
      ...cookieOptions,
      maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
    });
  }

  // POST /api/auth/register — cadastra o aluno e já inicia a sessão.
  router.post('/register', async (req, res) => {
    const body = req.body ?? {};
    const errors = {};
    const data = {
      name: readName(body.name, errors),
      email: readEmail(body.email, errors),
      password: readNewPassword(body.password, errors),
      schoolYear: readOptionalSchoolYear(body.schoolYear, errors),
    };
    assertValid(errors);

    const user = await registerUser(db, data);
    await startSession(res, user.id);
    res.status(201).json({ user: toPublicUser(user) });
  });

  // POST /api/auth/login
  router.post('/login', limiter.check, async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Informe e-mail e senha.');
    }

    const user = await authenticate(db, email, password);
    if (!user) {
      limiter.registerFailure(req);
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    limiter.reset(req);
    // Se já havia uma sessão neste navegador, encerra antes de criar a nova.
    await deleteSession(db, req.sessionToken);
    await startSession(res, user.id);
    res.json({ user: toPublicUser(user) });
  });

  // POST /api/auth/logout — apaga a sessão no banco e o cookie no navegador.
  router.post('/logout', async (req, res) => {
    await deleteSession(db, req.sessionToken);
    res.clearCookie(config.sessionCookieName, cookieOptions);
    res.status(204).end();
  });

  // GET /api/auth/session — consulta pública da sessão: sempre 200.
  // Usada pelo frontend ao abrir a página: { user: null } significa "não está logado"
  // (evita registrar um erro 401 no console a cada visita de quem ainda não entrou).
  router.get('/session', (req, res) => {
    res.json({ user: req.user ? toPublicUser(req.user) : null });
  });

  // GET /api/auth/me — devolve o aluno logado (401 sem sessão).
  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: toPublicUser(req.user) });
  });

  return router;
}
