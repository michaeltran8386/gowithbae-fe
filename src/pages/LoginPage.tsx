import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { ApiError, fieldErrors, problemMessage } from '../api/problem.ts'
import { useAuth } from '../app/auth.tsx'
import { useAuthMutations } from '../hooks/account.ts'
import { Field } from '../components/ui/Field.tsx'
import { GhostButton, PrimaryButton } from '../components/ui/Button.tsx'

const RESEND_SECONDS = 60 // tham số tạm, chốt theo OQ-06

/** Chỉ cho phép quay về đường dẫn nội bộ (tránh open redirect). */
function safeReturnTo(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

const INTENT_REASON: Record<string, string> = {
  save: 'Đăng nhập để lưu địa điểm vào danh sách của bạn.',
  plan: 'Đăng nhập để lưu kế hoạch buổi hẹn.',
}

/** S-06 Đăng nhập bằng email + mã một lần — FR-07, RULE-16 (phương thức là PROP, OQ-06). */
export function LoginPage() {
  const { state, actions } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const intent = params.get('intent')
  const { requestOtp, verifyOtp } = useAuthMutations()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [staffCode, setStaffCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const destination = intent ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}intent=${encodeURIComponent(intent)}` : returnTo
  if (state.status === 'member') return <Navigate to={destination} replace />

  const sendCode = () =>
    requestOtp.mutate(email.trim(), {
      onSuccess: () => {
        setStep('code')
        setCode('')
        setCountdown(RESEND_SECONDS)
      },
      onError: (e) => {
        if (e instanceof ApiError && e.retryAfter) setCountdown(e.retryAfter)
      },
    })

  const emailError = requestOtp.error ? (fieldErrors(requestOtp.error).email ?? problemMessage(requestOtp.error)) : undefined
  const codeError = verifyOtp.error ? (fieldErrors(verifyOtp.error).code ?? problemMessage(verifyOtp.error)) : undefined

  return (
    <div className="rounded-block border border-line bg-white p-5 md:p-8">
      <h1 className="text-2xl font-bold">Đăng nhập GoWithBae</h1>
      <p className="mt-1 text-ink-muted">{(intent && INTENT_REASON[intent]) ?? 'Đăng nhập để lưu địa điểm, mời người ấy cùng chọn và quản lý buổi hẹn.'}</p>

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
          <p className="text-[13px] text-ink-muted">Không cần mật khẩu. Chúng tôi không hỏi thông tin về mối quan hệ của bạn.</p>
        </form>
      ) : (
        <form
          className="mt-6 flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            verifyOtp.mutate(
              { email: email.trim(), code, ...(staffCode.trim() ? { staffCode: staffCode.trim() } : {}) },
              {
                onSuccess: (token) => {
                  actions.signIn(token)
                  navigate(destination, { replace: true })
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
          <details className="text-sm text-ink-muted">
            <summary className="cursor-pointer select-none hover:text-ink">Đăng nhập tài khoản nhân viên / quản trị (nếu có)</summary>
            <div className="mt-3">
              <Field.Root hint>
                <Field.Label optional>Mã xác thực 2 bước (TOTP)</Field.Label>
                <Field.Input
                  name="staffCode"
                  inputMode="numeric"
                  maxLength={6}
                  spellCheck={false}
                  value={staffCode}
                  onChange={(e) => {
                    setStaffCode(e.target.value.replace(/\D/g, ''))
                    verifyOtp.reset()
                  }}
                  placeholder="6 chữ số từ Authenticator"
                  className="tracking-[0.2em] tabular"
                />
                <Field.Hint>Chỉ nhập nếu tài khoản của bạn thuộc vai trò nội bộ (Editor, Reviewer, Support, Super Admin).</Field.Hint>
              </Field.Root>
            </div>
          </details>
          <PrimaryButton type="submit" pending={verifyOtp.isPending} disabled={code.length !== 6}>
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
