import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import QRCode from 'qrcode'
import { CircleCheck } from 'lucide-react'
import { problemMessage } from '../../api/problem.ts'
import { useCompleteMfaActivation, useMfaActivation } from '../../hooks/admin.ts'
import { Field } from '../../components/ui/Field.tsx'
import { ButtonLink, PrimaryButton } from '../../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../../components/ui/StateView.tsx'
import { formatDateTime } from '../../lib/format.ts'

/**
 * Kích hoạt Google Authenticator cho tài khoản quản trị bằng link dùng 1 lần (24 giờ).
 * Mã QR sinh ngay trong trình duyệt từ otpauth URI; secret không gửi đi đâu khác.
 */
export function ActivateMfaPage() {
  const { token = '' } = useParams()
  const activation = useMfaActivation(token)
  const complete = useCompleteMfaActivation(token)
  const [qr, setQr] = useState<string | null>(null)
  const [code, setCode] = useState('')

  const uri = activation.data?.otpauthUri
  useEffect(() => {
    if (!uri) return
    let alive = true
    QRCode.toDataURL(uri, { width: 220, margin: 1 }).then((url) => alive && setQr(url))
    return () => {
      alive = false
    }
  }, [uri])

  if (complete.isSuccess)
    return (
      <div className="rounded-block border border-line bg-white p-6 text-center md:p-8">
        <CircleCheck size={40} className="mx-auto text-success" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold">Đã bật Google Authenticator</h1>
        <p className="mt-2 text-ink-muted">Từ giờ đăng nhập quản trị cần mã email và mã 6 số trong ứng dụng.</p>
        <ButtonLink to="/login" className="mt-6">
          Đăng nhập
        </ButtonLink>
      </div>
    )

  if (activation.isPending) return <LoadingState label="Đang kiểm tra link kích hoạt…" />
  if (activation.isError)
    return (
      <EmptyState title="Link kích hoạt không còn hiệu lực" action={<ButtonLink to="/login">Về trang đăng nhập</ButtonLink>}>
        Link chỉ dùng được một lần trong 24 giờ. Hãy nhờ quản trị viên cấp link mới.
      </EmptyState>
    )

  const data = activation.data
  return (
    <div className="rounded-block border border-line bg-white p-5 md:p-8">
      <h1 className="text-2xl font-bold">Kích hoạt đăng nhập quản trị</h1>
      <p className="mt-1 text-ink-muted">
        Tài khoản <span className="font-semibold">{data.email}</span>. Link hết hạn lúc {formatDateTime(data.expiresAt)}.
      </p>

      <ol className="mt-6 flex flex-col gap-5 text-sm">
        <li>
          <p className="font-semibold">1. Cài Google Authenticator (hoặc ứng dụng TOTP tương tự) trên điện thoại.</p>
        </li>
        <li>
          <p className="font-semibold">2. Quét mã QR bằng ứng dụng.</p>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {qr ? (
              <img src={qr} width={220} height={220} alt="Mã QR để thêm GoWithBae vào Authenticator" className="rounded-control border border-line" />
            ) : (
              <div className="size-[220px] animate-pulse rounded-control bg-page" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="text-ink-muted">Không quét được? Nhập khóa này vào ứng dụng:</p>
              <code className="mt-1 block break-all rounded-control bg-page px-3 py-2 font-mono text-[13px] tracking-wider">
                {data.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
            </div>
          </div>
        </li>
        <li>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              complete.mutate(code)
            }}
            className="flex flex-col gap-3"
          >
            <p className="font-semibold">3. Nhập mã 6 số đang hiện trong ứng dụng để xác nhận.</p>
            <Field.Root error={complete.isError ? problemMessage(complete.error) : undefined}>
              <Field.Label>Mã xác nhận</Field.Label>
              <Field.Input
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''))
                  complete.reset()
                }}
                className="max-w-48 text-lg tracking-[0.3em] tabular"
              />
              <Field.Error />
            </Field.Root>
            <PrimaryButton type="submit" pending={complete.isPending} disabled={code.length !== 6} className="self-start">
              Kích hoạt
            </PrimaryButton>
          </form>
        </li>
      </ol>
      <p className="mt-6 text-[13px] text-ink-muted">
        Không phải bạn? Đừng quét mã này. <Link to="/" className="underline">Về trang chủ</Link>
      </p>
    </div>
  )
}
