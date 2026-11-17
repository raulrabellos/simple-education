import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { toPublicUser, updateUser } from '../services/userService.js';
import { badRequest } from '../utils/httpError.js';
import { assertValid, readName, readOptionalSchoolYear } from '../utils/validate.js';

const ALLOWED_FIELDS = new Set(['name', 'schoolYear']);

export function userRoutes({ db }) {
  const router = Router();
  router.use(requireAuth);

  // PATCH /api/users/me — altera nome e/ou ano escolar do aluno logado.
  // O aluno é sempre o da sessão; não existe rota que receba id de usuário.
  router.patch('/me', async (req, res) => {
    const body = req.body ?? {};
    const unknown = Object.keys(body).filter((k) => !ALLOWED_FIELDS.has(k));
    if (unknown.length) {
      throw badRequest('Só é possível alterar nome e ano escolar.', Object.fromEntries(unknown.map((k) => [k, 'Campo não permitido.'])));
    }
    if (body.name === undefined && body.schoolYear === undefined) {
      throw badRequest('Informe o nome e/ou o ano escolar.');
    }

    const errors = {};
    const changes = {};
    if (body.name !== undefined) changes.name = readName(body.name, errors);
    if (body.schoolYear !== undefined) changes.schoolYear = readOptionalSchoolYear(body.schoolYear, errors);
    assertValid(errors);

    res.json({ user: toPublicUser(await updateUser(db, req.user.id, changes)) });
  });

  return router;
}
