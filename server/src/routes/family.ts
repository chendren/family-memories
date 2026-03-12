import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { getDb } from '../db/sqlite.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { uploadLimiter } from '../middleware/rate-limit.js';
import { familyGraph } from '../services/family-graph.js';
import type {
  FamilyMemberCreate,
  FamilyMemberUpdate,
  FamilyMemberWithMemories,
  RelationshipCreate,
} from '@family-memories/shared';

const router = Router();

function getExtension(originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return originalName.slice(lastDot);
}

const photoStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(config.DATA_DIR, 'media', 'photos');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = getExtension(file.originalname);
    cb(null, newId() + ext);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/members', (_req, res) => {
  try {
    const db = getDb();
    const members = familyGraph.getAllMembers(db);
    res.json({ data: members });
  } catch (err) {
    logger.error({ err }, 'Failed to list family members');
    res.status(500).json({ code: 'LIST_ERROR', message: 'Failed to list family members' });
  }
});

router.post('/members', (req, res) => {
  try {
    const db = getDb();
    const input = req.body as FamilyMemberCreate;

    if (!input.name || input.name.trim().length === 0) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'name is required' });
      return;
    }

    const member = familyGraph.addMember(db, input);
    res.status(201).json({ data: member });
  } catch (err) {
    logger.error({ err }, 'Failed to create family member');
    res.status(500).json({ code: 'CREATE_ERROR', message: 'Failed to create family member' });
  }
});

router.get('/members/:id', (req, res) => {
  try {
    const db = getDb();
    const result = familyGraph.getMemberWithMemories(db, req.params.id);

    if (!result) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Family member not found' });
      return;
    }

    res.json({ data: result });
  } catch (err) {
    logger.error({ err }, 'Failed to get family member');
    res.status(500).json({ code: 'GET_ERROR', message: 'Failed to get family member' });
  }
});

router.put('/members/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = familyGraph.getMember(db, req.params.id);
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Family member not found' });
      return;
    }

    const updates = req.body as FamilyMemberUpdate;
    const member = familyGraph.updateMember(db, req.params.id, updates);
    res.json({ data: member });
  } catch (err) {
    logger.error({ err }, 'Failed to update family member');
    res.status(500).json({ code: 'UPDATE_ERROR', message: 'Failed to update family member' });
  }
});

router.delete('/members/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = familyGraph.getMember(db, req.params.id);
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Family member not found' });
      return;
    }

    familyGraph.removeMember(db, req.params.id);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, 'Failed to delete family member');
    res.status(500).json({ code: 'DELETE_ERROR', message: 'Failed to delete family member' });
  }
});

router.post('/members/:id/photo', uploadLimiter, photoUpload.single('photo'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const file = req.file;

    const memberId = Array.isArray(id) ? id[0] : id;
    const existing = familyGraph.getMember(db, memberId);
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Family member not found' });
      return;
    }

    if (!file) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'photo file is required' });
      return;
    }

    const relativePath = path.join('media', 'photos', file.filename);
    const now = new Date().toISOString();

    db.prepare('UPDATE family_members SET photo_path = ?, updated_at = ? WHERE id = ?').run(relativePath, now, memberId);

    const updated = db.prepare('SELECT * FROM family_members WHERE id = ?').get(memberId);
    res.json({ data: updated });
  } catch (err) {
    logger.error({ err }, 'Failed to upload member photo');
    res.status(500).json({ code: 'UPLOAD_ERROR', message: 'Failed to upload photo' });
  }
});

router.get('/relationships', (_req, res) => {
  try {
    const db = getDb();
    const relationships = familyGraph.getAllRelationships(db);
    res.json({ data: relationships });
  } catch (err) {
    logger.error({ err }, 'Failed to list relationships');
    res.status(500).json({ code: 'LIST_ERROR', message: 'Failed to list relationships' });
  }
});

router.post('/relationships', (req, res) => {
  try {
    const db = getDb();
    const input = req.body as RelationshipCreate;

    if (!input.from_member_id || !input.to_member_id || !input.relationship_type) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'from_member_id, to_member_id, and relationship_type are required',
      });
      return;
    }

    const relationship = familyGraph.addRelationship(db, input);
    res.status(201).json({ data: relationship });
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number };
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      logger.error({ err }, 'Failed to create relationship');
    }
    res.status(status).json({ code: 'CREATE_ERROR', message: error.message });
  }
});

router.delete('/relationships/:id', (req, res) => {
  try {
    const db = getDb();
    familyGraph.removeRelationship(db, req.params.id);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, 'Failed to delete relationship');
    res.status(500).json({ code: 'DELETE_ERROR', message: 'Failed to delete relationship' });
  }
});

router.get('/tree', (_req, res) => {
  try {
    const db = getDb();
    const tree = familyGraph.getTreeData(db);
    res.json({ data: tree });
  } catch (err) {
    logger.error({ err }, 'Failed to build family tree');
    res.status(500).json({ code: 'TREE_ERROR', message: 'Failed to build family tree' });
  }
});

router.get('/members/:id/ancestors', (req, res) => {
  try {
    const db = getDb();
    const ancestors = familyGraph.getAncestors(req.params.id);
    const members = ancestors
      .map((id) => familyGraph.getMember(db, id))
      .filter(Boolean);
    res.json({ data: members });
  } catch (err) {
    logger.error({ err }, 'Failed to get ancestors');
    res.status(500).json({ code: 'ANCESTORS_ERROR', message: 'Failed to get ancestors' });
  }
});

router.get('/members/:id/descendants', (req, res) => {
  try {
    const db = getDb();
    const descendants = familyGraph.getDescendants(req.params.id);
    const members = descendants
      .map((id) => familyGraph.getMember(db, id))
      .filter(Boolean);
    res.json({ data: members });
  } catch (err) {
    logger.error({ err }, 'Failed to get descendants');
    res.status(500).json({ code: 'DESCENDANTS_ERROR', message: 'Failed to get descendants' });
  }
});

router.get('/path/:fromId/:toId', (req, res) => {
  try {
    const db = getDb();
    const result = familyGraph.getShortestPath(req.params.fromId, req.params.toId);
    if (!result) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'No path found between these members' });
      return;
    }

    const pathMembers = result.path
      .map((id) => familyGraph.getMember(db, id))
      .filter(Boolean);

    res.json({
      data: {
        path: pathMembers,
        steps: result.steps,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to compute path');
    res.status(500).json({ code: 'PATH_ERROR', message: 'Failed to compute path' });
  }
});

export default router;
