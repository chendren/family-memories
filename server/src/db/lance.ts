import { connect } from '@lancedb/lancedb';
import type { Connection } from '@lancedb/lancedb';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let lanceDb: Connection | null = null;

export async function getLanceDb(): Promise<Connection> {
  if (!lanceDb) {
    throw new Error('LanceDB not initialized. Call initLanceDb() first.');
  }
  return lanceDb;
}

export async function initLanceDb(): Promise<Connection> {
  if (lanceDb) return lanceDb;

  const vectorDir = path.join(config.DATA_DIR, 'vectordb');
  mkdirSync(vectorDir, { recursive: true });

  lanceDb = await connect(vectorDir);
  logger.info({ vectorDir }, 'LanceDB initialized');

  return lanceDb;
}

export async function closeLanceDb(): Promise<void> {
  if (lanceDb) {
    await lanceDb.close();
    lanceDb = null;
    logger.info('LanceDB closed');
  }
}
