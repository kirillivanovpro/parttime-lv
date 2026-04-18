import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ApplyForm from './ApplyForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check user is a seeker
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'seeker') {
    redirect(`/jobs/${id}`)
  }

  // Check seeker profile exists
  const { data: seekerProfile } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!seekerProfile) {
    redirect('/onboarding')
  }

  // Fetch job
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, status')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!job) notFound()

  // Check for existing application
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', id)
    .eq('seeker_id', seekerProfile.id)
    .maybeSingle()

  if (existingApplication) {
    redirect(`/jobs/${id}?applied=1`)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href={`/jobs/${id}`}
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
        >
          ← {job.title}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Отклик на вакансию</h1>
          <p className="text-gray-400 text-sm mt-1">{job.title}</p>
        </div>

        {/* Form card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <ApplyForm jobId={id} jobTitle={job.title} />
        </div>
      </div>
    </div>
  )
}
