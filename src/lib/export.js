import writeExcelFile from 'write-excel-file/universal'
import { PAYMENT_LABEL } from './constants'
import { loadMonthTransactions } from './api'

const pad = (n) => String(n).padStart(2, '0')
const head = (value) => ({ value, fontWeight: 'bold', backgroundColor: '#E1F5EE', align: 'center' })
const num = (value) => ({ value, type: Number, format: '#,##0' })

export function buildMonthSheet(rows, categories, cards) {
  rows = [...rows].sort((a, b) => (a.tx_date === b.tx_date
    ? a.created_at.localeCompare(b.created_at)
    : a.tx_date.localeCompare(b.tx_date)))

  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const cardName = Object.fromEntries(cards.map((c) => [c.id, c.name]))

  let income = 0
  let expense = 0
  const data = [
    [head('날짜'), head('구분'), head('카테고리'), head('금액'), head('결제수단'), head('카드'), head('메모')],
  ]
  for (const t of rows) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
    data.push([
      t.tx_date,
      t.type === 'income' ? '수입' : '지출',
      catName[t.category_id] ?? '',
      num(t.amount),
      t.payment_method ? PAYMENT_LABEL[t.payment_method] : '',
      t.card_id ? (cardName[t.card_id] ?? '') : '',
      t.memo ?? '',
    ])
  }
  data.push([null, null, null, null, null, null, null])
  data.push([{ value: '수입 합계', fontWeight: 'bold' }, null, null, { ...num(income), fontWeight: 'bold' }, null, null, null])
  data.push([{ value: '지출 합계', fontWeight: 'bold' }, null, null, { ...num(expense), fontWeight: 'bold' }, null, null, null])
  data.push([{ value: '잔액', fontWeight: 'bold' }, null, null, { ...num(income - expense), fontWeight: 'bold' }, null, null, null])

  return data
}

export async function exportMonthToExcel(month, categories, cards) {
  const rows = await loadMonthTransactions(month)
  const data = buildMonthSheet(rows, categories, cards)
  const columns = [{ width: 12 }, { width: 7 }, { width: 12 }, { width: 14 }, { width: 9 }, { width: 14 }, { width: 30 }]
  const fileName = `akkija_${month.y}-${pad(month.m)}.xlsx`
  const blob = await writeExcelFile(data, { columns, sheet: `${month.y}-${pad(month.m)}` }).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return { count: rows.length, fileName }
}
