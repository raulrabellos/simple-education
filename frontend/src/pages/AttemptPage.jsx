import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDateTime } from '../utils/format.js';
import { ButtonLink, ErrorState, Loading, PageTitle } from '../components/ui.jsx';
import { NotFoundContent } from './NotFoundPage.jsx';
import { RichText } from '../components/LessonBody.jsx';
import { DifficultyBadge } from '../components/ui.jsx';

/** Revisão de uma tentativa do histórico. Só mostra gabarito das questões respondidas. */
export function AttemptPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(() => api.attempts.detail(id), [id]);
  usePageTitle('Revisão da tentativa');

  if (loading) return <Loading label="Carregando tentativa..." />;
  if (error?.status === 404 || error?.status === 400) return <NotFoundContent message="Tentativa não encontrada." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { attempt, questions } = data;
  const finished = attempt.status === 'finished';

  return (
    <>
      <p className="back-link"><Link to="/progresso">← Voltar para Meu progresso</Link></p>
      <PageTitle>Revisão: {attempt.topic.title}</PageTitle>
      <p className="page-subtitle">
        Iniciada em {formatDateTime(attempt.startedAt)}
        {finished ? ` · finalizada em ${formatDateTime(attempt.finishedAt)}` : ' · ainda não finalizada'}
      </p>

      <dl className="mini-stats card">
        <div><dt>Nota</dt><dd>{finished ? `${attempt.scorePercent}%` : '—'}</dd></div>
        <div><dt>Acertos</dt><dd>{attempt.correct}</dd></div>
        <div><dt>Erros</dt><dd>{attempt.wrong}</dd></div>
        <div><dt>Sem resposta</dt><dd>{attempt.unanswered}</dd></div>
      </dl>

      {!finished && (
        <div className="btn-row spaced">
          <ButtonLink to={`/assuntos/${attempt.topic.slug}/exercicios?tentativa=${attempt.id}`}>Continuar tentativa</ButtonLink>
        </div>
      )}

      <ol className="review-list">
        {questions.map((q) => (
          <li key={q.id} className="card review-item">
            {q.difficulty && <DifficultyBadge level={q.difficulty} />}
            <p className="review-item__statement"><RichText text={q.statement} /></p>
            {q.answer ? (
              <>
                <ul className="review-options">
                  {q.options.map((o) => {
                    const isCorrect = o.id === q.answer.correctOptionId;
                    const isSelected = o.id === q.answer.selectedOptionId;
                    return (
                      <li key={o.id} className={`${isCorrect ? 'is-correct' : ''} ${isSelected && !isCorrect ? 'is-wrong' : ''}`}>
                        <strong>{o.letter})</strong> <RichText text={o.text} />
                        {isCorrect && <span className="option__tag">Correta</span>}
                        {isSelected && !isCorrect && <span className="option__tag">Sua resposta</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className={q.answer.isCorrect ? 'text-ok' : 'text-bad'}>
                  {q.answer.isCorrect ? 'Você acertou.' : 'Você errou.'}
                </p>
                <p className="review-item__explanation"><strong>Explicação:</strong> <RichText text={q.answer.explanation} /></p>
              </>
            ) : (
              <p className="muted-note">Não respondida — o gabarito aparece apenas para questões respondidas.</p>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
