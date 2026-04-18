import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 space-y-5">
          <div className="text-5xl">❌</div>

          <div>
            <h1 className="text-2xl font-bold text-white">Оплата отменена</h1>
            <p className="text-gray-400 text-sm mt-2">
              Вы отменили оплату. Никаких списаний не было.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard/jobs"
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
            >
              Попробовать снова
            </Link>
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
