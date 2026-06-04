import { cn } from '@/lib/utils';

const domainStyles: Record<string, string> = {
  'Video Surveillance': 'bg-[#DBEAFE] text-[#1e40af]',
  'Access Control':     'bg-[#CFFAFE] text-[#164E63]',
  'Time Attendance':    'bg-[#D1FAE5] text-[#065F46]',
  'Telecom':            'bg-[#EDE9FE] text-[#4C1D95]',
  'Intrusion':          'bg-[#FEE2E2] text-[#991B1B]',
};

interface ProductChipProps {
  domain: string;
  count?: number;
  label?: string;
  className?: string;
}

export function ProductChip({ domain, count, label, className }: ProductChipProps) {
  const style = domainStyles[domain] ?? 'bg-muted/20 text-body';
  const shortMap: Record<string, string> = {
    'Video Surveillance': 'VS',
    'Access Control': 'AC',
    'Time Attendance': 'TA',
    'Telecom': 'TC',
    'Intrusion': 'IN',
  };
  const short = shortMap[domain] ?? domain.slice(0, 2).toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap',
        style,
        className
      )}
    >
      {label ?? (count != null ? `${count} ${short}` : domain)}
    </span>
  );
}
