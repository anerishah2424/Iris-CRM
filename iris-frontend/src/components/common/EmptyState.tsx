import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="w-20 h-20 rounded-full bg-matrix-paleBlue flex items-center justify-center mb-4 text-matrix-blue">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-bold text-matrix-navy mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
