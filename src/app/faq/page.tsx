'use client'

import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'

const FAQ_LV = [
  {
    q: 'Kā publicēt sludinājumu?',
    a: 'Reģistrējieties vai piesakieties, papildiniet maku par vismaz €0.50, un dodieties uz "Publicēt". Aizpildiet formu un apstipriniet — sludinājums uzreiz kļūs redzams.',
  },
  {
    q: 'Cik maksā sludinājuma publicēšana?',
    a: 'Katra sludinājuma publicēšana maksā €0.50. Summa tiek ieturēta no jūsu maka.',
  },
  {
    q: 'Kā atslēgt kontaktinformāciju?',
    a: 'Katram sludinājumam kontaktinformāciju var atslēgt par €0.50 no sava maka. Klikšķiniet "Atslēgt kontaktus" sludinājuma lapā.',
  },
  {
    q: 'Kā papildināt maku?',
    a: 'Dodieties uz "Mans maks" un izvēlieties apmaksas veidu: bankas karte (Stripe) vai Latvijas/Baltijas bankas (Montonio).',
  },
  {
    q: 'Vai sludinājums ir redzams uzreiz pēc publicēšanas?',
    a: 'Jā, pēc sekmīga maksājuma sludinājums uzreiz parādās katalogā.',
  },
  {
    q: 'Kā rediģēt vai dzēst sludinājumu?',
    a: 'Dodieties uz "Mans profils" → "Mani sludinājumi", kur varat mainīt sludinājuma statusu vai dzēst to.',
  },
  {
    q: 'Vai mana kontaktinformācija ir droša?',
    a: 'Jā. Jūsu tālrunis un e-pasts nav redzami citiem lietotājiem bez maksas atslēgšanas. Tie nekad nav publiski pieejami.',
  },
  {
    q: 'Kādos gadījumos varu sazināties ar atbalstu?',
    a: 'Rakstiet uz atbalsts@parttime.lv jebkurā jautājumā par maksājumiem, sludinājumiem vai tehniskām problēmām.',
  },
]

const FAQ_RU = [
  {
    q: 'Как разместить объявление?',
    a: 'Зарегистрируйтесь или войдите, пополните кошелёк минимум на €0.50 и перейдите в раздел "Разместить". Заполните форму и подтвердите — объявление сразу станет видимым.',
  },
  {
    q: 'Сколько стоит размещение объявления?',
    a: 'Размещение каждого объявления стоит €0.50. Сумма списывается с вашего кошелька.',
  },
  {
    q: 'Как открыть контактную информацию?',
    a: 'Контактная информация каждого объявления открывается за €0.50 с вашего кошелька. Нажмите "Открыть контакты" на странице объявления.',
  },
  {
    q: 'Как пополнить кошелёк?',
    a: 'Перейдите в "Мой кошелёк" и выберите способ оплаты: банковская карта (Stripe) или банки Латвии/Балтии (Montonio).',
  },
  {
    q: 'Объявление видно сразу после публикации?',
    a: 'Да, после успешной оплаты объявление сразу появляется в каталоге.',
  },
  {
    q: 'Как редактировать или удалить объявление?',
    a: 'Перейдите в "Мой профиль" → "Мои объявления", где можно изменить статус или удалить объявление.',
  },
  {
    q: 'Моя контактная информация в безопасности?',
    a: 'Да. Ваш телефон и email не видны другим пользователям без платного открытия. Они никогда не доступны публично.',
  },
  {
    q: 'Как связаться с поддержкой?',
    a: 'Напишите на atbalsts@parttime.lv по любому вопросу о платежах, объявлениях или технических проблемах.',
  },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors min-h-[56px]"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const { lang, t } = useLang()
  const faqs = lang === 'lv' ? FAQ_LV : FAQ_RU

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.faq.page_title}</h1>
      <div className="space-y-3">
        {faqs.map((item) => (
          <AccordionItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  )
}
