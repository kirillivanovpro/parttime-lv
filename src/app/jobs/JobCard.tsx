import Link from 'next/link'
import type { JobPosting } from '@/types'
import { JOB_CATEGORY_LABELS, JOB_SCHEDULE_LABELS } from '@/lib/jobs'

interface Props {
  job: JobPosting
}

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
}

export default function JobCard({ job }: Props) {
  const employer = job.employer_profiles
  const fresh = isNew(job.created_at)

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Company logo */}
        <div className="flex-shrink-0">
          {employer?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={employer.logo_url}
              alt={employer.company_name}
              className="w-12 h-12 rounded-xl object-cover border border-[#2a2a2a]"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#8BC34A]/10 flex items-center justify-center text-xl border border-[#2a2a2a]">
              🏢
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors truncate">
                {job.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">{employer?.company_name}</p>
            </div>
            {fresh && (
              <span className="flex-shrink-0 text-xs bg-[#8BC34A]/15 text-[#8BC34A] px-2 py-0.5 rounded-full border border-[#8BC34A]/20">
                Новая
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-400 bg-[#111] px-2.5 py-1 rounded-full border border-[#2a2a2a]">
              📍 {job.city}
            </span>
            {job.category && (
              <span className="text-xs text-gray-400 bg-[#111] px-2.5 py-1 rounded-full border border-[#2a2a2a]">
                {JOB_CATEGORY_LABELS[job.category]}
              </span>
            )}
            {job.schedule && (
              <span className="text-xs text-gray-400 bg-[#111] px-2.5 py-1 rounded-full border border-[#2a2a2a]">
                🕐 {JOB_SCHEDULE_LABELS[job.schedule]}
              </span>
            )}
            {job.hours_per_week && (
              <span className="text-xs text-gray-400 bg-[#111] px-2.5 py-1 rounded-full border border-[#2a2a2a]">
                ⏱ {job.hours_per_week} ч/нед
              </span>
            )}
          </div>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <p className="mt-2 text-[#8BC34A] text-sm font-medium">
              {job.salary_min && job.salary_max
                ? `${job.salary_min}–${job.salary_max} €`
                : job.salary_min
                ? `от ${job.salary_min} €`
                : `до ${job.salary_max} €`}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
