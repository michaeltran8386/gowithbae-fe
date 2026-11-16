import type { Schemas } from '../../api/client.ts'
import { PlaceCard } from './PlaceCard.tsx'
import { SaveButton } from './SaveToList.tsx'
import { CompareToggle } from './Compare.tsx'

/** Lưới thẻ địa điểm chuẩn cho trang khám phá/kết quả/bộ sưu tập: 1 / 2 / 3 cột. */
export function PlaceGrid({ places }: { places: Schemas['PlaceCard'][] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((p) => (
        <li key={p.id} className="flex">
          <PlaceCard.Root place={p} className="w-full">
            <PlaceCard.Media>
              <div className="absolute top-2 right-2 z-10">
                <SaveButton placeId={p.id} placeName={p.name} />
              </div>
            </PlaceCard.Media>
            <PlaceCard.Body>
              <PlaceCard.Title />
              <PlaceCard.Meta />
              <PlaceCard.Tags />
              <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
                <PlaceCard.Price />
                <PlaceCard.Actions>
                  <CompareToggle placeId={p.id} placeName={p.name} />
                </PlaceCard.Actions>
              </div>
            </PlaceCard.Body>
          </PlaceCard.Root>
        </li>
      ))}
    </ul>
  )
}
