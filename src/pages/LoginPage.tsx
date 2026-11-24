import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { ApiError, fieldErrors, problemMessage } from '../api/problem.ts'
import { useAuth } from '../app/auth.tsx'
import { useAuthMutations } from '../hooks/account.ts'
import { Field } from '../components/ui/Field.tsx'
import { GhostButton, PrimaryButton } from '../components/ui/Button.tsx'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.tsx'

const RESEND_SECONDS = 60 // tham số tạm, chốt theo OQ-06

/** Chỉ cho phép quay về đường dẫn nội bộ (tránh open redirect). */
function safeReturnTo(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

const INTENT_REASON: Record<string, string> = {
  save: 'Đăng nhập để lưu địa điểm vào danh sách của bạn.',
  add: 'Đăng nhập để thêm địa điểm vào giỏ hẹn của bạn.',
  plan: 'Đăng nhập để lưu kế hoạch buổi hẹn.',
}

/**
 * S-06 Đăng nhập — CR-002: thành viên chỉ dùng Google (1 chạm, không chờ mã email).
 * Tài khoản quản trị vẫn dùng email + mã một lần + Authenticator (`?staff=1`).
 */
export function LoginPage() {
  const { state, actions, meta } = useAuth()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { google } = useAuthMutations()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const intent = params.get('intent')
  const destination = intent ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}intent=${encodeURIComponent(intent)}` : returnTo

  if (params.get('staff') === '1')
    return (
      <StaffOtpLogin
        onBack={() => {
          const next = new URLSearchParams(params)
          next.delete('staff')
          setParams(next, { replace: true })
        }}
      />
    )
  if (state.status === 'member') return <Navigate to={meta.isAdmin && destination === '/' ? '/admin' : destination} replace />

  const googleCode = google.error instanceof ApiError ? google.error.problem.code : undefined

  return (
    <div className="rounded-block border border-line bg-white p-5 md:p-8">
      <h1 className="text-2xl font-bold">Đăng nhập GoWithBae</h1>
      <p className="mt-1 text-ink-muted">{(intent && INTENT_REASON[intent]) ?? 'Đăng nhập để lưu địa điểm, rủ mọi người cùng chọn và quản lý buổi hẹn.'}</p>
      <div className="mt-6 flex flex-col gap-3">
        <GoogleSignInButton
          disabled={google.isPending}
          onCredential={(idToken) =>
            google.mutate(idToken, {
              onSuccess: (token) => {
                actions.signIn(token)
                navigate(destination, { replace: true })
              },
            })
          }
        />
        {google.isPending && (
          <p role="status" className="text-center text-sm text-ink-muted">
            Đang đăng nhập…
          </p>
        )}
        {google.error && (
          <p role="alert" className="rounded-control bg-danger-soft px-3.5 py-3 text-sm text-danger">
            {googleCode === 'STAFF_USE_ADMIN_LOGIN' ? 'Tài khoản quản trị đăng nhập bằng email và Authenticator ở mục bên dưới.' : problemMessage(google.error)}
          </p>
        )}
        <p className="text-[13px] text-ink-muted">Không cần mật khẩu hay mã email. Chúng tôi không hỏi thông tin về mối quan hệ của bạn.</p>
      </div>
      <div className="mt-6 border-t border-line pt-4 text-center">
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params)
            next.set('staff', '1')
            setParams(next, { replace: true })
          }}
          className="inline-flex min-h-11 items-center text-sm text-ink-muted underline hover:text-ink"
        >
          Đăng nhập dành cho quản trị viên
        </button>
      </div>
    </div>
  )
}

/** Đăng nhập quản trị: email + mã một lần + Authenticator (FR-07, RULE-16, NFR-05). */
function StaffOtpLogin({ onBack }: { onBack: () => void }) {
  const { state, actions, meta } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const intent = params.get('intent')
  const { requestOtp, verifyOtp } = useAuthMutations()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [staffCode, setStaffCode] = useState('')
  const [needsStaffCode, setNeedsStaffCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const destination = intent ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}intent=${encodeURIComponent(intent)}` : returnTo
  // Quản trị viên đăng nhập không kèm returnTo thì vào thẳng trang quản trị.
  if (state.status === 'member') return <Navigate to={meta.isAdmin && destination === '/' ? '/admin' : destination} replace />

  const sendCode = () =>
    requestOtp.mutate(email.trim(), {
      onSuccess: () => {
        setStep('code')
        setCode('')
        setStaffCode('')
        setNeedsStaffCode(false)
        setCountdown(RESEND_SECONDS)
      },
      onError: (e) => {
        if (e instanceof ApiError && e.retryAfter) setCountdown(e.retryAfter)
      },
    })

  const emailError = requestOtp.error ? (fieldErrors(requestOtp.error).email ?? problemMessage(requestOtp.error)) : undefined
  const verifyCode = verifyOtp.error instanceof ApiError ? verifyOtp.error.problem.code : undefined
  // Tài khoản quản trị: OTP email đúng nhưng cần thêm mã Authenticator — không phải lỗi của ô mã email.
  const codeError =
    verifyOtp.error && verifyCode !== 'STAFF_CODE_REQUIRED' && verifyCode !== 'MFA_NOT_ENROLLED' && !needsStaffCode
      ? (fieldErrors(verifyOtp.error).code ?? problemMessage(verifyOtp.error))
      : undefined
  const staffError =
    needsStaffCode && verifyOtp.error && verifyCode !== 'STAFF_CODE_REQUIRED'
      ? 'Mã Authenticator không đúng hoặc đã dùng. Đợi mã mới rồi thử lại.'
      : undefined

  return (
    <div className="rounded-block border border-line bg-white p-5 md:p-8">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center text-sm text-action hover:underline">
        ← Đăng nhập bằng Google
      </button>
      <h1 className="text-2xl font-bold">Đăng nhập quản trị</h1>
      <p className="mt-1 text-ink-muted">Dành cho tài khoản quản trị: nhập email để nhận mã, sau đó nhập mã trong Google Authenticator.</p>

      {step === 'email' ? (
        <form
          className="mt-6 flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            sendCode()
          }}
        >
          <Field.Root error={emailError}>
            <Field.Label>Email</Field.Label>
            <Field.Input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              maxLength={254}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                requestOtp.reset()
              }}
              placeholder="vd. ban@example.com"
            />
            <Field.Error />
          </Field.Root>
          <PrimaryButton type="submit" pending={requestOtp.isPending} disabled={!email.trim()}>
            Gửi mã đăng nhập
          </PrimaryButton>
        </form>
      ) : (
        <form
          className="mt-6 flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            verifyOtp.mutate(
              { email: email.trim(), code, ...(needsStaffCode ? { staffCode } : {}) },
              {
                onSuccess: (token) => {
                  actions.signIn(token)
                  const isAdmin = token.user.roles.includes('SUPER_ADMIN')
                  navigate(isAdmin && destination === '/' ? '/admin' : destination, { replace: true })
                },
                onError: (e) => {
                  if (e instanceof ApiError && e.problem.code === 'STAFF_CODE_REQUIRED') setNeedsStaffCode(true)
                },
              },
            )
          }}
        >
          {/* Không xác nhận email có tài khoản hay không (server luôn trả 202) */}
          <p role="status" className="text-sm">
            Nếu email hợp lệ, mã gồm 6 chữ số đã được gửi tới <span className="font-semibold">{email}</span>.
          </p>
          <Field.Root error={codeError}>
            <Field.Label>Mã đăng nhập</Field.Label>
            <Field.Input
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              spellCheck={false}
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''))
                verifyOtp.reset()
              }}
              className="text-lg tracking-[0.3em] tabular"
            />
            <Field.Error />
          </Field.Root>
          {needsStaffCode && (
            <Field.Root error={staffError} hint>
              <Field.Label>Mã trong Google Authenticator</Field.Label>
              <Field.Hint>Tài khoản quản trị cần thêm mã 6 số đang hiện trong ứng dụng Authenticator.</Field.Hint>
              <Field.Input
                name="staffCode"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                spellCheck={false}
                autoFocus
                value={staffCode}
                onChange={(e) => {
                  setStaffCode(e.target.value.replace(/\D/g, ''))
                  verifyOtp.reset()
                }}
                className="text-lg tracking-[0.3em] tabular"
              />
              <Field.Error />
            </Field.Root>
          )}
          {verifyCode === 'MFA_NOT_ENROLLED' && (
            <p role="alert" className="rounded-control bg-peach-50 px-3 py-2 text-sm text-attention">
              Tài khoản quản trị chưa kích hoạt Google Authenticator. Hãy mở link kích hoạt mà quản trị viên đã gửi cho bạn.
            </p>
          )}
          <PrimaryButton
            type="submit"
            pending={verifyOtp.isPending}
            disabled={code.length !== 6 || (needsStaffCode && staffCode.length !== 6)}
          >
            Đăng nhập
          </PrimaryButton>
          <div className="flex flex-wrap justify-between gap-2">
            <GhostButton disabled={countdown > 0 || requestOtp.isPending} onClick={sendCode}>
              {countdown > 0 ? (
                <span className="tabular">
                  Gửi lại mã sau {countdown} giây
                </span>
              ) : (
                'Gửi lại mã'
              )}
            </GhostButton>
            <GhostButton onClick={() => setStep('email')}>Đổi email</GhostButton>
          </div>
        </form>
      )}
    </div>
  )
}
