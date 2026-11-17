import { createContext, use, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { CircleAlert } from 'lucide-react'

/**
 * Field compound: Field.Root / Label / Hint / Error + input bên trong tự nối id, aria-describedby, aria-invalid.
 */
type FieldCtx = { id: string; hintId: string; errorId: string; error?: string; hasHint: boolean }
const Ctx = createContext<FieldCtx | null>(null)

function useField() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('Thành phần Field phải nằm trong Field.Root')
  return ctx
}

function Root({ error, hint, children, className = '' }: { error?: string; hint?: boolean; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <Ctx value={{ id, hintId: `${id}-hint`, errorId: `${id}-error`, error, hasHint: !!hint }}>
      <div className={`flex flex-col gap-1.5 ${className}`}>{children}</div>
    </Ctx>
  )
}

function Label({ children, optional }: { children: ReactNode; optional?: boolean }) {
  const { id } = useField()
  return (
    <label htmlFor={id} className="text-sm font-semibold text-ink">
      {children}
      {optional && <span className="font-normal text-ink-muted"> (không bắt buộc)</span>}
    </label>
  )
}

function Hint({ children }: { children: ReactNode }) {
  const { hintId } = useField()
  return (
    <p id={hintId} className="text-[13px] leading-5 text-ink-muted">
      {children}
    </p>
  )
}

function FieldError() {
  const { error, errorId } = useField()
  if (!error) return null
  return (
    <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[13px] leading-5 text-danger">
      <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  )
}

function useControlProps() {
  const { id, hintId, errorId, error, hasHint } = useField()
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hasHint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined,
  }
}

const controlClass =
  'w-full rounded-control border bg-white px-3.5 text-ink placeholder:text-ink-muted/80 focus:border-action focus:outline-none focus:ring-3 focus:ring-action/15 disabled:bg-page disabled:text-ink-muted'

function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const props = useControlProps()
  const invalid = !!props['aria-invalid']
  return <input className={`${controlClass} min-h-11 ${invalid ? 'border-danger' : 'border-field'} ${className}`} {...props} {...rest} />
}

function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const props = useControlProps()
  const invalid = !!props['aria-invalid']
  return <textarea className={`${controlClass} py-2.5 ${invalid ? 'border-danger' : 'border-field'} ${className}`} {...props} {...rest} />
}

function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const props = useControlProps()
  const invalid = !!props['aria-invalid']
  return (
    <select className={`${controlClass} min-h-11 ${invalid ? 'border-danger' : 'border-field'} ${className}`} {...props} {...rest}>
      {children}
    </select>
  )
}

function File({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const props = useControlProps()
  return (
    <input
      type="file"
      className={`block w-full text-sm text-ink-muted file:mr-3 file:rounded-control file:border file:border-line file:bg-page file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink ${className}`}
      {...props}
      {...rest}
    />
  )
}

export const Field = { Root, Label, Hint, Error: FieldError, Input, Textarea, Select, File }
