import type { Memory, Tag, FamilyMemberRef } from './memory.js';

export interface SearchFilters {
  person_ids?: string[];
  types?: string[];
  date_range?: { from?: string; to?: string };
  tags?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}

export interface SearchResult {
  memory: Memory;
  score: number;
  snippet: string;
  highlights: string[];
  people: FamilyMemberRef[];
  tags: Tag[];
  thumbnail_path: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took_ms: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'tag' | 'person' | 'memory';
  id?: string;
}
