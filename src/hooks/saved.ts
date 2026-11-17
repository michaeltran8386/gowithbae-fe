import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import { track } from '../lib/analytics.ts'

export function useSavedLists(enabled = true) {
  return useQuery({ queryKey: ['saved-lists'], queryFn: () => unwrap(api.GET('/saved-lists')), enabled })
}

export function useSavedList(listId: string) {
  return useQuery({
    queryKey: ['saved-lists', listId],
    queryFn: () => unwrap(api.GET('/saved-lists/{listId}', { params: { path: { listId } } })),
  })
}

export function useSavedListMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['saved-lists'] })
  return {
    create: useMutation({
      mutationFn: (name: string) => unwrap(api.POST('/saved-lists', { body: { name } })),
      onSuccess: invalidate,
    }),
    rename: useMutation({
      mutationFn: ({ listId, name }: { listId: string; name: string }) =>
        unwrap(api.PATCH('/saved-lists/{listId}', { params: { path: { listId } }, body: { name } })),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (listId: string) => unwrap(api.DELETE('/saved-lists/{listId}', { params: { path: { listId } } })),
      onSuccess: invalidate,
    }),
    addPlace: useMutation({
      // PUT idempotent: thêm lặp không tạo bản ghi mới (RULE-07)
      mutationFn: ({ listId, placeId }: { listId: string; placeId: string; alreadySaved: boolean }) =>
        unwrap(api.PUT('/saved-lists/{listId}/places/{placeId}', { params: { path: { listId, placeId } } })),
      onSuccess: (_d, v) => {
        if (!v.alreadySaved) track('place_saved', { objectId: v.placeId }) // AC-011: lưu lặp không tính lượt
        return invalidate()
      },
    }),
    removePlace: useMutation({
      mutationFn: ({ listId, placeId }: { listId: string; placeId: string }) =>
        unwrap(api.DELETE('/saved-lists/{listId}/places/{placeId}', { params: { path: { listId, placeId } } })),
      onSuccess: invalidate,
    }),
  }
}
