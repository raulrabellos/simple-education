// Funções de formatação (mesmas da versão React, na branch main: frontend/src/utils/format.js).

export const SCHOOL_YEAR_OPTIONS = [
  { value: '', label: 'Não informar / não sou estudante' },
  { value: '1', label: '1º ano do Ensino Médio' },
  { value: '2', label: '2º ano do Ensino Médio' },
  { value: '3', label: '3º ano do Ensino Médio' },
];

export function yearLabel(year) {
  return year ? `${year}º Ano` : 'Ano não informado';
}

export function firstName(name) {
  return (name ?? '').trim().split(' ')[0] || 'aluno';
}

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** Converte a data ISO (UTC) da API para o horário local do navegador. */
export function formatDateTime(iso) {
  return iso ? dateTimeFormat.format(new Date(iso)) : '—';
}

export const STATUS_LABELS = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
};

export function scoreLabel(score) {
  return score === null || score === undefined ? '—' : `${score}%`;
}
