import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const TONE_ICON: Record<string, string> = {
  default: 'text-gray-400',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
  info: 'text-info-text',
};

const TONE_VALUE: Record<string, string> = {
  default: 'text-gray-900',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
  info: 'text-info-text',
};

export interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function StatTile({ label, value, icon: Icon, tone = 'default', className }: StatTileProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon className={cn('w-4 h-4', TONE_ICON[tone])} />
      </div>
      <p className={cn('text-2xl font-semibold', TONE_VALUE[tone])}>{value}</p>
    </div>
  );
}
