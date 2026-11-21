import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'

/** Hook quản trị nội dung địa điểm (phần B): địa điểm, ảnh, duyệt, CSV, nhãn/khu vực, bộ sưu tập. */

export type PlaceStatus = Schemas['PlaceStatus']
export type TransitionAction = 'SUBMIT' | 'APPROVE' | 'RETURN' | 'HIDE' | 'DEACTIVATE' | 'RESTORE'

export const PLACE_STATUS_LABELS: Record<PlaceStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đang hiển thị',
  HIDDEN: 'Tạm ẩn',
  INACTIVE: 'Ngừng hoạt động',
}

export const TAXONOMY_GROUP_LABELS: Record<Schemas['TaxonomyGroup'], string> = {
  CATEGORY: 'Loại hình',
  ACTIVITY: 'Hoạt động',
  VIBE: 'Không khí',
  STYLE: 'Phong cách',
  SCENERY: 'Cảnh quan',
  FEATURE: 'Đặc điểm',
  AMENITY: 'Tiện ích',
  OCCASION: 'Dịp',
}

/** Thao tác hợp lệ theo trạng thái (vòng đời §7.2); server vẫn kiểm tra lại. */
export const TRANSITIONS: Record<PlaceStatus, { action: TransitionAction; label: string; needsReason: boolean; tone: 'primary' | 'danger' | 'secondary' }[]> = {
  DRAFT: [{ action: 'SUBMIT', label: 'Gửi duyệt', needsReason: false, tone: 'primary' }],
  PENDING: [
    { action: 'APPROVE', label: 'Duyệt & hiển thị', needsReason: false, tone: 'primary' },
    { action: 'RETURN', label: 'Trả lại', needsReason: true, tone: 'secondary' },
  ],
  PUBLISHED: [
    { action: 'HIDE', label: 'Tạm ẩn', needsReason: true, tone: 'secondary' },
    { action: 'DEACTIVATE', label: 'Ngừng hoạt động', needsReason: true, tone: 'danger' },
  ],
  HIDDEN: [{ action: 'RESTORE', label: 'Khôi phục (về chờ duyệt)', needsReason: false, tone: 'primary' }],
  INACTIVE: [{ action: 'RESTORE', label: 'Khôi phục (về chờ duyệt)', needsReason: false, tone: 'primary' }],
}

// ───────── Địa điểm ─────────

export function useAdminPlaces(query: { status?: PlaceStatus; areaId?: string; q?: string; page: number }) {
  return useQuery({
    queryKey: ['admin', 'places', query],
    queryFn: () =>
      unwrap(
        api.GET('/admin/places', {
          params: { query: { status: query.status, areaId: query.areaId || undefined, q: query.q || undefined, page: query.page, size: 20 } },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useAdminPlace(placeId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'places', placeId],
    queryFn: () => unwrap(api.GET('/admin/places/{placeId}', { params: { path: { placeId: placeId! } } })),
    enabled: !!placeId,
  })
}

export function useAdminPlaceMutations(placeId?: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'places'] })
  const path = { placeId: placeId ?? '' }
  return {
    create: useMutation({
      mutationFn: (body: Schemas['AdminPlaceWrite']) => unwrap(api.POST('/admin/places', { body })),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: (body: Schemas['AdminPlaceWrite']) => unwrap(api.PUT('/admin/places/{placeId}', { params: { path }, body })),
      onSuccess: refresh,
    }),
    transition: useMutation({
      mutationFn: (body: { action: TransitionAction; reason?: string }) =>
        unwrap(api.POST('/admin/places/{placeId}/transitions', { params: { path }, body })),
      onSuccess: refresh,
    }),
    addImage: useMutation({
      mutationFn: async (input: { file: File; caption?: string; sourceRights: string; cover: boolean }) => {
        const stored = await uploadFile(input.file, 'PLACE_IMAGE')
        return unwrap(
          api.POST('/admin/places/{placeId}/images', {
            params: { path },
            body: { fileId: stored.id, caption: input.caption || undefined, sourceRights: input.sourceRights, cover: input.cover },
          }),
        )
      },
      onSuccess: refresh,
    }),
    removeImage: useMutation({
      mutationFn: (imageId: string) =>
        unwrap(api.DELETE('/admin/places/{placeId}/images/{imageId}', { params: { path: { ...path, imageId } } })),
      onSuccess: refresh,
    }),
  }
}

/** Tải tệp lên kho riêng tư (PNG/JPEG ≤ 5 MB); trả metadata để gắn vào địa điểm / bộ sưu tập. */
export async function uploadFile(file: File, purpose: 'PLACE_IMAGE' | 'COLLECTION'): Promise<Schemas['StoredFile']> {
  return unwrap(
    api.POST('/uploads', {
      body: { file: '', purpose },
      bodySerializer: () => {
        const form = new FormData()
        form.append('file', file)
        form.append('purpose', purpose)
        return form
      },
    }),
  )
}

// ───────── Nhãn & khu vực ─────────

export function useAdminTaxonomies() {
  return useQuery({ queryKey: ['admin', 'taxonomies'], queryFn: () => unwrap(api.GET('/admin/taxonomies')) })
}

/** Khu vực: dùng API công khai (chỉ ACTIVE) cho form; trang quản lý dùng danh sách đầy đủ ghép từ địa điểm. */
export function useAreas() {
  return useQuery({ queryKey: ['areas'], queryFn: () => unwrap(api.GET('/areas')) })
}

export function useTaxonomyMutations() {
  const qc = useQueryClient()
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'taxonomies'] })
    qc.invalidateQueries({ queryKey: ['taxonomies'] })
    qc.invalidateQueries({ queryKey: ['areas'] })
  }
  return {
    createTaxonomy: useMutation({
      mutationFn: (body: Schemas['TaxonomyWrite']) => unwrap(api.POST('/admin/taxonomies', { body })),
      onSuccess: refresh,
    }),
    updateTaxonomy: useMutation({
      mutationFn: (input: { id: string; name?: string; status?: Schemas['ActiveStatus'] }) =>
        unwrap(api.PATCH('/admin/taxonomies/{taxonomyId}', { params: { path: { taxonomyId: input.id } }, body: { name: input.name, status: input.status } })),
      onSuccess: refresh,
    }),
    createArea: useMutation({
      mutationFn: (body: Schemas['AreaWrite']) => unwrap(api.POST('/admin/areas', { body })),
      onSuccess: refresh,
    }),
    updateArea: useMutation({
      mutationFn: (input: { id: string; name?: string; status?: Schemas['ActiveStatus'] }) =>
        unwrap(api.PATCH('/admin/areas/{areaId}', { params: { path: { areaId: input.id } }, body: { name: input.name, status: input.status } })),
      onSuccess: refresh,
    }),
  }
}

// ───────── Bộ sưu tập ─────────

export function useAdminCollections() {
  return useQuery({ queryKey: ['admin', 'collections'], queryFn: () => unwrap(api.GET('/admin/collections')) })
}

export function useCollectionMutations() {
  const qc = useQueryClient()
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'collections'] })
    qc.invalidateQueries({ queryKey: ['collections'] })
  }
  return {
    create: useMutation({
      mutationFn: (body: Schemas['CollectionWrite']) => unwrap(api.POST('/admin/collections', { body })),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: (input: { id: string; body: Schemas['CollectionWrite'] }) =>
        unwrap(api.PUT('/admin/collections/{collectionId}', { params: { path: { collectionId: input.id } }, body: input.body })),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => unwrap(api.DELETE('/admin/collections/{collectionId}', { params: { path: { collectionId: id } } })),
      onSuccess: refresh,
    }),
  }
}

// ───────── Nhập CSV ─────────

export function useImportBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'imports', batchId],
    queryFn: () => unwrap(api.GET('/admin/imports/{batchId}', { params: { path: { batchId: batchId! } } })),
    enabled: !!batchId,
  })
}

export function useImportMutations() {
  const qc = useQueryClient()
  return {
    validate: useMutation({
      mutationFn: (file: File) =>
        unwrap(
          api.POST('/admin/imports', {
            body: { file: '' },
            bodySerializer: () => {
              const form = new FormData()
              form.append('file', file)
              return form
            },
          }),
        ),
    }),
    commit: useMutation({
      mutationFn: (batchId: string) => unwrap(api.POST('/admin/imports/{batchId}/commit', { params: { path: { batchId } } })),
      onSuccess: (batch) => {
        qc.setQueryData(['admin', 'imports', batch.id], batch)
        qc.invalidateQueries({ queryKey: ['admin', 'places'] })
      },
    }),
  }
}

export async function downloadImportTemplate() {
  const csv = await unwrap(api.GET('/admin/imports/template.csv', { parseAs: 'text' }))
  const url = URL.createObjectURL(new Blob(['﻿' + (csv as string)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'gowithbae-mau-dia-diem-v1.csv'
  a.click()
  URL.revokeObjectURL(url)
}
