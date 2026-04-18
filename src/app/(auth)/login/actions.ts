'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Введите пароль'),
})

export type LoginState = {
  error?: {
    _form?: string
    email?: string[]
    password?: string[]
  }
} | null

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: { _form: 'Неверный email или пароль' } }
  }

  redirect('/')
}

export async function googleOAuthAction(): Promise<void> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl}/auth/confirm` },
  })

  if (error || !data.url) redirect(`/login?error=oauth_failed`)
  redirect(data.url)
}

export type ResendState = { sent?: boolean; error?: string } | null

export async function resendConfirmationAction(
  _prevState: ResendState,
  formData: FormData
): Promise<ResendState> {
  const email = formData.get('email') as string
  if (!email) return { error: 'Введите email' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/auth/confirm`,
    },
  })

  if (error) return { error: error.message }
  return { sent: true }
}
