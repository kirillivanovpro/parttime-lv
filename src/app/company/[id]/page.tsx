import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { EmployerProfile, JobPosting } from '@/types'
import { JOB_SCHEDULE_LABELS } from '@/lib/jobs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CompanyProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', id)
    .maybeSingle() as { data: EmployerProfile | null }

  if (!employer) notFound()

  const isOwner = user?.id === id

  const { data: jobsData } = await supabase
    .from('job_postings')
    .select('id, title, city, salary_min, salary_max, schedule, hours_per_week, created_at, status, views, is_paid, expires_at, updated_at, employer_id, category')
    .eq('employer_id', employer.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  const jobs = (jobsData ?? []) as JobPosting[]

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {employer.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employer.logo_url}
                alt="Логотип компании"
                className="w-20 h-20 rounded-xl object-cover border border-[#2a2a2a] flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#8BC34A]/10 flex items-center justify-center text-3xl flex-shrink-0 border border-[#2a2a2a]">
                🏢
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-white">{employer.company_name}</h1>
                  <span className="inline-flex items-center gap-1 text-xs text-[#8BC34A] bg-[#8BC34A]/10 px-2.5 py-0.5 rounded-full mt-1">
                    💼 Работодатель
                  </span>
                </div>
                {isOwner && (
                  <Link
                    href="/profile/edit"
                    className="text-sm border border-[#2a2a2a] hover:border-[#8BC34A]/50 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    ✏️ Редактировать
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                {employer.city && (
                  <span className="text-sm text-gray-400">📍 {employer.city}</span>
                )}
                {employer.website && (
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#8BC34A] hover:underline"
                  >
                    🌐 {employer.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {employer.company_description && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-6">
            <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-3">О компании</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{employer.company_description}</p>
          </div>
        )}

        {/* Active job listings */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">Активные вакансии</h2>
            {isOwner && (
              <Link
                href="/jobs/new"
                className="text-sm bg-[#8BC34A] text-black font-medium px-4 py-1.5 rounded-lg hover:bg-[#9DD45B] transition-colors"
              >
                + Разместить
              </Link>
            )}
          </div>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-sm">Активных вакансий нет.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block border border-[#2a2a2a] rounded-xl p-4 hover:border-[#8BC34A]/40 transition-colors group"
                >
                  <h3 className="text-white text-sm font-medium group-hover:text-[#8BC34A] transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500">📍 {job.city}</span>
                    {job.schedule && (
                      <span className="text-xs text-gray-500">🕐 {JOB_SCHEDULE_LABELS[job.schedule]}</span>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <span className="text-xs text-[#8BC34A]">
                        {job.salary_min && job.salary_max
                          ? `${job.salary_min}–${job.salary_max} €`
                          : job.salary_min
                          ? `от ${job.salary_min} €`
                          : `до ${job.salary_max} €`}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
