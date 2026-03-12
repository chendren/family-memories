import { useEffect, useRef, useCallback } from 'react';
import type { Memory } from '@family-memories/shared';
import { TimelineItem } from './TimelineItem';
import { EmptyState } from '@/components/shared/EmptyState';
import { Clock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  memories: Memory[];
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  className?: string;
}

export function TimelineView({ memories, hasNextPage, fetchNextPage, isFetchingNextPage, className }: TimelineViewProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage?.();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (memories.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={48} />}
        title="No memories yet"
        message="Start capturing moments to build your timeline"
      />
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Center spine line (desktop) */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-slate-700" />

      <div className="space-y-2">
        {memories.map((memory, i) => (
          <TimelineItem key={memory.id} memory={memory} index={i} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
