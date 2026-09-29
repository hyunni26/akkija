import { Repeat } from 'lucide-react'
import CategoryIcon from './CategoryIcon'
import { signedWon } from '../lib/format'

export default function TxRow({ tx, catMap, cardMap, onClick }) {
  const cat = catMap[tx.category_id]
  const pay = tx.type === 'income' ? null : tx.payment_method === 'card' ? (cardMap[tx.card_id]?.name ?? '카드') : '현금'
  const sub = [tx.memo, pay].filter(Boolean).join(' · ')
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left active:opacity-70">
      <CategoryIcon icon={cat?.icon} color={cat?.color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[15px] font-medium">
          <span className="truncate">{cat?.name ?? '카테고리 없음'}</span>
          {tx.recurring_id && <Repeat size={13} className="shrink-0 text-mute" aria-label="고정지출" />}
        </div>
        {sub && <div className="truncate text-[13px] text-sub">{sub}</div>}
      </div>
      <div className={`num shrink-0 text-[15px] font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
        {signedWon(tx.type, tx.amount)}
      </div>
    </button>
  )
}
