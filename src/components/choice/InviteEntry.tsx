import { Link } from 'react-router'
import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'

/** CR-002: rủ cùng chọn từ một danh sách có ít nhất 1 nơi; nơi thêm sau tự cập nhật cho người được mời. */
export const MIN_INVITE_PLACES = 1

export const canInviteFrom = (list: Pick<Schemas['SavedListSummary'], 'placeCount'>) => list.placeCount >= MIN_INVITE_PLACES

/** Đường dẫn "Rủ cùng chọn" của một danh sách: mở phiên đang chạy nếu có, nếu không thì tạo lời mời. */
export const inviteHref = (list: Pick<Schemas['SavedListSummary'], 'id' | 'activeChoiceSessionId'>) =>
  list.activeChoiceSessionId ? `/choice/${list.activeChoiceSessionId}` : `/choice/new?listId=${list.id}`

/** Thẻ bento "Cùng chọn" ở Khám phá: nổi bật bên cạnh danh sách Đang hot, dẫn tới trang tạo lời mời. */
export function ChoiceCallout() {
  return (
    <section
      aria-labelledby="choice-callout-heading"
      className="flex h-full flex-col items-center justify-between gap-3 rounded-[28px] border border-[#d6defa] bg-[linear-gradient(155deg,#dce3fc_0%,#e6e9fb_58%,#f3e8f6_100%)] p-5 text-center shadow-xs"
    >
      <div>
        <h2 id="choice-callout-heading" className="text-[18px] leading-6 font-bold text-[#23304e]">
          <span className="sr-only">Chưa biết đi đâu? Rủ mọi người cùng chọn</span>
          <span aria-hidden="true" className="block">
            Không biết đi đâu?
          </span>
          <span aria-hidden="true" className="block">
            Để <span className="text-[#e26b70] underline decoration-[#eca0a4] decoration-wavy underline-offset-4">GoWithBae</span> quyết giúp!
          </span>
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#4f5b7c]">
          Mỗi người chọn nơi mình thích,
          <br />
          hệ thống sẽ tìm điểm giao nhau.
          <span className="sr-only"> Bấm + để gom nơi vào danh sách, gửi link cho bao nhiêu người cũng được. Ai cũng bấm Thích hoặc Bỏ qua, bạn chốt nơi đi.</span>
        </p>
      </div>

      {/* Minh họa 2 thẻ gợi ý ghép trái tim sắc nét theo đúng thiết kế mockup */}
      <div aria-hidden="true" className="relative my-1.5 flex h-17 w-44 items-center justify-center select-none">
        {/* 3 tia doodle bên trái */}
        <svg viewBox="0 0 20 26" className="absolute bottom-2 left-0 h-5 w-4 text-[#3b4a72]" fill="none">
          <path d="M14 5L5 2M12 13L3 13M14 20L6 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* 3 tia doodle bên phải trên */}
        <svg viewBox="0 0 20 26" className="absolute -top-1 right-0 h-5 w-4 rotate-180 text-[#3b4a72]" fill="none">
          <path d="M14 5L5 2M12 13L3 13M14 20L6 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Thẻ Polaroid trái: Tách cà phê ấm áp */}
        <div className="relative z-10 -mr-1.5 h-14 w-16 -rotate-10 overflow-hidden rounded-xl border-[3px] border-white bg-[#f8d7da] shadow-[0_6px_14px_rgba(35,48,78,0.14)]">
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=240&q=85"
            alt=""
            onError={(e) => {
              e.currentTarget.src = '/images/topics/cafe.png'
            }}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Trái tim đỏ san hô kết nối ở giữa */}
        <div className="relative z-30 -mx-2 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_12px_rgba(229,107,112,0.45)]">
          <svg viewBox="0 0 24 24" className="size-4 text-[#e5535b]" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        {/* Thẻ Polaroid phải: Vòng quay mặt trời bầu trời xanh */}
        <div className="relative z-20 -ml-1.5 h-14 w-16 rotate-8 overflow-hidden rounded-xl border-[3px] border-white bg-[#d5e3fc] shadow-[0_6px_14px_rgba(35,48,78,0.14)]">
          <img
            src="https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=240&q=85"
            alt=""
            onError={(e) => {
              e.currentTarget.src = '/images/topics/bar.png'
            }}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <Link
        to="/choice/new"
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#5b6c9e,#3a4873)] px-6 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <span aria-hidden="true">Bắt đầu</span>
        <span className="sr-only">Rủ cùng chọn</span>
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
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
