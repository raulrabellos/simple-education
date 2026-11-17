/**
 * Traduz os erros mais comuns ao conectar no MySQL/MariaDB em mensagens em
 * português, com o que fazer em cada caso (XAMPP e MySQL Workbench/Server).
 * Não importa o mysql2: pode ser usado mesmo antes do "npm install".
 */

const ENV_FILE = 'backend/.env';

/**
 * @param {Error & { code?: string }} err
 * @param {{ host?: string, port?: number, user?: string, appPort?: number }} info
 * @returns {{ title: string, hints: string[] }}
 */
export function explainDbError(err, info = {}) {
  const host = info.host || 'localhost';
  const port = info.port || 3306;
  const user = info.user || 'root';
  const where = `${host}:${port}`;

  switch (err?.code) {
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'PROTOCOL_CONNECTION_LOST':
      return {
        title: `Não foi possível conectar ao MySQL em ${where} (MySQL desligado ou em outra porta).`,
        hints: [
          'XAMPP: abra o XAMPP Control Panel e clique em "Start" na linha do MySQL (ela deve ficar verde).',
          'MySQL Workbench/Server: no Windows, abra "Serviços" (services.msc) e inicie o serviço do MySQL (normalmente "MySQL80" ou "MySQL84").',
          `Se o seu MySQL usa outra porta (o XAMPP mostra a porta ao lado de "MySQL"), ajuste DB_PORT em ${ENV_FILE}.`,
        ],
      };
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return {
        title: `O endereço do MySQL "${host}" não foi encontrado.`,
        hints: [`Em ${ENV_FILE}, use DB_HOST=localhost (o MySQL instalado no seu computador).`],
      };
    case 'ER_ACCESS_DENIED_ERROR':
      return {
        title: `O MySQL recusou o usuário "${user}" ou a senha.`,
        hints: [
          `XAMPP: normalmente o usuário é root e a senha é vazia. Em ${ENV_FILE} deixe DB_USER=root e DB_PASSWORD= (sem nada depois do "=").`,
          `MySQL Workbench/Server: use a senha do root que você criou na instalação (a mesma que o Workbench pede). Coloque em ${ENV_FILE}, na linha DB_PASSWORD=sua_senha.`,
          'Se a senha tiver # ou espaço, coloque-a entre aspas: DB_PASSWORD="minha#senha" (sem aspas, tudo depois do # é ignorado).',
          'Para testar: no Workbench, abra a conexão "Local instance" com esse mesmo usuário e senha.',
        ],
      };
    case 'ER_DBACCESS_DENIED_ERROR':
    case 'ER_DBACCESS_DENIED':
      return {
        title: `O usuário "${user}" não tem permissão para criar o banco do sistema.`,
        hints: [`Use o usuário root em ${ENV_FILE} (DB_USER=root), que tem essa permissão.`],
      };
    case 'ER_PARSE_ERROR':
      return {
        title: 'O MySQL recusou um comando de criação do banco: a versão do MySQL parece antiga demais.',
        hints: [
          'O sistema precisa de MySQL 8.0.19+ ou MariaDB 10.2+. Rode "npm run verificar" para ver a versão instalada.',
          'XAMPP: instale uma versão recente do XAMPP (8.x), que já vem com um MariaDB compatível.',
        ],
      };
    case 'EADDRINUSE': {
      const appPort = info.appPort || 3001;
      return {
        title: `A porta ${appPort} já está em uso: o sistema provavelmente já está aberto em outro terminal.`,
        hints: [
          `Abra http://localhost:${appPort} no navegador: se o site aparecer, ele já está rodando.`,
          'Para parar a outra execução: vá no terminal dela e aperte Ctrl+C (ou feche esse terminal).',
          `Ou escolha outra porta em ${ENV_FILE}, na linha PORT=3002.`,
        ],
      };
    }
    default:
      return {
        title: `Erro inesperado: ${err?.message || err}`,
        hints: [`Confira se o MySQL está ligado e os dados de acesso em ${ENV_FILE}. Rode "npm run verificar" para um diagnóstico.`],
      };
  }
}

const MINIMUM = { MySQL: '8.0.19', MariaDB: '10.2.0' };

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

/**
 * Confere a versão devolvida por SELECT VERSION().
 * Ex.: "8.0.46", "10.4.32-MariaDB", "5.5.5-10.11.14-MariaDB-0ubuntu0.24.04.1".
 * @returns {{ ok: boolean, product: 'MySQL'|'MariaDB', version: string, minimum: string }}
 */
export function checkServerVersion(versionString) {
  const raw = String(versionString || '');
  const product = /mariadb/i.test(raw) ? 'MariaDB' : 'MySQL';
  // Algumas versões do MariaDB se apresentam com o prefixo "5.5.5-".
  const cleaned = product === 'MariaDB' ? raw.replace(/^5\.5\.5-/, '') : raw;
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  const version = match ? match.slice(1).join('.') : cleaned;
  const minimum = MINIMUM[product];
  return { ok: Boolean(match) && compareVersions(version, minimum) >= 0, product, version, minimum };
}

/** Texto pronto para o terminal: título e, embaixo, as dicas. */
export function formatProblem({ title, hints }) {
  return [title, ...hints.map((h) => `  → ${h}`)].join('\n');
}
