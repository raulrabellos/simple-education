// Página de estudo (aula) de um assunto (equivalente a TopicPage.jsx).
import { api } from '../api.js';
import { formatDateTime, scoreLabel } from '../formatacao.js';
import { icone } from '../icones.js';
import { paginaPrivada } from '../layout.js';
import { mostrarNaoEncontrado } from '../nao-encontrado.js';
import { corpoAula, textoRico } from '../texto-aula.js';
import { alerta, alertaErro, botao, carregarEm, definirTitulo, el, parametro, seloStatus, tituloPagina, trocar } from '../ui.js';

const SECTION_LABEL = {
  explicacao: 'Explicação',
  formulas: 'Conceitos e fórmulas',
  exemplo: 'Exemplo resolvido',
  resumo: 'Resumo',
  conceito: 'Conceito',
  dica: 'Dica',
};

definirTitulo('Aula');

paginaPrivada((conteudo) => {
  const slug = parametro('slug');
  if (!slug) {
    mostrarNaoEncontrado(conteudo, 'Assunto não encontrado.');
    return;
  }

  carregarEm(conteudo, {
    carregar: () => api.content.topic(slug),
    rotulo: 'Carregando aula...',
    seErro: (erro) => {
      if (erro.status !== 404) return false;
      mostrarNaoEncontrado(conteudo, 'Assunto não encontrado.');
      return true;
    },
    mostrar: ({ topic }) => mostrarAula(conteudo, topic),
  });
});

function mostrarAula(conteudo, topic) {
  definirTitulo(topic.title ?? 'Aula');
  let progress = topic.progress;
  let saving = false;

  const tags = el('div', { class: 'lesson__tags' });
  const feedback = el('div', { 'aria-live': 'polite' });
  const estatisticas = el('div');

  const botaoAula = botao({
    conteudo: () => (progress.lessonCompleted ? [icone('certo', 18), ' Aula concluída'] : 'Marcar aula como concluída'),
    textoCarregando: 'Salvando...',
    aoClicar: alternarAula,
  });
  const linkExercicios = el('a', { href: `exercicios.html?slug=${encodeURIComponent(topic.slug)}` },
    `Praticar exercícios (${topic.questionCount} questões)`);

  /** Atualiza as partes que dependem do progresso (selo, botões e números). */
  function atualizar() {
    trocar(tags, el('span', { class: 'year-pill year-pill--small' }, `${topic.schoolYear}º Ano`), seloStatus(progress.status));
    botaoAula.className = `btn btn--${progress.lessonCompleted ? 'secondary' : 'primary'}`;
    botaoAula.setAttribute('aria-pressed', String(Boolean(progress.lessonCompleted)));
    botaoAula.redesenhar();
    linkExercicios.className = `btn btn--${progress.lessonCompleted ? 'primary' : 'secondary'}`;
    estatisticas.replaceChildren();
    if (progress.attemptsFinished > 0) {
      estatisticas.appendChild(el('dl', { class: 'mini-stats' },
        el('div', null, el('dt', null, 'Melhor nota'), el('dd', null, scoreLabel(progress.bestScore))),
        el('div', null, el('dt', null, 'Última nota'), el('dd', null, scoreLabel(progress.lastScore))),
        el('div', null, el('dt', null, 'Tentativas finalizadas'), el('dd', null, String(progress.attemptsFinished))),
        el('div', null, el('dt', null, 'Última atividade'), el('dd', null, formatDateTime(progress.lastActivityAt)))));
    }
  }

  async function alternarAula() {
    if (saving) return;
    saving = true;
    botaoAula.definirCarregando(true);
    feedback.replaceChildren();
    try {
      const result = progress.lessonCompleted
        ? await api.content.uncompleteLesson(topic.slug)
        : await api.content.completeLesson(topic.slug);
      progress = result.progress;
      feedback.replaceChildren(alerta('success',
        result.progress.lessonCompleted ? 'Aula marcada como concluída.' : 'Marcação de aula concluída removida.'));
    } catch (err) {
      feedback.replaceChildren(alertaErro(err));
    } finally {
      saving = false;
      botaoAula.definirCarregando(false);
      atualizar();
    }
  }

  const article = el('article', { class: 'lesson' },
    el('nav', { class: 'breadcrumb', 'aria-label': 'Você está em' },
      el('ol', null,
        el('li', null, el('a', { href: 'inicio.html' }, 'Início')),
        el('li', null, el('a', { href: `materia.html?slug=${encodeURIComponent(topic.subject.slug)}` }, topic.subject.name)),
        el('li', { 'aria-current': 'page' }, topic.title))),
    tags,
    tituloPagina(null, topic.title),
    el('p', { class: 'page-subtitle' }, topic.summary),
    topic.objective
      ? el('section', { class: 'lesson-objective', 'aria-labelledby': 'objetivo-titulo' },
        el('h2', { id: 'objetivo-titulo', class: 'lesson-objective__title' }, 'Objetivo de aprendizagem'),
        el('p', null, textoRico(topic.objective)))
      : null,
    (topic.sections ?? []).map((section) => el('section', { class: `lesson-section lesson-section--${section.kind}` },
      el('p', { class: 'lesson-section__kind' }, SECTION_LABEL[section.kind] ?? section.kind),
      el('h2', { class: 'lesson-section__title' }, textoRico(section.title)),
      corpoAula(section.body))),
    el('section', { class: 'card lesson-actions', 'aria-labelledby': 'pratica-titulo' },
      el('h2', { id: 'pratica-titulo', class: 'lesson-actions__title' }, 'Terminou de estudar?'),
      el('p', { class: 'muted-note' },
        'Marcar a aula como concluída registra que você estudou o conteúdo. Para concluir o assunto, '
        + 'também é preciso acertar pelo menos 70% dos exercícios em uma tentativa.'),
      feedback,
      el('div', { class: 'btn-row' }, botaoAula, linkExercicios),
      estatisticas));

  atualizar();
  conteudo.appendChild(article);
}
