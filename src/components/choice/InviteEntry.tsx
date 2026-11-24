import { Link } from 'react-router'
import { ChevronRight, Users } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { ButtonLink } from '../ui/Button.tsx'

/** CR-002: rủ cùng chọn từ một danh sách có ít nhất 1 nơi; nơi thêm sau tự cập nhật cho người được mời. */
export const MIN_INVITE_PLACES = 1

export const canInviteFrom = (list: Pick<Schemas['SavedListSummary'], 'placeCount'>) => list.placeCount >= MIN_INVITE_PLACES

/** Đường dẫn "Rủ cùng chọn" của một danh sách: mở phiên đang chạy nếu có, nếu không thì tạo lời mời. */
export const inviteHref = (list: Pick<Schemas['SavedListSummary'], 'id' | 'activeChoiceSessionId'>) =>
  list.activeChoiceSessionId ? `/choice/${list.activeChoiceSessionId}` : `/choice/new?listId=${list.id}`

/** Thẻ giới thiệu "Cùng chọn" ở Khám phá: nói rõ cần lưu trước, rồi dẫn tới trang tạo lời mời. */
export function ChoiceCallout() {
  return (
    <section aria-labelledby="choice-callout-heading" className="flex flex-col gap-3 rounded-block border border-sky-100 bg-action-soft p-4 md:flex-row md:items-center md:p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-action" aria-hidden="true">
        <Users size={22} />
      </span>
      <div className="flex-1">
        <h2 id="choice-callout-heading" className="text-[17px] font-semibold">
          Chưa biết đi đâu? Rủ mọi người cùng chọn
        </h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Bấm + để gom nơi vào danh sách, gửi link cho bao nhiêu người cũng được. Ai cũng bấm Thích hoặc Bỏ qua, bạn chốt nơi đi.
        </p>
      </div>
      <ButtonLink to="/choice/new" icon={<Users size={18} aria-hidden="true" />}>
        Rủ cùng chọn
      </ButtonLink>
    </section>
  )
}

/** Chọn danh sách để tạo lời mời; danh sách chưa đủ nơi thì nói còn thiếu bao nhiêu. */
export function InviteListPicker({ lists }: { lists: Schemas['SavedListSummary'][] }) {
  return (
    <ul className="flex flex-col gap-2">
      {lists.map((l) => {
        const ok = canInviteFrom(l)
        return (
          <li key={l.id}>
            {ok ? (
              <Link
                to={inviteHref(l)}
                className="flex min-h-16 items-center gap-3 rounded-block border border-line bg-white px-4 py-3 hover:border-action"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{l.name}</span>
                  <span className="text-[13px] text-ink-muted tabular">{l.placeCount} địa điểm</span>
                </span>
                <span className="text-sm font-semibold text-action">{l.activeChoiceSessionId ? 'Xem phiên đang chọn' : 'Chọn danh sách này'}</span>
                <ChevronRight size={18} className="text-action" aria-hidden="true" />
              </Link>
            ) : (
              <div className="flex min-h-16 items-center gap-3 rounded-block border border-dashed border-line bg-page px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-muted">{l.name}</span>
                  <span className="text-[13px] text-ink-muted tabular">
                    Danh sách trống · bấm + trên địa điểm để thêm
                  </span>
                </span>
                <Link to={`/saved/${l.id}`} className="text-sm text-action underline">
                  Mở danh sách
                </Link>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
