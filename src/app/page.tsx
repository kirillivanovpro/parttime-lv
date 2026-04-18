import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { JobPosting } from '@/types'
import { JOB_CATEGORY_LABELS, JOB_SCHEDULE_LABELS } from '@/lib/jobs'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, city, salary_min, salary_max, category, schedule, created_at, employer_profiles!inner(company_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8BC34A]/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Part&#8209;time работа<br className="hidden sm:block" /> в Латвии
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Находи гибкую занятость или размести вакансию — быстро и без лишних шагов.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/jobs"
              className="bg-[#8BC34A] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#9DD45B] transition-colors text-lg"
            >
              Найти работу
            </Link>
            <Link
              href="/register"
              className="border border-[#2a2a2a] text-white font-semibold px-8 py-3 rounded-xl hover:border-[#8BC34A]/60 transition-colors text-lg"
            >
              Разместить вакансию
            </Link>
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Свежие вакансии</h2>
          <Link href="/jobs" className="text-[#8BC34A] text-sm hover:underline">
            Все вакансии →
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p>Пока нет активных вакансий</p>
            <Link href="/register" className="mt-4 inline-block text-[#8BC34A] hover:underline text-sm">
              Разместить первую вакансию →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(jobs as unknown as (JobPosting & { employer_profiles: { company_name: string } })[]).map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
              >
                <p className="text-xs text-gray-500 mb-1">{job.employer_profiles.company_name}</p>
                <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors leading-snug mb-3">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs text-gray-500 bg-[#111] px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                    📍 {job.city}
                  </span>
                  {job.category && (
                    <span className="text-xs text-gray-500 bg-[#111] px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                      {JOB_CATEGORY_LABELS[job.category]}
                    </span>
                  )}
                  {job.schedule && (
                    <span className="text-xs text-gray-500 bg-[#111] px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                      🕐 {JOB_SCHEDULE_LABELS[job.schedule]}
                    </span>
                  )}
                </div>
                {(job.salary_min || job.salary_max) && (
                  <p className="text-[#8BC34A] font-bold text-sm">
                    {job.salary_min && job.salary_max
                      ? `${job.salary_min}–${job.salary_max} €`
                      : job.salary_min
                      ? `от ${job.salary_min} €`
                      : `до ${job.salary_max} €`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
