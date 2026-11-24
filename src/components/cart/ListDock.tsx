import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Check, ChevronRight, Plus } from 'lucide-react'
import { nextListName, useCart } from '../../app/cart.tsx'
import { problemMessage } from '../../api/problem.ts'
import { useSavedListMutations, useSavedLists } from '../../hooks/saved.ts'
import { resolveActiveList } from '../place/SaveToList.tsx'
import { Heart } from '../ui/Heart.tsx'
import { useToast } from '../ui/Toast.tsx'
import { ListIcon } from './CartIcons.tsx'

/**
 * Vị trí: màn ≥1280px nằm giữa mép phải (khoảng trống ngoài nội dung); màn hẹp hơn ở góc dưới phải để không che nút trên thẻ.
 * Icon list nổi ở mép phải khi lướt địa điểm (CR-002). Là đích của hiệu ứng "bay vào list";
 * bấm vào để xem/đổi danh sách mà nút "+" đang thêm vào, hoặc tạo danh sách mới.
 */
export function ListDock() {
  const lists = useSavedLists()
  const cart = useCart()
  const { create } = useSavedListMutations()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const active = resolveActiveList(lists.data, cart.state.activeListId)
  const count = active?.placeCount ?? 0
  const registerDock = cart.actions.registerDock
  const dockRef = useCallback((el: HTMLButtonElement | null) => registerDock(el), [registerDock])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const createList = () =>
    create.mutate(nextListName(lists.data ?? []), {
      onSuccess: (l) => {
        cart.actions.setActiveList(l.id)
        toast.show(`Đã tạo “${l.name}”. Bấm + trên địa điểm để thêm vào.`)
      },
      onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
    })

  return (
    <div
      ref={root}
      className="fixed right-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 md:right-5 md:bottom-24 xl:top-1/2 xl:bottom-auto xl:-translate-y-1/2"
    >
      <button
        ref={dockRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={active ? `Danh sách đang chọn: ${active.name}, ${count} địa điểm` : 'Danh sách: chưa có danh sách'}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-13 items-center justify-center rounded-full border border-line bg-white text-action shadow-raised transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-action"
      >
        <ListIcon size={26} />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -left-1 min-w-5 rounded-full bg-attention px-1 text-center text-[11px] leading-5 font-bold text-white tabular">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Chọn danh sách cho nút +"
          className="animate-panel-in absolute right-full bottom-0 mr-3 w-72 max-w-[calc(100vw-5rem)] rounded-block xl:top-1/2 xl:bottom-auto xl:-translate-y-1/2 border border-line bg-white p-3 shadow-raised"
        >
          <p className="px-1 text-[13px] text-ink-muted">Nút + sẽ thêm vào:</p>
          <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
            {lists.data?.map((l) => {
              const selected = l.id === active?.id
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      cart.actions.setActiveList(l.id)
                      setOpen(false)
                    }}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-left text-sm ${selected ? 'bg-action-soft font-semibold text-action' : 'hover:bg-page'}`}
                  >
                    {l.isDefault ? <Heart size={16} /> : <span className="size-4" aria-hidden="true" />}
                    <span className="min-w-0 flex-1 truncate">{l.name}</span>
                    <span className="text-[12px] text-ink-muted tabular">{l.placeCount}</span>
                    {selected && <Check size={16} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
            <button
              type="button"
              disabled={create.isPending}
              onClick={createList}
              className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-action hover:bg-action-soft disabled:opacity-60"
            >
              <Plus size={16} aria-hidden="true" /> Danh sách mới
            </button>
            {active && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(`/saved/${active.id}`)
                }}
                className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm hover:bg-page"
              >
                <span className="flex-1 text-left">Mở “{active.name}”</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
            <Link to="/saved" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm hover:bg-page">
              <span className="flex-1">Mở giỏ hẹn</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
