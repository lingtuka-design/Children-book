import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-coral-500 text-white shadow-[0_10px_24px_-10px_rgba(197,84,47,0.65)] hover:bg-coral-600 active:bg-coral-700',
  secondary:
    'bg-white text-ink-900 border border-paper-300 shadow-sm hover:border-coral-300 hover:text-coral-600',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-100 hover:text-ink-900',
  danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  dark: 'bg-ink-900 text-paper-50 hover:bg-ink-700',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-8 py-3.5 text-lg rounded-2xl gap-2.5',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all duration-200 select-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-coral-500/60',
        'disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:scale-100',
        'active:scale-[0.98] hover:-translate-y-0.5',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  )
}
