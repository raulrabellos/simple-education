// Moldura comum das telas de login e cadastro (igual a AuthShell da versão React).
import { el, tituloPagina } from './ui.js';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Monta o cartão de login/cadastro e devolve { main, avisos, formulario }.
 * `avisos` recebe os alertas; `formulario` recebe os campos.
 */
export function moldura({ titulo, subtitulo, rodape }) {
  const avisos = el('div');
  const formulario = el('form', { class: 'form', novalidate: true });
  const main = el('main', { class: 'auth' },
    el('div', { class: 'auth__card' },
      el('p', { class: 'auth__logo' }, 'Simple', el('br'), 'education'),
      tituloPagina('auth__title', titulo),
      subtitulo ? el('p', { class: 'auth__subtitle' }, subtitulo) : null,
      avisos,
      formulario,
      el('p', { class: 'auth__footer' }, ...rodape)));
  return { main, avisos, formulario };
}
