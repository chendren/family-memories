import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 md:px-6 py-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-walnut-900 font-display">{title}</h1>
        {subtitle && <p className="text-sm text-walnut-500 mt-0.5 font-body">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
