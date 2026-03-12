import { embed } from './embeddings.js';
import { vectorSearch, hybridSearch, getChunksByMemoryIds } from './vectordb.js';
import { keywordSearch } from './vectordb.js';
import { rerank } from './reranker.js';
import { generate } from './ollama.js';
import { getDb } from '../db/sqlite.js';
import { logger } from '../utils/logger.js';
import type { SearchRequest, SearchResponse, SearchResult, SearchFilters, Memory, Tag, FamilyMemberRef } from '@family-memories/shared';

export interface ConversationalSearchResponse {
  answer: string;
  sources: SearchResult[];
  took_ms: number;
}

function deduplicateByMemoryId(
  merged: Array<{ memory_id: string; score: number }>,
): Array<{ memory_id: string; score: number }> {
  const seen = new Set<string>();
  const deduped: Array<{ memory_id: string; score: number }> = [];

  for (const item of merged) {
    if (!seen.has(item.memory_id)) {
      seen.add(item.memory_id);
      deduped.push(item);
    }
  }

  return deduped;
}

async function enrichResults(
  ranked: Array<{ id: string; score: number }>,
  query: string,
): Promise<SearchResult[]> {
  const db = getDb();
  const results: SearchResult[] = [];

  for (const item of ranked) {
    const memory = db
      .prepare('SELECT * FROM memories WHERE id = ?')
      .get(item.id) as Memory | undefined;

    if (!memory) continue;

    const tags = db
      .prepare(
        `SELECT t.id, t.name, t.category, mt.source, mt.confidence
         FROM tags t JOIN memory_tags mt ON mt.tag_id = t.id WHERE mt.memory_id = ?`,
      )
      .all(item.id) as Tag[];

    const people = db
      .prepare(
        `SELECT mp.family_member_id, fm.name, fm.photo_path, mp.role, mp.source, mp.confidence
         FROM memory_people mp JOIN family_members fm ON fm.id = mp.family_member_id
         WHERE mp.memory_id = ?`,
      )
      .all(item.id) as FamilyMemberRef[];

    const thumbnailRow = db
      .prepare('SELECT thumbnail_path FROM media_assets WHERE memory_id = ? LIMIT 1')
      .get(item.id) as { thumbnail_path: string | null } | undefined;

    // Build snippet from content
    const contentSource = memory.content ?? memory.summary ?? memory.title;
    let snippet = '';
    const lowerContent = contentSource.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerContent.indexOf(lowerQuery);
    if (idx !== -1) {
      const start = Math.max(0, idx - 80);
      const end = Math.min(contentSource.length, idx + query.length + 80);
      snippet =
        (start > 0 ? '...' : '') +
        contentSource.slice(start, end) +
        (end < contentSource.length ? '...' : '');
    } else {
      snippet = contentSource.slice(0, 200);
    }

    results.push({
      memory,
      score: item.score,
      snippet,
      highlights: [query],
      people,
      tags,
      thumbnail_path: thumbnailRow?.thumbnail_path ?? null,
    });
  }

  return results;
}

export async function searchMemories(
  request: SearchRequest,
): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Embed the query
    const queryVector = await embed(request.query);

    // Step 2: Hybrid retrieval (vector + keyword merged with RRF)
    const merged = await hybridSearch(queryVector, request.query, {
      limit: 50,
      personIds: request.filters?.person_ids,
      types: request.filters?.types,
      dateRange: request.filters?.date_range,
    });

    // Step 3: Deduplicate by memory_id, keep top 20
    const deduplicated = deduplicateByMemoryId(merged).slice(0, 20);

    if (deduplicated.length === 0) {
      return { results: [], total: 0, took_ms: Date.now() - startTime };
    }

    // Step 4: Get chunk texts for reranking
    const memoryIds = deduplicated.map((d) => d.memory_id);
    const chunkTexts = await getChunksByMemoryIds(memoryIds);

    const rerankInputs = deduplicated
      .filter((d) => chunkTexts.has(d.memory_id))
      .map((d) => ({
        id: d.memory_id,
        text: chunkTexts.get(d.memory_id)!.substring(0, 1000),
        score: d.score,
      }));

    // Step 5: Rerank top candidates
    const reranked = await rerank(request.query, rerankInputs);

    // Step 6: Enrich with full memory records from SQLite
    const resultLimit = request.limit ?? 10;
    const topResults = reranked.slice(0, resultLimit);
    const results = await enrichResults(topResults, request.query);

    return {
      results,
      total: merged.length,
      took_ms: Date.now() - startTime,
    };
  } catch (err) {
    logger.error({ err }, 'AI search pipeline failed, falling back to keyword');
    // Fallback: return empty if pipeline fails entirely
    return { results: [], total: 0, took_ms: Date.now() - startTime };
  }
}

export async function conversationalSearch(
  query: string,
  limit = 5,
): Promise<ConversationalSearchResponse> {
  const startTime = Date.now();

  // Run regular search pipeline (top results)
  const searchResponse = await searchMemories({ query, limit });
  const sources = searchResponse.results;

  if (sources.length === 0) {
    const answer = await generate(
      `The user asked about their family memories: "${query}"\n\nNo relevant memories were found. Respond warmly and suggest they might want to add some memories related to this topic.`,
      'You are a warm, helpful family memory assistant. Be concise and friendly.',
    ).catch(() => 'I could not find any memories matching your question. Try adding some memories first!');

    return { answer, sources: [], took_ms: Date.now() - startTime };
  }

  // Build RAG context from the top results
  const contextParts: string[] = [];
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const content = source.memory.content ?? source.memory.summary ?? source.snippet;
    const date = source.memory.memory_date ?? 'unknown date';
    const people = source.people.map((p) => p.name).join(', ');
    const tags = source.tags.map((t) => t.name).join(', ');

    let entry = `Memory ${i + 1}: "${source.memory.title}" (${date})`;
    if (people) entry += `\nPeople: ${people}`;
    if (tags) entry += `\nTags: ${tags}`;
    entry += `\n${content}`;
    contextParts.push(entry);
  }

  const context = contextParts.join('\n\n---\n\n');

  const prompt =
    `Based on these family memories, answer the question warmly and personally. Reference specific memories, names, and dates when relevant.\n\nQuestion: ${query}\n\nMemories:\n${context}`;

  const system =
    'You are a warm, thoughtful family memory assistant. Answer questions about family memories based only on the provided context. If the memories do not contain enough information to fully answer, say so. Reference specific details from the memories.';

  let answer: string;
  try {
    answer = await generate(prompt, system);
  } catch (err) {
    logger.error({ err }, 'Conversational generation failed');
    answer = 'I found some relevant memories but had trouble generating a response. Here are the memories I found:';
  }

  return {
    answer,
    sources,
    took_ms: Date.now() - startTime,
  };
}
