import { useState } from 'react'
import { ChevronRight, CreditCard, Download, Eye, LogOut, Plus, Tags } from 'lucide-react'
import Sheet from '../components/Sheet'
import Segmented from '../components/Segmented'
import CategoryIcon from '../components/CategoryIcon'
import { Label, PrimaryButton, TextInput } from '../components/Field'
import { useToast } from '../components/Toast'
import { COLORS, ICONS } from '../lib/constants'
import { saveCard, saveCategory, setCardHidden, setCategoryHidden, signOut } from '../lib/api'
import { exportMonthToExcel } from '../lib/export'
import { parseMonth } from '../lib/date'

const pad = (n) => String(n).padStart(2, '0')

export default function SettingsScreen({ month, categories, cards, onChanged }) {
  const toast = useToast()
  const [panel, setPanel] = useState(null) // 'categories' | 'cards'
  const [exportMonth, setExportMonth] = useState(`${month.y}-${pad(month.m)}`)
  const [exporting, setExporting] = useState(false)

  const doExport = async () => {
    if (!/^\d{4}-\d{2}$/.test(exportMonth)) return toast('내보낼 월을 선택해 주세요', 'error')
    setExporting(true)
    try {
      const { count } = await exportMonthToExcel(parseMonth(`${exportMonth}-01`), categories, cards)
      toast(count ? `${count}건을 내보냈어요` : '내역이 없는 달이라 빈 파일로 내보냈어요')
    } catch (e) {
      toast(e.message || '내보내기에 실패했어요', 'error')
    } finally {
      setExporting(false)
    }
  }

  const logout = async () => {
    if (!window.confirm('로그아웃할까요?')) return
    await signOut()
  }

  return (
    <div className="space-y-4">
      <section className="divide-y divide-line rounded-2xl bg-surface px-4">
        <MenuRow icon={Tags} label="카테고리 관리" onClick={() => setPanel('categories')} />
        <MenuRow icon={CreditCard} label="카드 관리" value={`${cards.filter((c) => !c.is_hidden).length}개`} onClick={() => setPanel('cards')} />
      </section>

      <section className="rounded-2xl bg-surface p-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <Download size={18} className="text-brand" />엑셀 내보내기
        </div>
        <p className="mt-1 text-[13px] text-sub">선택한 달의 내역을 엑셀(.xlsx) 파일로 받아요.</p>
        <div className="mt-3 flex gap-2">
          <TextInput type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="flex-1" />
          <button
            type="button"
            onClick={doExport}
            disabled={exporting}
            className="h-12 shrink-0 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50"
          >
            {exporting ? '만드는 중…' : '받기'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-surface px-4">
        <MenuRow icon={LogOut} label="로그아웃" onClick={logout} danger />
      </section>

      <p className="pt-2 text-center text-xs text-mute">akkija v1.0.0</p>

      {panel === 'categories' && <CategoryManager categories={categories} onClose={() => setPanel(null)} onChanged={onChanged} />}
      {panel === 'cards' && <CardManager cards={cards} onClose={() => setPanel(null)} onChanged={onChanged} />}
    </div>
  )
}

function MenuRow({ icon: Icon, label, value, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-4 text-left active:opacity-70">
      <Icon size={19} className={danger ? 'text-expense' : 'text-brand'} />
      <span className={`flex-1 text-[15px] font-medium ${danger ? 'text-expense' : ''}`}>{label}</span>
      {value && <span className="text-sm text-sub">{value}</span>}
      {!danger && <ChevronRight size={18} className="text-mute" />}
    </button>
  )
}

// ---------------- 카테고리 ----------------
function CategoryManager({ categories, onClose, onChanged }) {
  const toast = useToast()
  const [type, setType] = useState('expense')
  const [editing, setEditing] = useState(null) // null | {} | category
  const list = categories.filter((c) => c.type === type)
  const shown = list.filter((c) => !c.is_hidden)
  const hidden = list.filter((c) => c.is_hidden)
  const nextOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1

  const restore = async (c) => {
    try {
      await setCategoryHidden(c.id, false)
      toast('다시 표시했어요')
      onChanged()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <Sheet open onClose={onClose} title="카테고리 관리">
      <Segmented value={type} onChange={setType} options={[{ value: 'expense', label: '지출' }, { value: 'income', label: '수입' }]} />
      <ul className="mt-3 divide-y divide-line">
        {shown.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => setEditing(c)} className="flex w-full items-center gap-3 py-3 text-left active:opacity-70">
              <CategoryIcon icon={c.icon} color={c.color} />
              <span className="flex-1 text-[15px] font-medium">{c.name}</span>
              <ChevronRight size={18} className="text-mute" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setEditing({})}
        className="mt-2 flex h-12 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-brand/40 text-sm font-semibold text-brand active:bg-brand-soft">
        <Plus size={16} />카테고리 추가
      </button>
      {hidden.length > 0 && (
        <>
          <div className="mt-6 mb-1 text-[13px] font-medium text-sub">숨긴 카테고리</div>
          <ul className="divide-y divide-line">
            {hidden.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 opacity-70">
                <CategoryIcon icon={c.icon} color={c.color} />
                <span className="flex-1 text-[15px]">{c.name}</span>
                <button type="button" onClick={() => restore(c)} className="flex items-center gap-1 text-[13px] font-semibold text-brand">
                  <Eye size={15} />다시 표시
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {editing && (
        <CategoryForm initial={editing.id ? editing : null} type={type} nextOrder={nextOrder}
          onClose={() => setEditing(null)} onChanged={onChanged} />
      )}
    </Sheet>
  )
}

function CategoryForm({ initial, type, nextOrder, onClose, onChanged }) {
  const toast = useToast()
  const [f, setF] = useState(() => initial ?? { type, name: '', icon: 'etc', color: 'sage' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const name = f.name.trim()
    if (!name) return setError('이름을 입력해 주세요.')
    setSaving(true)
    try {
      await saveCategory({ ...f, name }, nextOrder)
      toast(initial ? '수정했어요' : '추가했어요')
      onChanged()
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const hide = async () => {
    if (!window.confirm(`'${initial.name}' 카테고리를 숨길까요?\n기존 내역은 그대로 남고, 언제든 다시 표시할 수 있어요.`)) return
    setSaving(true)
    try {
      await setCategoryHidden(initial.id, true)
      toast('숨겼어요')
      onChanged()
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
      title={initial ? '카테고리 수정' : `${f.type === 'income' ? '수입' : '지출'} 카테고리 추가`}
      footer={
        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={hide} disabled={saving}
              className="h-12 shrink-0 rounded-xl border border-line px-4 text-sm font-semibold text-sub active:bg-canvas">
              숨기기
            </button>
          )}
          <PrimaryButton onClick={submit} loading={saving}>{initial ? '수정하기' : '추가하기'}</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <CategoryIcon icon={f.icon} color={f.color} size={48} />
          <TextInput value={f.name} maxLength={20} placeholder="카테고리 이름" onChange={(e) => { setError(''); setF({ ...f, name: e.target.value }) }} />
        </div>
        <div>
          <Label>색상</Label>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(COLORS).map(([key, c]) => (
              <button key={key} type="button" aria-label={key} onClick={() => setF({ ...f, color: key })}
                className={`h-9 w-9 rounded-full border-2 ${f.color === key ? 'border-ink' : 'border-transparent'}`}
                style={{ background: c.fg }} />
            ))}
          </div>
        </div>
        <div>
          <Label>아이콘</Label>
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(ICONS).map(([key, Icon]) => (
              <button key={key} type="button" aria-label={key} onClick={() => setF({ ...f, icon: key })}
                className={`flex h-11 items-center justify-center rounded-xl border ${f.icon === key ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line text-sub'}`}>
                <Icon size={20} />
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </div>
    </Sheet>
  )
}

// ---------------- 카드 ----------------
function CardManager({ cards, onClose, onChanged }) {
  const toast = useToast()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const shown = cards.filter((c) => !c.is_hidden)
  const hidden = cards.filter((c) => c.is_hidden)
  const nextOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      await saveCard({ name }, nextOrder)
      setNewName('')
      toast('카드를 추가했어요')
      onChanged()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (c) => {
    try {
      await setCardHidden(c.id, false)
      toast('다시 표시했어요')
      onChanged()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <Sheet open onClose={onClose} title="카드 관리">
      <div className="flex gap-2">
        <TextInput value={newName} maxLength={20} placeholder="현대카드" onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()} className="flex-1" />
        <button type="button" onClick={add} disabled={busy || !newName.trim()}
          className="h-12 shrink-0 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-40">
          추가
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-sub">등록된 카드가 없어요.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {shown.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setEditing(c)} className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-70">
                <CreditCard size={19} className="text-brand" />
                <span className="flex-1 text-[15px] font-medium">{c.name}</span>
                <ChevronRight size={18} className="text-mute" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {hidden.length > 0 && (
        <>
          <div className="mt-6 mb-1 text-[13px] font-medium text-sub">숨긴 카드</div>
          <ul className="divide-y divide-line">
            {hidden.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 opacity-70">
                <CreditCard size={19} className="text-sub" />
                <span className="flex-1 text-[15px]">{c.name}</span>
                <button type="button" onClick={() => restore(c)} className="flex items-center gap-1 text-[13px] font-semibold text-brand">
                  <Eye size={15} />다시 표시
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {editing && <CardForm card={editing} onClose={() => setEditing(null)} onChanged={onChanged} />}
    </Sheet>
  )
}

function CardForm({ card, onClose, onChanged }) {
  const toast = useToast()
  const [name, setName] = useState(card.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim()) return setError('이름을 입력해 주세요.')
    setSaving(true)
    try {
      await saveCard({ id: card.id, name }, 0)
      toast('수정했어요')
      onChanged()
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const hide = async () => {
    if (!window.confirm(`'${card.name}' 카드를 숨길까요?\n기존 내역은 그대로 남고, 언제든 다시 표시할 수 있어요.`)) return
    setSaving(true)
    try {
      await setCardHidden(card.id, true)
      toast('숨겼어요')
      onChanged()
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
      title="카드 수정"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={hide} disabled={saving}
            className="h-12 shrink-0 rounded-xl border border-line px-4 text-sm font-semibold text-sub active:bg-canvas">
            숨기기
          </button>
          <PrimaryButton onClick={submit} loading={saving}>수정하기</PrimaryButton>
        </div>
      }
    >
      <TextInput value={name} maxLength={20} onChange={(e) => { setError(''); setName(e.target.value) }} />
      {error && <p className="mt-3 text-sm font-medium text-expense">{error}</p>}
    </Sheet>
  )
}
