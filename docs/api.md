# API do Simple Education

Base: `http://localhost:3001/api` (em desenvolvimento, o frontend acessa pelo proxy do Vite em `http://localhost:5173/api`).

## Convenções

- Corpo das requisições e respostas em JSON (`Content-Type: application/json`).
- **Autenticação por cookie de sessão** `se_session` (HttpOnly, SameSite=Lax; `Secure` em produção). O frontend deve usar `fetch(url, { credentials: 'include' })`. O aluno é sempre identificado pela sessão: nenhuma rota aceita id de aluno.
- Rotas marcadas com 🔒 exigem login (sem sessão → `401`).
- Datas em ISO 8601, UTC (ex.: `2026-11-17T00:36:47Z`).
- Erros sempre neste formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Verifique os campos destacados.", "details": { "email": "Informe um e-mail válido." } } }
```

| Status | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` | Dados inválidos ou JSON malformado |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS` | Sem sessão / login incorreto |
| 403 | `FORBIDDEN` | Requisição de alteração vinda de origem não permitida |
| 404 | `NOT_FOUND` | Recurso inexistente **ou de outro aluno** |
| 409 | `CONFLICT`, `ALREADY_ANSWERED`, `ATTEMPT_FINISHED`, `NO_QUESTIONS` | Conflito de estado |
| 413 | `PAYLOAD_TOO_LARGE` | Corpo maior que 20 KB |
| 429 | `TOO_MANY_ATTEMPTS` | Excesso de logins com erro (cabeçalho `Retry-After`) |
| 500 | `INTERNAL_ERROR` | Erro inesperado (detalhes só no log do servidor) |

## Definições de progresso

| Termo | Significado |
|---|---|
| **Aula concluída** | O aluno marcou, na página do assunto, que estudou o conteúdo (`PUT /topics/:slug/completion`). Independe dos exercícios. |
| **Exercício respondido** | Existe uma resposta registrada para a questão em uma tentativa. |
| **Exercício acertado** | A resposta registrada é a alternativa correta (verificado no servidor). |
| **Tentativa finalizada** | O aluno encerrou a tentativa. Nota = acertos ÷ total de questões (não respondidas contam como erro). Só tentativas finalizadas têm nota. |
| **Assunto dominado** (`mastered`) | Melhor nota entre as tentativas finalizadas ≥ 70%. |
| **Status do assunto** | `not_started` (nada feito) · `in_progress` (qualquer atividade) · `completed` (aula concluída **e** assunto dominado). |

O limite de 70% é uma regra do projeto (`MASTERY_THRESHOLD` em `progressService.js`).

Objeto `progress` usado em várias respostas:

```json
{
  "status": "in_progress",
  "lessonCompleted": true,
  "lessonCompletedAt": "2026-11-17T00:40:00Z",
  "attemptsStarted": 2,
  "attemptsFinished": 1,
  "questionsAnswered": 5,
  "correctAnswers": 3,
  "bestScore": 60,
  "lastScore": 60,
  "mastered": false,
  "lastActivityAt": "2026-11-17T00:45:10Z"
}
```

---

## Saúde

### `GET /health`
```json
{ "status": "ok" }
```

## Autenticação

### `POST /auth/register`
Cadastra o aluno e já inicia a sessão (define o cookie).

```json
{ "name": "Ana Souza", "email": "Ana@Example.com", "password": "senhaSegura123", "schoolYear": 2 }
```
Regras: nome com 2 a 80 caracteres; e-mail válido (salvo em minúsculas, único); senha com 8 a 72 caracteres; `schoolYear` **opcional**: 1, 2, 3 ou `null` (a plataforma é aberta a qualquer pessoa, estudante ou não).

`201`
```json
{ "user": { "id": 1, "name": "Ana Souza", "email": "ana@example.com", "schoolYear": 2 } }
```
Erros: `400` (detalhes por campo), `409` (e-mail já cadastrado).

### `POST /auth/login`
```json
{ "email": "ana@example.com", "password": "senhaSegura123" }
```
`200` → `{ "user": { ... } }` e cookie definido.
`401` → `"E-mail ou senha inválidos."` (mesma mensagem para e-mail inexistente e senha errada).
`429` → após 5 erros em 15 minutos para o mesmo IP + e-mail (configurável no `.env`).

### `POST /auth/logout`
Apaga a sessão no banco e o cookie. `204` sem corpo.

### `GET /auth/session`
Consulta pública da sessão, sempre `200`. Usada pelo frontend ao abrir a página.
`{ "user": null }` (sem login) ou `{ "user": { "id": 1, "name": "Ana Souza", "email": "ana@example.com", "schoolYear": 2 } }`

### `GET /auth/me` 🔒
`200` → `{ "user": { "id": 1, "name": "Ana Souza", "email": "ana@example.com", "schoolYear": 2 } }`

## Perfil

### `PATCH /users/me` 🔒
Altera nome e/ou ano escolar do aluno logado (`schoolYear: null` remove o ano). Qualquer outro campo (id, email, password…) é recusado com `400`.

```json
{ "name": "Ana Clara", "schoolYear": 3 }
```
`200` → `{ "user": { "id": 1, "name": "Ana Clara", "email": "ana@example.com", "schoolYear": 3 } }`

## Conteúdos

### `GET /subjects` 🔒
Cards da página inicial.
```json
{ "subjects": [ { "slug": "matematica", "name": "Matemática", "description": "Conteúdos do 1º, 2º e 3º ano do Ensino Médio.", "topicCount": 9, "topicsCompleted": 0 } ] }
```

### `GET /subjects/:slug` 🔒
Tela "Conteúdos": assuntos agrupados por ano.
```json
{
  "subject": {
    "slug": "matematica", "name": "Matemática", "description": "...",
    "years": [
      { "schoolYear": 1, "topics": [
        { "slug": "funcoes-1-e-2-grau", "title": "Funções (1º e 2º grau)",
          "summary": "Estudo de gráficos, raízes e vértices de parábolas.",
          "schoolYear": 1, "subject": { "slug": "matematica", "name": "Matemática" },
          "questionCount": 5, "progress": { "status": "not_started", "...": "..." } }
      ] },
      { "schoolYear": 2, "topics": [ "..." ] },
      { "schoolYear": 3, "topics": [ "..." ] }
    ]
  }
}
```

### `GET /topics?year=1&subject=matematica` 🔒
Filtros opcionais. `year` inválido → `400`. Resposta: `{ "topics": [ ...mesmo formato acima ] }`.

### `GET /topics/:slug` 🔒
Aula (página de estudo) com objetivo de aprendizagem e seções. **Não contém questões nem gabarito.**
Tipos de seção (`kind`): `explicacao`, `formulas`, `exemplo` (pelo menos 2 por aula) e `resumo`.
```json
{
  "topic": {
    "slug": "trigonometria", "title": "Trigonometria", "summary": "...", "schoolYear": 2,
    "subject": { "slug": "matematica", "name": "Matemática" }, "questionCount": 5,
    "progress": { "...": "..." },
    "objective": "Usar seno, cosseno e tangente no triângulo retângulo...",
    "sections": [
      { "kind": "explicacao", "title": "Ângulos e medidas", "body": "A trigonometria relaciona..." },
      { "kind": "formulas", "title": "Conceitos e fórmulas", "body": "**No triângulo retângulo** ..." },
      { "kind": "exemplo", "title": "Exemplo 1 — Altura de uma rampa", "body": "..." },
      { "kind": "exemplo", "title": "Exemplo 2 — Usando a relação fundamental", "body": "..." },
      { "kind": "resumo", "title": "Resumo", "body": "..." }
    ]
  }
}
```
Formato do texto (`body`, `statement`, `text`, `explanation`): texto simples com marcações convertidas pelo frontend — `x^{2}` (expoente), `a_{n}` (índice), `**texto**` (negrito), linhas `- ` (lista) e `1. ` (lista numerada).

### `PUT /topics/:slug/completion` 🔒 · `DELETE /topics/:slug/completion` 🔒
Marca/desmarca a aula como concluída (idempotente). Resposta: `{ "progress": { ... } }`.

### `GET /search?q=funcao` 🔒
Busca em título, resumo e texto das aulas, ignorando acentos e maiúsculas. Todas as palavras precisam aparecer. `q` com 2 a 100 caracteres (senão `400`). Assuntos com a busca no título vêm primeiro.
```json
{ "query": "funcao", "total": 2, "results": [ { "slug": "funcoes-1-e-2-grau", "title": "Funções (1º e 2º grau)", "...": "..." } ] }
```

## Exercícios

### `POST /topics/:slug/attempts` 🔒
Inicia uma **nova** tentativa (tentativas anteriores ficam no histórico) com as 5 questões ativas do assunto, registradas em `attempt_questions`. As questões vêm **sem** gabarito e **sem** explicação; cada uma tem 4 alternativas (A–D) e o nível de dificuldade (`facil`, `medio`, `dificil`).

`201`
```json
{
  "attempt": {
    "id": 7, "topic": { "slug": "estatistica", "title": "Estatística", "schoolYear": 3 },
    "status": "in_progress", "startedAt": "2026-11-17T00:36:47Z", "finishedAt": null,
    "totalQuestions": 5, "answered": 0, "correct": 0, "wrong": 0, "unanswered": 5,
    "scorePercent": null, "mastered": null
  },
  "questions": [
    { "id": 36, "position": 1, "difficulty": "facil", "statement": "Qual é a média aritmética dos valores 12, 15, 18 e 15?",
      "options": [ { "id": 141, "letter": "A", "text": "16" }, { "id": 142, "letter": "B", "text": "15" }, { "id": 143, "letter": "C", "text": "60" }, { "id": 144, "letter": "D", "text": "18" } ] }
  ]
}
```

### `POST /attempts/:id/answers` 🔒
Envia **apenas** a alternativa escolhida; a correção é feita no servidor. Campos como `isCorrect` ou `score` enviados pelo frontend são ignorados.

```json
{ "questionId": 36, "optionId": 141 }
```
`201`
```json
{
  "questionId": 36, "selectedOptionId": 141, "isCorrect": false,
  "correctOptionId": 142, "correctLetter": "B",
  "explanation": "Soma: 12 + 15 + 18 + 15 = 60. Média: 60/4 = 15.",
  "attempt": { "id": 7, "answered": 1, "correct": 0, "wrong": 1, "unanswered": 4, "...": "..." }
}
```
Erros: `400` (questão que não foi entregue nesta tentativa ou alternativa de outra questão), `404` (tentativa inexistente ou de outro aluno), `409 ALREADY_ANSWERED`, `409 ATTEMPT_FINISHED`.

### `POST /attempts/:id/finish` 🔒
Encerra a tentativa e calcula a nota. Chamar de novo devolve o mesmo resultado.
```json
{ "attempt": { "id": 7, "status": "finished", "finishedAt": "2026-11-17T00:40:12Z", "totalQuestions": 5, "answered": 5, "correct": 4, "wrong": 1, "unanswered": 0, "scorePercent": 80, "mastered": true, "...": "..." } }
```

### `GET /attempts/:id` 🔒
Detalhe da tentativa. Cada questão traz `answer: null` se não foi respondida (sem gabarito), ou:
```json
{ "answer": { "selectedOptionId": 176, "isCorrect": false, "correctOptionId": 178, "correctLetter": "C", "explanation": "...", "answeredAt": "2026-11-17T00:37:02Z" } }
```

### `GET /attempts?topic=estatistica&limit=20&offset=0` 🔒
Histórico do aluno, do mais recente para o mais antigo. `limit` de 1 a 50.
```json
{ "total": 2, "limit": 20, "offset": 0, "items": [ { "id": 8, "status": "finished", "scorePercent": 100, "...": "..." } ] }
```

## Progresso

### `GET /progress` 🔒
```json
{
  "masteryThreshold": 70,
  "totals": { "topicsTotal": 9, "lessonsCompleted": 2, "topicsMastered": 1, "topicsCompleted": 1,
              "attemptsFinished": 2, "questionsAnswered": 10, "correctAnswers": 7, "wrongAnswers": 3, "accuracy": 70 },
  "byYear": [ { "schoolYear": 1, "topicsTotal": 3, "...": "..." }, { "schoolYear": 2, "...": "..." }, { "schoolYear": 3, "...": "..." } ],
  "topics": [ { "topic": { "slug": "funcoes-1-e-2-grau", "title": "Funções (1º e 2º grau)", "schoolYear": 1, "subject": { "slug": "matematica", "name": "Matemática" } }, "progress": { "...": "..." } } ],
  "continueStudying": { "slug": "trigonometria", "title": "Trigonometria", "schoolYear": 2, "subject": { "...": "..." } }
}
```
`accuracy` = acertos ÷ questões respondidas (em %), `null` se nada foi respondido. `continueStudying` = assunto em andamento com atividade mais recente (ou `null`).
