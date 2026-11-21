import { useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { fieldErrors, adminProblemMessage } from '../../api/problem.ts'
import { useAdminSiteContent, useSaveSiteContent, type SiteContent } from '../../hooks/adminSupport.ts'
import { PageHeader, Panel } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { GhostButton, PrimaryButton } from '../../components/ui/Button.tsx'
import { ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

/** Nội dung tĩnh của web: trang chủ, banner, FAQ, điều khoản, quyền riêng tư, liên hệ, footer. */
export function AdminContentPage() {
  const content = useAdminSiteContent()
  if (content.isPending) return <LoadingState />
  if (content.isError) return <ErrorState error={content.error} onRetry={() => content.refetch()} />
  const { updatedAt, updatedBy: _by, ...initial } = content.data
  return <ContentEditor initial={initial} updatedAt={updatedAt ?? undefined} />
}

function ContentEditor({ initial, updatedAt }: { initial: SiteContent; updatedAt?: string }) {
  const save = useSaveSiteContent()
  const toast = useToast()
  const [c, setC] = useState<SiteContent>(initial)
  const dirty = JSON.stringify(c) !== JSON.stringify(initial)
  const errors = save.error ? fieldErrors(save.error) : {}
  const set = <K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) => setC((cur) => ({ ...cur, [key]: { ...cur[key], ...value } }))

  const setFaq = (faq: SiteContent['faq']) => setC((cur) => ({ ...cur, faq }))
  const moveFaq = (i: number, d: -1 | 1) => {
    const next = [...c.faq]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setFaq(next)
  }

  const submit = () =>
    save.mutate(
      { ...c, faq: c.faq.filter((f) => f.question.trim() || f.answer.trim()) },
      { onSuccess: () => toast.show('Đã lưu nội dung. Web người dùng cập nhật trong vài phút.') },
    )

  return (
    <>
      <PageHeader
        title="Nội dung web"
        description={
          <>
            Chữ hiển thị trên web người dùng. {updatedAt && <>Sửa lần cuối {formatDateTime(updatedAt)}. </>}
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-action hover:underline">
              Xem web <ExternalLink size={14} aria-hidden="true" />
            </a>
          </>
        }
        actions={
          <PrimaryButton pending={save.isPending} disabled={!dirty} onClick={submit}>
            Lưu nội dung
          </PrimaryButton>
        }
      />
      {save.error && (
        <p role="alert" className="mb-3 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          {adminProblemMessage(save.error)}
          {Object.entries(errors).map(([k, v]) => (
            <span key={k} className="block">
              {k}: {v}
            </span>
          ))}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Trang chủ">
          <div className="flex flex-col gap-4">
            <Field.Root>
              <Field.Label>Tiêu đề lớn</Field.Label>
              <Field.Input value={c.homeHero.title} maxLength={120} onChange={(e) => set('homeHero', { title: e.target.value })} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Dòng mô tả</Field.Label>
              <Field.Input value={c.homeHero.subtitle} maxLength={300} onChange={(e) => set('homeHero', { subtitle: e.target.value })} />
            </Field.Root>
          </div>
        </Panel>

        <Panel title="Banner thông báo đầu trang">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c.homeBanner.enabled} onChange={(e) => set('homeBanner', { enabled: e.target.checked })} />
              Hiện banner
            </label>
            <Field.Root>
              <Field.Label>Nội dung banner</Field.Label>
              <Field.Input value={c.homeBanner.text} maxLength={200} onChange={(e) => set('homeBanner', { text: e.target.value })} />
            </Field.Root>
            <Field.Root hint>
              <Field.Label optional>Link khi bấm</Field.Label>
              <Field.Hint>Bắt đầu bằng https:// hoặc / (trang trong web), vd. /faq</Field.Hint>
              <Field.Input value={c.homeBanner.linkUrl ?? ''} maxLength={500} onChange={(e) => set('homeBanner', { linkUrl: e.target.value || null })} />
            </Field.Root>
          </div>
        </Panel>

        <Panel
          title="Câu hỏi thường gặp"
          className="lg:col-span-2"
          actions={
            <GhostButton icon={<Plus size={16} aria-hidden="true" />} onClick={() => setFaq([...c.faq, { question: '', answer: '' }])}>
              Thêm câu hỏi
            </GhostButton>
          }
        >
          {c.faq.length === 0 && <p className="text-sm text-ink-muted">Chưa có câu hỏi. Trang /faq sẽ trống.</p>}
          <ol className="flex flex-col gap-4">
            {c.faq.map((f, i) => (
              <li key={i} className="flex gap-2 rounded-control border border-line p-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Field.Root>
                    <Field.Label>Câu hỏi {i + 1}</Field.Label>
                    <Field.Input value={f.question} maxLength={300} onChange={(e) => setFaq(c.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Trả lời {i + 1}</Field.Label>
                    <Field.Textarea rows={3} value={f.answer} maxLength={3000} onChange={(e) => setFaq(c.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                  </Field.Root>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" aria-label={`Đưa câu ${i + 1} lên`} disabled={i === 0} className="p-1 disabled:opacity-30" onClick={() => moveFaq(i, -1)}>
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Đưa câu ${i + 1} xuống`} disabled={i === c.faq.length - 1} className="p-1 disabled:opacity-30" onClick={() => moveFaq(i, 1)}>
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Xóa câu ${i + 1}`} className="p-1 text-danger" onClick={() => setFaq(c.faq.filter((_, j) => j !== i))}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Điều khoản sử dụng">
          <Field.Root hint>
            <Field.Label>Nội dung</Field.Label>
            <Field.Hint>Dòng trống để tách đoạn. Dòng bắt đầu bằng “# ” thành tiêu đề, “- ” thành gạch đầu dòng.</Field.Hint>
            <Field.Textarea rows={12} value={c.terms.body} maxLength={50000} onChange={(e) => set('terms', { body: e.target.value })} />
          </Field.Root>
        </Panel>
        <Panel title="Chính sách quyền riêng tư">
          <Field.Root hint>
            <Field.Label>Nội dung</Field.Label>
            <Field.Hint>Nên nêu rõ: lưu IP và thiết bị đăng nhập để bảo mật tài khoản.</Field.Hint>
            <Field.Textarea rows={12} value={c.privacy.body} maxLength={50000} onChange={(e) => set('privacy', { body: e.target.value })} />
          </Field.Root>
        </Panel>

        <Panel title="Liên hệ">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field.Root>
              <Field.Label optional>Email</Field.Label>
              <Field.Input type="email" value={c.contact.email ?? ''} onChange={(e) => set('contact', { email: e.target.value || null })} />
            </Field.Root>
            <Field.Root>
              <Field.Label optional>Điện thoại</Field.Label>
              <Field.Input value={c.contact.phone ?? ''} onChange={(e) => set('contact', { phone: e.target.value || null })} />
            </Field.Root>
            <Field.Root className="sm:col-span-2">
              <Field.Label optional>Địa chỉ</Field.Label>
              <Field.Input value={c.contact.address ?? ''} onChange={(e) => set('contact', { address: e.target.value || null })} />
            </Field.Root>
            <Field.Root className="sm:col-span-2">
              <Field.Label optional>Facebook</Field.Label>
              <Field.Input value={c.contact.facebook ?? ''} placeholder="https://facebook.com/…" onChange={(e) => set('contact', { facebook: e.target.value || null })} />
            </Field.Root>
          </div>
        </Panel>
        <Panel title="Chân trang">
          <Field.Root>
            <Field.Label>Dòng chữ cuối trang</Field.Label>
            <Field.Textarea rows={3} value={c.footer.text} maxLength={500} onChange={(e) => set('footer', { text: e.target.value })} />
          </Field.Root>
        </Panel>
      </div>
    </>
  )
}
