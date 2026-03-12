import { Router } from 'express';
import { getDb } from '../db/sqlite.js';
import { logger } from '../utils/logger.js';
import type { SearchResult, SearchResponse, SearchSuggestion, Memory, Tag, FamilyMemberRef } from '@family-memories/shared';

const router = Router();

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { query, filters, limit: maxResults } = req.body;
    const startTime = Date.now();

    if (!query || typeof query !== 'string') {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'query string is required' });
      return;
    }

    const resultLimit = Math.min(50, Math.max(1, maxResults ?? 20));
    const searchTerm = '%' + query.toLowerCase() + '%';

    let sql = `
      SELECT m.*,
        (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path
      FROM memories m
      WHERE (LOWER(m.title) LIKE ? OR LOWER(m.content) LIKE ?)
    `;
    const params: unknown[] = [searchTerm, searchTerm];

    if (filters?.types && filters.types.length > 0) {
      const placeholders = filters.types.map(() => '?').join(', ');
      sql += ` AND m.memory_type IN (${placeholders})`;
      params.push(...filters.types);
    }

    if (filters?.person_ids && filters.person_ids.length > 0) {
      const placeholders = filters.person_ids.map(() => '?').join(', ');
      sql += ` AND m.id IN (SELECT memory_id FROM memory_people WHERE family_member_id IN (${placeholders}))`;
      params.push(...filters.person_ids);
    }

    if (filters?.tags && filters.tags.length > 0) {
      const placeholders = filters.tags.map(() => '?').join(', ');
      sql += ` AND m.id IN (SELECT mt.memory_id FROM memory_tags mt JOIN tags t ON t.id = mt.tag_id WHERE t.name IN (${placeholders}))`;
      params.push(...filters.tags);
    }

    if (filters?.date_range?.from) {
      sql += ` AND m.memory_date >= ?`;
      params.push(filters.date_range.from);
    }
    if (filters?.date_range?.to) {
      sql += ` AND m.memory_date <= ?`;
      params.push(filters.date_range.to);
    }

    sql += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(resultLimit);

    const rows = db.prepare(sql).all(...params) as Array<Memory & { thumbnail_path: string | null }>;

    const results: SearchResult[] = rows.map((row) => {
      const { thumbnail_path, ...memory } = row;

      let snippet = '';
      const contentSource = memory.content ?? memory.title;
      const lowerContent = contentSource.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const idx = lowerContent.indexOf(lowerQuery);
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(contentSource.length, idx + query.length + 60);
        snippet = (start > 0 ? '...' : '') + contentSource.slice(start, end) + (end < contentSource.length ? '...' : '');
      } else {
        snippet = contentSource.slice(0, 150);
      }

      const tags = db.prepare(`
        SELECT t.id, t.name, t.category, mt.source, mt.confidence
        FROM tags t JOIN memory_tags mt ON mt.tag_id = t.id WHERE mt.memory_id = ?
      `).all(memory.id) as Tag[];

      const people = db.prepare(`
        SELECT mp.family_member_id, fm.name, fm.photo_path, mp.role, mp.source, mp.confidence
        FROM memory_people mp JOIN family_members fm ON fm.id = mp.family_member_id
        WHERE mp.memory_id = ?
      `).all(memory.id) as FamilyMemberRef[];

      return {
        memory,
        score: 1.0,
        snippet,
        highlights: [query],
        people,
        tags,
        thumbnail_path,
      };
    });

    const response: SearchResponse = {
      results,
      total: results.length,
      took_ms: Date.now() - startTime,
    };

    res.json({ data: response });
  } catch (err) {
    logger.error({ err }, 'Search failed');
    res.status(500).json({ code: 'SEARCH_ERROR', message: 'Search failed' });
  }
});

router.post('/conversational', (req, res) => {
  try {
    const db = getDb();
    const { query, limit: maxResults } = req.body;
    const startTime = Date.now();

    if (!query || typeof query !== 'string') {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'query string is required' });
      return;
    }

    const resultLimit = Math.min(50, Math.max(1, maxResults ?? 20));
    const searchTerm = '%' + query.toLowerCase() + '%';

    const rows = db.prepare(`
      SELECT m.*,
        (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path
      FROM memories m
      WHERE LOWER(m.title) LIKE ? OR LOWER(m.content) LIKE ?
      ORDER BY m.created_at DESC LIMIT ?
    `).all(searchTerm, searchTerm, resultLimit) as Array<Memory & { thumbnail_path: string | null }>;

    const results: SearchResult[] = rows.map((row) => {
      const { thumbnail_path, ...memory } = row;
      const contentSource = memory.content ?? memory.title;
      const snippet = contentSource.slice(0, 150);

      return {
        memory,
        score: 1.0,
        snippet,
        highlights: [query],
        people: [],
        tags: [],
        thumbnail_path,
      };
    });

    const response: SearchResponse = {
      results,
      total: results.length,
      took_ms: Date.now() - startTime,
    };

    res.json({ data: response });
  } catch (err) {
    logger.error({ err }, 'Conversational search failed');
    res.status(500).json({ code: 'SEARCH_ERROR', message: 'Search failed' });
  }
});

router.get('/suggest', (req, res) => {
  try {
    const db = getDb();
    const q = (req.query.q as string ?? '').toLowerCase().trim();

    if (!q || q.length < 1) {
      res.json({ data: [] });
      return;
    }

    const searchTerm = '%' + q + '%';

    const tagSuggestions = db.prepare(
      'SELECT id, name FROM tags WHERE LOWER(name) LIKE ? LIMIT 5',
    ).all(searchTerm) as Array<{ id: string; name: string }>;

    const personSuggestions = db.prepare(
      'SELECT id, name FROM family_members WHERE LOWER(name) LIKE ? LIMIT 5',
    ).all(searchTerm) as Array<{ id: string; name: string }>;

    const suggestions: SearchSuggestion[] = [
      ...tagSuggestions.map((t) => ({ text: t.name, type: 'tag' as const, id: t.id })),
      ...personSuggestions.map((p) => ({ text: p.name, type: 'person' as const, id: p.id })),
    ];

    res.json({ data: suggestions });
  } catch (err) {
    logger.error({ err }, 'Suggest failed');
    res.status(500).json({ code: 'SUGGEST_ERROR', message: 'Suggest failed' });
  }
});

export default router;
