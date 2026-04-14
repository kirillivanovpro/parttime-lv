import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusButtons from './StatusButtons'

interface Props {
  params: Promise<{ id: string }>
}

export default async function JobApplicationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify employer owns this job
  const { data: job } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      employer_profiles!inner (
        id,
        user_id
      )
    `)
    .eq('id', id)
    .single()

  if (!job) notFound()

  const employerUserId = (job.employer_profiles as any).user_id
  if (employerUserId !== user.id) notFound()

  // Fetch applications with seeker data
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      message,
      created_at,
      seeker_profiles!inner (
        id,
        user_id,
        bio,
        experience_years,
        city,
        skills,
        cv_url,
        profiles!inner (
          full_name
        )
      )
    `)
    .eq('job_id', id)
    .order('created_at', { ascending: false })

  const statusConfig = {
    new: { label: 'Новый', className: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
    viewed: { label: 'Просмотрен', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    invited: { label: 'Приглашён', className: 'text-[#8BC34A] bg-[#8BC34A]/10 border-[#8BC34A]/20' },
    rejected: { label: 'Отклонён', className: 'text-red-400 bg-red-400/10 border-red-400/20' },
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/dashboard/jobs"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
        >
          ← Мои вакансии
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Отклики на вакансию</h1>
          <p className="text-gray-400 text-sm mt-1">{job.title}</p>
        </div>

        {/* Applications list */}
        {!applications || applications.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-white font-semibold mb-2">Пока нет откликов</h2>
            <p className="text-gray-400 text-sm">
              Когда соискатели откликнутся на эту вакансию, они появятся здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const seeker = application.seeker_profiles as any
              const profile = seeker.profiles
              const status = statusConfig[application.status as keyof typeof statusConfig]

              return (
                <div
                  key={application.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/profile/${seeker.user_id}`}
                        className="text-white font-semibold hover:text-[#8BC34A] transition-colors"
                      >
                        {profile.full_name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {seeker.city && (
                          <span className="text-xs text-gray-500">📍 {seeker.city}</span>
                        )}
                        {seeker.experience_years !== null && (
                          <span className="text-xs text-gray-500">
                            💼 {seeker.experience_years} {seeker.experience_years === 1 ? 'год' : seeker.experience_years < 5 ? 'года' : 'лет'} опыта
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${status.className} whitespace-nowrap`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Bio */}
                  {seeker.bio && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {seeker.bio.length > 100
                          ? `${seeker.bio.substring(0, 100)}...`
                          : seeker.bio}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {seeker.skills && seeker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {seeker.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          className="text-xs bg-[#111] text-gray-400 px-2 py-1 rounded-full border border-[#2a2a2a]"
                        >
                          {skill}
                        </span>
                      ))}
                      {seeker.skills.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{seeker.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  {application.message && (
                    <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Сопроводительное письмо
                      </p>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {application.message}
                      </p>
                    </div>
                  )}

                  {/* CV link */}
                  {seeker.cv_url && (
                    <a
                      href={seeker.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8BC34A] text-sm hover:underline inline-flex items-center gap-1 mb-4"
                    >
                      📄 Скачать резюме
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                    <span className="text-xs text-gray-500">
                      {new Date(application.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <StatusButtons
                      applicationId={application.id}
                      currentStatus={application.status}
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
