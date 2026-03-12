import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as genealogyApi from '@/services/genealogy';
import type { GenealogyProvider } from '@family-memories/shared';

export function useGenealogyServices() {
  return useQuery({
    queryKey: ['genealogy-services'],
    queryFn: () => genealogyApi.getServices(),
  });
}

export function useConnectService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: GenealogyProvider) => genealogyApi.connectService(provider),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['genealogy-services'] });
      toast.success(`Connected to ${result.data.display_name}`);
    },
    onError: () => {
      toast.error('Failed to connect service');
    },
  });
}

export function useDisconnectService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: GenealogyProvider) => genealogyApi.disconnectService(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genealogy-services'] });
      toast.success('Service disconnected');
    },
  });
}

export function useDnaProfile(memberId: string | undefined) {
  return useQuery({
    queryKey: ['dna-profile', memberId],
    queryFn: () => genealogyApi.getDnaProfile(memberId!),
    enabled: !!memberId,
  });
}

export function useDnaMatches(memberId: string | undefined) {
  return useQuery({
    queryKey: ['dna-matches', memberId],
    queryFn: () => genealogyApi.getDnaMatches(memberId!),
    enabled: !!memberId,
  });
}

export function useGedcomStats() {
  return useQuery({
    queryKey: ['gedcom-stats'],
    queryFn: () => genealogyApi.getGedcomStats(),
    staleTime: 60_000,
  });
}
