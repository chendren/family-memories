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
