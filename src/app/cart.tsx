import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '../lib/storage.ts'

/**
 * Giỏ hẹn (CR-002): nhớ danh sách đang chọn cho nút "+", và chạy hiệu ứng "bay vào list".
 * Chỉ giữ trạng thái giao diện; dữ liệu danh sách vẫn lấy từ API (hooks/saved.ts).
 */
type CartContextValue = {
  state: { activeListId: string | null }
  actions: {
    setActiveList: (id: string | null) => void
    /**
     * Gắn phần tử đích của hiệu ứng bay. Dùng như callback ref (React 19 nhận hàm dọn dẹp):
     * đích mới nhất thắng, gỡ ra thì trả về đích trước (vd. popup bộ sưu tập che icon list nổi).
     */
    registerDock: (el: HTMLElement | null) => (() => void) | undefined
    /** Bay một ảnh thu nhỏ từ `from` vào icon list, rồi làm icon "nảy". */
    flyToDock: (from: HTMLElement | null, imageUrl?: string | null) => void
    bumpDock: () => void
  }
}

const KEY = 'gwb.activeList'
const CartContext = createContext<CartContextValue | null>(null)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CartProvider({ children }: { children: ReactNode }) {
  const [activeListId, setActiveListId] = useState<string | null>(() => readStorage(KEY))
  const docks = useRef<HTMLElement[]>([])
  const currentDock = () => docks.current.at(-1) ?? null

  const bumpDock = useCallback(() => {
    const el = currentDock()
    if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' },
    )
  }, [])

  const flyToDock = useCallback(
    (from: HTMLElement | null, imageUrl?: string | null) => {
      const target = currentDock()
      if (!from || !target || prefersReducedMotion() || typeof document.body.animate !== 'function') {
        bumpDock()
        return
      }
      const a = from.getBoundingClientRect()
      const b = target.getBoundingClientRect()
      const size = 56
      const startX = a.left + a.width / 2 - size / 2
      const startY = a.top + a.height / 2 - size / 2
      const dx = b.left + b.width / 2 - size / 2 - startX
      const dy = b.top + b.height / 2 - size / 2 - startY

      const ghost = document.createElement('div')
      ghost.setAttribute('aria-hidden', 'true')
      Object.assign(ghost.style, {
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '9999px',
        zIndex: '60',
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgb(0 0 0 / .22)',
        border: '3px solid white',
        background: imageUrl ? `center / cover no-repeat url("${imageUrl.replace(/"/g, '%22')}")` : 'var(--color-heart)',
        willChange: 'transform, opacity',
      } satisfies Partial<CSSStyleDeclaration>)
      // Đích nằm trong <dialog> (top layer) thì ảnh bay cũng phải ở trong đó mới không bị lớp phủ che.
      ;(target.closest('dialog') ?? document.body).appendChild(ghost)

      // Đường cong: bay vọt lên một chút rồi lượn vào icon (giữa hành trình nâng lên ~80px).
      const lift = Math.min(120, Math.abs(dy) * 0.35 + 60)
      const anim = ghost.animate(
        [
          { transform: 'translate(0, 0) scale(.6)', opacity: 0.4 },
          { transform: 'translate(0, 0) scale(1.05)', opacity: 1, offset: 0.12 },
          { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - lift}px) scale(.85)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.55 },
        ],
        { duration: 620, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' },
      )
      const done = () => {
        ghost.remove()
        bumpDock()
      }
      anim.onfinish = done
      anim.oncancel = done
    },
    [bumpDock],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      state: { activeListId },
      actions: {
        setActiveList: (id) => {
          setActiveListId(id)
          writeStorage(KEY, id)
        },
        registerDock: (el) => {
          if (!el) return undefined
          docks.current.push(el)
          return () => {
            docks.current = docks.current.filter((d) => d !== el)
          }
        },
        flyToDock,
        bumpDock,
      },
    }),
    [activeListId, flyToDock, bumpDock],
  )

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart() {
  const ctx = use(CartContext)
  if (!ctx) throw new Error('useCart phải nằm trong CartProvider')
  return ctx
}

/** Tên tự động cho danh sách mới: "Danh sách N" với N nhỏ nhất chưa dùng. */
export function nextListName(existing: { name: string }[]) {
  const used = new Set(existing.map((l) => l.name.trim().toLowerCase()))
  let n = 1
  while (used.has(`danh sách ${n}`)) n++
  return `Danh sách ${n}`
}
