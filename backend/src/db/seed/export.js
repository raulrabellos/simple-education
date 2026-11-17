// npm run content:export — gera docs/conteudo-pedagogico.md a partir do conteúdo da carga inicial,
// COM gabarito, para revisão pelo professor. Não usa banco de dados.
import fs from 'node:fs';
import path from 'node:path';
import { BACKEND_ROOT } from '../../config.js';
import { CONTENT_BY_YEAR, LETTERS } from './index.js';

const DIFF = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
// No Markdown, as marcações viram notação legível: x^{2} → x^2, a_{n} → a_n.
const md = (t) => t.replace(/\^\{([^}]*)\}/g, (_, x) => (x.length === 1 ? `^${x}` : `^(${x})`))
  .replace(/_\{([^}]*)\}/g, (_, x) => (x.length === 1 ? `_${x}` : `_(${x})`));

const out = [
  '# Conteúdo pedagógico — Simple Education',
  '',
  'Documento gerado automaticamente a partir de `backend/src/db/seed/content/` (`npm run content:export`).',
  'Contém o gabarito: uso interno para revisão. Distribuição por ano definida pelo projeto (não é organização curricular oficial).',
  '',
];

for (const [year, topics] of Object.entries(CONTENT_BY_YEAR)) {
  for (const t of topics) {
    out.push(`## ${t.title} — ${year}º ano`, '', `**Objetivo:** ${md(t.objective)}`, '');
    for (const s of t.sections) out.push(`### ${md(s.title)}`, '', md(s.body), '');
    out.push('### Questões', '');
    t.questions.forEach((q, i) => {
      out.push(`**${i + 1}. (${DIFF[q.difficulty]}, \`${q.code}\`)** ${md(q.statement)}`, '');
      for (const l of LETTERS) out.push(`- ${l}) ${md(q.options[l])}${l === q.correct ? ' ✅' : ''}`);
      out.push('', `*Resolução:* ${md(q.explanation)}`, '');
    });
  }
}

const file = path.resolve(BACKEND_ROOT, '..', 'docs', 'conteudo-pedagogico.md');
fs.writeFileSync(file, out.join('\n'));
console.log(`Gerado: ${file}`);
