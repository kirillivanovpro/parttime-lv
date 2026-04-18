import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeekerForm from './SeekerForm'
import EmployerForm from './EmployerForm'

export default async function OnboardingPage() {
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
  const firstName = full_name?.split(' ')[0]

  // Already completed onboarding → go to dashboard
  if (role === 'seeker') {
    const { data: existing } = await supabase
      .from('seeker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) redirect('/dashboard')
  } else if (role === 'employer') {
    const { data: existing } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) redirect('/dashboard')
  }

  const isSeeker = role === 'seeker'

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs text-[#8BC34A] bg-[#8BC34A]/10 px-3 py-1 rounded-full mb-4">
            {isSeeker ? '🔍 Соискатель' : '💼 Работодатель'}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isSeeker ? 'Заполните резюме' : 'Заполните профиль компании'}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {firstName ? `${firstName}, р` : 'Р'}асскажите{' '}
            {isSeeker
              ? 'работодателям о своём опыте и предпочтениях'
              : 'соискателям о вашей компании и условиях работы'}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          {isSeeker ? <SeekerForm /> : <EmployerForm />}
        </div>
      </div>
    </div>
  )
}
