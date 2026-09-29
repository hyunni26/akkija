import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, monthLabel } from '../lib/date'

export default function MonthNav({ month, onChange }) {
  return (
    <div className="flex items-center gap-1 text-[15px] font-medium text-ink">
      <button type="button" aria-label="이전 달" onClick={() => onChange(addMonths(month, -1))} className="rounded-full p-1.5 text-sub active:bg-brand-soft">
        <ChevronLeft size={18} />
      </button>
      <span className="num min-w-[88px] text-center">{monthLabel(month)}</span>
      <button type="button" aria-label="다음 달" onClick={() => onChange(addMonths(month, 1))} className="rounded-full p-1.5 text-sub active:bg-brand-soft">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
