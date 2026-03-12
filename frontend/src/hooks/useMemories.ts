import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemoryCreate, MemoryUpdate } from '@family-memories/shared';
import { toast } from 'sonner';
import * as memoriesApi from '@/services/memories';
import type { MemoryFilters } from '@/services/memories';

export function useMemories(filters?: MemoryFilters) {
  return useQuery({
    queryKey: ['memories', filters],
    queryFn: () => memoriesApi.getMemories(filters),
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: ['memory', id],
    queryFn: () => memoriesApi.getMemory(id!),
    enabled: !!id,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MemoryCreate) => memoriesApi.createMemory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory created');
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MemoryUpdate }) => memoriesApi.updateMemory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      toast.success('Memory updated');
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memoriesApi.deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory deleted');
    },
  });
}

export function useQuickCapture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => memoriesApi.quickCapture(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory captured! Processing...');
    },
  });
}

export function useRelatedMemories(id: string | undefined) {
  return useQuery({
    queryKey: ['memories', id, 'related'],
    queryFn: () => memoriesApi.getRelatedMemories(id!),
    enabled: !!id,
  });
}

export function useOnThisDay() {
  return useQuery({
    queryKey: ['memories', 'on-this-day'],
    queryFn: () => memoriesApi.getOnThisDay(),
    staleTime: 60 * 60 * 1000, // 1 hour — date doesn't change often
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => memoriesApi.getStats(),
  });
}
