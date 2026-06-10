import { createClient } from '@supabase/supabase-js'

// Trim whitespace and strip any non-printable / non-ASCII characters that would
// cause "String contains non ISO-8859-1 code point" when used in fetch headers.
const cleanEnv = (v: string | undefined): string =>
  (v ?? '').trim().replace(/[^\x20-\x7E]/g, '')

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
