import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { JobPosting } from '@/types'
import { JOB_CATEGORY_LABELS, JOB_SCHEDULE_LABELS } from '@/lib/jobs'
import ViewTracker from './ViewTracker'
import ContactBlock from './ContactBlock'

interface Props {
  params: Promise<{ id: string }>
}

const PRICE_CONTACT = Number(process.env.PRICE_CONTACT_UNLOCK ?? '30')

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('job_postings')
    .select(`*, employer_profiles!inner(id, company_name, logo_url, city, website, company_description, user_id)`)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const job = data as JobPosting & {
    employer_profiles: {
      id: string
      company_name: string
      logo_url: string | null
      city: string | null
      website: string | null
      company_description: string | null
      user_id: string
    }
  }

  const employerUserId = job.employer_profiles.user_id
  if (job.status !== 'active' && user?.id !== employerUserId) notFound()

  const isOwner = user?.id === employerUserId

  // Determine seeker contact unlock status server-side
  let isSeeker = false
  let contactEmail: string | null = null
  let contactLocked = true

  if (user && !isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    isSeeker = profile?.role === 'seeker'

    if (isSeeker) {
      const { data: seekerProfile } = await supabase
        .from('seeker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (seekerProfile) {
        const { data: unlock } = await supabase
          .from('contact_unlocks')
          .select('id')
          .eq('seeker_id', seekerProfile.id)
          .eq('job_id', id)
          .maybeSingle()

        if (unlock) {
          contactLocked = false
          // Fetch employer email via server-side service role fetch
          const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
          if (serviceKey) {
            const { createClient: createServiceClient } = await import('@supabase/supabase-js')
            const adminClient = createServiceClient(serviceUrl, serviceKey)
            const { data: empUser } = await adminClient.auth.admin.getUserById(employerUserId)
            contactEmail = empUser?.user?.email ?? null
          }
        }
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <ViewTracker jobId={id} />

      <div className="max-w-3xl mx-auto">
        <Link
          href="/jobs"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
        >
          ← Все вакансии
        </Link>

        {isOwner && job.status !== 'active' && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 mb-4 text-yellow-400 text-sm">
            Статус вакансии:{' '}
            <strong>
              {job.status === 'draft'
                ? 'Черновик'
                : job.status === 'paused'
                ? 'Приостановлена'
                : 'Закрыта'}
            </strong>
            {job.status === 'draft' && ' — оплатите публикацию, чтобы активировать'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title card */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
              <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
              <p className="text-gray-400 text-sm">{job.employer_profiles.company_name}</p>

              <div className="flex flex-wrap gap-2 mt-4">
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

              {(job.salary_min || job.salary_max) && (
                <p className="mt-4 text-[#8BC34A] text-xl font-bold">
                  {job.salary_min && job.salary_max
                    ? `${job.salary_min}–${job.salary_max} €`
                    : job.salary_min
                    ? `от ${job.salary_min} €`
                    : `до ${job.salary_max} €`}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Описание вакансии</h2>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Owner controls */}
            {isOwner && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Управление</p>
                <div className="flex gap-3 flex-wrap">
                  {job.status === 'draft' && (
                    <Link
                      href={`/payment/job/${job.id}`}
                      className="bg-[#8BC34A] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
                    >
                      Оплатить публикацию
                    </Link>
                  )}
                  <Link
                    href="/dashboard/jobs"
                    className="border border-[#2a2a2a] hover:border-[#8BC34A]/40 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    Управление вакансиями
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Company card */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Компания</h2>
              <Link href={`/company/${employerUserId}`} className="flex items-center gap-3 group">
                {job.employer_profiles.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.employer_profiles.logo_url}
                    alt={job.employer_profiles.company_name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#2a2a2a]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#8BC34A]/10 flex items-center justify-center text-xl border border-[#2a2a2a]">
                    🏢
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-[#8BC34A] transition-colors">
                    {job.employer_profiles.company_name}
                  </p>
                  {job.employer_profiles.city && (
                    <p className="text-gray-500 text-xs">📍 {job.employer_profiles.city}</p>
                  )}
                </div>
              </Link>
              {job.employer_profiles.company_description && (
                <p className="text-gray-400 text-xs mt-3 leading-relaxed line-clamp-4">
                  {job.employer_profiles.company_description}
                </p>
              )}
              {job.employer_profiles.website && (
                <a
                  href={job.employer_profiles.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8BC34A] text-xs hover:underline mt-2 inline-block"
                >
                  🌐 {job.employer_profiles.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Contact block — for seekers and guests */}
            {!isOwner && job.status === 'active' && (
              <ContactBlock
                jobId={id}
                initialEmail={contactEmail}
                isLocked={contactLocked}
                price={PRICE_CONTACT}
                isLoggedIn={!!user}
                isSeeker={isSeeker}
              />
            )}

            {/* Stats */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Статистика</p>
              <p className="text-gray-400 text-sm">👁 {job.views} просмотров</p>
              <p className="text-gray-500 text-xs mt-1">
                Опубликовано: {new Date(job.created_at).toLocaleDateString('ru-RU')}
              </p>
              {job.expires_at && (
                <p className="text-gray-500 text-xs mt-1">
                  Действует до: {new Date(job.expires_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
