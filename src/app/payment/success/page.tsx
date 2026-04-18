import Link from 'next/link'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ type?: string; session_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { type, session_id } = await searchParams

  if (!session_id) redirect('/')

  const isJobPosting = type === 'job_posting'
  const isContactUnlock = type === 'contact_unlock'

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 space-y-5">
          <div className="text-5xl">✅</div>

          <div>
            <h1 className="text-2xl font-bold text-white">Оплата прошла!</h1>
            <p className="text-gray-400 text-sm mt-2">
              {isJobPosting && 'Ваша вакансия активируется в течение нескольких секунд.'}
              {isContactUnlock && 'Контактные данные работодателя открыты.'}
              {!isJobPosting && !isContactUnlock && 'Платёж успешно обработан.'}
            </p>
          </div>

          <div className="bg-[#8BC34A]/10 border border-[#8BC34A]/20 rounded-xl px-4 py-3">
            <p className="text-[#8BC34A] text-sm font-medium">
              {isJobPosting && '🎉 Вакансия будет активна 30 дней'}
              {isContactUnlock && '📧 Теперь вы можете связаться с работодателем'}
              {!isJobPosting && !isContactUnlock && '🎉 Готово!'}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {isJobPosting && (
              <Link
                href="/dashboard/jobs"
                className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
              >
                Управление вакансиями
              </Link>
            )}
            {isContactUnlock && (
              <Link
                href="/jobs"
                className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
              >
                Вернуться к вакансиям
              </Link>
            )}
            <Link
              href="/dashboard"
              className="w-full border border-[#2a2a2a] hover:border-[#8BC34A]/40 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
            >
              Личный кабинет
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
