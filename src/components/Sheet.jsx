import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="anim-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="anim-sheet relative flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-surface">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="-mr-2 rounded-full p-2 text-sub active:bg-canvas">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 pt-3"><div className="pb-3">{footer}</div></div>}
      </div>
    </div>
  )
}
