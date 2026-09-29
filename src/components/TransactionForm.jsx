import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Sheet from './Sheet'
import Segmented from './Segmented'
import CategoryIcon from './CategoryIcon'
import { AmountInput, Chip, Label, PrimaryButton, TextInput } from './Field'
import { useToast } from './Toast'
import { deleteTransaction, saveTransaction } from '../lib/api'
import { daysInMonth, monthStart, parseMonth } from '../lib/date'

const LAST_PAY_KEY = 'akkija.lastPayment'

function readLastPayment() {
  try {
    return JSON.parse(localStorage.getItem(LAST_PAY_KEY)) || {}
  } catch {
    return {}
  }
}

function emptyForm(defaults, cards) {
  const last = readLastPayment()
  const cardOk = cards.some((c) => c.id === last.card_id && !c.is_hidden)
  const payment_method = last.payment_method === 'card' && !cardOk ? null : (last.payment_method ?? null)
  return {
    id: null,
    type: defaults.type ?? 'expense',
    amount: 0,
    tx_date: defaults.date,
    category_id: null,
    payment_method,
    card_id: payment_method === 'card' ? last.card_id : null,
    memo: '',
    recurring_id: null,
    recurring_month: null,
  }
}

// 부모에서 열 때만 마운트합니다: {open && <TransactionForm ... />}
export default function TransactionForm({ onClose, initial, defaults, categories, cards, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() =>
    initial ? { ...initial, memo: initial.memo ?? '' } : emptyForm(defaults, cards),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (patch) => {
    setError('')
    setForm((f) => ({ ...f, ...patch }))
  }

  const visibleCats = useMemo(
    () => categories.filter((c) => c.type === form.type && (!c.is_hidden || c.id === form.category_id)),
    [categories, form.type, form.category_id],
  )
  const visibleCards = useMemo(
    () => cards.filter((c) => !c.is_hidden || c.id === form.card_id),
    [cards, form.card_id],
  )

  const isEdit = Boolean(form.id)
  const isRecurringTx = Boolean(form.recurring_id)
  // 고정지출로 확정된 내역은 해당 월 안에서만 날짜 변경 가능
  let minDate, maxDate
  if (isRecurringTx && form.recurring_month) {
    const m = parseMonth(form.recurring_month)
    minDate = monthStart(m)
    maxDate = `${form.recurring_month.slice(0, 8)}${String(daysInMonth(m)).padStart(2, '0')}`
  }

  const changeType = (type) => {
    if (type === form.type) return
    set({ type, category_id: null })
  }

  const submit = async () => {
    if (!form.amount) return setError('금액을 입력해 주세요.')
    if (!form.tx_date) return setError('날짜를 선택해 주세요.')
    if (minDate && (form.tx_date < minDate || form.tx_date > maxDate)) {
      return setError('고정지출 내역은 해당 월 안의 날짜만 선택할 수 있어요.')
    }
    if (!form.category_id) return setError('카테고리를 선택해 주세요.')
    if (form.type === 'expense') {
      if (!form.payment_method) return setError('결제수단을 선택해 주세요.')
      if (form.payment_method === 'card' && !form.card_id) return setError('카드를 선택해 주세요.')
    }
    setSaving(true)
    try {
      await saveTransaction(form)
      if (form.type === 'expense') {
        try {
          localStorage.setItem(LAST_PAY_KEY, JSON.stringify({ payment_method: form.payment_method, card_id: form.card_id }))
        } catch { /* 저장 불가 환경은 무시 */ }
      }
      toast(isEdit ? '수정했어요' : '저장했어요')
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    const msg = isRecurringTx
      ? '이 내역을 삭제할까요?\n고정지출은 다시 "이번 달 예정"으로 돌아가요.'
      : '이 내역을 삭제할까요?'
    if (!window.confirm(msg)) return
    setSaving(true)
    try {
      await deleteTransaction(form.id)
      toast('삭제했어요')
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? '내역 수정' : '내역 추가'}
      footer={
        <div className="flex gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              aria-label="삭제"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-expense active:bg-expense-soft"
            >
              <Trash2 size={19} />
            </button>
          )}
          <PrimaryButton onClick={submit} loading={saving}>
            {isEdit ? '수정하기' : '저장하기'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-5">
        {!isRecurringTx && (
          <Segmented
            value={form.type}
            onChange={changeType}
            options={[
              { value: 'expense', label: '지출' },
              { value: 'income', label: '수입' },
            ]}
          />
        )}

        <div>
          <Label>금액</Label>
          <AmountInput value={form.amount} onChange={(amount) => set({ amount })} autoFocus={!isEdit} />
        </div>

        <div>
          <Label>날짜</Label>
          <TextInput type="date" value={form.tx_date} min={minDate} max={maxDate} onChange={(e) => set({ tx_date: e.target.value })} />
        </div>

        <div>
          <Label>카테고리</Label>
          <div className="grid grid-cols-4 gap-2">
            {visibleCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => set({ category_id: c.id })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 transition-colors ${
                  form.category_id === c.id ? 'border-brand bg-brand-soft' : 'border-transparent'
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={34} />
                <span className="w-full truncate px-1 text-center text-xs font-medium text-ink">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {form.type === 'expense' && (
          <div>
            <Label>결제수단</Label>
            <div className="flex gap-2">
              <Chip active={form.payment_method === 'cash'} onClick={() => set({ payment_method: 'cash', card_id: null })}>현금</Chip>
              <Chip active={form.payment_method === 'card'} onClick={() => set({ payment_method: 'card' })}>카드</Chip>
            </div>
            {form.payment_method === 'card' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleCards.length === 0 ? (
                  <p className="text-sm text-sub">설정 &gt; 카드 관리에서 카드를 먼저 등록해 주세요.</p>
                ) : (
                  visibleCards.map((c) => (
                    <Chip key={c.id} active={form.card_id === c.id} onClick={() => set({ card_id: c.id })}>
                      {c.name}
                    </Chip>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <Label>메모 (선택)</Label>
          <TextInput value={form.memo} maxLength={100} placeholder="점심, 장보기" onChange={(e) => set({ memo: e.target.value })} />
        </div>

        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </div>
    </Sheet>
  )
}
