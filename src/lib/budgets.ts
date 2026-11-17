import type { Schemas } from '../api/client.ts'

/** Khoảng ngân sách cho hai người theo SRS §5.1. Ranh giới chính xác là PROP (OQ-03) và do server áp dụng. */
export const BUDGETS: { value: Schemas['BudgetBand']; label: string }[] = [
  { value: 'FREE', label: 'Miễn phí' },
  { value: 'UNDER_200K', label: 'Dưới 200.000 ₫' },
  { value: 'FROM_200K_TO_400K', label: '200.000 – dưới 400.000 ₫' },
  { value: 'FROM_400K_TO_700K', label: '400.000 – 700.000 ₫' },
  { value: 'OVER_700K', label: 'Trên 700.000 ₫' },
]

export const budgetLabel = (v: string) => BUDGETS.find((b) => b.value === v)?.label
