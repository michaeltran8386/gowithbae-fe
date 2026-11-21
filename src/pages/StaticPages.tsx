import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { useSiteContent } from '../hooks/adminSupport.ts'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateView.tsx'

/** Trang tĩnh công khai lấy chữ từ "Nội dung web" trong trang quản trị. */

function StaticShell({ title, children }: { title: string; children: (c: NonNullable<ReturnType<typeof useSiteContent>['data']>) => ReactNode }) {
  const content = useSiteContent()
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl leading-8 font-bold md:text-3xl md:leading-9">{title}</h1>
      {content.isPending ? <LoadingState /> : content.isError ? <ErrorState error={content.error} onRetry={() => content.refetch()} /> : children(content.data)}
    </article>
  )
}

/**
 * Hiển thị văn bản thuần theo quy ước đơn giản: dòng trống tách đoạn, "# " là tiêu đề, "- " là gạch đầu dòng.
 * Không dùng HTML từ dữ liệu nên không có nguy cơ chèn mã.
 */
export function PlainText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="flex flex-col gap-3 leading-7">
      {blocks.map((b, i) => {
        if (b.startsWith('# ')) return <h2 key={i} className="mt-2 text-lg font-bold">{b.slice(2)}</h2>
        const lines = b.split('\n')
        if (lines.every((l) => l.startsWith('- ')))
          return (
            <ul key={i} className="list-disc pl-6">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          )
        return (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        )
      })}
    </div>
  )
}

export function FaqPage() {
  return (
    <StaticShell title="Câu hỏi thường gặp">
      {(c) =>
        c.faq.length === 0 ? (
          <EmptyState title="Chưa có câu hỏi nào" />
        ) : (
          <div className="flex flex-col gap-2">
            {c.faq.map((f, i) => (
              <details key={i} className="group rounded-block border border-line bg-white px-4 py-3" open={i === 0}>
                <summary className="cursor-pointer font-semibold">{f.question}</summary>
                <div className="mt-2 text-ink-muted">
                  <PlainText text={f.answer} />
                </div>
              </details>
            ))}
            <p className="mt-4 text-sm text-ink-muted">
              Chưa thấy câu trả lời? <Link to="/contact" className="text-action underline">Liên hệ</Link> hoặc gửi yêu cầu hỗ trợ trong mục Tài khoản.
            </p>
          </div>
        )
      }
    </StaticShell>
  )
}

export function TermsPage() {
  return <StaticShell title="Điều khoản sử dụng">{(c) => <PlainText text={c.terms.body} />}</StaticShell>
}

export function PrivacyPage() {
  return <StaticShell title="Chính sách quyền riêng tư">{(c) => <PlainText text={c.privacy.body} />}</StaticShell>
}

export function ContactPage() {
  return (
    <StaticShell title="Liên hệ">
      {({ contact }) => {
        const facebook = contact.facebook && /^https?:\/\//.test(contact.facebook) ? contact.facebook : null
        const rows = [
          contact.email && { icon: Mail, label: 'Email', value: <a href={`mailto:${contact.email}`} className="text-action underline">{contact.email}</a> },
          contact.phone && { icon: Phone, label: 'Điện thoại', value: <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-action underline">{contact.phone}</a> },
          contact.address && { icon: MapPin, label: 'Địa chỉ', value: contact.address },
          facebook && { icon: Globe, label: 'Facebook', value: <a href={facebook} target="_blank" rel="noreferrer" className="text-action underline">{facebook}</a> },
        ].filter(Boolean) as { icon: typeof Mail; label: string; value: ReactNode }[]
        return rows.length === 0 ? (
          <EmptyState title="Chưa có thông tin liên hệ">Bạn có thể gửi yêu cầu hỗ trợ trong mục Tài khoản.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={r.label} className="flex items-start gap-3 rounded-block border border-line bg-white px-4 py-3">
                <r.icon size={20} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <p className="text-[13px] text-ink-muted">{r.label}</p>
                  <p className="break-all">{r.value}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      }}
    </StaticShell>
  )
}
