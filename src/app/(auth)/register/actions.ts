'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  full_name: z.string().min(2, 'Введите имя (минимум 2 символа)'),
  role: z.enum(['seeker', 'employer'], { message: 'Выберите роль' }),
})

export type RegisterState = {
  error?: {
    _form?: string
    email?: string[]
    password?: string[]
    full_name?: string[]
    role?: string[]
  }
  success?: boolean
} | null

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { email, password, full_name, role } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/auth/confirm`,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      return {
        error: {
          _form: 'Пользователь с таким email уже существует. Войдите или сбросьте пароль.',
        },
      }
    }
    return { error: { _form: error.message } }
  }

  return { success: true }
}

export async function googleOAuthAction(formData: FormData): Promise<void> {
  const role = (formData.get('role') as string) ?? 'seeker'
  const supabase = await createClient()

  // Store role in cookie so confirm route can apply it after OAuth
  const cookieStore = await cookies()
  cookieStore.set('oauth_pending_role', role, { httpOnly: true, maxAge: 600, path: '/' })

  const siteUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl}/auth/confirm` },
  })

  if (error || !data.url) redirect(`/login?error=oauth_failed`)
  redirect(data.url)
}
