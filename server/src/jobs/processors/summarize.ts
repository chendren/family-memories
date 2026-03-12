import { getDb } from '../../db/sqlite.js';
import { generate } from '../../services/ollama.js';
import { ingestSummary } from '../../services/vectordb.js';
import { checkMemoryCompletion } from '../completion.js';
import { broadcast } from '../../routes/ws.js';
import { logger } from '../../utils/logger.js';
import type { Job } from '../queue.js';
import type { Memory } from '@family-memories/shared';

export async function processSummarizeJob(job: Job): Promise<void> {
  const db = getDb();
  const memory = db
    .prepare('SELECT * FROM memories WHERE id = ?')
    .get(job.memory_id) as Memory | undefined;

  if (!memory?.content) {
    logger.warn({ memoryId: job.memory_id }, 'Summarize job: no content');
    return;
  }

  // Truncate content for the prompt if extremely long
  const contentForPrompt = memory.content.length > 8000
    ? memory.content.substring(0, 8000) + '...'
    : memory.content;

  const summary = await generate(
    `Summarize this family memory in 2-3 sentences, preserving key names, dates, and emotional significance:\n\n${contentForPrompt}`,
    'You are a helpful assistant that summarizes family memories warmly and concisely.',
  );

  if (!summary || summary.trim().length === 0) {
    logger.warn({ memoryId: job.memory_id }, 'Summarize job: empty summary');
    return;
  }

  // Store summary in SQLite
  db.prepare('UPDATE memories SET summary = ? WHERE id = ?').run(
    summary.trim(),
    job.memory_id,
  );

  // Embed and store summary in LanceDB for semantic search
  const tags = db
    .prepare(
      'SELECT t.name FROM tags t JOIN memory_tags mt ON t.id = mt.tag_id WHERE mt.memory_id = ?',
    )
    .all(job.memory_id) as Array<{ name: string }>;

  const people = db
    .prepare(
      'SELECT fm.id FROM family_members fm JOIN memory_people mp ON fm.id = mp.family_member_id WHERE mp.memory_id = ?',
    )
    .all(job.memory_id) as Array<{ id: string }>;

  await ingestSummary(job.memory_id, summary.trim(), {
    memory_type: memory.memory_type,
    memory_date: memory.memory_date ?? '',
    person_ids: JSON.stringify(people.map((p) => p.id)),
    tag_names: JSON.stringify(tags.map((t) => t.name)),
    title: memory.title,
  });

  logger.info({ memoryId: job.memory_id }, 'Summarize job completed');

  broadcast('memory:processing', {
    id: job.memory_id,
    status: 'processing',
    job_type: 'summarize',
  });

  checkMemoryCompletion(job.memory_id);
}
