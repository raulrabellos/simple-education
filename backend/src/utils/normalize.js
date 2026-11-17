/** Remove acentos, converte para minúsculas e junta espaços repetidos. */
export function normalizeText(value) {
  return String(value ?? '')
    // Remove as marcações de formatação do conteúdo: x^{2} → x2, a_{n} → an, **texto** → texto
    .replace(/[\^_]\{([^}]*)\}/g, '$1')
    .replace(/\*\*/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapa os curingas do LIKE (% e _) para que sejam tratados como texto. */
export function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * O SQLite grava datas em UTC no formato "AAAA-MM-DD HH:MM:SS".
 * A API devolve em ISO 8601 com "Z" para o navegador converter ao fuso do aluno.
 */
export function toIso(sqliteDate) {
  return sqliteDate ? `${sqliteDate.replace(' ', 'T')}Z` : null;
}
