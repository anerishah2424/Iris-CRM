export function getHealthColor(score: number): string {
  if (score >= 70) return '#0FBD85';
  if (score >= 40) return '#F5A623';
  return '#EF4444';
}

export function getHealthStatus(score: number): 'Healthy' | 'At-Risk' | 'Critical' {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'At-Risk';
  return 'Critical';
}

export function getStatusBadgeProps(status: 'Healthy' | 'At-Risk' | 'Critical') {
  switch (status) {
    case 'Healthy':
      return { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' };
    case 'At-Risk':
      return { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' };
    case 'Critical':
      return { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
  }
}

export function getPriorityBorderColor(priority: string): string {
  switch (priority) {
    case 'Critical':
      return 'border-l-health-red';
    case 'High':
      return 'border-l-health-amber';
    case 'Medium':
      return 'border-l-matrix-blue';
    default:
      return 'border-l-border';
  }
}
