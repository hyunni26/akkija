import { compareMonth, currentMonth, monthStart } from './date'

// 선택한 달에 아직 확정되지 않은 고정지출 목록
// - 숨김(삭제) 처리된 항목 제외
// - 시작월 ~ 종료월 사이인 달만
// - 미래 달에는 예정 표시하지 않음 (매월 1일부터 표시)
export function pendingRecurring(recurring, monthTxs, month, now = currentMonth()) {
  if (compareMonth(month, now) > 0) return []
  const key = monthStart(month)
  const done = new Set(
    monthTxs.filter((t) => t.recurring_id && t.recurring_month === key).map((t) => t.recurring_id),
  )
  return recurring.filter(
    (r) =>
      !r.is_hidden &&
      r.start_month <= key &&
      (!r.end_month || r.end_month >= key) &&
      !done.has(r.id),
  )
}
