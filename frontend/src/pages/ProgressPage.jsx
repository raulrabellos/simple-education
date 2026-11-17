import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDateTime, scoreLabel } from '../utils/format.js';
import { Alert, Button, EmptyState, ErrorState, Loading, PageTitle, ProgressBar, StatusBadge } from '../components/ui.jsx';

const PAGE_SIZE = 10;

export function ProgressPage() {
  usePageTitle('Meu progresso');
  const overview = useApi(() => api.progress.overview(), []);

  return (
    <>
      <PageTitle>Meu progresso</PageTitle>
      <p className="page-subtitle">Acompanhe as aulas estudadas, os exercícios respondidos e seus acertos.</p>

      {overview.loading && <Loading label="Carregando seu progresso..." />}
      {overview.error && <ErrorState error={overview.error} onRetry={overview.reload} />}
      {overview.data && <Overview data={overview.data} />}

      <History />
    </>
  );
}

function Overview({ data }) {
  const { totals, byYear, topics, masteryThreshold } = data;
  return (
    <>
      <ul className="stat-grid" aria-label="Resumo geral">
        <li className="card stat"><span className="stat__value">{totals.lessonsCompleted}/{totals.topicsTotal}</span><span className="stat__label">Aulas concluídas</span></li>
        <li className="card stat"><span className="stat__value">{totals.topicsCompleted}/{totals.topicsTotal}</span><span className="stat__label">Assuntos concluídos</span></li>
        <li className="card stat"><span className="stat__value">{totals.questionsAnswered}</span><span className="stat__label">Exercícios respondidos</span></li>
        <li className="card stat"><span className="stat__value">{totals.accuracy === null ? '—' : `${totals.accuracy}%`}</span><span className="stat__label">Taxa de acertos ({totals.correctAnswers} acertos, {totals.wrongAnswers} erros)</span></li>
      </ul>

      <details className="card how-it-works">
        <summary>Como o progresso é calculado</summary>
        <ul>
          <li><strong>Aula concluída:</strong> você marcou na página do assunto que estudou o conteúdo.</li>
          <li><strong>Exercício respondido:</strong> cada questão que você respondeu em alguma tentativa.</li>
          <li><strong>Acerto:</strong> resposta correta, conferida pelo servidor.</li>
          <li><strong>Assunto concluído:</strong> aula concluída e pelo menos {masteryThreshold}% de acertos em uma tentativa finalizada.</li>
        </ul>
      </details>

      <h2 className="section-title">Por ano</h2>
      <ul className="year-progress">
        {byYear.map((y) => (
          <li key={y.schoolYear} className="card">
            <div className="year-progress__head">
              <span className="year-pill year-pill--small">{y.schoolYear}º Ano</span>
              <span>{y.topicsCompleted} de {y.topicsTotal} assuntos concluídos</span>
            </div>
            <ProgressBar value={y.topicsCompleted} max={y.topicsTotal} label={`Assuntos concluídos do ${y.schoolYear}º ano`} />
          </li>
        ))}
      </ul>

      <h2 className="section-title">Por assunto</h2>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Progresso em cada assunto</caption>
          <thead>
            <tr>
              <th scope="col">Assunto</th>
              <th scope="col">Ano</th>
              <th scope="col">Situação</th>
              <th scope="col">Aula</th>
              <th scope="col">Melhor nota</th>
              <th scope="col">Acertos</th>
            </tr>
          </thead>
          <tbody>
            {topics.map(({ topic, progress }) => (
              <tr key={topic.slug}>
                <th scope="row"><Link to={`/assuntos/${topic.slug}`}>{topic.title}</Link></th>
                <td>{topic.schoolYear}º</td>
                <td><StatusBadge status={progress.status} /></td>
                <td>{progress.lessonCompleted ? 'Concluída' : 'Pendente'}</td>
                <td>{scoreLabel(progress.bestScore)}</td>
                <td>{progress.correctAnswers}/{progress.questionsAnswered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Histórico de tentativas, com paginação por "Carregar mais". */
function History() {
  const first = useApi(() => api.attempts.list({ limit: PAGE_SIZE, offset: 0 }), []);
  const [extra, setExtra] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');

  const items = [...(first.data?.items ?? []), ...extra];
  const total = first.data?.total ?? 0;

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreError('');
    try {
      const page = await api.attempts.list({ limit: PAGE_SIZE, offset: items.length });
      setExtra((e) => [...e, ...page.items]);
    } catch (err) {
      setMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section aria-labelledby="historico-titulo">
      <h2 id="historico-titulo" className="section-title">Histórico de tentativas</h2>
      {first.loading && <Loading label="Carregando histórico..." />}
      {first.error && <ErrorState error={first.error} onRetry={first.reload} />}
      {first.data && total === 0 && (
        <EmptyState title="Você ainda não fez exercícios.">
          <p>Escolha um assunto em <Link to="/materias/matematica">Matemática</Link> e clique em "Praticar exercícios".</p>
        </EmptyState>
      )}
      {items.length > 0 && (
        <ul className="history">
          {items.map((a) => (
            <li key={a.id} className="card history__item">
              <div>
                <p className="history__topic">{a.topic.title}</p>
                <p className="history__date">
                  {formatDateTime(a.startedAt)} · {a.status === 'finished' ? 'Finalizada' : 'Em andamento'}
                </p>
              </div>
              <p className="history__score">
                {a.status === 'finished' ? `${a.scorePercent}%` : `${a.answered}/${a.totalQuestions} respondidas`}
              </p>
              <Link to={`/tentativas/${a.id}`} className="btn btn--secondary">
                {a.status === 'finished' ? 'Revisar' : 'Ver e continuar'}
                <span className="sr-only"> tentativa de {a.topic.title} de {formatDateTime(a.startedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {moreError && <Alert>{moreError}</Alert>}
      {items.length < total && (
        <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Carregando...">
          Carregar mais ({total - items.length} restantes)
        </Button>
      )}
    </section>
  );
}
