import { parseAmount } from '../lib/format'

export function Label({ children }) {
  return <div className="mb-2 text-[13px] font-medium text-sub">{children}</div>
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-line bg-surface px-3.5 outline-none focus:border-brand ${props.className ?? ''}`}
    />
  )
}

export function AmountInput({ value, onChange, autoFocus }) {
  return (
    <div className="flex h-14 items-center rounded-xl border border-line bg-surface px-4 focus-within:border-brand">
      <input
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder="0"
        value={value ? value.toLocaleString('ko-KR') : ''}
        onChange={(e) => onChange(parseAmount(e.target.value))}
        className="num w-full bg-transparent text-right text-[22px] font-semibold outline-none placeholder:text-mute"
      />
      <span className="ml-2 text-[17px] font-medium text-sub">원</span>
    </div>
  )
}

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`h-12 w-full rounded-xl bg-brand text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50 ${className}`}
    >
      {loading ? '처리 중…' : children}
    </button>
  )
}

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        active ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-surface text-sub'
      }`}
    >
      {children}
    </button>
  )
}
