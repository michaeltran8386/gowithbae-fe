/**
 * DỮ LIỆU MINH HỌA — không phải dữ liệu thật (RULE-28, NFR-12).
 * Chỉ dùng khi chạy `npm run dev:mock` và trong test. Kiểu dữ liệu lấy từ contract (Schemas),
 * nên contract đổi thì fixture báo lỗi khi build.
 * Mã OTP thử nghiệm: 123456. Link mời mẫu: /invite/loi-moi-mau (hợp lệ), /invite/loi-moi-da-thu-hoi (410).
 */
import type { Schemas } from '../api/client.ts'

type Taxonomy = Schemas['Taxonomy']
type PlaceDetail = Schemas['PlaceDetail']

const uid = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`

export const ME_ID = uid('00000001', 1)
export const MOCK_TOKEN = 'mock-access-token'
export const MOCK_OTP = '123456'

let tagSeq = 0
const tag = (group: Taxonomy['group'], name: string): Taxonomy => ({
  id: uid('00000002', ++tagSeq),
  group,
  code: name,
  name,
  status: 'ACTIVE',
})

// §5.1 SRS — danh mục bộ lọc ban đầu
export const taxonomies: Taxonomy[] = [
  ...['Cà phê', 'Nhà hàng', 'Workshop', 'Rạp phim', 'Không gian nghệ thuật'].map((n) => tag('CATEGORY', n)),
  ...['Ăn uống', 'Cà phê', 'Vẽ tranh', 'Làm gốm', 'Làm bánh', 'Xem phim', 'Triển lãm', 'Trò chơi', 'Vận động'].map((n) =>
    tag('ACTIVITY', n),
  ),
  ...['Yên tĩnh', 'Lãng mạn', 'Sôi động', 'Ấm áp', 'Riêng tư'].map((n) => tag('VIBE', n)),
  ...['Vintage', 'Tối giản', 'Hiện đại', 'Nghệ thuật', 'Sân vườn'].map((n) => tag('STYLE', n)),
  ...['Nhiều cây', 'Ven hồ', 'Ven sông', 'Rooftop', 'Ngắm hoàng hôn'].map((n) => tag('SCENERY', n)),
  ...['Có mèo tại quán', 'Có chó tại quán', 'Cho mang thú cưng', 'Band nhạc', 'Ngoài trời'].map((n) => tag('FEATURE', n)),
  ...['Khu không hút thuốc', 'Tiếp cận xe lăn'].map((n) => tag('AMENITY', n)),
  ...['Hẹn đầu', 'Cuối tuần', 'Kỷ niệm', 'Sinh nhật'].map((n) => tag('OCCASION', n)),
]

const t = (group: Taxonomy['group'], name: string) => {
  const found = taxonomies.find((x) => x.group === group && x.name === name)
  if (!found) throw new Error(`Thiếu nhãn ${group}/${name}`)
  return found
}

export const areas: Schemas['Area'][] = ['Quận 1', 'Quận 3', 'Bình Thạnh', 'Phú Nhuận', 'Thủ Đức'].map((name, i) => ({
  id: uid('00000003', i + 1),
  code: `AREA_${i + 1}`,
  name,
  status: 'ACTIVE',
}))
const area = (name: string) => areas.find((a) => a.name === name)!

const week = (opensAt: string, closesAt: string, closedDays: number[] = []): Schemas['OpeningHours'] => ({
  status: 'KNOWN',
  weekly: [1, 2, 3, 4, 5, 6, 7]
    .filter((d) => !closedDays.includes(d))
    .map((dayOfWeek) => ({ dayOfWeek, ranges: [{ opensAt, closesAt }] })),
  exceptions: [],
})

const known = (standardForTwo: number, min: number, max: number, includes: string): Schemas['Price'] => ({
  status: 'KNOWN',
  standardForTwo,
  min,
  max,
  includes,
  verifiedAt: '2026-11-02',
})
const unknownPrice: Schemas['Price'] = { status: 'UNKNOWN' }

let placeSeq = 0
function place(p: Omit<PlaceDetail, 'id' | 'code' | 'images'> & { hidden?: boolean }): PlaceDetail & { hidden: boolean } {
  placeSeq += 1
  return { id: uid('00000004', placeSeq), code: `HCM-${String(placeSeq).padStart(3, '0')}`, images: [], hidden: false, ...p }
}

export const places = [
  place({
    name: 'Xưởng gốm Đất Lành',
    category: t('CATEGORY', 'Workshop'),
    area: area('Quận 3'),
    price: known(300_000, 250_000, 400_000, 'Hai phần đất, men và phí nung'),
    description: 'Lớp làm gốm cho hai người, có hướng dẫn từ đầu. Sản phẩm nung xong nhận sau khoảng một tuần.',
    tags: [t('ACTIVITY', 'Làm gốm'), t('VIBE', 'Yên tĩnh'), t('OCCASION', 'Hẹn đầu'), t('AMENITY', 'Khu không hút thuốc')],
    hours: week('09:00', '21:00', [1]),
    address: '12 đường Ví Dụ, Phường 6, Quận 3',
    lat: 10.7799,
    lng: 106.6896,
    phone: '028 0000 0001',
    website: null,
    notes: 'Cuối tuần thường kín chỗ buổi chiều.',
    reservationRecommended: true,
    verifiedAt: '2026-11-02',
  }),
  place({
    name: 'Cà phê Mái Hiên',
    category: t('CATEGORY', 'Cà phê'),
    area: area('Quận 3'),
    price: known(120_000, 90_000, 160_000, 'Hai đồ uống'),
    description: 'Quán nhỏ trong hẻm, có mèo, nhạc nhỏ, hợp ngồi nói chuyện lâu.',
    tags: [t('ACTIVITY', 'Cà phê'), t('VIBE', 'Yên tĩnh'), t('FEATURE', 'Có mèo tại quán'), t('STYLE', 'Vintage')],
    hours: week('07:30', '22:30'),
    address: '45 hẻm Mẫu, Quận 3',
    lat: 10.7835,
    lng: 106.6862,
    phone: null,
    website: null,
    notes: null,
    reservationRecommended: false,
    verifiedAt: '2026-10-28',
  }),
  place({
    name: 'Sân thượng Hoàng Hôn',
    category: t('CATEGORY', 'Nhà hàng'),
    area: area('Quận 1'),
    price: unknownPrice,
    description: 'Sân thượng nhìn ra sông, mở chiều tối.',
    tags: [t('ACTIVITY', 'Ăn uống'), t('SCENERY', 'Rooftop'), t('SCENERY', 'Ngắm hoàng hôn'), t('VIBE', 'Lãng mạn')],
    hours: { status: 'UNKNOWN' },
    address: '8 đường Minh Họa, Quận 1',
    lat: 10.7731,
    lng: 106.7044,
    phone: '028 0000 0003',
    website: null,
    notes: null,
    reservationRecommended: null,
    verifiedAt: null,
  }),
  place({
    name: 'Tiệm bánh Bột Mì Nhỏ',
    category: t('CATEGORY', 'Workshop'),
    area: area('Phú Nhuận'),
    price: known(450_000, 400_000, 500_000, 'Lớp làm bánh hai người, nguyên liệu'),
    description: 'Lớp làm bánh kem nhỏ, mang bánh về.',
    tags: [t('ACTIVITY', 'Làm bánh'), t('VIBE', 'Ấm áp'), t('OCCASION', 'Kỷ niệm'), t('OCCASION', 'Sinh nhật')],
    hours: week('10:00', '20:00', [2]),
    address: '23 đường Thử Nghiệm, Phú Nhuận',
    lat: 10.7992,
    lng: 106.6803,
    phone: '028 0000 0004',
    website: null,
    notes: 'Cần đặt trước ít nhất một ngày.',
    reservationRecommended: true,
    verifiedAt: '2026-11-05',
  }),
  place({
    name: 'Vườn sách Lá Me',
    category: t('CATEGORY', 'Cà phê'),
    area: area('Bình Thạnh'),
    price: known(0, 0, 0, 'Vào cửa miễn phí, đồ uống tính riêng'),
    description: 'Thư viện sân vườn mở cửa tự do, có góc ngồi ngoài trời.',
    tags: [t('ACTIVITY', 'Triển lãm'), t('STYLE', 'Sân vườn'), t('SCENERY', 'Nhiều cây'), t('FEATURE', 'Ngoài trời')],
    hours: week('08:00', '18:00'),
    address: '5 đường Mẫu Số, Bình Thạnh',
    lat: 10.8031,
    lng: 106.7105,
    phone: null,
    website: null,
    notes: null,
    reservationRecommended: false,
    verifiedAt: '2026-10-20',
  }),
  place({
    name: 'Phòng tranh Màu Nước',
    category: t('CATEGORY', 'Không gian nghệ thuật'),
    area: area('Quận 1'),
    price: known(700_000, 600_000, 800_000, 'Hai bộ màu, toan, đồ uống'),
    description: 'Vẽ tranh màu nước theo cặp, có người hướng dẫn.',
    tags: [t('ACTIVITY', 'Vẽ tranh'), t('STYLE', 'Nghệ thuật'), t('VIBE', 'Riêng tư'), t('OCCASION', 'Kỷ niệm')],
    hours: week('13:00', '22:00'),
    address: '77 đường Ví Dụ, Quận 1',
    lat: 10.7765,
    lng: 106.7009,
    phone: '028 0000 0006',
    website: null,
    notes: null,
    reservationRecommended: true,
    verifiedAt: '2026-11-01',
  }),
  place({
    name: 'Bờ hồ Gió Chiều',
    category: t('CATEGORY', 'Nhà hàng'),
    area: area('Thủ Đức'),
    price: known(850_000, 700_000, 1_100_000, 'Set ăn tối hai người'),
    description: 'Nhà hàng ven hồ, có nhạc sống tối cuối tuần.',
    tags: [t('ACTIVITY', 'Ăn uống'), t('SCENERY', 'Ven hồ'), t('FEATURE', 'Band nhạc'), t('VIBE', 'Lãng mạn')],
    hours: week('17:00', '23:00'),
    address: '2 đường Minh Họa, Thủ Đức',
    lat: 10.8494,
    lng: 106.7537,
    phone: '028 0000 0007',
    website: null,
    notes: null,
    reservationRecommended: true,
    verifiedAt: '2026-10-15',
  }),
  place({
    name: 'Quán đã tạm ẩn',
    category: t('CATEGORY', 'Cà phê'),
    area: area('Quận 3'),
    price: known(150_000, 100_000, 200_000, 'Hai đồ uống'),
    description: 'Nơi này đang tạm ẩn để kiểm tra thông tin.',
    tags: [t('ACTIVITY', 'Cà phê')],
    hours: week('08:00', '22:00'),
    address: '99 đường Mẫu, Quận 3',
    lat: 10.781,
    lng: 106.69,
    phone: null,
    website: null,
    notes: null,
    reservationRecommended: false,
    verifiedAt: '2026-09-01',
    hidden: true,
  }),
]

export const placeId = (index: number) => places[index].id

export function toCard(p: PlaceDetail, distanceKm: number | null = null): Schemas['PlaceCard'] {
  return {
    id: p.id,
    name: p.name,
    areaName: p.area?.name ?? null,
    coverUrl: p.images.find((i) => i.cover)?.url ?? null,
    price: p.price,
    tags: p.tags.filter((x) => x.group !== 'CATEGORY').slice(0, 3),
    distanceKm,
    lat: p.lat,
    lng: p.lng,
  }
}

export const collections = [
  {
    id: uid('00000005', 1),
    title: 'Hẹn đầu nhẹ nhàng',
    coverUrl: null,
    body: 'Những nơi yên tĩnh, dễ bắt chuyện, chi phí vừa phải.',
    visibleFrom: '2026-11-01T00:00:00+07:00',
    visibleUntil: null,
    placeIds: [placeId(1), placeId(0), placeId(4), placeId(7)],
  },
  {
    id: uid('00000005', 2),
    title: 'Làm gì đó cùng nhau',
    coverUrl: null,
    body: 'Workshop gốm, bánh, tranh: có sản phẩm mang về.',
    visibleFrom: '2026-11-01T00:00:00+07:00',
    visibleUntil: null,
    placeIds: [placeId(0), placeId(3), placeId(5)],
  },
  {
    id: uid('00000005', 3),
    title: 'Ngắm hoàng hôn',
    coverUrl: null,
    body: 'Sân thượng và ven hồ cho buổi chiều tối.',
    visibleFrom: '2026-11-01T00:00:00+07:00',
    visibleUntil: null,
    placeIds: [placeId(2), placeId(6)],
  },
]

export const me: Schemas['User'] = {
  id: ME_ID,
  email: 'ban@example.com',
  displayName: 'Minh',
  avatarUrl: null,
  roles: ['MEMBER'],
  status: 'ACTIVE',
}

export const uidFactory = uid
