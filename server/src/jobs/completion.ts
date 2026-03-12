import { getDb } from '../db/sqlite.js';
import { enqueue } from './queue.js';
import { broadcast } from '../routes/ws.js';
import { logger } from '../utils/logger.js';

const AI_JOB_TYPES = ['embed', 'summarize', 'extract'];

export function checkMemoryCompletion(memoryId: string): void {
  const db = getDb();

  // Count pending/running AI jobs for this memory (exclude connections — it runs after)
  const pending = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM job_queue
       WHERE memory_id = ? AND job_type IN ('embed', 'summarize', 'extract')
         AND status IN ('pending', 'running')`,
    )
    .get(memoryId) as { cnt: number };

  if (pending.cnt > 0) return;

  // Check if any AI jobs failed
  const failed = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM job_queue
       WHERE memory_id = ? AND job_type IN ('embed', 'summarize', 'extract')
         AND status = 'failed'`,
    )
    .get(memoryId) as { cnt: number };

  if (failed.cnt > 0) {
    db.prepare(
      'UPDATE memories SET processing_status = ?, processing_error = ? WHERE id = ?',
    ).run('failed', `${failed.cnt} job(s) failed`, memoryId);

    broadcast('memory:processed', { id: memoryId, status: 'failed' });
    logger.warn({ memoryId, failedCount: failed.cnt }, 'Memory processing failed');
    return;
  }

  // All AI jobs completed — mark as completed and enqueue connections
  db.prepare(
    'UPDATE memories SET processing_status = ? WHERE id = ?',
  ).run('completed', memoryId);

  // Enqueue connections job to find related memories (runs after all extraction is done)
  enqueue('connections', memoryId);

  broadcast('memory:processed', { id: memoryId, status: 'completed' });
  logger.info({ memoryId }, 'Memory processing completed');
}
