import { getDb } from '../../db/sqlite.js';
import { generate } from '../../services/ollama.js';
import { newId } from '../../utils/id.js';
import { checkMemoryCompletion } from '../completion.js';
import { broadcast } from '../../routes/ws.js';
import { logger } from '../../utils/logger.js';
import type { Job } from '../queue.js';
import type { Memory } from '@family-memories/shared';

interface ExtractedEntities {
  people?: Array<{ name: string; role?: string }>;
  places?: Array<{ name: string }>;
  dates?: Array<{ value: string; context?: string }>;
  events?: Array<{ name: string }>;
  suggested_tags?: string[];
  sentiment?: number;
}

function parseJsonFromResponse(response: string): ExtractedEntities | null {
  // Find JSON in the response (SLM might include extra text around it)
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  try {
    return JSON.parse(response.substring(jsonStart, jsonEnd + 1)) as ExtractedEntities;
  } catch {
    return null;
  }
}

export async function processExtractJob(job: Job): Promise<void> {
  const db = getDb();
  const memory = db
    .prepare('SELECT * FROM memories WHERE id = ?')
    .get(job.memory_id) as Memory | undefined;

  if (!memory?.content) {
    logger.warn({ memoryId: job.memory_id }, 'Extract job: no content');
    return;
  }

  // Truncate for prompt
  const contentForPrompt = memory.content.length > 6000
    ? memory.content.substring(0, 6000) + '...'
    : memory.content;

  const response = await generate(
    `Extract entities from this family memory. Return ONLY valid JSON with no other text:\n{\n  "people": [{"name": "string", "role": "string"}],\n  "places": [{"name": "string"}],\n  "dates": [{"value": "string", "context": "string"}],\n  "events": [{"name": "string"}],\n  "suggested_tags": ["string"],\n  "sentiment": 0.0\n}\n\nSentiment should be a float from -1.0 (very sad) to 1.0 (very happy).\n\nMemory:\n${contentForPrompt}`,
    'You are a precise entity extraction system. Return only valid JSON. Do not include any explanation or commentary.',
  );

  const extracted = parseJsonFromResponse(response);
  if (!extracted) {
    logger.warn(
      { memoryId: job.memory_id, responseLength: response.length },
      'Extract job: failed to parse entity extraction response',
    );
    return;
  }

  const insertEntity = db.prepare(
    'INSERT INTO entities (id, memory_id, entity_type, value, context, confidence) VALUES (?, ?, ?, ?, ?, ?)',
  );

  // Extract people and attempt fuzzy match to family members
  for (const person of extracted.people ?? []) {
    if (!person.name || person.name.trim().length === 0) continue;

    insertEntity.run(
      newId(),
      job.memory_id,
      'person',
      person.name,
      person.role ?? null,
      0.8,
    );

    // Try to match to existing family members by name substring
    const searchName = '%' + person.name.trim() + '%';
    const member = db
      .prepare(
        'SELECT id FROM family_members WHERE name LIKE ? OR nickname LIKE ?',
      )
      .get(searchName, searchName) as { id: string } | undefined;

    if (member) {
      db.prepare(
        'INSERT OR IGNORE INTO memory_people (memory_id, family_member_id, role, source, confidence) VALUES (?, ?, ?, ?, ?)',
      ).run(job.memory_id, member.id, person.role ?? 'mentioned', 'ai', 0.8);
    }
  }

  // Extract places
  for (const place of extracted.places ?? []) {
    if (!place.name || place.name.trim().length === 0) continue;
    insertEntity.run(newId(), job.memory_id, 'place', place.name, null, 0.8);
  }

  // Extract dates
  for (const date of extracted.dates ?? []) {
    if (!date.value || date.value.trim().length === 0) continue;
    insertEntity.run(
      newId(),
      job.memory_id,
      'date',
      date.value,
      date.context ?? null,
      0.8,
    );
  }

  // Extract events
  for (const event of extracted.events ?? []) {
    if (!event.name || event.name.trim().length === 0) continue;
    insertEntity.run(newId(), job.memory_id, 'event', event.name, null, 0.8);
  }

  // Auto-tag with suggested tags
  const findTag = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertTag = db.prepare(
    'INSERT INTO tags (id, name, category) VALUES (?, ?, ?)',
  );
  const linkTag = db.prepare(
    'INSERT OR IGNORE INTO memory_tags (memory_id, tag_id, source, confidence) VALUES (?, ?, ?, ?)',
  );

  for (const tagName of extracted.suggested_tags ?? []) {
    const trimmed = tagName.trim();
    if (trimmed.length === 0) continue;

    let tag = findTag.get(trimmed) as { id: string } | undefined;
    if (!tag) {
      const tagId = newId();
      insertTag.run(tagId, trimmed, 'ai');
      tag = { id: tagId };
    }
    linkTag.run(job.memory_id, tag.id, 'ai', 0.7);
  }

  // Update sentiment score
  if (typeof extracted.sentiment === 'number' && !isNaN(extracted.sentiment)) {
    const clamped = Math.max(-1, Math.min(1, extracted.sentiment));
    db.prepare('UPDATE memories SET sentiment = ? WHERE id = ?').run(
      clamped,
      job.memory_id,
    );
  }

  const entityCounts = {
    people: (extracted.people ?? []).length,
    places: (extracted.places ?? []).length,
    dates: (extracted.dates ?? []).length,
    events: (extracted.events ?? []).length,
    tags: (extracted.suggested_tags ?? []).length,
  };

  logger.info(
    { memoryId: job.memory_id, ...entityCounts },
    'Extract job completed',
  );

  broadcast('memory:processing', {
    id: job.memory_id,
    status: 'processing',
    job_type: 'extract',
  });

  checkMemoryCompletion(job.memory_id);
}
