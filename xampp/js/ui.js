/*
 * Peças de tela reutilizáveis (equivalentes a frontend/src/components/ui.jsx).
 *
 * SEGURANÇA: todo texto entra no DOM como nó de texto (createTextNode / textContent).
 * Nada aqui usa innerHTML, então conteúdo vindo da API nunca vira HTML.
 */
import { STATUS_LABELS } from './formatacao.js';

// Propriedades que precisam ser definidas como propriedade do elemento (e não como atributo).
const PROPRIEDADES = new Set(['value', 'checked', 'disabled', 'selected', 'inert']);

/** Junta filhos (texto, nós, listas) num elemento. Valores nulos/false são ignorados. */
export function anexar(no, filhos) {
  for (const filho of filhos) {
    if (filho === null || filho === undefined || filho === false || filho === true) continue;
    if (Array.isArray(filho)) anexar(no, filho);
    else if (filho instanceof Node) no.appendChild(filho);
    else no.appendChild(document.createTextNode(String(filho)));
  }
  return no;
}

/**
 * Cria um elemento: el('a', { class: 'btn', href: 'inicio.html', onclick: fn }, 'texto', outroNo).
 * Atributos com valor null/undefined/false não são definidos; true vira atributo vazio.
 */
export function el(tag, props, ...filhos) {
  const no = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props ?? {})) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (chave === 'class') no.className = valor;
    else if (chave.startsWith('on') && typeof valor === 'function') no.addEventListener(chave.slice(2).toLowerCase(), valor);
    else if (PROPRIEDADES.has(chave)) no[chave] = valor;
    else no.setAttribute(chave, valor === true ? '' : String(valor));
  }
  return anexar(no, filhos);
}

/** Substitui todo o conteúdo de um elemento. */
export function trocar(alvo, ...filhos) {
  alvo.replaceChildren();
  return anexar(alvo, filhos);
}

/** Atualiza o título da aba do navegador (igual a usePageTitle). */
export function definirTitulo(titulo) {
  document.title = titulo ? `${titulo} · Simple Education` : 'Simple Education';
}

/** Lê um parâmetro da URL da página (ex.: ?slug=...). */
export function parametro(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

/**
 * Botão padrão. Durante o carregamento fica desabilitado (evita cliques repetidos).
 * `conteudo` é um texto ou uma função que devolve os filhos (para trocar o rótulo depois).
 * Devolve o <button> com os métodos definirCarregando(bool) e definirDesabilitado(bool).
 */
export function botao({ variante = 'primary', tipo = 'button', classe = '', conteudo, textoCarregando, desabilitado = false, carregando = false, aoClicar, attrs = {} }) {
  const b = el('button', { type: tipo, class: `btn btn--${variante} ${classe}`.trim(), ...attrs });
  const estado = { carregando, desabilitado };
  const filhos = () => (typeof conteudo === 'function' ? conteudo() : conteudo);
  function desenhar() {
    b.disabled = estado.desabilitado || estado.carregando;
    if (estado.carregando) b.setAttribute('aria-busy', 'true');
    else b.removeAttribute('aria-busy');
    b.replaceChildren();
    if (estado.carregando) b.appendChild(el('span', { class: 'spinner spinner--small', 'aria-hidden': 'true' }));
    anexar(b, [estado.carregando && textoCarregando ? textoCarregando : filhos()]);
  }
  b.definirCarregando = (valor) => { estado.carregando = Boolean(valor); desenhar(); };
  b.definirDesabilitado = (valor) => { estado.desabilitado = Boolean(valor); desenhar(); };
  b.redesenhar = desenhar;
  if (aoClicar) b.addEventListener('click', aoClicar);
  desenhar();
  return b;
}

/** Link com aparência de botão. */
export function botaoLink({ variante = 'primary', classe = '', href }, ...filhos) {
  return el('a', { class: `btn btn--${variante} ${classe}`.trim(), href }, ...filhos);
}

let contadorIds = 0;
function novoId() {
  contadorIds += 1;
  return `campo-${contadorIds}`;
}

/** Monta o bloco .field com rótulo, dica e erro ligados por aria-describedby. */
function campo(rotulo, controle, dica, idCampo) {
  const hintId = dica ? `${idCampo}-hint` : null;
  const errorId = `${idCampo}-error`;
  const erroEl = el('p', { class: 'field__error', id: errorId });
  const wrapper = el('div', { class: 'field' },
    el('label', { for: idCampo }, rotulo),
    controle,
    dica ? el('p', { class: 'field__hint', id: hintId }, dica) : null,
  );
  function definirErro(mensagem) {
    if (mensagem) {
      wrapper.classList.add('field--invalid');
      controle.setAttribute('aria-invalid', 'true');
      erroEl.textContent = mensagem;
      if (!erroEl.isConnected) wrapper.appendChild(erroEl);
    } else {
      wrapper.classList.remove('field--invalid');
      controle.removeAttribute('aria-invalid');
      erroEl.remove();
    }
    const ids = [hintId, mensagem ? errorId : null].filter(Boolean).join(' ');
    if (ids) controle.setAttribute('aria-describedby', ids);
    else controle.removeAttribute('aria-describedby');
  }
  definirErro('');
  return { wrapper, definirErro };
}

/** Campo de texto. Devolve { wrapper, input, definirErro }. */
export function campoTexto({ rotulo, dica, id, ...atributos }) {
  const idCampo = id ?? novoId();
  const input = el('input', { id: idCampo, ...atributos });
  const { wrapper, definirErro } = campo(rotulo, input, dica, idCampo);
  return { wrapper, input, definirErro };
}

/** Lista de seleção. Devolve { wrapper, select, definirErro }. */
export function campoSelecao({ rotulo, dica, id, opcoes, valor = '', ...atributos }) {
  const idCampo = id ?? novoId();
  const select = el('select', { id: idCampo, ...atributos },
    opcoes.map((o) => el('option', { value: o.value }, o.label)));
  select.value = valor;
  const { wrapper, definirErro } = campo(rotulo, select, dica, idCampo);
  return { wrapper, select, definirErro };
}

/** Mensagem de aviso. Erros são anunciados imediatamente por leitores de tela. */
export function alerta(tipo = 'error', ...filhos) {
  return el('div', { class: `alert alert--${tipo}`, role: tipo === 'error' ? 'alert' : 'status' }, ...filhos);
}

/** Dica de solução que acompanha o erro (ex.: MySQL desligado), se houver. */
export function dicaDoErro(erro) {
  return erro?.hint ? el('p', { class: 'erro-dica' }, erro.hint) : null;
}

/** Aviso de erro com a mensagem e, se houver, a dica de solução enviada pela API. */
export function alertaErro(erro, classe = '') {
  const a = alerta('error', erro?.message ?? 'Ocorreu um erro inesperado. Tente novamente.', dicaDoErro(erro));
  if (classe) a.classList.add(classe);
  return a;
}

export function carregando(rotulo = 'Carregando...') {
  return el('div', { class: 'loading', role: 'status' },
    el('span', { class: 'spinner', 'aria-hidden': 'true' }),
    el('span', null, rotulo));
}

/** Erro ao carregar dados, com botão para tentar de novo. */
export function estadoErro(erro, aoTentar) {
  return el('div', { class: 'state-box', role: 'alert' },
    el('p', { class: 'state-box__title' }, 'Não foi possível carregar.'),
    el('p', null, erro?.message ?? 'Tente novamente em instantes.'),
    dicaDoErro(erro),
    aoTentar ? botao({ variante: 'secondary', conteudo: 'Tentar novamente', aoClicar: aoTentar }) : null);
}

export function estadoVazio(titulo, ...filhos) {
  return el('div', { class: 'state-box' }, el('p', { class: 'state-box__title' }, titulo), ...filhos);
}

export function barraProgresso(valor, max = 100, rotulo) {
  const percent = max > 0 ? Math.round((valor / max) * 100) : 0;
  return el('div', { class: 'progress' },
    el('div', {
      class: 'progress__track',
      role: 'progressbar',
      'aria-label': rotulo,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': valor,
      'aria-valuetext': `${valor} de ${max}`,
    }, el('div', { class: 'progress__fill', style: `width: ${percent}%` })));
}

export function seloStatus(status) {
  return el('span', { class: `badge badge--${status}` }, STATUS_LABELS[status] ?? status);
}

const DIFFICULTY_LABELS = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

export function seloDificuldade(nivel) {
  return el('span', { class: `badge badge--difficulty badge--${nivel}` }, `Nível: ${DIFFICULTY_LABELS[nivel] ?? nivel}`);
}

// No primeiro título da página o foco fica no início (o Tab chega ao "Pular para o conteúdo").
let primeiroTitulo = true;

/**
 * Título principal (h1). Quando a tela muda sem recarregar (ex.: resultado dos exercícios),
 * o novo título recebe o foco, para quem usa teclado ou leitor de tela saber que a tela mudou.
 */
export function tituloPagina(classe, ...filhos) {
  const h1 = el('h1', { tabindex: '-1', class: `page-title ${classe ?? ''}`.trim() }, ...filhos);
  if (primeiroTitulo) {
    primeiroTitulo = false;
  } else {
    // Espera o título entrar na página para focar. Se a tela já levou o foco para outro
    // elemento (ex.: o enunciado da questão), não rouba o foco.
    requestAnimationFrame(() => {
      const ativo = document.activeElement;
      if (h1.isConnected && (!ativo || ativo === document.body)) h1.focus({ preventScroll: true });
    });
  }
  return h1;
}

/**
 * Carrega dados da API dentro de `alvo`, com os estados de carregamento e erro
 * (equivalente ao hook useApi). Respostas antigas são descartadas se houver nova carga.
 *   carregarEm(alvo, { carregar, rotulo, mostrar(dados), seErro(erro) → true se tratou })
 */
export function carregarEm(alvo, { carregar, rotulo = 'Carregando...', mostrar, seErro }) {
  const pedido = (alvo.pedidoAtual = (alvo.pedidoAtual ?? 0) + 1);
  const recarregar = () => carregarEm(alvo, { carregar, rotulo, mostrar, seErro });
  trocar(alvo, carregando(rotulo));
  return carregar().then(
    (dados) => {
      if (pedido !== alvo.pedidoAtual) return;
      alvo.replaceChildren();
      mostrar(dados, recarregar);
    },
    (erro) => {
      if (pedido !== alvo.pedidoAtual) return;
      alvo.replaceChildren();
      if (seErro && seErro(erro, recarregar)) return;
      trocar(alvo, estadoErro(erro, recarregar));
    },
  );
}
