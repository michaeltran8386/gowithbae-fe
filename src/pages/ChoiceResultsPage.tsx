import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Lock } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { isStatus } from '../api/problem.ts'
import { useChoiceSession, useFinalizeChoice } from '../hooks/choice.ts'
import { usePlace } from '../hooks/places.ts'
import { useIdempotencyKey } from '../lib/idempotency.ts'
import { priceForTwo } from '../lib/format.ts'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { PlanForm } from '../components/plan/PlanForm.tsx'
import { ButtonLink, SecondaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { Heart } from '../components/ui/Heart.tsx'
import { useToast } from '../components/ui/Toast.tsx'
import { BackToSession } from './ChoiceVotePage.tsx'

/**
 * S-12 Kết quả & chốt — FR-12/13, RULE-11: chỉ người tạo chốt; hệ thống không tự chọn theo phiếu.
 * Điều kiện chốt là PROP (OQ-08): bật sau khi người nhận đã tham gia.
 */
export function ChoiceResultsPage() {
  const { sessionId = '' } = useParams()
  const session = useChoiceSession(sessionId)

  if (session.isPending) return <Skeleton className="h-96" />
  if (session.isError)
    return isStatus(session.error, 404, 410, 401) ? (
      <EmptyState icon={<Lock size={32} />} title="Bạn không còn quyền xem phiên này" />
    ) : (
      <ErrorState error={session.error} onRetry={() => session.refetch()} />
    )
  return <Results session={session.data} />
}

function Results({ session }: { session: Schemas['ChoiceSession'] }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const isCreator = session.viewerRole === 'CREATOR'
  const mutual = session.candidates.filter((c) => c.mutualLike)
  const others = session.candidates.filter((c) => !c.mutualLike)
  const canFinalize = isCreator && session.status === 'VOTING'

  return (
    <div className="mx-auto max-w-3xl">
      <BackToSession sessionId={session.id} />
      <h1 className="mt-2 text-2xl font-bold md:text-3xl">Kết quả cùng chọn</h1>
      <p className="mt-1 text-ink-muted">
        {isCreator ? 'Bạn có thể chọn bất kỳ nơi nào, không bắt buộc theo phiếu.' : `${session.creatorName} sẽ chọn nơi cuối cùng.`}
      </p>
      {isCreator && session.status === 'WAITING' && (
        <p role="status" className="mt-3 rounded-control bg-peach-50 px-3.5 py-3 text-sm text-attention">
          Người ấy chưa tham gia. Bạn có thể chốt sau khi người ấy tham gia.
        </p>
      )}

      <section aria-labelledby="mutual-heading" className="mt-6">
        <h2 id="mutual-heading" className="mb-3 flex items-center gap-2 text-[17px] font-semibold">
          <Heart size={20} /> Cả hai cùng thích <span className="tabular">({mutual.length})</span>
        </h2>
        {mutual.length === 0 ? (
          <EmptyState title="Chưa có nơi cả hai cùng thích">
            {isCreator ? 'Bạn vẫn có thể chọn một nơi bên dưới, hoặc tạo phiên mới với lựa chọn khác.' : 'Hãy chờ người mời quyết định.'}
          </EmptyState>
        ) : (
          <CandidateList items={mutual} highlight chosen={chosen} onChoose={canFinalize ? setChosen : undefined} />
        )}
      </section>

      {others.length > 0 && (
        <section aria-labelledby="others-heading" className="mt-6">
          <h2 id="others-heading" className="mb-3 text-[17px] font-semibold">
            Các lựa chọn khác
          </h2>
          <CandidateList items={others} chosen={chosen} onChoose={canFinalize ? setChosen : undefined} />
        </section>
      )}

      {canFinalize && chosen && <FinalizePanel session={session} candidateId={chosen} onCancel={() => setChosen(null)} />}
      {session.status === 'FINALIZED' && session.datePlanId && (
        <div className="mt-6">
          <ButtonLink to={`/plans/${session.datePlanId}`}>Xem buổi hẹn đã chốt</ButtonLink>
        </div>
      )}
    </div>
  )
}

function CandidateList({
  items,
  highlight = false,
  chosen,
  onChoose,
}: {
  items: Schemas['ChoiceCandidate'][]
  highlight?: boolean
  chosen: string | null
  onChoose?: (id: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li
          key={c.id}
          className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-block border bg-white p-3 ${
            chosen === c.id ? 'border-action ring-2 ring-action/20' : highlight ? 'border-sky-100' : 'border-line'
          }`}
        >
          <div className="aspect-square overflow-hidden rounded-control">
            <PlaceMedia url={c.place.coverUrl} name={c.place.name} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{c.place.name}</p>
            <p className="text-[13px] text-ink-muted tabular">{priceForTwo(c.place.price) ?? 'Chưa có thông tin giá'}</p>
            {!c.available && <p className="text-[13px] text-attention">Không còn hiển thị</p>}
          </div>
          {onChoose && c.available && (
            <SecondaryButton aria-pressed={chosen === c.id} onClick={() => onChoose(c.id)}>
              {chosen === c.id ? 'Đã chọn' : 'Chọn nơi này'}
            </SecondaryButton>
          )}
        </li>
      ))}
    </ul>
  )
}

function FinalizePanel({ session, candidateId, onCancel }: { session: Schemas['ChoiceSession']; candidateId: string; onCancel: () => void }) {
  const finalize = useFinalizeChoice(session.id)
  const place = usePlace(candidateId)
  const idem = useIdempotencyKey()
  const navigate = useNavigate()
  const toast = useToast()
  const name = session.candidates.find((c) => c.id === candidateId)?.place.name

  return (
    <section aria-labelledby="finalize-heading" className="mt-6 rounded-block border border-action bg-white p-4 md:p-5">
      <h2 id="finalize-heading" className="text-[17px] font-semibold">
        Chốt {name} và tạo kế hoạch
      </h2>
      <div className="mt-4">
        <PlanForm
          key={candidateId}
          hours={place.data?.hours}
          submitLabel="Chốt và tạo kế hoạch"
          pending={finalize.isPending}
          error={finalize.error}
          onChange={() => {
            idem.reset()
            finalize.reset()
          }}
          onSubmit={({ scheduledAt, note }) =>
            finalize.mutate(
              { candidateId, scheduledAt, note: note || undefined, idempotencyKey: idem.get() },
              {
                onSuccess: (plan) => {
                  toast.show('Đã chốt và tạo kế hoạch')
                  navigate(`/plans/${plan.id}`)
                },
              },
            )
          }
        />
      </div>
      <button type="button" onClick={onCancel} className="mt-3 min-h-11 text-sm text-ink-muted hover:text-ink">
        Chọn nơi khác
      </button>
    </section>
  )
}
