/** Trái tim thương hiệu (màu cam đào của logo). Luôn đi kèm chữ — không mang nghĩa chỉ bằng màu. */
export function Heart({ filled = true, size = 20, className = '' }: { filled?: boolean; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 20.5s-7.2-4.5-9.4-8.8C1 8.4 3.1 4.5 6.8 4.5c2.1 0 3.4 1.2 5.2 3.2 1.8-2 3.1-3.2 5.2-3.2 3.7 0 5.8 3.9 4.2 7.2-2.2 4.3-9.4 8.8-9.4 8.8z"
        fill={filled ? 'var(--color-heart)' : 'none'}
        stroke="var(--color-heart)"
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  )
}
