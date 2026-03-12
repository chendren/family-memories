import { Router } from 'express';
import { getDb } from '../db/sqlite.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_PAGE_SIZE } from '@family-memories/shared';
import type { Memory } from '@family-memories/shared';

const router = Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * limit;
    const personId = req.query.person_id as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const memoryType = req.query.type as string | undefined;

    let countSql = 'SELECT COUNT(DISTINCT m.id) as total FROM memories m';
    let querySql = `SELECT DISTINCT m.*,
      (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path
      FROM memories m`;

    const joins: string[] = [];
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (personId) {
      joins.push(' JOIN memory_people mp ON mp.memory_id = m.id');
      conditions.push('mp.family_member_id = ?');
      params.push(personId);
    }

    if (memoryType) {
      conditions.push('m.memory_type = ?');
      params.push(memoryType);
    }

    if (from) {
      conditions.push('COALESCE(m.memory_date, m.created_at) >= ?');
      params.push(from);
    }

    if (to) {
      conditions.push('COALESCE(m.memory_date, m.created_at) <= ?');
      params.push(to);
    }

    const joinStr = joins.join(' ');
    const whereStr = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    countSql += joinStr + whereStr;
    querySql += joinStr + whereStr + ' ORDER BY COALESCE(m.memory_date, m.created_at) DESC LIMIT ? OFFSET ?';

    const { total } = db.prepare(countSql).get(...params) as { total: number };
    const rows = db.prepare(querySql).all(...params, limit, offset) as Array<Memory & { thumbnail_path: string | null }>;

    res.json({
      data: rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get timeline');
    res.status(500).json({ code: 'TIMELINE_ERROR', message: 'Failed to get timeline' });
  }
});

export default router;
