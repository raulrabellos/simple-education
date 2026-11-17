# Simple Education — versão XAMPP

Plataforma web de apoio ao estudo de **Matemática** para estudantes do **1º, 2º e 3º ano do Ensino Médio**.
Projeto final de curso técnico.

O estudante se cadastra, estuda aulas organizadas por ano, resolve exercícios com correção e explicação na hora e acompanha o próprio progresso. A plataforma é aberta: qualquer pessoa pode se cadastrar, sendo estudante ou não.

> A distribuição dos conteúdos por ano segue a proposta deste projeto e não representa uma organização curricular oficial.

Esta branch (**`versao-xampp`**) é a versão feita em **PHP + HTML + JavaScript puro** para rodar no **XAMPP**: não precisa de terminal, VS Code, Node.js, npm nem build, só o XAMPP e um navegador. A versão em Node.js + React fica na branch **`main`**; as duas são projetos separados.

---

## Sumário

1. [Como rodar (só com o XAMPP)](#como-rodar-só-com-o-xampp)
2. [Funcionalidades](#funcionalidades)
3. [Como o projeto é organizado](#como-o-projeto-é-organizado)
4. [Atualizar as aulas e questões](#atualizar-as-aulas-e-questões)
5. [Limitações conhecidas](#limitações-conhecidas)
6. [Documentação](#documentação)

---

## Como rodar (só com o XAMPP)

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


## Como o projeto é organizado

```
simple-education/
├── index.php            Leva http://localhost/simple-education/ direto para xampp/
├── .htaccess            Faz o Apache servir só a pasta xampp/ (bloqueia docs/ e arquivos .md)
├── docs/                Contrato da API, modelo de dados e conteúdo com gabarito
└── xampp/
    ├── *.html           Uma página por tela (login, início, aula, exercícios, progresso...)
    ├── js/              JavaScript puro: api.js (único com chamadas ao servidor), layout.js e telas/ (um arquivo por tela)
    ├── css/, fontes/    Estilos e fontes (Inter e Nunito), tudo local, sem internet
    └── api/
        ├── conexao.php  ÚNICO lugar com os dados do MySQL (servidor, porta, usuário, senha, banco)
        ├── index.php    Roteador da API: xampp/api/index.php/<rota>
        ├── instalar.php Cria o banco e carrega o conteúdo no primeiro acesso
        ├── auth.php, usuarios.php, conteudo.php, tentativas.php, progresso.php, util.php
        └── sql/         estrutura.sql (tabelas) e conteudo.sql (aulas e questões) — bloqueados para o navegador
```

| Parte | Como funciona |
|---|---|
| Telas | HTML + JavaScript puro em módulos nativos do navegador; parâmetros na URL (`aula.html?slug=...`, `tentativa.html?id=...`); todos os caminhos são relativos, então a pasta pode ter outro nome em `htdocs` |
| API | Rotas, JSON e códigos de status descritos em [docs/api.md](docs/api.md), no formato `xampp/api/index.php/<rota>` (sem o prefixo `/api` do documento) |
| Banco | `simple_education_xampp` (tabelas em [docs/modelo-de-dados.md](docs/modelo-de-dados.md), mais `login_attempts` e `instalacao_concluida`); todo SQL com consultas preparadas (PDO) |
| Instalação | No primeiro acesso cria o banco e executa `estrutura.sql` e `conteudo.sql`, uma instalação por vez; o último passo cria a tabela `instalacao_concluida`. Se a instalação for interrompida: sem contas, o banco é recriado sozinho; com contas, a tela orienta apagar o banco no phpMyAdmin |
| Login | Senhas com `password_hash`; sessão na tabela `sessions` (só o hash SHA-256 do token), cookie `se_session` HttpOnly e SameSite=Lax, válido por 7 dias; 5 erros de login em 15 minutos bloqueiam por IP + e-mail |
| Correção | Feita só no servidor: gabarito e explicação só são enviados depois que a questão é respondida |
| Erros | Problemas com o MySQL (desligado, senha errada, versão antiga, erro de digitação no `conexao.php`) aparecem na tela em português, com a solução |

**Requisitos:** XAMPP 8.x (PHP 8.0+ com PDO/pdo_mysql e mbstring, MariaDB 10.2.1+ ou MySQL 8.0.19+, Apache com `AllowOverride All`, que é o padrão do XAMPP em `htdocs`).

## Atualizar as aulas e questões

As aulas e questões ficam em `xampp/api/sql/conteudo.sql` (comandos `INSERT` comuns). Não há área administrativa.

- **Editar:** altere o `conteudo.sql` (pode ser no Bloco de Notas, mantendo um comando por linha) e recrie o banco: no phpMyAdmin, apague `simple_education_xampp` e abra o sistema de novo. Isso apaga as contas e o histórico.
- **Trazer o conteúdo da branch `main`:** o `conteudo.sql` foi gerado a partir da versão Node pelo script `backend/src/db/seed/export-sql.js`, que está no histórico desta branch (commit `2e61428`). Para usar: na branch `main`, copie esse script para `backend/src/db/seed/`, rode `node backend/src/db/seed/export-sql.js` com o MySQL ligado e copie os `.sql` gerados para `xampp/api/sql/` nesta branch.
- [docs/conteudo-pedagogico.md](docs/conteudo-pedagogico.md) lista todas as aulas e questões com o gabarito, para revisão.

## Limitações conhecidas

- Uso local, para testes: não foi preparada para publicação na internet (cookie sem `Secure`, sem HTTPS).
- Sem recuperação de senha e sem troca de e-mail ou senha pela interface.
- Uma única matéria (Matemática), com 9 aulas e 45 questões.
- Conteúdo novo não chega sozinho a quem já instalou: é preciso apagar o banco (perde contas e histórico).
- Validado com Apache + PHP 8.2 + MariaDB 10.4 (a mesma série do XAMPP 8.2) e com MySQL 8.0 em Docker, no navegador Chromium/Edge (computador e celular emulado). **Não testado:** o XAMPP Control Panel em si, MySQL do Workbench com senha, Firefox, Safari, celular físico e leitores de tela.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/api.md](docs/api.md) | Todas as rotas da API com exemplos de requisição e resposta |
| [docs/modelo-de-dados.md](docs/modelo-de-dados.md) | Tabelas, campos e diagrama ER |
| [docs/conteudo-pedagogico.md](docs/conteudo-pedagogico.md) | Todas as aulas e questões com gabarito |
