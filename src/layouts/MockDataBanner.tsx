/** Khi chạy dữ liệu minh họa, luôn nói rõ (RULE-28, NFR-12). Không hiển thị ở bản dùng API thật. */
export function MockDataBanner() {
  if (import.meta.env.VITE_API_MOCK !== '1') return null
  return (
    <p className="bg-[#fff7d6] px-4 py-1.5 text-center text-[13px] text-[#5a4a10]">
      Dữ liệu minh họa: tên quán, giá và lịch hẹn là ví dụ, không phải dữ liệu thật. Mã đăng nhập thử: 123456.
    </p>
  )
}
