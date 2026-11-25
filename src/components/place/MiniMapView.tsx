import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, LocateFixed, MapPin, Minus, Navigation, Plus } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { formatDistance, priceForTwo } from '../../lib/format.ts'
import { PlaceMedia } from './PlaceMedia.tsx'

/**
 * Bản đồ mini tương tác (UI02): hiển thị ghim địa điểm theo tọa độ (lat/lng),
 * chọn ghim để xem nhanh thông tin, giá cho 2 người và mở chỉ đường Google Maps.
 */
export function MiniMapView({ places }: { places: Schemas['PlaceCard'][] }) {
  const withCoords = useMemo(() => places.filter((p) => p.lat != null && p.lng != null), [places])
  const [selectedId, setSelectedId] = useState<string | null>(() => withCoords[0]?.id ?? places[0]?.id ?? null)
  const [zoom, setZoom] = useState(1)

  const selected = places.find((p) => p.id === selectedId) ?? withCoords[0] ?? places[0]

  // Tính khung tọa độ (bounding box) để đặt ghim chuẩn xác trong khung bản đồ mini
  const bounds = useMemo(() => {
    if (withCoords.length === 0) {
      return { minLat: 10.75, maxLat: 10.81, minLng: 106.66, maxLng: 106.73 }
    }
    const lats = withCoords.map((p) => p.lat!)
    const lngs = withCoords.map((p) => p.lng!)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const padLat = Math.max((maxLat - minLat) * 0.22, 0.008)
    const padLng = Math.max((maxLng - minLng) * 0.22, 0.008)
    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    }
  }, [withCoords])

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100
    // Áp dụng zoom quanh tâm (50%, 50%)
    const zx = 50 + (x - 50) * zoom
    const zy = 50 + (y - 50) * zoom
    return {
      left: `${Math.min(92, Math.max(8, zx))}%`,
      top: `${Math.min(88, Math.max(12, zy))}%`,
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Khung bản đồ mini */}
      <div
        role="region"
        aria-label="Bản đồ mini các địa điểm"
        className="relative h-[420px] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_30%_20%,#fff7fa_0%,var(--color-action-soft)_55%,var(--color-sky-100)_100%)] shadow-xs md:h-[480px]"
      >
        {/* Lưới tọa độ bản đồ nhẹ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
            backgroundSize: `${36 * zoom}px ${36 * zoom}px`,
          }}
        />

        {/* Nhãn khu vực */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-2xs backdrop-blur-xs">
          <MapPin size={13} className="text-action" aria-hidden="true" />
          <span>TP. Hồ Chí Minh · {withCoords.length} điểm có tọa độ</span>
        </div>

        {/* Điều khiển zoom */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 rounded-xl border border-line bg-white/95 p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
            aria-label="Phóng to bản đồ"
            className="inline-flex size-8 items-center justify-center rounded-lg text-ink hover:bg-action-soft hover:text-action"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
            aria-label="Thu nhỏ bản đồ"
            className="inline-flex size-8 items-center justify-center rounded-lg text-ink hover:bg-action-soft hover:text-action"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Đặt lại góc nhìn"
            className="inline-flex size-8 items-center justify-center rounded-lg text-ink hover:bg-action-soft hover:text-action"
          >
            <LocateFixed size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Các ghim địa điểm */}
        {withCoords.map((p) => {
          const pos = project(p.lat!, p.lng!)
          const isSelected = selected?.id === p.id
          const price = priceForTwo(p.price)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              style={{ left: pos.left, top: pos.top }}
              aria-pressed={isSelected}
              aria-label={`Chọn ${p.name}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                isSelected ? 'z-20 scale-110' : 'z-10 hover:z-20 hover:scale-105'
              }`}
            >
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold shadow-md transition-colors ${
                  isSelected
                    ? 'border-white bg-action text-white ring-4 ring-action/25'
                    : 'border-line bg-white text-ink hover:border-action hover:text-action'
                }`}
              >
                <MapPin size={12} aria-hidden="true" />
                <span className="max-w-[110px] truncate">{price ?? p.name}</span>
              </span>
            </button>
          )
        })}

        {/* Thẻ xem nhanh địa điểm đang chọn ở góc dưới */}
        {selected && (
          <div className="animate-reveal-up absolute right-3 bottom-3 left-3 z-20 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-2.5 shadow-lg backdrop-blur-xs sm:max-w-md">
            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-action-soft">
              <PlaceMedia url={selected.coverUrl} name={selected.name} eager />
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/places/${selected.id}`} className="line-clamp-1 text-sm font-bold text-ink hover:text-action">
                {selected.name}
              </Link>
              <p className="text-xs text-ink-muted">
                {selected.areaName ?? 'Chưa rõ khu vực'}
                {selected.distanceKm != null && ` · ${formatDistance(selected.distanceKm)}`}
              </p>
              <p className="mt-0.5 text-xs font-bold text-action tabular">
                {priceForTwo(selected.price) ?? 'Chưa có thông tin giá'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Link
                to={`/places/${selected.id}`}
                className="inline-flex min-h-8 items-center justify-center rounded-lg bg-action px-3 text-xs font-semibold text-white hover:bg-action-hover"
              >
                Chi tiết
              </Link>
              {selected.lat != null && selected.lng != null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-7 items-center justify-center gap-1 rounded-lg border border-line bg-white px-2.5 text-[11px] font-semibold text-ink-muted hover:border-action hover:text-action"
                >
                  <Navigation size={11} aria-hidden="true" />
                  Đường đi
                  <ExternalLink size={10} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Danh sách rút gọn bên cạnh để bấm chọn nhanh trên bản đồ */}
      <ul className="flex max-h-[480px] flex-col gap-2 overflow-y-auto pr-1" aria-label="Danh sách địa điểm trên bản đồ">
        {places.map((p) => {
          const isSelected = selected?.id === p.id
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-action bg-action-soft shadow-2xs'
                    : 'border-line bg-white hover:border-field/70'
                }`}
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-action-soft">
                  <PlaceMedia url={p.coverUrl} name={p.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`line-clamp-1 text-sm font-semibold ${isSelected ? 'text-action' : 'text-ink'}`}>{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.areaName ?? 'Chưa rõ khu vực'}</p>
                  <p className="text-xs font-bold text-ink tabular">{priceForTwo(p.price) ?? 'Chưa rõ giá'}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
