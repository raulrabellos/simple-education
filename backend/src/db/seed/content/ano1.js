// Aulas do 1º ano — distribuição definida pelo projeto Simple Education
// (não representa uma organização curricular oficial). Questões originais.
//
// Marcações aceitas nos textos (o frontend converte na exibição):
//   x^{2}  → expoente     a_{n} → índice     **texto** → negrito
//   linhas "- " → lista   linhas "1. " → lista numerada
//
// Cada questão: code (identificador estável), difficulty (facil | medio | dificil),
// statement, options { A, B, C, D }, correct (letra), explanation.

export default [
  {
    slug: 'funcoes-1-e-2-grau',
    title: 'Funções (1º e 2º grau)',
    summary: 'Estudo de gráficos, raízes e vértices de parábolas.',
    objective: 'Reconhecer funções do 1º e do 2º grau, interpretar seus coeficientes, calcular raízes e encontrar o vértice da parábola.',
    sections: [
      {
        kind: 'explicacao',
        title: 'O que é uma função',
        body: `Uma função é uma regra que associa cada valor de entrada x a um único valor de saída y = f(x). No dia a dia, o preço de uma corrida que depende da distância ou a altura de uma bola que depende do tempo são exemplos de funções.

Na **função do 1º grau**, a variável x aparece com expoente 1 e o gráfico é uma reta: a saída cresce ou diminui sempre no mesmo ritmo.

Na **função do 2º grau**, aparece o termo x^{2} e o gráfico é uma curva chamada parábola. Ela tem um ponto especial, o vértice, onde a função atinge seu valor mínimo ou máximo.

As **raízes** (ou zeros) de uma função são os valores de x em que f(x) = 0. No gráfico, são os pontos em que a curva toca o eixo x.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `**Função do 1º grau**
- Forma: f(x) = ax + b, com a ≠ 0.
- a é a taxa de variação: se a > 0, a função é crescente; se a < 0, é decrescente.
- b é o valor de f(0): a reta corta o eixo y no ponto (0, b).
- Raiz: x = −b/a (só existe divisão porque a ≠ 0).

**Função do 2º grau**
- Forma: f(x) = ax^{2} + bx + c, com a ≠ 0.
- Se a > 0, a parábola tem concavidade para cima e o vértice é o ponto de mínimo; se a < 0, concavidade para baixo e o vértice é o ponto de máximo.
- Discriminante: Δ = b^{2} − 4ac. Se Δ > 0, há duas raízes reais diferentes; se Δ = 0, uma raiz real (dupla); se Δ < 0, nenhuma raiz real.
- Fórmula de Bhaskara: x = (−b ± √Δ) / (2a), usada apenas quando Δ ≥ 0.
- Vértice: x_{v} = −b/(2a) e y_{v} = −Δ/(4a), ou y_{v} = f(x_{v}).`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Preço de uma corrida (1º grau)',
        body: `Uma corrida de aplicativo custa R$ 5,00 fixos mais R$ 2,00 por quilômetro. Qual é o preço de uma corrida de 8 km? E quantos quilômetros é possível rodar com R$ 29,00?

1. O valor fixo é b = 5 e o valor por quilômetro é a = 2. Então C(x) = 2x + 5.
2. Para 8 km: C(8) = 2·8 + 5 = 16 + 5 = 21. A corrida custa R$ 21,00.
3. Para R$ 29,00: 2x + 5 = 29 → 2x = 24 → x = 12. É possível rodar 12 km.
4. Como a = 2 > 0, a função é crescente: quanto maior a distância, maior o preço.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Raízes e vértice (2º grau)',
        body: `Vamos analisar f(x) = x^{2} − 6x + 8.

1. Coeficientes: a = 1, b = −6 e c = 8.
2. Discriminante: Δ = (−6)^{2} − 4·1·8 = 36 − 32 = 4. Como Δ > 0, há duas raízes reais.
3. Raízes: x = (6 ± √4) / 2 = (6 ± 2) / 2, então x = 4 ou x = 2.
4. Vértice: x_{v} = 6/2 = 3 e y_{v} = f(3) = 9 − 18 + 8 = −1. Logo, V = (3, −1).
5. Como a = 1 > 0, a concavidade é para cima e o vértice é o ponto de mínimo.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Altura máxima de uma bola (2º grau)',
        body: `A altura de uma bola, em metros, t segundos após o chute é h(t) = −5t^{2} + 20t. Qual é a altura máxima?

1. Como a = −5 < 0, a parábola tem concavidade para baixo e o vértice é o ponto de máximo.
2. Instante do máximo: t_{v} = −20/(2·(−5)) = 2 segundos.
3. Altura máxima: h(2) = −5·4 + 20·2 = −20 + 40 = 20 metros.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- 1º grau: f(x) = ax + b, gráfico reta; raiz x = −b/a; o sinal de a indica se cresce ou decresce.
- 2º grau: f(x) = ax^{2} + bx + c, gráfico parábola; o sinal de a indica a concavidade.
- Δ = b^{2} − 4ac decide quantas raízes reais existem.
- O vértice (x_{v}, y_{v}) dá o valor mínimo (a > 0) ou máximo (a < 0) da função.`,
      },
    ],
    questions: [
      {
        code: 'funcoes-01', difficulty: 'facil',
        statement: 'Qual é a raiz da função f(x) = 3x − 12?',
        options: { A: '−4', B: '4', C: '12', D: '36' },
        correct: 'B',
        explanation: 'A raiz é o valor de x que torna f(x) = 0: 3x − 12 = 0 → 3x = 12 → x = 4.',
      },
      {
        code: 'funcoes-02', difficulty: 'facil',
        statement: 'Uma locadora cobra R$ 40,00 fixos mais R$ 0,50 por quilômetro rodado. Qual função representa o valor V, em reais, para x quilômetros rodados?',
        options: { A: 'V(x) = 0,5x + 40', B: 'V(x) = 40x + 0,5', C: 'V(x) = 40,5x', D: 'V(x) = 0,5x − 40' },
        correct: 'A',
        explanation: 'O valor que muda com cada quilômetro (R$ 0,50) multiplica x, e o valor fixo (R$ 40,00) é somado: V(x) = 0,5x + 40.',
      },
      {
        code: 'funcoes-03', difficulty: 'medio',
        statement: 'Quais são as raízes da equação x^{2} − 7x + 10 = 0?',
        options: { A: '−2 e −5', B: '1 e 10', C: '2 e 5', D: '3 e 4' },
        correct: 'C',
        explanation: 'Δ = (−7)^{2} − 4·1·10 = 49 − 40 = 9. Pela fórmula de Bhaskara, x = (7 ± 3) / 2, então x = 5 ou x = 2.',
      },
      {
        code: 'funcoes-04', difficulty: 'medio',
        statement: 'Qual é o vértice da parábola f(x) = −x^{2} + 4x + 1?',
        options: { A: '(−2, −11)', B: '(4, 1)', C: '(2, −3)', D: '(2, 5)' },
        correct: 'D',
        explanation: 'x_{v} = −b/(2a) = −4/(2·(−1)) = 2. Substituindo, f(2) = −4 + 8 + 1 = 5. Logo, V = (2, 5), que é ponto de máximo porque a = −1 < 0.',
      },
      {
        code: 'funcoes-05', difficulty: 'dificil',
        statement: 'Para quais valores reais de k a equação x^{2} − 6x + k = 0 possui duas raízes reais diferentes?',
        options: { A: 'k < 9', B: 'k > 9', C: 'k = 9', D: 'k < 36' },
        correct: 'A',
        explanation: 'É preciso Δ > 0: Δ = (−6)^{2} − 4·1·k = 36 − 4k. Então 36 − 4k > 0 → 4k < 36 → k < 9.',
      },
    ],
  },
  {
    slug: 'progressoes-pa-e-pg',
    title: 'Progressões (PA e PG)',
    summary: 'Sequências numéricas que crescem ou diminuem de forma constante ou multiplicativa.',
    objective: 'Identificar progressões aritméticas e geométricas, calcular a razão, um termo qualquer e a soma dos primeiros termos.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Sequências com padrão',
        body: `Uma progressão é uma sequência de números que segue uma regra fixa.

Na **progressão aritmética (PA)**, cada termo é obtido **somando** sempre o mesmo valor ao anterior. Esse valor é a razão r. Exemplo: (3, 7, 11, 15, ...) tem r = 4. Aparece em situações como economizar um valor que aumenta a mesma quantia todo mês.

Na **progressão geométrica (PG)**, cada termo é obtido **multiplicando** sempre pelo mesmo valor. Esse valor é a razão q. Exemplo: (2, 6, 18, 54, ...) tem q = 3. Aparece em crescimentos que dobram ou triplicam, como a multiplicação de bactérias.

Para descobrir o tipo: se a diferença entre termos vizinhos é constante, é PA; se a divisão entre termos vizinhos é constante, é PG.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `**Progressão aritmética** (n é a posição do termo, inteiro e n ≥ 1)
- Razão: r = a_{2} − a_{1}.
- Termo geral: a_{n} = a_{1} + (n − 1)·r.
- Soma dos n primeiros termos: S_{n} = (a_{1} + a_{n})·n / 2.

**Progressão geométrica** (a_{1} ≠ 0)
- Razão: q = a_{2} / a_{1}.
- Termo geral: a_{n} = a_{1}·q^{n − 1}.
- Soma dos n primeiros termos: S_{n} = a_{1}·(q^{n} − 1) / (q − 1), válida para q ≠ 1. Se q = 1, todos os termos são iguais e S_{n} = n·a_{1}.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Economia mensal (PA)',
        body: `Uma pessoa guarda R$ 50,00 no primeiro mês e, a cada mês, guarda R$ 10,00 a mais do que no mês anterior. Quanto ela guarda no 12º mês? E quanto terá guardado ao todo em 12 meses?

1. Os valores formam uma PA com a_{1} = 50 e r = 10.
2. 12º termo: a_{12} = 50 + (12 − 1)·10 = 50 + 110 = 160. No 12º mês ela guarda R$ 160,00.
3. Soma: S_{12} = (50 + 160)·12 / 2 = 210·6 = 1260. Ao todo, R$ 1.260,00.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Crescimento de bactérias (PG)',
        body: `Uma cultura começa com 300 bactérias e a quantidade dobra a cada hora. Quantas bactérias haverá ao final de 5 horas?

1. A sequência (300, 600, 1200, ...) é uma PG com a_{1} = 300 (início) e q = 2.
2. O início é o 1º termo; ao final de 5 horas estamos no 6º termo.
3. a_{6} = 300·2^{5} = 300·32 = 9600. Haverá 9.600 bactérias.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Soma de uma PG',
        body: `Qual é a soma dos 5 primeiros termos da PG (2, 6, 18, ...)?

1. a_{1} = 2 e q = 6/2 = 3 (q ≠ 1, então a fórmula da soma pode ser usada).
2. S_{5} = 2·(3^{5} − 1) / (3 − 1) = 2·(243 − 1) / 2 = 242.
3. Conferindo: 2 + 6 + 18 + 54 + 162 = 242.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- PA: soma-se a razão r; a_{n} = a_{1} + (n − 1)·r; S_{n} = (a_{1} + a_{n})·n / 2.
- PG: multiplica-se pela razão q; a_{n} = a_{1}·q^{n − 1}; S_{n} = a_{1}·(q^{n} − 1)/(q − 1), com q ≠ 1.
- Atenção à posição do termo: o primeiro termo é a_{1}, não a_{0}.`,
      },
    ],
    questions: [
      {
        code: 'progressoes-01', difficulty: 'facil',
        statement: 'Qual é o 10º termo da PA (4, 7, 10, ...)?',
        options: { A: '34', B: '28', C: '31', D: '30' },
        correct: 'C',
        explanation: 'A razão é r = 7 − 4 = 3. Então a_{10} = 4 + (10 − 1)·3 = 4 + 27 = 31.',
      },
      {
        code: 'progressoes-02', difficulty: 'facil',
        statement: 'Qual é a razão da PG (5, 15, 45, ...)?',
        options: { A: '10', B: '3', C: '5', D: '1/3' },
        correct: 'B',
        explanation: 'Na PG, a razão é o quociente entre termos vizinhos: q = 15 / 5 = 3 (e 45 / 15 = 3).',
      },
      {
        code: 'progressoes-03', difficulty: 'medio',
        statement: 'Um atleta corre 2 km no primeiro dia de treino e, a cada dia, corre 0,5 km a mais do que no dia anterior. Quantos quilômetros ele corre, no total, nos 10 primeiros dias?',
        options: { A: '6,5 km', B: '45 km', C: '85 km', D: '42,5 km' },
        correct: 'D',
        explanation: 'É uma PA com a_{1} = 2 e r = 0,5. O 10º termo é a_{10} = 2 + 9·0,5 = 6,5. A soma é S_{10} = (2 + 6,5)·10 / 2 = 42,5 km.',
      },
      {
        code: 'progressoes-04', difficulty: 'medio',
        statement: 'Em uma PG, o primeiro termo é 3 e a razão é 2. Qual é o 7º termo?',
        options: { A: '192', B: '384', C: '96', D: '42' },
        correct: 'A',
        explanation: 'a_{7} = a_{1}·q^{6} = 3·2^{6} = 3·64 = 192.',
      },
      {
        code: 'progressoes-05', difficulty: 'dificil',
        statement: 'Qual é a soma dos 6 primeiros termos da PG (1, 3, 9, ...)?',
        options: { A: '243', B: '364', C: '729', D: '121' },
        correct: 'B',
        explanation: 'a_{1} = 1 e q = 3. S_{6} = 1·(3^{6} − 1)/(3 − 1) = (729 − 1)/2 = 364. Conferindo: 1 + 3 + 9 + 27 + 81 + 243 = 364.',
      },
    ],
  },
  {
    slug: 'funcao-exponencial-e-logaritmos',
    title: 'Função Exponencial e Logaritmos',
    summary: 'Conceitos avançados de crescimento rápido e inversão de cálculos.',
    objective: 'Resolver equações exponenciais simples, calcular logaritmos usando suas propriedades e aplicar ambos em situações de crescimento e decaimento.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Crescimento rápido e operação inversa',
        body: `Na **função exponencial**, a variável está no expoente: f(x) = 2^{x}. A cada passo, o valor é multiplicado pela mesma base, por isso o crescimento (ou a queda) é muito rápido. Ela descreve juros compostos, crescimento de populações e decaimento de substâncias.

O **logaritmo** responde à pergunta inversa: "a que expoente devo elevar a base para obter este número?". Como 2^{3} = 8, dizemos que log_{2} 8 = 3.

Logaritmos são úteis quando a incógnita está no expoente e não é possível escrever os dois lados da equação na mesma base.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `**Função exponencial**
- f(x) = a^{x}, com a > 0 e a ≠ 1.
- Se a > 1, a função é crescente; se 0 < a < 1, é decrescente.
- O gráfico passa por (0, 1) e f(x) > 0 para todo x real.
- Propriedades das potências: a^{m}·a^{n} = a^{m + n}; a^{m} / a^{n} = a^{m − n}; (a^{m})^{n} = a^{m·n}; a^{0} = 1.
- Equação exponencial: se a > 0 e a ≠ 1, então a^{x} = a^{y} quando, e somente quando, x = y.

**Logaritmos**
- Definição: log_{a} b = x significa a^{x} = b, com a > 0, a ≠ 1 e b > 0.
- Quando a base não aparece, ela é 10: log 1000 = 3.
- Para m > 0 e n > 0: log_{a}(m·n) = log_{a} m + log_{a} n; log_{a}(m/n) = log_{a} m − log_{a} n; log_{a}(m^{k}) = k·log_{a} m.
- Mudança de base: log_{a} b = log b / log a.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Equação exponencial',
        body: `Resolva 3^{x + 1} = 81.

1. Escreva 81 como potência de 3: 81 = 3^{4}.
2. A equação fica 3^{x + 1} = 3^{4}. Como as bases são iguais (e válidas), os expoentes são iguais.
3. x + 1 = 4 → x = 3.
4. Conferindo: 3^{3 + 1} = 3^{4} = 81.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Calculando logaritmos',
        body: `a) Quanto vale log_{2} 32?
1. Procuramos x tal que 2^{x} = 32. Como 2^{5} = 32, log_{2} 32 = 5.

b) Sabendo que log 2 ≈ 0,301, quanto vale log 8?
1. 8 = 2^{3}, então log 8 = log 2^{3} = 3·log 2.
2. log 8 ≈ 3·0,301 = 0,903.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Quando a população dobra',
        body: `Uma cidade tem 10.000 habitantes e cresce 10% ao ano, ou seja, P(t) = 10000·1,1^{t}, com t em anos. Em quanto tempo a população dobra? Use log 2 ≈ 0,301 e log 1,1 ≈ 0,0414.

1. Dobrar significa P(t) = 20000: 10000·1,1^{t} = 20000 → 1,1^{t} = 2.
2. Não dá para escrever 2 como potência de 1,1, então aplicamos log nos dois lados: t·log 1,1 = log 2.
3. t = 0,301 / 0,0414 ≈ 7,3. A população dobra em pouco mais de 7 anos.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Exponencial: f(x) = a^{x}, a > 0 e a ≠ 1; cresce se a > 1 e decresce se 0 < a < 1.
- Mesma base dos dois lados → iguale os expoentes.
- log_{a} b = x ⇔ a^{x} = b (a > 0, a ≠ 1, b > 0).
- Produto vira soma, divisão vira subtração e expoente "desce" multiplicando.`,
      },
    ],
    questions: [
      {
        code: 'exponencial-01', difficulty: 'facil',
        statement: 'Qual é o valor de x na equação 2^{x} = 64?',
        options: { A: '6', B: '32', C: '8', D: '5' },
        correct: 'A',
        explanation: '64 = 2^{6}. Então 2^{x} = 2^{6} e, como as bases são iguais, x = 6.',
      },
      {
        code: 'exponencial-02', difficulty: 'facil',
        statement: 'Quanto vale log_{3} 81?',
        options: { A: '27', B: '3', C: '9', D: '4' },
        correct: 'D',
        explanation: 'Procuramos o expoente x tal que 3^{x} = 81. Como 3^{4} = 81, log_{3} 81 = 4.',
      },
      {
        code: 'exponencial-03', difficulty: 'medio',
        statement: 'Qual é a solução da equação 5^{2x − 1} = 125?',
        options: { A: 'x = 3', B: 'x = 2', C: 'x = 1', D: 'x = 5/2' },
        correct: 'B',
        explanation: '125 = 5^{3}. Então 2x − 1 = 3 → 2x = 4 → x = 2. Conferindo: 5^{2·2 − 1} = 5^{3} = 125.',
      },
      {
        code: 'exponencial-04', difficulty: 'medio',
        statement: 'Considere log 2 ≈ 0,30 e log 3 ≈ 0,48. Qual é o valor aproximado de log 12?',
        options: { A: '0,78', B: '1,44', C: '1,08', D: '0,90' },
        correct: 'C',
        explanation: '12 = 2^{2}·3. Pelas propriedades, log 12 = 2·log 2 + log 3 ≈ 2·0,30 + 0,48 = 1,08.',
      },
      {
        code: 'exponencial-05', difficulty: 'dificil',
        statement: 'Uma substância perde metade da sua massa a cada 3 horas. Partindo de 80 g, a massa após t horas é M(t) = 80·(1/2)^{t/3}. Depois de quanto tempo restarão 10 g?',
        options: { A: '24 horas', B: '6 horas', C: '12 horas', D: '9 horas' },
        correct: 'D',
        explanation: '80·(1/2)^{t/3} = 10 → (1/2)^{t/3} = 1/8 = (1/2)^{3}. Igualando os expoentes, t/3 = 3 → t = 9 horas. (80 → 40 → 20 → 10: três períodos de 3 horas.)',
      },
    ],
  },
];
