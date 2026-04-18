'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const resetSchema = z.object({
  email: z.string().email('Неверный формат email'),
})

export type ResetState = {
  error?: { _form?: string; email?: string[] }
  success?: boolean
} | null

export async function resetPasswordAction(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({ email: formData.get('email') })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm`,
  })

  if (error) return { error: { _form: error.message } }
  return { success: true }
}
