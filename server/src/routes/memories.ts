import { Router } from 'express';
import { getDb } from '../db/sqlite.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import { processMemory } from '../services/memory-agent.js';
import { deleteByMemoryId } from '../services/vectordb.js';
import { DEFAULT_PAGE_SIZE } from '@family-memories/shared';
import type { Memory, MemoryWithRelations, MediaAsset, Tag, FamilyMemberRef, Entity, MemoryConnection } from '@family-memories/shared';

const router = Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * limit;
    const memoryType = req.query.type as string | undefined;
    const personId = req.query.person_id as string | undefined;
    const tag = req.query.tag as string | undefined;

    let countSql = 'SELECT COUNT(DISTINCT m.id) as total FROM memories m';
    let querySql = `SELECT DISTINCT m.*, (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path FROM memories m`;
    const joins: string[] = [];
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (personId) {
      joins.push(' JOIN memory_people mp ON mp.memory_id = m.id');
      conditions.push('mp.family_member_id = ?');
      params.push(personId);
    }

    if (tag) {
      joins.push(' JOIN memory_tags mt ON mt.memory_id = m.id JOIN tags t ON t.id = mt.tag_id');
      conditions.push('t.name = ?');
      params.push(tag);
    }

    if (memoryType) {
      conditions.push('m.memory_type = ?');
      params.push(memoryType);
    }

    const joinStr = joins.join(' ');
    const whereStr = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    countSql += joinStr + whereStr;
    querySql += joinStr + whereStr + ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';

    const { total } = db.prepare(countSql).get(...params) as { total: number };
    const rows = db.prepare(querySql).all(...params, limit, offset) as Array<Memory & { thumbnail_path: string | null }>;

    res.json({
      data: rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to list memories');
    res.status(500).json({ code: 'LIST_ERROR', message: 'Failed to list memories' });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { title, content, memory_type, memory_date, location, person_ids, tag_names } = req.body;

    if (!title || !memory_type) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title and memory_type are required' });
      return;
    }

    const id = newId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO memories (id, title, content, memory_type, memory_date, location, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content ?? null, memory_type, memory_date ?? null, location ?? null, now, now);

    if (person_ids && Array.isArray(person_ids)) {
      const insertPeople = db.prepare('INSERT OR IGNORE INTO memory_people (memory_id, family_member_id) VALUES (?, ?)');
      for (const personId of person_ids) {
        insertPeople.run(id, personId);
      }
    }

    if (tag_names && Array.isArray(tag_names)) {
      const findTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
      const linkTag = db.prepare('INSERT OR IGNORE INTO memory_tags (memory_id, tag_id) VALUES (?, ?)');

      for (const tagName of tag_names) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let existing = findTag.get(trimmed) as { id: string } | undefined;
        if (!existing) {
          const tagId = newId();
          insertTag.run(tagId, trimmed);
          existing = { id: tagId };
        }
        linkTag.run(id, existing.id);
      }
    }

    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory;

    // Kick off AI processing pipeline (embed, summarize, extract)
    processMemory(id).catch((err) => {
      logger.error({ err, memoryId: id }, 'Failed to enqueue memory processing');
    });

    res.status(201).json({ data: memory });
  } catch (err) {
    logger.error({ err }, 'Failed to create memory');
    res.status(500).json({ code: 'CREATE_ERROR', message: 'Failed to create memory' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined;
    if (!memory) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Memory not found' });
      return;
    }

    const assets = db.prepare('SELECT * FROM media_assets WHERE memory_id = ?').all(id) as MediaAsset[];

    const tags = db.prepare(`
      SELECT t.id, t.name, t.category, mt.source, mt.confidence
      FROM tags t JOIN memory_tags mt ON mt.tag_id = t.id
      WHERE mt.memory_id = ?
    `).all(id) as Tag[];

    const people = db.prepare(`
      SELECT mp.family_member_id, fm.name, fm.photo_path, mp.role, mp.source, mp.confidence
      FROM memory_people mp JOIN family_members fm ON fm.id = mp.family_member_id
      WHERE mp.memory_id = ?
    `).all(id) as FamilyMemberRef[];

    const entities = db.prepare('SELECT * FROM entities WHERE memory_id = ?').all(id) as Entity[];

    const result: MemoryWithRelations = { ...memory, assets, tags, people, entities };
    res.json({ data: result });
  } catch (err) {
    logger.error({ err }, 'Failed to get memory');
    res.status(500).json({ code: 'GET_ERROR', message: 'Failed to get memory' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined;
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Memory not found' });
      return;
    }

    const { title, content, memory_date, location } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE memories SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        memory_date = COALESCE(?, memory_date),
        location = COALESCE(?, location),
        updated_at = ?
      WHERE id = ?
    `).run(title ?? null, content ?? null, memory_date ?? null, location ?? null, now, id);

    const updated = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory;
    res.json({ data: updated });
  } catch (err) {
    logger.error({ err }, 'Failed to update memory');
    res.status(500).json({ code: 'UPDATE_ERROR', message: 'Failed to update memory' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined;
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Memory not found' });
      return;
    }

    db.prepare('DELETE FROM memories WHERE id = ?').run(id);

    // Clean up vectors from LanceDB
    deleteByMemoryId(id).catch((err) => {
      logger.error({ err, memoryId: id }, 'Failed to delete vectors');
    });

    res.status(204).end();
  } catch (err) {
    logger.error({ err }, 'Failed to delete memory');
    res.status(500).json({ code: 'DELETE_ERROR', message: 'Failed to delete memory' });
  }
});

router.get('/:id/related', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const connections = db.prepare(`
      SELECT mc.*, m.title, m.memory_type, m.memory_date,
        (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path
      FROM memory_connections mc
      JOIN memories m ON m.id = CASE WHEN mc.source_memory_id = ? THEN mc.target_memory_id ELSE mc.source_memory_id END
      WHERE mc.source_memory_id = ? OR mc.target_memory_id = ?
      ORDER BY mc.strength DESC
    `).all(id, id, id) as Array<MemoryConnection & { title: string; memory_type: string; memory_date: string | null; thumbnail_path: string | null }>;

    res.json({ data: connections });
  } catch (err) {
    logger.error({ err }, 'Failed to get related memories');
    res.status(500).json({ code: 'RELATED_ERROR', message: 'Failed to get related memories' });
  }
});

export default router;
