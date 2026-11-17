# 02 — Implementation Plan (PHASE 2)

Repo: `gowithbae-fe`, làm trên nhánh tính năng tách từ `dev` (vd. `feat/f1-foundation`). Mỗi milestone kết thúc bằng: `npm run build` + `npm run lint` + `npm test` sạch, kiểm tra 360/768/1280 px và bàn phím, cập nhật `05-implementation-log.md`.
**Code UI chỉ bắt đầu sau APPROVAL GATE 2** (Phase 4). Riêng M0 không phụ thuộc thiết kế, nhưng vẫn chờ Gate 2 theo Master Prompt.

Complexity: S ≤ nửa ngày · M ≈ 1–2 ngày · L ≥ 3 ngày (ước lượng tương đối cho 1 dev, không phải cam kết lịch).
Priority: P0 cần cho F1 · P1 quan trọng · P2 có thể lùi.

## Milestone & phụ thuộc

```
M0 Foundations ──▶ M1 App shell & shared UI ──▶ M2 Discovery ──▶ M3 Account & Saved ──▶ M4 Choice ──▶ M5 Plans & Reminder ──▶ M6 Support/Notif ──▶ M7 QA
                                                     (M5 phần lời nhắc/đếm chờ CCR-01/02; M4 phần xem trước join chờ CCR-03)
F2 Admin (M8) — chưa lên lịch, chờ OQ-15/18/19/20
```

## M0 — Foundations

| Task | Mục tiêu | Req | Phụ thuộc | Files dự kiến | Acceptance criteria | P | Cx |
|---|---|---|---|---|---|---|---|
| T-001 | Thêm deps đã duyệt (D-02/03/04), cập nhật TECHSTACK.md | — | Duyệt D-02–04 | `package.json`, `TECHSTACK.md` | build/lint sạch; TECHSTACK ghi phiên bản và lý do | P0 | S |
| T-002 | Cấu trúc `app/`, `providers.tsx`, chuyển `router.tsx`; route `lazy`; `RouteErrorBoundary`; `MinimalLayout` | FR-22, NFR-02 | T-001 | `src/app/*`, `src/layouts/MinimalLayout.tsx` | Mỗi page một chunk; admin tách chunk; route lạ → 404 | P0 | M |
| T-003 | `api/problem.ts` (`toProblem`, map status), middleware 401, helper Idempotency-Key | NFR-08/11 | T-001 | `src/api/*`, `src/lib/idempotency.ts` | Unit test: map 400/401/404/409/410/429/lỗi mạng | P0 | S |
| T-004 | Pattern hook TanStack Query + QueryClient config (staleTime, retry) | — | T-001 | `src/hooks/usePlaces.ts` (mẫu) | `SearchPage` chạy qua hook, hành vi URL giữ nguyên | P0 | S |
| T-005 | MSW: setup dev + test, `VITE_API_MOCK`, fixture biên theo SRS, `MockDataBanner` | RULE-28, NFR-12 | T-001 | `src/mocks/*` | Mock bật thì app chạy đủ màn với 501; build production không chứa msw (kiểm tra bundle) | P0 | M |
| T-006 | `AuthProvider` (`state/actions/meta`), `RequireAuth`, `returnTo` + intent | FR-07, AC-056 | T-003/004 | `src/app/auth/*` | Truy cập `/saved` khi chưa đăng nhập → `/login?returnTo=/saved` và quay lại được | P0 | M |
| T-007 | `lib/format.ts`: VND, ngày giờ VN, ISO +07:00, khoảng cách “ước tính” | §8 câu chữ | — | `src/lib/format.ts` | Unit test giá trị biên (0, 200000, 700000, null) | P0 | S |
| T-008 | `lib/analytics.ts` (`track`, lô, whitelist) | FR-32, RULE-25 | T-003 | `src/lib/analytics.ts` | Không gửi tên ngoài enum; không gửi `q`/token; unit test | P1 | M |
| T-009 | Vitest + RTL + jsdom setup, script `test` | — | T-001 | `vitest.config.ts`, `src/test/setup.ts` | `npm test` chạy được với ≥1 test | P0 | S |

## M1 — App shell & shared UI (sau Gate 2: token/visual đã duyệt)

| Task | Mục tiêu | Req | Phụ thuộc | Files | AC | P | Cx |
|---|---|---|---|---|---|---|---|
| T-101 | Design tokens cuối vào `index.css` `@theme` | OQ-01, NFR-03 | Gate 2 | `src/index.css` | Tương phản chữ thường ≥ 4.5:1 (A-07) | P0 | S |
| T-102 | `AppLayout` hoàn thiện: logo, nav, `NotificationBell`, skip-link, vùng banner lời nhắc | §8 nav, FR-21 | T-006, T-101 | `src/layouts/AppLayout.tsx` | Nav 4 mục; focus visible; không tràn ở 360 px | P0 | M |
| T-103 | Primitives: Button, IconButton, Field (compound), inputs, DateTimeInput | NFR-03 | T-101 | `src/components/ui/*` | Label/aria đúng; test bàn phím | P0 | M |
| T-104 | Dialog, ConfirmDialog, Sheet, Tabs, Toast | NFR-03 | T-103 | `src/components/ui/*` | Focus trap, Esc, trả focus | P0 | M |
| T-105 | StateView (Loading/Empty/Error), Skeleton, Pagination, UnknownValue, CopyField, ChipGroup | §8, RULE-04 | T-103 | `src/components/ui/*` | ErrorState hiện traceId + retry | P0 | M |

## M2 — Discovery (F1)

| Task | Mục tiêu | Req | Phụ thuộc | Files | AC | P | Cx |
|---|---|---|---|---|---|---|---|
| T-201 | PlaceCard (compound), PriceText, HoursText | FR-02/05, RULE-04 | M1 | `components/place/*` | AC-003 (không hiện giá/giờ giả) | P0 | M |
| T-202 | S-03 Kết quả: tìm submit/debounce, FilterPanel (desktop + sheet mobile), sort, phân trang, URL state, 0 kết quả | FR-02–04, RULE-02 | T-201 | `pages/SearchPage.tsx`, `components/place/FilterPanel*` | AC-001 (trên mock), AC-002 (từ chối vị trí/bản đồ lỗi vẫn dùng được); quy tắc AND/OR hiển thị cạnh nhóm lọc | P0 | L |
| T-203 | S-01 Khám phá + S-02 Bộ sưu tập | FR-01 | T-201 | `pages/DiscoverPage.tsx`, `pages/CollectionPage.tsx` | AC-041/042 (mock) | P0 | M |
| T-204 | S-04 Chi tiết + ReportPlaceDialog | FR-05, FR-19 | T-201 | `pages/PlaceDetailPage.tsx` | Thứ tự FR-05; AC-003/004/029 | P0 | L |
| T-205 | CompareProvider + CompareTray + S-05 So sánh (table/cards) | FR-06, RULE-06 | T-201 | `app/compare/*`, `pages/ComparePage.tsx` | AC-005/006; giữ sau reload (A-09) | P0 | M |
| T-206 | MapView placeholder + ViewToggle | FR-04 | T-202 | `components/place/MapView.tsx` | Bật `view=map` khi chưa có nhà cung cấp vẫn quay lại danh sách được | P2 | S |

## M3 — Account & Saved

| Task | Mục tiêu | Req | Phụ thuộc | AC | P | Cx |
|---|---|---|---|---|---|---|
| T-301 | S-06 Đăng nhập OTP (2 bước, Retry-After) | FR-07, RULE-16 | T-006 | AC-007/008 (mock) | P0 | M |
| T-302 | S-16 Tài khoản (hồ sơ, đổi email, xóa, đăng xuất) | FR-08, RULE-17 | T-301 | AC-009/010 | P1 | M |
| T-303 | SaveButton + SaveToListDialog | FR-09, RULE-07 | T-301, T-201 | AC-011, AC-056 (intent sau login) | P0 | M |
| T-304 | S-07/S-08 Đã lưu | FR-09 | T-303 | AC-012; nơi ẩn có cảnh báo | P0 | M |

## M4 — Choice (cùng chọn)

| Task | Mục tiêu | Req | Phụ thuộc | AC | P | Cx |
|---|---|---|---|---|---|---|
| T-401 | S-09 Tạo lời mời: PlacePicker, ShareLinkPanel | FR-10, RULE-08 | T-304 | AC-013/014 | P0 | M |
| T-402 | S-10 Link mời: preview, JoinForm, 410/409, `MinimalLayout`, `noindex` | FR-11, RULE-12/30 | T-002 | AC-015/016/055; **xem nơi trước join chờ CCR-03** | P0 | M |
| T-403 | S-11 Bỏ phiếu: VoteCard, trạng thái session | FR-12, RULE-10 | T-402 | AC-017/018 | P0 | M |
| T-404 | S-12 Kết quả + FinalizeForm | FR-13, RULE-11 | T-403, T-501 | AC-019/020 | P0 | M |
| T-405 | SharingManager (thu hồi/cấp mới/loại người nhận) | FR-14 | T-403 | AC-021/022 | P1 | M |

## M5 — Plans, reminder, visit count

| Task | Mục tiêu | Req | Phụ thuộc | AC | P | Cx |
|---|---|---|---|---|---|---|
| T-501 | PlanForm (tạo/sửa/chốt dùng chung), NotReservedNotice | FR-15, RULE-05/13 | M1 | AC-023/024 | P0 | M |
| T-502 | S-14 Tạo kế hoạch | FR-15 | T-501 | AC-023/024 | P0 | S |
| T-503 | S-13 Buổi hẹn (tabs, phiên đang cùng chọn) | FR-16 | T-501 | — | P0 | M |
| T-504 | S-15 Chi tiết/sửa/hủy, ReadOnlyPlanView, chỉ đường, .ics | FR-16/17, RULE-14 | T-501 | AC-025/026 | P0 | M |
| T-505 | VisitReminderBanner/Inline + `useVisitReminder` | FR-18, RULE-15 | **CCR-02**, T-504 | AC-027/028/057/058 | P0 | M |
| T-506 | VisitCount trên S-04/S-15 | FR-35, RULE-29 | **CCR-01** | AC-053/054 | P0 | S |

## M6 — Support & notifications

| Task | Mục tiêu | Req | Phụ thuộc | AC | P | Cx |
|---|---|---|---|---|---|---|
| T-601 | S-17 Thông báo + NotificationBell | FR-21 | T-102 | AC-033/034 | P1 | M |
| T-602 | S-18/19/20 Hỗ trợ | FR-20, RULE-19 | M1 | AC-031/032 | P1 | M |

## M7 — QA & refinement (dẫn sang Phase 6)

| Task | Mục tiêu | P | Cx |
|---|---|---|---|
| T-701 | Test component/hook cho các AC trên MSW; test double-submit (NFR-08) | P0 | L |
| T-702 | Responsive 360/768/1280, bàn phím, review `web-design-guidelines` | P0 | M |
| T-703 | Đo bundle; kiểm tra MSW không có trong production; review `vercel-react-best-practices` | P1 | S |
| T-704 | Chuyển từng operation sang API thật khi BE implement (theo §5 của API plan) | P0 | Liên tục |

## M8 — F2 Admin (backlog, chưa lên lịch)

T-801 AdminLayout + RequireRole · T-802 S-A01/A02/A03 địa điểm & hàng chờ · T-803 S-A04 CSV · T-804 S-A05/A06 danh mục, bộ sưu tập · T-805 S-A07/A08 tài khoản, nhật ký · T-806 S-A09/A10 báo sai, hỗ trợ · T-807 S-A11 báo cáo. Điều kiện: OQ-15/18/19/20 và quyết định A-02 cho F2.

## Blocker theo task

| Blocker | Task bị chặn | Ai gỡ |
|---|---|---|
| Gate 2 (Phase 3–4 duyệt) | M1 trở đi | Bạn/PO |
| D-02/03/04 duyệt deps | T-001 | Bạn |
| CCR-01 | T-506 | BE/PO |
| CCR-02 | T-505 | BE/PO |
| CCR-03 | phần xem trước của T-402 | BE/PO |
| Mock Stitch (Q-P2-03) | Phase 4, T-101 | Bạn |
| BE implement endpoint | T-704 (tích hợp thật) | BE |
| OQ-07/08/10 | Hành vi cuối của T-403/404/505; F1 dùng mặc định có nhãn (A-05) | PO |
