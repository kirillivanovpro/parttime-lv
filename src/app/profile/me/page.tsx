import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { SeekerProfile, EmployerProfile } from '@/types'

const scheduleLabel: Record<string, string> = {
  flexible: 'Гибкий график',
  mornings: 'Утро (до 12:00)',
  evenings: 'Вечер (после 18:00)',
  weekends: 'Выходные',
}

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const isSeeker = profile.role === 'seeker'

  if (isSeeker) {
    const { data: seeker } = await supabase
      .from('seeker_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as { data: SeekerProfile | null }

    if (!seeker) redirect('/onboarding')

    // CV is in a private bucket — generate a 1-hour signed URL
    let cvSignedUrl: string | null = null
    if (seeker.cv_url) {
      const { data: signed } = await supabase.storage
        .from('cvs')
        .createSignedUrl(seeker.cv_url, 3600)
      cvSignedUrl = signed?.signedUrl ?? null
    }

    return (
      <div className="min-h-[calc(100vh-56px)] px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.full_name || '—'}</h1>
              <span className="inline-flex items-center gap-1 text-xs text-[#8BC34A] bg-[#8BC34A]/10 px-2.5 py-0.5 rounded-full mt-2">
                🔍 Соискатель
              </span>
            </div>
            <Link
              href="/profile/edit"
              className="text-sm border border-[#2a2a2a] hover:border-[#8BC34A]/50 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              ✏️ Редактировать
            </Link>
          </div>

          <div className="space-y-4">
            {seeker.bio && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">О себе</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{seeker.bio}</p>
              </div>
            )}

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Опыт</p>
                <p className="text-white text-sm">
                  {seeker.experience_years === 0
                    ? 'Без опыта'
                    : `${seeker.experience_years} ${seeker.experience_years === 1 ? 'год' : seeker.experience_years < 5 ? 'года' : 'лет'}`}
                </p>
              </div>
              {seeker.desired_salary && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Зарплата</p>
                  <p className="text-white text-sm">{seeker.desired_salary} €</p>
                </div>
              )}
              {seeker.city && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Город</p>
                  <p className="text-white text-sm">{seeker.city}</p>
                </div>
              )}
              {seeker.schedule && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">График</p>
                  <p className="text-white text-sm">{scheduleLabel[seeker.schedule]}</p>
                </div>
              )}
            </div>

            {seeker.skills && seeker.skills.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Навыки</h3>
                <div className="flex flex-wrap gap-2">
                  {seeker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-sm bg-[#8BC34A]/10 text-[#8BC34A] px-3 py-1 rounded-full border border-[#8BC34A]/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Видимость профиля</p>
                <p className="text-sm text-white">
                  {seeker.is_visible ? '👁 Виден в поиске' : '🔒 Скрыт из поиска'}
                </p>
              </div>
              {cvSignedUrl && (
                <a
                  href={cvSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8BC34A] hover:underline"
                >
                  📄 Скачать CV
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Employer
  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() as { data: EmployerProfile | null }

  if (!employer) redirect('/onboarding')

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {employer.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employer.logo_url}
                alt="Логотип"
                className="w-16 h-16 rounded-xl object-cover border border-[#2a2a2a]"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{employer.company_name}</h1>
              <span className="inline-flex items-center gap-1 text-xs text-[#8BC34A] bg-[#8BC34A]/10 px-2.5 py-0.5 rounded-full mt-1">
                💼 Работодатель
              </span>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="text-sm border border-[#2a2a2a] hover:border-[#8BC34A]/50 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            ✏️ Редактировать
          </Link>
        </div>

        <div className="space-y-4">
          {employer.company_description && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">О компании</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{employer.company_description}</p>
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 grid grid-cols-2 gap-4">
            {employer.city && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Город</p>
                <p className="text-white text-sm">{employer.city}</p>
              </div>
            )}
            {employer.website && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Сайт</p>
                <a
                  href={employer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8BC34A] text-sm hover:underline"
                >
                  {employer.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
