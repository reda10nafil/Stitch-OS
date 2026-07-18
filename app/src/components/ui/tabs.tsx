import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex border-b border-slate-200', className)} {...props} />
}

interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Tab({ className, active, ...props }: TabProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none',
        active ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
        className
      )}
      {...props}
    />
  )
}