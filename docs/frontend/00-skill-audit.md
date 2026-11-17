# 00 — Skill Audit (PHASE 0)

**Ngày:** 16-11-2026 · **Agent:** Claude Code (desktop app, Windows 11) · **Workspace:** `D:\go_with_bae`

## 1. Môi trường và vị trí skill

| Hạng mục | Kết quả kiểm tra |
|---|---|
| Agent | Claude Code; skill được nạp từ `~/.claude/skills` (global) và `.claude/skills` (project) |
| Project-level skills | Không có thư mục `.claude/skills` hay `.agents/skills` trong workspace |
| Global skills (thực tế) | `C:\Users\Maxsys\.agents\skills\*`, được symlink vào `C:\Users\Maxsys\.claude\skills\` bởi Skills CLI |
| Lock file | `C:\Users\Maxsys\.agents\.skill-lock.json` (v3) ghi nguồn, hash thư mục, thời điểm cài |
| Công cụ | Node.js v24.19.0, `npx` có sẵn; Skills CLI (`npx skills`) |
| Skill khác trong workspace | `.ba-skills-source/skills/{brd-agent,srs-agent}`: bản nguồn dùng để lập tài liệu BA, **không** được cài vào agent; không thuộc danh sách skill Frontend |

## 2. Danh sách skill yêu cầu và trạng thái

| # | Skill | Nguồn | Trạng thái trước kiểm tra | Hành động | Trạng thái hiện tại | Phase áp dụng |
|---|---|---|---|---|---|---|
| 1 | `frontend-design` | anthropics/skills · `skills/frontend-design` | **Đã cài** 14-11-2026 (hash `d79e2a5…`) | Không cài lại, không cập nhật | Có sẵn | PHASE 4, 5 |
| 2 | `web-design-guidelines` | vercel-labs/agent-skills · `skills/web-design-guidelines` | **Đã cài** 14-11-2026 (hash `3116f3e…`) | Không cài lại, không cập nhật | Có sẵn | PHASE 4, 6 |
| 3 | `vercel-react-best-practices` | vercel-labs/agent-skills · `skills/react-best-practices` | **Thiếu** | Kiểm tra nguồn → cài global | **Đã cài** 16-11-2026, 72 file rule | PHASE 5, 6 |
| 4 | `vercel-composition-patterns` | vercel-labs/agent-skills · `skills/composition-patterns` | **Thiếu** | Kiểm tra nguồn → cài global | **Đã cài** 16-11-2026, 10 file rule | PHASE 2, 5 |
| C1 | `requirement-to-ui` (custom, đề xuất) | Không có nguồn | Không tồn tại | Không tạo, không cài | Dùng quy trình trong Master Prompt | PHASE 1, 2, 3 |
| C2 | `frontend-planning` (custom, đề xuất) | Không có nguồn | Không tồn tại | Không tạo, không cài | Dùng quy trình trong Master Prompt | PHASE 2 |

Skill khác đã có sẵn (không thuộc yêu cầu, giữ nguyên): `ui-ux-pro-max` (nextlevelbuilder), `find-skills`, `java-springboot`. `ui-ux-pro-max` có thể dùng làm tham khảo phụ ở PHASE 4/6 (bảng màu, a11y checklist); không thay thế 4 skill bắt buộc.

## 3. Kiểm tra trước khi cài (skill 3, 4)

| Tiêu chí | `vercel-react-best-practices` | `vercel-composition-patterns` |
|---|---|---|
| Nguồn GitHub | `raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/SKILL.md` | `…/skills/composition-patterns/SKILL.md` |
| Tác giả / license | vercel, MIT, v1.0.0 | vercel, MIT, v1.0.0 |
| Nội dung | 70 rule / 8 nhóm: waterfalls, bundle size, server, client fetching, re-render, rendering, JS perf, advanced | 4 nhóm: component architecture, state management, implementation patterns, React 19 APIs |
| Script / lệnh shell / gọi mạng | Không có, chỉ tài liệu Markdown và tham chiếu file rule cục bộ | Không có |
| Tương thích | Định dạng SKILL.md chuẩn, Claude Code đọc được; một số rule `server-*` chỉ áp dụng nếu chọn Next.js/RSC | Tương thích; nhóm `react19-*` chỉ áp dụng nếu dùng React 19 |
| Đánh giá rủi ro của Skills CLI lúc cài | Gen: Safe · Socket: 0 alerts · Snyk: Low Risk | Gen: Safe · Socket: 0 alerts · Snyk: Low Risk |

**Lệnh đã chạy** (một lần, chỉ 2 skill thiếu, phạm vi global giống các skill hiện có):

```bash
npx -y skills add vercel-labs/agent-skills --skill vercel-react-best-practices --skill vercel-composition-patterns -g -y
```

Kết quả: cài vào `~/.agents/skills/` và symlink vào `~/.claude/skills/`. Đã kiểm tra lại: symlink tồn tại, mỗi skill có `SKILL.md`, `AGENTS.md`, `README.md`, `rules/`. Agent đã nhận diện cả hai skill trong danh sách skill khả dụng của phiên.

## 4. Tóm tắt nội dung SKILL.md đã đọc

- **frontend-design:** đặt nền thiết kế theo chủ đề sản phẩm, chọn typography/palette/layout có chủ đích và tránh mẫu rập khuôn. Hero mở bằng yếu tố đặc trưng nhất của sản phẩm. Phải xác nhận subject, audience và primary job với khách.
- **web-design-guidelines:** review code UI theo Web Interface Guidelines. Skill tải bộ rule mới nhất từ `vercel-labs/web-interface-guidelines/command.md` mỗi lần review và báo kết quả dạng `file:line`. Cần mạng khi chạy PHASE 6.
- **vercel-react-best-practices:** ưu tiên loại bỏ waterfall và giảm bundle, sau đó mới tối ưu re-render. Không memo tùy tiện.
- **vercel-composition-patterns:** tránh boolean prop proliferation; dùng compound components và provider có interface rõ; tách state khỏi UI; dùng variant component tường minh.

## 5. Giới hạn đã biết

- `web-design-guidelines` phụ thuộc truy cập mạng tới GitHub ở PHASE 6; nếu bị chặn sẽ báo rõ và review theo bản rule đã tải trước (nếu có).
- Hai custom skill không tồn tại; quy trình tương ứng được thực hiện thủ công theo Master Prompt và ghi trong tài liệu từng phase.
- Không cập nhật các skill đã cài (theo Global Rule 8). Phiên bản đang dùng được xác định theo hash trong lock file.
