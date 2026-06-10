import { logger } from '../utils/logger.js';

export interface RerankInput {
  id: string;
  text: string;
  score?: number;
}

export interface RerankResult {
  id: string;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
}

function lexicalScore(queryTerms: string[], text: string): number {
  if (queryTerms.length === 0) return 0;

  const textLower = text.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    let index = textLower.indexOf(term);
    while (index !== -1) {
      score += 1 + Math.log1p(term.length);
      index = textLower.indexOf(term, index + term.length);
    }
  }

  return score / queryTerms.length;
}

export async function rerank(
  query: string,
  documents: RerankInput[],
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];

  const queryTerms = tokenize(query);
  logger.debug({ queryTerms: queryTerms.length }, 'Lexical rerank');

  return documents
    .map((doc) => {
      const vectorScore = doc.score ?? 0;
      const lexical = lexicalScore(queryTerms, doc.text);
      const normalizedLexical = lexical / (1 + lexical);
      return {
        id: doc.id,
        score: vectorScore * 0.65 + normalizedLexical * 0.35,
      };
    })
    .sort((a, b) => b.score - a.score);
}