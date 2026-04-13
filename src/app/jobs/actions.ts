'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ──────────────────────────────────────────────
// Create job posting
// ──────────────────────────────────────────────

const jobSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(200, 'Максимум 200 символов'),
  description: z.string().min(20, 'Минимум 20 символов').max(5000, 'Максимум 5000 символов'),
  category: z.enum(['retail', 'hospitality', 'warehouse', 'office', 'other']).optional(),
  city: z.string().min(2, 'Укажите город').max(100),
  salary_min: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(1).optional()
  ),
  salary_max: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(1).optional()
  ),
  schedule: z.enum(['mornings', 'evenings', 'weekends', 'flexible', 'shifts']).optional(),
  hours_per_week: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(40).optional()
  ),
})

export type JobFormState = {
  error?: {
    _form?: string
    title?: string[]
    description?: string[]
    category?: string[]
    city?: string[]
    salary_min?: string[]
    salary_max?: string[]
    schedule?: string[]
    hours_per_week?: string[]
  }
} | null

export async function createJobAction(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: 'Не авторизован' } }

  // Verify employer profile exists
  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) return { error: { _form: 'Сначала заполните профиль компании' } }

  const parsed = jobSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category') || undefined,
    city: formData.get('city'),
    salary_min: formData.get('salary_min'),
    salary_max: formData.get('salary_max'),
    schedule: formData.get('schedule') || undefined,
    hours_per_week: formData.get('hours_per_week'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { salary_min, salary_max } = parsed.data
  if (salary_min && salary_max && salary_max < salary_min) {
    return { error: { _form: 'Максимальная зарплата должна быть не меньше минимальной' } }
  }

  const { data: job, error } = await supabase
    .from('job_postings')
    .insert({
      employer_id: employer.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category ?? null,
      city: parsed.data.city,
      salary_min: parsed.data.salary_min ?? null,
      salary_max: parsed.data.salary_max ?? null,
      schedule: parsed.data.schedule ?? null,
      hours_per_week: parsed.data.hours_per_week ?? null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: { _form: error.message } }

  redirect(`/payment/job/${job.id}`)
}

// ──────────────────────────────────────────────
// Pause job (employer only)
// ──────────────────────────────────────────────

export async function pauseJobAction(jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('job_postings')
    .update({ status: 'paused' })
    .eq('id', jobId)
    .in('status', ['active'])

  if (error) return { error: error.message }
  return {}
}

// ──────────────────────────────────────────────
// Resume job (employer only)
// ──────────────────────────────────────────────

export async function resumeJobAction(jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Only resume if paid and not expired
  const { data: job } = await supabase
    .from('job_postings')
    .select('is_paid, expires_at')
    .eq('id', jobId)
    .single()

  if (!job?.is_paid) return { error: 'Вакансия не оплачена' }
  if (job.expires_at && new Date(job.expires_at) < new Date()) {
    return { error: 'Срок действия вакансии истёк' }
  }

  const { error } = await supabase
    .from('job_postings')
    .update({ status: 'active' })
    .eq('id', jobId)
    .eq('status', 'paused')

  if (error) return { error: error.message }
  return {}
}

// ──────────────────────────────────────────────
// Close job (employer only)
// ──────────────────────────────────────────────

export async function closeJobAction(jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('job_postings')
    .update({ status: 'closed' })
    .eq('id', jobId)
    .in('status', ['active', 'paused', 'draft'])

  if (error) return { error: error.message }
  return {}
}

// ──────────────────────────────────────────────
// Increment view count (no auth required)
// ──────────────────────────────────────────────

export async function incrementViewAction(jobId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_job_views', { job_id: jobId })
}
