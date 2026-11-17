// Página inicial (equivalente a HomePage.jsx).
import { api } from '../api.js';
import { firstName } from '../formatacao.js';
import { paginaPrivada } from '../layout.js';
import { carregando, definirTitulo, el, estadoErro, estadoVazio, tituloPagina, trocar } from '../ui.js';

definirTitulo('Início');

paginaPrivada((conteudo, { usuario }) => {
  const areaConteudos = el('div');
  const areaContinuar = el('div');
  const areaAvisoProgresso = el('div');

  trocar(conteudo,
    tituloPagina(null, `Seja bem-vindo, ${firstName(usuario.name)}!`),
    el('p', { class: 'page-subtitle' },
      'Essa plataforma disponibilizará conteúdos do 1º, 2º e 3º ano do Ensino Médio, com foco principal em Matemática.'),
    el('h2', { class: 'section-title' }, 'Conteúdos'),
    areaConteudos,
    areaContinuar,
    areaAvisoProgresso);

  function carregarConteudos() {
    trocar(areaConteudos, carregando('Carregando conteúdos...'));
    api.content.subjects().then(
      (data) => {
        if (data.subjects.length === 0) {
          trocar(areaConteudos, estadoVazio('Nenhum conteúdo disponível no momento.'));
          return;
        }
        trocar(areaConteudos, el('ul', { class: 'subject-grid' }, data.subjects.map((s) => el('li', null,
          el('a', { href: `materia.html?slug=${encodeURIComponent(s.slug)}`, class: 'subject-card' },
            el('span', { class: 'subject-card__name' }, s.name),
            el('span', { class: 'subject-card__meta' }, `${s.topicsCompleted} de ${s.topicCount} assuntos concluídos`))))));
      },
      (erro) => {
        trocar(areaConteudos, estadoErro(erro, () => { carregarConteudos(); carregarProgresso(); }));
      },
    );
  }

  function carregarProgresso() {
    areaContinuar.replaceChildren();
    areaAvisoProgresso.replaceChildren();
    api.progress.overview().then(
      (data) => {
        const next = data.continueStudying;
        if (!next) return;
        trocar(areaContinuar, el('section', { class: 'card continue-card', 'aria-labelledby': 'continuar-titulo' },
          el('h2', { id: 'continuar-titulo', class: 'continue-card__title' }, 'Continuar estudando'),
          el('p', { class: 'continue-card__topic' }, next.title, ' ',
            el('span', { class: 'year-pill year-pill--small' }, `${next.schoolYear}º Ano`)),
          el('a', { href: `aula.html?slug=${encodeURIComponent(next.slug)}`, class: 'btn btn--secondary' }, 'Abrir aula')));
      },
      (erro) => {
        if (erro.status !== 401) {
          trocar(areaAvisoProgresso, el('p', { class: 'muted-note' }, 'Não foi possível carregar seu progresso agora.'));
        }
      },
    );
  }

  carregarConteudos();
  carregarProgresso();
});
