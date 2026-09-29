import { useMemo, useState } from 'react'
import { CalendarClock, ChevronRight, Plus } from 'lucide-react'
import Segmented from '../components/Segmented'
import TxRow from '../components/TxRow'
import { compactWon, won } from '../lib/format'
import { WEEK, compareMonth, currentMonth, dayLabel, daysInMonth, todayYmd, weekdayOf } from '../lib/date'

const pad = (n) => String(n).padStart(2, '0')

function sumBy(txs) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense }
}

export default function HistoryScreen({ month, txs, loading, catMap, cardMap, pending, onOpenTx, onAddOn, onGoRecurring }) {
  const [view, setView] = useState('list')
  const [selectedDay, setSelectedDay] = useState(null)
  const total = useMemo(() => sumBy(txs), [txs])
  const pendingSum = pending.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-brand px-5 py-5 text-white">
        <div className="text-[13px] text-white/75">이번 달 잔액</div>
        <div className="num mt-1 text-[28px] font-bold tracking-tight">
          {total.income - total.expense < 0 ? '-' : ''}₩{won(Math.abs(total.income - total.expense))}
        </div>
        <div className="mt-3 flex gap-5 text-[13px]">
          <div><span className="text-white/70">수입 </span><span className="num font-semibold">{won(total.income)}</span></div>
          <div><span className="text-white/70">지출 </span><span className="num font-semibold">{won(total.expense)}</span></div>
        </div>
      </section>

      {pending.length > 0 && (
        <button
          type="button"
          onClick={onGoRecurring}
          className="flex w-full items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3 text-left active:opacity-80"
        >
          <CalendarClock size={20} className="shrink-0 text-brand" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-brand-dark">예정 고정지출 {pending.length}건</span>
            <span className="num text-sub"> · {won(pendingSum)}원</span>
          </div>
          <ChevronRight size={18} className="text-brand" />
        </button>
      )}

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'list', label: '리스트' },
          { value: 'calendar', label: '달력' },
        ]}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-sub">불러오는 중…</div>
      ) : view === 'list' ? (
        <ListView txs={txs} catMap={catMap} cardMap={cardMap} onOpenTx={onOpenTx} />
      ) : (
        <CalendarView
          month={month}
          txs={txs}
          catMap={catMap}
          cardMap={cardMap}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onOpenTx={onOpenTx}
          onAddOn={onAddOn}
        />
      )}
    </div>
  )
}

function ListView({ txs, catMap, cardMap, onOpenTx }) {
  const groups = useMemo(() => {
    const map = new Map()
    for (const t of txs) {
      if (!map.has(t.tx_date)) map.set(t.tx_date, [])
      map.get(t.tx_date).push(t)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [txs])

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl bg-surface px-5 py-14 text-center">
        <p className="font-medium">이 달의 내역이 없어요</p>
        <p className="mt-1 text-sm text-sub">아래 + 버튼으로 첫 내역을 추가해 보세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map(([date, items]) => {
        const s = sumBy(items)
        return (
          <section key={date} className="rounded-2xl bg-surface px-4 pt-3 pb-1">
            <div className="flex items-center justify-between border-b border-line pb-2 text-[13px]">
              <span className="font-semibold text-sub">{dayLabel(date)}</span>
              <span className="num space-x-2">
                {s.income > 0 && <span className="text-income">+{won(s.income)}</span>}
                {s.expense > 0 && <span className="text-expense">-{won(s.expense)}</span>}
              </span>
            </div>
            <div className="divide-y divide-line">
              {items.map((t) => (
                <TxRow key={t.id} tx={t} catMap={catMap} cardMap={cardMap} onClick={() => onOpenTx(t)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function CalendarView({ month, txs, catMap, cardMap, selectedDay, onSelectDay, onOpenTx, onAddOn }) {
  const days = daysInMonth(month)
  const first = `${month.y}-${pad(month.m)}-01`
  const lead = weekdayOf(first)
  const today = todayYmd()

  const byDay = useMemo(() => {
    const map = {}
    for (const t of txs) {
      const d = map[t.tx_date] ?? (map[t.tx_date] = { income: 0, expense: 0, items: [] })
      if (t.type === 'income') d.income += t.amount
      else d.expense += t.amount
      d.items.push(t)
    }
    return map
  }, [txs])

  // 선택한 날짜가 다른 달이면 무시
  const sel = selectedDay && selectedDay.startsWith(`${month.y}-${pad(month.m)}-`)
    ? selectedDay
    : compareMonth(month, currentMonth()) === 0 ? today : null

  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(`${month.y}-${pad(month.m)}-${pad(d)}`)

  const selItems = sel ? (byDay[sel]?.items ?? []) : []

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-surface p-3">
        <div className="grid grid-cols-7 pb-1 text-center text-xs font-medium">
          {WEEK.map((w, i) => (
            <div key={w} className={i === 0 ? 'text-expense' : i === 6 ? 'text-brand' : 'text-sub'}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((ymd, i) => {
            if (!ymd) return <div key={`e${i}`} />
            const info = byDay[ymd]
            const isSel = ymd === sel
            const isToday = ymd === today
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => onSelectDay(ymd)}
                className={`flex h-[58px] flex-col items-center rounded-xl pt-1.5 transition-colors ${isSel ? 'bg-brand-soft' : ''}`}
              >
                <span
                  className={`num flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium ${
                    isToday ? 'bg-brand text-white' : 'text-ink'
                  }`}
                >
                  {Number(ymd.slice(8))}
                </span>
                {info?.income > 0 && <span className="num mt-0.5 text-[10px] leading-tight text-income">+{compactWon(info.income)}</span>}
                {info?.expense > 0 && <span className="num text-[10px] leading-tight text-expense">-{compactWon(info.expense)}</span>}
              </button>
            )
          })}
        </div>
      </section>

      {sel && (
        <section className="rounded-2xl bg-surface px-4 pt-3 pb-1">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-[13px] font-semibold text-sub">{dayLabel(sel)}</span>
            <button type="button" onClick={() => onAddOn(sel)} className="flex items-center gap-1 text-[13px] font-semibold text-brand">
              <Plus size={15} />이 날짜에 추가
            </button>
          </div>
          {selItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-sub">내역이 없어요</p>
          ) : (
            <div className="divide-y divide-line">
              {selItems.map((t) => (
                <TxRow key={t.id} tx={t} catMap={catMap} cardMap={cardMap} onClick={() => onOpenTx(t)} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
