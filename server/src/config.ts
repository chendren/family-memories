import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const config = {
  PORT: Number(process.env.PORT ?? 3142),
  DATA_DIR: path.resolve(process.env.DATA_DIR ?? path.join(PROJECT_ROOT, 'data')),
  OLLAMA_URL: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
} as const;
