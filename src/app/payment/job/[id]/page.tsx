import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaymentJobPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify this job belongs to the current employer
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid, employer_id, employer_profiles!inner(user_id)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Type assertion for joined data
  const employerUserId = (job.employer_profiles as unknown as { user_id: string }).user_id
  if (employerUserId !== user.id) notFound()

  // Already paid and active
  if (job.is_paid && job.status === 'active') {
    redirect(`/jobs/${id}`)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Оплата публикации</h1>
          <p className="text-gray-400 text-sm mt-1">Активируйте вакансию на 30 дней</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-5">
          {/* Job summary */}
          <div className="bg-[#111] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Вакансия</p>
            <p className="text-white font-medium">{job.title}</p>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center py-3 border-t border-b border-[#2a2a2a]">
            <div>
              <p className="text-white font-medium">Публикация вакансии</p>
              <p className="text-gray-500 text-sm">Активна 30 дней</p>
            </div>
            <p className="text-[#8BC34A] text-2xl font-bold">€10</p>
          </div>

          {/* Payment placeholder */}
          <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4">
            <p className="text-yellow-400 text-sm font-medium mb-1">Оплата временно недоступна</p>
            <p className="text-gray-400 text-sm">
              Интеграция со Stripe находится в разработке. Вскоре здесь появится форма оплаты картой.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/jobs/${id}`}
              className="flex-1 text-center border border-[#2a2a2a] hover:border-[#8BC34A]/40 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
            >
              Просмотреть вакансию
            </Link>
            <Link
              href="/dashboard/jobs"
              className="flex-1 text-center bg-[#8BC34A] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
            >
              Мои вакансии
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
