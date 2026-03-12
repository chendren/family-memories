import { getDb } from '../db/sqlite.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';

export interface Job {
  id: string;
  job_type: string;
  memory_id: string;
  status: string;
  attempts: number;
  max_retries: number;
  error: string | null;
  payload: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type JobProcessor = (job: Job) => Promise<void>;

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function enqueue(jobType: string, memoryId: string, payload?: unknown): string {
  const db = getDb();
  const id = newId();
  const payloadStr = payload ? JSON.stringify(payload) : null;

  db.prepare(
    `INSERT INTO job_queue (id, job_type, memory_id, payload) VALUES (?, ?, ?, ?)`,
  ).run(id, jobType, memoryId, payloadStr);

  logger.debug({ jobId: id, jobType, memoryId }, 'Job enqueued');
  return id;
}

export function processNext(jobType: string): Job | null {
  const db = getDb();

  const job = db.prepare(
    `SELECT * FROM job_queue WHERE job_type = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 1`,
  ).get(jobType) as Job | undefined;

  if (!job) return null;

  db.prepare(
    `UPDATE job_queue SET status = 'running', started_at = datetime('now'), attempts = attempts + 1 WHERE id = ?`,
  ).run(job.id);

  return { ...job, status: 'running', attempts: job.attempts + 1 };
}

export function complete(jobId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE job_queue SET status = 'completed', completed_at = datetime('now') WHERE id = ?`,
  ).run(jobId);
  logger.debug({ jobId }, 'Job completed');
}

export function fail(jobId: string, error: string): void {
  const db = getDb();

  const job = db.prepare(`SELECT * FROM job_queue WHERE id = ?`).get(jobId) as Job | undefined;
  if (!job) return;

  if (job.attempts < job.max_retries) {
    db.prepare(
      `UPDATE job_queue SET status = 'pending', error = ? WHERE id = ?`,
    ).run(error, jobId);
    logger.warn({ jobId, attempts: job.attempts, error }, 'Job failed, re-queued');
  } else {
    db.prepare(
      `UPDATE job_queue SET status = 'failed', error = ?, completed_at = datetime('now') WHERE id = ?`,
    ).run(error, jobId);
    logger.error({ jobId, error }, 'Job permanently failed');
  }
}

export function startPolling(processors: Record<string, JobProcessor>): void {
  if (pollInterval) return;

  const jobTypes = Object.keys(processors);
  logger.info({ jobTypes }, 'Starting job queue polling');

  pollInterval = setInterval(async () => {
    for (const jobType of jobTypes) {
      const job = processNext(jobType);
      if (!job) continue;

      const processor = processors[jobType];
      if (!processor) continue;

      try {
        await processor(job);
        complete(job.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        fail(job.id, message);
      }
    }
  }, 2000);
}

export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info('Job queue polling stopped');
  }
}
