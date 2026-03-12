import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { mkdirSync, renameSync } from 'node:fs';
import { getDb } from '../db/sqlite.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { enqueue } from '../jobs/queue.js';
import { uploadLimiter } from '../middleware/rate-limit.js';
import { broadcast } from './ws.js';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE } from '@family-memories/shared';
import type { MemoryType } from '@family-memories/shared';

const router = Router();

function getMemoryTypeFromMime(mimeType: string): MemoryType {
  const allMimeTypes = ACCEPTED_MIME_TYPES;
  for (const [type, mimes] of Object.entries(allMimeTypes)) {
    if (mimes.includes(mimeType)) return type as MemoryType;
  }
  return 'document';
}

function getExtension(originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return originalName.slice(lastDot);
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const tempDir = path.join(config.DATA_DIR, 'media', 'uploads');
    mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename(_req, file, cb) {
    const ext = getExtension(file.originalname);
    cb(null, newId() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

router.post('/', uploadLimiter, upload.single('file'), (req, res) => {
  try {
    const db = getDb();
    const { title, content, person_ids, tag_names, memory_date, location } = req.body;
    const file = req.file;

    if (!title) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title is required' });
      return;
    }

    const memoryId = newId();
    const now = new Date().toISOString();
    let memoryType: MemoryType = 'text';

    if (file) {
      memoryType = getMemoryTypeFromMime(file.mimetype);
    }

    db.prepare(`
      INSERT INTO memories (id, title, content, memory_type, memory_date, location, processing_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(memoryId, title, content ?? null, memoryType, memory_date ?? null, location ?? null, now, now);

    if (file) {
      const destDir = path.join(config.DATA_DIR, 'media', 'originals', memoryId);
      mkdirSync(destDir, { recursive: true });

      const ext = getExtension(file.originalname);
      const destFilename = newId() + ext;
      const destPath = path.join(destDir, destFilename);

      renameSync(file.path, destPath);

      const relativePath = path.join('media', 'originals', memoryId, destFilename);
      const assetId = newId();

      db.prepare(`
        INSERT INTO media_assets (id, memory_id, file_path, mime_type, file_size, original_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(assetId, memoryId, relativePath, file.mimetype, file.size, file.originalname, now);
    }

    let parsedPersonIds: string[] = [];
    if (person_ids) {
      parsedPersonIds = typeof person_ids === 'string' ? JSON.parse(person_ids) : person_ids;
    }
    if (Array.isArray(parsedPersonIds)) {
      const insertPeople = db.prepare('INSERT OR IGNORE INTO memory_people (memory_id, family_member_id) VALUES (?, ?)');
      for (const personId of parsedPersonIds) {
        insertPeople.run(memoryId, personId);
      }
    }

    let parsedTagNames: string[] = [];
    if (tag_names) {
      parsedTagNames = typeof tag_names === 'string' ? JSON.parse(tag_names) : tag_names;
    }
    if (Array.isArray(parsedTagNames)) {
      const findTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
      const linkTag = db.prepare('INSERT OR IGNORE INTO memory_tags (memory_id, tag_id) VALUES (?, ?)');

      for (const tagName of parsedTagNames) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let existing = findTag.get(trimmed) as { id: string } | undefined;
        if (!existing) {
          const tagId = newId();
          insertTag.run(tagId, trimmed);
          existing = { id: tagId };
        }
        linkTag.run(memoryId, existing.id);
      }
    }

    if (file && (memoryType === 'photo' || memoryType === 'video')) {
      enqueue('thumbnail', memoryId);
    }
    enqueue('embed', memoryId);
    enqueue('summarize', memoryId);
    enqueue('extract', memoryId);

    broadcast('memory:created', { id: memoryId, title, memory_type: memoryType, processing_status: 'pending' });

    res.status(202).json({ data: { id: memoryId, processing_status: 'pending' } });
  } catch (err) {
    logger.error({ err }, 'Failed to capture memory');
    res.status(500).json({ code: 'CAPTURE_ERROR', message: 'Failed to capture memory' });
  }
});

export default router;
