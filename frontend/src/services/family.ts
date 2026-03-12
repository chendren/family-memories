import type {
  FamilyMember,
  FamilyMemberCreate,
  FamilyMemberUpdate,
  FamilyMemberWithMemories,
  Relationship,
  RelationshipCreate,
  TreeData,
  ApiResponse,
} from '@family-memories/shared';
import api from './api';

export async function getMembers(): Promise<ApiResponse<FamilyMember[]>> {
  const { data } = await api.get<ApiResponse<FamilyMember[]>>('/api/family/members');
  return data;
}

export async function getMember(id: string): Promise<ApiResponse<FamilyMemberWithMemories>> {
  const { data } = await api.get<ApiResponse<FamilyMemberWithMemories>>(`/api/family/members/${id}`);
  return data;
}

export async function addMember(payload: FamilyMemberCreate): Promise<ApiResponse<FamilyMember>> {
  const { data } = await api.post<ApiResponse<FamilyMember>>('/api/family/members', payload);
  return data;
}

export async function updateMember(id: string, payload: FamilyMemberUpdate): Promise<ApiResponse<FamilyMember>> {
  const { data } = await api.put<ApiResponse<FamilyMember>>(`/api/family/members/${id}`, payload);
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  await api.delete(`/api/family/members/${id}`);
}

export async function uploadMemberPhoto(id: string, file: File): Promise<ApiResponse<FamilyMember>> {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await api.post<ApiResponse<FamilyMember>>(`/api/family/members/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getRelationships(): Promise<ApiResponse<Relationship[]>> {
  const { data } = await api.get<ApiResponse<Relationship[]>>('/api/family/relationships');
  return data;
}

export async function addRelationship(payload: RelationshipCreate): Promise<ApiResponse<Relationship>> {
  const { data } = await api.post<ApiResponse<Relationship>>('/api/family/relationships', payload);
  return data;
}

export async function deleteRelationship(id: string): Promise<void> {
  await api.delete(`/api/family/relationships/${id}`);
}

export async function getTree(): Promise<ApiResponse<TreeData>> {
  const { data } = await api.get<ApiResponse<TreeData>>('/api/family/tree');
  return data;
}
