import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeekerForm from '@/app/onboarding/SeekerForm'
import EmployerForm from '@/app/onboarding/EmployerForm'
import type { SeekerProfile, EmployerProfile } from '@/types'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
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

    return (
      <div className="min-h-[calc(100vh-56px)] px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Редактировать резюме</h1>
          <p className="text-gray-400 text-sm mb-8">Изменения сохраняются немедленно</p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <SeekerForm defaultValues={seeker ?? undefined} />
          </div>
        </div>
      </div>
    )
  }

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() as { data: EmployerProfile | null }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Редактировать профиль компании</h1>
        <p className="text-gray-400 text-sm mb-8">Изменения сохраняются немедленно</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <EmployerForm defaultValues={employer ?? undefined} />
        </div>
      </div>
    </div>
  )
}
