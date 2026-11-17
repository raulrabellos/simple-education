import { Fragment } from 'react';

/*
 * Exibição de textos matemáticos do conteúdo.
 * Marcações usadas no conteúdo (vindas da API):
 *   x^{2}   → expoente (x²)        a_{n}  → índice (aₙ)        **texto** → negrito
 *   linhas "- " → lista            linhas "1. " → lista numerada
 * Tudo é montado como elementos React (nunca como HTML cru), então não há risco de injeção de código.
 */
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\^\{[^}]*\}|_\{[^}]*\})/g;

/** Texto de uma linha com expoentes, índices e negrito. */
export function RichText({ text }) {
  const parts = String(text ?? '').split(INLINE_PATTERN);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}><RichText text={part.slice(2, -2)} /></strong>;
        if (part.startsWith('^{')) return <sup key={i}>{part.slice(2, -1)}</sup>;
        if (part.startsWith('_{')) return <sub key={i}>{part.slice(2, -1)}</sub>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const isBullet = (line) => line.startsWith('- ');
const isNumbered = (line) => /^\d+\.\s/.test(line);

/** Agrupa linhas consecutivas do mesmo tipo (parágrafo, lista ou lista numerada). */
function toBlocks(text) {
  const blocks = [];
  for (const raw of text.split('\n')) {
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
export function LessonBody({ text }) {
  return (
    <div className="lesson-body">
      {toBlocks(text).map((block, i) => {
        if (block.type === 'ul') {
          return <ul key={i}>{block.items.map((item, j) => <li key={j}><RichText text={item} /></li>)}</ul>;
        }
        if (block.type === 'ol') {
          return <ol key={i}>{block.items.map((item, j) => <li key={j}><RichText text={item} /></li>)}</ol>;
        }
        // Linha isolada inteira em negrito funciona como subtítulo (ex.: "**Função do 1º grau**").
        if (block.items.length === 1 && /^\*\*[^*]+\*\*$/.test(block.items[0])) {
          return <p key={i} className="lesson-body__subtitle"><RichText text={block.items[0]} /></p>;
        }
        return <p key={i}><RichText text={block.items.join(' ')} /></p>;
      })}
    </div>
  );
}
