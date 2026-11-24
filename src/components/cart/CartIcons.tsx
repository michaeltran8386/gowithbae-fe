/**
 * Icon riêng của GoWithBae (CR-002): giỏ hẹn có trái tim, và tờ danh sách cho icon list ở mép phải.
 * Vẽ bằng currentColor để theo màu chữ; trái tim dùng màu thương hiệu.
 */
export function CartIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7.5 9.5 10 4.5M16.5 9.5 14 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M3 9.5h18l-1.6 8.6a2.4 2.4 0 0 1-2.36 1.9H6.96a2.4 2.4 0 0 1-2.36-1.9L3 9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 17.2s-2.9-1.8-3.6-3.4c-.5-1.2.3-2.5 1.6-2.5.8 0 1.4.5 2 1.2.6-.7 1.2-1.2 2-1.2 1.3 0 2.1 1.3 1.6 2.5-.7 1.6-3.6 3.4-3.6 3.4Z"
        fill="var(--color-heart)"
      />
    </svg>
  )
}

export function ListIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h8M8 17h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18.5" cy="18.5" r="4" fill="var(--color-action)" stroke="white" strokeWidth="1.5" />
      <path d="M18.5 16.8v3.4M16.8 18.5h3.4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
