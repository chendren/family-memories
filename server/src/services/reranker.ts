import { logger } from '../utils/logger.js';

let rerankerPipeline: any = null;
let loadFailed = false;

async function getReranker(): Promise<any> {
  if (loadFailed) return null;
  if (rerankerPipeline) return rerankerPipeline;

  try {
    // Dynamic import to handle cases where the module might not be available
    const { pipeline } = await import('@xenova/transformers');
    rerankerPipeline = await pipeline(
      'text-classification',
      'Xenova/ms-marco-MiniLM-L-6-v2',
    );
    logger.info('Reranker model loaded');
    return rerankerPipeline;
  } catch (err) {
    loadFailed = true;
    logger.warn({ err }, 'Failed to load reranker model, falling back to score passthrough');
    return null;
  }
}

export interface RerankInput {
  id: string;
  text: string;
  score?: number;
}

export interface RerankResult {
  id: string;
  score: number;
}

export async function rerank(
  query: string,
  documents: RerankInput[],
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];

  const model = await getReranker();

  // If reranker unavailable, return documents sorted by their existing scores
  if (!model) {
    return documents.map((doc) => ({
      id: doc.id,
      score: doc.score ?? 0,
    })).sort((a, b) => b.score - a.score);
  }

  const results: RerankResult[] = [];

  for (const doc of documents) {
    try {
      // Cross-encoder input: query [SEP] document
      const input = query + ' [SEP] ' + doc.text.substring(0, 512);
      const output = await model(input, { topk: 1 });
      const score = output?.[0]?.score ?? 0;
      results.push({ id: doc.id, score });
    } catch (err) {
      logger.warn({ err, docId: doc.id }, 'Reranking failed for document');
      results.push({ id: doc.id, score: doc.score ?? 0 });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
