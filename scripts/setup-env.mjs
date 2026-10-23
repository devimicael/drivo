// Gera os arquivos de ambiente locais a partir dos .env.example.
// - Não sobrescreve ambientes já existentes.
// - Gera JWT_SECRET / CSRF_SECRET aleatórios (32 bytes) no apps/api/.env.
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  { label: 'API', example: 'apps/api/.env.example', dest: 'apps/api/.env', secret: true },
  { label: 'Web', example: 'apps/web/.env.example', dest: 'apps/web/.env.local', secret: false },
];

let created = 0;

for (const { label, example, dest, secret } of targets) {
  const from = join(root, example);
  const to = join(root, dest);

  if (!existsSync(from)) {
    console.error(`[setup] ${label}: exemplo ausente em ${example}`);
    process.exitCode = 1;
    continue;
  }

  if (existsSync(to)) {
    console.log(`[setup] ${label}: ${dest} já existe — mantido.`);
    continue;
  }

  copyFileSync(from, to);

  if (secret) {
    const content = readFileSync(to, 'utf8')
      .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`)
      .replace(/^CSRF_SECRET=.*$/m, `CSRF_SECRET=${randomBytes(32).toString('hex')}`);
    writeFileSync(to, content);
  }

  created += 1;
  console.log(`[setup] ${label}: ${dest} criado${secret ? ' (segredos gerados)' : ''}.`);
}

console.log(
  created
    ? `[setup] Pronto. Ajuste GOOGLE_API_KEY em apps/api/.env se quiser testar o import de CRLV.`
    : '[setup] Nada a fazer.',
);
