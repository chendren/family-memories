import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && <div className="text-sand-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-walnut-700 mb-2 font-display">{title}</h3>
      {message && <p className="text-walnut-500 text-sm max-w-md mb-6 font-body">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
