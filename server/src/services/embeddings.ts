import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const EMBEDDING_DIM = 768;

export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    return new Array(EMBEDDING_DIM).fill(0);
  }

  const res = await fetch(`${config.OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: trimmed }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama embeddings failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { embedding: number[] };
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Ollama returned no embedding');
  }

  return data.embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    try {
      results.push(await embed(text));
    } catch (err) {
      logger.warn({ err, textLength: text.length }, 'Embedding failed for chunk, using zero vector');
      results.push(new Array(EMBEDDING_DIM).fill(0));
    }
  }
  return results;
}
