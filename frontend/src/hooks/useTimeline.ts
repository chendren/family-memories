import { useInfiniteQuery } from '@tanstack/react-query';
import type { MemoryType } from '@family-memories/shared';
import * as memoriesApi from '@/services/memories';

export interface TimelineFilters {
  person_id?: string;
  type?: MemoryType;
  date_from?: string;
  date_to?: string;
}

export function useTimeline(filters?: TimelineFilters) {
  return useInfiniteQuery({
    queryKey: ['timeline', filters],
    queryFn: ({ pageParam = 1 }) =>
      memoriesApi.getMemories({
        ...filters,
        page: pageParam as number,
        limit: 20,
        sort: '-memory_date',
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, pages } = lastPage.meta;
      return page < pages ? page + 1 : undefined;
    },
  });
}
