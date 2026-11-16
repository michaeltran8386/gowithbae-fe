import { Link } from 'react-router'
import { Heart } from './Heart.tsx'

/** Logo chữ tạm. Thay bằng logo vector chính thức khi có (OQ-01). */
export function Logo() {
  return (
    <Link to="/" translate="no" className="inline-flex items-center gap-1 text-[19px] font-bold tracking-tight text-action">
      GoWithBae
      <Heart size={16} />
    </Link>
  )
}
