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

async function getPostConfirmRedirect(supabase: Awaited<ReturnType<typeof createClient>>, origin: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return `${origin}/onboarding`

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'seeker') {
    const { data: sp } = await supabase
      .from('seeker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (sp) return `${origin}/dashboard`
  } else if (profile?.role === 'employer') {
    const { data: ep } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (ep) return `${origin}/dashboard`
  }

  return `${origin}/onboarding`
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
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      const next = await getPostConfirmRedirect(supabase, origin)
      return NextResponse.redirect(next)
    }

    const msg = error.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid')) {
      return NextResponse.redirect(`${origin}/register?error=expired_token`)
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await applyPendingOAuthRole(supabase)
      const next = await getPostConfirmRedirect(supabase, origin)
      return NextResponse.redirect(next)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
