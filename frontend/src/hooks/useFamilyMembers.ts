import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FamilyMemberCreate, FamilyMemberUpdate } from '@family-memories/shared';
import { toast } from 'sonner';
import * as familyApi from '@/services/family';

export function useMembers() {
  return useQuery({
    queryKey: ['family-members'],
    queryFn: () => familyApi.getMembers(),
  });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: ['family-member', id],
    queryFn: () => familyApi.getMember(id!),
    enabled: !!id,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyMemberCreate) => familyApi.addMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      toast.success('Family member added');
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FamilyMemberUpdate }) => familyApi.updateMember(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['family-member', id] });
      toast.success('Member updated');
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyApi.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      toast.success('Member removed');
    },
  });
}

export function useTree() {
  return useQuery({
    queryKey: ['family-tree'],
    queryFn: () => familyApi.getTree(),
  });
}

export function useAddRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: familyApi.addRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Relationship added');
    },
  });
}
