import { cn } from '@/lib/utils';

type Source = 'news_signal' | 'product_gap' | 'industry_benchmark' | 'release_upgrade' | 'manual' | 'api';

const styles: Record<string, { bg: string; label: string }> = {
  news_signal:        { bg: 'bg-[#FEF3C7] text-[#92400E]',  label: 'NEWS SIGNAL' },
  product_gap:        { bg: 'bg-[#CFFAFE] text-[#164E63]',  label: 'PRODUCT GAP' },
  industry_benchmark: { bg: 'bg-[#EDE9FE] text-[#4C1D95]',  label: 'INDUSTRY' },
  release_upgrade:    { bg: 'bg-[#D1FAE5] text-[#065F46]',  label: 'UPGRADE' },
  manual:             { bg: 'bg-[#D1FAE5] text-[#065F46]',  label: 'MANUAL' },
  api:                { bg: 'bg-[#EDE9FE] text-[#4C1D95]',  label: 'VIA API' },
};

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const style = styles[source] ?? { bg: 'bg-muted/20 text-body', label: source.toUpperCase() };
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap',
        style.bg,
        className
      )}
    >
      {style.label}
    </span>
  );
}
