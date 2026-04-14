import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const { role, full_name } = profile
  const isSeeker = role === 'seeker'
  const firstName = full_name?.split(' ')[0]

  // Check if profile is complete
  let profileComplete = false
  if (isSeeker) {
    const { data } = await supabase
      .from('seeker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    profileComplete = !!data
  } else if (role === 'employer') {
    const { data } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    profileComplete = !!data
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Добро пожаловать{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSeeker ? 'Личный кабинет соискателя' : 'Личный кабинет работодателя'}
          </p>
        </div>

        {/* Incomplete profile banner */}
        {!profileComplete && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-yellow-400 font-medium text-sm">Профиль не заполнен</p>
              <p className="text-gray-400 text-sm mt-1">
                {isSeeker
                  ? 'Заполните резюме, чтобы откликаться на вакансии и быть видимым для работодателей.'
                  : 'Заполните профиль компании, чтобы начать публиковать вакансии.'}
              </p>
              <Link
                href="/onboarding"
                className="inline-block mt-3 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Заполнить профиль →
              </Link>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {isSeeker ? (
            <>
              <Link
                href="/jobs"
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
              >
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">
                  Найти работу
                </h3>
                <p className="text-gray-500 text-sm mt-1">Просмотреть доступные вакансии</p>
              </Link>
              <Link
                href="/profile/me"
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
              >
                <div className="text-2xl mb-2">👤</div>
                <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">
                  Мой профиль
                </h3>
                <p className="text-gray-500 text-sm mt-1">Просмотреть и редактировать резюме</p>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/jobs/new"
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
              >
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">
                  Разместить вакансию
                </h3>
                <p className="text-gray-500 text-sm mt-1">Найти сотрудника на part-time</p>
              </Link>
              <Link
                href="/profile/me"
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
              >
                <div className="text-2xl mb-2">🏢</div>
                <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">
                  Профиль компании
                </h3>
                <p className="text-gray-500 text-sm mt-1">Редактировать данные компании</p>
              </Link>
            </>
          )}
        </div>

        {/* Stats / links */}
        <div className="space-y-3">
          {isSeeker ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-2">Мои отклики</h2>
              <p className="text-gray-500 text-sm">Здесь будут отображаться ваши отклики на вакансии.</p>
            </div>
          ) : (
            <Link
              href="/dashboard/jobs"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">Мои вакансии</h2>
                <span className="text-gray-500 text-sm group-hover:text-[#8BC34A] transition-colors">→</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">Просмотр, пауза и управление вакансиями</p>
            </Link>
          )}
          <Link
            href="/dashboard/payments"
            className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8BC34A]/40 transition-colors group"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors">История платежей</h2>
              <span className="text-gray-500 text-sm group-hover:text-[#8BC34A] transition-colors">→</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Все ваши транзакции через Stripe</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
