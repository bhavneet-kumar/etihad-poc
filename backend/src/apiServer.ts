import dotenv from 'dotenv';
import app from './app';
import { initDb } from './config/initDb';

dotenv.config();

const PORT = Number(process.env.API_PORT) || 8080;

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});

