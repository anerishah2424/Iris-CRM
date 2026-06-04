import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueColor?: string;
  iconBg?: string;
  onClick?: () => void;
  trend?: { direction: 'up' | 'down' | 'flat'; delta: number; label: string; positive?: boolean };
  loading?: boolean;
}

export function KPICard({ icon, label, value, valueColor = 'text-matrix-navy', iconBg, onClick, trend, loading }: KPICardProps) {
  const isClickable = !!onClick;

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-matrix-paleBlue" />
        </div>
        <div className="mt-3 h-8 bg-matrix-paleBlue rounded w-16" />
        <div className="mt-1 h-4 bg-matrix-paleBlue rounded w-24" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'card flex flex-col gap-2',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-matrix-lightBlue'
      )}
      onClick={onClick}
      whileHover={isClickable ? { y: -2 } : {}}
      transition={{ duration: 0.15 }}
    >
      <div
        className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg ?? 'bg-matrix-paleBlue')}
      >
        <span className={cn('w-5 h-5', valueColor)}>{icon}</span>
      </div>
      <div>
        <div className={cn('text-[32px] font-bold leading-tight', valueColor)}>{value}</div>
        <div className="text-[13px] text-muted font-medium">{label}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[12px]">
          {trend.direction === 'up' ? (
            <TrendingUp size={13} className={trend.positive !== false ? 'text-health-green' : 'text-health-red'} />
          ) : trend.direction === 'down' ? (
            <TrendingDown size={13} className={trend.positive !== false ? 'text-health-red' : 'text-health-green'} />
          ) : (
            <Minus size={13} className="text-muted" />
          )}
          <span className="text-muted">
            {trend.delta > 0 ? '+' : ''}{trend.delta} {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
