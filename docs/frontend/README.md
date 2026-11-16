# docs/frontend — Hồ sơ phân tích & thiết kế Frontend GoWithBae G1

Tài liệu theo từng phase của quy trình requirement → frontend. Mỗi file ghi rõ phần nào đã được duyệt và phần nào còn đề xuất.

| Phase | File | Trạng thái |
|---|---|---|
| 0 Skill | [00-skill-audit.md](00-skill-audit.md) | Xong |
| 1 Requirement | [01-requirement-analysis.md](01-requirement-analysis.md), [01-functional-matrix.md](01-functional-matrix.md), [01-clarification-questions.md](01-clarification-questions.md), [01-requirement-traceability.md](01-requirement-traceability.md) | Gate 1 đã duyệt 16-11-2026 (A-01/02/03) |
| 2 Kiến trúc | [02-frontend-architecture.md](02-frontend-architecture.md), [02-screen-inventory.md](02-screen-inventory.md), [02-component-map.md](02-component-map.md), [02-api-integration-plan.md](02-api-integration-plan.md), [02-implementation-plan.md](02-implementation-plan.md) | Xong; D-02/03/04/06 chờ quyết trước Phase 5 |
| 3 UX | [03-sitemap.md](03-sitemap.md), [03-user-flows.md](03-user-flows.md), [03-wireframes.md](03-wireframes.md), [03-ux-decisions.md](03-ux-decisions.md) | Xong 16-11-2026 |
| 4 UI | [04-ui-options.md](04-ui-options.md), [04-design-system-proposal.md](04-design-system-proposal.md), [04-screen-ui-specifications.md](04-screen-ui-specifications.md), [04-design-decisions.md](04-design-decisions.md), mockup [mockups/04-ui-options.html](mockups/04-ui-options.html) | **Chờ Gate 2**: chọn hướng UI (đề xuất B+) |

## Nguồn

- **SRS chính:** `GWB-REQ-G1` v1.1 (15-11-2026), repo [Duyhoang1004/GoWithBae](https://github.com/Duyhoang1004/GoWithBae), thư mục `docs/requirements/` và `docs/specs/` (27 UC, 58 AC).
- **API contract:** `gowithbae-be/api/openapi.yaml`, do team backend sở hữu. FE gửi yêu cầu đổi contract theo mã CCR trong `02-frontend-architecture.md` §3.
- **Mock UI:** chưa có (16-11-2026). Các tham chiếu `srs/GoWithBae_UI_Review_v1` trong README/TECHSTACK hiện chưa đúng thực tế.

Mã tham chiếu: FR/RULE/NFR/AC/OQ theo SRS; A-xx, D-xx, CCR-xx, S-xx, T-xxx, UF-xx là mã của bộ tài liệu này.
