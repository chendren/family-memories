import type { ProcessingStatus } from '@family-memories/shared';
import { CircleNotch, Check, X, Clock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ProcessingBadgeProps {
  status: ProcessingStatus;
  className?: string;
}

const statusConfig: Record<ProcessingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <Clock size={12} className="animate-pulse" />,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <CircleNotch size={12} className="animate-spin" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <Check size={12} />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <X size={12} />,
  },
};

export function ProcessingBadge({ status, className }: ProcessingBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.color,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
