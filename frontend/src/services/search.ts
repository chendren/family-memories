import type { SearchRequest, SearchResponse, SearchSuggestion, ApiResponse } from '@family-memories/shared';
import api from './api';

export async function search(request: SearchRequest): Promise<SearchResponse> {
  const { data } = await api.post<SearchResponse>('/api/search', request);
  return data;
}

export async function getSuggestions(q: string): Promise<ApiResponse<SearchSuggestion[]>> {
  const { data } = await api.get<ApiResponse<SearchSuggestion[]>>('/api/search/suggest', { params: { q } });
  return data;
}

export interface ConversationalResponse {
  answer: string;
  sources: Array<{ memory: { id: string; title: string; memory_type: string; memory_date: string | null }; score: number }>;
  total: number;
  took_ms: number;
}

export async function conversationalSearch(query: string, limit = 5): Promise<{ data: ConversationalResponse }> {
  const { data } = await api.post<{ data: ConversationalResponse }>('/api/search/conversational', { query, limit });
  return data;
}
