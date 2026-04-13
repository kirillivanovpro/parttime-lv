import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

async function applyPendingOAuthRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const cookieStore = await cookies()
  const pendingRole = cookieStore.get('oauth_pending_role')?.value
  if (!pendingRole) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ role: pendingRole })
    .eq('id', user.id)

  cookieStore.delete('oauth_pending_role')
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'email' | 'invite' | null

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error) {
      const next = type === 'recovery' ? '/auth/update-password' : '/onboarding'
      return NextResponse.redirect(`${origin}${next}`)
    }

    const msg = error.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid')) {
      return NextResponse.redirect(`${origin}/register?error=expired_token`)
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Apply role selected before OAuth redirect (if any)
      await applyPendingOAuthRole(supabase)
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
