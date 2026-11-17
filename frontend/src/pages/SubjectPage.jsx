import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { ErrorState, Loading, PageTitle, StatusBadge } from '../components/ui.jsx';
import { NotFoundContent } from './NotFoundPage.jsx';

/** Listagem dos conteúdos por ano (segunda tela de referência). */
export function SubjectPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.content.subject(slug), [slug]);
  usePageTitle(data?.subject.name ?? 'Conteúdos');

  if (loading) return <Loading label="Carregando conteúdos..." />;
  if (error?.status === 404) return <NotFoundContent message="Matéria não encontrada." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { subject } = data;
  return (
    <>
      <nav className="breadcrumb" aria-label="Você está em">
        <ol>
          <li><Link to="/">Início</Link></li>
          <li aria-current="page">{subject.name}</li>
        </ol>
      </nav>
      <PageTitle>{subject.name}</PageTitle>
      <p className="page-subtitle">
        Conteúdos organizados por ano, conforme a proposta da Simple Education. Escolha um assunto para estudar.
      </p>

      {subject.years.map((year) => (
        <section key={year.schoolYear} className="year-section" aria-labelledby={`ano-${year.schoolYear}`}>
          <div className="year-section__header">
            <h2 id={`ano-${year.schoolYear}`} className="year-pill">{year.schoolYear}º Ano</h2>
            {user.schoolYear === year.schoolYear && <span className="badge badge--purple">Seu ano</span>}
          </div>
          {year.topics.length === 0 ? (
            <p className="muted-note">Nenhum assunto cadastrado para este ano.</p>
          ) : (
            <ul className="topic-list">
              {year.topics.map((t) => (
                <li key={t.slug}>
                  <Link to={`/assuntos/${t.slug}`} className="topic-link">
                    <span className="topic-link__text">
                      <strong>{t.title}:</strong> {t.summary}
                    </span>
                    <StatusBadge status={t.progress.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
