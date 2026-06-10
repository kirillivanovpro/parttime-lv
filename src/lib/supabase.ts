import { createClient } from '@supabase/supabase-js'

const cleanEnv = (v: string | undefined): string =>
  (v ?? '').trim().replace(/[^\x20-\x7E]/g, '')

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
