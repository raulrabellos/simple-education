# Conteúdo pedagógico — Simple Education

Documento gerado automaticamente a partir de `backend/src/db/seed/content/` (`npm run content:export`).
Contém o gabarito: uso interno para revisão. Distribuição por ano definida pelo projeto (não é organização curricular oficial).

## Funções (1º e 2º grau) — 1º ano

**Objetivo:** Reconhecer funções do 1º e do 2º grau, interpretar seus coeficientes, calcular raízes e encontrar o vértice da parábola.

### O que é uma função

Uma função é uma regra que associa cada valor de entrada x a um único valor de saída y = f(x). No dia a dia, o preço de uma corrida que depende da distância ou a altura de uma bola que depende do tempo são exemplos de funções.

Na **função do 1º grau**, a variável x aparece com expoente 1 e o gráfico é uma reta: a saída cresce ou diminui sempre no mesmo ritmo.

Na **função do 2º grau**, aparece o termo x^2 e o gráfico é uma curva chamada parábola. Ela tem um ponto especial, o vértice, onde a função atinge seu valor mínimo ou máximo.

As **raízes** (ou zeros) de uma função são os valores de x em que f(x) = 0. No gráfico, são os pontos em que a curva toca o eixo x.

### Conceitos e fórmulas

**Função do 1º grau**
- Forma: f(x) = ax + b, com a ≠ 0.
- a é a taxa de variação: se a > 0, a função é crescente; se a < 0, é decrescente.
- b é o valor de f(0): a reta corta o eixo y no ponto (0, b).
- Raiz: x = −b/a (só existe divisão porque a ≠ 0).

**Função do 2º grau**
- Forma: f(x) = ax^2 + bx + c, com a ≠ 0.
- Se a > 0, a parábola tem concavidade para cima e o vértice é o ponto de mínimo; se a < 0, concavidade para baixo e o vértice é o ponto de máximo.
- Discriminante: Δ = b^2 − 4ac. Se Δ > 0, há duas raízes reais diferentes; se Δ = 0, uma raiz real (dupla); se Δ < 0, nenhuma raiz real.
- Fórmula de Bhaskara: x = (−b ± √Δ) / (2a), usada apenas quando Δ ≥ 0.
- Vértice: x_v = −b/(2a) e y_v = −Δ/(4a), ou y_v = f(x_v).

### Exemplo 1 — Preço de uma corrida (1º grau)

Uma corrida de aplicativo custa R$ 5,00 fixos mais R$ 2,00 por quilômetro. Qual é o preço de uma corrida de 8 km? E quantos quilômetros é possível rodar com R$ 29,00?

1. O valor fixo é b = 5 e o valor por quilômetro é a = 2. Então C(x) = 2x + 5.
2. Para 8 km: C(8) = 2·8 + 5 = 16 + 5 = 21. A corrida custa R$ 21,00.
3. Para R$ 29,00: 2x + 5 = 29 → 2x = 24 → x = 12. É possível rodar 12 km.
4. Como a = 2 > 0, a função é crescente: quanto maior a distância, maior o preço.

### Exemplo 2 — Raízes e vértice (2º grau)

Vamos analisar f(x) = x^2 − 6x + 8.

1. Coeficientes: a = 1, b = −6 e c = 8.
2. Discriminante: Δ = (−6)^2 − 4·1·8 = 36 − 32 = 4. Como Δ > 0, há duas raízes reais.
3. Raízes: x = (6 ± √4) / 2 = (6 ± 2) / 2, então x = 4 ou x = 2.
4. Vértice: x_v = 6/2 = 3 e y_v = f(3) = 9 − 18 + 8 = −1. Logo, V = (3, −1).
5. Como a = 1 > 0, a concavidade é para cima e o vértice é o ponto de mínimo.

### Exemplo 3 — Altura máxima de uma bola (2º grau)

A altura de uma bola, em metros, t segundos após o chute é h(t) = −5t^2 + 20t. Qual é a altura máxima?

1. Como a = −5 < 0, a parábola tem concavidade para baixo e o vértice é o ponto de máximo.
2. Instante do máximo: t_v = −20/(2·(−5)) = 2 segundos.
3. Altura máxima: h(2) = −5·4 + 20·2 = −20 + 40 = 20 metros.

### Resumo

- 1º grau: f(x) = ax + b, gráfico reta; raiz x = −b/a; o sinal de a indica se cresce ou decresce.
- 2º grau: f(x) = ax^2 + bx + c, gráfico parábola; o sinal de a indica a concavidade.
- Δ = b^2 − 4ac decide quantas raízes reais existem.
- O vértice (x_v, y_v) dá o valor mínimo (a > 0) ou máximo (a < 0) da função.

### Questões

**1. (Fácil, `funcoes-01`)** Qual é a raiz da função f(x) = 3x − 12?

- A) −4
- B) 4 ✅
- C) 12
- D) 36

*Resolução:* A raiz é o valor de x que torna f(x) = 0: 3x − 12 = 0 → 3x = 12 → x = 4.

**2. (Fácil, `funcoes-02`)** Uma locadora cobra R$ 40,00 fixos mais R$ 0,50 por quilômetro rodado. Qual função representa o valor V, em reais, para x quilômetros rodados?

- A) V(x) = 0,5x + 40 ✅
- B) V(x) = 40x + 0,5
- C) V(x) = 40,5x
- D) V(x) = 0,5x − 40

*Resolução:* O valor que muda com cada quilômetro (R$ 0,50) multiplica x, e o valor fixo (R$ 40,00) é somado: V(x) = 0,5x + 40.

**3. (Médio, `funcoes-03`)** Quais são as raízes da equação x^2 − 7x + 10 = 0?

- A) −2 e −5
- B) 1 e 10
- C) 2 e 5 ✅
- D) 3 e 4

*Resolução:* Δ = (−7)^2 − 4·1·10 = 49 − 40 = 9. Pela fórmula de Bhaskara, x = (7 ± 3) / 2, então x = 5 ou x = 2.

**4. (Médio, `funcoes-04`)** Qual é o vértice da parábola f(x) = −x^2 + 4x + 1?

- A) (−2, −11)
- B) (4, 1)
- C) (2, −3)
- D) (2, 5) ✅

*Resolução:* x_v = −b/(2a) = −4/(2·(−1)) = 2. Substituindo, f(2) = −4 + 8 + 1 = 5. Logo, V = (2, 5), que é ponto de máximo porque a = −1 < 0.

**5. (Difícil, `funcoes-05`)** Para quais valores reais de k a equação x^2 − 6x + k = 0 possui duas raízes reais diferentes?

- A) k < 9 ✅
- B) k > 9
- C) k = 9
- D) k < 36

*Resolução:* É preciso Δ > 0: Δ = (−6)^2 − 4·1·k = 36 − 4k. Então 36 − 4k > 0 → 4k < 36 → k < 9.

## Progressões (PA e PG) — 1º ano

**Objetivo:** Identificar progressões aritméticas e geométricas, calcular a razão, um termo qualquer e a soma dos primeiros termos.

### Sequências com padrão

Uma progressão é uma sequência de números que segue uma regra fixa.

Na **progressão aritmética (PA)**, cada termo é obtido **somando** sempre o mesmo valor ao anterior. Esse valor é a razão r. Exemplo: (3, 7, 11, 15, ...) tem r = 4. Aparece em situações como economizar um valor que aumenta a mesma quantia todo mês.

Na **progressão geométrica (PG)**, cada termo é obtido **multiplicando** sempre pelo mesmo valor. Esse valor é a razão q. Exemplo: (2, 6, 18, 54, ...) tem q = 3. Aparece em crescimentos que dobram ou triplicam, como a multiplicação de bactérias.

Para descobrir o tipo: se a diferença entre termos vizinhos é constante, é PA; se a divisão entre termos vizinhos é constante, é PG.

### Conceitos e fórmulas

**Progressão aritmética** (n é a posição do termo, inteiro e n ≥ 1)
- Razão: r = a_2 − a_1.
- Termo geral: a_n = a_1 + (n − 1)·r.
- Soma dos n primeiros termos: S_n = (a_1 + a_n)·n / 2.

**Progressão geométrica** (a_1 ≠ 0)
- Razão: q = a_2 / a_1.
- Termo geral: a_n = a_1·q^(n − 1).
- Soma dos n primeiros termos: S_n = a_1·(q^n − 1) / (q − 1), válida para q ≠ 1. Se q = 1, todos os termos são iguais e S_n = n·a_1.

### Exemplo 1 — Economia mensal (PA)

Uma pessoa guarda R$ 50,00 no primeiro mês e, a cada mês, guarda R$ 10,00 a mais do que no mês anterior. Quanto ela guarda no 12º mês? E quanto terá guardado ao todo em 12 meses?

1. Os valores formam uma PA com a_1 = 50 e r = 10.
2. 12º termo: a_(12) = 50 + (12 − 1)·10 = 50 + 110 = 160. No 12º mês ela guarda R$ 160,00.
3. Soma: S_(12) = (50 + 160)·12 / 2 = 210·6 = 1260. Ao todo, R$ 1.260,00.

### Exemplo 2 — Crescimento de bactérias (PG)

Uma cultura começa com 300 bactérias e a quantidade dobra a cada hora. Quantas bactérias haverá ao final de 5 horas?

1. A sequência (300, 600, 1200, ...) é uma PG com a_1 = 300 (início) e q = 2.
2. O início é o 1º termo; ao final de 5 horas estamos no 6º termo.
3. a_6 = 300·2^5 = 300·32 = 9600. Haverá 9.600 bactérias.

### Exemplo 3 — Soma de uma PG

Qual é a soma dos 5 primeiros termos da PG (2, 6, 18, ...)?

1. a_1 = 2 e q = 6/2 = 3 (q ≠ 1, então a fórmula da soma pode ser usada).
2. S_5 = 2·(3^5 − 1) / (3 − 1) = 2·(243 − 1) / 2 = 242.
3. Conferindo: 2 + 6 + 18 + 54 + 162 = 242.

### Resumo

- PA: soma-se a razão r; a_n = a_1 + (n − 1)·r; S_n = (a_1 + a_n)·n / 2.
- PG: multiplica-se pela razão q; a_n = a_1·q^(n − 1); S_n = a_1·(q^n − 1)/(q − 1), com q ≠ 1.
- Atenção à posição do termo: o primeiro termo é a_1, não a_0.

### Questões

**1. (Fácil, `progressoes-01`)** Qual é o 10º termo da PA (4, 7, 10, ...)?

- A) 34
- B) 28
- C) 31 ✅
- D) 30

*Resolução:* A razão é r = 7 − 4 = 3. Então a_(10) = 4 + (10 − 1)·3 = 4 + 27 = 31.

**2. (Fácil, `progressoes-02`)** Qual é a razão da PG (5, 15, 45, ...)?

- A) 10
- B) 3 ✅
- C) 5
- D) 1/3

*Resolução:* Na PG, a razão é o quociente entre termos vizinhos: q = 15 / 5 = 3 (e 45 / 15 = 3).

**3. (Médio, `progressoes-03`)** Um atleta corre 2 km no primeiro dia de treino e, a cada dia, corre 0,5 km a mais do que no dia anterior. Quantos quilômetros ele corre, no total, nos 10 primeiros dias?

- A) 6,5 km
- B) 45 km
- C) 85 km
- D) 42,5 km ✅

*Resolução:* É uma PA com a_1 = 2 e r = 0,5. O 10º termo é a_(10) = 2 + 9·0,5 = 6,5. A soma é S_(10) = (2 + 6,5)·10 / 2 = 42,5 km.

**4. (Médio, `progressoes-04`)** Em uma PG, o primeiro termo é 3 e a razão é 2. Qual é o 7º termo?

- A) 192 ✅
- B) 384
- C) 96
- D) 42

*Resolução:* a_7 = a_1·q^6 = 3·2^6 = 3·64 = 192.

**5. (Difícil, `progressoes-05`)** Qual é a soma dos 6 primeiros termos da PG (1, 3, 9, ...)?

- A) 243
- B) 364 ✅
- C) 729
- D) 121

*Resolução:* a_1 = 1 e q = 3. S_6 = 1·(3^6 − 1)/(3 − 1) = (729 − 1)/2 = 364. Conferindo: 1 + 3 + 9 + 27 + 81 + 243 = 364.

## Função Exponencial e Logaritmos — 1º ano

**Objetivo:** Resolver equações exponenciais simples, calcular logaritmos usando suas propriedades e aplicar ambos em situações de crescimento e decaimento.

### Crescimento rápido e operação inversa

Na **função exponencial**, a variável está no expoente: f(x) = 2^x. A cada passo, o valor é multiplicado pela mesma base, por isso o crescimento (ou a queda) é muito rápido. Ela descreve juros compostos, crescimento de populações e decaimento de substâncias.

O **logaritmo** responde à pergunta inversa: "a que expoente devo elevar a base para obter este número?". Como 2^3 = 8, dizemos que log_2 8 = 3.

Logaritmos são úteis quando a incógnita está no expoente e não é possível escrever os dois lados da equação na mesma base.

### Conceitos e fórmulas

**Função exponencial**
- f(x) = a^x, com a > 0 e a ≠ 1.
- Se a > 1, a função é crescente; se 0 < a < 1, é decrescente.
- O gráfico passa por (0, 1) e f(x) > 0 para todo x real.
- Propriedades das potências: a^m·a^n = a^(m + n); a^m / a^n = a^(m − n); (a^m)^n = a^(m·n); a^0 = 1.
- Equação exponencial: se a > 0 e a ≠ 1, então a^x = a^y quando, e somente quando, x = y.

**Logaritmos**
- Definição: log_a b = x significa a^x = b, com a > 0, a ≠ 1 e b > 0.
- Quando a base não aparece, ela é 10: log 1000 = 3.
- Para m > 0 e n > 0: log_a(m·n) = log_a m + log_a n; log_a(m/n) = log_a m − log_a n; log_a(m^k) = k·log_a m.
- Mudança de base: log_a b = log b / log a.

### Exemplo 1 — Equação exponencial

Resolva 3^(x + 1) = 81.

1. Escreva 81 como potência de 3: 81 = 3^4.
2. A equação fica 3^(x + 1) = 3^4. Como as bases são iguais (e válidas), os expoentes são iguais.
3. x + 1 = 4 → x = 3.
4. Conferindo: 3^(3 + 1) = 3^4 = 81.

### Exemplo 2 — Calculando logaritmos

a) Quanto vale log_2 32?
1. Procuramos x tal que 2^x = 32. Como 2^5 = 32, log_2 32 = 5.

b) Sabendo que log 2 ≈ 0,301, quanto vale log 8?
1. 8 = 2^3, então log 8 = log 2^3 = 3·log 2.
2. log 8 ≈ 3·0,301 = 0,903.

### Exemplo 3 — Quando a população dobra

Uma cidade tem 10.000 habitantes e cresce 10% ao ano, ou seja, P(t) = 10000·1,1^t, com t em anos. Em quanto tempo a população dobra? Use log 2 ≈ 0,301 e log 1,1 ≈ 0,0414.

1. Dobrar significa P(t) = 20000: 10000·1,1^t = 20000 → 1,1^t = 2.
2. Não dá para escrever 2 como potência de 1,1, então aplicamos log nos dois lados: t·log 1,1 = log 2.
3. t = 0,301 / 0,0414 ≈ 7,3. A população dobra em pouco mais de 7 anos.

### Resumo

- Exponencial: f(x) = a^x, a > 0 e a ≠ 1; cresce se a > 1 e decresce se 0 < a < 1.
- Mesma base dos dois lados → iguale os expoentes.
- log_a b = x ⇔ a^x = b (a > 0, a ≠ 1, b > 0).
- Produto vira soma, divisão vira subtração e expoente "desce" multiplicando.

### Questões

**1. (Fácil, `exponencial-01`)** Qual é o valor de x na equação 2^x = 64?

- A) 6 ✅
- B) 32
- C) 8
- D) 5

*Resolução:* 64 = 2^6. Então 2^x = 2^6 e, como as bases são iguais, x = 6.

**2. (Fácil, `exponencial-02`)** Quanto vale log_3 81?

- A) 27
- B) 3
- C) 9
- D) 4 ✅

*Resolução:* Procuramos o expoente x tal que 3^x = 81. Como 3^4 = 81, log_3 81 = 4.

**3. (Médio, `exponencial-03`)** Qual é a solução da equação 5^(2x − 1) = 125?

- A) x = 3
- B) x = 2 ✅
- C) x = 1
- D) x = 5/2

*Resolução:* 125 = 5^3. Então 2x − 1 = 3 → 2x = 4 → x = 2. Conferindo: 5^(2·2 − 1) = 5^3 = 125.

**4. (Médio, `exponencial-04`)** Considere log 2 ≈ 0,30 e log 3 ≈ 0,48. Qual é o valor aproximado de log 12?

- A) 0,78
- B) 1,44
- C) 1,08 ✅
- D) 0,90

*Resolução:* 12 = 2^2·3. Pelas propriedades, log 12 = 2·log 2 + log 3 ≈ 2·0,30 + 0,48 = 1,08.

**5. (Difícil, `exponencial-05`)** Uma substância perde metade da sua massa a cada 3 horas. Partindo de 80 g, a massa após t horas é M(t) = 80·(1/2)^(t/3). Depois de quanto tempo restarão 10 g?

- A) 24 horas
- B) 6 horas
- C) 12 horas
- D) 9 horas ✅

*Resolução:* 80·(1/2)^(t/3) = 10 → (1/2)^(t/3) = 1/8 = (1/2)^3. Igualando os expoentes, t/3 = 3 → t = 9 horas. (80 → 40 → 20 → 10: três períodos de 3 horas.)

## Geometria Espacial — 2º ano

**Objetivo:** Calcular áreas e volumes de prismas, cilindros, cones e esferas, escolhendo a fórmula adequada e trabalhando com unidades de medida.

### Medindo objetos em três dimensões

A geometria espacial estuda sólidos, como caixas, latas, casquinhas de sorvete e bolas.

- A **área** mede a superfície que cobre o sólido (quanto papel seria preciso para embrulhá-lo). É dada em unidades quadradas, como cm^2 e m^2.
- O **volume** mede o espaço ocupado (quanto cabe dentro). É dado em unidades cúbicas, como cm^3 e m^3.

Prismas e cilindros têm duas bases iguais e paralelas: o volume é a área da base vezes a altura. O cone é como um cilindro que "afina" até um ponto, e seu volume é um terço do cilindro de mesma base e altura. A esfera tem fórmulas próprias, que dependem só do raio.

### Conceitos e fórmulas

Todas as medidas devem estar na mesma unidade antes de calcular. Respostas podem deixar π indicado (ex.: 12π cm^3) ou usar uma aproximação, como π ≈ 3,14, quando o enunciado pedir.

**Prismas** (A_b = área da base, h = altura)
- Volume: V = A_b·h.
- Cubo de aresta a: V = a^3; área total A = 6a^2.
- Paralelepípedo de dimensões a, b e c: V = a·b·c; área total A = 2(ab + ac + bc).

**Cilindro** (raio r, altura h)
- Área da base: A_b = πr^2. Volume: V = πr^2h.
- Área lateral: 2πrh. Área total: 2πr^2 + 2πrh.

**Cone reto** (raio r, altura h, geratriz g)
- Volume: V = (1/3)·πr^2h.
- Geratriz: g^2 = r^2 + h^2. Área lateral: πrg.

**Esfera** (raio r)
- Volume: V = (4/3)·πr^3. Área da superfície: A = 4πr^2.

**Unidades de capacidade**
- 1 cm^3 = 1 mL; 1 dm^3 = 1 L; 1 m^3 = 1000 L.

### Exemplo 1 — Caixa-d’água cilíndrica

Uma caixa-d’água cilíndrica tem raio de 1 m e altura de 2 m. Quantos litros ela comporta? Use π ≈ 3,14.

1. V = πr^2h = π·1^2·2 = 2π m^3.
2. Com π ≈ 3,14: V ≈ 6,28 m^3.
3. Como 1 m^3 = 1000 L, a caixa comporta cerca de 6.280 litros.

### Exemplo 2 — Cone: geratriz, área lateral e volume

Um cone reto tem raio da base 3 cm e altura 4 cm.

1. Geratriz: g^2 = 3^2 + 4^2 = 9 + 16 = 25, então g = 5 cm.
2. Área lateral: πrg = π·3·5 = 15π cm^2.
3. Volume: V = (1/3)·π·3^2·4 = (1/3)·36π = 12π cm^3.

### Exemplo 3 — Esfera

Uma bola tem raio de 6 cm. Qual é o seu volume e a área da sua superfície?

1. Volume: V = (4/3)·π·6^3 = (4/3)·216π = 288π cm^3.
2. Área: A = 4π·6^2 = 4·36π = 144π cm^2.

### Resumo

- Área em unidades quadradas; volume em unidades cúbicas.
- Prisma e cilindro: V = (área da base)·(altura).
- Cone: um terço do cilindro de mesma base e altura.
- Esfera: V = (4/3)πr^3 e A = 4πr^2.
- Para capacidade: 1 dm^3 = 1 L e 1 cm^3 = 1 mL.

### Questões

**1. (Fácil, `espacial-01`)** Qual é o volume de um paralelepípedo com dimensões de 3 cm, 4 cm e 5 cm?

- A) 12 cm^3
- B) 47 cm^3
- C) 94 cm^3
- D) 60 cm^3 ✅

*Resolução:* V = a·b·c = 3·4·5 = 60 cm^3.

**2. (Fácil, `espacial-02`)** Um cubo tem aresta de 4 cm. Qual é a sua área total?

- A) 64 cm^2
- B) 16 cm^2
- C) 96 cm^2 ✅
- D) 48 cm^2

*Resolução:* O cubo tem 6 faces quadradas de área 4^2 = 16 cm^2. Área total: 6·16 = 96 cm^2.

**3. (Médio, `espacial-03`)** Um copo cilíndrico tem raio interno de 3 cm e altura interna de 10 cm. Usando π ≈ 3,14, qual é a capacidade aproximada do copo, em mililitros?

- A) 282,6 mL ✅
- B) 94,2 mL
- C) 188,4 mL
- D) 2.826 mL

*Resolução:* V = πr^2h = π·9·10 = 90π cm^3 ≈ 90·3,14 = 282,6 cm^3. Como 1 cm^3 = 1 mL, a capacidade é de cerca de 282,6 mL.

**4. (Médio, `espacial-04`)** Um cone reto tem raio da base de 6 cm e altura de 8 cm. Qual é o seu volume?

- A) 288π cm^3
- B) 96π cm^3 ✅
- C) 48π cm^3
- D) 60π cm^3

*Resolução:* V = (1/3)·πr^2h = (1/3)·π·36·8 = (1/3)·288π = 96π cm^3. (288π seria o volume do cilindro de mesma base e altura.)

**5. (Difícil, `espacial-05`)** Uma esfera maciça de raio 3 cm é derretida, e todo o material é usado para formar um cilindro com raio da base de 3 cm. Qual é a altura desse cilindro?

- A) 3 cm
- B) 12 cm
- C) 4 cm ✅
- D) 6 cm

*Resolução:* O volume se mantém. Esfera: (4/3)·π·3^3 = 36π cm^3. Cilindro: π·3^2·h = 9πh. Então 9πh = 36π → h = 4 cm.

## Trigonometria — 2º ano

**Objetivo:** Usar seno, cosseno e tangente no triângulo retângulo, converter graus em radianos e localizar ângulos e sinais no ciclo trigonométrico.

### Ângulos e medidas

A trigonometria relaciona os **ângulos** de um triângulo com as **medidas** dos seus lados. Com ela é possível calcular alturas e distâncias difíceis de medir diretamente, como a altura de um prédio a partir da sua sombra.

No triângulo retângulo, para um ângulo agudo θ, chamamos de **hipotenusa** o maior lado (oposto ao ângulo reto), de **cateto oposto** o lado em frente a θ e de **cateto adjacente** o lado que forma θ junto com a hipotenusa.

O **ciclo trigonométrico** é uma circunferência de raio 1 centrada na origem. Cada ângulo corresponde a um ponto (cos θ, sen θ), o que permite falar de seno e cosseno de ângulos maiores que 90° e de seus sinais.

### Conceitos e fórmulas

**No triângulo retângulo** (θ agudo)
- sen θ = cateto oposto / hipotenusa
- cos θ = cateto adjacente / hipotenusa
- tg θ = cateto oposto / cateto adjacente
- Teorema de Pitágoras: hipotenusa^2 = cateto^2 + cateto^2.

**Valores notáveis**
- 30°: sen = 1/2; cos = √3/2; tg = √3/3.
- 45°: sen = √2/2; cos = √2/2; tg = 1.
- 60°: sen = √3/2; cos = 1/2; tg = √3.

**Relações** (valem para qualquer ângulo)
- sen^2θ + cos^2θ = 1.
- tg θ = sen θ / cos θ, desde que cos θ ≠ 0.

**Radianos e ciclo**
- π rad = 180°. Para converter graus em radianos, multiplique por π/180.
- Sinais: 1º quadrante (0° a 90°) seno e cosseno positivos; 2º (90° a 180°) seno positivo e cosseno negativo; 3º (180° a 270°) ambos negativos; 4º (270° a 360°) seno negativo e cosseno positivo.

### Exemplo 1 — Altura de uma rampa

Uma rampa reta de 8 m de comprimento forma um ângulo de 30° com o chão. A que altura ela chega?

1. A rampa é a hipotenusa (8 m) e a altura é o cateto oposto ao ângulo de 30°.
2. sen 30° = altura / 8 → altura = 8·(1/2) = 4 m.
3. A distância horizontal é o cateto adjacente: 8·cos 30° = 8·√3/2 = 4√3 ≈ 6,93 m.

### Exemplo 2 — Usando a relação fundamental

Sabendo que θ é agudo e sen θ = 3/5, calcule cos θ e tg θ.

1. sen^2θ + cos^2θ = 1 → 9/25 + cos^2θ = 1 → cos^2θ = 16/25.
2. Como θ é agudo, o cosseno é positivo: cos θ = 4/5.
3. tg θ = sen θ / cos θ = (3/5) / (4/5) = 3/4.

### Exemplo 3 — Radianos e ciclo trigonométrico

Converta 150° para radianos e calcule sen 150°.

1. 150·π/180 = 5π/6 rad.
2. 150° está no 2º quadrante, onde o seno é positivo.
3. O ângulo que falta para 180° é 30°, então sen 150° = sen 30° = 1/2.

### Resumo

- sen = oposto/hipotenusa; cos = adjacente/hipotenusa; tg = oposto/adjacente.
- Decore os valores de 30°, 45° e 60°.
- sen^2θ + cos^2θ = 1 e tg θ = sen θ / cos θ.
- 180° = π rad; o quadrante define os sinais de seno e cosseno.

### Questões

**1. (Fácil, `trigonometria-01`)** Qual é o valor de cos 60°?

- A) √3/2
- B) 1/2 ✅
- C) √2/2
- D) 1

*Resolução:* cos 60° = 1/2 é um dos valores notáveis da trigonometria.

**2. (Fácil, `trigonometria-02`)** Quanto mede um ângulo de 120° em radianos?

- A) 2π/3 rad ✅
- B) 3π/4 rad
- C) π/3 rad
- D) 5π/6 rad

*Resolução:* 120·π/180 = 120π/180 = 2π/3 rad.

**3. (Médio, `trigonometria-03`)** Uma escada de 10 m está apoiada em uma parede vertical e forma um ângulo de 60° com o chão horizontal. Usando √3 ≈ 1,73, a que altura aproximada ela toca a parede?

- A) 5 m
- B) 5,77 m
- C) 17,3 m
- D) 8,65 m ✅

*Resolução:* A altura é o cateto oposto ao ângulo de 60° e a escada é a hipotenusa: altura = 10·sen 60° = 10·√3/2 = 5√3 ≈ 5·1,73 = 8,65 m.

**4. (Médio, `trigonometria-04`)** Os catetos de um triângulo retângulo medem 5 cm e 12 cm. Qual é o seno do ângulo oposto ao cateto de 5 cm?

- A) 12/13
- B) 5/12
- C) 5/13 ✅
- D) 12/5

*Resolução:* Pela relação de Pitágoras, a hipotenusa mede √(25 + 144) = √169 = 13 cm. Então sen = oposto/hipotenusa = 5/13.

**5. (Difícil, `trigonometria-05`)** Sabendo que cos x = −0,6 e que x é um ângulo do 2º quadrante, qual é o valor de tg x?

- A) −4/3 ✅
- B) 4/3
- C) −3/4
- D) −0,8

*Resolução:* sen^2x = 1 − 0,36 = 0,64, então sen x = ±0,8. No 2º quadrante o seno é positivo: sen x = 0,8. Logo, tg x = 0,8/(−0,6) = −4/3.

## Análise Combinatória e Probabilidade — 2º ano

**Objetivo:** Contar possibilidades com o princípio multiplicativo, permutações, arranjos e combinações, e calcular probabilidades simples, complementares e de eventos independentes.

### Contar sem listar tudo

A análise combinatória ensina a contar possibilidades sem precisar escrever todas elas. A pergunta central é: **a ordem dos elementos escolhidos importa?**

- Se a ordem importa (senhas, pódios, presidente e vice), usamos o princípio multiplicativo, permutações ou arranjos.
- Se a ordem não importa (comissões, duplas, grupos), usamos combinações.

A **probabilidade** mede a chance de algo acontecer, comparando os casos que nos interessam (favoráveis) com todos os casos possíveis. Ela usa a contagem para encontrar esses números.

### Conceitos e fórmulas

**Contagem**
- Princípio multiplicativo: se uma etapa tem m opções e outra, independente, tem n opções, as duas juntas têm m·n possibilidades.
- Fatorial (n natural): n! = n·(n − 1)·...·2·1, com 0! = 1.
- Permutação de n elementos distintos: P_n = n!.
- Permutação com repetição (elementos repetidos k_1, k_2, ... vezes): n! / (k_1!·k_2!·...).
- Arranjo (ordem importa, p ≤ n): A_(n,p) = n! / (n − p)!.
- Combinação (ordem não importa, p ≤ n): C_(n,p) = n! / (p!·(n − p)!).

**Probabilidade** (todos os resultados igualmente prováveis)
- P(A) = número de casos favoráveis / número de casos possíveis, com 0 ≤ P(A) ≤ 1.
- Evento complementar: P(não A) = 1 − P(A).
- Eventos independentes: P(A e B) = P(A)·P(B).

### Exemplo 1 — Senhas (ordem importa)

Quantas senhas de 3 dígitos podem ser formadas com os algarismos de 0 a 9?

1. Com repetição permitida: cada posição tem 10 opções → 10·10·10 = 1000 senhas.
2. Sem repetir algarismos: 10 opções, depois 9, depois 8 → 10·9·8 = 720 senhas.
3. O segundo caso é o arranjo A_(10,3) = 10!/7! = 720.

### Exemplo 2 — Comissão (ordem não importa)

De 6 alunos, quantas comissões de 3 pessoas podem ser formadas?

1. Trocar a ordem das pessoas não muda a comissão, então é combinação.
2. C_(6,3) = 6! / (3!·3!) = 720 / (6·6) = 20 comissões.

### Exemplo 3 — Probabilidade com dois dados

Dois dados comuns são lançados. Qual é a probabilidade de a soma ser 7?

1. Casos possíveis: 6·6 = 36 pares de resultados.
2. Casos favoráveis: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) → 6 pares.
3. P = 6/36 = 1/6.

### Resumo

- Pergunte sempre se a ordem importa: sim → arranjo/permutação; não → combinação.
- Princípio multiplicativo: multiplique as opções de cada etapa.
- P(A) = favoráveis / possíveis; "pelo menos um" costuma ser mais fácil pelo complementar: 1 − P(nenhum).

### Questões

**1. (Fácil, `combinatoria-01`)** Uma lanchonete oferece 4 tipos de pão e 3 tipos de recheio. Quantos sanduíches diferentes, com um pão e um recheio, podem ser montados?

- A) 7
- B) 24
- C) 12 ✅
- D) 64

*Resolução:* Pelo princípio multiplicativo: 4 opções de pão × 3 opções de recheio = 12 sanduíches.

**2. (Fácil, `combinatoria-02`)** Uma urna tem 5 bolas vermelhas e 3 bolas azuis, todas iguais ao tato. Sorteando uma bola ao acaso, qual é a probabilidade de ela ser azul?

- A) 3/5
- B) 5/8
- C) 1/3
- D) 3/8 ✅

*Resolução:* Há 8 bolas no total e 3 são azuis. P(azul) = 3/8.

**3. (Médio, `combinatoria-03`)** Quantos anagramas tem a palavra BANANA?

- A) 720
- B) 60 ✅
- C) 120
- D) 20

*Resolução:* São 6 letras com A repetido 3 vezes e N repetido 2 vezes: 6! / (3!·2!) = 720 / (6·2) = 60.

**4. (Médio, `combinatoria-04`)** Em uma turma de 8 alunos, quantas duplas diferentes podem ser formadas para um trabalho?

- A) 28 ✅
- B) 56
- C) 16
- D) 64

*Resolução:* Na dupla, a ordem não importa: C_(8,2) = 8! / (2!·6!) = (8·7)/2 = 28. (56 contaria cada dupla duas vezes.)

**5. (Difícil, `combinatoria-05`)** Uma moeda honesta é lançada 3 vezes. Qual é a probabilidade de sair cara pelo menos uma vez?

- A) 1/8
- B) 3/8
- C) 1/2
- D) 7/8 ✅

*Resolução:* Pelo complementar: a única forma de não sair cara é coroa nos 3 lançamentos, com probabilidade (1/2)^3 = 1/8. Então P(pelo menos uma cara) = 1 − 1/8 = 7/8.

## Geometria Analítica — 3º ano

**Objetivo:** Calcular distância e ponto médio entre pontos, determinar a equação de uma reta e identificar centro e raio de uma circunferência no plano cartesiano.

### Geometria com coordenadas

Na geometria analítica, cada ponto do plano é descrito por um par ordenado (x, y). Assim, problemas de geometria viram contas: a distância entre duas cidades em um mapa, a inclinação de uma rua ou o alcance de uma antena podem ser calculados com fórmulas.

- Uma **reta** é descrita por uma equação como y = 2x + 1: todos os pontos que satisfazem a equação estão na reta.
- O **coeficiente angular** mede a inclinação da reta: quanto y varia quando x aumenta 1 unidade.
- Uma **circunferência** é o conjunto de pontos que estão à mesma distância (o raio) de um ponto fixo (o centro).

### Conceitos e fórmulas

Considere A(x_A, y_A) e B(x_B, y_B).

**Pontos**
- Distância: d_(AB) = √((x_B − x_A)^2 + (y_B − y_A)^2).
- Ponto médio: M = ((x_A + x_B)/2, (y_A + y_B)/2).

**Retas**
- Coeficiente angular: m = (y_B − y_A) / (x_B − x_A), válido se x_A ≠ x_B. Retas verticais (x constante) não têm coeficiente angular.
- Reta que passa por (x_0, y_0) com coeficiente m: y − y_0 = m(x − x_0).
- Equação reduzida: y = mx + n, em que n é onde a reta corta o eixo y.
- Retas paralelas (não verticais) têm o mesmo m. Retas perpendiculares (nenhuma vertical) têm m_1·m_2 = −1.

**Circunferência**
- Centro C(a, b) e raio r > 0: (x − a)^2 + (y − b)^2 = r^2.
- Atenção aos sinais: (x + 1)^2 = (x − (−1))^2, então a = −1.

### Exemplo 1 — Distância, ponto médio e inclinação

Considere A(1, 2) e B(4, 6).

1. Distância: d = √((4 − 1)^2 + (6 − 2)^2) = √(9 + 16) = √25 = 5.
2. Ponto médio: M = ((1 + 4)/2, (2 + 6)/2) = (2,5; 4).
3. Coeficiente angular: m = (6 − 2)/(4 − 1) = 4/3.

### Exemplo 2 — Equação de uma reta

Encontre a equação da reta que passa por A(1, 3) e tem coeficiente angular 2. O ponto P(2, 5) pertence a ela?

1. y − 3 = 2(x − 1) → y − 3 = 2x − 2 → y = 2x + 1.
2. Testando P: para x = 2, y = 2·2 + 1 = 5. Como deu 5, P pertence à reta.

### Exemplo 3 — Circunferência

Escreva a equação da circunferência de centro (2, −1) e raio 3. O ponto (5, −1) está nela?

1. (x − 2)^2 + (y − (−1))^2 = 3^2 → (x − 2)^2 + (y + 1)^2 = 9.
2. Para (5, −1): (5 − 2)^2 + (−1 + 1)^2 = 9 + 0 = 9. O ponto pertence à circunferência.

### Resumo

- Distância vem de Pitágoras; ponto médio é a média das coordenadas.
- m = Δy/Δx mede a inclinação; y = mx + n é a forma reduzida.
- Paralelas: mesmo m. Perpendiculares: m_1·m_2 = −1.
- Circunferência: (x − a)^2 + (y − b)^2 = r^2; o centro aparece com os sinais trocados.

### Questões

**1. (Fácil, `analitica-01`)** Qual é a distância entre os pontos A(1, 1) e B(4, 5)?

- A) 5 ✅
- B) 7
- C) 25
- D) √7

*Resolução:* d = √((4 − 1)^2 + (5 − 1)^2) = √(9 + 16) = √25 = 5.

**2. (Fácil, `analitica-02`)** Qual é o ponto médio do segmento com extremidades A(−2, 4) e B(6, 0)?

- A) (4, 4)
- B) (2, 2) ✅
- C) (8, −4)
- D) (4, 2)

*Resolução:* M = ((−2 + 6)/2, (4 + 0)/2) = (4/2, 4/2) = (2, 2).

**3. (Médio, `analitica-03`)** Qual é a equação reduzida da reta que passa pelos pontos (0, 3) e (2, 7)?

- A) y = 3x + 2
- B) y = 2x + 7
- C) y = 2x + 3 ✅
- D) y = −2x + 3

*Resolução:* m = (7 − 3)/(2 − 0) = 2. A reta passa por (0, 3), então corta o eixo y em n = 3. Logo, y = 2x + 3. Conferindo: para x = 2, y = 7.

**4. (Médio, `analitica-04`)** Qual é o centro e o raio da circunferência (x + 1)^2 + (y − 4)^2 = 25?

- A) Centro (1, −4) e raio 5
- B) Centro (−1, 4) e raio 25
- C) Centro (1, 4) e raio 5
- D) Centro (−1, 4) e raio 5 ✅

*Resolução:* Comparando com (x − a)^2 + (y − b)^2 = r^2: x + 1 = x − (−1), então a = −1; b = 4; r^2 = 25, então r = 5.

**5. (Difícil, `analitica-05`)** Qual é o coeficiente angular de uma reta perpendicular à reta y = 3x − 2?

- A) 3
- B) −1/3 ✅
- C) −3
- D) 1/3

*Resolução:* A reta dada tem m_1 = 3. Para retas perpendiculares, m_1·m_2 = −1, então m_2 = −1/3.

## Estatística — 3º ano

**Objetivo:** Calcular e interpretar média (simples e ponderada), mediana e moda, e ler informações em tabelas de frequência e gráficos.

### Resumindo dados com poucos números

A estatística organiza e interpreta dados, como notas de uma turma, preços ou resultados de pesquisas.

As **medidas de tendência central** resumem um conjunto de dados em um único valor "típico":
- a **média** distribui o total igualmente entre os valores;
- a **mediana** é o valor do meio, depois de colocar os dados em ordem;
- a **moda** é o valor que aparece mais vezes.

A média é sensível a valores muito altos ou muito baixos; a mediana, não. Por isso, em salários ou preços de imóveis, a mediana muitas vezes representa melhor a situação típica.

**Tabelas de frequência** mostram quantas vezes cada valor aparece, e **gráficos** (barras, linhas e setores) ajudam a comparar e a ver tendências.

### Conceitos e fórmulas

- **Média aritmética**: soma de todos os valores ÷ quantidade de valores.
- **Média ponderada**: (x_1·p_1 + x_2·p_2 + ... + x_n·p_n) ÷ (p_1 + p_2 + ... + p_n), em que p são os pesos.
- **Mediana**: coloque os dados em ordem. Se a quantidade n for ímpar, é o valor na posição (n + 1)/2. Se n for par, é a média dos dois valores centrais.
- **Moda**: valor de maior frequência. Um conjunto pode ter uma moda, mais de uma (bimodal) ou nenhuma (amodal).
- **Frequência relativa**: frequência do valor ÷ total de dados (multiplique por 100 para obter a porcentagem).
- **Gráfico de setores**: o ângulo de cada fatia é a sua porcentagem de 360°.

### Exemplo 1 — Média, mediana e moda

Notas de um aluno: 5, 7, 7, 8, 9 e 6.

1. Média: (5 + 7 + 7 + 8 + 9 + 6)/6 = 42/6 = 7.
2. Mediana: em ordem, 5, 6, 7, 7, 8, 9. Como n = 6 é par, a mediana é (7 + 7)/2 = 7.
3. Moda: 7, que aparece duas vezes.

### Exemplo 2 — Média ponderada

A nota final de uma disciplina tem prova com peso 2 e trabalho com peso 1. Um aluno tirou 6 na prova e 9 no trabalho.

1. Multiplique cada nota pelo seu peso: 6·2 = 12 e 9·1 = 9.
2. Some e divida pela soma dos pesos: (12 + 9)/(2 + 1) = 21/3 = 7.
3. A nota final é 7. A média simples seria 7,5: a prova, com peso maior, "puxou" a nota para baixo.

### Exemplo 3 — Frequência e gráfico de setores

Em uma pesquisa com 40 alunos sobre o esporte preferido, 10 escolheram futebol.

1. Frequência relativa: 10/40 = 0,25 = 25%.
2. No gráfico de setores, a fatia de futebol tem 25% de 360° = 0,25·360° = 90°.

### Resumo

- Média = soma ÷ quantidade; na ponderada, cada valor conta conforme seu peso.
- Mediana: sempre ordene os dados antes; com quantidade par, faça a média dos dois centrais.
- Moda: o valor mais frequente.
- Porcentagem de um setor × 360° = ângulo da fatia.

### Questões

**1. (Fácil, `estatistica-01`)** Qual é a média aritmética dos valores 12, 15, 18 e 15?

- A) 16
- B) 15 ✅
- C) 60
- D) 18

*Resolução:* Soma: 12 + 15 + 18 + 15 = 60. Média: 60/4 = 15.

**2. (Fácil, `estatistica-02`)** Qual é a moda do conjunto de dados 3, 5, 5, 7, 8, 8, 8, 10?

- A) 5
- B) 7
- C) 8 ✅
- D) 6,75

*Resolução:* O valor 8 aparece três vezes, mais do que qualquer outro. (6,75 é a média, não a moda.)

**3. (Médio, `estatistica-03`)** Qual é a mediana dos valores 9, 2, 7, 4, 10 e 6?

- A) 7
- B) 6
- C) 8
- D) 6,5 ✅

*Resolução:* Em ordem: 2, 4, 6, 7, 9, 10. São 6 valores (quantidade par), então a mediana é a média dos dois centrais: (6 + 7)/2 = 6,5.

**4. (Médio, `estatistica-04`)** A nota final de uma disciplina é a média ponderada entre a prova (peso 3) e o trabalho (peso 2). Um aluno tirou 6,0 na prova e 8,5 no trabalho. Qual é a sua nota final?

- A) 7,0 ✅
- B) 7,25
- C) 7,5
- D) 6,8

*Resolução:* (6,0·3 + 8,5·2)/(3 + 2) = (18 + 17)/5 = 35/5 = 7,0. (7,25 seria a média simples, que ignora os pesos.)

**5. (Difícil, `estatistica-05`)** A média de 5 números é 8. Ao retirar um desses números, a média dos 4 restantes passa a ser 7. Qual número foi retirado?

- A) 8
- B) 12 ✅
- C) 1
- D) 15

*Resolução:* A soma dos 5 números é 5·8 = 40. A soma dos 4 restantes é 4·7 = 28. O número retirado é 40 − 28 = 12.

## Matemática Financeira — 3º ano

**Objetivo:** Calcular porcentagens, aumentos e descontos e comparar juros simples e compostos, usando taxa e período na mesma unidade de tempo.

### Dinheiro ao longo do tempo

A matemática financeira ajuda a decidir entre pagar à vista ou parcelado, entender descontos e saber quanto uma dívida ou investimento cresce.

**Porcentagem** é uma fração com denominador 100: 15% = 15/100 = 0,15.

**Juros** são o valor pago pelo uso de um dinheiro durante um tempo:
- nos **juros simples**, os juros de cada período são sempre calculados sobre o valor inicial (capital);
- nos **juros compostos**, os juros de cada período são somados ao saldo e passam a render juros também ("juros sobre juros").

Por isso, com a mesma taxa, os juros compostos crescem mais rápido com o tempo. A maioria dos financiamentos, cartões de crédito e investimentos usa juros compostos.

### Conceitos e fórmulas

Notação: C = capital (valor inicial), i = taxa de juros na forma decimal, t = número de períodos, J = juros, M = montante (valor final).

**Condição essencial:** a taxa e o tempo precisam estar na mesma unidade. Taxa ao mês → tempo em meses; taxa ao ano → tempo em anos.

**Porcentagem**
- p% de V = (p/100)·V.
- Aumento de p%: V·(1 + p/100). Desconto de p%: V·(1 − p/100).
- Aumentos e descontos sucessivos: multiplique os fatores (eles não se somam).

**Juros simples**
- J = C·i·t
- M = C + J = C·(1 + i·t)

**Juros compostos**
- M = C·(1 + i)^t
- J = M − C

### Exemplo 1 — Desconto à vista

Um celular custa R$ 1.200,00 e tem 15% de desconto no pagamento à vista. Qual é o preço à vista?

1. Fator de desconto: 1 − 0,15 = 0,85.
2. Preço: 1200·0,85 = 1020. O preço à vista é R$ 1.020,00 (economia de R$ 180,00).

### Exemplo 2 — Juros simples

R$ 2.000,00 são aplicados a juros simples de 1,5% ao mês durante 8 meses. Qual é o montante?

1. Taxa e tempo estão em meses: i = 0,015 e t = 8.
2. J = 2000·0,015·8 = 240.
3. M = 2000 + 240 = 2240. O montante é R$ 2.240,00.

### Exemplo 3 — Juros compostos × juros simples

R$ 1.000,00 são aplicados a 2% ao mês durante 3 meses. Compare juros compostos e simples.

1. Compostos: M = 1000·(1,02)^3 = 1000·1,061208 ≈ 1061,21. Montante de R$ 1.061,21.
2. Simples: M = 1000·(1 + 0,02·3) = 1000·1,06 = 1060. Montante de R$ 1.060,00.
3. Nos compostos, o montante é maior porque os juros de cada mês também rendem juros.

### Resumo

- Transforme a porcentagem em decimal antes de calcular.
- Aumento: multiplique por (1 + taxa); desconto: por (1 − taxa).
- Simples: M = C·(1 + i·t). Compostos: M = C·(1 + i)^t.
- Taxa e tempo sempre na mesma unidade.

### Questões

**1. (Fácil, `financeira-01`)** Quanto é 35% de R$ 240,00?

- A) R$ 35,00
- B) R$ 84,00 ✅
- C) R$ 8,40
- D) R$ 156,00

*Resolução:* 35% de 240 = 0,35·240 = 84. Resposta: R$ 84,00. (R$ 156,00 é o que sobra após tirar 35%.)

**2. (Fácil, `financeira-02`)** Uma conta de R$ 150,00 foi paga com atraso e teve acréscimo de 4%. Qual foi o valor pago?

- A) R$ 154,00
- B) R$ 144,00
- C) R$ 156,00 ✅
- D) R$ 210,00

*Resolução:* Aumento de 4%: 150·1,04 = 156. O valor pago foi R$ 156,00.

**3. (Médio, `financeira-03`)** Um capital de R$ 800,00 foi aplicado a juros simples de 2% ao mês durante 6 meses. Qual é o montante ao final desse período?

- A) R$ 896,00 ✅
- B) R$ 96,00
- C) R$ 900,93
- D) R$ 816,00

*Resolução:* J = C·i·t = 800·0,02·6 = 96. M = 800 + 96 = R$ 896,00. (R$ 96,00 são só os juros; R$ 900,93 seria o montante com juros compostos.)

**4. (Médio, `financeira-04`)** Qual é o montante de R$ 5.000,00 aplicados a juros compostos de 10% ao ano durante 3 anos?

- A) R$ 6.500,00
- B) R$ 5.500,00
- C) R$ 6.050,00
- D) R$ 6.655,00 ✅

*Resolução:* M = 5000·(1,10)^3 = 5000·1,331 = 6655. O montante é R$ 6.655,00. (R$ 6.500,00 seria com juros simples.)

**5. (Difícil, `financeira-05`)** Um produto custava R$ 200,00. Ele teve um aumento de 25% e, depois, um desconto de 20% sobre o novo preço. Qual é o preço final?

- A) R$ 210,00
- B) R$ 190,00
- C) R$ 200,00 ✅
- D) R$ 205,00

*Resolução:* Depois do aumento: 200·1,25 = 250. Depois do desconto: 250·0,80 = 200. Os fatores se multiplicam (1,25·0,80 = 1), então o preço final volta a R$ 200,00.
