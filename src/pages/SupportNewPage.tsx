import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Schemas } from '../api/client.ts'
import { fieldErrors, problemMessage } from '../api/problem.ts'
import { useTicketMutations } from '../hooks/account.ts'
import { uploadImageFile } from '../hooks/places.ts'
import { Field } from '../components/ui/Field.tsx'
import { PrimaryButton } from '../components/ui/Button.tsx'
import { useToast } from '../components/ui/Toast.tsx'

type Category = Schemas['SupportTicketCreate']['category']
const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'ACCOUNT', label: 'Tài khoản' },
  { value: 'PLACE_INFO', label: 'Thông tin địa điểm' },
  { value: 'DATE_PLAN', label: 'Buổi hẹn' },
  { value: 'OTHER', label: 'Khác' },
]

/** S-19 Gửi yêu cầu hỗ trợ — FR-20. Tệp đính kèm: chờ quy định loại/kích thước (OQ-21). */
export function SupportNewPage() {
  const { create } = useTicketMutations()
  const navigate = useNavigate()
  const toast = useToast()
  const [category, setCategory] = useState<Category>('OTHER')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Gửi yêu cầu hỗ trợ</h1>
      <p className="mt-1 text-ink-muted">Đội hỗ trợ sẽ trả lời trong mục này. Đây không phải trò chuyện trực tiếp.</p>
      <form
        noValidate
        className="mt-5 flex flex-col gap-4 rounded-block border border-line bg-white p-4 md:p-5"
        onSubmit={async (e) => {
          e.preventDefault()
          const local: Record<string, string> = {}
          if (!subject.trim()) local.subject = 'Hãy nhập chủ đề'
          if (!body.trim()) local.body = 'Hãy mô tả vấn đề'
          setErrors(local)
          if (Object.keys(local).length) return
          let fileIds: string[] | undefined
          if (attachment) {
            try {
              setUploading(true)
              const uploaded = await uploadImageFile(attachment, 'SUPPORT')
              fileIds = [uploaded.id]
            } catch (err) {
              setErrors({ form: problemMessage(err), ...fieldErrors(err) })
              return
            } finally {
              setUploading(false)
            }
          }
          create.mutate(
            { category, subject: subject.trim(), body: body.trim(), ...(fileIds ? { fileIds } : {}) },
            {
              onSuccess: (t) => {
                toast.show('Đã gửi yêu cầu hỗ trợ')
                navigate(`/account/support/${t.id}`, { replace: true })
              },
              onError: (err) => setErrors({ form: problemMessage(err), ...fieldErrors(err) }),
            },
          )
        }}
      >
        <Field.Root>
          <Field.Label>Nhóm vấn đề</Field.Label>
          <Field.Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Field.Select>
        </Field.Root>
        <Field.Root error={errors.subject}>
          <Field.Label>Chủ đề</Field.Label>
          <Field.Input value={subject} maxLength={150} autoComplete="off" onChange={(e) => setSubject(e.target.value)} placeholder="vd. Không đổi được giờ buổi hẹn…" />
          <Field.Error />
        </Field.Root>
        <Field.Root error={errors.body}>
          <Field.Label>Nội dung</Field.Label>
          <Field.Textarea rows={6} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
          <Field.Error />
        </Field.Root>
        <Field.Root hint>
          <Field.Label optional>Ảnh đính kèm (PNG/JPEG, tối đa 5 MB)</Field.Label>
          <Field.File accept="image/png,image/jpeg" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
          {attachment && <Field.Hint>Đã chọn: {attachment.name}</Field.Hint>}
        </Field.Root>
        {errors.form && !errors.subject && !errors.body && (
          <p role="alert" className="rounded-control bg-danger-soft px-3.5 py-3 text-sm text-danger">
            {errors.form}
          </p>
        )}
        <PrimaryButton type="submit" pending={uploading || create.isPending}>
          Gửi yêu cầu
        </PrimaryButton>
      </form>
    </div>
  )
}
