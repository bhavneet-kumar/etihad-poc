import { Pool, PoolClient, type PoolConfig, type QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function buildPoolConfig(): PoolConfig {
  const ssl =
    process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined;

  const url = process.env.DATABASE_URL?.trim();

  // When DATABASE_URL is set, use it alone — do not merge PGHOST/PGPORT etc., or a local .env
  // (e.g. PGHOST=localhost) would override the hostname from the URL and break Docker Compose.
  if (url) {
    return { connectionString: url, ssl };
  }

  const hasPgEnv =
    process.env.PGHOST ||
    process.env.PGUSER ||
    process.env.PGDATABASE ||
    process.env.PGPASSWORD ||
    process.env.PGPORT;

  if (!hasPgEnv) {
    throw new Error(
      'DATABASE_URL is not set in backend/.env. Copy .env.example to .env and set DATABASE_URL. ' +
        'Start Postgres first (e.g. from repo root: docker compose up -d postgres), then use something like: ' +
        'postgresql://claimuser:claimpass@localhost:5432/claims_db (match POSTGRES_* in your .env).'
    );
  }

  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl,
  };
}

const pool = new Pool(buildPoolConfig());

export const query = async <T extends QueryResultRow = any>(text: string, params: any[] = []) => {
  const result = await pool.query<T>(text, params);
  return result.rows;
};

export const execute = async (text: string, params: any[] = []) => {
  return pool.query(text, params);
};

export const exec = async (text: string) => {
  return pool.query(text);
};

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
