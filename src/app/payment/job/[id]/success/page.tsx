import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string }>
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  const { id } = await params
  const { session_id } = await searchParams

  if (!session_id) redirect(`/jobs/${id}`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch job to show title (webhook may have already activated it)
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid')
    .eq('id', id)
    .single()

  if (!job) redirect('/dashboard/jobs')

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 space-y-5">
          <div className="text-5xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Оплата прошла!</h1>
            <p className="text-gray-400 text-sm mt-2">
              Ваша вакансия <strong className="text-white">&quot;{job.title}&quot;</strong> активируется в течение нескольких секунд.
            </p>
          </div>

          {job.status === 'active' ? (
            <div className="bg-[#8BC34A]/10 border border-[#8BC34A]/20 rounded-xl px-4 py-3">
              <p className="text-[#8BC34A] text-sm font-medium">Вакансия уже активна 🎉</p>
            </div>
          ) : (
            <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl px-4 py-3">
              <p className="text-yellow-400 text-sm">Активация обычно занимает несколько секунд после получения оплаты.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`/jobs/${id}`}
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
            >
              Просмотреть вакансию
            </Link>
            <Link
              href="/dashboard/jobs"
              className="w-full border border-[#2a2a2a] hover:border-[#8BC34A]/40 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
            >
              Управление вакансиями
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
