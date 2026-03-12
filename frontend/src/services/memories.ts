import type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemoryWithRelations,
  ApiResponse,
  PaginatedResponse,
  MemoryType,
} from '@family-memories/shared';
import api from './api';

export interface MemoryFilters {
  page?: number;
  limit?: number;
  type?: MemoryType;
  person_id?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

export async function quickCapture(data: FormData): Promise<void> {
  await api.post('/api/capture', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getMemories(params?: MemoryFilters): Promise<PaginatedResponse<Memory>> {
  const { data } = await api.get<PaginatedResponse<Memory>>('/api/memories', { params });
  return data;
}

export async function getMemory(id: string): Promise<ApiResponse<MemoryWithRelations>> {
  const { data } = await api.get<ApiResponse<MemoryWithRelations>>(`/api/memories/${id}`);
  return data;
}

export async function createMemory(payload: MemoryCreate): Promise<ApiResponse<Memory>> {
  const { data } = await api.post<ApiResponse<Memory>>('/api/memories', payload);
  return data;
}

export async function updateMemory(id: string, payload: MemoryUpdate): Promise<ApiResponse<Memory>> {
  const { data } = await api.put<ApiResponse<Memory>>(`/api/memories/${id}`, payload);
  return data;
}

export async function deleteMemory(id: string): Promise<void> {
  await api.delete(`/api/memories/${id}`);
}

export async function getRelatedMemories(id: string): Promise<ApiResponse<Memory[]>> {
  const { data } = await api.get<ApiResponse<Memory[]>>(`/api/memories/${id}/related`);
  return data;
}
