import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import type { paths } from '../api/schema'

const TEN_MINUTES = 10 * 60 * 1000

export type PlaceSearchParams = NonNullable<paths['/places']['get']['parameters']['query']>

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
    queryFn: () => unwrap(api.GET('/places/compare', { params: { query: { ids } } })),
    enabled: ids.length >= 2,
  })
}

export function useReportPlace(placeId: string) {
  return useMutation({
    mutationFn: (body: Schemas['PlaceReportCreate']) =>
      unwrap(api.POST('/places/{placeId}/reports', { params: { path: { placeId } }, body })),
  })
}
