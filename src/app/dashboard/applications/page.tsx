import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check role is seeker
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'seeker') {
    redirect('/dashboard')
  }

  // Get seeker profile
  const { data: seekerProfile } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!seekerProfile) {
    redirect('/onboarding')
  }

  // Fetch applications with job and employer data
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      job_postings!inner (
        id,
        title,
        city,
        employer_profiles!inner (
          company_name,
          logo_url
        )
      )
    `)
    .eq('seeker_id', seekerProfile.id)
    .order('created_at', { ascending: false })

  const statusConfig = {
    new: { label: 'Новый', className: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
    viewed: { label: 'Просмотрен', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    invited: { label: 'Приглашён', className: 'text-[#8BC34A] bg-[#8BC34A]/10 border-[#8BC34A]/20' },
    rejected: { label: 'Отклонён', className: 'text-red-400 bg-red-400/10 border-red-400/20' },
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Мои отклики</h1>
          <p className="text-gray-400 text-sm mt-1">
            История откликов на вакансии
          </p>
        </div>

        {/* Applications list */}
        {!applications || applications.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-white font-semibold mb-2">Вы ещё не откликались на вакансии</h2>
            <p className="text-gray-400 text-sm mb-4">
              Начните поиск подходящей работы прямо сейчас
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-[#8BC34A] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#9DD45B] transition-colors text-sm"
            >
              Найти вакансии
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((application) => {
              const job = application.job_postings as any
              const employer = job.employer_profiles
              const status = statusConfig[application.status as keyof typeof statusConfig]

              return (
                <Link
                  key={application.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Company logo */}
                    {employer.logo_url ? (
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-[#8BC34A] transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-0.5">{employer.company_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">📍 {job.city}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(application.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
