/*
 * Proteção das páginas e estrutura das telas logadas
 * (equivalente a RouteGuards.jsx + AppLayout.jsx + AuthContext.jsx da versão React).
 *
 * - Toda página pergunta ao servidor (GET /auth/session) se há sessão. Nada fica em localStorage.
 * - Página privada sem sessão → login.html?voltar=<página pedida>.
 * - Login e cadastro com sessão → inicio.html.
 */
import { api, setUnauthorizedHandler } from './api.js';
import { firstName } from './formatacao.js';
import { icone } from './icones.js';
import { alertaErro, botao, carregando, el, trocar } from './ui.js';

const MOBILE_QUERY = '(max-width: 900px)';

/** Nome do arquivo da página atual (ex.: "aula.html"). */
function arquivoAtual() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

/** Endereço relativo da página atual, com os parâmetros (ex.: "aula.html?slug=x"). */
function paginaAtual() {
  return arquivoAtual() + window.location.search;
}

/**
 * Aceita só páginas desta pasta como destino depois do login (evita redirecionar para outro site).
 * Ex.: "aula.html?slug=trigonometria".
 */
export function destinoSeguro(valor) {
  if (!valor) return null;
  return /^[a-z0-9-]+\.html(\?[^#\\]*)?$/i.test(valor) ? valor : null;
}

/** Vai para o login. Com `lembrar`, guarda a página atual para voltar depois de entrar. */
function irParaLogin({ lembrar = true, saiu = false } = {}) {
  const params = new URLSearchParams();
  const atual = arquivoAtual();
  if (lembrar && atual !== 'index.html' && atual !== 'login.html' && atual !== 'cadastro.html') params.set('voltar', paginaAtual());
  if (saiu) params.set('saiu', '1');
  const query = params.toString();
  window.location.replace(`login.html${query ? `?${query}` : ''}`);
}

/** Tela enquanto a sessão é conferida; em caso de erro, mostra o aviso e "Tentar novamente". */
function verificarSessao(root, aoConfirmar) {
  trocar(root, el('main', { class: 'center-screen' }, carregando('Verificando sua sessão...')));
  api.auth.session().then(
    (data) => aoConfirmar(data.user ?? null),
    (erro) => {
      // Servidor indisponível, MySQL desligado (com a dica de solução) ou erro inesperado.
      trocar(root, el('main', { class: 'center-screen' },
        alertaErro(erro),
        botao({ variante: 'secondary', conteudo: 'Tentar novamente', aoClicar: () => verificarSessao(root, aoConfirmar) })));
    },
  );
}

/** index.html: confere a sessão e manda para o início ou para o login. */
export function paginaEntrada() {
  const root = document.getElementById('root');
  verificarSessao(root, (usuario) => {
    window.location.replace(usuario ? 'inicio.html' : 'login.html');
  });
}

/** Login e cadastro: quem já está logado vai direto para o início. */
export function paginaPublica(montar) {
  const root = document.getElementById('root');
  verificarSessao(root, (usuario) => {
    if (usuario) {
      window.location.replace('inicio.html');
      return;
    }
    root.replaceChildren();
    montar(root);
  });
}

/**
 * Páginas logadas: só aparecem depois que o servidor confirma a sessão.
 * `montar(conteudo, contexto)` recebe o <main> do conteúdo e { usuario, atualizarUsuario }.
 */
export function paginaPrivada(montar) {
  const root = document.getElementById('root');
  verificarSessao(root, (usuario) => {
    if (!usuario) {
      irParaLogin();
      return;
    }
    // Se qualquer chamada responder 401, a sessão acabou: volta para o login.
    setUnauthorizedHandler(() => irParaLogin());
    const layout = montarLayout(root, usuario);
    const contexto = {
      usuario,
      atualizarUsuario(novo) {
        contexto.usuario = novo;
        layout.atualizarUsuario(novo);
      },
    };
    montar(layout.conteudo, contexto);
  });
}

/** Barra de pesquisa do cabeçalho (mesmo visual da tela inicial). */
function barraPesquisa(aoClicarMenu) {
  const botaoMenu = el('button', {
    type: 'button',
    class: 'searchbar__icon-btn',
    'aria-controls': 'menu-lateral',
    onclick: aoClicarMenu,
  }, icone('menu', 20));

  const input = el('input', {
    id: 'pesquisa',
    type: 'search',
    placeholder: 'Pesquisa',
    maxlength: '100',
    autocomplete: 'off',
  });
  // Na página de resultados, o campo mostra o termo pesquisado.
  if (arquivoAtual() === 'pesquisa.html') input.value = new URLSearchParams(window.location.search).get('q') ?? '';

  const dica = el('p', { id: 'pesquisa-dica', class: 'searchbar__hint', role: 'status' });
  const wrap = el('div', { class: 'searchbar-wrap' });

  function mostrarDica(texto) {
    if (texto) {
      dica.textContent = texto;
      if (!dica.isConnected) wrap.appendChild(dica);
      input.setAttribute('aria-describedby', 'pesquisa-dica');
    } else {
      dica.remove();
      input.removeAttribute('aria-describedby');
    }
  }

  input.addEventListener('input', () => { if (dica.isConnected) mostrarDica(''); });

  const form = el('form', {
    class: 'searchbar',
    role: 'search',
    onsubmit: (event) => {
      event.preventDefault();
      const q = input.value.trim();
      if (q.length < 2) {
        mostrarDica('Digite pelo menos 2 letras para pesquisar.');
        return;
      }
      mostrarDica('');
      window.location.href = `pesquisa.html?q=${encodeURIComponent(q)}`;
    },
  },
  botaoMenu,
  el('label', { for: 'pesquisa', class: 'sr-only' }, 'Pesquisar conteúdos'),
  input,
  el('button', { type: 'submit', class: 'searchbar__icon-btn', 'aria-label': 'Pesquisar' }, icone('pesquisa', 20)));

  wrap.appendChild(form);
  return { wrap, botaoMenu };
}

/** Item do menu: o da página atual fica destacado (contorno roxo) e com aria-current. */
function itemMenu(href, nomeIcone, texto) {
  const ativo = arquivoAtual() === href;
  return el('li', null,
    el('a', { href, class: `nav-item${ativo ? ' active' : ''}`, 'aria-current': ativo ? 'page' : null },
      icone(nomeIcone), ' ', el('span', null, texto)));
}

/** Estrutura das páginas logadas: menu lateral + cabeçalho com pesquisa + conteúdo. */
function montarLayout(root, usuario) {
  const mq = window.matchMedia(MOBILE_QUERY);
  const estado = { isMobile: mq.matches, open: !mq.matches };

  // ---------- Menu lateral ----------
  const ola = el('p', { class: 'sidebar__hello' }, `Olá, ${firstName(usuario?.name)}`);
  const textoSair = el('span', null, 'Sair');
  const botaoSair = el('button', { type: 'button', class: 'nav-item' }, icone('sair'), ' ', textoSair);
  const erroSair = el('div');
  const botaoFechar = el('button', { type: 'button', class: 'sidebar__close', 'aria-label': 'Fechar menu', onclick: () => definirAberto(false) }, icone('fechar', 22));

  botaoSair.addEventListener('click', async () => {
    botaoSair.disabled = true;
    botaoSair.setAttribute('aria-busy', 'true');
    textoSair.textContent = 'Saindo...';
    erroSair.replaceChildren();
    try {
      await api.auth.logout(); // encerra a sessão no servidor
      // Depois de "Sair", volta para o login sem lembrar a página anterior.
      irParaLogin({ lembrar: false, saiu: true });
    } catch (err) {
      erroSair.replaceChildren(alertaErro(err, 'sidebar__alert'));
      botaoSair.disabled = false;
      botaoSair.removeAttribute('aria-busy');
      textoSair.textContent = 'Sair';
    }
  });

  const sidebar = el('aside', { id: 'menu-lateral', class: 'sidebar', 'aria-label': 'Menu lateral' },
    el('p', { class: 'sidebar__logo' }, 'Simple', el('br'), 'education'),
    el('div', { class: 'sidebar__user' },
      el('span', { class: 'sidebar__avatar', 'aria-hidden': 'true' }, icone('usuario', 34)),
      ola),
    el('nav', { 'aria-label': 'Principal' },
      el('ul', { class: 'sidebar__nav' },
        itemMenu('inicio.html', 'inicio', 'Inicial'),
        itemMenu('progresso.html', 'grafico', 'Meu progresso'),
        itemMenu('configuracoes.html', 'engrenagem', 'Configurações'),
        el('li', null, botaoSair))),
    erroSair);

  const fundo = el('div', { class: 'backdrop', 'aria-hidden': 'true', onclick: () => definirAberto(false) });

  // ---------- Cabeçalho e conteúdo ----------
  const { wrap, botaoMenu } = barraPesquisa(() => definirAberto(!estado.open));
  const conteudo = el('main', { id: 'conteudo', tabindex: '-1', class: 'content' });
  const app = el('div', { class: 'app' },
    el('a', { href: '#conteudo', class: 'skip-link' }, 'Pular para o conteúdo'),
    sidebar,
    el('div', { class: 'app__main' },
      el('header', { class: 'topbar' }, wrap),
      conteudo));

  // Tecla Esc fecha o menu no celular.
  function aoTeclar(e) {
    if (e.key === 'Escape') definirAberto(false);
  }

  function aplicar() {
    const { isMobile, open } = estado;
    app.className = `app ${open ? 'app--menu-open' : 'app--menu-closed'}`;
    sidebar.classList.toggle('sidebar--open', open);
    // Fechado, o menu sai da ordem de tabulação e dos leitores de tela.
    sidebar.toggleAttribute('inert', !open);

    if (isMobile && !botaoFechar.isConnected) sidebar.prepend(botaoFechar);
    if (!isMobile) botaoFechar.remove();

    if (isMobile && open) { if (!fundo.isConnected) sidebar.after(fundo); } else fundo.remove();

    conteudo.toggleAttribute('inert', isMobile && open);

    botaoMenu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    botaoMenu.setAttribute('aria-expanded', String(open));

    document.removeEventListener('keydown', aoTeclar);
    if (isMobile && open) document.addEventListener('keydown', aoTeclar);
  }

  function definirAberto(valor) {
    const mudou = estado.open !== valor;
    estado.open = valor;
    aplicar();
    // No celular, ao abrir o menu, o foco vai para o botão de fechar.
    if (mudou && estado.isMobile && estado.open) botaoFechar.focus();
  }

  // Ao mudar entre computador e celular, ajusta o estado inicial do menu.
  mq.addEventListener('change', () => {
    estado.isMobile = mq.matches;
    estado.open = !mq.matches;
    aplicar();
  });

  aplicar();
  trocar(root, app);

  return {
    conteudo,
    atualizarUsuario(novo) {
      ola.textContent = `Olá, ${firstName(novo?.name)}`;
    },
  };
}

/** Lê e limpa o aviso "Você saiu da sua conta." (só aparece uma vez, como na versão React). */
export function acabouDeSair() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('saiu') !== '1') return false;
  params.delete('saiu');
  const query = params.toString();
  window.history.replaceState(null, '', `${arquivoAtual()}${query ? `?${query}` : ''}${window.location.hash}`);
  return true;
}
