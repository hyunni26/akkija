import { supabase, LOGIN_EMAIL } from './supabase'
import { DEFAULT_CATEGORIES } from './constants'
import { monthStart, nextMonthStart } from './date'

function must({ data, error }) {
  if (error) {
    console.error(error)
    throw new Error(toKoreanError(error))
  }
  return data
}

function toKoreanError(error) {
  const msg = error?.message || ''
  if (/Invalid login credentials/i.test(msg)) return '비밀번호가 맞지 않아요.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return '네트워크 연결을 확인해 주세요.'
  if (/tx_recurring_once|duplicate key/i.test(msg)) return '이미 확정된 고정지출이에요.'
  if (/JWT|session/i.test(msg)) return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  return '저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

// ---------- 인증 ----------
export async function signIn(password) {
  const { error } = await supabase.auth.signInWithPassword({ email: LOGIN_EMAIL, password })
  if (error) throw new Error(toKoreanError(error))
}

export async function signOut() {
  await supabase.auth.signOut()
}

// ---------- 기본 카테고리 (첫 로그인 1회) ----------
let seeding = null
export function ensureDefaultCategories() {
  if (!seeding) {
    seeding = (async () => {
      const res = await supabase.from('categories').select('id', { count: 'exact', head: true })
      if (res.error) throw new Error(toKoreanError(res.error))
      if ((res.count ?? 0) === 0) {
        must(await supabase.from('categories').insert(DEFAULT_CATEGORIES))
      }
    })().catch((e) => {
      seeding = null
      throw e
    })
  }
  return seeding
}

// ---------- 기준 데이터 ----------
export async function loadMaster() {
  const [categories, cards, recurring] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('created_at'),
    supabase.from('cards').select('*').order('sort_order').order('created_at'),
    supabase.from('recurring').select('*').order('created_at'),
  ])
  return { categories: must(categories), cards: must(cards), recurring: must(recurring) }
}

// ---------- 내역 ----------
export async function loadMonthTransactions(month) {
  return must(
    await supabase
      .from('transactions')
      .select('*')
      .gte('tx_date', monthStart(month))
      .lt('tx_date', nextMonthStart(month))
      .order('tx_date', { ascending: false })
      .order('created_at', { ascending: false }),
  )
}

export async function loadRangeTotals(fromMonth, toMonth) {
  return must(
    await supabase
      .from('transactions')
      .select('tx_date,type,amount')
      .gte('tx_date', monthStart(fromMonth))
      .lt('tx_date', nextMonthStart(toMonth)),
  )
}

function txPayload(t) {
  const isIncome = t.type === 'income'
  return {
    tx_date: t.tx_date,
    type: t.type,
    amount: t.amount,
    category_id: t.category_id,
    payment_method: isIncome ? null : t.payment_method,
    card_id: !isIncome && t.payment_method === 'card' ? t.card_id : null,
    memo: t.memo?.trim() ? t.memo.trim() : null,
  }
}

export async function saveTransaction(t) {
  const payload = txPayload(t)
  if (t.id) {
    must(await supabase.from('transactions').update(payload).eq('id', t.id))
  } else {
    must(await supabase.from('transactions').insert(payload))
  }
}

export async function deleteTransaction(id) {
  must(await supabase.from('transactions').delete().eq('id', id))
}

// ---------- 카테고리 ----------
export async function saveCategory(c, nextOrder) {
  const payload = { type: c.type, name: c.name.trim(), icon: c.icon, color: c.color }
  if (c.id) {
    must(await supabase.from('categories').update(payload).eq('id', c.id))
  } else {
    must(await supabase.from('categories').insert({ ...payload, sort_order: nextOrder }))
  }
}

export async function setCategoryHidden(id, hidden) {
  must(await supabase.from('categories').update({ is_hidden: hidden }).eq('id', id))
}

// ---------- 카드 ----------
export async function saveCard(c, nextOrder) {
  if (c.id) {
    must(await supabase.from('cards').update({ name: c.name.trim() }).eq('id', c.id))
  } else {
    must(await supabase.from('cards').insert({ name: c.name.trim(), sort_order: nextOrder }))
  }
}

export async function setCardHidden(id, hidden) {
  must(await supabase.from('cards').update({ is_hidden: hidden }).eq('id', id))
}

// ---------- 고정지출 ----------
export async function saveRecurring(r) {
  const payload = {
    name: r.name.trim(),
    amount: r.amount,
    category_id: r.category_id,
    payment_method: r.payment_method,
    card_id: r.payment_method === 'card' ? r.card_id : null,
    memo: r.memo?.trim() ? r.memo.trim() : null,
    start_month: r.start_month,
    end_month: r.end_month || null,
  }
  if (r.id) {
    must(await supabase.from('recurring').update(payload).eq('id', r.id))
  } else {
    must(await supabase.from('recurring').insert(payload))
  }
}

export async function setRecurringHidden(id, hidden) {
  must(await supabase.from('recurring').update({ is_hidden: hidden }).eq('id', id))
}

export async function confirmRecurring(rec, month, { amount, tx_date, memo }) {
  must(
    await supabase.from('transactions').insert({
      tx_date,
      type: 'expense',
      amount,
      category_id: rec.category_id,
      payment_method: rec.payment_method,
      card_id: rec.payment_method === 'card' ? rec.card_id : null,
      memo: memo?.trim() ? memo.trim() : rec.name,
      recurring_id: rec.id,
      recurring_month: monthStart(month),
    }),
  )
}
