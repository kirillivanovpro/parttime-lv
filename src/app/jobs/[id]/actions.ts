'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type ApplicationFormState = {
  error?: {
    _form?: string
    message?: string
  }
} | null

const applySchema = z.object({
  job_id: z.string().uuid(),
  message: z.string().max(1000, 'Сообщение не может быть длиннее 1000 символов').optional(),
})

export async function applyToJobAction(
  prevState: ApplicationFormState | null,
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validate input
  const rawData = {
    job_id: formData.get('job_id'),
    message: formData.get('message'),
  }

  const validated = applySchema.safeParse(rawData)
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors
    return {
      error: {
        _form: 'Неверные данные формы',
        message: errors.message?.[0],
      },
    }
  }

  const { job_id, message } = validated.data

  // Get seeker profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'seeker') {
    return { error: { _form: 'Только соискатели могут откликаться на вакансии' } }
  }

  const { data: seekerProfile } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!seekerProfile) {
    redirect('/onboarding')
  }

  // Check job exists and is active
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, status')
    .eq('id', job_id)
    .single()

  if (!job || job.status !== 'active') {
    return { error: { _form: 'Вакансия недоступна' } }
  }

  // Check for duplicate application
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', job_id)
    .eq('seeker_id', seekerProfile.id)
    .maybeSingle()

  if (existingApplication) {
    redirect(`/jobs/${job_id}?applied=1`)
  }

  // Create application
  const { error } = await supabase
    .from('applications')
    .insert({
      job_id,
      seeker_id: seekerProfile.id,
      message: message || null,
      status: 'new',
    })

  if (error) {
    return { error: { _form: 'Не удалось отправить отклик. Попробуйте позже.' } }
  }

  redirect(`/jobs/${job_id}?applied=1`)
}
