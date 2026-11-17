// Resultados da pesquisa (equivalente a SearchPage.jsx).
import { api } from '../api.js';
import { paginaPrivada } from '../layout.js';
import { carregarEm, definirTitulo, el, estadoVazio, parametro, seloStatus, tituloPagina } from '../ui.js';

const q = (parametro('q') ?? '').trim();
const valid = q.length >= 2;
definirTitulo(q ? `Pesquisa: ${q}` : 'Pesquisa');

paginaPrivada((conteudo) => {
  conteudo.append(tituloPagina(null, 'Resultados da pesquisa'));

  if (!valid) {
    conteudo.append(estadoVazio('Digite pelo menos 2 letras na barra de pesquisa.',
      el('p', null, 'Você pode buscar pelo nome ou descrição do assunto, como "juros", "seno" ou "probabilidade".')));
    return;
  }

  const area = el('div');
  conteudo.append(area);
  carregarEm(area, {
    carregar: () => api.content.search(q),
    rotulo: 'Pesquisando...',
    mostrar: (data) => {
      area.append(el('p', { class: 'page-subtitle', role: 'status' },
        data.total === 0
          ? `Nenhum conteúdo encontrado para "${q}".`
          : `${data.total} ${data.total === 1 ? 'conteúdo encontrado' : 'conteúdos encontrados'} para "${q}".`));
      if (data.total === 0) {
        area.append(estadoVazio('Tente outras palavras.',
          el('p', null, 'Dica: use termos mais curtos ou confira a lista completa em ',
            el('a', { href: 'materia.html?slug=matematica' }, 'Matemática'), '.')));
        return;
      }
      area.append(el('ul', { class: 'topic-list' }, data.results.map((t) => el('li', null,
        el('a', { href: `aula.html?slug=${encodeURIComponent(t.slug)}`, class: 'topic-link' },
          el('span', { class: 'topic-link__text' },
            el('span', { class: 'year-pill year-pill--small' }, `${t.schoolYear}º Ano`), ' ',
            el('strong', null, `${t.title}:`), ' ', t.summary),
          seloStatus(t.progress.status))))));
    },
  });
});
