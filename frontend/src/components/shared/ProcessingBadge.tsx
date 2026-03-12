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
    color: 'bg-gold-50 text-gold-400 border-gold-200',
    icon: <Clock size={12} className="animate-pulse" />,
  },
  processing: {
    label: 'Processing',
    color: 'bg-sage-50 text-sage-400 border-sage-200',
    icon: <CircleNotch size={12} className="animate-spin" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-sage-50 text-sage-500 border-sage-200',
    icon: <Check size={12} />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-50 text-red-500 border-red-200',
    icon: <X size={12} />,
  },
};

export function ProcessingBadge({ status, className }: ProcessingBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border font-body',
        config.color,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
