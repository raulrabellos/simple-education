import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PageTitle } from '../components/ui.jsx';

export function NotFoundContent({ message = 'A página que você procura não existe ou foi movida.' }) {
  usePageTitle('Não encontrado');
  return (
    <>
      <PageTitle>Não encontrado</PageTitle>
      <p className="page-subtitle">{message}</p>
      <Link to="/" className="btn btn--primary">Voltar para o início</Link>
    </>
  );
}

/** Página 404 para quem está logado (dentro do layout). */
export function NotFoundPage() {
  return <NotFoundContent />;
}
