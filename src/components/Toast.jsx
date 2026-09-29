import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)
  const show = useCallback((text, tone = 'default') => {
    clearTimeout(timer.current)
    setMsg({ text, tone, key: Date.now() })
    timer.current = setTimeout(() => setMsg(null), 2400)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-6">
          <div
            key={msg.key}
            className={`anim-fade rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              msg.tone === 'error' ? 'bg-expense' : 'bg-ink/90'
            }`}
          >
            {msg.text}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
