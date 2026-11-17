# Relatório de validação — Simple Education

Data: 17/11/2026. Ambiente: Linux, Node.js 22, MySQL 8.0.46 (e MariaDB 10.11 para os testes do backend), Chromium (Playwright).

**Legenda:** ✅ aprovado · ❌ falhou · ⏸️ não executado

## Como foi feito

1. O pacote entregue (`simple-education.zip`) foi descompactado em uma pasta limpa e o README foi seguido: `npm install`, `.env`, `db:migrate`, `db:seed`, `db:check`, `build`, `test`.
2. Os bancos `simple_education` e `simple_education_test` foram apagados antes da execução.
3. Um script de ponta a ponta (`docs/validacao/validate.cjs`) dirigiu um navegador real contra o backend real, com monitoramento de console, de todas as requisições e do conteúdo de todas as respostas da API.
4. Os resultados no navegador foram comparados com consultas diretas ao MySQL.
5. A validação completa foi executada **3 vezes seguidas, com 22/22 verificações aprovadas em todas**, depois das correções.

## Resultados

| # | Fluxo verificado | Forma de verificação | Resultado observado | Pendência |
|---|---|---|---|---|
| 1 | Preparação a partir de banco vazio | Bancos apagados; README seguido em pasta limpa; conferência no MySQL | ✅ 3 migrations aplicadas, 9 aulas e 45 questões; `db:check` sem problemas; 0 usuários | — |
| 2 | Cadastro de aluno | Formulário no navegador + consulta ao banco | ✅ Conta criada, redireciona ao início com "Seja bem-vindo, Ana!"; senha gravada como hash | — |
| 3 | E-mail duplicado e entradas inválidas | Formulário + chamada direta à API com dados inválidos | ✅ Mensagens por campo em português; e-mail repetido (mesmo em maiúsculas) → 409; API → 400 com erro por campo; nenhum registro extra | — |
| 4 | Login correto e senha incorreta | Senha errada e depois correta | ✅ Senha errada: "E-mail ou senha inválidos." e continua no login; correta entra | — |
| 5 | Rotas privadas sem autenticação | 6 rotas sem cookie + 4 chamadas diretas à API | ✅ Todas redirecionam para /login; API responde 401 | — |
| 6 | Sessão após atualizar a página | Recarregar (F5) em 3 páginas privadas | ✅ Continua logado; nada em localStorage/sessionStorage; cookie HttpOnly + SameSite=Lax | — |
| 7 | Navegação do início até uma aula | Card Matemática → 2º Ano → Trigonometria | ✅ Aula com objetivo, explicação, fórmulas, 3 exemplos e resumo | — |
| 8 | Pesquisa de conteúdos | Termos com/sem acento, maiúsculas, sem resultado, 1 letra | ✅ "juros" → Matemática Financeira em 1º; "funcao" acha Funções; mensagens de vazio e de termo curto | — |
| 9 | Resposta correta e incorreta | 5 questões: 3 certas e 2 erradas (escolhidas pelo gabarito do conteúdo) | ✅ "Resposta correta!" / "Resposta incorreta. A alternativa correta é a X." | — |
| 10 | Pontuação calculada no backend | Tela × banco + tentativa de fraude enviando `isCorrect`/`scorePercent` | ✅ Tela 60% = banco 3/5; campos falsos ignorados, nota calculada pelo servidor | — |
| 11 | Resolução após responder | Antes/depois de cada resposta + tela de revisão | ✅ Explicação ausente antes; presente depois; revisão com 5 explicações | — |
| 12 | Histórico e progresso | Página Meu progresso × dados enviados | ✅ 6 exercícios respondidos; Trigonometria 60% e 3/5; histórico com 2 tentativas | — |
| 13 | Repetição sem apagar tentativas | Refazer Trigonometria acertando tudo | ✅ Nova tentativa 100%; anterior continua 60% (banco: 3 e 5 acertos) | — |
| 14 | Configurações | Formulário + recarregar + banco | ✅ Valida nome; nome e ano salvos e mantidos; "não informar" grava NULL; menu atualiza na hora | — |
| 15 | Logout com invalidação | Sair + reutilizar o cookie antigo direto na API | ✅ Cookie antigo → 401; nenhuma sessão do aluno no banco | — |
| 16 | Dados após reiniciar o backend | Processo encerrado e iniciado de novo | ✅ Sessão válida, progresso idêntico, 3 tentativas no histórico | — |
| 17 | Isolamento entre dois alunos | Aluno B em outro navegador tenta ler/alterar dados de A | ✅ B vê progresso vazio; tentativa de A → "não encontrada" (404 em ler, responder e finalizar); PATCH com id recusado | — |
| 18 | Computador e celular | 1280×800 e 390×844 (toque) | ✅ Menu ☰ abre/fecha/fecha ao navegar no celular; exercício respondido no celular; 6 páginas sem rolagem lateral em cada tamanho | Celular **emulado**; aparelho físico não testado |
| E1 | Links, botões e formulários | Varredura automática de todos os links internos | ✅ 22 páginas alcançadas, nenhum link quebrado, todos os botões/links com nome acessível | — |
| E2 | Gabarito antes da submissão | Inspeção de todas as respostas JSON capturadas | ✅ Nenhuma resposta trouxe alternativa correta/explicação antes da resposta, nem senha/hash | — |
| E3 | Erros no console e nas requisições | Monitor de console, erros JS e HTTP ≥ 400 | ✅ Nenhum erro de JavaScript; só os erros provocados de propósito (senha errada, e-mail repetido, acesso sem login, invasão, API desligada) | — |
| E4 | API indisponível | Site no Vite com o backend desligado e religado | ✅ Aviso "O servidor está indisponível…" + "Tentar novamente" na abertura, no início e ao enviar resposta; ao religar, continua da mesma tela | — |
| E5 | Segredos no código | Busca por chaves, tokens, senhas e arquivos .env no pacote | ✅ Nenhum segredo; `.env` fora do pacote e no .gitignore; só senhas fictícias nos testes | — |
| E6 | Build do frontend | `npm run build` | ✅ Concluído sem erros nem avisos | — |
| E7 | Testes automatizados do backend | `npm test` | ✅ 111/111 no MySQL 8.0.46 e no MariaDB 10.4.34; a suíte de 100 testes também passou no MariaDB 10.11 | — |
| E8 | Instalação guiada no Windows 11 | `npm run verificar` e `npm run iniciar` partindo de pasta sem `backend/.env` e sem build, com MySQL 8.0.46 e com MariaDB 10.4.34 (série do XAMPP) | ✅ `.env` criado, conferência ✔, build de produção sem avisos, site e login na porta 3001; mensagens com solução para sem `npm install`, MySQL desligado, senha recusada e porta ocupada | — |
| — | XAMPP Control Panel | — | ⏸️ Não executado (o MariaDB 10.4 foi testado fora do XAMPP) | Seguir o roteiro manual abaixo |
| — | Firefox, Safari, Edge | — | ⏸️ Não executado (validado só no Chromium) | Abrir o roteiro manual em outro navegador |
| — | Leitor de tela real (NVDA etc.) | — | ⏸️ Não executado (só checagens automáticas de nomes e foco) | Opcional |

## Validação da entrega final (cópia limpa)

O ZIP final foi instalado em uma pasta nova, seguindo apenas o README, com bancos separados (`se_entrega`, `se_entrega_test`): `npm install` ✅ · `npm run setup` ✅ · `npm test` ✅ 100/100 · `npm run build` ✅ · `npm run apresentacao` ✅ · `npm run dev` ✅ · validação ponta a ponta ✅ 22/22.

## Problemas encontrados e corrigidos

| Problema | Como apareceu | Correção | Reverificação |
|---|---|---|---|
| Erro 401 no console a cada visita sem login | E3: o site consultava `/api/auth/me`, que responde 401 para quem não entrou | Novo endpoint público `GET /api/auth/session` (sempre 200, `user: null` sem login); o frontend passou a usá-lo | E3 aprovado; teste de backend novo (100/100) |
| Login falhava com 403 quando o site rodava no `vite preview` | E4: o proxy do Vite trocava o cabeçalho Host, e a proteção de origem do backend recusava | Proxy com `changeOrigin: false` em `dev` e `preview` | E4 aprovado; `npm run dev` conferido |
| Mensagem genérica quando o backend estava desligado atrás do proxy (502) | E4: o erro 502 sem JSON virava "erro inesperado" | O cliente da API trata 5xx sem resposta da API como "servidor indisponível" | E4 aprovado |
| "Tentar novamente" do início não recarregava o bloco de progresso | Revisão visual da tela do E4 | O botão recarrega conteúdos e progresso | Validação completa repetida 3× |

Também foram corrigidos três problemas **no próprio script de teste**, que não eram falhas do sistema: o terminal do MySQL lia acentos com o charset errado (os dados no banco estavam corretos em UTF-8), havia verificações feitas antes de a tela terminar de carregar, e o detector de vazamento confundia o nome de campo "password" em mensagens de validação com uma senha exposta.

## Roteiro manual (itens não executados)

Execute no computador da apresentação (Windows + XAMPP ou MySQL Workbench):

1. Ligue o MySQL no XAMPP. Na pasta do projeto: `npm install`, `npm run iniciar` (todos os itens com ✔; com MySQL Workbench/Server, coloque a senha do root em `DB_PASSWORD` no `backend\.env` criado). Em outro terminal: `npm run db:check` (deve dizer "Conteúdo OK").
2. Abra http://localhost:3001 no Chrome **e** no Edge/Firefox. Para cada um:
   - Tente abrir http://localhost:3001/progresso → deve ir para o login.
   - Cadastre-se; confira "Seja bem-vindo, {nome}!".
   - Matemática → um assunto → "Marcar aula como concluída" → "Praticar exercícios"; responda uma certa e uma errada; veja as explicações; "Ver resultado".
   - Meu progresso: confira números e histórico; "Revisar".
   - Pesquise "juros"; altere nome e ano em Configurações; recarregue a página (F5).
   - Sair; tente voltar com o botão "Voltar" do navegador → deve continuar no login.
3. No celular (mesma rede Wi-Fi): rode `npm start`, descubra o IP do computador (`ipconfig`) e abra `http://IP:3001`. Confira o menu ☰ e um exercício. Se o Windows bloquear, libere a porta 3001 no firewall.
4. Feche o terminal do servidor com o site aberto e clique em "Inicial": deve aparecer "O servidor está indisponível…". Rode `npm start` de novo e clique em "Tentar novamente".
