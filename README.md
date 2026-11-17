# Simple Education

Plataforma web de apoio ao estudo de **Matemática** para estudantes do **1º, 2º e 3º ano do Ensino Médio**.
Projeto final de curso técnico.

O estudante se cadastra, estuda aulas organizadas por ano, resolve exercícios com correção e explicação na hora e acompanha o próprio progresso. A plataforma é aberta: qualquer pessoa pode se cadastrar, sendo estudante ou não.

> A distribuição dos conteúdos por ano segue a proposta deste projeto e não representa uma organização curricular oficial.

> **Não usa terminal? Use a [Versão XAMPP (sem terminal)](#versão-xampp-sem-terminal)**: basta o XAMPP e o navegador.

---

## Sumário

0. [Versão XAMPP (sem terminal)](#versão-xampp-sem-terminal)
1. [Funcionalidades](#funcionalidades)
2. [Tecnologias e versões usadas](#tecnologias-e-versões-usadas)
3. [Pré-requisitos](#pré-requisitos)
4. [Passo a passo para rodar (Windows)](#passo-a-passo-para-rodar-windows)
5. [Configuração (backend/.env)](#configuração-backendenv)
6. [Banco de dados: comandos](#banco-de-dados-comandos)
7. [Outros modos de iniciar](#outros-modos-de-iniciar)
8. [Endereços e portas](#endereços-e-portas)
9. [Testes](#testes)
10. [Build](#build)
11. [Solução de problemas](#solução-de-problemas)
12. [Limitações conhecidas](#limitações-conhecidas)
13. [Documentação](#documentação)

---

## Versão XAMPP (sem terminal)

A pasta [`xampp/`](xampp/) tem o sistema completo feito em **PHP + HTML + JavaScript puro**: as mesmas telas e funcionalidades, gravando no MySQL do XAMPP. Não precisa de terminal, VS Code, Node.js, npm nem build: só o **XAMPP** e um navegador.

### O que você precisa

- **XAMPP 8.x** para Windows (vem com Apache, PHP e MySQL/MariaDB). Download: https://www.apachefriends.org

### Passo a passo (tudo pelo próprio XAMPP)

1. **Baixe o projeto.** Na página do projeto no GitHub, troque a branch de `main` para **`versao-xampp`** (botão com o nome da branch, no alto à esquerda), clique em **Code → Download ZIP** e salve o arquivo.
2. **Abra a pasta do XAMPP.** Abra o **XAMPP Control Panel** e clique no botão **Explorer** (à direita). Abre a pasta do XAMPP (normalmente `C:\xampp`). Entre na pasta **`htdocs`**.
3. **Coloque o projeto lá.** Descompacte o ZIP dentro de `htdocs` (botão direito → **Extrair tudo...**). Vai aparecer uma pasta como `simple-education-versao-xampp`; renomeie para **`simple-education`**. Confira: dentro dela deve existir a pasta `xampp` e o arquivo `index.php` (se aparecer outra pasta com o mesmo nome dentro, use a de dentro).
4. **Ligue o Apache e o MySQL.** No XAMPP Control Panel, clique em **Start** na linha do **Apache** e na linha do **MySQL**. Espere as duas ficarem **verdes**.
5. **Abra o sistema.** No navegador, acesse **http://localhost/simple-education/** (ou clique em **Admin** na linha do Apache, que abre `http://localhost/`, e acrescente `simple-education/` no endereço).
   No primeiro acesso o sistema cria sozinho o banco **`simple_education_xampp`** e carrega as 9 aulas e as 45 questões (leva alguns segundos).
6. **Use.** Clique em **Cadastre-se**, crie sua conta e pronto.

Para parar: clique em **Stop** no Apache e no MySQL. Para usar de novo: **Start** nos dois e abra o mesmo endereço; suas contas e seu progresso continuam lá.

### Ver os dados no phpMyAdmin

No XAMPP Control Panel, clique em **Admin** na linha do **MySQL**. Abre o phpMyAdmin; à esquerda, clique no banco **`simple_education_xampp`**. As tabelas principais são `users` (contas), `topics` (aulas), `questions` (questões) e `attempts` (tentativas).

### Usa o MySQL do Workbench (com senha) ou outra porta?

A conexão com o banco fica em um único arquivo: **`htdocs\simple-education\xampp\api\conexao.php`**. Clique nele com o botão direito → **Abrir com → Bloco de Notas** e altere só o necessário:

- **Senha:** na linha da senha, coloque a senha do `root` entre as aspas (por exemplo, `'minhasenha'`). No XAMPP a senha é vazia (`''`).
- **Porta:** se o seu MySQL não usa a porta 3306, troque o número na linha da porta.

Salve e atualize a página no navegador.

> Use só um MySQL por vez: se o MySQL do Workbench (serviço **MySQL80**/**MySQL84** do Windows) estiver ligado, o MySQL do XAMPP não consegue usar a porta 3306 e não fica verde.

### Problemas comuns

| O que aparece | O que fazer |
|---|---|
| O **Apache** não fica verde (porta 80 ocupada, muitas vezes pelo Skype ou pelo IIS) | Feche o programa que usa a porta 80. Ou, no XAMPP, clique em **Config** do Apache → `httpd.conf`, troque `Listen 80` por `Listen 8080`, salve, dê **Start** e use **http://localhost:8080/simple-education/** |
| O **MySQL** não fica verde | Outro MySQL está ligado na porta 3306 (veja o aviso acima): pare o serviço do MySQL do Workbench em "Serviços" do Windows ou use ele no lugar do XAMPP, ajustando o `conexao.php` |
| A página mostra **código PHP** ou fica **em branco** | Você abriu o arquivo com dois cliques (o endereço começa com `file:///`). Abra pelo navegador em **http://localhost/simple-education/** |
| **"Não foi possível conectar ao MySQL"** na tela | O MySQL está desligado: clique em **Start** na linha do MySQL e depois em **Tentar novamente** |
| **"O MySQL recusou o usuário ou a senha"** na tela | Ajuste a senha no `xampp/api/conexao.php` (no XAMPP ela é vazia) |
| **"O arquivo xampp/api/conexao.php tem um erro de digitação"** na tela | Abra o arquivo no Bloco de Notas, perto da linha indicada, e confira se o valor está entre aspas simples e a linha termina com `;` (ex.: `const DB_PASSWORD = 'minhasenha';`) |
| **"A instalação do banco do sistema ficou incompleta"** na tela | O Apache ou o MySQL foi parado durante o primeiro acesso. No phpMyAdmin, apague o banco `simple_education_xampp` (aba **Operações** → **Remover o banco de dados**) e atualize a página |
| **Not Found** ao abrir o endereço | A pasta em `htdocs` não se chama `simple-education`, ou está uma pasta abaixo (`simple-education\simple-education-...`). Ajuste o nome ou o endereço |

### Começar do zero ou receber aulas atualizadas

O banco é criado só no primeiro acesso. Para apagar tudo (contas, progresso e histórico) e recriar com o conteúdo atual da pasta: no phpMyAdmin, clique em `simple_education_xampp` → aba **Operações** → **Remover o banco de dados (DROP)**, e depois abra o sistema de novo.

### Para quem desenvolve

- **Telas:** `xampp/*.html`, `xampp/js/` (um arquivo por tela; `api.js` é o único com chamadas ao servidor) e `xampp/css/`.
- **API:** `xampp/api/index.php` (rotas iguais às de [docs/api.md](docs/api.md), no formato `xampp/api/index.php/<rota>`); `xampp/api/conexao.php` concentra a conexão.
- **Banco e conteúdo:** `xampp/api/sql/estrutura.sql` e `conteudo.sql` são gerados a partir da versão Node com `npm run content:export-sql` (precisa do Node e de um MySQL ligado). Rode de novo quando o conteúdo em `backend/src/db/seed/content/` mudar.
- O `.htaccess` da raiz faz o Apache servir só a pasta `xampp/`; os `.sql` (que têm o gabarito) ficam bloqueados para o navegador.

---

## Funcionalidades

| Área | O que o sistema faz |
|---|---|
| Conta | Cadastro (nome, e-mail, senha e ano escolar opcional), login, logout e sessão que continua após atualizar a página |
| Página inicial | Boas-vindas com o nome, card **Matemática** e atalho "Continuar estudando" |
| Conteúdos | 9 aulas organizadas em 1º, 2º e 3º ano, com destaque para o ano do estudante |
| Aula | Objetivo de aprendizagem, explicação, conceitos e fórmulas, 3 exemplos resolvidos, resumo e botão "Marcar aula como concluída" |
| Exercícios | 5 questões por aula (45 no total), 4 alternativas, nível de dificuldade, correção feita no servidor e explicação após cada resposta |
| Resultado e revisão | Nota da tentativa, revisão das respostas e possibilidade de continuar uma tentativa não finalizada |
| Meu progresso | Aulas concluídas, assuntos concluídos, exercícios respondidos, taxa de acertos, progresso por ano e por assunto, histórico de tentativas |
| Pesquisa | Busca por título, descrição e texto das aulas, ignorando acentos e maiúsculas |
| Configurações | Alterar nome e ano escolar |
| Layout | Fundo escuro com destaques em roxo, menu lateral, adaptado para computador e celular (menu ☰) |

Fora do escopo definido para o projeto: chatbot, inteligência artificial, pagamentos e chat. Não implementados nesta versão: recuperação de senha e área administrativa (veja [Limitações](#limitações-conhecidas)).

## Tecnologias e versões usadas

Versões **efetivamente usadas** na validação final (as versões exatas das bibliotecas ficam travadas no `package-lock.json`).

| Parte | Tecnologia | Versão |
|---|---|---|
| Ambiente | Node.js / npm | 22.23.4 / 10.9.9 |
| Banco de dados | MySQL | 8.0.46 (também testado com MariaDB 10.4.34, a série do XAMPP, e MariaDB 10.11.14) |
| Backend | Express | 5.3.0 |
| Acesso ao banco | mysql2 | 3.24.6 |
| Frontend | React / React DOM | 19.3.1 |
| Rotas do frontend | React Router | 7.18.5 |
| Build do frontend | Vite / @vitejs/plugin-react | 8.3.8 / 6.3.0 |
| Testes da API | node:test (nativo) + supertest | Node 22 / 7.3.2 |
| Teste ponta a ponta (validação) | Playwright + Chromium | 1.63.0 |
| Fontes (offline) | @fontsource/inter e @fontsource/nunito | 5.3.0 |
| Utilitário | concurrently (inicia front e back juntos) | 9.2.5 |

Senhas usam o `scrypt` do módulo `crypto` nativo do Node; não há serviços pagos nem dependência de internet para rodar.

## Pré-requisitos

| O que | Versão | Como conferir / onde baixar |
|---|---|---|
| **Node.js** | 22 LTS ou mais recente | No terminal: `node -v`. Download: https://nodejs.org (botão "LTS") |
| **MySQL** — um dos dois | **XAMPP** 8.x (vem com MariaDB 10.4) **ou** **MySQL Server** 8.0.19+ (o que o MySQL Workbench usa) | O `npm run verificar` mostra a versão e diz se é compatível |
| **VS Code** | qualquer | https://code.visualstudio.com |

O sistema usa o usuário `root` do MySQL, que tem permissão para criar os bancos `simple_education` e `simple_education_test`.

## Passo a passo para rodar (Windows)

### 1. Ligue o MySQL

- **XAMPP:** abra o **XAMPP Control Panel** e clique em **Start** na linha do **MySQL**. Ela fica verde e mostra a porta (normalmente `3306`). Não é preciso ligar o Apache.
- **MySQL Workbench / MySQL Server:** o MySQL normalmente já liga junto com o Windows. Para conferir, abra o Workbench e entre na conexão **Local instance** com o usuário `root` e a senha que você criou na instalação. **Anote essa senha:** ela vai no passo 4.

### 2. Abra o projeto no VS Code

No VS Code, use **Arquivo → Abrir Pasta...** (em inglês: **File → Open Folder...**) e escolha a pasta do projeto (a que tem o `README.md` e o `package.json`). Depois abra o terminal em **Terminal → Novo Terminal** (**Terminal → New Terminal**): ele já abre dentro da pasta certa.

Para confirmar que o Node.js está instalado, digite `node -v` no terminal e aperte Enter: deve aparecer `v22` ou maior. Se der erro, veja [Solução de problemas](#solução-de-problemas).

### 3. Instale as dependências (só na primeira vez)

```bash
npm install
```

Pode levar alguns minutos. No final aparece algo como `added ... packages`.

### 4. Inicie o sistema

```bash
npm run iniciar
```

Esse comando:

1. Cria o arquivo `backend/.env` com a configuração padrão do XAMPP (usuário `root`, senha vazia), se ele ainda não existir.
2. Confere tudo o que o sistema precisa e mostra ✔ ou ✖ em cada item.
3. Gera o site.
4. Inicia o servidor, cria o banco `simple_education` e carrega as 9 aulas e as 45 questões.

Quando aparecer o quadro **"Simple Education rodando em http://localhost:3001"**, abra **http://localhost:3001** no navegador e crie sua conta em **Cadastre-se**.

**Usa MySQL Workbench / MySQL Server com senha?** Na primeira vez o `npm run iniciar` vai mostrar ✖ `O MySQL recusou o usuário "root" ou a senha.` Abra o arquivo `backend/.env` no VS Code, coloque a senha na linha `DB_PASSWORD` (por exemplo, `DB_PASSWORD=minhasenha`), salve e rode `npm run iniciar` de novo. Se a senha tiver `#` ou espaço, coloque-a entre aspas: `DB_PASSWORD="minha#senha"`.

Se algum item aparecer com ✖, a própria mensagem diz o que fazer. Depois de corrigir, rode o comando de novo. Para só conferir, sem iniciar: `npm run verificar`.

### 5. Para parar e para abrir de novo

- **Parar:** no terminal onde o sistema está rodando, aperte **Ctrl+C**.
- **Abrir de novo:** ligue o MySQL (passo 1) e rode `npm run iniciar`. O `npm install` só é necessário na primeira vez.

### Ver os dados no MySQL Workbench ou no phpMyAdmin

O banco se chama **`simple_education`**. No Workbench ele aparece na aba **Schemas** (clique no ícone de atualizar se não aparecer). No XAMPP, clique em **Admin** na linha do MySQL para abrir o phpMyAdmin. As tabelas principais são `users` (contas), `topics` (aulas), `questions` (questões) e `attempts` (tentativas). Detalhes em [docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Configuração (backend/.env)

O `npm run iniciar` cria o `backend/.env` a partir de `backend/.env.example`. Sem esse arquivo, o sistema usa os mesmos valores padrão (os do XAMPP). Os campos que costumam mudar:

| Variável | Para que serve | Valor comum |
|---|---|---|
| `DB_HOST` / `DB_PORT` | Endereço do MySQL | `localhost` / `3306` |
| `DB_USER` / `DB_PASSWORD` | Usuário e senha | XAMPP: `root` e senha vazia. Workbench/MySQL Server: `root` e a senha da instalação |
| `DB_NAME` | Banco do sistema (criado automaticamente) | `simple_education` |
| `DB_NAME_TEST` | Banco **só dos testes** (é apagado a cada execução; precisa terminar em `_test`) | `simple_education_test` |
| `PORT` | Porta do servidor | `3001` |
| `COOKIE_SECURE` | `false` para http://localhost; `true` só com HTTPS | `false` |

O arquivo `.env` não deve ser enviado para o GitHub (já está no `.gitignore`).

## Banco de dados: comandos

O servidor cria e atualiza o banco sozinho ao iniciar; estes comandos servem para conferir ou recomeçar. `npm run setup` executa os três primeiros, em ordem:

| Comando | O que faz |
|---|---|
| `npm run db:migrate` | Cria o banco (se não existir) e aplica as migrations de `backend/src/db/migrations/` |
| `npm run db:seed` | Carrega as 9 aulas e as 45 questões. Pode ser repetido: não duplica nada e não apaga dados de alunos |
| `npm run db:check` | Confere 9 aulas completas, 45 questões, 4 alternativas e exatamente 1 correta em cada |

Para começar do zero (por exemplo, antes da apresentação): `npm run db:reset` — **apaga todos os usuários e o histórico** e recria o banco.

## Outros modos de iniciar

O jeito recomendado é `npm run iniciar` ([passo a passo](#passo-a-passo-para-rodar-windows)). Os modos abaixo não fazem a conferência antes de iniciar.

**Modo desenvolvimento — frontend e backend juntos, com um comando:**

```bash
npm run dev
```

Abra **http://localhost:5173**. O backend reinicia sozinho ao salvar arquivos, e o frontend atualiza na hora.

**Modo apresentação — tudo em um único endereço:**

```bash
npm run apresentacao      # gera o build do frontend e inicia o servidor
```

Abra **http://localhost:3001**. (Equivale a `npm run build` seguido de `npm start`.)

Em todos os modos, o servidor aplica as migrations pendentes e sincroniza o conteúdo ao iniciar, desde que o MySQL esteja ligado.

## Endereços e portas

| Endereço | O que é |
|---|---|
| http://localhost:5173 | Site em modo desenvolvimento (Vite), repassa `/api` para a porta 3001 |
| http://localhost:3001 | Servidor Express: site já compilado + API (modo apresentação) |
| http://localhost:3001/api | API REST (ex.: http://localhost:3001/api/health → `{"status":"ok"}`) |
| http://localhost:4173 | `npx vite preview` (opcional), também repassa `/api` para a 3001 |
| localhost:3306 | MySQL |

## Testes

```bash
npm test
```

Roda os testes de integração da API e a conferência matemática do conteúdo (`backend/tests/`). Os testes usam o banco **`simple_education_test`**, que é apagado e recriado a cada execução — **o banco real nunca é tocado**. O MySQL precisa estar ligado.

Resultado na validação final: **todos os testes aprovados** (detalhes em [docs/documentacao-tecnica.md](docs/documentacao-tecnica.md#7-testes-e-resultados-reais)).

A validação ponta a ponta no navegador (Playwright) está registrada em [docs/relatorio-validacao.md](docs/relatorio-validacao.md).

## Build

```bash
npm run build
```

Gera o site otimizado em `frontend/dist/`. Com a pasta gerada, `npm start` serve o site e a API juntos na porta 3001.

## Solução de problemas

Primeiro passo para qualquer problema: rode `npm run verificar`. Ele confere o Node, as dependências, o `.env`, a conexão, a senha e a versão do MySQL e a porta, e explica o que fazer em cada item com ✖.

| Sintoma | Causa provável | Solução |
|---|---|---|
| `'npm' não é reconhecido como um comando` | Node.js não instalado, ou o VS Code foi aberto antes da instalação | Instale o Node.js 22 LTS, feche **todas** as janelas do VS Code e abra de novo |
| `npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada neste sistema` (ou `running scripts is disabled on this system`) | O terminal do VS Code está no PowerShell, que bloqueia scripts por padrão | Rode uma vez no terminal: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e confirme com `S` (ou `Y`). Outra opção: no terminal, clique na seta ao lado do **+** e escolha **Command Prompt** |
| "As dependências do projeto não estão instaladas" | Faltou o `npm install` | Rode `npm install` na pasta do projeto |
| "Não foi possível conectar ao MySQL... (MySQL desligado ou em outra porta)" | MySQL desligado | XAMPP: **Start** na linha do MySQL. Workbench/MySQL Server: inicie o serviço do MySQL (normalmente **MySQL80** ou **MySQL84**) em "Serviços" do Windows |
| No XAMPP, o MySQL não fica verde ao clicar em Start | A porta 3306 está ocupada por outro MySQL (por exemplo, o do Workbench) | Use só um dos dois: pare o serviço do MySQL (**MySQL80** ou **MySQL84**) em "Serviços" do Windows **ou** não ligue o MySQL do XAMPP |
| `O MySQL recusou o usuário "root" ou a senha.` | Senha errada em `backend/.env` | XAMPP: `DB_PASSWORD=` vazio. Workbench/MySQL Server: a senha do root da instalação, entre aspas se tiver `#` ou espaço |
| "O usuário ... não tem permissão para criar o banco" | Usuário sem permissão | Use `DB_USER=root` |
| "A versão do MySQL parece antiga demais" / MySQL ou MariaDB antigo | MySQL anterior à 8.0.19 ou MariaDB anterior à 10.2 | Atualize o XAMPP (8.x) ou o MySQL Server (8.0+) |
| "A porta 3001 já está em uso" | O sistema já está aberto em outro terminal | Use o que já está aberto (http://localhost:3001) ou aperte Ctrl+C no outro terminal; ou mude `PORT` no `.env` |
| Página em branco em http://localhost:3001 | Build não gerado | Rode `npm run iniciar` (ele gera o build) |
| "O servidor está indisponível no momento" no site | Backend parado | Inicie o backend e clique em **Tentar novamente** |
| "Muitas tentativas. Aguarde alguns minutos" | 5 senhas erradas em 15 min | Aguarde ou reinicie o servidor (o contador fica na memória) |
| Saiu da conta sozinho | Sessão expirou (7 dias) ou o banco foi recriado com `db:reset` | Entre de novo |
| `npm install` falha | Node antigo | Instale o Node 22 LTS e rode `npm install` de novo |
| Acentos estranhos ao consultar o banco pelo terminal | Configuração do cliente MySQL, não do sistema | Use `mysql --default-character-set=utf8mb4` |

## Limitações conhecidas

- Sem recuperação de senha e sem troca de e-mail ou senha pela interface.
- O conteúdo é editado nos arquivos `backend/src/db/seed/content/` (não há área administrativa); depois de editar, rode `npm run db:seed`.
- Uma única matéria (Matemática), com 9 aulas e 45 questões.
- O limite de tentativas de login fica na memória do servidor (zera ao reiniciar).
- Sessões vencidas são removidas do banco quando o servidor inicia.
- Validado em Linux com Chromium (computador e celular emulado). A instalação com `npm run iniciar` foi validada no Windows 11 com MySQL 8.0.46 e MariaDB 10.4.34 (a mesma série do XAMPP), sem o painel do XAMPP. **Não testado:** o XAMPP Control Panel em si, Firefox, Edge, Safari, celular físico e leitores de tela. Há um roteiro manual em [docs/relatorio-validacao.md](docs/relatorio-validacao.md#roteiro-manual-itens-não-executados).
- **Não publicado na internet.** Se a avaliação exigir um link online, veja a seção "Publicação online (pendente)" em [docs/documentacao-tecnica.md](docs/documentacao-tecnica.md#9-publicação-online-pendente).

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/documentacao-tecnica.md](docs/documentacao-tecnica.md) | Estrutura de pastas, arquitetura, banco, API, autenticação, regras de correção/progresso, testes |
| [docs/api.md](docs/api.md) | Todos os endpoints com exemplos de requisição e resposta |
| [docs/modelo-de-dados.md](docs/modelo-de-dados.md) | Tabelas, campos e diagrama ER |
| [docs/roteiro-demonstracao.md](docs/roteiro-demonstracao.md) | Roteiro de demonstração de 5 minutos |
| [docs/guia-de-defesa.md](docs/guia-de-defesa.md) | Explicação didática para defender o projeto |
| [docs/conteudo-pedagogico.md](docs/conteudo-pedagogico.md) | Todas as aulas e questões com gabarito (gerado por `npm run content:export`) |
| [docs/relatorio-validacao.md](docs/relatorio-validacao.md) | Validação ponta a ponta: o que foi testado, como e com que resultado |
