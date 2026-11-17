import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { EmptyState, ErrorState, Loading, PageTitle, StatusBadge } from '../components/ui.jsx';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const valid = q.length >= 2;
  const { data, loading, error, reload } = useApi(
    () => (valid ? api.content.search(q) : Promise.resolve(null)),
    [q, valid]
  );
  usePageTitle(q ? `Pesquisa: ${q}` : 'Pesquisa');

  return (
    <>
      <PageTitle>Resultados da pesquisa</PageTitle>
      {!valid && (
        <EmptyState title="Digite pelo menos 2 letras na barra de pesquisa.">
          <p>Você pode buscar pelo nome ou descrição do assunto, como "juros", "seno" ou "probabilidade".</p>
        </EmptyState>
      )}
      {valid && loading && <Loading label="Pesquisando..." />}
      {valid && error && <ErrorState error={error} onRetry={reload} />}
      {valid && data && (
        <>
          <p className="page-subtitle" role="status">
            {data.total === 0
              ? `Nenhum conteúdo encontrado para "${q}".`
              : `${data.total} ${data.total === 1 ? 'conteúdo encontrado' : 'conteúdos encontrados'} para "${q}".`}
          </p>
          {data.total === 0 ? (
            <EmptyState title="Tente outras palavras.">
              <p>Dica: use termos mais curtos ou confira a lista completa em <Link to="/materias/matematica">Matemática</Link>.</p>
            </EmptyState>
          ) : (
            <ul className="topic-list">
              {data.results.map((t) => (
                <li key={t.slug}>
                  <Link to={`/assuntos/${t.slug}`} className="topic-link">
                    <span className="topic-link__text">
                      <span className="year-pill year-pill--small">{t.schoolYear}º Ano</span>{' '}
                      <strong>{t.title}:</strong> {t.summary}
                    </span>
                    <StatusBadge status={t.progress.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
