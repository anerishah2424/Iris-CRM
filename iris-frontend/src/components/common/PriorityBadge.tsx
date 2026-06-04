import { cn } from '@/lib/utils';

type Priority = 'Critical' | 'High' | 'MEDIUM' | 'Medium' | 'LOW' | 'Low' | 'HIGH' | 'LOW';

const styles: Record<string, string> = {
  Critical: 'bg-red-500 text-white',
  High:     'bg-health-amber text-white',
  HIGH:     'bg-red-500 text-white',
  MEDIUM:   'bg-health-amber text-white',
  Medium:   'bg-health-amber text-white',
  Low:      'bg-matrix-blue text-white',
  LOW:      'bg-matrix-blue text-white',
};

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap',
        styles[priority] ?? 'bg-muted/20 text-body',
        className
      )}
    >
      {priority}
    </span>
  );
}
