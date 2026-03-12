import { getDb } from '../../db/sqlite.js';
import { getSummaryVector, vectorSearch } from '../../services/vectordb.js';
import { newId } from '../../utils/id.js';
import { broadcast } from '../../routes/ws.js';
import { logger } from '../../utils/logger.js';
import type { Job } from '../queue.js';

export async function processConnectionsJob(job: Job): Promise<void> {
  const db = getDb();

  const memory = db
    .prepare('SELECT id, title FROM memories WHERE id = ?')
    .get(job.memory_id) as { id: string; title: string } | undefined;

  if (!memory) {
    logger.warn({ memoryId: job.memory_id }, 'Connections job: memory not found');
    return;
  }

  const insertConnection = db.prepare(
    'INSERT OR IGNORE INTO memory_connections (id, source_memory_id, target_memory_id, connection_type, strength, explanation) VALUES (?, ?, ?, ?, ?, ?)',
  );

  let connectionCount = 0;

  // 1. Vector similarity: find semantically similar memories
  const queryVector = await getSummaryVector(job.memory_id);
  if (queryVector) {
    try {
      const similar = await vectorSearch(queryVector, { limit: 10 });

      // Deduplicate by memory_id, exclude self
      const seen = new Set<string>();
      seen.add(job.memory_id);

      let rank = 0;
      for (const result of similar) {
        if (seen.has(result.memory_id)) continue;
        seen.add(result.memory_id);
        rank++;

        // Only keep top 5 similar
        if (rank > 5) break;

        // Score decreases with rank
        const strength = Math.max(0.1, result.score);

        insertConnection.run(
          newId(),
          job.memory_id,
          result.memory_id,
          'similar_theme',
          strength,
          'Semantically similar content',
        );
        connectionCount++;
      }
    } catch (err) {
      logger.warn({ err }, 'Connections job: vector similarity search failed');
    }
  }

  // 2. Shared people: find memories with overlapping family members
  const sharedPeople = db
    .prepare(
      `SELECT DISTINCT mp2.memory_id, COUNT(*) as shared_count
       FROM memory_people mp1
       JOIN memory_people mp2 ON mp1.family_member_id = mp2.family_member_id
       WHERE mp1.memory_id = ? AND mp2.memory_id != ?
       GROUP BY mp2.memory_id
       ORDER BY shared_count DESC
       LIMIT 10`,
    )
    .all(job.memory_id, job.memory_id) as Array<{
    memory_id: string;
    shared_count: number;
  }>;

  for (const match of sharedPeople) {
    const strength = Math.min(1, match.shared_count * 0.3);
    insertConnection.run(
      newId(),
      job.memory_id,
      match.memory_id,
      'same_person',
      strength,
      `${match.shared_count} shared family member${match.shared_count > 1 ? 's' : ''}`,
    );
    connectionCount++;
  }

  // 3. Chronological proximity: find memories within 7 days
  const memoryFull = db
    .prepare('SELECT memory_date FROM memories WHERE id = ?')
    .get(job.memory_id) as { memory_date: string | null } | undefined;

  if (memoryFull?.memory_date) {
    const nearby = db
      .prepare(
        `SELECT id, memory_date, title FROM memories
         WHERE id != ? AND memory_date IS NOT NULL
           AND ABS(julianday(memory_date) - julianday(?)) <= 7
         ORDER BY ABS(julianday(memory_date) - julianday(?))
         LIMIT 5`,
      )
      .all(job.memory_id, memoryFull.memory_date, memoryFull.memory_date) as Array<{
      id: string;
      memory_date: string;
      title: string;
    }>;

    for (const near of nearby) {
      // Strength inversely proportional to day distance (approximate)
      insertConnection.run(
        newId(),
        job.memory_id,
        near.id,
        'chronological',
        0.5,
        'Memories from around the same time',
      );
      connectionCount++;
    }
  }

  logger.info(
    { memoryId: job.memory_id, connectionCount },
    'Connections job completed',
  );

  broadcast('memory:processing', {
    id: job.memory_id,
    status: 'processing',
    job_type: 'connections',
  });
}
