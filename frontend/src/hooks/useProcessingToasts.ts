import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebSocket } from './useWebSocket';

interface ProcessingEvent {
  id: string;
  title?: string;
  status?: string;
  job_type?: string;
  thumbnail_path?: string;
}

export function useProcessingToasts() {
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe('memory:processed', (data) => {
        const event = data as ProcessingEvent;
        if (event.status === 'completed') {
          toast.success('Memory processed', {
            description: event.title ?? 'AI analysis complete',
          });
          queryClient.invalidateQueries({ queryKey: ['memories'] });
          queryClient.invalidateQueries({ queryKey: ['memory', event.id] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        } else if (event.status === 'failed') {
          toast.error('Processing failed', {
            description: event.title ?? 'Memory could not be processed',
          });
        }
      }),
    );

    unsubs.push(
      subscribe('memory:created', (data) => {
        const event = data as ProcessingEvent;
        queryClient.invalidateQueries({ queryKey: ['memories'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      }),
    );

    unsubs.push(
      subscribe('memory:updated', (data) => {
        const event = data as ProcessingEvent;
        if (event.thumbnail_path) {
          queryClient.invalidateQueries({ queryKey: ['memories'] });
          queryClient.invalidateQueries({ queryKey: ['memory', event.id] });
        }
      }),
    );

    return () => unsubs.forEach((fn) => fn());
  }, [subscribe, queryClient]);
}
