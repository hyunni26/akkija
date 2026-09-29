export function won(n) {
  return Math.round(Number(n) || 0).toLocaleString('ko-KR')
}

export function signedWon(type, n) {
  return `${type === 'income' ? '+' : '-'}${won(n)}`
}

// 입력 문자열 → 정수 (숫자 외 문자 제거, 최대 12자리)
export function parseAmount(str) {
  const digits = String(str ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)
  return digits ? Number(digits) : 0
}

// 달력 칸처럼 좁은 곳용 축약 표기: 12,000 → 1.2만, 650,000 → 65만
export function compactWon(n) {
  const v = Math.round(Number(n) || 0)
  if (v >= 100000000) return `${trim1(v / 100000000)}억`
  if (v >= 10000) return `${v >= 100000 ? Math.round(v / 10000) : trim1(v / 10000)}만`
  return v.toLocaleString('ko-KR')
}

function trim1(x) {
  return (Math.round(x * 10) / 10).toString()
}
