import { Router } from 'express';
import { statfs } from 'node:fs/promises';
import { config } from '../config.js';
import { getDb } from '../db/sqlite.js';
import { redisPing } from '../services/cache.js';
import { logger } from '../utils/logger.js';
import type { HealthStatus, AppStats } from '@family-memories/shared';

const router = Router();

router.get('/health', async (_req, res) => {
  let ollamaOk = false;
  try {
    const resp = await fetch(config.OLLAMA_URL);
    ollamaOk = resp.ok;
  } catch {
    ollamaOk = false;
  }

  let sqliteOk = false;
  try {
    const db = getDb();
    const row = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined;
    sqliteOk = row?.ok === 1;
  } catch {
    sqliteOk = false;
  }

  let redisOk = false;
  try {
    redisOk = await redisPing();
  } catch {
    redisOk = false;
  }

  let diskFree = 'unknown';
  try {
    const stats = await statfs(config.DATA_DIR);
    const freeBytes = stats.bfree * stats.bsize;
    const freeGb = freeBytes / (1024 * 1024 * 1024);
    diskFree = freeGb.toFixed(1) + ' GB';
  } catch {
    diskFree = 'unknown';
  }

  const status: HealthStatus = {
    ollama: ollamaOk,
    sqlite: sqliteOk,
    lancedb: true,
    redis: redisOk,
    disk_free: diskFree,
  };

  res.json({ data: status });
});

router.get('/stats', (_req, res) => {
  try {
    const db = getDb();

    const memories = (db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number }).count;
    const family_members = (db.prepare('SELECT COUNT(*) as count FROM family_members').get() as { count: number }).count;
    const relationships = (db.prepare('SELECT COUNT(*) as count FROM relationships').get() as { count: number }).count;
    const media_assets = (db.prepare('SELECT COUNT(*) as count FROM media_assets').get() as { count: number }).count;
    const tags = (db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number }).count;

    const sizeRow = db.prepare('SELECT COALESCE(SUM(file_size), 0) as total FROM media_assets').get() as { total: number };
    const totalBytes = sizeRow.total;
    let media_size: string;
    if (totalBytes < 1024 * 1024) {
      media_size = (totalBytes / 1024).toFixed(1) + ' KB';
    } else if (totalBytes < 1024 * 1024 * 1024) {
      media_size = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      media_size = (totalBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    const stats: AppStats = { memories, family_members, relationships, media_assets, tags, media_size };
    res.json({ data: stats });
  } catch (err) {
    logger.error({ err }, 'Failed to get stats');
    res.status(500).json({ code: 'STATS_ERROR', message: 'Failed to retrieve stats' });
  }
});

export default router;
