import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:outline-none focus:border-sky-500 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'