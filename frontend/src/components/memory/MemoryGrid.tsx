import { cn } from '@/lib/utils';

interface MemoryGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MemoryGrid({ children, className }: MemoryGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}
