/*
 * Fluxo de exercícios (equivalente a ExercisePage.jsx):
 *  intro → (Começar) → questão a questão com correção → resultado.
 * Para continuar uma tentativa não finalizada: exercicios.html?slug=...&tentativa=ID
 * A correta e a explicação só chegam do servidor depois de cada resposta.
 */
import { api } from '../api.js';
import { paginaPrivada } from '../layout.js';
import { mostrarNaoEncontrado } from '../nao-encontrado.js';
import { textoRico } from '../texto-aula.js';
import {
  alertaErro, barraProgresso, botao, botaoLink, carregando, carregarEm, definirTitulo, el,
  parametro, seloDificuldade, tituloPagina, trocar,
} from '../ui.js';

definirTitulo('Exercícios');

paginaPrivada((conteudo) => {
  const slug = parametro('slug');
  if (!slug) {
    mostrarNaoEncontrado(conteudo, 'Assunto não encontrado.');
    return;
  }

  carregarEm(conteudo, {
    carregar: () => api.content.topic(slug),
    rotulo: 'Carregando...',
    seErro: (erro) => {
      if (erro.status !== 404) return false;
      mostrarNaoEncontrado(conteudo, 'Assunto não encontrado.');
      return true;
    },
    mostrar: ({ topic }) => {
      definirTitulo(`Exercícios: ${topic.title}`);
      iniciarExercicios(conteudo, topic, parametro('tentativa'));
    },
  });
});

function iniciarExercicios(conteudo, topic, resumeIdInicial) {
  let resumeId = resumeIdInicial;
  let attempt = null;
  let questions = [];
  let index = 0;
  let selected = null;
  let feedback = null; // resultado da correção da questão atual
  let busy = false;
  let error = null;

  const linkAula = () => el('a', { href: `aula.html?slug=${encodeURIComponent(topic.slug)}` }, '← Voltar para a aula');

  // ---------- Introdução ----------
  function mostrarIntro() {
    const areaErro = el('div');
    const comecar = botao({ conteudo: 'Começar exercícios', textoCarregando: 'Preparando questões...' });
    comecar.addEventListener('click', () => start({
      aoMudar: () => {
        comecar.definirCarregando(busy);
        trocar(areaErro, error ? alertaErro(error) : null);
      },
    }));
    trocar(conteudo,
      el('p', { class: 'back-link' }, linkAula()),
      tituloPagina(null, `Exercícios: ${topic.title}`),
      el('p', { class: 'page-subtitle' },
        `São ${topic.questionCount} questões de múltipla escolha, com quatro alternativas cada. Depois de cada resposta, você vê se acertou e a explicação. `
        + 'No final, aparece a sua nota.'),
      areaErro,
      comecar);
    if (error) areaErro.appendChild(alertaErro(error));
  }

  /** Começa uma nova tentativa. `aoMudar` redesenha o botão e o erro da tela atual. */
  async function start({ aoMudar }) {
    if (busy) return;
    busy = true;
    error = null;
    aoMudar();
    try {
      const data = await api.attempts.start(topic.slug);
      attempt = data.attempt;
      questions = data.questions.map((q) => ({ ...q, answer: null }));
      index = 0;
      selected = null;
      feedback = null;
      busy = false;
      // Uma tentativa nova deixa de "continuar" a antiga: tira o ?tentativa= da URL.
      if (resumeId) {
        resumeId = null;
        window.history.replaceState(null, '', `exercicios.html?slug=${encodeURIComponent(topic.slug)}`);
      }
      mostrarQuestao();
    } catch (err) {
      error = err;
      busy = false;
      aoMudar();
    }
  }

  // ---------- Questão ----------
  function mostrarQuestao() {
    const question = questions[index];
    const nomeGrupo = `questao-${question.id}`;

    const enunciado = el('span', { tabindex: '-1', class: 'question__statement' }, textoRico(question.statement));
    const fieldset = el('fieldset');
    const opcoes = question.options.map((o) => {
      const input = el('input', { type: 'radio', name: nomeGrupo, value: String(o.id) });
      input.addEventListener('change', () => {
        selected = o.id;
        atualizar();
      });
      const tag = el('span');
      const label = el('label', { class: 'option' },
        input,
        el('span', { class: 'option__letter', 'aria-hidden': 'true' }, o.letter),
        el('span', { class: 'option__text' }, el('span', { class: 'sr-only' }, `Alternativa ${o.letter}: `), textoRico(o.text)),
        tag);
      return { o, input, label, tag };
    });
    fieldset.append(
      el('legend', null,
        question.difficulty ? seloDificuldade(question.difficulty) : null,
        enunciado),
      el('ul', { class: 'options' }, opcoes.map(({ label }) => el('li', null, label))));

    const areaFeedback = el('div', { 'aria-live': 'polite' });
    const areaErro = el('div');
    const acoes = el('div', { class: 'btn-row question__actions' });
    const notas = el('div');
    const progresso = el('div');

    const form = el('form', { class: 'card question' }, fieldset, areaFeedback, areaErro, acoes, notas);
    form.addEventListener('submit', submitAnswer);

    function atualizar() {
      const q = questions[index];
      const answered = q.answer;
      const allAnswered = questions.every((x) => x.answer);
      const answeredCount = questions.filter((x) => x.answer).length;

      trocar(progresso, barraProgresso(answeredCount, questions.length, 'Questões respondidas'));
      fieldset.disabled = Boolean(answered) || busy;

      for (const { o, input, label, tag } of opcoes) {
        let state = '';
        if (answered) {
          if (o.id === answered.correctOptionId) state = 'option--correct';
          else if (o.id === answered.selectedOptionId) state = 'option--wrong';
        }
        const checked = answered ? o.id === answered.selectedOptionId : selected === o.id;
        input.checked = checked;
        label.className = `option ${checked ? 'option--checked' : ''} ${state}`.trim();
        // Etiqueta "Correta" / "Sua resposta" depois da correção.
        tag.className = state ? 'option__tag' : '';
        tag.textContent = state === 'option--correct' ? 'Correta' : state === 'option--wrong' ? 'Sua resposta' : '';
        tag.hidden = !state;
      }

      areaFeedback.replaceChildren();
      if (answered) {
        areaFeedback.appendChild(el('div', { class: `answer-feedback ${answered.isCorrect ? 'answer-feedback--ok' : 'answer-feedback--bad'}` },
          el('p', { class: 'answer-feedback__title' },
            answered.isCorrect ? 'Resposta correta!' : `Resposta incorreta. A alternativa correta é a ${answered.correctLetter}.`),
          el('p', { class: 'answer-feedback__text' }, el('strong', null, 'Explicação:'), ' ', textoRico(answered.explanation))));
      }
      trocar(areaErro, error ? alertaErro(error) : null);

      acoes.replaceChildren();
      if (!answered) {
        acoes.appendChild(botao({ tipo: 'submit', conteudo: 'Responder', textoCarregando: 'Corrigindo...', desabilitado: selected === null, carregando: busy }));
      }
      if (answered && !allAnswered) acoes.appendChild(botao({ conteudo: 'Próxima questão', aoClicar: goNext }));
      if (answered && allAnswered) {
        acoes.appendChild(botao({ conteudo: 'Ver resultado', textoCarregando: 'Calculando nota...', carregando: busy, aoClicar: () => finish(atualizar) }));
      }
      if (!allAnswered) {
        acoes.appendChild(botao({ variante: 'ghost', conteudo: 'Finalizar agora', desabilitado: busy, aoClicar: () => finish(atualizar) }));
      }

      notas.replaceChildren();
      if (!allAnswered) notas.appendChild(el('p', { class: 'muted-note' }, 'Ao finalizar agora, as questões sem resposta contam como erro.'));
      if (feedback === null && !answered && selected === null) {
        notas.appendChild(el('p', { class: 'muted-note' }, 'Escolha uma alternativa para responder.'));
      }
    }

    async function submitAnswer(event) {
      event.preventDefault();
      if (busy || selected === null) return;
      busy = true;
      error = null;
      atualizar();
      const atual = questions[index];
      try {
        const result = await api.attempts.answer(attempt.id, atual.id, selected);
        attempt = result.attempt;
        feedback = result;
        questions = questions.map((q, i) => (i === index
          ? { ...q, answer: { selectedOptionId: result.selectedOptionId, isCorrect: result.isCorrect, correctOptionId: result.correctOptionId, correctLetter: result.correctLetter, explanation: result.explanation } }
          : q));
      } catch (err) {
        error = err;
      } finally {
        busy = false;
        atualizar();
      }
    }

    trocar(conteudo,
      el('p', { class: 'back-link' }, linkAula()),
      tituloPagina(null, `Exercícios: ${topic.title}`),
      el('div', { class: 'exercise__progress' },
        el('p', { class: 'exercise__counter' }, `Questão ${index + 1} de ${questions.length}`),
        progresso),
      form);
    atualizar();
    // Ao trocar de questão, leva o foco para o enunciado.
    enunciado.focus();
  }

  function goNext() {
    const nextOpen = questions.findIndex((q, i) => i > index && !q.answer);
    index = nextOpen === -1 ? questions.findIndex((q) => !q.answer) : nextOpen;
    selected = null;
    feedback = null;
    mostrarQuestao();
  }

  async function finish(aoMudar) {
    if (busy) return;
    busy = true;
    error = null;
    aoMudar();
    try {
      const result = await api.attempts.finish(attempt.id);
      attempt = result.attempt;
      busy = false;
      mostrarResultado();
    } catch (err) {
      error = err;
      busy = false;
      aoMudar();
    }
  }

  // ---------- Resultado ----------
  function mostrarResultado() {
    const areaErro = el('div');
    const refazer = botao({ conteudo: 'Refazer exercícios', textoCarregando: 'Preparando...' });
    refazer.addEventListener('click', () => start({
      aoMudar: () => {
        refazer.definirCarregando(busy);
        trocar(areaErro, error ? alertaErro(error) : null);
      },
    }));
    trocar(conteudo,
      el('p', { class: 'back-link' }, linkAula()),
      tituloPagina(null, `Resultado: ${topic.title}`),
      el('section', { class: 'card result', 'aria-label': 'Resumo da tentativa' },
        el('p', { class: 'result__score' }, `${attempt.scorePercent}%`),
        el('p', { class: 'result__message' },
          attempt.mastered
            ? 'Muito bem! Você atingiu a meta de 70% de acertos neste assunto.'
            : 'Continue praticando: a meta é acertar pelo menos 70%. Revise a aula e tente de novo.'),
        el('dl', { class: 'mini-stats' },
          el('div', null, el('dt', null, 'Acertos'), el('dd', null, String(attempt.correct))),
          el('div', null, el('dt', null, 'Erros'), el('dd', null, String(attempt.wrong))),
          el('div', null, el('dt', null, 'Sem resposta'), el('dd', null, String(attempt.unanswered))),
          el('div', null, el('dt', null, 'Total'), el('dd', null, String(attempt.totalQuestions))))),
      areaErro,
      el('div', { class: 'btn-row' },
        botaoLink({ variante: 'secondary', href: `tentativa.html?id=${encodeURIComponent(attempt.id)}` }, 'Revisar respostas'),
        refazer,
        botaoLink({ variante: 'ghost', href: 'progresso.html' }, 'Ver meu progresso')));
  }

  // ---------- Retomar tentativa existente (vinda do histórico) ----------
  async function retomar() {
    trocar(conteudo, carregando('Carregando sua tentativa...'));
    try {
      const data = await api.attempts.detail(resumeId);
      if (data.attempt.topic.slug !== topic.slug) throw new Error('Esta tentativa é de outro assunto.');
      if (data.attempt.status === 'finished') {
        window.location.replace(`tentativa.html?id=${encodeURIComponent(data.attempt.id)}`);
        return;
      }
      attempt = data.attempt;
      questions = data.questions;
      const firstOpen = data.questions.findIndex((q) => !q.answer);
      index = firstOpen === -1 ? data.questions.length - 1 : firstOpen;
      mostrarQuestao();
    } catch (err) {
      error = err;
      mostrarIntro();
    }
  }

  if (resumeId) retomar();
  else mostrarIntro();
}
