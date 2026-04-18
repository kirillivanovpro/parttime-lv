'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { saveEmployerProfileAction, type EmployerProfileState } from './actions'
import type { EmployerProfile } from '@/types'

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

interface Props {
  defaultValues?: Partial<EmployerProfile>
}

export default function EmployerForm({ defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState<EmployerProfileState, FormData>(
    saveEmployerProfileAction,
    null
  )
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultValues?.logo_url ?? null)
  const [logoError, setLogoError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setLogoFile(null); setLogoPreview(defaultValues?.logo_url ?? null); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Только JPG или PNG')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Файл не должен превышать 2MB')
      e.target.value = ''
      return
    }
    setLogoError('')
    setLogoFile(file)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setLogoPreview(url)
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

      {/* Logo upload */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Логотип компании (JPG/PNG, макс. 2MB)</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2a2a2a] flex items-center justify-center cursor-pointer hover:border-[#8BC34A]/50 transition-colors flex-shrink-0 overflow-hidden"
          >
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Логотип"
                width={80}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-gray-600 text-2xl">🏢</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-[#8BC34A] hover:underline"
            >
              {logoFile ? 'Изменить логотип' : 'Загрузить логотип'}
            </button>
            <p className="text-gray-600 text-xs mt-1">PNG или JPG, до 2MB</p>
            {logoError && <p className="text-red-400 text-xs mt-1">{logoError}</p>}
          </div>
        </div>
        <input
          ref={fileRef}
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      {/* Company name */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Название компании <span className="text-red-400">*</span>
        </label>
        <input
          name="company_name"
          type="text"
          required
          defaultValue={defaultValues?.company_name ?? ''}
          placeholder="ООО Ромашка"
          className={inputClass}
        />
        <FieldError errors={state?.error?.company_name} />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Описание компании</label>
        <textarea
          name="company_description"
          rows={4}
          maxLength={2000}
          defaultValue={defaultValues?.company_description ?? ''}
          placeholder="Чем занимается компания, какую команду ищете..."
          className={`${inputClass} resize-none`}
        />
        <FieldError errors={state?.error?.company_description} />
      </div>

      {/* City + Website */}
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
          <label className="block text-sm text-gray-400 mb-1">Сайт</label>
          <input
            name="website"
            type="url"
            defaultValue={defaultValues?.website ?? ''}
            placeholder="https://example.lv"
            className={inputClass}
          />
          <FieldError errors={state?.error?.website} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Сохранение...' : 'Сохранить профиль компании'}
      </button>
    </form>
  )
}
