/**
 * Kiểm thử quản trị nội dung trên dữ liệu minh họa (MSW): địa điểm (tạo nháp, điều kiện xuất bản, duyệt),
 * nhãn (thêm, ngừng dùng), bộ sưu tập, nhập CSV. Quy tắc thật ở server có test riêng bên backend.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { session } from '../api/client.ts'
import { MOCK_ADMIN_TOKEN } from '../mocks/admin.ts'
import { catalogDb, mockValidateCsv } from '../mocks/adminCatalog.ts'
import { renderApp } from './render.tsx'
import { ApiError, adminProblemMessage, problemMessage } from '../api/problem.ts'

function renderAdmin(path: string) {
  session.setAccessToken(MOCK_ADMIN_TOKEN)
  return renderApp(path)
}

describe('Địa điểm', () => {
  it('danh sách lọc theo trạng thái và từ khóa', async () => {
    const { user } = renderAdmin('/admin/places')
    expect(await screen.findByText('Quán Chờ Duyệt Mẫu')).toBeInTheDocument()
    expect(screen.getByText('Quán Nháp Thiếu Ảnh')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Tên hoặc mã chi nhánh'), 'nháp{Enter}')
    await waitFor(() => expect(screen.queryByText('Quán Chờ Duyệt Mẫu')).not.toBeInTheDocument())
    expect(screen.getByText('Quán Nháp Thiếu Ảnh')).toBeInTheDocument()
  })

  it('tạo nháp → thấy danh sách còn thiếu, nút Gửi duyệt bị khóa', async () => {
    const { user, router } = renderAdmin('/admin/places/new')
    await user.type(await screen.findByLabelText(/Mã chi nhánh/), 'test-01')
    await user.type(screen.getByLabelText('Tên địa điểm'), 'Quán Thử Nghiệm')
    const category = catalogDb.taxonomies.find((t) => t.group === 'CATEGORY')!
    await user.selectOptions(screen.getByLabelText('Loại hình'), category.id)
    await user.selectOptions(screen.getByLabelText('Khu vực'), catalogDb.areas[0].id)
    await user.type(screen.getByLabelText('Địa chỉ'), '12 Lê Lợi')
    await user.type(screen.getByLabelText(/Vĩ độ/), '10.77')
    await user.type(screen.getByLabelText(/Kinh độ/), '106.70')
    await user.click(screen.getByRole('button', { name: 'Tạo nháp' }))

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/admin\/places\/[0-9a-f-]{36}$/))
    expect(catalogDb.places[0].code).toBe('TEST-01')
    expect(await screen.findByText('Còn thiếu để xuất bản:')).toBeInTheDocument()
    expect(screen.getByText('Chưa có ảnh có quyền sử dụng')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi duyệt' })).toBeDisabled()
  }, 20_000)

  it('địa điểm chờ duyệt đủ điều kiện thì duyệt được; trả lại bắt buộc lý do', async () => {
    const pending = catalogDb.places.find((p) => p.status === 'PENDING')!
    const { user } = renderAdmin(`/admin/places/${pending.id}`)
    expect(await screen.findByText('Đủ điều kiện xuất bản')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Trả lại' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Xác nhận' })).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Quay lại' }))

    await user.click(screen.getByRole('button', { name: 'Duyệt & hiển thị' }))
    expect(await screen.findByRole('button', { name: 'Tạm ẩn' })).toBeInTheDocument()
    expect(pending.status).toBe('PUBLISHED')
    expect(screen.getByText(/không sửa trực tiếp được/)).toBeInTheDocument()
  })
})

describe('Tự duyệt (OQ-18: SUPER_ADMIN được tự duyệt)', () => {
  it('quản trị viên duyệt được địa điểm do chính mình tạo', async () => {
    const pending = catalogDb.places.find((p) => p.status === 'PENDING')!
    pending.createdBy = '0000000a-0000-4000-8000-000000000001'
    const { user } = renderAdmin(`/admin/places/${pending.id}`)
    await user.click(await screen.findByRole('button', { name: 'Duyệt & hiển thị' }))
    expect(await screen.findByRole('button', { name: 'Tạm ẩn' })).toBeInTheDocument()
    expect(pending.status).toBe('PUBLISHED')
  })
})

describe('Câu lỗi trang quản trị', () => {
  it('403/404 hiện lý do của server; web người dùng vẫn dùng câu chung', () => {
    const forbidden = new ApiError({ status: 403, title: 'Forbidden', detail: 'Không có quyền thực hiện thao tác này' })
    expect(adminProblemMessage(forbidden)).toBe('Không có quyền thực hiện thao tác này')
    expect(problemMessage(forbidden)).toBe('Không tìm thấy nội dung này.')
    expect(adminProblemMessage(new ApiError({ status: 404, title: 'Not Found' }))).toBe('Không tìm thấy nội dung này.')
  })
})

describe('Nhãn & khu vực', () => {
  it('thêm nhãn mới, ngừng dùng nhãn cũ', async () => {
    const { user } = renderAdmin('/admin/taxonomies')
    await screen.findByRole('heading', { name: 'Nhãn & khu vực', level: 1 })
    const activity = catalogDb.taxonomies.find((t) => t.group === 'ACTIVITY')!

    await user.click(screen.getByRole('button', { name: activity.name }))
    let dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText(/^Mã/)).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Ngừng dùng' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(activity.status).toBe('DEPRECATED')

    const panels = screen.getAllByRole('button', { name: 'Thêm' })
    await user.click(panels[1])
    dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/^Mã/), 'rooftop')
    await user.type(within(dialog).getByLabelText('Tên hiển thị'), 'Sân thượng')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('button', { name: 'Sân thượng' })).toBeInTheDocument()
    expect(catalogDb.taxonomies.some((t) => t.code === 'ROOFTOP')).toBe(true)
  })
})

describe('Bộ sưu tập', () => {
  it('tạo bộ sưu tập có địa điểm rồi về trang sửa', async () => {
    const { user, router } = renderAdmin('/admin/collections/new')
    await user.type(await screen.findByLabelText('Tiêu đề'), 'Cuối tuần lãng mạn')
    await user.type(screen.getByLabelText('Thêm địa điểm'), 'Chờ Duyệt{Enter}')
    await user.click(await screen.findByRole('button', { name: /Thêm/ }))
    expect(await screen.findByRole('button', { name: 'Bỏ Quán Chờ Duyệt Mẫu' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/admin\/collections\/[0-9a-f-]{36}$/))
    const saved = catalogDb.collections.find((c) => c.title === 'Cuối tuần lãng mạn')!
    expect(saved.places?.map((p) => p.name)).toEqual(['Quán Chờ Duyệt Mẫu'])
    expect(await screen.findByRole('heading', { name: 'Cuối tuần lãng mạn', level: 1 })).toBeInTheDocument()
  })
})

// Vitest 5 (jsdom) + MSW không đọc được thân multipart/form-data, nên lô kiểm tra được dựng sẵn bằng
// mockValidateCsv; phần tải file thật được kiểm trên trình duyệt và với backend.
describe('Nhập CSV', () => {
  it('nút Kiểm tra chỉ bật khi đã chọn file', async () => {
    const { user } = renderAdmin('/admin/imports')
    const check = await screen.findByRole('button', { name: 'Kiểm tra' })
    expect(check).toBeDisabled()
    await user.upload(screen.getByLabelText('File CSV'), new File(['code\nA-001'], 'places.csv', { type: 'text/csv' }))
    expect(check).toBeEnabled()
  })

  it('lô có dòng lỗi thì hiện lỗi từng dòng và không cho ghi', async () => {
    const batch = mockValidateCsv('code,name\nOK-001,A\nbad code,B\n')!
    renderAdmin(`/admin/imports/${batch.id}`)
    expect(await screen.findByRole('heading', { name: 'Kết quả kiểm tra' })).toBeInTheDocument()
    expect(screen.getByText('Còn lỗi')).toBeInTheDocument()
    expect(screen.getByText(/Mã chi nhánh chỉ gồm/)).toBeInTheDocument()
    expect(screen.queryByText('OK-001')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ghi .* địa điểm/ })).not.toBeInTheDocument()
  })

  it('lô hợp lệ thì ghi thành nháp', async () => {
    const batch = mockValidateCsv('code,name\nCSV-001,A\nCSV-002,B\n')!
    const before = catalogDb.places.length
    const { user } = renderAdmin(`/admin/imports/${batch.id}`)
    await user.click(await screen.findByRole('button', { name: 'Ghi 2 địa điểm thành nháp' }))
    expect(await screen.findByText('Đã ghi')).toBeInTheDocument()
    expect(catalogDb.places.length).toBe(before + 2)
  })
})
