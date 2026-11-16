# docs/frontend — Hồ sơ phân tích & thiết kế Frontend GoWithBae G1

Tài liệu theo từng phase của quy trình requirement → frontend. Mỗi file ghi rõ phần nào đã được duyệt và phần nào còn đề xuất.

| Phase | File | Trạng thái |
|---|---|---|
| 0 Skill | [00-skill-audit.md](00-skill-audit.md) | Xong |
| 1 Requirement | [01-requirement-analysis.md](01-requirement-analysis.md), [01-functional-matrix.md](01-functional-matrix.md), [01-clarification-questions.md](01-clarification-questions.md), [01-requirement-traceability.md](01-requirement-traceability.md) | Gate 1 đã duyệt 16-11-2026 (A-01/02/03) |
| 2 Kiến trúc | [02-frontend-architecture.md](02-frontend-architecture.md), [02-screen-inventory.md](02-screen-inventory.md), [02-component-map.md](02-component-map.md), [02-api-integration-plan.md](02-api-integration-plan.md), [02-implementation-plan.md](02-implementation-plan.md) | Xong; D-01…D-07 đã duyệt 16-11-2026 |
| 3 UX | [03-sitemap.md](03-sitemap.md), [03-user-flows.md](03-user-flows.md), [03-wireframes.md](03-wireframes.md), [03-ux-decisions.md](03-ux-decisions.md) | Xong 16-11-2026 |
| 4 UI | [04-ui-options.md](04-ui-options.md), [04-design-system-proposal.md](04-design-system-proposal.md), [04-screen-ui-specifications.md](04-screen-ui-specifications.md), [04-design-decisions.md](04-design-decisions.md), mockup [mockups/04-ui-options.html](mockups/04-ui-options.html) | Gate 2 thông qua 16-11-2026 (B+, Stitch làm tham chiếu) |
| 5 Triển khai | [05-stitch-audit.md](05-stitch-audit.md), [05-implementation-log.md](05-implementation-log.md) | F1 web khách xong trên dữ liệu minh họa; chờ CCR-01/02/03 |
| 6 QA & nghiệm thu | [06-qa-report.md](06-qa-report.md), [06-requirement-coverage.md](06-requirement-coverage.md), [06-final-handover.md](06-final-handover.md) | **Chờ Gate 3**: 0 FAIL, 57/57 test, 0 vi phạm axe; chưa production-ready |

## Nguồn

- **SRS chính:** `GWB-REQ-G1` v1.1 (15-11-2026), repo [Duyhoang1004/GoWithBae](https://github.com/Duyhoang1004/GoWithBae), thư mục `docs/requirements/` và `docs/specs/` (27 UC, 58 AC).
- **API contract:** `gowithbae-be/api/openapi.yaml`, do team backend sở hữu. FE gửi yêu cầu đổi contract theo mã CCR trong `02-frontend-architecture.md` §3.
- **Mock UI:** bản Stitch (15 màn) được gửi ngày 16-11-2026, không đưa vào repo; kết quả audit ở [05-stitch-audit.md](05-stitch-audit.md).

Mã tham chiếu: FR/RULE/NFR/AC/OQ theo SRS; A-xx, D-xx, CCR-xx, S-xx, T-xxx, UF-xx là mã của bộ tài liệu này.
