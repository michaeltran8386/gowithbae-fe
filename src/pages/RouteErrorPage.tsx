import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState } from '../components/ui/StateView.tsx'

export function RouteErrorPage() {
  const error = useRouteError()
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-12">
      {isRouteErrorResponse(error) && error.status === 404 ? (
        <EmptyState title="Không tìm thấy trang" action={<ButtonLink to="/">Về Khám phá</ButtonLink>} />
      ) : (
        <ErrorState error={error} title="Trang gặp lỗi" onRetry={() => window.location.reload()} />
      )}
    </main>
  )
}
