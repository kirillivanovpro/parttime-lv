import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { JobPosting } from '@/types'
import { JOB_CATEGORY_LABELS } from '@/lib/jobs'
import JobActions from './JobActions'

const statusLabel: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  active: { label: 'Активна', color: 'text-[#8BC34A] bg-[#8BC34A]/10 border-[#8BC34A]/20' },
  paused: { label: 'Пауза', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  closed: { label: 'Закрыта', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

export default async function DashboardJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) redirect('/onboarding')

  const { data } = await supabase
    .from('job_postings')
    .select('*')
    .eq('employer_id', employer.id)
    .order('created_at', { ascending: false })

  const jobs = (data ?? []) as JobPosting[]

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Мои вакансии</h1>
            <p className="text-gray-400 text-sm mt-1">Управление опубликованными вакансиями</p>
          </div>
          <Link
            href="/jobs/new"
            className="bg-[#8BC34A] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
          >
            + Новая вакансия
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-medium mb-1">Вакансий пока нет</p>
            <p className="text-gray-500 text-sm mb-4">Разместите первую вакансию, чтобы найти сотрудников</p>
            <Link
              href="/jobs/new"
              className="inline-block bg-[#8BC34A] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
            >
              Создать вакансию
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const st = statusLabel[job.status]
              return (
                <div
                  key={job.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>📍 {job.city}</span>
                        {job.category && <span>{JOB_CATEGORY_LABELS[job.category]}</span>}
                        {(job.salary_min || job.salary_max) && (
                          <span className="text-[#8BC34A]">
                            {job.salary_min && job.salary_max
                              ? `${job.salary_min}–${job.salary_max} €`
                              : job.salary_min
                              ? `от ${job.salary_min} €`
                              : `до ${job.salary_max} €`}
                          </span>
                        )}
                        <span>👁 {job.views}</span>
                        {job.expires_at && (
                          <span>
                            до {new Date(job.expires_at).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>

                    <JobActions
                      jobId={job.id}
                      status={job.status}
                      isPaid={job.is_paid}
                      expiresAt={job.expires_at}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
