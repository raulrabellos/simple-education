import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  findTopicId, getSubject, getTopic, listSubjects, listTopics,
  markLessonCompleted, searchTopics, unmarkLessonCompleted,
} from '../services/contentService.js';
import { startAttempt } from '../services/attemptService.js';
import { readOptionalYear, readSlug } from '../utils/params.js';

/** Matérias, assuntos (aulas), conclusão de aula, início de exercícios e pesquisa. */
export function contentRoutes({ db }) {
  const router = Router();

  // GET /api/subjects — cards da página inicial (ex.: "Matemática").
  router.get('/subjects', requireAuth, async (req, res) => {
    res.json({ subjects: await listSubjects(db, req.user.id) });
  });

  // GET /api/subjects/:slug — assuntos agrupados por ano (tela "Conteúdos").
  router.get('/subjects/:slug', requireAuth, async (req, res) => {
    res.json({ subject: await getSubject(db, readSlug(req.params.slug), req.user.id) });
  });

  // GET /api/topics?year=1&subject=matematica
  router.get('/topics', requireAuth, async (req, res) => {
    const year = readOptionalYear(req.query.year);
    const subjectSlug = req.query.subject ? readSlug(req.query.subject, 'subject') : null;
    res.json({ topics: await listTopics(db, { year, subjectSlug }, req.user.id) });
  });

  // GET /api/topics/:slug — aula (conteúdo de estudo). Não contém questões nem gabarito.
  router.get('/topics/:slug', requireAuth, async (req, res) => {
    res.json({ topic: await getTopic(db, readSlug(req.params.slug), req.user.id) });
  });

  // PUT /api/topics/:slug/completion — marca a aula como concluída (idempotente).
  router.put('/topics/:slug/completion', requireAuth, async (req, res) => {
    const topicId = await findTopicId(db, readSlug(req.params.slug));
    res.json({ progress: await markLessonCompleted(db, req.user.id, topicId) });
  });

  // DELETE /api/topics/:slug/completion — desmarca a aula concluída.
  router.delete('/topics/:slug/completion', requireAuth, async (req, res) => {
    const topicId = await findTopicId(db, readSlug(req.params.slug));
    res.json({ progress: await unmarkLessonCompleted(db, req.user.id, topicId) });
  });

  // POST /api/topics/:slug/attempts — inicia uma nova tentativa de exercícios.
  router.post('/topics/:slug/attempts', requireAuth, async (req, res) => {
    const topicId = await findTopicId(db, readSlug(req.params.slug));
    res.status(201).json(await startAttempt(db, req.user.id, topicId));
  });

  // GET /api/search?q=funcao
  router.get('/search', requireAuth, async (req, res) => {
    res.json(await searchTopics(db, typeof req.query.q === 'string' ? req.query.q : '', req.user.id));
  });

  return router;
}
