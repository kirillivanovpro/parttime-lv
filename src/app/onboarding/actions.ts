'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ──────────────────────────────────────────────
// Seeker profile
// ──────────────────────────────────────────────

const seekerSchema = z.object({
  bio: z.string().max(1000, 'Максимум 1000 символов').optional(),
  skills: z.string().optional(),
  experience_years: z.coerce.number().min(0).max(50).default(0),
  desired_salary: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(1, 'Укажите положительное число').optional()
  ),
  city: z.string().max(100).optional(),
  schedule: z.enum(['flexible', 'mornings', 'evenings', 'weekends']).optional(),
  is_visible: z.string().optional(), // 'on' = checked, undefined = unchecked
})

export type SeekerProfileState = {
  error?: {
    _form?: string
    bio?: string[]
    skills?: string[]
    experience_years?: string[]
    desired_salary?: string[]
    city?: string[]
    schedule?: string[]
  }
} | null

export async function saveSeekerProfileAction(
  _prevState: SeekerProfileState,
  formData: FormData
): Promise<SeekerProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: 'Не авторизован' } }

  const parsed = seekerSchema.safeParse({
    bio: formData.get('bio'),
    skills: formData.get('skills'),
    experience_years: formData.get('experience_years'),
    desired_salary: formData.get('desired_salary'),
    city: formData.get('city'),
    schedule: formData.get('schedule') || undefined,
    is_visible: formData.get('is_visible'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { skills: skillsRaw, is_visible: visibleRaw, ...rest } = parsed.data
  const skills = skillsRaw
    ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const is_visible = visibleRaw === 'on'

  // CV upload
  let cv_url: string | undefined
  const cvFile = formData.get('cv') as File | null
  if (cvFile && cvFile.size > 0) {
    if (cvFile.size > 5 * 1024 * 1024) {
      return { error: { _form: 'CV не должно превышать 5MB' } }
    }
    if (cvFile.type !== 'application/pdf') {
      return { error: { _form: 'CV должно быть в формате PDF' } }
    }
    const path = `${user.id}/cv.pdf`
    const { error: upErr } = await supabase.storage
      .from('cvs')
      .upload(path, cvFile, { upsert: true, contentType: 'application/pdf' })
    if (upErr) return { error: { _form: `Ошибка загрузки CV: ${upErr.message}` } }
    // Store path (not public URL) — signed URL generated on demand in server components
    cv_url = path
  }

  const { error } = await supabase
    .from('seeker_profiles')
    .upsert(
      {
        user_id: user.id,
        bio: rest.bio ?? null,
        skills,
        experience_years: rest.experience_years,
        desired_salary: rest.desired_salary ?? null,  // explicit null clears the field
        city: rest.city ?? null,
        schedule: rest.schedule ?? null,
        is_visible,
        ...(cv_url ? { cv_url } : {}),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: { _form: error.message } }

  redirect('/dashboard')
}

// ──────────────────────────────────────────────
// Employer profile
// ──────────────────────────────────────────────

const employerSchema = z.object({
  company_name: z.string().min(2, 'Введите название (минимум 2 символа)').max(200),
  company_description: z.string().max(2000, 'Максимум 2000 символов').optional(),
  website: z
    .string()
    .url('Неверный формат URL (нужен https://...)')
    .optional()
    .or(z.literal('')),
  city: z.string().max(100).optional(),
})

export type EmployerProfileState = {
  error?: {
    _form?: string
    company_name?: string[]
    company_description?: string[]
    website?: string[]
    city?: string[]
  }
} | null

export async function saveEmployerProfileAction(
  _prevState: EmployerProfileState,
  formData: FormData
): Promise<EmployerProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: 'Не авторизован' } }

  const parsed = employerSchema.safeParse({
    company_name: formData.get('company_name'),
    company_description: formData.get('company_description'),
    website: formData.get('website') || '',
    city: formData.get('city'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Logo upload
  let logo_url: string | undefined
  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: { _form: 'Логотип не должен превышать 2MB' } }
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(logoFile.type)) {
      return { error: { _form: 'Логотип должен быть JPG, PNG или WebP' } }
    }
    const ext = logoFile.type === 'image/png' ? 'png' : logoFile.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${user.id}/logo.${ext}`
    const { error: upErr } = await supabase.storage
      .from('logos')
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (upErr) return { error: { _form: `Ошибка загрузки логотипа: ${upErr.message}` } }

    // Logos bucket is public — getPublicUrl works correctly
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    logo_url = urlData.publicUrl
  }

  const { error } = await supabase
    .from('employer_profiles')
    .upsert(
      {
        user_id: user.id,
        ...parsed.data,
        website: parsed.data.website || null,
        ...(logo_url ? { logo_url } : {}),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: { _form: error.message } }

  redirect('/dashboard')
}
