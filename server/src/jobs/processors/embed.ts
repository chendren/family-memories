import { getDb } from '../../db/sqlite.js';
import { chunkText } from '../../services/chunking.js';
import { ingestChunks } from '../../services/vectordb.js';
import { checkMemoryCompletion } from '../completion.js';
import { broadcast } from '../../routes/ws.js';
import { logger } from '../../utils/logger.js';
import type { Job } from '../queue.js';
import type { Memory } from '@family-memories/shared';

export async function processEmbedJob(job: Job): Promise<void> {
  const db = getDb();
  const memory = db
    .prepare('SELECT * FROM memories WHERE id = ?')
    .get(job.memory_id) as Memory | undefined;

  if (!memory?.content) {
    logger.warn({ memoryId: job.memory_id }, 'Embed job: no content');
    return;
  }

  // Get tags and people for metadata enrichment
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

  // Chunk the text
  const chunks = chunkText(memory.content);
  if (chunks.length === 0) {
    logger.warn({ memoryId: job.memory_id }, 'Embed job: no chunks produced');
    return;
  }

  // Ingest into LanceDB with metadata
  await ingestChunks(job.memory_id, chunks, {
    memory_type: memory.memory_type,
    memory_date: memory.memory_date ?? '',
    person_ids: JSON.stringify(people.map((p) => p.id)),
    tag_names: JSON.stringify(tags.map((t) => t.name)),
    title: memory.title,
  });

  logger.info(
    { memoryId: job.memory_id, chunkCount: chunks.length },
    'Embed job completed',
  );

  broadcast('memory:processing', {
    id: job.memory_id,
    status: 'processing',
    job_type: 'embed',
  });

  checkMemoryCompletion(job.memory_id);
}
