export default function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`flex rounded-xl bg-canvas p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'text-sub'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
