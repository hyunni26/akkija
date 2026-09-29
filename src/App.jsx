import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChartColumn, List, Plus, Repeat, Settings } from 'lucide-react'
import { ToastProvider } from './components/Toast'
import MonthNav from './components/MonthNav'
import TransactionForm from './components/TransactionForm'
import LoginScreen from './screens/LoginScreen'
import HistoryScreen from './screens/HistoryScreen'
import StatsScreen from './screens/StatsScreen'
import RecurringScreen from './screens/RecurringScreen'
import SettingsScreen from './screens/SettingsScreen'
import { isConfigured, supabase } from './lib/supabase'
import { ensureDefaultCategories, loadMaster, loadMonthTransactions } from './lib/api'
import { currentMonth, defaultDateInMonth } from './lib/date'
import { pendingRecurring } from './lib/recurring'

export default function App() {
  return (
    <ToastProvider>
      <div className="mx-auto h-full max-w-[480px]">
        {isConfigured ? <AuthGate /> : <NotConfigured />}
      </div>
    </ToastProvider>
  )
}

function NotConfigured() {
  return (
    <div className="flex min-h-full items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-xl font-bold text-brand">akkija</h1>
        <p className="mt-3 text-sm leading-relaxed text-sub">
          Supabase 환경변수가 설정되지 않았어요.<br />
          VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LOGIN_EMAIL 을 확인해 주세요.
        </p>
      </div>
    </div>
  )
}

function AuthGate() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  if (!session) return <LoginScreen />
  return <Main key={session.user.id} />
}

function Splash({ text = '' }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3">
      <div className="text-[22px] font-bold tracking-tight text-brand">akkija</div>
      {text && <div className="text-sm text-sub">{text}</div>}
    </div>
  )
}

const TABS = [
  { key: 'history', label: '내역', icon: List, title: '내역' },
  { key: 'stats', label: '통계', icon: ChartColumn, title: '통계' },
  { key: 'recurring', label: '고정', icon: Repeat, title: '고정지출' },
  { key: 'settings', label: '설정', icon: Settings, title: '설정' },
]

function Main() {
  const [ready, setReady] = useState(false)
  const [fatal, setFatal] = useState('')
  const [tab, setTab] = useState('history')
  const [month, setMonth] = useState(currentMonth)
  const [master, setMaster] = useState({ categories: [], cards: [], recurring: [] })
  const [txs, setTxs] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [txForm, setTxForm] = useState(null) // { initial, defaults }
  const reqId = useRef(0)

  const reloadMaster = useCallback(async () => {
    setMaster(await loadMaster())
  }, [])

  // 최초: 기본 카테고리 생성 → 기준 데이터 로드
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await ensureDefaultCategories()
        const m = await loadMaster()
        if (!alive) return
        setMaster(m)
        setReady(true)
      } catch (e) {
        if (alive) setFatal(e.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // 월 내역 로드 (빠르게 월을 넘길 때 늦게 도착한 응답은 버림)
  useEffect(() => {
    if (!ready) return
    const id = ++reqId.current
    setTxLoading(true)
    loadMonthTransactions(month)
      .then((rows) => {
        if (id !== reqId.current) return
        setTxs(rows)
        setTxLoading(false)
      })
      .catch((e) => {
        if (id !== reqId.current) return
        setTxLoading(false)
        setFatal(e.message)
      })
  }, [month, ready, refreshKey])

  const refreshAll = useCallback(async () => {
    try {
      await reloadMaster()
    } finally {
      setRefreshKey((k) => k + 1)
    }
  }, [reloadMaster])

  const catMap = useMemo(() => Object.fromEntries(master.categories.map((c) => [c.id, c])), [master.categories])
  const cardMap = useMemo(() => Object.fromEntries(master.cards.map((c) => [c.id, c])), [master.cards])
  const pending = useMemo(
    () => (txLoading ? [] : pendingRecurring(master.recurring, txs, month)),
    [master.recurring, txs, month, txLoading],
  )

  if (fatal) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-sub">{fatal}</p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
          다시 시도
        </button>
      </div>
    )
  }
  if (!ready) return <Splash text="불러오는 중…" />

  const openNew = (date) => setTxForm({ initial: null, defaults: { date: date ?? defaultDateInMonth(month) } })
  const openEdit = (tx) => setTxForm({ initial: tx, defaults: {} })
  const current = TABS.find((t) => t.key === tab)

  return (
    <div className="flex min-h-full flex-col">
      <header className="pt-safe sticky top-0 z-30 bg-canvas/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-5">
          {tab === 'history' ? (
            <span className="text-[20px] font-bold tracking-tight text-brand">akkija</span>
          ) : (
            <span className="text-[18px] font-bold">{current.title}</span>
          )}
          {tab !== 'settings' && <MonthNav month={month} onChange={setMonth} />}
        </div>
      </header>

      <main className="flex-1 px-4 pt-1 pb-32">
        {tab === 'history' && (
          <HistoryScreen
            month={month}
            txs={txs}
            loading={txLoading}
            catMap={catMap}
            cardMap={cardMap}
            pending={pending}
            onOpenTx={openEdit}
            onAddOn={openNew}
            onGoRecurring={() => setTab('recurring')}
          />
        )}
        {tab === 'stats' && <StatsScreen month={month} txs={txs} cardMap={cardMap} refreshKey={refreshKey} />}
        {tab === 'recurring' && (
          <RecurringScreen
            month={month}
            txs={txs}
            recurring={master.recurring}
            pending={pending}
            categories={master.categories}
            cards={master.cards}
            catMap={catMap}
            cardMap={cardMap}
            onChanged={refreshAll}
            onOpenTx={openEdit}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen month={month} categories={master.categories} cards={master.cards} onChanged={refreshAll} />
        )}
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-surface/95 backdrop-blur">
        <div className="relative flex h-16 items-center">
          {TABS.slice(0, 2).map((t) => <TabButton key={t.key} t={t} active={tab === t.key} onClick={() => setTab(t.key)} />)}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              aria-label="내역 추가"
              onClick={() => openNew()}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_rgba(15,110,86,0.35)] active:bg-brand-dark"
            >
              <Plus size={26} strokeWidth={2.4} />
            </button>
          </div>
          {TABS.slice(2).map((t) => <TabButton key={t.key} t={t} active={tab === t.key} onClick={() => setTab(t.key)} />)}
        </div>
      </nav>

      {txForm && (
        <TransactionForm
          initial={txForm.initial}
          defaults={txForm.defaults}
          categories={master.categories}
          cards={master.cards}
          onClose={() => setTxForm(null)}
          onSaved={refreshAll}
        />
      )}
    </div>
  )
}

function TabButton({ t, active, onClick }) {
  const Icon = t.icon
  return (
    <button type="button" onClick={onClick} className={`flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium ${active ? 'text-brand' : 'text-mute'}`}>
      <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
      {t.label}
    </button>
  )
}
