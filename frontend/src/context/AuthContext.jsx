import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Guarda em memória quem é o aluno logado.
 * A fonte da verdade é sempre o servidor: ao abrir ou atualizar a página,
 * perguntamos a /auth/session. Nada de sessão fica em localStorage.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'checking' enquanto consulta a sessão; 'ready' depois.
  const [status, setStatus] = useState('checking');
  const [sessionError, setSessionError] = useState(null);
  // true logo depois de clicar em "Sair" (para o login mostrar a confirmação).
  const [loggedOut, setLoggedOut] = useState(false);

  const checkSession = useCallback(async () => {
    setStatus('checking');
    setSessionError(null);
    try {
      const data = await api.auth.session(); // { user } ou { user: null }
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setSessionError(err.message); // servidor indisponível ou erro inesperado
    } finally {
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    checkSession();
    // Se qualquer chamada responder 401, a sessão acabou: volta para o login.
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, [checkSession]);

  const login = useCallback(async (email, password) => {
    const data = await api.auth.login(email, password);
    setLoggedOut(false);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const data = await api.auth.register(form);
    setLoggedOut(false);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setLoggedOut(true);
    setUser(null); // as rotas privadas redirecionam para o login automaticamente
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const data = await api.users.updateMe(changes);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionError, loggedOut, checkSession, login, register, logout, updateProfile }),
    [user, status, sessionError, loggedOut, checkSession, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
