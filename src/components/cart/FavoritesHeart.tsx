import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Heart as HeartIcon, MapPin, Trash2, Users, X } from 'lucide-react'
import { problemMessage } from '../../api/problem.ts'
import { useSavedList, useSavedListMutations, useSavedLists } from '../../hooks/saved.ts'
import { priceForTwo } from '../../lib/format.ts'
import { PlaceMedia } from '../place/PlaceMedia.tsx'
import { ErrorState, Skeleton } from '../ui/StateView.tsx'
import { useToast } from '../ui/Toast.tsx'

/**
 * Nút Trái tim ở góc trên phải header kèm số lượng màu đỏ kiểu giỏ hàng Shopee.
 * Bấm vào sẽ mở danh sách các địa điểm đã được người dùng thả tim (danh sách "Đã lưu").
 */
export function FavoritesHeart() {
  const lists = useSavedLists(true)
  const favList = lists.data?.find((l) => l.isDefault)
  const detail = useSavedList(favList?.id ?? '', !!favList)
  const { removePlace, addPlace } = useSavedListMutations()
  const toast = useToast()

  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const isOpen = phase === 'open'
  const isMounted = phase !== 'closed'
  const items = detail.data?.items ?? []
  const count = detail.data ? items.length : (favList?.placeCount ?? 0)

  const closeNow = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setPhase('closed')
  }, [])

  const close = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('closed')
      return
    }
    setPhase((prev) => {
      if (prev === 'closed') return prev
      closeTimer.current = window.setTimeout(() => setPhase('closed'), 210)
      return 'closing'
    })
  }, [])

  const openPanel = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setPhase('open')
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  const handleUnheart = (placeId: string, placeName: string) => {
    if (!favList) return
    const vars = { listId: favList.id, placeId, alreadySaved: true }
    removePlace.mutate(vars, {
      onSuccess: () =>
        toast.show(`Đã bỏ “${placeName}” khỏi Yêu thích`, {
          action: { label: 'Hoàn tác', onClick: () => addPlace.mutate(vars) },
        }),
      onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
    })
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Danh sách yêu thích, ${count} địa điểm` : 'Danh sách yêu thích'}
        onClick={() => (isOpen ? close() : openPanel())}
        className={`group relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-[#fde8ea] hover:text-[#e5535b] ${
          isOpen ? 'bg-[#fde8ea] text-[#e5535b]' : 'text-ink-muted'
        }`}
      >
        <HeartIcon
          size={22}
          strokeWidth={2}
          className={`transition-transform duration-200 group-hover:scale-105 ${
            count > 0 || isOpen ? 'fill-[#f47278]/20 text-[#e5535b]' : ''
          }`}
          aria-hidden="true"
        />
        {/* Badge số màu đỏ trên góc trái tim giống kiểu giỏ hàng Shopee */}
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0 min-w-5 rounded-full bg-[#ee4d2d] px-1 text-center text-[11px] leading-5 font-bold text-white shadow-2xs ring-2 ring-white tabular"
        >
          {count > 99 ? '99+' : count}
        </span>
      </button>

      {isMounted && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Danh sách yêu thích"
          className={`${
            phase === 'closing' ? 'animate-bell-spring-out pointer-events-none' : 'animate-bell-spring-in'
          } absolute top-full right-0 z-50 mt-2 flex w-[340px] max-w-[calc(100vw-1.5rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-[#efe3e6] bg-white shadow-[0_14px_38px_rgb(20_50_74/0.16)] sm:w-[376px]`}
        >
          {/* Header hộp danh sách yêu thích */}
          <div className="flex items-center justify-between gap-2 border-b border-[#f3e8eb] bg-[#fdf6f7] px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-[#fde4e6] text-[#e5535b]"
              >
                <HeartIcon size={15} className="fill-current" />
              </span>
              <h2 className="text-[15px] font-bold text-[#23304e]">Danh sách yêu thích</h2>
              <span className="rounded-full bg-[#ee4d2d] px-2 py-0.5 text-[11px] font-bold text-white tabular">
                {count}
              </span>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Đóng danh sách yêu thích"
              className="inline-flex size-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-ink"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Danh sách địa điểm đã thả tim */}
          <div className="max-h-[340px] overflow-y-auto overscroll-contain p-2.5">
            {lists.isPending || (favList && detail.isPending) ? (
              <div className="flex flex-col gap-2 p-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : detail.isError ? (
              <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-full bg-[#fdf2f3] text-[#e56b70]"
                >
                  <HeartIcon size={22} />
                </span>
                <p className="text-sm font-semibold text-[#23304e]">Chưa có địa điểm yêu thích</p>
                <p className="text-xs leading-relaxed text-[#66708a]">
                  Bấm biểu tượng trái tim trên các địa điểm bạn thích để lưu nhanh vào danh sách này.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {items.map(({ place }) => {
                  const price = priceForTwo(place.price)
                  return (
                    <li
                      key={place.id}
                      className="group flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 transition-colors hover:border-[#f1e4e7] hover:bg-[#fdf7f8]"
                    >
                      <Link
                        to={`/places/${place.id}`}
                        onClick={closeNow}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <div className="relative size-13 shrink-0 overflow-hidden rounded-xl bg-[#f5eff5]">
                          <PlaceMedia url={place.coverUrl} name={place.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-[#23304e] group-hover:text-[#e5535b]">
                            {place.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-[#66708a]">
                            <MapPin size={11} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">{place.areaName ?? 'TP.HCM'}</span>
                            {price && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-[#e26b70] tabular">{price}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnheart(place.id, place.name)}
                        disabled={removePlace.isPending}
                        aria-label={`Bỏ yêu thích ${place.name}`}
                        title="Bỏ yêu thích"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#e5535b] transition-colors hover:bg-[#fde4e6] disabled:opacity-50"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer dẫn tới trang chi tiết danh sách yêu thích hoặc rủ cùng chọn */}
          {favList && (
            <div className="flex items-center justify-between gap-2 border-t border-[#f3e8eb] bg-[#fdf6f7] px-3.5 py-2.5">
              {count > 0 && (
                <Link
                  to={`/choice/new?listId=${favList.id}`}
                  onClick={closeNow}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1fd] px-3 py-1.5 text-xs font-semibold text-[#384670] transition-colors hover:bg-[#e1e6fc]"
                >
                  <Users size={13} aria-hidden="true" />
                  <span>Rủ cùng chọn</span>
                </Link>
              )}
              <Link
                to={`/saved/${favList.id}`}
                onClick={closeNow}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#e5535b] hover:underline"
              >
                <span>Xem toàn bộ yêu thích</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
