import dotenv from 'dotenv';
import app from './app';
import { initDb } from './config/initDb';
import { setDbReady } from './config/dbState';

dotenv.config();

const PORT = Number(process.env.API_PORT || process.env.PORT) || 3001;

async function start() {
  // Listen before DB init so Docker health checks can hit /api/health while migrations run.
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => resolve());
    server.on('error', reject);
  });
  console.log(`API server listening on http://0.0.0.0:${PORT}`);

  await initDb();
  setDbReady(true);
  console.log('Database ready');
}

start().catch((err) => {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  const agg = err as { code?: string; errors?: Array<{ code?: string }> };
  const isConnRefused =
    code === 'ECONNREFUSED' ||
    (Array.isArray(agg.errors) && agg.errors.some((e) => e?.code === 'ECONNREFUSED'));

  const isTimedOut =
    code === 'ETIMEDOUT' ||
    (Array.isArray(agg.errors) && agg.errors.some((e) => e?.code === 'ETIMEDOUT'));

  if (isConnRefused) {
    console.error(
      'Cannot reach PostgreSQL (connection refused). Start Postgres and check DATABASE_URL in backend/.env ' +
        '(e.g. docker compose up -d postgres from the repo root, then use the same user/password/db as in compose).'
    );
  }
  if (isTimedOut) {
    console.error(
      'PostgreSQL connection timed out (ETIMEDOUT). The host:port is not reachable from this machine. ' +
        'For cloud DBs: add your IP to authorized networks / VPC firewall (allow TCP 5432), confirm the instance IP, ' +
        'and for Cloud SQL use the Cloud SQL Auth Proxy or a private connection instead of a public IP if required.'
    );
  }
  console.error('Failed to start API server:', err);
  process.exit(1);
});

