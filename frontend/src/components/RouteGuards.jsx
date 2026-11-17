import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Button, Loading } from './ui.jsx';

function SessionCheck() {
  const { sessionError, checkSession } = useAuth();
  if (sessionError) {
    return (
      <main className="center-screen">
        <Alert>{sessionError}</Alert>
        <Button variant="secondary" onClick={checkSession}>Tentar novamente</Button>
      </main>
    );
  }
  return <main className="center-screen"><Loading label="Verificando sua sessão..." /></main>;
}

/**
 * Rotas privadas: só renderizam depois que o servidor confirma a sessão.
 * Sem sessão, vai para o login e guarda a página pedida para voltar depois.
 */
export function PrivateRoute() {
  const { user, status, sessionError, loggedOut } = useAuth();
  const location = useLocation();
  if (status === 'checking' || sessionError) return <SessionCheck />;
  // Depois de "Sair", volta para o login sem lembrar a página anterior.
  if (!user) return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location }} />;
  return <Outlet />;
}

/** Login e cadastro: quem já está logado vai direto para o início. */
export function PublicOnlyRoute() {
  const { user, status, sessionError } = useAuth();
  if (status === 'checking' || sessionError) return <SessionCheck />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
