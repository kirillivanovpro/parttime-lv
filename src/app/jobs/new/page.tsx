import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobForm from './JobForm'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/jobs')

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) redirect('/onboarding')

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Новая вакансия</h1>
          <p className="text-gray-400 text-sm mt-1">
            Заполните информацию о вакансии. После создания потребуется оплата €10.
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <JobForm />
        </div>
      </div>
    </div>
  )
}
