import type { Connection } from '@lancedb/lancedb';
import { getLanceDb } from '../db/lance.js';
import { embed, embedBatch } from './embeddings.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import type { Chunk } from './chunking.js';

const VECTOR_DIM = 768;

interface ChunkMetadata {
  memory_type: string;
  memory_date: string;
  person_ids: string;
  tag_names: string;
  title: string;
}

export interface VectorResult {
  id: string;
  memory_id: string;
  text: string;
  score: number;
  chunk_index: number;
  table_source: string;
}

function esc(val: string): string {
  // Escape single quotes for LanceDB WHERE clauses
  return val.split("'").join("''");
}

async function tableExists(db: Connection, name: string): Promise<boolean> {
  const names = await db.tableNames();
  return names.includes(name);
}

export async function ingestChunks(
  memoryId: string,
  chunks: Chunk[],
  metadata: ChunkMetadata,
): Promise<void> {
  const db = await getLanceDb();
  const texts = chunks.map((c) => c.text);
  const embeddings = await embedBatch(texts);

  const rows = chunks.map((chunk, i) => ({
    id: newId(),
    memory_id: memoryId,
    text: chunk.text,
    vector: Array.from(embeddings[i]),
    chunk_index: chunk.index,
    chunk_count: chunk.count,
    memory_type: metadata.memory_type,
    memory_date: metadata.memory_date,
    person_ids: metadata.person_ids,
    tag_names: metadata.tag_names,
    title: metadata.title,
    created_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return;

  const exists = await tableExists(db, 'memory_chunks');
  if (!exists) {
    await db.createTable('memory_chunks', rows);
    logger.info('Created memory_chunks table');
  } else {
    const table = await db.openTable('memory_chunks');
    await table.add(rows);
  }

  logger.debug({ memoryId, chunkCount: rows.length }, 'Ingested chunks');
}

export async function ingestSummary(
  memoryId: string,
  summary: string,
  metadata: ChunkMetadata,
): Promise<void> {
  const db = await getLanceDb();
  const embedding = await embed(summary);

  const row = {
    id: newId(),
    memory_id: memoryId,
    text: summary,
    vector: Array.from(embedding),
    memory_type: metadata.memory_type,
    memory_date: metadata.memory_date,
    person_ids: metadata.person_ids,
    tag_names: metadata.tag_names,
    title: metadata.title,
    created_at: new Date().toISOString(),
  };

  const exists = await tableExists(db, 'memory_summaries');
  if (!exists) {
    await db.createTable('memory_summaries', [row]);
    logger.info('Created memory_summaries table');
  } else {
    const table = await db.openTable('memory_summaries');
    await table.add([row]);
  }

  logger.debug({ memoryId }, 'Ingested summary');
}

export async function vectorSearch(
  queryVector: number[],
  options: {
    limit?: number;
    personIds?: string[];
    types?: string[];
    dateRange?: { from?: string; to?: string };
  } = {},
): Promise<VectorResult[]> {
  const db = await getLanceDb();
  const limit = options.limit ?? 20;
  const results: VectorResult[] = [];

  // Search memory_chunks
  try {
    if (await tableExists(db, 'memory_chunks')) {
      const table = await db.openTable('memory_chunks');
      let query = table.search(queryVector).limit(limit);

      const filters = buildFilters(options);
      if (filters) {
        query = query.where(filters);
      }

      const rows = await query.toArray();
      for (const row of rows) {
        results.push({
          id: row.id as string,
          memory_id: row.memory_id as string,
          text: row.text as string,
          score: row._distance != null ? 1 / (1 + (row._distance as number)) : 0,
          chunk_index: row.chunk_index as number,
          table_source: 'chunks',
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Vector search on memory_chunks failed');
  }

  // Search memory_summaries
  try {
    if (await tableExists(db, 'memory_summaries')) {
      const table = await db.openTable('memory_summaries');
      let query = table.search(queryVector).limit(Math.min(limit, 10));

      const filters = buildFilters(options);
      if (filters) {
        query = query.where(filters);
      }

      const rows = await query.toArray();
      for (const row of rows) {
        results.push({
          id: row.id as string,
          memory_id: row.memory_id as string,
          text: row.text as string,
          score: row._distance != null ? 1 / (1 + (row._distance as number)) : 0,
          chunk_index: -1,
          table_source: 'summaries',
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Vector search on memory_summaries failed');
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function buildFilters(options: {
  personIds?: string[];
  types?: string[];
  dateRange?: { from?: string; to?: string };
}): string | null {
  const clauses: string[] = [];

  if (options.types && options.types.length > 0) {
    const typeList = options.types.map((t) => `'${esc(t)}'`).join(', ');
    clauses.push(`memory_type IN (${typeList})`);
  }

  if (options.dateRange?.from) {
    clauses.push(`memory_date >= '${esc(options.dateRange.from)}'`);
  }
  if (options.dateRange?.to) {
    clauses.push(`memory_date <= '${esc(options.dateRange.to)}'`);
  }

  // person_ids is stored as JSON string; use LIKE for containment check
  if (options.personIds && options.personIds.length > 0) {
    const personClauses = options.personIds.map(
      (pid) => `person_ids LIKE '%${esc(pid)}%'`,
    );
    clauses.push(`(${personClauses.join(' OR ')})`);
  }

  if (clauses.length === 0) return null;
  return clauses.join(' AND ');
}

export async function keywordSearch(
  query: string,
  limit = 20,
): Promise<VectorResult[]> {
  const db = await getLanceDb();
  const results: VectorResult[] = [];

  // In-memory BM25-style scoring: TF-based scoring over chunk texts
  const queryTerms = query
    .toLowerCase()
    .split(' ')
    .filter((t) => t.length > 1);

  if (queryTerms.length === 0) return [];

  try {
    if (await tableExists(db, 'memory_chunks')) {
      const table = await db.openTable('memory_chunks');
      // Fetch all rows (limited to a reasonable max for keyword scoring)
      const allRows = await table.query().limit(5000).toArray();

      const scored: Array<{ row: Record<string, unknown>; score: number }> = [];
      for (const row of allRows) {
        const text = ((row.text as string) ?? '').toLowerCase();
        const title = ((row.title as string) ?? '').toLowerCase();
        let score = 0;

        for (const term of queryTerms) {
          // Count occurrences in text
          let pos = 0;
          let textCount = 0;
          let searchIdx = text.indexOf(term, pos);
          while (searchIdx !== -1) {
            textCount++;
            pos = searchIdx + term.length;
            searchIdx = text.indexOf(term, pos);
          }

          // Count occurrences in title (weighted higher)
          pos = 0;
          let titleCount = 0;
          searchIdx = title.indexOf(term, pos);
          while (searchIdx !== -1) {
            titleCount++;
            pos = searchIdx + term.length;
            searchIdx = title.indexOf(term, pos);
          }

          // BM25-ish: TF with diminishing returns, title boost
          if (textCount > 0) {
            score += (textCount * 1.2) / (textCount + 1.2);
          }
          if (titleCount > 0) {
            score += (titleCount * 2.0) / (titleCount + 1.0);
          }
        }

        if (score > 0) {
          scored.push({ row, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      for (const { row, score } of scored.slice(0, limit)) {
        results.push({
          id: row.id as string,
          memory_id: row.memory_id as string,
          text: row.text as string,
          score,
          chunk_index: row.chunk_index as number,
          table_source: 'chunks',
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Keyword search failed');
  }

  return results;
}

function rrfMerge(
  vectorResults: VectorResult[],
  keywordResults: VectorResult[],
  k = 60,
): Array<{ memory_id: string; score: number }> {
  const scores = new Map<string, number>();

  vectorResults.forEach((r, i) => {
    const id = r.memory_id;
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
  });

  keywordResults.forEach((r, i) => {
    const id = r.memory_id;
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ memory_id: id, score }));
}

export async function hybridSearch(
  queryVector: number[],
  queryText: string,
  options: {
    limit?: number;
    personIds?: string[];
    types?: string[];
    dateRange?: { from?: string; to?: string };
  } = {},
): Promise<Array<{ memory_id: string; score: number }>> {
  const fetchLimit = Math.max((options.limit ?? 20) * 3, 50);

  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(queryVector, { ...options, limit: fetchLimit }),
    keywordSearch(queryText, fetchLimit),
  ]);

  return rrfMerge(vectorResults, keywordResults);
}

export async function getChunksByMemoryIds(
  memoryIds: string[],
): Promise<Map<string, string>> {
  const db = await getLanceDb();
  const textMap = new Map<string, string>();

  if (memoryIds.length === 0) return textMap;

  try {
    if (await tableExists(db, 'memory_chunks')) {
      const table = await db.openTable('memory_chunks');
      const idList = memoryIds.map((id) => `'${esc(id)}'`).join(', ');
      const rows = await table
        .query()
        .where(`memory_id IN (${idList})`)
        .limit(500)
        .toArray();

      // Group by memory_id, concatenate chunks in order
      const grouped = new Map<string, Array<{ index: number; text: string }>>();
      for (const row of rows) {
        const mid = row.memory_id as string;
        if (!grouped.has(mid)) {
          grouped.set(mid, []);
        }
        grouped.get(mid)!.push({
          index: row.chunk_index as number,
          text: row.text as string,
        });
      }

      for (const [mid, chunks] of grouped) {
        chunks.sort((a, b) => a.index - b.index);
        textMap.set(mid, chunks.map((c) => c.text).join('\n'));
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to get chunks by memory IDs');
  }

  // Also check summaries for any missing
  try {
    if (await tableExists(db, 'memory_summaries')) {
      const table = await db.openTable('memory_summaries');
      const missing = memoryIds.filter((id) => !textMap.has(id));
      if (missing.length > 0) {
        const idList = missing.map((id) => `'${esc(id)}'`).join(', ');
        const rows = await table
          .query()
          .where(`memory_id IN (${idList})`)
          .limit(100)
          .toArray();

        for (const row of rows) {
          const mid = row.memory_id as string;
          if (!textMap.has(mid)) {
            textMap.set(mid, row.text as string);
          }
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to get summaries by memory IDs');
  }

  return textMap;
}

export async function deleteByMemoryId(memoryId: string): Promise<void> {
  const db = await getLanceDb();

  try {
    if (await tableExists(db, 'memory_chunks')) {
      const table = await db.openTable('memory_chunks');
      await table.delete(`memory_id = '${esc(memoryId)}'`);
    }
  } catch (err) {
    logger.warn({ err, memoryId }, 'Failed to delete chunks');
  }

  try {
    if (await tableExists(db, 'memory_summaries')) {
      const table = await db.openTable('memory_summaries');
      await table.delete(`memory_id = '${esc(memoryId)}'`);
    }
  } catch (err) {
    logger.warn({ err, memoryId }, 'Failed to delete summaries');
  }

  logger.debug({ memoryId }, 'Deleted vectors for memory');
}

export async function getSummaryVector(memoryId: string): Promise<number[] | null> {
  const db = await getLanceDb();

  try {
    if (await tableExists(db, 'memory_summaries')) {
      const table = await db.openTable('memory_summaries');
      const rows = await table
        .query()
        .where(`memory_id = '${esc(memoryId)}'`)
        .limit(1)
        .toArray();

      if (rows.length > 0 && rows[0].vector) {
        return Array.from(rows[0].vector as number[]);
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to get summary vector');
  }

  // Fallback: get first chunk vector
  try {
    if (await tableExists(db, 'memory_chunks')) {
      const table = await db.openTable('memory_chunks');
      const rows = await table
        .query()
        .where(`memory_id = '${esc(memoryId)}' AND chunk_index = 0`)
        .limit(1)
        .toArray();

      if (rows.length > 0 && rows[0].vector) {
        return Array.from(rows[0].vector as number[]);
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to get chunk vector');
  }

  return null;
}
