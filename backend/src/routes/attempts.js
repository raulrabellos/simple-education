import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  answerQuestion, finishAttempt, getAttemptDetail, listAttempts,
} from '../services/attemptService.js';
import { findTopicId } from '../services/contentService.js';
import { getProgressOverview } from '../services/progressService.js';
import { badRequest } from '../utils/httpError.js';
import { readId, readPagination, readSlug } from '../utils/params.js';

/** Tentativas, respostas e progresso. Tudo sempre filtrado pelo aluno da sessão. */
export function attemptRoutes({ db }) {
  const router = Router();

  // GET /api/attempts?topic=trigonometria&limit=20&offset=0 — histórico.
  router.get('/attempts', requireAuth, async (req, res) => {
    const { limit, offset } = readPagination(req.query);
    const topicId = req.query.topic ? await findTopicId(db, readSlug(req.query.topic, 'topic')) : null;
    res.json(await listAttempts(db, req.user.id, { topicId, limit, offset }));
  });

  // GET /api/attempts/:id — detalhe (gabarito só das questões respondidas).
  router.get('/attempts/:id', requireAuth, async (req, res) => {
    res.json(await getAttemptDetail(db, req.user.id, readId(req.params.id)));
  });

  // POST /api/attempts/:id/answers — body: { questionId, optionId }.
  // O frontend envia apenas a escolha; a correção é feita aqui.
  router.post('/attempts/:id/answers', requireAuth, async (req, res) => {
    const body = req.body ?? {};
    if (body.questionId === undefined || body.optionId === undefined) {
      throw badRequest('Informe a questão e a alternativa escolhida.', {
        ...(body.questionId === undefined && { questionId: 'Obrigatório.' }),
        ...(body.optionId === undefined && { optionId: 'Obrigatório.' }),
      });
    }
    const result = await answerQuestion(
      db, req.user.id, readId(req.params.id), readId(body.questionId, 'questionId'), readId(body.optionId, 'optionId')
    );
    res.status(201).json(result);
  });

  // POST /api/attempts/:id/finish — encerra a tentativa e calcula a nota.
  router.post('/attempts/:id/finish', requireAuth, async (req, res) => {
    res.json({ attempt: await finishAttempt(db, req.user.id, readId(req.params.id)) });
  });

  // GET /api/progress — resumo geral, por ano e por assunto.
  router.get('/progress', requireAuth, async (req, res) => {
    res.json(await getProgressOverview(db, req.user.id));
  });

  return router;
}
