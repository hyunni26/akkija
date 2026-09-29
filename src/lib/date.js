// 날짜는 모두 로컬(한국) 기준 'YYYY-MM-DD' 문자열로 다룹니다.
// toISOString()은 UTC로 바뀌어 하루가 밀릴 수 있으므로 사용하지 않습니다.

const pad = (n) => String(n).padStart(2, '0')

export function toYmd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayYmd() {
  return toYmd(new Date())
}

export function currentMonth() {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

export function addMonths({ y, m }, n) {
  const idx = y * 12 + (m - 1) + n
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
}

export function monthStart({ y, m }) {
  return `${y}-${pad(m)}-01`
}

export function nextMonthStart(month) {
  return monthStart(addMonths(month, 1))
}

export function daysInMonth({ y, m }) {
  return new Date(y, m, 0).getDate()
}

export function compareMonth(a, b) {
  return (a.y * 12 + a.m) - (b.y * 12 + b.m)
}

export function parseMonth(ymd) {
  const [y, m] = ymd.split('-').map(Number)
  return { y, m }
}

export function monthLabel({ y, m }) {
  return `${y}년 ${m}월`
}

// 선택한 달 안의 날짜로 기본값 잡기: 이번 달이면 오늘, 지난 달이면 말일, 미래 달이면 1일
export function defaultDateInMonth(month) {
  const cmp = compareMonth(month, currentMonth())
  if (cmp === 0) return todayYmd()
  if (cmp < 0) return `${month.y}-${pad(month.m)}-${pad(daysInMonth(month))}`
  return monthStart(month)
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export function dayLabel(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const w = new Date(y, m - 1, d).getDay()
  return `${m}월 ${d}일 (${WEEK[w]})`
}

export function weekdayOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export { WEEK }
