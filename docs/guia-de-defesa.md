# Guia de defesa — entendendo a Simple Education

Este guia explica o projeto em linguagem simples, para você conseguir responder às perguntas da banca.

---

## 1. A ideia em uma frase

> "É um site onde o estudante do Ensino Médio estuda Matemática por ano, resolve exercícios corrigidos na hora e acompanha a própria evolução."

## 2. As três partes do sistema (analogia do restaurante)

| Parte | Analogia | No projeto | Tecnologia |
|---|---|---|---|
| **Frontend** | O salão e o cardápio: o que o cliente vê e onde ele faz o pedido | As telas: login, aulas, exercícios, progresso | React + Vite |
| **Backend** | A cozinha: recebe o pedido, segue as regras e prepara a resposta | A API: confere quem está logado, corrige respostas, calcula notas | Node.js + Express |
| **Banco de dados** | A despensa: onde tudo fica guardado | Usuários, aulas, questões, tentativas, respostas | MySQL |

Regra de ouro: **o cliente não entra na despensa.** O navegador nunca acessa o banco diretamente; ele sempre pede ao backend.

## 3. O caminho de uma requisição (exemplo: responder uma questão)

1. **Clique.** O aluno escolhe a alternativa B e clica em "Responder" (`ExercisePage.jsx`). O botão fica desabilitado para evitar clique duplo.
2. **Pedido.** O `client.js` envia `POST /api/attempts/12/answers` com `{ "questionId": 36, "optionId": 142 }`. O navegador manda junto, automaticamente, o cookie de sessão.
3. **Portaria.** No Express, os middlewares verificam:
   - se a requisição veio do próprio site (origem);
   - quem é o aluno, pela sessão gravada no banco (`req.user`).
4. **Rota.** `routes/attempts.js` confere se os números são válidos e chama o serviço.
5. **Regra de negócio.** `attemptService.js` verifica se a tentativa é desse aluno e se ainda está aberta, se a questão faz parte da tentativa e se a alternativa pertence à questão. Depois compara com o gabarito guardado no banco.
6. **Banco.** Grava a resposta e soma o acerto em uma **transação** (ou grava as duas coisas, ou nenhuma).
7. **Resposta.** O servidor devolve JSON: acertou ou não, qual era a correta e a explicação.
8. **Tela.** O React pinta a alternativa de verde ou vermelho e mostra a explicação.

```
Clique → client.js → [Express: origem → sessão → rota → serviço] → MySQL
                                                               ↓
Tela atualizada ← JSON {isCorrect, correctLetter, explanation} ←┘
```

## 4. Por que estas escolhas?

| Escolha | Motivo | Se perguntarem "por que não…?" |
|---|---|---|
| **JavaScript nas duas pontas** | Uma linguagem só para o frontend e o backend; aceita pelo curso | "Usar a mesma linguagem reduziu o tempo de aprendizado e a troca de contexto." |
| **React** | Telas montadas com componentes reutilizáveis (botão, campo, card). A tela se atualiza sozinha quando os dados mudam | "Sem um framework, eu teria que atualizar o HTML manualmente a cada mudança." |
| **Vite** | Inicia rápido em desenvolvimento e gera um build otimizado | — |
| **Express** | Simples, muito usado e fácil de organizar em rotas e middlewares | — |
| **MySQL** | Banco relacional exigido pelo curso. Os dados têm relações claras (usuário → tentativas → respostas) e chaves estrangeiras garantem a consistência | "Um banco relacional com chaves estrangeiras impede, por exemplo, uma resposta sem tentativa." |
| **Migrations** | O banco é criado por arquivos versionados, igual em qualquer computador | "Sem migrations, cada pessoa criaria as tabelas na mão e poderia esquecer algo." |
| **Correção no servidor** | Se o gabarito fosse para o navegador, qualquer aluno poderia vê-lo pelo F12 | "A regra fica onde o usuário não consegue mexer." |
| **Sessão no banco + cookie HttpOnly** | O JavaScript da página não consegue ler o cookie, e o logout invalida a sessão de verdade | "Guardar o login no localStorage permitiria que um script malicioso o roubasse." |
| **Hash da senha (scrypt)** | Nem quem tem acesso ao banco descobre a senha | "Criptografia comum pode ser desfeita; hash não." |
| **SQL parametrizado** | Impede SQL Injection | "Juntar texto digitado no SQL permitiria que alguém executasse comandos no banco." |
| **Testes automatizados** | Garantem que as regras continuam certas depois de cada mudança; também conferem as contas das 45 questões | — |

## 5. Perguntas prováveis da banca

**"Como você garante que o aluno não vê a resposta antes?"**
O servidor envia as questões sem o campo de resposta correta. A alternativa certa e a explicação só são enviadas depois que o aluno responde aquela questão. Isso está em `attemptService.js` e é verificado por testes.

**"E se o aluno alterar a requisição e disser que acertou?"**
O servidor ignora. Ele recebe só a alternativa escolhida e compara com o gabarito do banco. A nota é sempre calculada no servidor.

**"Um aluno consegue ver o progresso de outro?"**
Não. O aluno é identificado pela sessão, nunca por um número enviado pelo navegador. Todas as consultas filtram pelo usuário da sessão; se ele tentar abrir a tentativa de outra pessoa, recebe "não encontrada".

**"Onde fica a senha?"**
No banco fica só o hash scrypt com um salt aleatório. O login calcula o hash da senha digitada e compara.

**"O que acontece quando o aluno sai?"**
A sessão é apagada do banco e o cookie é removido. Mesmo que alguém tenha copiado o cookie, ele não funciona mais.

**"Qual a diferença entre concluir a aula e concluir o assunto?"**
Concluir a aula é marcar que estudou. O assunto só fica "Concluído" quando, além disso, o aluno acerta pelo menos 70% em uma tentativa.

**"Se você mudar uma questão, o histórico dos alunos muda?"**
Não. Cada tentativa guarda quais questões o aluno recebeu (`attempt_questions`). Se uma questão já respondida mudar, a carga cria uma nova e arquiva a antiga.

**"Como você testou?"**
Com testes automatizados da API (banco de testes separado), um teste que recalcula as 45 respostas e uma validação no navegador com 18 fluxos, incluindo celular, dois alunos e servidor desligado.

**"O que faltou ou o que você faria depois?"**
Recuperação de senha, área administrativa para editar o conteúdo, mais matérias e publicação online com HTTPS.

## 6. Arquivos para mostrar se pedirem o código

| Pergunta | Arquivo |
|---|---|
| Onde estão as telas? | `frontend/src/pages/` |
| Como o front fala com o back? | `frontend/src/api/client.js` |
| Como as páginas são protegidas? | `frontend/src/components/RouteGuards.jsx` |
| Quais rotas a API tem? | `backend/src/app.js` e `backend/src/routes/` |
| Como funciona o login? | `backend/src/routes/auth.js`, `backend/src/utils/password.js`, `backend/src/services/sessionService.js` |
| Como a questão é corrigida? | `backend/src/services/attemptService.js` (função `answerQuestion`) |
| Como o progresso é calculado? | `backend/src/services/progressService.js` (comentário no topo) |
| Como o banco é criado? | `backend/src/db/migrations/` |
| Onde está o conteúdo? | `backend/src/db/seed/content/` |
| Como os testes funcionam? | `backend/tests/` |

## 7. Glossário rápido

| Termo | Significado |
|---|---|
| API | Conjunto de endereços (rotas) que o frontend chama para pedir ou enviar dados |
| Endpoint | Um desses endereços, ex.: `GET /api/progress` |
| JSON | Formato de texto usado para trocar dados entre front e back |
| Middleware | Função que roda antes da rota (ex.: verificar a sessão) |
| Sessão | Registro no servidor de que o usuário está logado |
| Cookie HttpOnly | Cookie que o JavaScript da página não consegue ler |
| Hash | "Impressão digital" irreversível de um texto (usada para senhas) |
| Migration | Arquivo que cria ou altera tabelas, aplicado em ordem |
| Seed (carga inicial) | Dados iniciais do sistema (aulas e questões) |
| Transação | Grupo de operações no banco que acontece por inteiro ou não acontece |
| Chave estrangeira | Ligação entre tabelas que impede dados "órfãos" |
| SQL Injection | Ataque que insere comandos SQL em campos de texto; evitado com SQL parametrizado |
| CSRF | Ataque em que outro site tenta fazer ações em seu nome; evitado com verificação de origem e SameSite |
