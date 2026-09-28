import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-gray-100 text-gray-700 border-gray-200',
      success: 'bg-success-bg text-success-text border-success-border',
      warning: 'bg-warning-bg text-warning-text border-warning-border',
      danger: 'bg-danger-bg text-danger-text border-danger-border',
      info: 'bg-info-bg text-info-text border-info-border',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
