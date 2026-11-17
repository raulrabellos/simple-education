import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { firstName } from '../utils/format.js';
import { EmptyState, ErrorState, Loading, PageTitle } from '../components/ui.jsx';

export function HomePage() {
  usePageTitle('Início');
  const { user } = useAuth();
  const subjects = useApi(() => api.content.subjects(), []);
  const progress = useApi(() => api.progress.overview(), []);
  const next = progress.data?.continueStudying;

  return (
    <>
      <PageTitle>Seja bem-vindo, {firstName(user.name)}!</PageTitle>
      <p className="page-subtitle">
        Essa plataforma disponibilizará conteúdos do 1º, 2º e 3º ano do Ensino Médio, com foco principal em Matemática.
      </p>

      <h2 className="section-title">Conteúdos</h2>
      {subjects.loading && <Loading label="Carregando conteúdos..." />}
      {subjects.error && <ErrorState error={subjects.error} onRetry={() => { subjects.reload(); progress.reload(); }} />}
      {subjects.data && subjects.data.subjects.length === 0 && (
        <EmptyState title="Nenhum conteúdo disponível no momento." />
      )}
      {subjects.data && subjects.data.subjects.length > 0 && (
        <ul className="subject-grid">
          {subjects.data.subjects.map((s) => (
            <li key={s.slug}>
              <Link to={`/materias/${s.slug}`} className="subject-card">
                <span className="subject-card__name">{s.name}</span>
                <span className="subject-card__meta">
                  {s.topicsCompleted} de {s.topicCount} assuntos concluídos
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {next && (
        <section className="card continue-card" aria-labelledby="continuar-titulo">
          <h2 id="continuar-titulo" className="continue-card__title">Continuar estudando</h2>
          <p className="continue-card__topic">{next.title} <span className="year-pill year-pill--small">{next.schoolYear}º Ano</span></p>
          <Link to={`/assuntos/${next.slug}`} className="btn btn--secondary">Abrir aula</Link>
        </section>
      )}
      {progress.error && progress.error.status !== 401 && (
        <p className="muted-note">Não foi possível carregar seu progresso agora.</p>
      )}
    </>
  );
}
