import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const LOGIN_EMAIL = import.meta.env.VITE_LOGIN_EMAIL

export const isConfigured = Boolean(url && key && LOGIN_EMAIL)

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
