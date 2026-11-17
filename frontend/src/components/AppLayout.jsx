import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { firstName } from '../utils/format.js';
import { ChartIcon, CloseIcon, GearIcon, HomeIcon, LogoutIcon, MenuIcon, SearchIcon, UserIcon } from './Icons.jsx';
import { Alert } from './ui.jsx';
import './AppLayout.css';

const MOBILE_QUERY = '(max-width: 900px)';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

/** Barra de pesquisa do cabeçalho (mesmo visual da tela inicial). */
function SearchBar({ onMenuClick, menuOpen }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [hint, setHint] = useState('');

  // Na página de resultados, o campo mostra o termo pesquisado.
  useEffect(() => {
    if (location.pathname === '/pesquisa') setQuery(params.get('q') ?? '');
  }, [location.pathname, params]);

  function handleSubmit(event) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setHint('Digite pelo menos 2 letras para pesquisar.');
      return;
    }
    setHint('');
    navigate(`/pesquisa?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="searchbar-wrap">
      <form className="searchbar" role="search" onSubmit={handleSubmit}>
        <button
          type="button"
          className="searchbar__icon-btn"
          onClick={onMenuClick}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="menu-lateral"
        >
          <MenuIcon size={20} />
        </button>
        <label htmlFor="pesquisa" className="sr-only">Pesquisar conteúdos</label>
        <input
          id="pesquisa"
          type="search"
          placeholder="Pesquisa"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (hint) setHint(''); }}
          maxLength={100}
          autoComplete="off"
          aria-describedby={hint ? 'pesquisa-dica' : undefined}
        />
        <button type="submit" className="searchbar__icon-btn" aria-label="Pesquisar">
          <SearchIcon size={20} />
        </button>
      </form>
      {hint && <p id="pesquisa-dica" className="searchbar__hint" role="status">{hint}</p>}
    </div>
  );
}

function Sidebar({ id, open, isMobile, onClose }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const closeRef = useRef(null);

  // No celular, ao abrir o menu, o foco vai para o botão de fechar.
  useEffect(() => {
    if (isMobile && open) closeRef.current?.focus();
  }, [isMobile, open]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout(); // encerra a sessão no servidor; a rota privada leva ao login
    } catch (err) {
      setLogoutError(err.message);
      setLoggingOut(false);
    }
  }

  const hidden = !open;
  return (
    <aside
      id={id}
      className={`sidebar ${open ? 'sidebar--open' : ''}`}
      aria-label="Menu lateral"
      // Fechado, o menu sai da ordem de tabulação e dos leitores de tela.
      inert={hidden ? true : undefined}
    >
      {isMobile && (
        <button ref={closeRef} type="button" className="sidebar__close" onClick={onClose} aria-label="Fechar menu">
          <CloseIcon size={22} />
        </button>
      )}
      <p className="sidebar__logo">Simple<br />education</p>

      <div className="sidebar__user">
        <span className="sidebar__avatar" aria-hidden="true"><UserIcon size={34} /></span>
        <p className="sidebar__hello">Olá, {firstName(user?.name)}</p>
      </div>

      <nav aria-label="Principal">
        <ul className="sidebar__nav">
          <li>
            <NavLink to="/" end className="nav-item"><HomeIcon /> <span>Inicial</span></NavLink>
          </li>
          <li>
            <NavLink to="/progresso" className="nav-item"><ChartIcon /> <span>Meu progresso</span></NavLink>
          </li>
          <li>
            <NavLink to="/configuracoes" className="nav-item"><GearIcon /> <span>Configurações</span></NavLink>
          </li>
          <li>
            <button type="button" className="nav-item" onClick={handleLogout} disabled={loggingOut} aria-busy={loggingOut || undefined}>
              <LogoutIcon /> <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
            </button>
          </li>
        </ul>
      </nav>
      {logoutError && <Alert className="sidebar__alert">{logoutError}</Alert>}
    </aside>
  );
}

/** Estrutura das páginas logadas: menu lateral + cabeçalho com pesquisa + conteúdo. */
export function AppLayout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);
  const location = useLocation();

  // Ao mudar entre computador e celular, ajusta o estado inicial do menu.
  useEffect(() => setOpen(!isMobile), [isMobile]);

  // No celular, o menu fecha ao trocar de página.
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  const close = useCallback(() => setOpen(false), []);

  // Tecla Esc fecha o menu no celular.
  useEffect(() => {
    if (!isMobile || !open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobile, open, close]);

  return (
    <div className={`app ${open ? 'app--menu-open' : 'app--menu-closed'}`}>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Sidebar id="menu-lateral" open={open} isMobile={isMobile} onClose={close} />
      {isMobile && open && <div className="backdrop" onClick={close} aria-hidden="true" />}

      <div className="app__main">
        <header className="topbar">
          <SearchBar onMenuClick={() => setOpen((v) => !v)} menuOpen={open} />
        </header>
        <main id="conteudo" tabIndex={-1} className="content" inert={isMobile && open ? true : undefined}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
