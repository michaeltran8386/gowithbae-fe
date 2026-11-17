import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import type { paths } from '../api/schema'

const TEN_MINUTES = 10 * 60 * 1000

export type PlaceSearchParams = NonNullable<paths['/places']['get']['parameters']['query']>
export type UploadPurpose = paths['/uploads']['post']['requestBody']['content']['multipart/form-data']['purpose']

export function useTaxonomies() {
  return useQuery({ queryKey: ['taxonomies'], queryFn: () => unwrap(api.GET('/taxonomies')), staleTime: TEN_MINUTES })
}

export function useAreas() {
  return useQuery({ queryKey: ['areas'], queryFn: () => unwrap(api.GET('/areas')), staleTime: TEN_MINUTES })
}

export function useCollections() {
  return useQuery({ queryKey: ['collections'], queryFn: () => unwrap(api.GET('/collections')), staleTime: TEN_MINUTES })
}

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ['collections', collectionId],
    queryFn: () => unwrap(api.GET('/collections/{collectionId}', { params: { path: { collectionId } } })),
  })
}

export function useSearchPlaces(query: PlaceSearchParams) {
  return useQuery({
    queryKey: ['places', 'search', query],
    queryFn: () => unwrap(api.GET('/places', { params: { query } })),
    placeholderData: keepPreviousData, // giữ kết quả cũ khi đổi bộ lọc, tránh nháy trắng
  })
}

export function usePlace(placeId: string) {
  return useQuery({
    queryKey: ['places', placeId],
    queryFn: () => unwrap(api.GET('/places/{placeId}', { params: { path: { placeId } } })),
  })
}

export function useComparePlaces(ids: string[]) {
  return useQuery({
    queryKey: ['places', 'compare', ids],
    // Contract: `ids` style form, explode false → ids=a,b (openapi-fetch mặc định explode true)
    queryFn: () =>
      unwrap(api.GET('/places/compare', { params: { query: { ids } }, querySerializer: { array: { style: 'form', explode: false } } })),
    enabled: ids.length >= 2,
  })
}

export function useReportPlace(placeId: string) {
  return useMutation({
    mutationFn: (body: Schemas['PlaceReportCreate']) =>
      unwrap(api.POST('/places/{placeId}/reports', { params: { path: { placeId } }, body })),
  })
}

/** FR-35: số lần tài khoản hiện tại đã tự xác nhận đã đi tại địa điểm (chỉ gọi khi đã đăng nhập; lỗi không giả count=0). */
export function useMyPlaceVisitCount(placeId: string, enabled = false) {
  return useQuery({
    queryKey: ['visit-count', placeId],
    queryFn: () => unwrap(api.GET('/me/places/{placeId}/visit-count', { params: { path: { placeId } } })),
    enabled: enabled && !!placeId,
    retry: false,
  })
}

export async function uploadImageFile(file: File, purpose: UploadPurpose): Promise<Schemas['StoredFile']> {
  const form = new FormData()
  form.append('file', file)
  form.append('purpose', purpose)
  return unwrap(
    api.POST('/uploads', {
      body: form as unknown as { file: string; purpose: UploadPurpose },
      bodySerializer: (b) => b as unknown as BodyInit,
    }),
  )
}
