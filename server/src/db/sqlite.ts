import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { runMigrations } from './migrations.js';
import { logger } from '../utils/logger.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(): Database.Database {
  if (db) return db;

  mkdirSync(config.DATA_DIR, { recursive: true });

  const dbPath = path.join(config.DATA_DIR, 'family-memories.db');
  db = new Database(dbPath);

  runMigrations(db);
  logger.info({ dbPath }, 'SQLite initialized');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('SQLite closed');
  }
}
