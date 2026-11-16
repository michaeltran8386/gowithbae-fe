import { Link } from 'react-router'
import { Check, GitCompareArrows, X } from 'lucide-react'
import { MAX_COMPARE, useCompare } from '../../app/compare.tsx'
import { useToast } from '../ui/Toast.tsx'

/** Thêm/bỏ khỏi khay so sánh; khay đầy thì báo đúng câu SRS (AC-005). */
export function CompareToggle({ placeId, placeName }: { placeId: string; placeName: string }) {
  const { actions, meta } = useCompare()
  const toast = useToast()
  const active = meta.has(placeId)
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`So sánh ${placeName}`}
      onClick={() => {
        if (!actions.toggle(placeId)) toast.show('Bạn chỉ có thể so sánh tối đa 3 địa điểm. Bỏ bớt một nơi trong khay để thêm.', { tone: 'error' })
      }}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-control border px-3 text-sm font-semibold transition-colors ${
        active ? 'border-action bg-action-soft text-action' : 'border-line bg-white text-ink-muted hover:text-ink'
      }`}
    >
      {active ? <Check size={18} aria-hidden="true" /> : <GitCompareArrows size={18} aria-hidden="true" />}
      <span className="max-[400px]:sr-only">So sánh</span>
    </button>
  )
}

/** Khay nổi đáy màn (UX-14). Ẩn khi chưa có nơi nào. */
export function CompareTray() {
  const { state, actions } = useCompare()
  const count = state.ids.length
  if (count === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 md:bottom-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-1.5 pl-4 shadow-raised">
        <span className="text-sm font-semibold tabular">
          So sánh {count}/{MAX_COMPARE}
        </span>
        <button type="button" onClick={actions.clear} aria-label="Xóa khay so sánh" className="rounded-full p-2 text-ink-muted hover:bg-page">
          <X size={16} aria-hidden="true" />
        </button>
        {count >= 2 ? (
          <Link to={`/compare?ids=${state.ids.join(',')}`} className="rounded-full bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover">
            Xem so sánh
          </Link>
        ) : (
          <span className="rounded-full bg-page px-4 py-2 text-sm text-ink-muted">Thêm ít nhất 1 nơi nữa</span>
        )}
      </div>
    </div>
  )
}
