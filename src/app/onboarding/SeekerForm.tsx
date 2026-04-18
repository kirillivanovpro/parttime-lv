'use client'

import { useActionState, useRef, useState } from 'react'
import { saveSeekerProfileAction, type SeekerProfileState } from './actions'
import type { SeekerProfile, ScheduleType } from '@/types'

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

const scheduleOptions: { value: ScheduleType; label: string }[] = [
  { value: 'flexible', label: 'Гибкий график' },
  { value: 'mornings', label: 'Утро (до 12:00)' },
  { value: 'evenings', label: 'Вечер (после 18:00)' },
  { value: 'weekends', label: 'Выходные' },
]

const expOptions = [
  { value: 0, label: 'Без опыта' },
  { value: 1, label: '1 год' },
  { value: 2, label: '2 года' },
  { value: 3, label: '3 года' },
  { value: 4, label: '4 года' },
  { value: 5, label: '5 лет' },
  { value: 6, label: '6+ лет' },
]

interface Props {
  defaultValues?: Partial<SeekerProfile>
}

export default function SeekerForm({ defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState<SeekerProfileState, FormData>(
    saveSeekerProfileAction,
    null
  )
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState('')
  const [isVisible, setIsVisible] = useState(defaultValues?.is_visible ?? true)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setCvFile(null); return }
    if (file.type !== 'application/pdf') {
      setCvError('Только PDF файлы')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError('Файл не должен превышать 5MB')
      e.target.value = ''
      return
    }
    setCvError('')
    setCvFile(file)
  }

  const FieldError = ({ errors }: { errors?: string[] }) =>
    errors?.[0] ? <p className="text-red-400 text-xs mt-1">{errors[0]}</p> : null

  return (
    <form action={formAction} className="space-y-5">
      {state?.error?._form && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {state.error._form}
        </div>
      )}

      {/* Bio */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">О себе</label>
        <textarea
          name="bio"
          rows={4}
          maxLength={1000}
          defaultValue={defaultValues?.bio ?? ''}
          placeholder="Расскажите работодателям о своём опыте и предпочтениях..."
          className={`${inputClass} resize-none`}
        />
        <FieldError errors={state?.error?.bio} />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Навыки</label>
        <input
          name="skills"
          type="text"
          defaultValue={defaultValues?.skills?.join(', ') ?? ''}
          placeholder="JavaScript, React, Figma, Excel..."
          className={inputClass}
        />
        <p className="text-gray-600 text-xs mt-1">Введите через запятую</p>
        <FieldError errors={state?.error?.skills} />
      </div>

      {/* Experience + Salary */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Опыт</label>
          <select
            name="experience_years"
            defaultValue={defaultValues?.experience_years ?? 0}
            className={inputClass}
          >
            {expOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1a1a]">
                {o.label}
              </option>
            ))}
          </select>
          <FieldError errors={state?.error?.experience_years} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Желаемая зарплата, €</label>
          <input
            name="desired_salary"
            type="number"
            min={1}
            defaultValue={defaultValues?.desired_salary ?? ''}
            placeholder="1200"
            className={inputClass}
          />
          <FieldError errors={state?.error?.desired_salary} />
        </div>
      </div>

      {/* City + Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Город</label>
          <input
            name="city"
            type="text"
            defaultValue={defaultValues?.city ?? ''}
            placeholder="Рига"
            className={inputClass}
          />
          <FieldError errors={state?.error?.city} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">График</label>
          <select
            name="schedule"
            defaultValue={defaultValues?.schedule ?? ''}
            className={inputClass}
          >
            <option value="" className="bg-[#1a1a1a]">Не указано</option>
            {scheduleOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1a1a]">
                {o.label}
              </option>
            ))}
          </select>
          <FieldError errors={state?.error?.schedule} />
        </div>
      </div>

      {/* CV upload */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">CV (PDF, макс. 5MB)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#2a2a2a] rounded-lg px-4 py-5 text-center cursor-pointer hover:border-[#8BC34A]/50 transition-colors"
        >
          {cvFile ? (
            <p className="text-[#8BC34A] text-sm font-medium">{cvFile.name}</p>
          ) : defaultValues?.cv_url ? (
            <p className="text-gray-400 text-sm">
              Загружен CV.{' '}
              <span className="text-[#8BC34A]">Выбрать новый файл</span>
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              Нажмите, чтобы загрузить PDF
            </p>
          )}
        </div>
        <input
          ref={fileRef}
          name="cv"
          type="file"
          accept="application/pdf"
          onChange={handleCvChange}
          className="hidden"
        />
        {cvError && <p className="text-red-400 text-xs mt-1">{cvError}</p>}
      </div>

      {/* is_visible toggle */}
      <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <div>
          <p className="text-sm font-medium text-white">Профиль виден работодателям</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isVisible ? 'Вас могут найти в поиске' : 'Вы скрыты из поиска'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            isVisible ? 'bg-[#8BC34A]' : 'bg-[#3a3a3a]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              isVisible ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <input type="hidden" name="is_visible" value={isVisible ? 'on' : ''} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Сохранение...' : 'Сохранить профиль'}
      </button>
    </form>
  )
}
