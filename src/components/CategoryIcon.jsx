import { ICONS, COLORS } from '../lib/constants'

export default function CategoryIcon({ icon, color, size = 36 }) {
  const Icon = ICONS[icon] ?? ICONS.etc
  const c = COLORS[color] ?? COLORS.gray
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: c.bg, color: c.fg }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  )
}
