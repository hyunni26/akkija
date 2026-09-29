import { useEffect, useMemo, useState } from 'react'
import { Banknote, CreditCard } from 'lucide-react'
import { loadRangeTotals } from '../lib/api'
import { addMonths, parseMonth } from '../lib/date'
import { compactWon, won } from '../lib/format'

const MONTHS = 6

export default function StatsScreen({ month, txs, cardMap, refreshKey }) {
  return (
    <div className="space-y-4">
      <PaymentTotals txs={txs} cardMap={cardMap} />
      <Trend month={month} refreshKey={refreshKey} />
    </div>
  )
}

function PaymentTotals({ txs, cardMap }) {
  const { rows, total } = useMemo(() => {
    const map = new Map()
    let total = 0
    for (const t of txs) {
      if (t.type !== 'expense') continue
      total += t.amount
      const key = t.payment_method === 'cash' ? 'cash' : t.card_id
      const cur = map.get(key) ?? {
        key,
        label: key === 'cash' ? '현금' : (cardMap[t.card_id]?.name ?? '카드'),
        isCash: key === 'cash',
        amount: 0,
        count: 0,
      }
      cur.amount += t.amount
      cur.count += 1
      map.set(key, cur)
    }
    return { rows: [...map.values()].sort((a, b) => b.amount - a.amount), total }
  }, [txs, cardMap])

  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">결제수단별 지출</h2>
        <span className="num text-[15px] font-semibold text-expense">{won(total)}원</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-sub">이 달의 지출이 없어요</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((r) => {
            const pct = total ? Math.round((r.amount / total) * 100) : 0
            const Icon = r.isCash ? Banknote : CreditCard
            return (
              <li key={r.key}>
                <div className="flex items-center gap-2 text-sm">
                  <Icon size={16} className="shrink-0 text-brand" />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                  <span className="text-xs text-mute">{r.count}건</span>
                  <span className="num w-[92px] text-right font-semibold">{won(r.amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="num w-9 text-right text-xs text-sub">{pct}%</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Trend({ month, refreshKey }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const months = useMemo(
    () => Array.from({ length: MONTHS }, (_, i) => addMonths(month, i - (MONTHS - 1))),
    [month],
  )

  useEffect(() => {
    let alive = true
    setError('')
    loadRangeTotals(months[0], months[MONTHS - 1])
      .then((rows) => {
        if (!alive) return
        const agg = months.map((m) => ({ ...m, income: 0, expense: 0 }))
        for (const t of rows) {
          const { y, m } = parseMonth(t.tx_date)
          const slot = agg.find((a) => a.y === y && a.m === m)
          if (!slot) continue
          if (t.type === 'income') slot.income += t.amount
          else slot.expense += t.amount
        }
        setData(agg)
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [months, refreshKey])

  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">최근 {MONTHS}개월 추이</h2>
        <div className="flex gap-3 text-xs text-sub">
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-income" />수입</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-expense" />지출</span>
        </div>
      </div>
      {error ? (
        <p className="py-8 text-center text-sm text-expense">{error}</p>
      ) : !data ? (
        <p className="py-8 text-center text-sm text-sub">불러오는 중…</p>
      ) : (
        <>
          <BarChart data={data} />
          <table className="num mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-xs text-mute">
                <th className="pb-1 text-left font-medium">월</th>
                <th className="pb-1 text-right font-medium">수입</th>
                <th className="pb-1 text-right font-medium">지출</th>
                <th className="pb-1 text-right font-medium">잔액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...data].reverse().map((d) => (
                <tr key={`${d.y}-${d.m}`}>
                  <td className="py-2 text-sub">{d.y % 100}.{String(d.m).padStart(2, '0')}</td>
                  <td className="py-2 text-right text-income">{won(d.income)}</td>
                  <td className="py-2 text-right text-expense">{won(d.expense)}</td>
                  <td className={`py-2 text-right font-semibold ${d.income - d.expense < 0 ? 'text-expense' : 'text-ink'}`}>
                    {won(d.income - d.expense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}

function BarChart({ data }) {
  const W = 320
  const H = 170
  const top = 18
  const bottom = 24
  const plotH = H - top - bottom
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const slot = W / data.length
  const bw = Math.min(16, slot / 3.2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="최근 6개월 수입 지출 막대 그래프">
      <line x1="0" x2={W} y1={top + plotH} y2={top + plotH} stroke="#E3EAE6" />
      {data.map((d, i) => {
        const cx = slot * i + slot / 2
        const hi = (d.income / max) * plotH
        const he = (d.expense / max) * plotH
        const last = i === data.length - 1
        return (
          <g key={`${d.y}-${d.m}`}>
            <rect x={cx - bw - 1.5} y={top + plotH - hi} width={bw} height={Math.max(hi, 0)} rx="3" fill="#0F6E56" />
            <rect x={cx + 1.5} y={top + plotH - he} width={bw} height={Math.max(he, 0)} rx="3" fill="#993C1D" />
            {last && d.expense > 0 && (
              <text x={cx + 1.5 + bw / 2} y={top + plotH - he - 5} textAnchor="middle" fontSize="10" fill="#993C1D" fontWeight="600">
                {compactWon(d.expense)}
              </text>
            )}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="11" fill={last ? '#18241F' : '#66736D'} fontWeight={last ? 600 : 400}>
              {d.m}월
            </text>
          </g>
        )
      })}
    </svg>
  )
}
