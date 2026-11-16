import { Link } from 'react-router'
import type { Schemas } from '../../api/client.ts'
import { problemMessage } from '../../api/problem.ts'
import { formatDateTime } from '../../lib/format.ts'
import { useVisitReminder } from '../../hooks/plans.ts'
import { Heart } from '../ui/Heart.tsx'
import { PrimaryButton, SecondaryButton } from '../ui/Button.tsx'
import { useToast } from '../ui/Toast.tsx'

/**
 * Lời nhắc "Đi chưa?" dạng vé hẹn, inline — không modal, không popup tiếp theo (CR-001 DEC-02, UX-03).
 * Đúng hai nút: Đã đi / Bỏ qua lời nhắc. Bỏ qua không ghi "Chưa đi", không đổi lịch, không tăng số lần (RULE-15).
 */
export function VisitReminderTicket({ plan, showPlaceLink = true }: { plan: Schemas['DatePlan']; showPlaceLink?: boolean }) {
  const { confirmVisited, dismiss } = useVisitReminder(plan.id)
  const toast = useToast()
  const headingId = `reminder-${plan.id}`

  return (
    <section
      aria-labelledby={headingId}
      className="ticket-notch rounded-ticket border border-ticket-edge bg-peach-50 [--notch-y:62%]"
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Heart size={28} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h2 id={headingId} className="text-[17px] leading-6 font-semibold">
            Đi chưa?{' '}
            {showPlaceLink ? (
              <Link to={`/plans/${plan.id}`} className="underline-offset-2 hover:underline">
                {plan.place.name}
              </Link>
            ) : (
              plan.place.name
            )}
          </h2>
          <p className="text-[13px] text-ink-muted tabular">Hẹn lúc {formatDateTime(plan.scheduledAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-ticket-edge px-4 py-3">
        <PrimaryButton
          pending={confirmVisited.isPending}
          onClick={() =>
            confirmVisited.mutate(undefined, {
              onSuccess: () => toast.show(`Đã ghi nhận bạn đã đi ${plan.place.name}.`),
              onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
            })
          }
        >
          Đã đi
        </PrimaryButton>
        <SecondaryButton disabled={confirmVisited.isPending} onClick={() => void dismiss()}>
          Bỏ qua lời nhắc
        </SecondaryButton>
      </div>
    </section>
  )
}
