/*
 * Script de validação ponta a ponta usado em 17/11/2026 (Playwright + MySQL local).
 * Específico do ambiente de validação: usa o cliente mysql via socket do root e
 * a pasta APP_ROOT com o projeto instalado. Serve como referência do que foi testado.
 * Requisitos para executar: npm i -D playwright, MySQL acessível pelo cliente 'mysql'.
 */
/* Validação ponta a ponta da Simple Education (Playwright + backend real + MySQL). */
const { chromium, request: pwRequest } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const ROOT = process.env.APP_ROOT || '/tmp/val/simple-education';
const BASE = 'http://localhost:3001';
const SHOTS = process.env.SHOTS_DIR || '/home/claude/shots/val';
const DB = process.env.VAL_DB || 'simple_education';
fs.mkdirSync(SHOTS, { recursive: true });
const sql = (q) => execSync(`mysql --default-character-set=utf8mb4 -uroot -S /run/mysqld/mysqld.sock -N ${DB} -e "${q.replace(/"/g, '\\"')}"`).toString().trim();

// ---------- Backend controlado pelo script ----------
let server = null;
function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn('node', ['src/server.js'], { cwd: `${ROOT}/backend`, env: { ...process.env, LOG_REQUESTS: 'false' } });
    let out = '';
    server.stdout.on('data', (d) => { out += d; if (out.includes('rodando')) resolve(); });
    server.stderr.on('data', (d) => { out += d; });
    server.on('exit', (c) => { if (!out.includes('rodando')) reject(new Error(`servidor saiu (${c}): ${out}`)); });
  });
}
function stopServer() {
  return new Promise((resolve) => { if (!server) return resolve(); server.on('exit', () => resolve()); server.kill('SIGTERM'); server = null; });
}

// ---------- Resultados ----------
const results = [];
async function check(id, flow, method, fn) {
  try {
    const obs = await fn();
    results.push({ id, flow, method, status: 'APROVADO', obs: obs || '' });
  } catch (e) {
    results.push({ id, flow, method, status: 'FALHOU', obs: e.message.split('\n').slice(0, 8).join(' ') });
  }
}

// ---------- Monitor de console, rede e gabarito ----------
const expected = []; // {re, status}
const expectError = (re, status) => expected.push({ re, status });
const netIssues = [];
const consoleIssues = [];
const leaks = [];
const LEAK_KEYS = ['isCorrect', 'correctOptionId', 'correctLetter', 'explanation', 'is_correct', 'password', 'password_hash', 'id_hash'];
function findKeys(obj, keys, path = '') {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([k, v]) => [...(keys.includes(k) ? [`${path}${k}`] : []), ...findKeys(v, keys, `${path}${k}.`)]);
}
function monitor(page, label) {
  const failedUrls = new Set();
  page.on('pageerror', (e) => consoleIssues.push(`[${label}] erro JS: ${e.message}`));
  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/api/')) {
      if (res.status() >= 400) netIssues.push(`[${label}] ${res.status()} ${url}`);
      return;
    }
    const status = res.status();
    if (status >= 400) {
      const ok = expected.find((x) => x.re.test(`${res.request().method()} ${url}`) && x.status === status);
      if (ok) failedUrls.add(url); else netIssues.push(`[${label}] ${status} ${res.request().method()} ${url}`);
    }
    try {
      const body = await res.json();
      const isAnswer = /\/attempts\/\d+\/answers$/.test(url);
      const isDetail = /\/attempts\/\d+$/.test(url) && res.request().method() === 'GET';
      if (isDetail) {
        for (const q of body.questions ?? []) if (!q.answer && findKeys(q, LEAK_KEYS).length) leaks.push(`${url}: questão não respondida com gabarito`);
      } else if (!isAnswer) {
        // error.details traz só NOMES de campos com mensagens de validação (ex.: "password": "A senha deve ter...").
        const keys = findKeys(body.error ? { ...body, error: { ...body.error, details: undefined } } : body, LEAK_KEYS);
        if (keys.length) leaks.push(`${url}: ${keys.join(', ')}`);
      }
    } catch { /* sem JSON */ }
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url ?? '';
    if (failedUrls.has(url)) return; // erro de rede esperado (ex.: senha errada → 401)
    consoleIssues.push(`[${label}] console: ${m.text()} ${url}`);
  });
}

const optionByLetter = (page, letter) => page.locator('.option').filter({ has: page.locator('.option__letter', { hasText: new RegExp(`^${letter}$`) }) });
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function register(page, name, email, password, year) {
  await page.goto(`${BASE}/cadastro`);
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha').fill(password);
  if (year) await page.getByLabel('Ano escolar (opcional)').selectOption(String(year));
  await page.getByRole('button', { name: 'Criar conta' }).click();
}
async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

(async () => {
  const content = (await import(`${ROOT}/backend/src/db/seed/content/ano2.js`)).default;
  const trig = content.find((t) => t.slug === 'trigonometria');
  const keyOf = (statement) => {
    const q = trig.questions.find((x) => x.statement.replace(/\^\{|\}|_\{/g, '') === statement.replace(/\^\{|\}|_\{/g, ''));
    return { correct: q.correct, wrong: ['A', 'B', 'C', 'D'].find((l) => l !== q.correct) };
  };

  const browser = await chromium.launch();
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctxA.newPage();
  monitor(page, 'aluno A');
  const A = { name: 'Ana Validação', email: `ana.${Date.now()}@example.com`, password: 'SenhaForte123' };
  const B = { name: 'Bruno Validação', email: `bruno.${Date.now()}@example.com`, password: 'OutraSenha456' };
  let firstAttemptId = null;

  // 1 — banco vazio (preparado antes pelo README; aqui confirmamos o estado inicial)
  // Banco do zero: apaga e recria com os comandos do README.
  execSync(`mysql -uroot -S /run/mysqld/mysqld.sock -e "DROP DATABASE IF EXISTS ${DB}"`);
  execSync('npm run db:migrate && npm run db:seed && npm run db:check', { cwd: ROOT, stdio: 'pipe' });
  await check(1, 'Preparação a partir de banco vazio', 'README seguido em pasta limpa (npm install, db:migrate, db:seed, db:check, build); conferência no MySQL', async () => {
    const users = sql('SELECT COUNT(*) FROM users');
    const q = sql('SELECT COUNT(*) FROM questions WHERE active = 1');
    assert.equal(users, '0'); assert.equal(q, '45');
    await startServer();
    return `banco criado do zero: 0 usuários, 9 aulas, ${q} questões ativas`;
  });

  // 5 — rotas privadas sem login (antes de qualquer cadastro)
  await check(5, 'Rotas privadas bloqueadas sem autenticação', 'Navegador sem cookie em 6 rotas + chamadas diretas à API', async () => {
    for (const path of ['/', '/progresso', '/configuracoes', '/materias/matematica', '/assuntos/trigonometria', '/tentativas/1']) {
      await page.goto(`${BASE}${path}`);
      await page.waitForURL('**/login', { timeout: 5000 });
    }
    expectError(/GET .*\/api\/(progress|subjects|attempts|topics)/, 401);
    const statuses = await page.evaluate(async () => Promise.all(['/api/progress', '/api/subjects', '/api/attempts', '/api/topics/trigonometria']
      .map((u) => fetch(u, { credentials: 'include' }).then((r) => r.status))));
    assert.deepEqual(statuses, [401, 401, 401, 401]);
    return '6 rotas redirecionaram para /login; API respondeu 401 em 4 endpoints';
  });

  // 2 — cadastro
  await check(2, 'Cadastro de aluno', 'Formulário no navegador + consulta ao banco', async () => {
    await register(page, A.name, A.email, A.password, 2);
    await page.getByRole('heading', { name: 'Seja bem-vindo, Ana!' }).waitFor();
    const row = sql(`SELECT name, school_year, LENGTH(password_hash) > 100, password_hash = '${A.password}' FROM users WHERE email = '${A.email}'`);
    assert.equal(row, `${A.name}\t2\t1\t0`);
    return 'conta criada, redirecionou para o início; senha salva como hash';
  });

  // 3 — e-mail duplicado e entradas inválidas
  await check(3, 'Rejeição de e-mail duplicado e entradas inválidas', 'Formulário (validação no navegador) + API direta (validação no servidor)', async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage(); monitor(p, 'anônimo');
    await p.goto(`${BASE}/cadastro`);
    await p.getByRole('button', { name: 'Criar conta' }).click();
    for (const msg of ['Informe um nome entre 2 e 80 caracteres.', 'Informe um e-mail válido.', 'A senha deve ter entre 8 e 72 caracteres.']) await p.getByText(msg).waitFor();
    await p.getByLabel('Senha', { exact: true }).fill('12345678'); await p.getByLabel('Confirmar senha').fill('87654321');
    await p.getByRole('button', { name: 'Criar conta' }).click();
    await p.getByText('As senhas não são iguais.').waitFor();
    expectError(/POST .*\/api\/auth\/register/, 409);
    await register(p, 'Outra Pessoa', A.email.toUpperCase(), 'SenhaForte123');
    await p.getByText('Este e-mail já está cadastrado.').waitFor();
    expectError(/POST .*\/api\/auth\/register/, 400);
    const api = await p.evaluate(async () => {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'x', email: 'sem-arroba', password: '1', schoolYear: 9 }) });
      return { status: r.status, fields: Object.keys((await r.json()).error.details).sort() };
    });
    assert.deepEqual(api, { status: 400, fields: ['email', 'name', 'password', 'schoolYear'] });
    assert.equal(sql('SELECT COUNT(*) FROM users'), '1');
    await ctx.close();
    return 'mensagens em português nos campos; 409 para e-mail repetido (maiúsculas); 400 com erro por campo na API; nenhum registro extra';
  });

  // 7 — navegação início → aula
  await check(7, 'Navegação da página inicial até uma aula', 'Cliques: card Matemática → 2º Ano → Trigonometria', async () => {
    await page.goto(`${BASE}/`);
    await page.getByRole('link', { name: /Matemática/ }).first().click();
    await page.waitForURL('**/materias/matematica');
    await page.getByRole('heading', { name: '2º Ano' }).waitFor();
    await page.getByText('Seu ano').waitFor();
    await page.getByRole('link', { name: /Trigonometria:/ }).click();
    await page.getByRole('heading', { name: 'Trigonometria', level: 1 }).waitFor();
    await page.getByText('Objetivo de aprendizagem').waitFor();
    assert.ok(await page.locator('.lesson-section--exemplo').count() >= 2);
    await page.screenshot({ path: `${SHOTS}/aula.png`, fullPage: true });
    return 'aula aberta com objetivo, explicação, fórmulas, 3 exemplos e resumo';
  });

  // 8 — pesquisa
  await check(8, 'Pesquisa de conteúdos', 'Barra de pesquisa: termos com e sem acento, sem resultado, curto demais, clique no resultado', async () => {
    const search = async (q) => { await page.getByLabel('Pesquisar conteúdos').fill(q); await page.keyboard.press('Enter'); };
    await search('juros'); await page.getByRole('link', { name: /Matemática Financeira/ }).waitFor();
    const firstJuros = await page.locator('.topic-link').first().innerText();
    assert.match(firstJuros, /Matemática Financeira/);
    await search('PROBABILIDADE'); await page.getByRole('link', { name: /Análise Combinatória e Probabilidade/ }).waitFor();
    await search('funcao'); await page.getByRole('link', { name: /Funções \(1º e 2º grau\)/ }).waitFor();
    await search('zzzz'); await page.getByText('Nenhum conteúdo encontrado para "zzzz".').waitFor();
    await search('a'); await page.getByText('Digite pelo menos 2 letras para pesquisar.').waitFor();
    await search('seno'); await page.getByRole('link', { name: /Trigonometria/ }).first().click();
    await page.getByRole('heading', { name: 'Trigonometria', level: 1 }).waitFor();
    return '"juros" → Matemática Financeira em 1º; maiúsculas/acentos ignorados; estados vazio e de aviso exibidos; resultado abre a aula';
  });

  // 9, 10, 11 — respostas, pontuação e resolução
  let scoreObs = '';
  await check(9, 'Envio de resposta correta e incorreta', 'Tentativa completa em Trigonometria: 3 corretas e 2 incorretas escolhidas a partir do gabarito do conteúdo', async () => {
    await page.getByRole('link', { name: /Praticar exercícios/ }).click();
    await page.getByRole('button', { name: 'Começar exercícios' }).click();
    const plan = ['correct', 'wrong', 'correct', 'correct', 'wrong'];
    for (let i = 0; i < 5; i++) {
      await page.getByText(`Questão ${i + 1} de 5`).waitFor();
      const statement = await page.locator('.question__statement').innerText();
      // 11: antes de responder não há resolução na tela
      assert.equal(await page.getByText(/Explicação:/).count(), 0, 'explicação visível antes de responder');
      const key = keyOf(statement);
      await optionByLetter(page, key[plan[i]]).click();
      await page.getByRole('button', { name: 'Responder' }).click();
      await page.getByText(plan[i] === 'correct' ? 'Resposta correta!' : /Resposta incorreta\. A alternativa correta é a [A-D]\./).waitFor();
      await page.getByText(/Explicação:/).waitFor();
      if (i === 1) await page.screenshot({ path: `${SHOTS}/resposta-incorreta.png`, fullPage: true });
      if (i < 4) await page.getByRole('button', { name: 'Próxima questão' }).click();
    }
    await page.getByRole('button', { name: 'Ver resultado' }).click();
    await page.getByRole('heading', { name: /Resultado: Trigonometria/ }).waitFor();
    scoreObs = await page.locator('.result__score').innerText();
    return 'feedback "Resposta correta!" e "Resposta incorreta. A alternativa correta é a X." exibidos conforme a escolha';
  });

  await check(10, 'Cálculo da pontuação no backend', 'Resultado na tela comparado ao banco + tentativa de fraude via API', async () => {
    assert.equal(scoreObs, '60%');
    const row = sql(`SELECT a.id, a.correct_count, a.total_questions, a.finished_at IS NOT NULL FROM attempts a JOIN users u ON u.id = a.user_id WHERE u.email = '${A.email}'`);
    const [id, correct, total, finished] = row.split('\t');
    firstAttemptId = id;
    assert.deepEqual([correct, total, finished], ['3', '5', '1']);
    // Fraude: envia alternativa errada dizendo que acertou e com nota 100.
    const fraud = await page.evaluate(async () => {
      const s = await (await fetch('/api/topics/estatistica/attempts', { method: 'POST', credentials: 'include' })).json();
      const q = s.questions[0];
      const results = [];
      for (const o of q.options) {
        const r = await fetch(`/api/attempts/${s.attempt.id}/answers`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: q.id, optionId: o.id, isCorrect: true, scorePercent: 100, correctCount: 5 }) });
        results.push({ status: r.status, body: await r.json() });
        break;
      }
      const fin = await (await fetch(`/api/attempts/${s.attempt.id}/finish`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scorePercent: 100 }) })).json();
      return { first: results[0], fin: fin.attempt };
    });
    assert.equal(fraud.fin.scorePercent, fraud.first.body.isCorrect ? 20 : 0);
    return `tela 60% = banco 3/5 acertos; campos isCorrect/scorePercent enviados pelo navegador foram ignorados (nota calculada: ${fraud.fin.scorePercent}%)`;
  });

  await check(11, 'Exibição da resolução após responder', 'Verificado em cada questão (antes: ausente; depois: presente) e na revisão', async () => {
    await page.getByRole('link', { name: 'Revisar respostas' }).click();
    await page.locator('.review-item').first().waitFor();
    assert.equal(await page.getByText(/Explicação:/).count(), 5);
    assert.equal(await page.locator('.review-options .is-correct').count(), 5);
    return 'resolução ausente antes da resposta e presente depois; revisão mostra 5 explicações e as alternativas corretas';
  });

  await check(12, 'Registro do histórico e atualização do progresso', 'Página Meu progresso comparada aos dados enviados', async () => {
    await page.getByRole('link', { name: 'Meu progresso', exact: true }).click();
    await page.getByText('Histórico de tentativas').waitFor();
    await page.locator('.history__item').first().waitFor();
    await page.locator('.stat__value').first().waitFor();
    const stats = await page.locator('.stat__value').allInnerTexts();
    // Trigonometria (3/5) + fraude em Estatística (1 resposta)
    assert.equal(stats[2], '6');
    const row = page.locator('tr', { hasText: 'Trigonometria' });
    assert.match(await row.innerText(), /60%/);
    assert.match(await row.innerText(), /3\/5/);
    assert.equal(await page.locator('.history__item').count(), 2);
    return '6 exercícios respondidos; Trigonometria com melhor nota 60% e 3/5 acertos; 2 tentativas no histórico';
  });

  await check(13, 'Repetição de exercícios sem apagar tentativas anteriores', 'Refazer Trigonometria acertando tudo; conferir histórico e banco', async () => {
    await page.goto(`${BASE}/assuntos/trigonometria/exercicios`);
    await page.getByRole('button', { name: 'Começar exercícios' }).click();
    for (let i = 0; i < 5; i++) {
      await page.getByText(`Questão ${i + 1} de 5`).waitFor();
      await optionByLetter(page, keyOf(await page.locator('.question__statement').innerText()).correct).click();
      await page.getByRole('button', { name: 'Responder' }).click();
      await page.getByText('Resposta correta!').waitFor();
      if (i < 4) await page.getByRole('button', { name: 'Próxima questão' }).click();
    }
    await page.getByRole('button', { name: 'Ver resultado' }).click();
    assert.equal(await page.locator('.result__score').innerText(), '100%');
    const rows = sql(`SELECT a.correct_count FROM attempts a JOIN users u ON u.id = a.user_id JOIN topics t ON t.id = a.topic_id WHERE u.email = '${A.email}' AND t.slug = 'trigonometria' ORDER BY a.id`);
    assert.equal(rows.replace(/\n/g, ','), '3,5');
    await page.goto(`${BASE}/tentativas/${firstAttemptId}`);
    await page.getByText(/finalizada em/).waitFor();
    assert.equal(await page.locator('.mini-stats dd').first().innerText(), '60%');
    return 'nova tentativa 100%; tentativa anterior continua com 60% (banco: 3 e 5 acertos)';
  });

  await check(6, 'Persistência da sessão após atualizar a página', 'F5 em 3 páginas privadas', async () => {
    for (const path of ['/progresso', '/assuntos/estatistica', '/configuracoes']) {
      await page.goto(`${BASE}${path}`); await page.locator('h1').waitFor();
      await page.reload(); await page.locator('h1').waitFor();
      assert.ok(!page.url().includes('/login'));
    }
    const storage = await page.evaluate(() => localStorage.length + sessionStorage.length);
    assert.equal(storage, 0);
    const cookie = (await ctxA.cookies()).find((c) => c.name === 'se_session');
    assert.ok(cookie.httpOnly && cookie.sameSite === 'Lax');
    return 'sessão mantida após recarregar; nada em localStorage/sessionStorage; cookie HttpOnly e SameSite=Lax';
  });

  await check(14, 'Atualização das configurações', 'Formulário + recarregar + banco', async () => {
    await page.goto(`${BASE}/configuracoes`);
    const save = page.getByRole('button', { name: 'Salvar alterações' });
    assert.equal(await save.isDisabled(), true, 'botão deveria iniciar desabilitado sem alterações');
    await page.getByLabel('Nome').fill('A');
    await save.click();
    await page.getByText('Informe um nome entre 2 e 80 caracteres.').waitFor();
    await page.getByLabel('Nome').fill('Ana Clara Validação');
    await page.getByLabel('Ano escolar').selectOption('3');
    await save.click();
    await page.getByText('Dados atualizados com sucesso.').waitFor();
    await page.getByText('Olá, Ana').waitFor();
    await page.reload();
    assert.equal(await page.getByLabel('Ano escolar').inputValue(), '3');
    assert.equal(sql(`SELECT CONCAT(name, '|', school_year) FROM users WHERE email = '${A.email}'`), 'Ana Clara Validação|3');
    await page.getByLabel('Ano escolar').selectOption('');
    await save.click(); await page.getByText('Dados atualizados com sucesso.').waitFor();
    assert.equal(sql(`SELECT IFNULL(school_year, 'NULL') FROM users WHERE email = '${A.email}'`), 'NULL');
    await page.getByLabel('Ano escolar').selectOption('3'); await save.click(); await page.getByText('Dados atualizados com sucesso.').waitFor();
    return 'validação de nome; nome e ano salvos e mantidos após recarregar; opção "não informar" grava NULL';
  });

  await check(16, 'Persistência dos dados após reiniciar o backend', 'Processo do servidor encerrado e iniciado de novo; página recarregada', async () => {
    const before = await page.evaluate(async () => (await fetch('/api/progress', { credentials: 'include' })).json());
    await stopServer();
    await startServer();
    await page.goto(`${BASE}/progresso`);
    await page.getByText('Histórico de tentativas').waitFor();
    const after = await page.evaluate(async () => (await fetch('/api/progress', { credentials: 'include' })).json());
    assert.deepEqual(after.totals, before.totals);
    assert.equal(await page.locator('.history__item').count(), 3);
    return 'após reiniciar: sessão continua válida, progresso idêntico e 3 tentativas no histórico';
  });

  let oldCookie;
  await check(4, 'Login correto e rejeição de senha incorreta', 'Sair, tentar senha errada, entrar com a correta', async () => {
    oldCookie = (await ctxA.cookies()).find((c) => c.name === 'se_session').value;
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.waitForURL('**/login');
    expectError(/POST .*\/api\/auth\/login/, 401);
    await login(page, A.email, 'SenhaErrada999');
    await page.getByText('E-mail ou senha inválidos.').waitFor();
    assert.ok(page.url().includes('/login'));
    await login(page, A.email.toUpperCase(), A.password);
    await page.getByRole('heading', { name: /Seja bem-vindo, Ana!/ }).waitFor();
    return 'senha errada: mensagem genérica e permanece no login; senha correta (e-mail em maiúsculas) entra';
  });

  await check(15, 'Logout com invalidação da sessão', 'Sair pelo menu + reutilizar o cookie antigo diretamente na API', async () => {
    const current = (await ctxA.cookies()).find((c) => c.name === 'se_session').value;
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByText('Você saiu da sua conta.').waitFor();
    await page.goto(`${BASE}/progresso`); await page.waitForURL('**/login');
    const api = await pwRequest.newContext();
    const r1 = await api.get(`${BASE}/api/auth/me`, { headers: { Cookie: `se_session=${current}` } });
    const r2 = await api.get(`${BASE}/api/auth/me`, { headers: { Cookie: `se_session=${oldCookie}` } });
    assert.equal(r1.status(), 401); assert.equal(r2.status(), 401);
    assert.equal(sql(`SELECT COUNT(*) FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = '${A.email}'`), '0');
    await api.dispose();
    return 'cookie copiado antes do logout passou a receber 401; nenhuma sessão do aluno no banco';
  });

  // 17 — dois alunos
  await check(17, 'Isolamento dos dados entre dois alunos', 'Aluno B em outro navegador tenta ver/alterar dados do aluno A', async () => {
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pb = await ctxB.newPage(); monitor(pb, 'aluno B');
    await register(pb, B.name, B.email, B.password);
    await pb.getByRole('heading', { name: 'Seja bem-vindo, Bruno!' }).waitFor();
    await pb.goto(`${BASE}/progresso`);
    await pb.getByText('Você ainda não fez exercícios.').waitFor();
    expectError(/GET .*\/api\/attempts\/\d+$/, 404);
    expectError(/POST .*\/api\/attempts\/\d+\/(answers|finish)$/, 404);
    await pb.goto(`${BASE}/tentativas/${firstAttemptId}`);
    await pb.getByText('Tentativa não encontrada.').waitFor();
    const r = await pb.evaluate(async (id) => {
      const s = (u, o) => fetch(u, { credentials: 'include', ...o }).then((x) => x.status);
      return [
        await s(`/api/attempts/${id}`),
        await s(`/api/attempts/${id}/finish`, { method: 'POST' }),
        await s(`/api/attempts/${id}/answers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: 1, optionId: 1 }) }),
        (await (await fetch('/api/attempts', { credentials: 'include' })).json()).total,
      ];
    }, firstAttemptId);
    assert.deepEqual(r, [404, 404, 404, 0]);
    expectError(/PATCH .*\/api\/users\/me/, 400);
    const patch = await pb.evaluate(async () => (await fetch('/api/users/me', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, name: 'Invasor' }) })).status);
    assert.equal(patch, 400);
    assert.equal(sql(`SELECT name FROM users WHERE email = '${A.email}'`), 'Ana Clara Validação');
    await ctxB.close();
    return 'B vê progresso vazio; tentativa de A → "não encontrada" (404 em leitura, resposta e finalização); PATCH com id recusado; dados de A intactos';
  });

  // 18 — computador e celular
  await check(18, 'Funcionamento em computador e celular', 'Fluxo em 390×844 (celular) e 1280×800 (computador); sem rolagem horizontal', async () => {
    const pages = ['/', '/materias/matematica', '/assuntos/funcoes-1-e-2-grau', '/progresso', '/configuracoes', '/pesquisa?q=juros'];
    const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const pm = await mob.newPage(); monitor(pm, 'celular');
    await login(pm, B.email, B.password);
    await pm.getByRole('heading', { name: /Seja bem-vindo/ }).waitFor();
    assert.equal(await pm.locator('.sidebar').isVisible(), false);
    await pm.getByRole('button', { name: 'Abrir menu' }).tap();
    await pm.waitForTimeout(400);
    await pm.screenshot({ path: `${SHOTS}/celular-menu.png` });
    await pm.getByRole('link', { name: 'Meu progresso', exact: true }).tap();
    await pm.waitForURL('**/progresso');
    await pm.locator('h1', { hasText: 'Meu progresso' }).waitFor();
    await pm.waitForFunction(() => !document.querySelector('.sidebar--open'), null, { timeout: 3000 });
    for (const path of pages) {
      await pm.goto(`${BASE}${path}`); await pm.locator('h1').waitFor(); await pm.waitForLoadState('networkidle');
      assert.ok(await noOverflow(pm), `rolagem horizontal no celular em ${path}`);
    }
    await pm.goto(`${BASE}/assuntos/funcoes-1-e-2-grau/exercicios`);
    await pm.getByRole('button', { name: 'Começar exercícios' }).tap();
    await pm.locator('.option').first().tap();
    await pm.getByRole('button', { name: 'Responder' }).tap();
    await pm.getByText(/Explicação:/).waitFor();
    assert.ok(await noOverflow(pm));
    await pm.screenshot({ path: `${SHOTS}/celular-exercicio.png`, fullPage: true });
    await mob.close();
    const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pd = await desk.newPage(); monitor(pd, 'computador');
    await login(pd, B.email, B.password); await pd.getByRole('heading', { name: /Seja bem-vindo/ }).waitFor();
    for (const path of pages) {
      await pd.goto(`${BASE}${path}`); await pd.locator('h1').waitFor(); await pd.waitForLoadState('networkidle');
      assert.ok(await noOverflow(pd), `rolagem horizontal no computador em ${path}`);
    }
    assert.equal(await pd.locator('.sidebar').isVisible(), true);
    await pd.getByRole('button', { name: 'Fechar menu' }).click();
    assert.equal(await pd.locator('.sidebar').isVisible(), false);
    await pd.getByRole('button', { name: 'Abrir menu' }).click();
    await desk.close();
    return 'celular: menu abre/fecha, navegação, exercício respondido, 6 páginas sem rolagem lateral; computador: 6 páginas ok e botão ☰ recolhe/expande o menu';
  });

  // Extra — links e botões
  await check('E1', 'Links, botões e formulários', 'Varredura de todos os links internos e nomes acessíveis dos botões', async () => {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); monitor(p, 'varredura');
    await login(p, B.email, B.password); await p.getByRole('heading', { name: /Seja bem-vindo/ }).waitFor();
    const seen = new Set(); const queue = ['/']; let unnamed = 0; let pagesVisited = 0;
    while (queue.length) {
      const path = queue.shift(); if (seen.has(path)) continue; seen.add(path);
      await p.goto(`${BASE}${path}`); await p.locator('h1').waitFor(); await p.waitForLoadState('networkidle'); pagesVisited++;
      const title = await p.locator('h1').innerText();
      assert.notEqual(title, 'Não encontrado', `link quebrado: ${path}`);
      unnamed += await p.evaluate(() => [...document.querySelectorAll('button, a')].filter((el) => !(el.getAttribute('aria-label') || el.textContent.trim())).length);
      const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
      for (const h of hrefs) {
        if (h.startsWith('#')) continue;
        assert.ok(h.startsWith('/'), `link externo/inesperado: ${h}`);
        if (!/^\/tentativas\//.test(h) && !seen.has(h)) queue.push(h);
      }
    }
    assert.equal(unnamed, 0, `${unnamed} botões/links sem nome`);
    await ctx.close();
    return `${pagesVisited} páginas alcançadas pelos links, nenhum link quebrado, todos os botões e links com nome acessível`;
  });

  // Extra — API indisponível (frontend servido pelo Vite, backend desligado)
  await check('E4', 'Tratamento de indisponibilidade da API', 'Frontend no Vite (porta 4173) com o backend desligado e religado', async () => {
    await stopServer();
    const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: `${ROOT}/frontend`, detached: true });
    await new Promise((r) => preview.stdout.on('data', (d) => String(d).includes('4173') && r()));
    expectError(/:4173\/api\//, 502);
    const ctx = await browser.newContext(); const p = await ctx.newPage(); monitor(p, 'API fora do ar');
    try {
      await p.goto('http://localhost:4173/');
      await p.getByText('O servidor está indisponível no momento.', { exact: false }).waitFor();
      await startServer();
      await p.getByRole('button', { name: 'Tentar novamente' }).click();
      await p.waitForURL('**/login');
      await p.getByLabel('E-mail').fill(B.email); await p.getByLabel('Senha').fill(B.password);
      await p.getByRole('button', { name: 'Entrar' }).click();
      await p.getByRole('heading', { name: /Seja bem-vindo/ }).waitFor();
      await p.getByRole('link', { name: 'Meu progresso', exact: true }).click();
      await p.getByText('Histórico de tentativas').waitFor();
      await stopServer();
      await p.getByRole('link', { name: 'Inicial' }).click();
      await p.getByText('Não foi possível carregar.').first().waitFor();
      await p.getByText('O servidor está indisponível no momento.', { exact: false }).first().waitFor();
      await p.screenshot({ path: `${SHOTS}/api-indisponivel.png` });
      // Exercício: falha ao enviar não perde a tela
      await startServer();
      await p.getByRole('button', { name: 'Tentar novamente' }).first().click();
      await p.getByRole('link', { name: /Matemática/ }).first().waitFor();
      await p.goto('http://localhost:4173/assuntos/estatistica/exercicios');
      await p.getByRole('button', { name: 'Começar exercícios' }).click();
      await p.locator('.option').first().click();
      await stopServer();
      await p.getByRole('button', { name: 'Responder' }).click();
      await p.getByRole('alert').filter({ hasText: 'indisponível' }).waitFor();
      assert.equal(await p.getByText('Questão 1 de 5').count(), 1);
      await startServer();
      await p.getByRole('button', { name: 'Responder' }).click();
      await p.getByText(/Explicação:/).waitFor();
      return 'sem API: aviso "servidor indisponível" com botão Tentar novamente (início, dados e envio de resposta); ao religar, a mesma tela continua e funciona';
    } finally {
      await ctx.close(); try { process.kill(-preview.pid, 'SIGTERM'); } catch { /* já encerrado */ }
      if (!server) await startServer();
    }
  });

  // Extra — gabarito
  await check('E2', 'Ausência de gabarito antes da submissão', 'Inspeção de TODAS as respostas JSON da API capturadas durante a validação', async () => {
    assert.deepEqual(leaks, []);
    return 'nenhuma resposta (fora da correção de uma questão já respondida) trouxe alternativa correta, explicação, senha ou hash';
  });

  // Extra — console e rede
  await check('E3', 'Ausência de erros no console e nas requisições', 'Monitor de console, erros de JavaScript e status HTTP ≥ 400 em todos os navegadores', async () => {
    assert.deepEqual(netIssues, [], `requisições com erro inesperado:\n${netIssues.join('\n')}`);
    assert.deepEqual(consoleIssues, [], `console:\n${consoleIssues.join('\n')}`);
    return 'nenhum erro de JavaScript; os únicos status ≥ 400 foram os provocados de propósito (senha errada, e-mail repetido, acesso sem login, invasão)';
  });

  await browser.close();
  await stopServer();
  console.log(JSON.stringify(results, null, 1));
  if (leaks.length) console.log('VAZAMENTOS:', leaks);
  if (netIssues.length || consoleIssues.length) console.log('DETALHES REDE:', netIssues, '\nCONSOLE:', consoleIssues);
})().catch(async (e) => { console.error('ERRO GERAL:', e); await stopServer(); process.exit(1); });
