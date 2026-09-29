import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Sheet from '../components/Sheet'
import CategoryIcon from '../components/CategoryIcon'
import TxRow from '../components/TxRow'
import { AmountInput, Chip, Label, PrimaryButton, TextInput } from '../components/Field'
import { useToast } from '../components/Toast'
import { confirmRecurring, saveRecurring, setRecurringHidden } from '../lib/api'
import { compareMonth, currentMonth, daysInMonth, defaultDateInMonth, monthLabel, monthStart } from '../lib/date'
import { won } from '../lib/format'

const pad = (n) => String(n).padStart(2, '0')

function payLabel(r, cardMap) {
  return r.payment_method === 'card' ? (cardMap[r.card_id]?.name ?? '카드') : '현금'
}

export default function RecurringScreen({ month, txs, recurring, pending, categories, cards, catMap, cardMap, onChanged, onOpenTx }) {
  const [confirming, setConfirming] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (new) | recurring row

  const isFuture = compareMonth(month, currentMonth()) > 0
  const confirmed = useMemo(
    () => txs.filter((t) => t.recurring_id && t.recurring_month === monthStart(month)),
    [txs, month],
  )
  const active = recurring.filter((r) => !r.is_hidden)

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-surface px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-semibold">{monthLabel(month)} 예정</h2>
        {isFuture ? (
          <p className="py-6 text-center text-sm text-sub">해당 월 1일부터 예정 목록이 표시돼요.</p>
        ) : pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-sub">
            {active.length === 0 ? '등록된 고정지출이 없어요.' : '이 달 고정지출을 모두 확정했어요.'}
          </p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {pending.map((r) => {
              const cat = catMap[r.category_id]
              return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon icon={cat?.icon} color={cat?.color} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium">{r.name}</div>
                    <div className="num truncate text-[13px] text-sub">{won(r.amount)}원 · {payLabel(r, cardMap)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirming(r)}
                    className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white active:bg-brand-dark"
                  >
                    확정
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {confirmed.length > 0 && (
        <section className="rounded-2xl bg-surface px-4 pt-4 pb-1">
          <h2 className="text-[15px] font-semibold">확정됨</h2>
          <div className="divide-y divide-line">
            {confirmed.map((t) => (
              <TxRow key={t.id} tx={t} catMap={catMap} cardMap={cardMap} onClick={() => onOpenTx(t)} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-surface px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">고정지출 목록</h2>
          <button type="button" onClick={() => setEditing({})} className="flex items-center gap-1 text-[13px] font-semibold text-brand">
            <Plus size={15} />추가
          </button>
        </div>
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-sub">월세, 구독료처럼 매달 나가는 지출을 등록해 보세요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {active.map((r) => {
              const cat = catMap[r.category_id]
              const period = `${r.start_month.slice(0, 7).replace('-', '.')}${r.end_month ? ` ~ ${r.end_month.slice(0, 7).replace('-', '.')}` : ' ~'}`
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => setEditing(r)} className="flex w-full items-center gap-3 py-3 text-left active:opacity-70">
                    <CategoryIcon icon={cat?.icon} color={cat?.color} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{r.name}</div>
                      <div className="num truncate text-[13px] text-sub">{payLabel(r, cardMap)} · {period}</div>
                    </div>
                    <span className="num shrink-0 text-[15px] font-semibold">{won(r.amount)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {confirming && (
        <ConfirmSheet rec={confirming} month={month} onClose={() => setConfirming(null)} onDone={onChanged} />
      )}
      {editing && (
        <RecurringForm
          initial={editing.id ? editing : null}
          month={month}
          categories={categories}
          cards={cards}
          onClose={() => setEditing(null)}
          onDone={onChanged}
        />
      )}
    </div>
  )
}

function ConfirmSheet({ rec, month, onClose, onDone }) {
  const toast = useToast()
  const minDate = monthStart(month)
  const maxDate = `${month.y}-${pad(month.m)}-${pad(daysInMonth(month))}`
  const [amount, setAmount] = useState(rec.amount)
  const [date, setDate] = useState(defaultDateInMonth(month))
  const [memo, setMemo] = useState(rec.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!amount) return setError('금액을 입력해 주세요.')
    if (!date || date < minDate || date > maxDate) return setError(`${monthLabel(month)} 안의 날짜를 선택해 주세요.`)
    setSaving(true)
    try {
      await confirmRecurring(rec, month, { amount, tx_date: date, memo })
      toast('확정했어요')
      onDone()
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title={`${rec.name} 확정`} footer={<PrimaryButton onClick={submit} loading={saving}>확정하기</PrimaryButton>}>
      <div className="space-y-5">
        <div>
          <Label>금액 (이번 달 실제 금액으로 수정 가능)</Label>
          <AmountInput value={amount} onChange={(v) => { setError(''); setAmount(v) }} />
        </div>
        <div>
          <Label>날짜</Label>
          <TextInput type="date" value={date} min={minDate} max={maxDate} onChange={(e) => { setError(''); setDate(e.target.value) }} />
        </div>
        <div>
          <Label>메모</Label>
          <TextInput value={memo} maxLength={100} onChange={(e) => setMemo(e.target.value)} />
        </div>
        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </div>
    </Sheet>
  )
}

function RecurringForm({ initial, month, categories, cards, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState(() =>
    initial
      ? { ...initial, start: initial.start_month.slice(0, 7), end: initial.end_month ? initial.end_month.slice(0, 7) : '' }
      : { name: '', amount: 0, category_id: null, payment_method: null, card_id: null, start: monthStart(month).slice(0, 7), end: '' },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (patch) => { setError(''); setF((x) => ({ ...x, ...patch })) }

  const cats = categories.filter((c) => c.type === 'expense' && (!c.is_hidden || c.id === f.category_id))
  const cardList = cards.filter((c) => !c.is_hidden || c.id === f.card_id)

  const submit = async () => {
    if (!f.name.trim()) return setError('이름을 입력해 주세요.')
    if (!f.amount) return setError('금액을 입력해 주세요.')
    if (!f.category_id) return setError('카테고리를 선택해 주세요.')
    if (!f.payment_method) return setError('결제수단을 선택해 주세요.')
    if (f.payment_method === 'card' && !f.card_id) return setError('카드를 선택해 주세요.')
    if (!/^\d{4}-\d{2}$/.test(f.start)) return setError('시작 월을 선택해 주세요.')
    if (f.end && !/^\d{4}-\d{2}$/.test(f.end)) return setError('종료 월 형식을 확인해 주세요.')
    if (f.end && f.end < f.start) return setError('종료 월은 시작 월 이후여야 해요.')
    setSaving(true)
    try {
      await saveRecurring({ ...f, start_month: `${f.start}-01`, end_month: f.end ? `${f.end}-01` : null })
      toast(initial ? '수정했어요' : '등록했어요')
      onDone()
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`'${initial.name}' 고정지출을 삭제할까요?\n이미 확정된 내역은 그대로 남아요.`)) return
    setSaving(true)
    try {
      await setRecurringHidden(initial.id, true)
      toast('삭제했어요')
      onDone()
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={initial ? '고정지출 수정' : '고정지출 추가'}
      footer={
        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={remove} disabled={saving} aria-label="삭제"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-expense active:bg-expense-soft">
              <Trash2 size={19} />
            </button>
          )}
          <PrimaryButton onClick={submit} loading={saving}>{initial ? '수정하기' : '등록하기'}</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>이름</Label>
          <TextInput value={f.name} maxLength={30} placeholder="월세, 넷플릭스" onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <Label>금액 (매달 기본 금액)</Label>
          <AmountInput value={f.amount} onChange={(amount) => set({ amount })} />
        </div>
        <div>
          <Label>카테고리</Label>
          <div className="grid grid-cols-4 gap-2">
            {cats.map((c) => (
              <button key={c.id} type="button" onClick={() => set({ category_id: c.id })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 ${f.category_id === c.id ? 'border-brand bg-brand-soft' : 'border-transparent'}`}>
                <CategoryIcon icon={c.icon} color={c.color} size={34} />
                <span className="w-full truncate px-1 text-center text-xs font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>결제수단</Label>
          <div className="flex gap-2">
            <Chip active={f.payment_method === 'cash'} onClick={() => set({ payment_method: 'cash', card_id: null })}>현금</Chip>
            <Chip active={f.payment_method === 'card'} onClick={() => set({ payment_method: 'card' })}>카드</Chip>
          </div>
          {f.payment_method === 'card' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {cardList.length === 0 ? (
                <p className="text-sm text-sub">설정 &gt; 카드 관리에서 카드를 먼저 등록해 주세요.</p>
              ) : cardList.map((c) => (
                <Chip key={c.id} active={f.card_id === c.id} onClick={() => set({ card_id: c.id })}>{c.name}</Chip>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>시작 월</Label>
            <TextInput type="month" value={f.start} onChange={(e) => set({ start: e.target.value })} />
          </div>
          <div>
            <Label>종료 월 (선택)</Label>
            <TextInput type="month" value={f.end} min={f.start} onChange={(e) => set({ end: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </div>
    </Sheet>
  )
}
