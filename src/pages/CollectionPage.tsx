import { useParams } from 'react-router'
import { isStatus } from '../api/problem.ts'
import { useCollection } from '../hooks/places.ts'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { PlaceGrid } from '../components/place/PlaceGrid.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'

/** S-02 Bộ sưu tập — FR-01/26; chỉ gồm nơi đang công khai, theo thứ tự cấu hình (AC-041/042). */
export function CollectionPage() {
  const { collectionId = '' } = useParams()
  const collection = useCollection(collectionId)

  if (collection.isPending) return <Skeleton className="h-64" />
  if (collection.isError)
    return isStatus(collection.error, 404) ? (
      <NotFoundPage title="Bộ sưu tập không còn hiển thị" />
    ) : (
      <ErrorState error={collection.error} onRetry={() => collection.refetch()} />
    )

  const c = collection.data
  return (
    <>
      <h1 className="text-2xl font-bold md:text-3xl">{c.title}</h1>
      {c.body && <p className="mt-2 max-w-[70ch] text-ink-muted">{c.body}</p>}
      <div className="mt-6">
        {c.places?.length ? <PlaceGrid places={c.places} /> : <EmptyState title="Bộ sưu tập chưa có địa điểm đang hiển thị" />}
      </div>
    </>
  )
}
