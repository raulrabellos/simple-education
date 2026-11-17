/*
 * Conferência matemática do conteúdo pedagógico.
 * Cada resposta é RECALCULADA aqui em JavaScript (sem copiar o gabarito)
 * e comparada com o texto da alternativa marcada como correta.
 * Este teste não usa banco de dados.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_BY_YEAR, LETTERS, validateContentDefinition } from '../src/db/seed/index.js';

const topics = Object.values(CONTENT_BY_YEAR).flat();
const questions = new Map(topics.flatMap((t) => t.questions.map((q) => [q.code, q])));
const sectionsOf = (slug) => topics.find((t) => t.slug === slug).sections;

// ---------- Formatação no padrão brasileiro ----------
const MINUS = '−';
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
function br(n, decimals) {
  const s = decimals === undefined ? String(Number(n.toFixed(10))) : n.toFixed(decimals);
  return s.replace('-', MINUS).replace('.', ',');
}
function brl(n) {
  const [int, dec] = n.toFixed(2).split('.');
  return `R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}
function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
/** Converte um número em fração irredutível (denominador até 100). */
function frac(value) {
  for (let den = 1; den <= 100; den++) {
    const num = Math.round(value * den);
    if (close(num / den, value, 1e-9)) {
      const g = gcd(num, den);
      const [n, d] = [num / g, den / g];
      const sign = n < 0 ? MINUS : '';
      return d === 1 ? `${sign}${Math.abs(n)}` : `${sign}${Math.abs(n)}/${d}`;
    }
  }
  throw new Error(`Sem fração simples para ${value}`);
}
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n, p) => fact(n) / (fact(p) * fact(n - p));
const deg = (d) => (d * Math.PI) / 180;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
function bhaskara(a, b, c) {
  const delta = b * b - 4 * a * c;
  if (delta < 0) return [];
  return [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)].sort((x, y) => x - y);
}
function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mode(values) {
  const freq = new Map();
  values.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ---------- Resposta esperada de cada questão, calculada ----------
const EXPECTED = {
  'funcoes-01': () => br(12 / 3),
  'funcoes-02': () => {
    const V = (x) => 40 + 0.5 * x; // 40 fixos + 0,50 por km
    assert.ok(close(V(100), 90));
    return `V(x) = ${br(0.5)}x + ${br(40)}`;
  },
  'funcoes-03': () => bhaskara(1, -7, 10).map((x) => br(x)).join(' e '),
  'funcoes-04': () => {
    const f = (x) => -x * x + 4 * x + 1;
    const xv = -4 / (2 * -1);
    return `(${br(xv)}, ${br(f(xv))})`;
  },
  'funcoes-05': () => {
    const delta = (k) => 36 - 4 * k;
    assert.ok(delta(8.99) > 0 && delta(9) === 0 && delta(9.01) < 0);
    return `k < ${br(36 / 4)}`;
  },
  'progressoes-01': () => br(4 + (10 - 1) * 3),
  'progressoes-02': () => { assert.equal(45 / 15, 15 / 5); return br(15 / 5); },
  'progressoes-03': () => `${br(sum(Array.from({ length: 10 }, (_, d) => 2 + 0.5 * d)))} km`,
  'progressoes-04': () => br(3 * 2 ** 6),
  'progressoes-05': () => br(sum(Array.from({ length: 6 }, (_, i) => 3 ** i))),
  'exponencial-01': () => br(Math.log2(64)),
  'exponencial-02': () => br(Math.round(Math.log(81) / Math.log(3))),
  'exponencial-03': () => `x = ${br((Math.round(Math.log(125) / Math.log(5)) + 1) / 2)}`,
  'exponencial-04': () => {
    assert.ok(close(Math.log10(12), 1.08, 0.01)); // a aproximação é coerente com o valor real
    return br(2 * 0.30 + 0.48, 2);
  },
  'exponencial-05': () => {
    const M = (t) => 80 * 0.5 ** (t / 3);
    const t = 3 * Math.log2(80 / 10);
    assert.ok(close(M(t), 10));
    return `${br(t)} horas`;
  },
  'espacial-01': () => `${br(3 * 4 * 5)} cm^{3}`,
  'espacial-02': () => `${br(6 * 4 ** 2)} cm^{2}`,
  'espacial-03': () => `${br(3.14 * 3 ** 2 * 10, 1)} mL`,
  'espacial-04': () => `${br((6 ** 2 * 8) / 3)}π cm^{3}`,
  'espacial-05': () => {
    const volumeEsfera = (4 / 3) * Math.PI * 3 ** 3;
    return `${br(volumeEsfera / (Math.PI * 3 ** 2))} cm`;
  },
  'trigonometria-01': () => frac(Math.cos(deg(60))),
  'trigonometria-02': () => `${frac(120 / 180)}π rad`.replace(/^(\d+)\/(\d+)π/, '$1π/$2'),
  'trigonometria-03': () => {
    assert.ok(close(10 * Math.sin(deg(60)), 5 * 1.73, 0.02));
    return `${br(5 * 1.73, 2)} m`;
  },
  'trigonometria-04': () => frac(5 / Math.hypot(5, 12)),
  'trigonometria-05': () => {
    const cos = -0.6;
    const sen = Math.sqrt(1 - cos ** 2); // positivo no 2º quadrante
    return frac(sen / cos);
  },
  'combinatoria-01': () => br(4 * 3),
  'combinatoria-02': () => frac(3 / (5 + 3)),
  'combinatoria-03': () => br(fact(6) / (fact(3) * fact(2))),
  'combinatoria-04': () => br(comb(8, 2)),
  'combinatoria-05': () => {
    let favorable = 0;
    for (let i = 0; i < 8; i++) if (i !== 0) favorable++; // 3 bits; 0 = três coroas
    return frac(favorable / 8);
  },
  'analitica-01': () => br(Math.hypot(4 - 1, 5 - 1)),
  'analitica-02': () => `(${br((-2 + 6) / 2)}, ${br((4 + 0) / 2)})`,
  'analitica-03': () => {
    const m = (7 - 3) / (2 - 0);
    const n = 3 - m * 0;
    return `y = ${br(m)}x + ${br(n)}`;
  },
  'analitica-04': () => `Centro (${br(-1)}, ${br(4)}) e raio ${br(Math.sqrt(25))}`,
  'analitica-05': () => frac(-1 / 3),
  'estatistica-01': () => br(sum([12, 15, 18, 15]) / 4),
  'estatistica-02': () => br(mode([3, 5, 5, 7, 8, 8, 8, 10])),
  'estatistica-03': () => br(median([9, 2, 7, 4, 10, 6])),
  'estatistica-04': () => br((6.0 * 3 + 8.5 * 2) / (3 + 2), 1),
  'estatistica-05': () => br(5 * 8 - 4 * 7),
  'financeira-01': () => brl(0.35 * 240),
  'financeira-02': () => brl(150 * 1.04),
  'financeira-03': () => brl(800 * (1 + 0.02 * 6)),
  'financeira-04': () => brl(5000 * 1.1 ** 3),
  'financeira-05': () => brl(200 * 1.25 * 0.8),
};

test('definição do conteúdo é válida (9 aulas, 45 questões, 4 alternativas, 1 correta)', () => {
  validateContentDefinition();
  assert.equal(topics.length, 9);
  assert.equal(questions.size, 45);
  for (const q of questions.values()) {
    assert.deepEqual(Object.keys(q.options), LETTERS, q.code);
    assert.ok(LETTERS.includes(q.correct), q.code);
  }
});

test('todas as questões têm verificação matemática', () => {
  assert.deepEqual([...questions.keys()].sort(), Object.keys(EXPECTED).sort());
});

for (const [code, compute] of Object.entries(EXPECTED)) {
  test(`resposta calculada confere com o gabarito: ${code}`, () => {
    const q = questions.get(code);
    const expected = compute();
    assert.equal(q.options[q.correct], expected, `Esperado "${expected}", gabarito marca ${q.correct}: "${q.options[q.correct]}"`);
    const others = LETTERS.filter((l) => l !== q.correct).map((l) => q.options[l]);
    assert.ok(!others.includes(expected), 'a resposta certa aparece em mais de uma alternativa');
  });
}

/** Valor numérico de uma alternativa simples (ou null se não for só um número). */
function numericValue(text) {
  const t = text.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').replace(MINUS, '-')
    .replace(/\s?(cm\^\{\d\}|mL|km|cm|m|horas)$/, '').trim();
  const fracMatch = t.match(/^(-?\d+)\/(\d+)$/);
  if (fracMatch) return Number(fracMatch[1]) / Number(fracMatch[2]);
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

test('nenhuma questão tem alternativas numericamente equivalentes', () => {
  for (const q of questions.values()) {
    const values = Object.values(q.options).map(numericValue).filter((v) => v !== null);
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        assert.ok(!close(values[i], values[j]), `${q.code}: alternativas com o mesmo valor (${values[i]})`);
      }
    }
  }
});

test('dificuldades distribuídas: cada aula tem fácil, médio e difícil', () => {
  for (const t of topics) {
    const levels = new Set(t.questions.map((q) => q.difficulty));
    assert.deepEqual([...levels].sort(), ['dificil', 'facil', 'medio'], t.slug);
  }
});

test('gabarito bem distribuído entre as letras', () => {
  const count = Object.fromEntries(LETTERS.map((l) => [l, 0]));
  for (const q of questions.values()) count[q.correct]++;
  for (const l of LETTERS) assert.ok(count[l] >= 8, `letra ${l} é correta só ${count[l]} vezes`);
});

// ---------- Exemplos resolvidos: os resultados citados no texto são recalculados ----------
const EXAMPLE_CHECKS = [
  ['funcoes-1-e-2-grau', 0, `= ${2 * 8 + 5}`],
  ['funcoes-1-e-2-grau', 0, `x = ${(29 - 5) / 2}`],
  ['funcoes-1-e-2-grau', 1, `Δ = (−6)^{2} − 4·1·8 = 36 − 32 = ${36 - 32}`],
  ['funcoes-1-e-2-grau', 1, `V = (3, ${9 - 18 + 8})`.replace('-', MINUS)],
  ['funcoes-1-e-2-grau', 2, `= ${-5 * 4 + 20 * 2} metros`],
  ['progressoes-pa-e-pg', 0, `= ${50 + 11 * 10}`],
  ['progressoes-pa-e-pg', 0, `= ${((50 + 160) * 12) / 2}`],
  ['progressoes-pa-e-pg', 1, `= ${300 * 2 ** 5}`],
  ['progressoes-pa-e-pg', 2, `= ${sum([2, 6, 18, 54, 162])}`],
  ['funcao-exponencial-e-logaritmos', 0, `x = ${4 - 1}`],
  ['funcao-exponencial-e-logaritmos', 1, br(3 * 0.301, 3)],
  ['funcao-exponencial-e-logaritmos', 2, br(0.301 / 0.0414, 1)],
  ['geometria-espacial', 0, br(2 * 3.14, 2)],
  ['geometria-espacial', 1, `${3 * Math.hypot(3, 4)}π cm^{2}`],
  ['geometria-espacial', 1, `${(9 * 4) / 3}π cm^{3}`],
  ['geometria-espacial', 2, `${(4 / 3) * 216}π cm^{3}`],
  ['geometria-espacial', 2, `${4 * 36}π cm^{2}`],
  ['trigonometria', 0, br(4 * Math.sqrt(3), 2)],
  ['trigonometria', 1, `cos θ = ${frac(Math.sqrt(1 - (3 / 5) ** 2))}`],
  ['trigonometria', 2, `= ${frac(Math.sin(deg(150)))}`],
  ['analise-combinatoria-e-probabilidade', 0, `= ${10 * 9 * 8}`],
  ['analise-combinatoria-e-probabilidade', 1, `= ${comb(6, 3)} comissões`],
  ['analise-combinatoria-e-probabilidade', 2, `= ${frac(6 / 36)}`],
  ['geometria-analitica', 0, `= ${Math.hypot(3, 4)}`],
  ['geometria-analitica', 1, `2·2 + 1 = ${2 * 2 + 1}`],
  ['geometria-analitica', 2, `= ${(5 - 2) ** 2 + 0}`],
  ['estatistica', 0, `= ${sum([5, 7, 7, 8, 9, 6]) / 6}`],
  ['estatistica', 1, `= ${(6 * 2 + 9 * 1) / 3}`],
  ['estatistica', 2, `= ${0.25 * 360}°`],
  ['matematica-financeira', 0, `= ${1200 * 0.85}`],
  ['matematica-financeira', 1, `= ${2000 * 0.015 * 8}`],
  ['matematica-financeira', 2, br(1000 * 1.02 ** 3, 2).replace(/^(\d)(\d{3})/, '$1$2')],
];

test('exemplos resolvidos: resultados conferidos', () => {
  for (const [slug, index, fragment] of EXAMPLE_CHECKS) {
    const examples = sectionsOf(slug).filter((s) => s.kind === 'exemplo');
    assert.ok(examples[index].body.includes(String(fragment).replace('.', ',')),
      `${slug}, exemplo ${index + 1}: não encontrei "${fragment}"`);
  }
});
