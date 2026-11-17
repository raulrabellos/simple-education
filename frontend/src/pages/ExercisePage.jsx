import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { Alert, Button, ButtonLink, ErrorState, Loading, PageTitle, ProgressBar } from '../components/ui.jsx';
import { NotFoundContent } from './NotFoundPage.jsx';
import { RichText } from '../components/LessonBody.jsx';
import { DifficultyBadge } from '../components/ui.jsx';

/**
 * Fluxo de exercícios:
 *  intro → (Começar) → questão a questão com correção → resultado.
 * Para continuar uma tentativa não finalizada: /assuntos/:slug/exercicios?tentativa=ID
 * A correta e a explicação só chegam do servidor depois de cada resposta.
 */
export function ExercisePage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const resumeId = params.get('tentativa');
  const topicReq = useApi(() => api.content.topic(slug), [slug]);
  usePageTitle(topicReq.data ? `Exercícios: ${topicReq.data.topic.title}` : 'Exercícios');

  if (topicReq.loading) return <Loading label="Carregando..." />;
  if (topicReq.error?.status === 404) return <NotFoundContent message="Assunto não encontrado." />;
  if (topicReq.error) return <ErrorState error={topicReq.error} onRetry={topicReq.reload} />;

  return <ExerciseRunner key={`${slug}-${resumeId ?? 'novo'}`} topic={topicReq.data.topic} resumeId={resumeId} />;
}

function ExerciseRunner({ topic, resumeId }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(resumeId ? 'resuming' : 'intro'); // intro | resuming | question | result
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // resultado da correção da questão atual
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef(null);

  // Retomar tentativa existente (vinda do histórico).
  useEffect(() => {
    if (!resumeId) return;
    let active = true;
    (async () => {
      try {
        const data = await api.attempts.detail(resumeId);
        if (!active) return;
        if (data.attempt.topic.slug !== topic.slug) throw new Error('Esta tentativa é de outro assunto.');
        if (data.attempt.status === 'finished') {
          navigate(`/tentativas/${data.attempt.id}`, { replace: true });
          return;
        }
        setAttempt(data.attempt);
        setQuestions(data.questions);
        const firstOpen = data.questions.findIndex((q) => !q.answer);
        setIndex(firstOpen === -1 ? data.questions.length - 1 : firstOpen);
        setPhase('question');
      } catch (err) {
        if (active) { setError(err.message); setPhase('intro'); }
      }
    })();
    return () => { active = false; };
  }, [resumeId, topic.slug, navigate]);

  // Ao trocar de questão, leva o foco para o enunciado.
  useEffect(() => {
    if (phase === 'question') headingRef.current?.focus();
  }, [phase, index]);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await api.attempts.start(topic.slug);
      setAttempt(data.attempt);
      setQuestions(data.questions.map((q) => ({ ...q, answer: null })));
      setIndex(0);
      setSelected(null);
      setFeedback(null);
      setPhase('question');
      if (resumeId) navigate(`/assuntos/${topic.slug}/exercicios`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    if (busy || selected === null) return;
    setBusy(true);
    setError('');
    const question = questions[index];
    try {
      const result = await api.attempts.answer(attempt.id, question.id, selected);
      setAttempt(result.attempt);
      setFeedback(result);
      setQuestions((qs) => qs.map((q, i) => (i === index
        ? { ...q, answer: { selectedOptionId: result.selectedOptionId, isCorrect: result.isCorrect, correctOptionId: result.correctOptionId, correctLetter: result.correctLetter, explanation: result.explanation } }
        : q)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.attempts.finish(attempt.id);
      setAttempt(result.attempt);
      setPhase('result');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    const nextOpen = questions.findIndex((q, i) => i > index && !q.answer);
    setIndex(nextOpen === -1 ? questions.findIndex((q) => !q.answer) : nextOpen);
    setSelected(null);
    setFeedback(null);
  }

  const backLink = <Link to={`/assuntos/${topic.slug}`}>← Voltar para a aula</Link>;

  if (phase === 'resuming') return <Loading label="Carregando sua tentativa..." />;

  if (phase === 'intro') {
    return (
      <>
        <p className="back-link">{backLink}</p>
        <PageTitle>Exercícios: {topic.title}</PageTitle>
        <p className="page-subtitle">
          São {topic.questionCount} questões de múltipla escolha, com quatro alternativas cada. Depois de cada resposta, você vê se acertou e a explicação.
          No final, aparece a sua nota.
        </p>
        {error && <Alert>{error}</Alert>}
        <Button onClick={start} loading={busy} loadingText="Preparando questões...">Começar exercícios</Button>
      </>
    );
  }

  if (phase === 'result') {
    return <ResultView attempt={attempt} topic={topic} onRestart={start} busy={busy} error={error} />;
  }

  // phase === 'question'
  const question = questions[index];
  const answered = question.answer;
  const allAnswered = questions.every((q) => q.answer);
  const answeredCount = questions.filter((q) => q.answer).length;

  return (
    <>
      <p className="back-link">{backLink}</p>
      <PageTitle>Exercícios: {topic.title}</PageTitle>

      <div className="exercise__progress">
        <p className="exercise__counter">Questão {index + 1} de {questions.length}</p>
        <ProgressBar value={answeredCount} max={questions.length} label="Questões respondidas" />
      </div>

      <form className="card question" onSubmit={submitAnswer}>
        <fieldset disabled={Boolean(answered) || busy}>
          <legend>
            {question.difficulty && <DifficultyBadge level={question.difficulty} />}
            <span ref={headingRef} tabIndex={-1} className="question__statement"><RichText text={question.statement} /></span>
          </legend>
          <ul className="options">
            {question.options.map((o) => {
              let state = '';
              if (answered) {
                if (o.id === answered.correctOptionId) state = 'option--correct';
                else if (o.id === answered.selectedOptionId) state = 'option--wrong';
              }
              const checked = answered ? o.id === answered.selectedOptionId : selected === o.id;
              return (
                <li key={o.id}>
                  <label className={`option ${checked ? 'option--checked' : ''} ${state}`}>
                    <input
                      type="radio"
                      name={`questao-${question.id}`}
                      value={o.id}
                      checked={checked}
                      onChange={() => setSelected(o.id)}
                    />
                    <span className="option__letter" aria-hidden="true">{o.letter}</span>
                    <span className="option__text"><span className="sr-only">Alternativa {o.letter}: </span><RichText text={o.text} /></span>
                    {state === 'option--correct' && <span className="option__tag">Correta</span>}
                    {state === 'option--wrong' && <span className="option__tag">Sua resposta</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div aria-live="polite">
          {answered && (
            <div className={`answer-feedback ${answered.isCorrect ? 'answer-feedback--ok' : 'answer-feedback--bad'}`}>
              <p className="answer-feedback__title">
                {answered.isCorrect ? 'Resposta correta!' : `Resposta incorreta. A alternativa correta é a ${answered.correctLetter}.`}
              </p>
              <p className="answer-feedback__text"><strong>Explicação:</strong> <RichText text={answered.explanation} /></p>
            </div>
          )}
        </div>
        {error && <Alert>{error}</Alert>}

        <div className="btn-row question__actions">
          {!answered && (
            <Button type="submit" disabled={selected === null} loading={busy} loadingText="Corrigindo...">Responder</Button>
          )}
          {answered && !allAnswered && <Button onClick={goNext}>Próxima questão</Button>}
          {answered && allAnswered && <Button onClick={finish} loading={busy} loadingText="Calculando nota...">Ver resultado</Button>}
          {!allAnswered && (
            <Button variant="ghost" onClick={finish} disabled={busy}>Finalizar agora</Button>
          )}
        </div>
        {!allAnswered && (
          <p className="muted-note">Ao finalizar agora, as questões sem resposta contam como erro.</p>
        )}
        {feedback === null && !answered && selected === null && (
          <p className="muted-note">Escolha uma alternativa para responder.</p>
        )}
      </form>
    </>
  );
}

function ResultView({ attempt, topic, onRestart, busy, error }) {
  return (
    <>
      <p className="back-link"><Link to={`/assuntos/${topic.slug}`}>← Voltar para a aula</Link></p>
      <PageTitle>Resultado: {topic.title}</PageTitle>
      <section className="card result" aria-label="Resumo da tentativa">
        <p className="result__score">{attempt.scorePercent}%</p>
        <p className="result__message">
          {attempt.mastered
            ? 'Muito bem! Você atingiu a meta de 70% de acertos neste assunto.'
            : 'Continue praticando: a meta é acertar pelo menos 70%. Revise a aula e tente de novo.'}
        </p>
        <dl className="mini-stats">
          <div><dt>Acertos</dt><dd>{attempt.correct}</dd></div>
          <div><dt>Erros</dt><dd>{attempt.wrong}</dd></div>
          <div><dt>Sem resposta</dt><dd>{attempt.unanswered}</dd></div>
          <div><dt>Total</dt><dd>{attempt.totalQuestions}</dd></div>
        </dl>
      </section>
      {error && <Alert>{error}</Alert>}
      <div className="btn-row">
        <ButtonLink to={`/tentativas/${attempt.id}`} variant="secondary">Revisar respostas</ButtonLink>
        <Button onClick={onRestart} loading={busy} loadingText="Preparando...">Refazer exercícios</Button>
        <ButtonLink to="/progresso" variant="ghost">Ver meu progresso</ButtonLink>
      </div>
    </>
  );
}
