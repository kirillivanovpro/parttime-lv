'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8, 'Минимум 8 символов'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Пароли не совпадают',
  path: ['confirm'],
})

export type UpdatePasswordState = {
  error?: { _form?: string; password?: string[]; confirm?: string[] }
} | null

export async function updatePasswordAction(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: 'Сессия истекла. Запросите сброс пароля заново.' } }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: { _form: error.message } }

  redirect('/')
}
