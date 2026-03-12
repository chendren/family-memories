import { getDb } from '../db/sqlite.js';
import { enqueue } from '../jobs/queue.js';
import { broadcast } from '../routes/ws.js';
import { logger } from '../utils/logger.js';
import type { Memory } from '@family-memories/shared';

export async function processMemory(memoryId: string): Promise<void> {
  const db = getDb();
  const memory = db
    .prepare('SELECT * FROM memories WHERE id = ?')
    .get(memoryId) as Memory | undefined;

  if (!memory) {
    logger.warn({ memoryId }, 'processMemory: memory not found');
    return;
  }

  const hasContent = memory.content && memory.content.trim().length > 0;

  if (hasContent) {
    // Always embed the content for vector search
    enqueue('embed', memoryId);

    // Summarize if content is long enough to benefit
    if (memory.content!.length > 500) {
      enqueue('summarize', memoryId);
    }

    // Always extract entities (people, places, dates, events)
    enqueue('extract', memoryId);
  }

  // Update status to processing
  db.prepare(
    'UPDATE memories SET processing_status = ? WHERE id = ?',
  ).run('processing', memoryId);

  broadcast('memory:processing', { id: memoryId, status: 'processing' });
  logger.info({ memoryId, hasContent }, 'Memory processing enqueued');
}

export function enqueueConnectionsJob(memoryId: string): void {
  enqueue('connections', memoryId);
}
