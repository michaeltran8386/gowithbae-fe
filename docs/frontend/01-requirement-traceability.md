# 01 — Requirement Traceability Matrix (PHASE 1)

**Quy ước cột**
- **Screen:** mã màn hình theo nguồn (UI01–UI08 khách, A01–A06 quản trị). Mã S-xx và route cuối cùng sẽ cấp ở Phase 2 (`02-screen-inventory.md`).
- **Flow:** UF-xx tương ứng 1–1 với UC-xx, chi tiết ở Phase 3 (`03-user-flows.md`).
- **Component:** TBD Phase 2 (`02-component-map.md`). Cột này ghi thành phần chính dự kiến để kiểm tra độ phủ.
- **API:** **chưa có contract** (SRS §7.1). Ghi *năng lực logic* cần có. Sẽ định nghĩa tại `02-api-integration-plan.md` dưới dạng adapter gắn nhãn MOCK nếu A-03 được duyệt.
- **Test:** AC cấp UC (Given/When/Then) + AC-P cấp sản phẩm. Test case FE chi tiết sẽ cấp ở Phase 5/6.
- **FE scope:** F1 = web khách · F2 = quản trị · X = xuyên suốt · N/A = không cần UI.

## 1. Functional requirements

| Req | UC | Screen | Flow | Component chính (dự kiến) | API (năng lực logic) | Test | FE | Ghi chú / OQ |
|---|---|---|---|---|---|---|---|---|
| FR-01 | UC-001 | UI01 | UF-01 | SearchBar, QuickFilters, CollectionRail | list collections; list areas/activities | AC-041, AC-042, AC-P01 | F1 | OQ-01 |
| FR-02 | UC-001 | UI01, UI02 | UF-01 | SearchBar, ResultList, PlaceCard | search places | AC-001, AC-P01 | F1 | OQ-04 |
| FR-03 | UC-001 | UI02 | UF-01 | FilterPanel / FilterSheet (mobile) | search places (filters) | AC-001, AC-002, AC-P01–02 | F1 | OQ-03/04/05 |
| FR-04 | UC-001 | UI02 | UF-01 | SortControl, ViewToggle, MapView, LocationInput | search places (sort, origin) | AC-002, AC-P02 | F1 | OQ-05; A-12 |
| FR-05 | UC-002 | UI03 | UF-02 | PlaceDetail sections, ActionBar, UnknownValue, VisitCountBadge | get place | AC-003, AC-004, AC-P03 | F1 | OQ-11 |
| FR-06 | UC-003 | UI04 | UF-03 | CompareTray, CompareTable / CompareCards (mobile) | get places (batch) | AC-005, AC-006, AC-P04 | F1 | A-09 |
| FR-07 | UC-004 | UI08 | UF-04 | LoginEmailForm, OtpForm, ResendTimer | request code; verify code; session | AC-007, AC-008, AC-P06/P10 | F1 | OQ-06; A-11 |
| FR-08 | UC-005 | UI08 | UF-05 | ProfileForm, ChangeEmailFlow, DeleteAccountDialog | get/update profile; change email; delete request; logout | AC-009, AC-010 | F1 | OQ-17/21 |
| FR-09 | UC-006 | UI05, UI03 | UF-06 | SavedListIndex, SavedListDetail, SaveToListDialog | CRUD lists; add/remove item | AC-011, AC-012, AC-P04 | F1 | OQ-11/21 |
| FR-10 | UC-007 | UI05, UI06 | UF-07 | CreateInviteFlow, PlacePicker (2–5), ShareLinkPanel, LinkWarning | create choice session + grant | AC-013, AC-014, AC-P05 | F1 | OQ-07/11 |
| FR-11 | UC-008 | UI06 | UF-08 | InviteLanding, JoinForm (display name), InvalidLinkState | resolve invite; join (guest session) | AC-015, AC-016, AC-055, AC-056, AC-P13 | F1 | **CONF CR-001**; OQ-07/09 |
| FR-12 | UC-009 | UI06 | UF-09 | VoteCard (Thích/Bỏ qua), MatchResult, VoteStatus | get session; submit vote | AC-017, AC-018, AC-P05 | F1 | OQ-07/08 |
| FR-13 | UC-010 | UI06, UI07 | UF-10 | FinalizeFlow, PlanForm | finalize + create plan (atomic, PROP) | AC-019, AC-020 | F1 | OQ-08 |
| FR-14 | UC-011 | UI06 | UF-11 | SharingManager, RevokeConfirmDialog | revoke grant; remove recipient; new grant | AC-021, AC-022, AC-P05 | F1 | OQ-07/09 |
| FR-15 | UC-012 | UI07, UI03, UI04 | UF-12 | PlanForm, DateTimePicker, HoursWarning, NotReservedNotice | create plan; check hours | AC-023, AC-024, AC-P06 | F1 | OQ-04/11 |
| FR-16 | UC-013 | UI07 | UF-13 | PlanList, PlanDetail, EditPlan, CancelPlanDialog, ReadOnlyPlanView | get/update/cancel plan | AC-025, AC-026, AC-P06 | F1 | OQ-10/11 |
| FR-17 | UC-013 | UI07 | UF-13 | DirectionsLink, AddToCalendar | (client: map link, .ics) | — (cần AC sau OQ-12) | F1 | OQ-12 |
| FR-18 | UC-014 | UI07, UI01 | UF-14 | VisitReminderCard (Đã đi / Bỏ qua lời nhắc) | list due reminders; answer visit; dismiss reminder | AC-027, AC-028, AC-057, AC-058, AC-P12 | F1 | **CONF CR-001**; OQ-10/25; A-08 |
| FR-35 | UC-027, UC-014 | UI03, UI07 | UF-14, UF-02 | VisitCountBadge (“Đã đi X lần”) | get visit count (per user+place) | AC-053, AC-054, AC-P11 | F1 | **CONF CR-001**; A-10 |
| FR-19 | UC-015 | UI03 | UF-15 | ReportPlaceDialog, FileInput | submit place report | AC-029, AC-030 | F1 | OQ-21 |
| FR-20 | UC-016 | UI08 | UF-16 | SupportList, SupportNewForm, SupportThread | CRUD own tickets; add message | AC-031, AC-032 | F1 | OQ-13/21 |
| FR-21 | UC-017 | UI08 (+ AppShell badge) | UF-17 | NotificationList, NotificationBadge | list notifications; mark read (PROP) | AC-033, AC-034 | F1 | OQ-14 |
| FR-22 | nhiều | Tất cả | Tất cả | ErrorBoundary, Forbidden/NotFound/InvalidLink states, AuthGuard | (server enforcement) | AC-P05, AC-P06, AC-P10; AC-004, 016, 021, 022, 025, 032, 033 | X | Quyền thật ở server; FE chỉ phản ánh |
| FR-23 | UC-018 | A01 | UF-18 | PlaceTable, PlaceEditor, PlacePreview | admin place drafts | AC-035, AC-036 | F2 | OQ-03/04/15/18/21 |
| FR-24 | UC-019 | A01 | UF-19 | ReviewQueue, ReviewDecisionDialog | approve/return/hide | AC-037, AC-038, AC-P07 | F2 | OQ-11/15/18 |
| FR-25 | UC-020 | A02 | UF-20 | TaxonomyManager | taxonomy CRUD/deprecate | AC-039, AC-040 | F2 | OQ-18 |
| FR-26 | UC-021 | A03 | UF-21 | CollectionEditor, OrderableList, ScheduleField | collections CRUD | AC-041, AC-042 | F2 | OQ-01/18/21 |
| FR-27 | UC-022 | A04 | UF-22 | AccountTable, LockDialog, RoleEditor | users; roles | AC-043, AC-044, AC-P07 | F2 | OQ-06/17/18 |
| FR-28 | UC-024 | A05 | UF-24 | ReportQueue, ReportDetail | place reports workflow | AC-047, AC-048 | F2 | OQ-14/18 |
| FR-29 | UC-025 | A05 | UF-25 | TicketQueue, TicketThread (public/internal) | support workflow | AC-049, AC-050 | F2 | OQ-13/14/18/21 |
| FR-30 | UC-023 | A01 | UF-23 | CsvImportWizard, RowErrorTable | template; dry-run; commit | AC-045, AC-046 | F2 | OQ-19/21 |
| FR-31 | UC-018/019/022/024 | A04 | UF-22 | AuditLogTable (read-only) | audit log query | AC-044, AC-P07 | F2 | OQ-17/18 |
| FR-32 | UC-026 | — | — | `track()` analytics adapter | ingest events | AC-051 (đối chiếu), AC-P08 | X | **Không có màn hình**: FE phát sự kiện tại điểm thành công; OQ-20 |
| FR-33 | UC-026 | A06 | UF-26 | ReportFilters, MetricTiles, “Chưa có dữ liệu” state | reports | AC-051, AC-052, AC-P08 | F2 | OQ-18/20/22 |
| FR-34 | UC-026 | A06 | UF-26 | ExportCsvButton | export CSV | AC-051, AC-P08 | F2 | OQ-18/20 |

**Độ phủ:** 35/35 FR có UC và AC (FR-17 có UC nhưng AC riêng còn chờ OQ-12). 34/35 FR có screen. FR-32 không cần UI riêng (lý do ở trên). FR-22 xuyên suốt.

## 2. Non-functional requirements

| Req | Áp dụng FE | Cách truy vết | Test | FE |
|---|---|---|---|---|
| NFR-01 Hiệu năng tìm kiếm | Một phần (FE không gây waterfall/độ trễ thêm) | 02-architecture (data fetching), 06-qa (đo nếu có backend) | AC-P10 | X (chủ yếu backend) |
| NFR-02 Responsive 360 px → desktop; trình duyệt | Có | 03-wireframes, 04-screen-spec | Test 360/768/1280; Chrome/Safari/Edge; AC-P09 | X |
| NFR-03 Bàn phím, nhãn, alt, tương phản | Có | 04-design-system (a11y), component spec | Audit a11y Phase 6; AC-P09 | X |
| NFR-04 Quyền server | Phản ánh | Xử lý 401/403/404/410 | Test thay id/link thu hồi (cần backend); AC-P06 | X |
| NFR-05 2 bước nhân viên; không lộ token | Một phần | Không lưu token ở URL/log/analytics; màn 2FA admin (F2, OQ-06) | AC-P10 | X/F2 |
| NFR-06 Rate limit, giới hạn tệp | Phản ánh | Thông điệp “thử lại sau”; validate tệp phía client (OQ-21) | AC-P10 | X |
| NFR-07 Không theo dõi vị trí liên tục | Có | Chỉ xin vị trí khi người dùng bấm; không watchPosition | Review code | F1 |
| NFR-08 Không tạo trùng khi bấm lặp | Có | Disable khi pending; idempotency key (khi có contract) | Test double-click | X |
| NFR-09 Báo cáo trễ ≤24 h | Hiển thị thời điểm cập nhật | A06 | AC-051 | F2 |
| NFR-10 Backup/RPO/RTO | Không | — | — | N/A (hạ tầng) |
| NFR-11 Giám sát, mã truy vết lỗi | Có | ErrorState hiện mã tra cứu từ server | Test error state | X |
| NFR-12 Tách test/production; dữ liệu minh họa có nhãn | Có | Nhãn “Dữ liệu minh họa” khi chạy mock; biến môi trường | Review | X |

## 3. CR-001 (CONF ngày 15-11-2026)

| Quyết định | FR / RULE | Screen | Test | FE |
|---|---|---|---|---|
| DEC-01 Số lần đã đi | FR-35, RULE-29 | UI03, UI07 | AC-053, AC-054, AC-P11 | F1 |
| DEC-02 Bỏ qua lời nhắc chỉ đóng | FR-18, RULE-15 | UI07, UI01 | AC-027, AC-028, AC-057, AC-058, AC-P12 | F1 |
| DEC-03 Xem link không đăng nhập | FR-11, FR-22, RULE-30 | UI06 | AC-055, AC-056, AC-P13 | F1 |

## 4. Requirement không cần UI

| Req | Lý do |
|---|---|
| FR-32 | Thu thập sự kiện là việc nền. FE chỉ gọi adapter `track()` tại điểm thành công, không có màn hình |
| NFR-10 | Sao lưu/khôi phục thuộc hạ tầng |
| G2 (SRS §11), OQ-24 | Ngoài phạm vi G1; UI09/UI10/A07/A08 không xây dựng |
