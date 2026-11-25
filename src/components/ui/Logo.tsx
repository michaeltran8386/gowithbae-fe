import { Link } from 'react-router'

/** Logo thương hiệu đồng bộ tông màu hồng san hô pastel & xanh navy của thiết kế mới. */
export function Logo() {
  return (
    <Link to="/" translate="no" className="inline-flex min-h-11 items-center gap-1.5 text-[19px] font-extrabold tracking-tight text-[#23304e]">
      <span
        aria-hidden="true"
        className="inline-flex size-6.5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f48b8e,#e56b70)] text-white shadow-[0_2px_8px_rgba(229,107,112,0.35)]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </span>
      <span>
        GoWith<span className="text-[#e56b70]">Bae</span>
      </span>
    </Link>
  )
}
