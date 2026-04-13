import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { SeekerProfile } from '@/types'

const scheduleLabel: Record<string, string> = {
  flexible: 'Гибкий график',
  mornings: 'Утро (до 12:00)',
  evenings: 'Вечер (после 18:00)',
  weekends: 'Выходные',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicSeekerProfile({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [seekerResult, profileResult] = await Promise.all([
    supabase.from('seeker_profiles').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', id).maybeSingle(),
  ])

  const seeker = seekerResult.data as SeekerProfile | null
  const profileData = profileResult.data

  // 404 if not found or hidden (unless owner)
  if (!seeker) notFound()
  if (!seeker.is_visible && user?.id !== id) notFound()

  const isOwner = user?.id === id
  const fullName = profileData?.full_name || 'Соискатель'

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{fullName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-[#8BC34A] bg-[#8BC34A]/10 px-2.5 py-0.5 rounded-full">
                🔍 Соискатель
              </span>
              {!seeker.is_visible && isOwner && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded-full">
                  🔒 Скрыт из поиска
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <Link
              href="/profile/edit"
              className="text-sm border border-[#2a2a2a] hover:border-[#8BC34A]/50 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              ✏️ Редактировать
            </Link>
          )}
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
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ожидания</p>
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

          {!isOwner && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-3">
                Хотите связаться с этим кандидатом?
              </p>
              <button
                disabled
                className="bg-[#8BC34A] text-black font-bold px-6 py-2.5 rounded-xl opacity-60 cursor-not-allowed text-sm"
              >
                🔒 Разблокировать контакт — 2€
              </button>
              <p className="text-gray-600 text-xs mt-2">Функция будет доступна в ближайшее время</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
