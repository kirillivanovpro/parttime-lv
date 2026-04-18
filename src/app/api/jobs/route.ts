import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const city = searchParams.get('city')?.trim() || null
  const category = searchParams.get('category') || null
  const schedule = searchParams.get('schedule') || null
  const salary_min = searchParams.get('salary_min') ? Number(searchParams.get('salary_min')) : null
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = supabase
    .from('job_postings')
    .select(
      `id, title, description, category, city, salary_min, salary_max, schedule,
       hours_per_week, status, views, created_at,
       employer_profiles!inner(id, company_name, logo_url, city)`,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (city) query = query.ilike('city', `%${city}%`)
  if (category) query = query.eq('category', category)
  if (schedule) query = query.eq('schedule', schedule)
  if (salary_min) query = query.gte('salary_min', salary_min)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    jobs: data,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  })
}
