import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABELS } from '../utils/format.js';

/** Botão padrão. Durante `loading` fica desabilitado (evita cliques repetidos). */
export function Button({ variant = 'primary', loading = false, loadingText, children, className = '', disabled, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="spinner spinner--small" aria-hidden="true" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

/** Link com aparência de botão. */
export function ButtonLink({ variant = 'primary', className = '', ...props }) {
  return <Link className={`btn btn--${variant} ${className}`} {...props} />;
}

/** Campo de texto com rótulo, dica e mensagem de erro ligados por aria-describedby. */
export function TextField({ label, error, hint, id, ...inputProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, hint, id, options, ...selectProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...selectProps}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}

/** Mensagem de aviso. Erros são anunciados imediatamente por leitores de tela. */
export function Alert({ type = 'error', children, className = '' }) {
  return (
    <div className={`alert alert--${type} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Erro ao carregar dados, com botão para tentar de novo. */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-box" role="alert">
      <p className="state-box__title">Não foi possível carregar.</p>
      <p>{error?.message ?? 'Tente novamente em instantes.'}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state-box">
      <p className="state-box__title">{title}</p>
      {children}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} de ${max}`}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

// No primeiro carregamento o foco fica no início da página (o Tab chega ao "Pular para o conteúdo").
let isFirstPage = true;

/**
 * Título principal da página. Ao navegar para outra tela, recebe o foco,
 * para quem usa teclado ou leitor de tela saber que a tela mudou.
 */
export function PageTitle({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isFirstPage) {
      isFirstPage = false;
      return;
    }
    ref.current?.focus({ preventScroll: true });
  }, []);
  return <h1 ref={ref} tabIndex={-1} className={`page-title ${className}`}>{children}</h1>;
}

const DIFFICULTY_LABELS = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

export function DifficultyBadge({ level }) {
  return <span className={`badge badge--difficulty badge--${level}`}>Nível: {DIFFICULTY_LABELS[level] ?? level}</span>;
}
