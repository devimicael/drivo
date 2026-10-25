import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export default function setup() {
  const databaseUrl =
    process.env.DATABASE_URL_TEST ??
    'postgresql://drivo:drivo@localhost:5433/drivo_test?schema=public';
  const database = new URL(databaseUrl).pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(
      'DATABASE_URL_TEST deve apontar para um banco isolado com sufixo _test.',
    );
  }
  const apiRoot = fileURLToPath(new URL('../', import.meta.url));
  const prismaCli = fileURLToPath(
    new URL('../node_modules/prisma/build/index.js', import.meta.url),
  );
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}
