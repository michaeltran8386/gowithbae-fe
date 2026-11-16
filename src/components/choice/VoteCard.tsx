import { X } from 'lucide-react'
import { Link } from 'react-router'
import type { Schemas } from '../../api/client.ts'
import { priceForTwo } from '../../lib/format.ts'
import { PlaceMedia } from '../place/PlaceMedia.tsx'
import { Heart } from '../ui/Heart.tsx'

/**
 * Một lựa chọn trong phiên cùng chọn: Thích / Bỏ qua dạng nhóm radio.
 * "Chưa trả lời" là trạng thái riêng, không chọn sẵn, không đồng nghĩa Bỏ qua (RULE-10, UX-05).
 */
export function VoteCard({
  candidate,
  onVote,
  disabled,
}: {
  candidate: Schemas['ChoiceCandidate']
  onVote: (preference: Schemas['VotePreference']) => void
  disabled: boolean
}) {
  const { place, myVote, mutualLike, available } = candidate
  const groupName = `vote-${candidate.id}`
  const price = priceForTwo(place.price)

  return (
    <article className="grid grid-cols-[72px_1fr] gap-3 rounded-block border border-line bg-white p-3 sm:grid-cols-[96px_1fr]">
      <div className="aspect-square overflow-hidden rounded-control">
        <PlaceMedia url={place.coverUrl} name={place.name} />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold">
          <Link to={`/places/${place.id}`} className="hover:text-action">
            {place.name}
          </Link>
        </h3>
        <p className="text-[13px] text-ink-muted">
          {place.areaName ?? 'Chưa có thông tin khu vực'} · <span className="tabular">{price ?? 'Chưa có thông tin giá'}</span>
        </p>
        <p className="mt-1 text-[13px] font-semibold">
          {!available ? (
            <span className="text-attention">Nơi này không còn hiển thị</span>
          ) : mutualLike ? (
            <span className="inline-flex items-center gap-1 text-action-hover">
              <Heart size={14} /> Cả hai cùng thích
            </span>
          ) : myVote == null ? (
            <span className="text-attention">Bạn chưa trả lời</span>
          ) : null}
        </p>
      </div>
      <fieldset className="col-span-2 grid grid-cols-2 gap-2" disabled={disabled || !available}>
        <legend className="sr-only">Lựa chọn của bạn cho {place.name}</legend>
        <label
          className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-action ${
            myVote === 'LIKE' ? 'border-action bg-action text-white' : 'border-line bg-white text-ink'
          } has-disabled:cursor-not-allowed has-disabled:opacity-60`}
        >
          <input type="radio" name={groupName} className="sr-only" checked={myVote === 'LIKE'} onChange={() => onVote('LIKE')} />
          <Heart size={18} filled={myVote === 'LIKE'} className={myVote === 'LIKE' ? '[&_path]:fill-white [&_path]:stroke-white' : ''} />
          Thích
        </label>
        <label
          className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-action ${
            myVote === 'SKIP' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'
          } has-disabled:cursor-not-allowed has-disabled:opacity-60`}
        >
          <input type="radio" name={groupName} className="sr-only" checked={myVote === 'SKIP'} onChange={() => onVote('SKIP')} />
          <X size={18} aria-hidden="true" />
          Bỏ qua
        </label>
      </fieldset>
    </article>
  )
}
