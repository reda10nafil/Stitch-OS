import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-orange-100 text-orange-800 border-orange-200',
  destructive: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  outline: 'border border-slate-300 text-slate-600',
}

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}