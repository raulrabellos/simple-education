// Listagem dos conteúdos por ano (equivalente a SubjectPage.jsx).
import { api } from '../api.js';
import { paginaPrivada } from '../layout.js';
import { mostrarNaoEncontrado } from '../nao-encontrado.js';
import { carregarEm, definirTitulo, el, parametro, seloStatus, tituloPagina } from '../ui.js';

definirTitulo('Conteúdos');

paginaPrivada((conteudo, { usuario }) => {
  const slug = parametro('slug');
  if (!slug) {
    mostrarNaoEncontrado(conteudo, 'Matéria não encontrada.');
    return;
  }

  carregarEm(conteudo, {
    carregar: () => api.content.subject(slug),
    rotulo: 'Carregando conteúdos...',
    seErro: (erro) => {
      if (erro.status !== 404) return false;
      mostrarNaoEncontrado(conteudo, 'Matéria não encontrada.');
      return true;
    },
    mostrar: ({ subject }) => {
      definirTitulo(subject.name ?? 'Conteúdos');
      conteudo.append(
        el('nav', { class: 'breadcrumb', 'aria-label': 'Você está em' },
          el('ol', null,
            el('li', null, el('a', { href: 'inicio.html' }, 'Início')),
            el('li', { 'aria-current': 'page' }, subject.name))),
        tituloPagina(null, subject.name),
        el('p', { class: 'page-subtitle' },
          'Conteúdos organizados por ano, conforme a proposta da Simple Education. Escolha um assunto para estudar.'),
      );
      for (const year of subject.years) {
        conteudo.append(el('section', { class: 'year-section', 'aria-labelledby': `ano-${year.schoolYear}` },
          el('div', { class: 'year-section__header' },
            el('h2', { id: `ano-${year.schoolYear}`, class: 'year-pill' }, `${year.schoolYear}º Ano`),
            usuario.schoolYear === year.schoolYear ? el('span', { class: 'badge badge--purple' }, 'Seu ano') : null),
          year.topics.length === 0
            ? el('p', { class: 'muted-note' }, 'Nenhum assunto cadastrado para este ano.')
            : el('ul', { class: 'topic-list' }, year.topics.map((t) => el('li', null,
              el('a', { href: `aula.html?slug=${encodeURIComponent(t.slug)}`, class: 'topic-link' },
                el('span', { class: 'topic-link__text' }, el('strong', null, `${t.title}:`), ' ', t.summary),
                seloStatus(t.progress.status)))))));
      }
    },
  });
});
