import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const baseField =
  'w-full rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-500/50 transition-all ' +
  'focus:border-coral-400 focus:outline-none focus:ring-4 focus:ring-coral-100 ' +
  'disabled:bg-paper-100 disabled:opacity-70'

interface FieldShellProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function FieldShell({ label, error, hint, required, htmlFor, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-bold text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-coral-500" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, required, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(baseField, error && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, required, className, id, ...rest }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(baseField, 'min-h-32 resize-y', error && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export function Select({ label, error, hint, required, className, id, children, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(baseField, 'appearance-none', error && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
    >
      <p className="font-semibold text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-paper-300 bg-paper-100/60 px-6 py-16 text-center">
      {icon && <div className="mb-1 text-coral-500">{icon}</div>}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {message && <p className="max-w-md text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
