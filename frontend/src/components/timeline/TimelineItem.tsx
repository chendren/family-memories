import { format } from 'date-fns';
import { motion } from 'motion/react';
import type { Memory } from '@family-memories/shared';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
  memory: Memory;
  index: number;
  className?: string;
}

export function TimelineItem({ memory, index, className }: TimelineItemProps) {
  const isLeft = index % 2 === 0;
  const dateStr = memory.memory_date ?? memory.created_at;
  const dateLabel = dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className={cn('relative flex items-start gap-4 md:gap-8', className)}
    >
      {/* Center spine dot */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900 z-10" />

      {/* Mobile layout: always left */}
      <div className="md:hidden flex items-start gap-4 w-full">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
          <div className="w-0.5 flex-1 bg-slate-700 min-h-[2rem]" />
        </div>
        <div className="flex-1 pb-6">
          <span className="text-xs text-slate-500 mb-2 block">{dateLabel}</span>
          <MemoryCard memory={memory} />
        </div>
      </div>

      {/* Desktop layout: alternate sides */}
      <div className="hidden md:grid md:grid-cols-2 gap-8 w-full">
        <div className={cn('flex', isLeft ? 'justify-end' : 'justify-start order-2')}>
          <div className="max-w-sm w-full">
            <MemoryCard memory={memory} />
          </div>
        </div>
        <div className={cn('flex items-start pt-6', isLeft ? 'justify-start order-2' : 'justify-end')}>
          <span className="text-xs text-slate-500">{dateLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}
