import { useEffect, useRef, useState } from 'react'

/** Client ID công khai của Google (không phải secret). Đổi qua VITE_GOOGLE_CLIENT_ID khi cần. */
export const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '796222079602-49c170r0o3v2r24724eu0njjbi1i69uf.apps.googleusercontent.com'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

type GoogleId = {
  initialize: (config: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: 'popup'; use_fedcm_for_prompt?: boolean }) => void
  renderButton: (el: HTMLElement, options: Record<string, string | number>) => void
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } }
  }
}

let gisPromise: Promise<GoogleId> | null = null
function loadGis(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  gisPromise ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('GIS')))
    script.onerror = () => {
      gisPromise = null
      reject(new Error('GIS'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

/**
 * Nút "Tiếp tục với Google" (CR-002). Dùng nút chính thức của Google Identity Services, trả ID token
 * cho `onCredential`. Chế độ dữ liệu minh họa (dev:mock) dùng nút giả để chạy được không cần mạng.
 */
export function GoogleSignInButton({ onCredential, disabled = false }: { onCredential: (idToken: string) => void; disabled?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)
  const mock = import.meta.env.VITE_API_MOCK === '1' || import.meta.env.MODE === 'test'

  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (mock) return
    let cancelled = false
    loadGis()
      .then((gis) => {
        if (cancelled || !host.current) return
        gis.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => r.credential && callback.current(r.credential),
          ux_mode: 'popup',
          use_fedcm_for_prompt: true,
        })
        gis.renderButton(host.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          locale: 'vi',
          width: Math.min(host.current.clientWidth || 320, 400),
        })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [mock])

  if (mock)
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCredential('mock-google-id-token')}
        className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-4 text-sm font-semibold hover:bg-page disabled:opacity-60"
      >
        <GoogleMark /> Tiếp tục với Google
      </button>
    )

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={host} className="flex min-h-11 w-full justify-center" />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Không tải được nút đăng nhập Google. Kiểm tra kết nối mạng rồi tải lại trang.
        </p>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
