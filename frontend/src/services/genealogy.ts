import api from './api';
import type {
  GenealogyService,
  DnaProfile,
  DnaMatch,
  GenealogyProvider,
} from '@family-memories/shared';

export async function getServices(): Promise<{ data: GenealogyService[] }> {
  const { data } = await api.get<{ data: GenealogyService[] }>('/api/genealogy/services');
  return data;
}

export async function connectService(provider: GenealogyProvider): Promise<{ data: GenealogyService }> {
  const { data } = await api.post<{ data: GenealogyService }>(`/api/genealogy/services/${provider}/connect`);
  return data;
}

export async function disconnectService(provider: GenealogyProvider): Promise<void> {
  await api.post(`/api/genealogy/services/${provider}/disconnect`);
}

export async function getDnaProfile(memberId: string, provider?: GenealogyProvider): Promise<{ data: DnaProfile }> {
  const params = provider ? `?provider=${provider}` : '';
  const { data } = await api.get<{ data: DnaProfile }>(`/api/genealogy/dna/${memberId}${params}`);
  return data;
}

export async function getDnaMatches(memberId: string): Promise<{ data: DnaMatch[] }> {
  const { data } = await api.get<{ data: DnaMatch[] }>(`/api/genealogy/dna/${memberId}/matches`);
  return data;
}

export async function getGedcomStats(): Promise<{ data: { filename: string; individual_count: number; family_count: number } }> {
  const { data } = await api.get<{ data: { filename: string; individual_count: number; family_count: number } }>('/api/genealogy/export/gedcom/stats');
  return data;
}
