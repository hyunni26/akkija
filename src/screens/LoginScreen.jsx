import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { PrimaryButton } from '../components/Field'
import { signIn } from '../lib/api'

export default function LoginScreen() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!password) return setError('비밀번호를 입력해 주세요.')
    setLoading(true)
    setError('')
    try {
      await signIn(password)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="pt-safe flex min-h-full flex-col items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-[360px]">
        <div className="mb-10 text-center">
          <img src="/icons/icon-192.png" alt="" className="mx-auto h-16 w-16 rounded-2xl" />
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-brand">akkija</h1>
          <p className="mt-1 text-sm text-sub">오늘도 아끼자</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 focus-within:border-brand">
          <Lock size={18} className="shrink-0 text-mute" />
          <input
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            placeholder="비밀번호"
            value={password}
            onChange={(e) => { setError(''); setPassword(e.target.value) }}
            className="h-12 w-full bg-transparent outline-none placeholder:text-mute"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} className="p-1 text-mute">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
        {error && <p className="mt-3 text-sm font-medium text-expense">{error}</p>}
        <PrimaryButton type="submit" loading={loading} className="mt-4">들어가기</PrimaryButton>
      </form>
    </div>
  )
}
