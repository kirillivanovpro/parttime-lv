import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isSeeker = profile?.role !== 'employer'
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
      <div className="w-full max-w-lg text-center">
        <div className="text-6xl mb-6">{isSeeker ? '🔍' : '💼'}</div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Добро пожаловать{firstName ? `, ${firstName}` : ''}!
        </h1>

        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          {isSeeker
            ? 'Ваш аккаунт подтверждён. Начните искать part-time работу в Латвии.'
            : 'Ваш аккаунт подтверждён. Разместите первую вакансию и найдите сотрудника.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={isSeeker ? '/jobs' : '/jobs/create'}
            className="bg-[#8BC34A] text-black font-bold py-3 px-8 rounded-xl hover:bg-[#9DD45B] transition-colors"
          >
            {isSeeker ? 'Смотреть вакансии' : 'Разместить вакансию'}
          </Link>
          <Link
            href="/"
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium py-3 px-8 rounded-xl hover:border-[#3a3a3a] transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
