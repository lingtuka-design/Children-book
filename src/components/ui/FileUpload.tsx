import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { UploadCloud, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  icon?: ReactNode
  onFiles: (files: File[]) => void
}

export function FileUpload({
  accept,
  multiple = false,
  label = 'Choose files',
  hint,
  error,
  disabled = false,
  icon,
  onFiles,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    onFiles(Array.from(files))
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all',
          dragging
            ? 'border-coral-500 bg-coral-50 scale-[1.01]'
            : 'border-paper-300 bg-paper-100/70 hover:border-coral-300 hover:bg-coral-50/60',
          disabled && 'cursor-not-allowed opacity-60',
          error && 'border-red-300',
        )}
      >
        <div className={cn('rounded-full bg-white p-3 shadow-sm', dragging ? 'text-coral-500' : 'text-coral-500')}>
          {icon ?? <UploadCloud className="size-6" />}
        </div>
        <div className="font-bold text-ink-700">
          {label}
          {multiple && ' (multiple)'}
        </div>
        {hint && <div className="max-w-xs text-xs text-ink-500">{hint}</div>}
        {error && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600" role="alert">
            <FileWarning className="size-4" /> {error}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
