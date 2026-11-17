// Aulas do 3º ano — distribuição definida pelo projeto Simple Education
// (não representa uma organização curricular oficial). Questões originais.
// Marcações: x^{2} expoente, a_{n} índice, **negrito**, listas "- " e "1. ".

export default [
  {
    slug: 'geometria-analitica',
    title: 'Geometria Analítica',
    summary: 'Estudo de pontos, retas e circunferências usando coordenadas no plano.',
    objective: 'Calcular distância e ponto médio entre pontos, determinar a equação de uma reta e identificar centro e raio de uma circunferência no plano cartesiano.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Geometria com coordenadas',
        body: `Na geometria analítica, cada ponto do plano é descrito por um par ordenado (x, y). Assim, problemas de geometria viram contas: a distância entre duas cidades em um mapa, a inclinação de uma rua ou o alcance de uma antena podem ser calculados com fórmulas.

- Uma **reta** é descrita por uma equação como y = 2x + 1: todos os pontos que satisfazem a equação estão na reta.
- O **coeficiente angular** mede a inclinação da reta: quanto y varia quando x aumenta 1 unidade.
- Uma **circunferência** é o conjunto de pontos que estão à mesma distância (o raio) de um ponto fixo (o centro).`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `Considere A(x_{A}, y_{A}) e B(x_{B}, y_{B}).

**Pontos**
- Distância: d_{AB} = √((x_{B} − x_{A})^{2} + (y_{B} − y_{A})^{2}).
- Ponto médio: M = ((x_{A} + x_{B})/2, (y_{A} + y_{B})/2).

**Retas**
- Coeficiente angular: m = (y_{B} − y_{A}) / (x_{B} − x_{A}), válido se x_{A} ≠ x_{B}. Retas verticais (x constante) não têm coeficiente angular.
- Reta que passa por (x_{0}, y_{0}) com coeficiente m: y − y_{0} = m(x − x_{0}).
- Equação reduzida: y = mx + n, em que n é onde a reta corta o eixo y.
- Retas paralelas (não verticais) têm o mesmo m. Retas perpendiculares (nenhuma vertical) têm m_{1}·m_{2} = −1.

**Circunferência**
- Centro C(a, b) e raio r > 0: (x − a)^{2} + (y − b)^{2} = r^{2}.
- Atenção aos sinais: (x + 1)^{2} = (x − (−1))^{2}, então a = −1.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Distância, ponto médio e inclinação',
        body: `Considere A(1, 2) e B(4, 6).

1. Distância: d = √((4 − 1)^{2} + (6 − 2)^{2}) = √(9 + 16) = √25 = 5.
2. Ponto médio: M = ((1 + 4)/2, (2 + 6)/2) = (2,5; 4).
3. Coeficiente angular: m = (6 − 2)/(4 − 1) = 4/3.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Equação de uma reta',
        body: `Encontre a equação da reta que passa por A(1, 3) e tem coeficiente angular 2. O ponto P(2, 5) pertence a ela?

1. y − 3 = 2(x − 1) → y − 3 = 2x − 2 → y = 2x + 1.
2. Testando P: para x = 2, y = 2·2 + 1 = 5. Como deu 5, P pertence à reta.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Circunferência',
        body: `Escreva a equação da circunferência de centro (2, −1) e raio 3. O ponto (5, −1) está nela?

1. (x − 2)^{2} + (y − (−1))^{2} = 3^{2} → (x − 2)^{2} + (y + 1)^{2} = 9.
2. Para (5, −1): (5 − 2)^{2} + (−1 + 1)^{2} = 9 + 0 = 9. O ponto pertence à circunferência.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Distância vem de Pitágoras; ponto médio é a média das coordenadas.
- m = Δy/Δx mede a inclinação; y = mx + n é a forma reduzida.
- Paralelas: mesmo m. Perpendiculares: m_{1}·m_{2} = −1.
- Circunferência: (x − a)^{2} + (y − b)^{2} = r^{2}; o centro aparece com os sinais trocados.`,
      },
    ],
    questions: [
      {
        code: 'analitica-01', difficulty: 'facil',
        statement: 'Qual é a distância entre os pontos A(1, 1) e B(4, 5)?',
        options: { A: '5', B: '7', C: '25', D: '√7' },
        correct: 'A',
        explanation: 'd = √((4 − 1)^{2} + (5 − 1)^{2}) = √(9 + 16) = √25 = 5.',
      },
      {
        code: 'analitica-02', difficulty: 'facil',
        statement: 'Qual é o ponto médio do segmento com extremidades A(−2, 4) e B(6, 0)?',
        options: { A: '(4, 4)', B: '(2, 2)', C: '(8, −4)', D: '(4, 2)' },
        correct: 'B',
        explanation: 'M = ((−2 + 6)/2, (4 + 0)/2) = (4/2, 4/2) = (2, 2).',
      },
      {
        code: 'analitica-03', difficulty: 'medio',
        statement: 'Qual é a equação reduzida da reta que passa pelos pontos (0, 3) e (2, 7)?',
        options: { A: 'y = 3x + 2', B: 'y = 2x + 7', C: 'y = 2x + 3', D: 'y = −2x + 3' },
        correct: 'C',
        explanation: 'm = (7 − 3)/(2 − 0) = 2. A reta passa por (0, 3), então corta o eixo y em n = 3. Logo, y = 2x + 3. Conferindo: para x = 2, y = 7.',
      },
      {
        code: 'analitica-04', difficulty: 'medio',
        statement: 'Qual é o centro e o raio da circunferência (x + 1)^{2} + (y − 4)^{2} = 25?',
        options: { A: 'Centro (1, −4) e raio 5', B: 'Centro (−1, 4) e raio 25', C: 'Centro (1, 4) e raio 5', D: 'Centro (−1, 4) e raio 5' },
        correct: 'D',
        explanation: 'Comparando com (x − a)^{2} + (y − b)^{2} = r^{2}: x + 1 = x − (−1), então a = −1; b = 4; r^{2} = 25, então r = 5.',
      },
      {
        code: 'analitica-05', difficulty: 'dificil',
        statement: 'Qual é o coeficiente angular de uma reta perpendicular à reta y = 3x − 2?',
        options: { A: '3', B: '−1/3', C: '−3', D: '1/3' },
        correct: 'B',
        explanation: 'A reta dada tem m_{1} = 3. Para retas perpendiculares, m_{1}·m_{2} = −1, então m_{2} = −1/3.',
      },
    ],
  },
  {
    slug: 'estatistica',
    title: 'Estatística',
    summary: 'Leitura de tabelas, gráficos, média, mediana e moda.',
    objective: 'Calcular e interpretar média (simples e ponderada), mediana e moda, e ler informações em tabelas de frequência e gráficos.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Resumindo dados com poucos números',
        body: `A estatística organiza e interpreta dados, como notas de uma turma, preços ou resultados de pesquisas.

As **medidas de tendência central** resumem um conjunto de dados em um único valor "típico":
- a **média** distribui o total igualmente entre os valores;
- a **mediana** é o valor do meio, depois de colocar os dados em ordem;
- a **moda** é o valor que aparece mais vezes.

A média é sensível a valores muito altos ou muito baixos; a mediana, não. Por isso, em salários ou preços de imóveis, a mediana muitas vezes representa melhor a situação típica.

**Tabelas de frequência** mostram quantas vezes cada valor aparece, e **gráficos** (barras, linhas e setores) ajudam a comparar e a ver tendências.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `- **Média aritmética**: soma de todos os valores ÷ quantidade de valores.
- **Média ponderada**: (x_{1}·p_{1} + x_{2}·p_{2} + ... + x_{n}·p_{n}) ÷ (p_{1} + p_{2} + ... + p_{n}), em que p são os pesos.
- **Mediana**: coloque os dados em ordem. Se a quantidade n for ímpar, é o valor na posição (n + 1)/2. Se n for par, é a média dos dois valores centrais.
- **Moda**: valor de maior frequência. Um conjunto pode ter uma moda, mais de uma (bimodal) ou nenhuma (amodal).
- **Frequência relativa**: frequência do valor ÷ total de dados (multiplique por 100 para obter a porcentagem).
- **Gráfico de setores**: o ângulo de cada fatia é a sua porcentagem de 360°.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Média, mediana e moda',
        body: `Notas de um aluno: 5, 7, 7, 8, 9 e 6.

1. Média: (5 + 7 + 7 + 8 + 9 + 6)/6 = 42/6 = 7.
2. Mediana: em ordem, 5, 6, 7, 7, 8, 9. Como n = 6 é par, a mediana é (7 + 7)/2 = 7.
3. Moda: 7, que aparece duas vezes.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Média ponderada',
        body: `A nota final de uma disciplina tem prova com peso 2 e trabalho com peso 1. Um aluno tirou 6 na prova e 9 no trabalho.

1. Multiplique cada nota pelo seu peso: 6·2 = 12 e 9·1 = 9.
2. Some e divida pela soma dos pesos: (12 + 9)/(2 + 1) = 21/3 = 7.
3. A nota final é 7. A média simples seria 7,5: a prova, com peso maior, "puxou" a nota para baixo.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Frequência e gráfico de setores',
        body: `Em uma pesquisa com 40 alunos sobre o esporte preferido, 10 escolheram futebol.

1. Frequência relativa: 10/40 = 0,25 = 25%.
2. No gráfico de setores, a fatia de futebol tem 25% de 360° = 0,25·360° = 90°.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Média = soma ÷ quantidade; na ponderada, cada valor conta conforme seu peso.
- Mediana: sempre ordene os dados antes; com quantidade par, faça a média dos dois centrais.
- Moda: o valor mais frequente.
- Porcentagem de um setor × 360° = ângulo da fatia.`,
      },
    ],
    questions: [
      {
        code: 'estatistica-01', difficulty: 'facil',
        statement: 'Qual é a média aritmética dos valores 12, 15, 18 e 15?',
        options: { A: '16', B: '15', C: '60', D: '18' },
        correct: 'B',
        explanation: 'Soma: 12 + 15 + 18 + 15 = 60. Média: 60/4 = 15.',
      },
      {
        code: 'estatistica-02', difficulty: 'facil',
        statement: 'Qual é a moda do conjunto de dados 3, 5, 5, 7, 8, 8, 8, 10?',
        options: { A: '5', B: '7', C: '8', D: '6,75' },
        correct: 'C',
        explanation: 'O valor 8 aparece três vezes, mais do que qualquer outro. (6,75 é a média, não a moda.)',
      },
      {
        code: 'estatistica-03', difficulty: 'medio',
        statement: 'Qual é a mediana dos valores 9, 2, 7, 4, 10 e 6?',
        options: { A: '7', B: '6', C: '8', D: '6,5' },
        correct: 'D',
        explanation: 'Em ordem: 2, 4, 6, 7, 9, 10. São 6 valores (quantidade par), então a mediana é a média dos dois centrais: (6 + 7)/2 = 6,5.',
      },
      {
        code: 'estatistica-04', difficulty: 'medio',
        statement: 'A nota final de uma disciplina é a média ponderada entre a prova (peso 3) e o trabalho (peso 2). Um aluno tirou 6,0 na prova e 8,5 no trabalho. Qual é a sua nota final?',
        options: { A: '7,0', B: '7,25', C: '7,5', D: '6,8' },
        correct: 'A',
        explanation: '(6,0·3 + 8,5·2)/(3 + 2) = (18 + 17)/5 = 35/5 = 7,0. (7,25 seria a média simples, que ignora os pesos.)',
      },
      {
        code: 'estatistica-05', difficulty: 'dificil',
        statement: 'A média de 5 números é 8. Ao retirar um desses números, a média dos 4 restantes passa a ser 7. Qual número foi retirado?',
        options: { A: '8', B: '12', C: '1', D: '15' },
        correct: 'B',
        explanation: 'A soma dos 5 números é 5·8 = 40. A soma dos 4 restantes é 4·7 = 28. O número retirado é 40 − 28 = 12.',
      },
    ],
  },
  {
    slug: 'matematica-financeira',
    title: 'Matemática Financeira',
    summary: 'Porcentagem, juros simples e juros compostos para o dia a dia.',
    objective: 'Calcular porcentagens, aumentos e descontos e comparar juros simples e compostos, usando taxa e período na mesma unidade de tempo.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Dinheiro ao longo do tempo',
        body: `A matemática financeira ajuda a decidir entre pagar à vista ou parcelado, entender descontos e saber quanto uma dívida ou investimento cresce.

**Porcentagem** é uma fração com denominador 100: 15% = 15/100 = 0,15.

**Juros** são o valor pago pelo uso de um dinheiro durante um tempo:
- nos **juros simples**, os juros de cada período são sempre calculados sobre o valor inicial (capital);
- nos **juros compostos**, os juros de cada período são somados ao saldo e passam a render juros também ("juros sobre juros").

Por isso, com a mesma taxa, os juros compostos crescem mais rápido com o tempo. A maioria dos financiamentos, cartões de crédito e investimentos usa juros compostos.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `Notação: C = capital (valor inicial), i = taxa de juros na forma decimal, t = número de períodos, J = juros, M = montante (valor final).

**Condição essencial:** a taxa e o tempo precisam estar na mesma unidade. Taxa ao mês → tempo em meses; taxa ao ano → tempo em anos.

**Porcentagem**
- p% de V = (p/100)·V.
- Aumento de p%: V·(1 + p/100). Desconto de p%: V·(1 − p/100).
- Aumentos e descontos sucessivos: multiplique os fatores (eles não se somam).

**Juros simples**
- J = C·i·t
- M = C + J = C·(1 + i·t)

**Juros compostos**
- M = C·(1 + i)^{t}
- J = M − C`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Desconto à vista',
        body: `Um celular custa R$ 1.200,00 e tem 15% de desconto no pagamento à vista. Qual é o preço à vista?

1. Fator de desconto: 1 − 0,15 = 0,85.
2. Preço: 1200·0,85 = 1020. O preço à vista é R$ 1.020,00 (economia de R$ 180,00).`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Juros simples',
        body: `R$ 2.000,00 são aplicados a juros simples de 1,5% ao mês durante 8 meses. Qual é o montante?

1. Taxa e tempo estão em meses: i = 0,015 e t = 8.
2. J = 2000·0,015·8 = 240.
3. M = 2000 + 240 = 2240. O montante é R$ 2.240,00.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Juros compostos × juros simples',
        body: `R$ 1.000,00 são aplicados a 2% ao mês durante 3 meses. Compare juros compostos e simples.

1. Compostos: M = 1000·(1,02)^{3} = 1000·1,061208 ≈ 1061,21. Montante de R$ 1.061,21.
2. Simples: M = 1000·(1 + 0,02·3) = 1000·1,06 = 1060. Montante de R$ 1.060,00.
3. Nos compostos, o montante é maior porque os juros de cada mês também rendem juros.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Transforme a porcentagem em decimal antes de calcular.
- Aumento: multiplique por (1 + taxa); desconto: por (1 − taxa).
- Simples: M = C·(1 + i·t). Compostos: M = C·(1 + i)^{t}.
- Taxa e tempo sempre na mesma unidade.`,
      },
    ],
    questions: [
      {
        code: 'financeira-01', difficulty: 'facil',
        statement: 'Quanto é 35% de R$ 240,00?',
        options: { A: 'R$ 35,00', B: 'R$ 84,00', C: 'R$ 8,40', D: 'R$ 156,00' },
        correct: 'B',
        explanation: '35% de 240 = 0,35·240 = 84. Resposta: R$ 84,00. (R$ 156,00 é o que sobra após tirar 35%.)',
      },
      {
        code: 'financeira-02', difficulty: 'facil',
        statement: 'Uma conta de R$ 150,00 foi paga com atraso e teve acréscimo de 4%. Qual foi o valor pago?',
        options: { A: 'R$ 154,00', B: 'R$ 144,00', C: 'R$ 156,00', D: 'R$ 210,00' },
        correct: 'C',
        explanation: 'Aumento de 4%: 150·1,04 = 156. O valor pago foi R$ 156,00.',
      },
      {
        code: 'financeira-03', difficulty: 'medio',
        statement: 'Um capital de R$ 800,00 foi aplicado a juros simples de 2% ao mês durante 6 meses. Qual é o montante ao final desse período?',
        options: { A: 'R$ 896,00', B: 'R$ 96,00', C: 'R$ 900,93', D: 'R$ 816,00' },
        correct: 'A',
        explanation: 'J = C·i·t = 800·0,02·6 = 96. M = 800 + 96 = R$ 896,00. (R$ 96,00 são só os juros; R$ 900,93 seria o montante com juros compostos.)',
      },
      {
        code: 'financeira-04', difficulty: 'medio',
        statement: 'Qual é o montante de R$ 5.000,00 aplicados a juros compostos de 10% ao ano durante 3 anos?',
        options: { A: 'R$ 6.500,00', B: 'R$ 5.500,00', C: 'R$ 6.050,00', D: 'R$ 6.655,00' },
        correct: 'D',
        explanation: 'M = 5000·(1,10)^{3} = 5000·1,331 = 6655. O montante é R$ 6.655,00. (R$ 6.500,00 seria com juros simples.)',
      },
      {
        code: 'financeira-05', difficulty: 'dificil',
        statement: 'Um produto custava R$ 200,00. Ele teve um aumento de 25% e, depois, um desconto de 20% sobre o novo preço. Qual é o preço final?',
        options: { A: 'R$ 210,00', B: 'R$ 190,00', C: 'R$ 200,00', D: 'R$ 205,00' },
        correct: 'C',
        explanation: 'Depois do aumento: 200·1,25 = 250. Depois do desconto: 250·0,80 = 200. Os fatores se multiplicam (1,25·0,80 = 1), então o preço final volta a R$ 200,00.',
      },
    ],
  },
];
