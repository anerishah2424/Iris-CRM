import { motion } from 'framer-motion';
import { getHealthColor } from '@/lib/healthUtils';

interface HealthRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  strokeWidth?: number;
}

export function HealthRing({ score, size = 42, showLabel = false, strokeWidth = 5 }: HealthRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score ?? 0)) / 100);
  const color = getHealthColor(score ?? 0);
  const fontSize = Math.max(10, size * 0.22);
  const statusLabel = (score ?? 0) >= 75 ? 'Healthy' : (score ?? 0) >= 45 ? 'At-Risk' : 'Critical';

  return (
    <div className="inline-flex items-center gap-2 flex-shrink-0">
      {/* Ring */}
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EEF5FD"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </svg>
        <span
          className="absolute font-bold leading-none"
          style={{ color, fontSize }}
        >
          {score ?? '—'}
        </span>
      </div>
      {/* Label (outside ring) */}
      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color }}>
          {statusLabel}
        </span>
      )}
    </div>
  );
}
