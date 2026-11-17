import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDateTime, scoreLabel } from '../utils/format.js';
import { LessonBody, RichText } from '../components/LessonBody.jsx';
import { CheckIcon } from '../components/Icons.jsx';
import { Alert, Button, ButtonLink, ErrorState, Loading, PageTitle, StatusBadge } from '../components/ui.jsx';
import { NotFoundContent } from './NotFoundPage.jsx';

const SECTION_LABEL = {
  explicacao: 'Explicação',
  formulas: 'Conceitos e fórmulas',
  exemplo: 'Exemplo resolvido',
  resumo: 'Resumo',
  conceito: 'Conceito',
  dica: 'Dica',
};

/** Página de estudo (aula) de um assunto. */
export function TopicPage() {
  const { slug } = useParams();
  const { data, loading, error, reload, setData } = useApi(() => api.content.topic(slug), [slug]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  usePageTitle(data?.topic.title ?? 'Aula');

  if (loading && !data) return <Loading label="Carregando aula..." />;
  if (error?.status === 404) return <NotFoundContent message="Assunto não encontrado." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { topic } = data;
  const { progress } = topic;

  async function toggleLesson() {
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = progress.lessonCompleted
        ? await api.content.uncompleteLesson(slug)
        : await api.content.completeLesson(slug);
      setData({ topic: { ...topic, progress: result.progress } });
      setFeedback({
        type: 'success',
        text: result.progress.lessonCompleted ? 'Aula marcada como concluída.' : 'Marcação de aula concluída removida.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="lesson">
      <nav className="breadcrumb" aria-label="Você está em">
        <ol>
          <li><Link to="/">Início</Link></li>
          <li><Link to={`/materias/${topic.subject.slug}`}>{topic.subject.name}</Link></li>
          <li aria-current="page">{topic.title}</li>
        </ol>
      </nav>

      <div className="lesson__tags">
        <span className="year-pill year-pill--small">{topic.schoolYear}º Ano</span>
        <StatusBadge status={progress.status} />
      </div>
      <PageTitle>{topic.title}</PageTitle>
      <p className="page-subtitle">{topic.summary}</p>

      {topic.objective && (
        <section className="lesson-objective" aria-labelledby="objetivo-titulo">
          <h2 id="objetivo-titulo" className="lesson-objective__title">Objetivo de aprendizagem</h2>
          <p><RichText text={topic.objective} /></p>
        </section>
      )}

      {topic.sections.map((section, i) => (
        <section key={i} className={`lesson-section lesson-section--${section.kind}`}>
          <p className="lesson-section__kind">{SECTION_LABEL[section.kind] ?? section.kind}</p>
          <h2 className="lesson-section__title"><RichText text={section.title} /></h2>
          <LessonBody text={section.body} />
        </section>
      ))}

      <section className="card lesson-actions" aria-labelledby="pratica-titulo">
        <h2 id="pratica-titulo" className="lesson-actions__title">Terminou de estudar?</h2>
        <p className="muted-note">
          Marcar a aula como concluída registra que você estudou o conteúdo. Para concluir o assunto,
          também é preciso acertar pelo menos 70% dos exercícios em uma tentativa.
        </p>
        <div aria-live="polite">{feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}</div>
        <div className="btn-row">
          <Button
            variant={progress.lessonCompleted ? 'secondary' : 'primary'}
            onClick={toggleLesson}
            loading={saving}
            loadingText="Salvando..."
            aria-pressed={progress.lessonCompleted}
          >
            {progress.lessonCompleted ? <><CheckIcon size={18} /> Aula concluída</> : 'Marcar aula como concluída'}
          </Button>
          <ButtonLink to={`/assuntos/${topic.slug}/exercicios`} variant={progress.lessonCompleted ? 'primary' : 'secondary'}>
            Praticar exercícios ({topic.questionCount} questões)
          </ButtonLink>
        </div>

        {progress.attemptsFinished > 0 && (
          <dl className="mini-stats">
            <div><dt>Melhor nota</dt><dd>{scoreLabel(progress.bestScore)}</dd></div>
            <div><dt>Última nota</dt><dd>{scoreLabel(progress.lastScore)}</dd></div>
            <div><dt>Tentativas finalizadas</dt><dd>{progress.attemptsFinished}</dd></div>
            <div><dt>Última atividade</dt><dd>{formatDateTime(progress.lastActivityAt)}</dd></div>
          </dl>
        )}
      </section>
    </article>
  );
}
