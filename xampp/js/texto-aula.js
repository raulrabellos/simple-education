/*
 * Exibição de textos matemáticos do conteúdo (igual a frontend/src/components/LessonBody.jsx).
 * Marcações usadas no conteúdo (vindas da API):
 *   x^{2}   → expoente (x²)        a_{n}  → índice (aₙ)        **texto** → negrito
 *   linhas "- " → lista            linhas "1. " → lista numerada
 * Tudo é montado com createElement e nós de texto (nunca como HTML cru),
 * então não há risco de injeção de código.
 */
import { el } from './ui.js';

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\^\{[^}]*\}|_\{[^}]*\})/g;

/** Texto de uma linha com expoentes, índices e negrito. Devolve um DocumentFragment. */
export function textoRico(texto) {
  const fragmento = document.createDocumentFragment();
  const partes = String(texto ?? '').split(INLINE_PATTERN);
  for (const parte of partes) {
    if (parte.startsWith('**') && parte.endsWith('**')) fragmento.appendChild(el('strong', null, textoRico(parte.slice(2, -2))));
    else if (parte.startsWith('^{')) fragmento.appendChild(el('sup', null, parte.slice(2, -1)));
    else if (parte.startsWith('_{')) fragmento.appendChild(el('sub', null, parte.slice(2, -1)));
    else if (parte) fragmento.appendChild(document.createTextNode(parte));
  }
  return fragmento;
}

const isBullet = (line) => line.startsWith('- ');
const isNumbered = (line) => /^\d+\.\s/.test(line);

/** Agrupa linhas consecutivas do mesmo tipo (parágrafo, lista ou lista numerada). */
function toBlocks(text) {
  const blocks = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) { blocks.push({ type: 'break' }); continue; }
    const type = isBullet(line) ? 'ul' : isNumbered(line) ? 'ol' : 'p';
    const content = type === 'ul' ? line.slice(2) : type === 'ol' ? line.replace(/^\d+\.\s/, '') : line;
    const last = blocks[blocks.length - 1];
    if (last && last.type === type && type !== 'p') last.items.push(content);
    else if (last && last.type === 'p' && type === 'p') last.items.push(content);
    else blocks.push({ type, items: [content] });
  }
  return blocks.filter((b) => b.type !== 'break');
}

/** Texto de uma seção da aula (vários parágrafos e listas). */
export function corpoAula(texto) {
  return el('div', { class: 'lesson-body' }, toBlocks(texto).map((block) => {
    if (block.type === 'ul') return el('ul', null, block.items.map((item) => el('li', null, textoRico(item))));
    if (block.type === 'ol') return el('ol', null, block.items.map((item) => el('li', null, textoRico(item))));
    // Linha isolada inteira em negrito funciona como subtítulo (ex.: "**Função do 1º grau**").
    if (block.items.length === 1 && /^\*\*[^*]+\*\*$/.test(block.items[0])) {
      return el('p', { class: 'lesson-body__subtitle' }, textoRico(block.items[0]));
    }
    return el('p', null, textoRico(block.items.join(' ')));
  }));
}
