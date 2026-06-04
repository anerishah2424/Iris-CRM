import { cn } from '@/lib/utils';

type Status = 'Healthy' | 'At-Risk' | 'Critical';

const styles: Record<Status, string> = {
  Healthy:  'bg-[#D1FAE5] text-[#065F46]',
  'At-Risk':'bg-[#FEF3C7] text-[#92400E]',
  Critical: 'bg-[#FEE2E2] text-[#991B1B]',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap',
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
