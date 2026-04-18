import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobCard from './JobCard'
import JobFilters from './JobFilters'
import type { JobPosting } from '@/types'

interface Props {
  searchParams: Promise<{
    city?: string
    category?: string
    schedule?: string
    salary_min?: string
    page?: string
  }>
}

const LIMIT = 20

export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams
  const city = params.city?.trim() || null
  const category = params.category || null
  const schedule = params.schedule || null
  const salary_min = params.salary_min ? Number(params.salary_min) : null
  const page = Math.max(1, Number(params.page || '1'))
  const offset = (page - 1) * LIMIT

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is employer
  let isEmployer = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isEmployer = profile?.role === 'employer'
  }

  let query = supabase
    .from('job_postings')
    .select(
      `id, title, description, category, city, salary_min, salary_max, schedule,
       hours_per_week, status, views, is_paid, expires_at, created_at, updated_at, employer_id,
       employer_profiles!inner(id, company_name, logo_url, city)`,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + LIMIT - 1)

  if (city) query = query.ilike('city', `%${city}%`)
  if (category) query = query.eq('category', category)
  if (schedule) query = query.eq('schedule', schedule)
  if (salary_min) query = query.gte('salary_min', salary_min)

  const { data, count } = await query

  const jobs = (data ?? []) as unknown as JobPosting[]
  const total = count ?? 0
  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Вакансии</h1>
            <p className="text-gray-400 text-sm mt-1">
              {total > 0 ? `Найдено: ${total}` : 'Вакансий пока нет'}
            </p>
          </div>
          {isEmployer && (
            <Link
              href="/jobs/new"
              className="bg-[#8BC34A] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
            >
              + Разместить
            </Link>
          )}
        </div>

        {/* Filters */}
        <Suspense>
          <JobFilters />
        </Suspense>

        {/* Job list */}
        {jobs.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">По вашему запросу вакансий не найдено.</p>
            <Link href="/jobs" className="text-[#8BC34A] text-sm hover:underline mt-2 inline-block">
              Сбросить фильтры
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
              const sp = new URLSearchParams()
              if (city) sp.set('city', city)
              if (category) sp.set('category', category)
              if (schedule) sp.set('schedule', schedule)
              if (salary_min) sp.set('salary_min', String(salary_min))
              if (p > 1) sp.set('page', String(p))
              return (
                <Link
                  key={p}
                  href={`/jobs${sp.toString() ? `?${sp}` : ''}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm border transition-colors ${
                    p === page
                      ? 'bg-[#8BC34A] text-black border-[#8BC34A] font-bold'
                      : 'bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-[#8BC34A]/40 hover:text-white'
                  }`}
                >
                  {p}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
