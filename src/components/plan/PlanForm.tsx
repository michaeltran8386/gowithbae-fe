import { useState, type ReactNode } from 'react'
import type { Schemas } from '../../api/client.ts'
import { ApiError, fieldErrors, problemMessage } from '../../api/problem.ts'
import { describeDay, hoursOn } from '../../lib/hours.ts'
import { toVnIso, vnParts } from '../../lib/format.ts'
import { Field } from '../ui/Field.tsx'
import { PrimaryButton } from '../ui/Button.tsx'
import { NotReservedNotice } from './PlanBits.tsx'
import { useNow } from '../../hooks/useNow.ts'

export type PlanFormValues = { scheduledAt: string; note: string }

/**
 * Form ngày giờ + ghi chú dùng chung cho tạo / sửa / chốt (RULE-05, RULE-13).
 * Giờ đã xác minh đóng → server 409, hiện tại ô thời gian. Giờ chưa rõ → chỉ cảnh báo, không chặn (FR-15).
 */
export function PlanForm({
  hours,
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onChange,
  children,
}: {
  hours?: Schemas['OpeningHours']
  initial?: { scheduledAt?: string; note?: string | null }
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (values: PlanFormValues) => void
  onChange?: () => void
  children?: ReactNode
}) {
  const start = initial?.scheduledAt ? vnParts(initial.scheduledAt) : { date: '', time: '19:00' }
  const [date, setDate] = useState(start.date)
  const [time, setTime] = useState(start.time)
  const [note, setNote] = useState(initial?.note ?? '')
  const [localError, setLocalError] = useState<string | undefined>()

  const now = useNow()
  const today = vnParts(new Date(now).toISOString()).date
  const serverFields = fieldErrors(error)
  const closedError =
    error instanceof ApiError && error.status === 409 && (error.problem.code === 'RULE-05' || /đóng cửa/i.test(error.problem.title))
      ? 'Địa điểm đóng cửa vào thời gian bạn chọn'
      : undefined
  const timeError = localError ?? serverFields.scheduledAt ?? closedError
  const otherError = error && !timeError && !serverFields.note ? problemMessage(error) : undefined
  const dayInfo = hours && date ? describeDay(hoursOn(hours, toVnIso(date, time || '12:00'))) : null

  const change = (fn: () => void) => {
    fn()
    setLocalError(undefined)
    onChange?.()
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!date || !time) return setLocalError('Hãy chọn ngày và giờ hẹn')
        const iso = toVnIso(date, time)
        if (new Date(iso).getTime() <= Date.now()) return setLocalError('Hãy chọn thời điểm trong tương lai')
        onSubmit({ scheduledAt: iso, note: note.trim() })
      }}
    >
      {children}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Ngày giờ hẹn (giờ Việt Nam)</legend>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field.Root error={timeError} className="min-w-0">
            <span className="sr-only">
              <Field.Label>Ngày</Field.Label>
            </span>
            <Field.Input type="date" min={today} value={date} onChange={(e) => change(() => setDate(e.target.value))} required className="min-w-0" />
            <Field.Error />
          </Field.Root>
          <Field.Root>
            <span className="sr-only">
              <Field.Label>Giờ</Field.Label>
            </span>
            <Field.Input type="time" step={900} value={time} onChange={(e) => change(() => setTime(e.target.value))} required className="w-28" />
          </Field.Root>
        </div>
        {dayInfo && (
          <p className="text-[13px] text-ink-muted">
            Giờ mở cửa ngày đã chọn: <span className={dayInfo.startsWith('Chưa') ? 'text-attention' : 'text-ink'}>{dayInfo}</span>
          </p>
        )}
      </fieldset>

      <Field.Root error={serverFields.note}>
        <Field.Label optional>Ghi chú</Field.Label>
        <Field.Textarea rows={3} maxLength={1000} value={note} onChange={(e) => change(() => setNote(e.target.value))} placeholder="vd. Mang áo khoác mỏng…" />
        <Field.Error />
      </Field.Root>

      <NotReservedNotice />

      {otherError && (
        <p role="alert" className="rounded-control bg-danger-soft px-3.5 py-3 text-sm text-danger">
          {otherError}
        </p>
      )}

      <PrimaryButton type="submit" pending={pending} className="self-stretch md:self-start">
        {submitLabel}
      </PrimaryButton>
    </form>
  )
}
