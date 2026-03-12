import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TimelineFilters } from '@/components/timeline/TimelineFilters';
import { TimelineView } from '@/components/timeline/TimelineView';
import { useTimeline, type TimelineFilters as Filters } from '@/hooks/useTimeline';
import { useMembers } from '@/hooks/useFamilyMembers';

export function TimelinePage() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: membersResponse } = useMembers();
  const members = membersResponse?.data ?? [];

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } = useTimeline(filters);

  const memories = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader title="Timeline" subtitle="Your family's story through time" />

      <TimelineFilters filters={filters} onChange={setFilters} members={members} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TimelineView
          memories={memories}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
}
