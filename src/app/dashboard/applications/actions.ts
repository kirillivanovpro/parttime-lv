'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const statusSchema = z.enum(['viewed', 'invited', 'rejected'])

export async function updateApplicationStatusAction(
  applicationId: string,
  status: 'viewed' | 'invited' | 'rejected'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Необходимо войти в систему' }
  }

  // Validate status
  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedStatus.success) {
    return { error: 'Недопустимый статус' }
  }

  // Validate applicationId is UUID
  const uuidSchema = z.string().uuid()
  const parsedId = uuidSchema.safeParse(applicationId)
  if (!parsedId.success) {
    return { error: 'Недопустимый идентификатор отклика' }
  }

  // Verify employer owns the job for this application
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select(`
      id,
      job_postings!inner (
        id,
        employer_profiles!inner (
          id,
          user_id
        )
      )
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    return { error: 'Отклик не найден' }
  }

  // Check ownership
  const jobPosting = application.job_postings as unknown as {
    id: string
    employer_profiles: { id: string; user_id: string }
  }

  if (jobPosting.employer_profiles.user_id !== user.id) {
    return { error: 'Нет доступа к этому отклику' }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: parsedStatus.data })
    .eq('id', applicationId)

  if (updateError) {
    return { error: 'Не удалось обновить статус' }
  }

  return {}
}
