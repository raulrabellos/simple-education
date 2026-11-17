// npm run iniciar — jeito mais simples de abrir o sistema:
// 1. cria o backend/.env (se ainda não existir), 2. confere se está tudo pronto,
// 3. gera o site (build do frontend) e 4. inicia o servidor em http://localhost:3001.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, 'backend', '.env');
const ENV_EXAMPLE = path.join(ROOT, 'backend', '.env.example');

// 1. Configuração: cria o backend/.env a partir do modelo (padrão do XAMPP: root sem senha).
if (!fs.existsSync(ENV_FILE)) {
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  console.log('\nCriei o arquivo backend/.env com a configuração padrão do XAMPP (usuário root, senha vazia).');
  console.log('Se o seu MySQL tem senha (MySQL Workbench/Server), coloque-a na linha DB_PASSWORD desse arquivo.');
}

// 2. Conferência (importada depois de criar o .env, para que ele seja lido).
const { runChecks } = await import('./verificar.mjs');
if (!(await runChecks())) {
  console.log('\nO sistema não foi iniciado. Corrija o item marcado com ✖ e rode "npm run iniciar" de novo.\n');
  process.exit(1);
}

// 3. Build do frontend (sempre, para nunca mostrar uma versão desatualizada do site).
console.log('\nGerando o site (alguns segundos)...\n');
// NODE_ENV=production explícito: o backend/.env (já lido neste processo) traz
// NODE_ENV=development, e o Vite geraria o React em modo de desenvolvimento.
const build = spawnSync('npm run build', {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' },
});
if (build.status !== 0) {
  console.log('\nNão foi possível gerar o site. Veja a mensagem acima; se falar de dependências, rode "npm install".\n');
  process.exit(1);
}

// 4. Servidor (site + API no mesmo endereço).
console.log('\nIniciando o servidor...\n');
await import('../backend/src/server.js');
