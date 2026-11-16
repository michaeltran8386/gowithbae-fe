type Props = { code: string; title: string; fr?: string }

/** Màn hình chưa dựng. Thay bằng page thật theo mock trong srs/GoWithBae_UI_Review_v1. */
export function Placeholder({ code, title, fr }: Props) {
  return (
    <section className="rounded-2xl border border-dashed border-outline/40 bg-white p-8">
      <p className="text-sm text-on-surface-variant">{code}</p>
      <h1 className="mt-1 text-2xl font-bold text-primary">{title}</h1>
      {fr && <p className="mt-2 text-sm text-on-surface-variant">Yêu cầu: {fr}</p>}
    </section>
  )
}
