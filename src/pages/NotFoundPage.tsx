import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState } from '../components/ui/StateView.tsx'
import { Heart } from '../components/ui/Heart.tsx'

export function NotFoundPage({ title = 'Không tìm thấy trang' }: { title?: string }) {
  return (
    <div className="mx-auto max-w-xl py-8">
      <EmptyState headingLevel={1} icon={<Heart filled={false} size={36} />} title={title} action={<ButtonLink to="/">Về Khám phá</ButtonLink>}>
        Liên kết có thể đã cũ hoặc nội dung không còn hiển thị.
      </EmptyState>
    </div>
  )
}
