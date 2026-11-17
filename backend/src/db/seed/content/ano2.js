// Aulas do 2º ano — distribuição definida pelo projeto Simple Education
// (não representa uma organização curricular oficial). Questões originais.
// Marcações: x^{2} expoente, a_{n} índice, **negrito**, listas "- " e "1. ".

export default [
  {
    slug: 'geometria-espacial',
    title: 'Geometria Espacial',
    summary: 'Cálculo de volume e área de sólidos como cilindros, cones e esferas.',
    objective: 'Calcular áreas e volumes de prismas, cilindros, cones e esferas, escolhendo a fórmula adequada e trabalhando com unidades de medida.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Medindo objetos em três dimensões',
        body: `A geometria espacial estuda sólidos, como caixas, latas, casquinhas de sorvete e bolas.

- A **área** mede a superfície que cobre o sólido (quanto papel seria preciso para embrulhá-lo). É dada em unidades quadradas, como cm^{2} e m^{2}.
- O **volume** mede o espaço ocupado (quanto cabe dentro). É dado em unidades cúbicas, como cm^{3} e m^{3}.

Prismas e cilindros têm duas bases iguais e paralelas: o volume é a área da base vezes a altura. O cone é como um cilindro que "afina" até um ponto, e seu volume é um terço do cilindro de mesma base e altura. A esfera tem fórmulas próprias, que dependem só do raio.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `Todas as medidas devem estar na mesma unidade antes de calcular. Respostas podem deixar π indicado (ex.: 12π cm^{3}) ou usar uma aproximação, como π ≈ 3,14, quando o enunciado pedir.

**Prismas** (A_{b} = área da base, h = altura)
- Volume: V = A_{b}·h.
- Cubo de aresta a: V = a^{3}; área total A = 6a^{2}.
- Paralelepípedo de dimensões a, b e c: V = a·b·c; área total A = 2(ab + ac + bc).

**Cilindro** (raio r, altura h)
- Área da base: A_{b} = πr^{2}. Volume: V = πr^{2}h.
- Área lateral: 2πrh. Área total: 2πr^{2} + 2πrh.

**Cone reto** (raio r, altura h, geratriz g)
- Volume: V = (1/3)·πr^{2}h.
- Geratriz: g^{2} = r^{2} + h^{2}. Área lateral: πrg.

**Esfera** (raio r)
- Volume: V = (4/3)·πr^{3}. Área da superfície: A = 4πr^{2}.

**Unidades de capacidade**
- 1 cm^{3} = 1 mL; 1 dm^{3} = 1 L; 1 m^{3} = 1000 L.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Caixa-d’água cilíndrica',
        body: `Uma caixa-d’água cilíndrica tem raio de 1 m e altura de 2 m. Quantos litros ela comporta? Use π ≈ 3,14.

1. V = πr^{2}h = π·1^{2}·2 = 2π m^{3}.
2. Com π ≈ 3,14: V ≈ 6,28 m^{3}.
3. Como 1 m^{3} = 1000 L, a caixa comporta cerca de 6.280 litros.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Cone: geratriz, área lateral e volume',
        body: `Um cone reto tem raio da base 3 cm e altura 4 cm.

1. Geratriz: g^{2} = 3^{2} + 4^{2} = 9 + 16 = 25, então g = 5 cm.
2. Área lateral: πrg = π·3·5 = 15π cm^{2}.
3. Volume: V = (1/3)·π·3^{2}·4 = (1/3)·36π = 12π cm^{3}.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Esfera',
        body: `Uma bola tem raio de 6 cm. Qual é o seu volume e a área da sua superfície?

1. Volume: V = (4/3)·π·6^{3} = (4/3)·216π = 288π cm^{3}.
2. Área: A = 4π·6^{2} = 4·36π = 144π cm^{2}.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Área em unidades quadradas; volume em unidades cúbicas.
- Prisma e cilindro: V = (área da base)·(altura).
- Cone: um terço do cilindro de mesma base e altura.
- Esfera: V = (4/3)πr^{3} e A = 4πr^{2}.
- Para capacidade: 1 dm^{3} = 1 L e 1 cm^{3} = 1 mL.`,
      },
    ],
    questions: [
      {
        code: 'espacial-01', difficulty: 'facil',
        statement: 'Qual é o volume de um paralelepípedo com dimensões de 3 cm, 4 cm e 5 cm?',
        options: { A: '12 cm^{3}', B: '47 cm^{3}', C: '94 cm^{3}', D: '60 cm^{3}' },
        correct: 'D',
        explanation: 'V = a·b·c = 3·4·5 = 60 cm^{3}.',
      },
      {
        code: 'espacial-02', difficulty: 'facil',
        statement: 'Um cubo tem aresta de 4 cm. Qual é a sua área total?',
        options: { A: '64 cm^{2}', B: '16 cm^{2}', C: '96 cm^{2}', D: '48 cm^{2}' },
        correct: 'C',
        explanation: 'O cubo tem 6 faces quadradas de área 4^{2} = 16 cm^{2}. Área total: 6·16 = 96 cm^{2}.',
      },
      {
        code: 'espacial-03', difficulty: 'medio',
        statement: 'Um copo cilíndrico tem raio interno de 3 cm e altura interna de 10 cm. Usando π ≈ 3,14, qual é a capacidade aproximada do copo, em mililitros?',
        options: { A: '282,6 mL', B: '94,2 mL', C: '188,4 mL', D: '2.826 mL' },
        correct: 'A',
        explanation: 'V = πr^{2}h = π·9·10 = 90π cm^{3} ≈ 90·3,14 = 282,6 cm^{3}. Como 1 cm^{3} = 1 mL, a capacidade é de cerca de 282,6 mL.',
      },
      {
        code: 'espacial-04', difficulty: 'medio',
        statement: 'Um cone reto tem raio da base de 6 cm e altura de 8 cm. Qual é o seu volume?',
        options: { A: '288π cm^{3}', B: '96π cm^{3}', C: '48π cm^{3}', D: '60π cm^{3}' },
        correct: 'B',
        explanation: 'V = (1/3)·πr^{2}h = (1/3)·π·36·8 = (1/3)·288π = 96π cm^{3}. (288π seria o volume do cilindro de mesma base e altura.)',
      },
      {
        code: 'espacial-05', difficulty: 'dificil',
        statement: 'Uma esfera maciça de raio 3 cm é derretida, e todo o material é usado para formar um cilindro com raio da base de 3 cm. Qual é a altura desse cilindro?',
        options: { A: '3 cm', B: '12 cm', C: '4 cm', D: '6 cm' },
        correct: 'C',
        explanation: 'O volume se mantém. Esfera: (4/3)·π·3^{3} = 36π cm^{3}. Cilindro: π·3^{2}·h = 9πh. Então 9πh = 36π → h = 4 cm.',
      },
    ],
  },
  {
    slug: 'trigonometria',
    title: 'Trigonometria',
    summary: 'Estudo de seno, cosseno, tangente e do ciclo trigonométrico.',
    objective: 'Usar seno, cosseno e tangente no triângulo retângulo, converter graus em radianos e localizar ângulos e sinais no ciclo trigonométrico.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Ângulos e medidas',
        body: `A trigonometria relaciona os **ângulos** de um triângulo com as **medidas** dos seus lados. Com ela é possível calcular alturas e distâncias difíceis de medir diretamente, como a altura de um prédio a partir da sua sombra.

No triângulo retângulo, para um ângulo agudo θ, chamamos de **hipotenusa** o maior lado (oposto ao ângulo reto), de **cateto oposto** o lado em frente a θ e de **cateto adjacente** o lado que forma θ junto com a hipotenusa.

O **ciclo trigonométrico** é uma circunferência de raio 1 centrada na origem. Cada ângulo corresponde a um ponto (cos θ, sen θ), o que permite falar de seno e cosseno de ângulos maiores que 90° e de seus sinais.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `**No triângulo retângulo** (θ agudo)
- sen θ = cateto oposto / hipotenusa
- cos θ = cateto adjacente / hipotenusa
- tg θ = cateto oposto / cateto adjacente
- Teorema de Pitágoras: hipotenusa^{2} = cateto^{2} + cateto^{2}.

**Valores notáveis**
- 30°: sen = 1/2; cos = √3/2; tg = √3/3.
- 45°: sen = √2/2; cos = √2/2; tg = 1.
- 60°: sen = √3/2; cos = 1/2; tg = √3.

**Relações** (valem para qualquer ângulo)
- sen^{2}θ + cos^{2}θ = 1.
- tg θ = sen θ / cos θ, desde que cos θ ≠ 0.

**Radianos e ciclo**
- π rad = 180°. Para converter graus em radianos, multiplique por π/180.
- Sinais: 1º quadrante (0° a 90°) seno e cosseno positivos; 2º (90° a 180°) seno positivo e cosseno negativo; 3º (180° a 270°) ambos negativos; 4º (270° a 360°) seno negativo e cosseno positivo.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Altura de uma rampa',
        body: `Uma rampa reta de 8 m de comprimento forma um ângulo de 30° com o chão. A que altura ela chega?

1. A rampa é a hipotenusa (8 m) e a altura é o cateto oposto ao ângulo de 30°.
2. sen 30° = altura / 8 → altura = 8·(1/2) = 4 m.
3. A distância horizontal é o cateto adjacente: 8·cos 30° = 8·√3/2 = 4√3 ≈ 6,93 m.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Usando a relação fundamental',
        body: `Sabendo que θ é agudo e sen θ = 3/5, calcule cos θ e tg θ.

1. sen^{2}θ + cos^{2}θ = 1 → 9/25 + cos^{2}θ = 1 → cos^{2}θ = 16/25.
2. Como θ é agudo, o cosseno é positivo: cos θ = 4/5.
3. tg θ = sen θ / cos θ = (3/5) / (4/5) = 3/4.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Radianos e ciclo trigonométrico',
        body: `Converta 150° para radianos e calcule sen 150°.

1. 150·π/180 = 5π/6 rad.
2. 150° está no 2º quadrante, onde o seno é positivo.
3. O ângulo que falta para 180° é 30°, então sen 150° = sen 30° = 1/2.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- sen = oposto/hipotenusa; cos = adjacente/hipotenusa; tg = oposto/adjacente.
- Decore os valores de 30°, 45° e 60°.
- sen^{2}θ + cos^{2}θ = 1 e tg θ = sen θ / cos θ.
- 180° = π rad; o quadrante define os sinais de seno e cosseno.`,
      },
    ],
    questions: [
      {
        code: 'trigonometria-01', difficulty: 'facil',
        statement: 'Qual é o valor de cos 60°?',
        options: { A: '√3/2', B: '1/2', C: '√2/2', D: '1' },
        correct: 'B',
        explanation: 'cos 60° = 1/2 é um dos valores notáveis da trigonometria.',
      },
      {
        code: 'trigonometria-02', difficulty: 'facil',
        statement: 'Quanto mede um ângulo de 120° em radianos?',
        options: { A: '2π/3 rad', B: '3π/4 rad', C: 'π/3 rad', D: '5π/6 rad' },
        correct: 'A',
        explanation: '120·π/180 = 120π/180 = 2π/3 rad.',
      },
      {
        code: 'trigonometria-03', difficulty: 'medio',
        statement: 'Uma escada de 10 m está apoiada em uma parede vertical e forma um ângulo de 60° com o chão horizontal. Usando √3 ≈ 1,73, a que altura aproximada ela toca a parede?',
        options: { A: '5 m', B: '5,77 m', C: '17,3 m', D: '8,65 m' },
        correct: 'D',
        explanation: 'A altura é o cateto oposto ao ângulo de 60° e a escada é a hipotenusa: altura = 10·sen 60° = 10·√3/2 = 5√3 ≈ 5·1,73 = 8,65 m.',
      },
      {
        code: 'trigonometria-04', difficulty: 'medio',
        statement: 'Os catetos de um triângulo retângulo medem 5 cm e 12 cm. Qual é o seno do ângulo oposto ao cateto de 5 cm?',
        options: { A: '12/13', B: '5/12', C: '5/13', D: '12/5' },
        correct: 'C',
        explanation: 'Pela relação de Pitágoras, a hipotenusa mede √(25 + 144) = √169 = 13 cm. Então sen = oposto/hipotenusa = 5/13.',
      },
      {
        code: 'trigonometria-05', difficulty: 'dificil',
        statement: 'Sabendo que cos x = −0,6 e que x é um ângulo do 2º quadrante, qual é o valor de tg x?',
        options: { A: '−4/3', B: '4/3', C: '−3/4', D: '−0,8' },
        correct: 'A',
        explanation: 'sen^{2}x = 1 − 0,36 = 0,64, então sen x = ±0,8. No 2º quadrante o seno é positivo: sen x = 0,8. Logo, tg x = 0,8/(−0,6) = −4/3.',
      },
    ],
  },
  {
    slug: 'analise-combinatoria-e-probabilidade',
    title: 'Análise Combinatória e Probabilidade',
    summary: 'Técnicas de contagem e cálculo de chances de um evento acontecer.',
    objective: 'Contar possibilidades com o princípio multiplicativo, permutações, arranjos e combinações, e calcular probabilidades simples, complementares e de eventos independentes.',
    sections: [
      {
        kind: 'explicacao',
        title: 'Contar sem listar tudo',
        body: `A análise combinatória ensina a contar possibilidades sem precisar escrever todas elas. A pergunta central é: **a ordem dos elementos escolhidos importa?**

- Se a ordem importa (senhas, pódios, presidente e vice), usamos o princípio multiplicativo, permutações ou arranjos.
- Se a ordem não importa (comissões, duplas, grupos), usamos combinações.

A **probabilidade** mede a chance de algo acontecer, comparando os casos que nos interessam (favoráveis) com todos os casos possíveis. Ela usa a contagem para encontrar esses números.`,
      },
      {
        kind: 'formulas',
        title: 'Conceitos e fórmulas',
        body: `**Contagem**
- Princípio multiplicativo: se uma etapa tem m opções e outra, independente, tem n opções, as duas juntas têm m·n possibilidades.
- Fatorial (n natural): n! = n·(n − 1)·...·2·1, com 0! = 1.
- Permutação de n elementos distintos: P_{n} = n!.
- Permutação com repetição (elementos repetidos k_{1}, k_{2}, ... vezes): n! / (k_{1}!·k_{2}!·...).
- Arranjo (ordem importa, p ≤ n): A_{n,p} = n! / (n − p)!.
- Combinação (ordem não importa, p ≤ n): C_{n,p} = n! / (p!·(n − p)!).

**Probabilidade** (todos os resultados igualmente prováveis)
- P(A) = número de casos favoráveis / número de casos possíveis, com 0 ≤ P(A) ≤ 1.
- Evento complementar: P(não A) = 1 − P(A).
- Eventos independentes: P(A e B) = P(A)·P(B).`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 1 — Senhas (ordem importa)',
        body: `Quantas senhas de 3 dígitos podem ser formadas com os algarismos de 0 a 9?

1. Com repetição permitida: cada posição tem 10 opções → 10·10·10 = 1000 senhas.
2. Sem repetir algarismos: 10 opções, depois 9, depois 8 → 10·9·8 = 720 senhas.
3. O segundo caso é o arranjo A_{10,3} = 10!/7! = 720.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 2 — Comissão (ordem não importa)',
        body: `De 6 alunos, quantas comissões de 3 pessoas podem ser formadas?

1. Trocar a ordem das pessoas não muda a comissão, então é combinação.
2. C_{6,3} = 6! / (3!·3!) = 720 / (6·6) = 20 comissões.`,
      },
      {
        kind: 'exemplo',
        title: 'Exemplo 3 — Probabilidade com dois dados',
        body: `Dois dados comuns são lançados. Qual é a probabilidade de a soma ser 7?

1. Casos possíveis: 6·6 = 36 pares de resultados.
2. Casos favoráveis: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) → 6 pares.
3. P = 6/36 = 1/6.`,
      },
      {
        kind: 'resumo',
        title: 'Resumo',
        body: `- Pergunte sempre se a ordem importa: sim → arranjo/permutação; não → combinação.
- Princípio multiplicativo: multiplique as opções de cada etapa.
- P(A) = favoráveis / possíveis; "pelo menos um" costuma ser mais fácil pelo complementar: 1 − P(nenhum).`,
      },
    ],
    questions: [
      {
        code: 'combinatoria-01', difficulty: 'facil',
        statement: 'Uma lanchonete oferece 4 tipos de pão e 3 tipos de recheio. Quantos sanduíches diferentes, com um pão e um recheio, podem ser montados?',
        options: { A: '7', B: '24', C: '12', D: '64' },
        correct: 'C',
        explanation: 'Pelo princípio multiplicativo: 4 opções de pão × 3 opções de recheio = 12 sanduíches.',
      },
      {
        code: 'combinatoria-02', difficulty: 'facil',
        statement: 'Uma urna tem 5 bolas vermelhas e 3 bolas azuis, todas iguais ao tato. Sorteando uma bola ao acaso, qual é a probabilidade de ela ser azul?',
        options: { A: '3/5', B: '5/8', C: '1/3', D: '3/8' },
        correct: 'D',
        explanation: 'Há 8 bolas no total e 3 são azuis. P(azul) = 3/8.',
      },
      {
        code: 'combinatoria-03', difficulty: 'medio',
        statement: 'Quantos anagramas tem a palavra BANANA?',
        options: { A: '720', B: '60', C: '120', D: '20' },
        correct: 'B',
        explanation: 'São 6 letras com A repetido 3 vezes e N repetido 2 vezes: 6! / (3!·2!) = 720 / (6·2) = 60.',
      },
      {
        code: 'combinatoria-04', difficulty: 'medio',
        statement: 'Em uma turma de 8 alunos, quantas duplas diferentes podem ser formadas para um trabalho?',
        options: { A: '28', B: '56', C: '16', D: '64' },
        correct: 'A',
        explanation: 'Na dupla, a ordem não importa: C_{8,2} = 8! / (2!·6!) = (8·7)/2 = 28. (56 contaria cada dupla duas vezes.)',
      },
      {
        code: 'combinatoria-05', difficulty: 'dificil',
        statement: 'Uma moeda honesta é lançada 3 vezes. Qual é a probabilidade de sair cara pelo menos uma vez?',
        options: { A: '1/8', B: '3/8', C: '1/2', D: '7/8' },
        correct: 'D',
        explanation: 'Pelo complementar: a única forma de não sair cara é coroa nos 3 lançamentos, com probabilidade (1/2)^{3} = 1/8. Então P(pelo menos uma cara) = 1 − 1/8 = 7/8.',
      },
    ],
  },
];
