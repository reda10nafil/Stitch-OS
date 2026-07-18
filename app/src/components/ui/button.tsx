import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-sky-600 text-white hover:bg-sky-700',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-slate-300 bg-white hover:bg-slate-100 text-slate-700',
  ghost: 'hover:bg-slate-100 text-slate-700',
  link: 'text-sky-600 underline-offset-4 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-8',
  icon: 'h-9 w-9',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'