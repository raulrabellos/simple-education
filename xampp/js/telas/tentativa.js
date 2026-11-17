// Revisão de uma tentativa do histórico (equivalente a AttemptPage.jsx).
// Só mostra gabarito das questões respondidas.
import { api } from '../api.js';
import { formatDateTime } from '../formatacao.js';
import { paginaPrivada } from '../layout.js';
import { mostrarNaoEncontrado } from '../nao-encontrado.js';
import { textoRico } from '../texto-aula.js';
import { botaoLink, carregarEm, definirTitulo, el, parametro, seloDificuldade, tituloPagina } from '../ui.js';

definirTitulo('Revisão da tentativa');

paginaPrivada((conteudo) => {
  const id = parametro('id');
  if (!id) {
    mostrarNaoEncontrado(conteudo, 'Tentativa não encontrada.');
    return;
  }

  carregarEm(conteudo, {
    carregar: () => api.attempts.detail(id),
    rotulo: 'Carregando tentativa...',
    seErro: (erro) => {
      if (erro.status !== 404 && erro.status !== 400) return false;
      mostrarNaoEncontrado(conteudo, 'Tentativa não encontrada.');
      return true;
    },
    mostrar: ({ attempt, questions }) => {
      definirTitulo('Revisão da tentativa');
      const finished = attempt.status === 'finished';
      conteudo.append(
        el('p', { class: 'back-link' }, el('a', { href: 'progresso.html' }, '← Voltar para Meu progresso')),
        tituloPagina(null, `Revisão: ${attempt.topic.title}`),
        el('p', { class: 'page-subtitle' },
          `Iniciada em ${formatDateTime(attempt.startedAt)}`,
          finished ? ` · finalizada em ${formatDateTime(attempt.finishedAt)}` : ' · ainda não finalizada'),
        el('dl', { class: 'mini-stats card' },
          el('div', null, el('dt', null, 'Nota'), el('dd', null, finished ? `${attempt.scorePercent}%` : '—')),
          el('div', null, el('dt', null, 'Acertos'), el('dd', null, String(attempt.correct))),
          el('div', null, el('dt', null, 'Erros'), el('dd', null, String(attempt.wrong))),
          el('div', null, el('dt', null, 'Sem resposta'), el('dd', null, String(attempt.unanswered)))),
        finished ? null : el('div', { class: 'btn-row spaced' },
          botaoLink({ href: `exercicios.html?slug=${encodeURIComponent(attempt.topic.slug)}&tentativa=${encodeURIComponent(attempt.id)}` }, 'Continuar tentativa')),
        el('ol', { class: 'review-list' }, questions.map((q) => el('li', { class: 'card review-item' },
          q.difficulty ? seloDificuldade(q.difficulty) : null,
          el('p', { class: 'review-item__statement' }, textoRico(q.statement)),
          q.answer ? revisaoResposta(q) : el('p', { class: 'muted-note' }, 'Não respondida — o gabarito aparece apenas para questões respondidas.')))),
      );
    },
  });
});

function revisaoResposta(q) {
  return [
    el('ul', { class: 'review-options' }, q.options.map((o) => {
      const isCorrect = o.id === q.answer.correctOptionId;
      const isSelected = o.id === q.answer.selectedOptionId;
      const classe = `${isCorrect ? 'is-correct' : ''} ${isSelected && !isCorrect ? 'is-wrong' : ''}`.trim();
      return el('li', { class: classe || null },
        el('strong', null, `${o.letter})`), ' ', textoRico(o.text),
        isCorrect ? el('span', { class: 'option__tag' }, 'Correta') : null,
        isSelected && !isCorrect ? el('span', { class: 'option__tag' }, 'Sua resposta') : null);
    })),
    el('p', { class: q.answer.isCorrect ? 'text-ok' : 'text-bad' }, q.answer.isCorrect ? 'Você acertou.' : 'Você errou.'),
    el('p', { class: 'review-item__explanation' }, el('strong', null, 'Explicação:'), ' ', textoRico(q.answer.explanation)),
  ];
}
