import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Clock, Flame, Search, Sparkles, TrendingUp, X } from 'lucide-react'

export interface PinterestSearchBarProps {
  initialValue?: string
  onSubmitQuery?: (query: string) => void
  placeholder?: string
  submitLabel?: string
  pillStyle?: boolean
  className?: string
  autoFocus?: boolean
}

interface RecentSearchItem {
  id: string
  text: string
  imageUrl?: string
}

const STORAGE_KEY = 'gowithbae_recent_searches'

/** Ý tưởng cho buổi hẹn của 2 bạn (phong cách thẻ trực quan Pinterest) */
const DATE_IDEAS = [
  {
    title: 'Cà phê rooftop hoàng hôn',
    query: 'rooftop',
    tag: 'Rooftop',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Workshop làm gốm đôi',
    query: 'làm gốm',
    tag: 'Làm gốm',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Bữa tối lãng mạn',
    query: 'lãng mạn',
    tag: 'Lãng mạn',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Quán có mèo & acoustic',
    query: 'mèo',
    tag: 'Có mèo tại quán',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Boardgame & trà sữa',
    query: 'trò chơi',
    tag: 'Trò chơi',
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Triển lãm & nghệ thuật',
    query: 'nghệ thuật',
    tag: 'Triển lãm',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Làm bánh ngọt đôi',
    query: 'làm bánh',
    tag: 'Làm bánh',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Ven sông & dã ngoại',
    query: 'ven sông',
    tag: 'Ven sông',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80',
  },
]

/** Xu hướng tìm kiếm hot trên GoWithBae */
const TRENDING_TOPICS = [
  'Cà phê Quận 1 view đẹp',
  'Quán nướng Quận 3',
  'Không gian yên tĩnh hẹn đầu',
  'Hẹn hò cuối tuần',
  'Quán chill ngắm hoàng hôn',
  'Bảo tàng & tranh nghệ thuật',
]

export function PinterestSearchBar({
  initialValue = '',
  onSubmitQuery,
  placeholder = 'Tìm tên quán, khu vực, món ăn, hoạt động hẹn hò…',
  submitLabel = 'Tìm',
  pillStyle = false,
  className = '',
  autoFocus = false,
}: PinterestSearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ initial value khi thay đổi (ví dụ khi URL thay đổi)
  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  // Đọc lịch sử tìm kiếm từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // Bỏ qua lỗi parsing
    }
  }, [])

  // Đóng overlay khi bấm Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function saveRecentSearch(text: string, imageUrl?: string) {
    if (!text.trim()) return
    const trimmed = text.trim()
    const next = [
      { id: Date.now().toString(), text: trimmed, imageUrl },
      ...recentSearches.filter((item) => item.text.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8)
    setRecentSearches(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Bỏ qua lỗi lưu storage
    }
  }

  function handleRemoveRecent(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = recentSearches.filter((item) => item.id !== id)
    setRecentSearches(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Bỏ qua lỗi
    }
  }

  function handleClearAllRecent(e: React.MouseEvent) {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Bỏ qua lỗi
    }
  }

  function triggerSearch(text: string, imageUrl?: string) {
    const val = text.trim()
    if (val) {
      saveRecentSearch(val, imageUrl)
    }
    setIsOpen(false)
    if (onSubmitQuery) {
      onSubmitQuery(val)
    } else {
      const params = new URLSearchParams()
      if (val) params.set('q', val)
      navigate(`/search?${params}`)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    triggerSearch(query)
  }

  return (
    <>
      {/* 1. LỚP MỜ BACKDROP PHONG CÁCH PINTEREST (Tập trung toàn bộ sự chú ý vào thanh search) */}
      {isOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Đóng bảng gợi ý tìm kiếm"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
        />
      )}

      {/* 2. THANH TÌM KIẾM NẰM TRÊN MỘT BẬC RIÊNG VÀ TRẢI DÀI RA (Full width) */}
      <div ref={containerRef} className={`relative ${isOpen ? 'z-50' : 'z-10'} w-full ${className}`}>
        <form
          role="search"
          onSubmit={handleSubmit}
          className={`group flex min-h-13 w-full items-center gap-2.5 border bg-white px-4 py-2 transition-all duration-200 sm:gap-3 ${
            pillStyle ? 'rounded-full pr-2 pl-5 shadow-raised' : 'rounded-2xl'
          } ${
            isOpen
              ? 'border-action shadow-2xl ring-4 ring-action/10'
              : pillStyle
                ? 'border-line/90 hover:border-action/50'
                : 'border-line shadow-xs hover:border-field/70 hover:shadow-md'
          }`}
        >
          <Search
            size={20}
            className={`shrink-0 transition-colors ${isOpen ? 'text-action' : 'text-ink-muted group-hover:text-ink'}`}
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            maxLength={100}
            placeholder={placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 bg-transparent text-[15px] font-medium text-ink placeholder:text-ink-muted/70 focus:outline-none md:text-[16px] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-page hover:text-ink"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}

          <button
            type="submit"
            className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white shadow-xs transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              pillStyle
                ? 'min-h-10 rounded-full bg-[linear-gradient(135deg,#f48b8e,#e56b70)] px-5 hover:brightness-95 focus-visible:outline-[#e56b70]'
                : 'min-h-9 rounded-xl bg-action px-4 hover:bg-action-hover focus-visible:outline-action'
            }`}
          >
            <span>{submitLabel}</span>
            {pillStyle && <ArrowRight size={15} aria-hidden="true" />}
          </button>
        </form>

        {/* 3. BẢNG GỢI Ý PINTEREST SEARCH OVERLAY (HIỆN KHI BẤM / FOCUS VÀO THANH TÌM KIẾM) */}
        {isOpen && (
          <div
            className={`absolute top-full mt-2.5 max-h-[calc(100vh-160px)] overflow-y-auto rounded-3xl border border-line bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 md:p-6 ${
              pillStyle ? 'left-0 w-full md:w-[700px] lg:w-[800px]' : 'right-0 left-0'
            }`}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* PHẦN 1: TÌM KIẾM GẦN ĐÂY */}
            {recentSearches.length > 0 && (
              <section aria-labelledby="recent-search-heading" className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 id="recent-search-heading" className="flex items-center gap-2 text-[14px] font-bold text-ink">
                    <Clock size={16} className="text-action" aria-hidden="true" />
                    Tìm kiếm gần đây
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearAllRecent}
                    className="text-xs font-medium text-ink-muted hover:text-danger hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                  {recentSearches.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setQuery(item.text)
                        triggerSearch(item.text, item.imageUrl)
                      }}
                      className="group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent bg-page p-2 transition-all hover:border-line hover:bg-action-soft"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-9 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink-muted shadow-2xs group-hover:text-action">
                          <Search size={15} aria-hidden="true" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink md:text-sm">
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(item.id, e)}
                        className="rounded-full p-1 text-ink-muted opacity-0 transition-opacity hover:bg-white hover:text-danger group-hover:opacity-100"
                        title="Xóa mục này"
                        aria-label={`Xóa ${item.text}`}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PHẦN 2: Ý TƯỞNG DÀNH CHO 2 BẠN (DẠNG THẺ ẢNH PINTEREST) */}
            <section aria-labelledby="ideas-heading" className="mb-6">
              <h3 id="ideas-heading" className="mb-3 flex items-center gap-2 text-[14px] font-bold text-ink">
                <Sparkles size={16} className="text-heart" aria-hidden="true" />
                Ý tưởng dành cho bạn
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {DATE_IDEAS.map((idea) => (
                  <div
                    key={idea.title}
                    onClick={() => {
                      setQuery(idea.title)
                      triggerSearch(idea.query, idea.imageUrl)
                    }}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-page p-2 transition-all hover:scale-[1.02] hover:border-line hover:bg-action-soft hover:shadow-xs"
                  >
                    <img
                      src={idea.imageUrl}
                      alt={idea.title}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-xl object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="min-w-0 flex-1 text-xs font-semibold text-ink group-hover:text-action md:text-sm">
                      {idea.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PHẦN 3: PHỔ BIẾN TRÊN GOWITHBAE */}
            <section aria-labelledby="trending-heading">
              <h3 id="trending-heading" className="mb-3 flex items-center gap-2 text-[14px] font-bold text-ink">
                <TrendingUp size={16} className="text-attention" aria-hidden="true" />
                Phổ biến trên GoWithBae
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setQuery(topic)
                      triggerSearch(topic)
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:border-action hover:bg-action-soft hover:text-action"
                  >
                    <Flame size={13} className="text-attention" aria-hidden="true" />
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  )
}
