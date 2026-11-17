// Meu progresso (equivalente a ProgressPage.jsx).
import { api } from '../api.js';
import { formatDateTime, scoreLabel } from '../formatacao.js';
import { paginaPrivada } from '../layout.js';
import {
  alertaErro, barraProgresso, botao, carregarEm, definirTitulo, el, estadoVazio, seloStatus, tituloPagina,
} from '../ui.js';

const PAGE_SIZE = 10;

definirTitulo('Meu progresso');

paginaPrivada((conteudo) => {
  const areaResumo = el('div');
  const areaHistorico = el('div');
  conteudo.append(
    tituloPagina(null, 'Meu progresso'),
    el('p', { class: 'page-subtitle' }, 'Acompanhe as aulas estudadas, os exercícios respondidos e seus acertos.'),
    areaResumo,
    el('section', { 'aria-labelledby': 'historico-titulo' },
      el('h2', { id: 'historico-titulo', class: 'section-title' }, 'Histórico de tentativas'),
      areaHistorico));

  carregarEm(areaResumo, {
    carregar: () => api.progress.overview(),
    rotulo: 'Carregando seu progresso...',
    mostrar: (data) => areaResumo.append(...resumo(data)),
  });

  carregarEm(areaHistorico, {
    carregar: () => api.attempts.list({ limit: PAGE_SIZE, offset: 0 }),
    rotulo: 'Carregando histórico...',
    mostrar: (data) => historico(areaHistorico, data),
  });
});

function estatistica(valor, rotulo) {
  return el('li', { class: 'card stat' }, el('span', { class: 'stat__value' }, valor), el('span', { class: 'stat__label' }, rotulo));
}

function resumo({ totals, byYear, topics, masteryThreshold }) {
  return [
    el('ul', { class: 'stat-grid', 'aria-label': 'Resumo geral' },
      estatistica(`${totals.lessonsCompleted}/${totals.topicsTotal}`, 'Aulas concluídas'),
      estatistica(`${totals.topicsCompleted}/${totals.topicsTotal}`, 'Assuntos concluídos'),
      estatistica(String(totals.questionsAnswered), 'Exercícios respondidos'),
      estatistica(totals.accuracy === null ? '—' : `${totals.accuracy}%`,
        `Taxa de acertos (${totals.correctAnswers} acertos, ${totals.wrongAnswers} erros)`)),

    el('details', { class: 'card how-it-works' },
      el('summary', null, 'Como o progresso é calculado'),
      el('ul', null,
        el('li', null, el('strong', null, 'Aula concluída:'), ' você marcou na página do assunto que estudou o conteúdo.'),
        el('li', null, el('strong', null, 'Exercício respondido:'), ' cada questão que você respondeu em alguma tentativa.'),
        el('li', null, el('strong', null, 'Acerto:'), ' resposta correta, conferida pelo servidor.'),
        el('li', null, el('strong', null, 'Assunto concluído:'), ` aula concluída e pelo menos ${masteryThreshold}% de acertos em uma tentativa finalizada.`))),

    el('h2', { class: 'section-title' }, 'Por ano'),
    el('ul', { class: 'year-progress' }, byYear.map((y) => el('li', { class: 'card' },
      el('div', { class: 'year-progress__head' },
        el('span', { class: 'year-pill year-pill--small' }, `${y.schoolYear}º Ano`),
        el('span', null, `${y.topicsCompleted} de ${y.topicsTotal} assuntos concluídos`)),
      barraProgresso(y.topicsCompleted, y.topicsTotal, `Assuntos concluídos do ${y.schoolYear}º ano`)))),

    el('h2', { class: 'section-title' }, 'Por assunto'),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'table' },
        el('caption', { class: 'sr-only' }, 'Progresso em cada assunto'),
        el('thead', null, el('tr', null,
          ['Assunto', 'Ano', 'Situação', 'Aula', 'Melhor nota', 'Acertos'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', null, topics.map(({ topic, progress }) => el('tr', null,
          el('th', { scope: 'row' }, el('a', { href: `aula.html?slug=${encodeURIComponent(topic.slug)}` }, topic.title)),
          el('td', null, `${topic.schoolYear}º`),
          el('td', null, seloStatus(progress.status)),
          el('td', null, progress.lessonCompleted ? 'Concluída' : 'Pendente'),
          el('td', null, scoreLabel(progress.bestScore)),
          el('td', null, `${progress.correctAnswers}/${progress.questionsAnswered}`)))))),
  ];
}

/** Histórico de tentativas, com paginação por "Carregar mais". */
function historico(area, primeiraPagina) {
  const items = [...primeiraPagina.items];
  const total = primeiraPagina.total ?? 0;

  if (total === 0) {
    area.append(estadoVazio('Você ainda não fez exercícios.',
      el('p', null, 'Escolha um assunto em ', el('a', { href: 'materia.html?slug=matematica' }, 'Matemática'),
        ' e clique em "Praticar exercícios".')));
    return;
  }

  const lista = el('ul', { class: 'history' });
  const areaErro = el('div');
  const carregarMais = botao({
    variante: 'secondary',
    conteudo: () => `Carregar mais (${total - items.length} restantes)`,
    textoCarregando: 'Carregando...',
  });
  area.append(lista, areaErro, carregarMais);

  function adicionar(novos) {
    for (const a of novos) {
      const finalizada = a.status === 'finished';
      lista.appendChild(el('li', { class: 'card history__item' },
        el('div', null,
          el('p', { class: 'history__topic' }, a.topic.title),
          el('p', { class: 'history__date' }, `${formatDateTime(a.startedAt)} · ${finalizada ? 'Finalizada' : 'Em andamento'}`)),
        el('p', { class: 'history__score' }, finalizada ? `${a.scorePercent}%` : `${a.answered}/${a.totalQuestions} respondidas`),
        el('a', { href: `tentativa.html?id=${encodeURIComponent(a.id)}`, class: 'btn btn--secondary' },
          finalizada ? 'Revisar' : 'Ver e continuar',
          el('span', { class: 'sr-only' }, ` tentativa de ${a.topic.title} de ${formatDateTime(a.startedAt)}`))));
    }
    if (items.length < total) carregarMais.redesenhar();
    else carregarMais.remove();
  }

  let loadingMore = false;
  carregarMais.addEventListener('click', async () => {
    if (loadingMore) return;
    loadingMore = true;
    carregarMais.definirCarregando(true);
    areaErro.replaceChildren();
    try {
      const page = await api.attempts.list({ limit: PAGE_SIZE, offset: items.length });
      items.push(...page.items);
      carregarMais.definirCarregando(false);
      adicionar(page.items);
    } catch (err) {
      areaErro.replaceChildren(alertaErro(err));
      carregarMais.definirCarregando(false);
    } finally {
      loadingMore = false;
    }
  });

  adicionar(items);
}
