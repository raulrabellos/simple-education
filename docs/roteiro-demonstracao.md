# Roteiro de demonstração (≈ 5 minutos)

## Antes da apresentação (não conta no tempo)

1. Ligue o MySQL (XAMPP: **Start** no MySQL; Workbench/MySQL Server: o serviço do MySQL já liga com o Windows).
2. Na pasta do projeto, rode:
   ```bash
   npm run db:reset        # banco limpo, sem usuários
   npm run iniciar         # confere tudo, gera o site e inicia o servidor
   ```
3. Abra **http://localhost:3001** no navegador, em tela cheia.
4. Deixe abertos no editor de código: `frontend/src/api/client.js`, `backend/src/routes/attempts.js` e `backend/src/services/attemptService.js`.
5. Tenha à mão um e-mail fictício para o cadastro (ex.: `aluno.demo@exemplo.com`, senha `Demo12345`).

> Dica: faça um ensaio completo antes. Se algo der errado ao vivo, `npm run db:reset` e recomece.

---

## Roteiro

| Tempo | O que fazer na tela | O que falar |
|---|---|---|
| **0:00 – 0:30** | Mostre a tela de login. Digite o endereço `/progresso` na barra do navegador → volta para o login. | "A Simple Education é uma plataforma de estudo de Matemática para o Ensino Médio. As páginas internas são protegidas: sem login, o sistema leva para a tela de entrada." |
| **0:30 – 1:15** | **Cadastro:** clique em "Cadastre-se" → clique em "Criar conta" vazio (aparecem os avisos) → preencha nome, e-mail, senha, confirmação e escolha **2º ano** → "Criar conta". | "Os campos são validados no navegador e de novo no servidor. A senha é guardada como hash, nunca em texto. O ano escolar é opcional porque a plataforma é aberta a todos." |
| **1:15 – 1:45** | **Página inicial:** aponte "Seja bem-vindo, {nome}!" e "Olá, {nome}" no menu. **Sair** e **entrar** de novo com uma senha errada (mensagem) e depois com a certa. | "Esse nome vem do banco de dados. Com a senha errada aparece uma mensagem genérica, que não revela se o e-mail existe." |
| **1:45 – 2:15** | **Conteúdos:** clique no card **Matemática** → mostre 1º, 2º e 3º ano e a etiqueta "Seu ano". Use a **pesquisa**: digite `juros`. | "Os conteúdos seguem as telas do projeto: três assuntos por ano. A pesquisa ignora acentos e maiúsculas." |
| **2:15 – 2:50** | **Aula:** abra **Trigonometria**. Role mostrando objetivo, explicação, fórmulas, os exemplos resolvidos e o resumo. Clique em **"Marcar aula como concluída"**. | "Cada aula tem objetivo, explicação, fórmulas com as condições de uso, três exemplos passo a passo e um resumo." |
| **2:50 – 3:40** | **Exercícios:** "Praticar exercícios" → "Começar". Responda **uma certa** e **uma errada**, mostrando a explicação e a alternativa correta destacada. Clique em **"Finalizar agora"**. | "A correção acontece no servidor: o navegador não recebe o gabarito antes da resposta. Depois de responder, aparece a explicação. A nota também é calculada no servidor." |
| **3:40 – 4:05** | **Progresso:** "Meu progresso" → números gerais, progresso por ano, tabela por assunto e histórico → "Revisar". | "Aqui o aluno vê as aulas concluídas, os exercícios respondidos e a taxa de acertos. Refazer os exercícios cria uma nova tentativa sem apagar as anteriores." |
| **4:05 – 4:25** | **Configurações:** mude o nome e o ano → "Salvar alterações" → o menu atualiza. **Sair** → mensagem "Você saiu da sua conta". | "Ao sair, a sessão é apagada no servidor, então o cookie antigo não funciona mais." |
| **4:25 – 5:00** | **Como funciona por dentro:** mostre o diagrama de [documentacao-tecnica.md](documentacao-tecnica.md#2-arquitetura) ou abra `client.js` → `routes/attempts.js` → `attemptService.js`. | "O React chama a API pelo `client.js`. O Express confere a sessão, a rota chama o serviço, o serviço consulta o MySQL com SQL parametrizado e devolve JSON. O navegador nunca fala direto com o banco." |

---

## Se sobrar tempo ou a banca pedir

- **Celular:** F12 → modo dispositivo (ícone de celular) → mostre o menu ☰.
- **Testes:** no terminal, `npm test` (o MySQL precisa estar ligado).
- **Banco:** abra o phpMyAdmin/Workbench e mostre as tabelas `users`, `attempts` e `attempt_answers` com os dados da demonstração (a senha aparece como hash).
- **Segurança:** em outra aba anônima, tente abrir `http://localhost:3001/api/progress` → `{"error": ... "UNAUTHORIZED"}`.

## Plano B

| Problema ao vivo | O que fazer |
|---|---|
| "O servidor está indisponível" | O terminal do servidor foi fechado: rode `npm run iniciar` e clique em "Tentar novamente" |
| Item com ✖ ao rodar `npm run iniciar` | Siga a solução que aparece embaixo do ✖ (por exemplo, ligar o MySQL no XAMPP) e rode `npm run iniciar` de novo |
| "Muitas tentativas" no login | Reinicie o servidor (Ctrl+C e `npm run iniciar`) |
| Página em branco | Rode `npm run iniciar` (ele gera o build) |
