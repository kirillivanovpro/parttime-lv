'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Calendar, ArrowLeft, MessageCircle, Star, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { CategoryIcon } from '@/components/CategoryIcon'
import { StarRating, RatingDisplay } from '@/components/StarRating'
import { ListingWithProfile, Review, Profile } from '@/types/database'

interface ReviewWithProfile extends Review {
  reviewer: Profile
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { lang, user } = useApp()
  const router = useRouter()

  const [listing, setListing] = useState<ListingWithProfile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    fetchListing()
    fetchReviews()
  }, [id])

  const fetchListing = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
    setListing(data as ListingWithProfile)
    setLoading(false)
  }

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(*)')
      .eq('listing_id', id)
      .order('created_at', { ascending: false })
    setReviews((data as ReviewWithProfile[]) ?? [])
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !listing || reviewRating === 0) return
    setSubmittingReview(true)

    const { error } = await supabase.from('reviews').insert({
      listing_id: listing.id,
      reviewer_id: user.id,
      reviewee_id: listing.user_id,
      rating: reviewRating,
      comment: reviewComment || null,
    })

    if (!error) {
      setReviewSuccess(true)
      setReviewRating(0)
      setReviewComment('')
      fetchReviews()
    }
    setSubmittingReview(false)
  }

  const handleContact = () => {
    if (!listing) return
    router.push(`/chat?listing=${listing.id}&user=${listing.user_id}`)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-96 animate-pulse" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-zinc-400">{t(lang, 'error')}</p>
        <Link href="/" className="mt-4 text-[#8BC34A]">{t(lang, 'back')}</Link>
      </div>
    )
  }

  const title = lang === 'lv' ? listing.title_lv : listing.title_ru
  const description = lang === 'lv' ? listing.description_lv : listing.description_ru

  const categoryLabels: Record<string, string> = {
    cleaning: t(lang, 'cat_cleaning'),
    dog_walking: t(lang, 'cat_dog_walking'),
    tutoring: t(lang, 'cat_tutoring'),
    photo_video: t(lang, 'cat_photo_video'),
    delivery: t(lang, 'cat_delivery'),
    repairs: t(lang, 'cat_repairs'),
  }

  const priceUnitMap: Record<string, string> = {
    hour: t(lang, 'per_hour'),
    job: t(lang, 'per_job'),
    day: t(lang, 'per_day'),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        {t(lang, 'back')}
      </button>

      <div className="grid gap-6">
        {/* Main listing card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Image or category header */}
          <div className="relative h-52 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            {listing.images && listing.images.length > 0 ? (
              <img src={listing.images[0]} alt={title} className="w-full h-full object-cover" />
            ) : (
              <CategoryIcon category={listing.category} size={64} className="text-zinc-700" />
            )}
            <div className={clsx(
              'absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold',
              listing.type === 'offer'
                ? 'bg-[#8BC34A] text-zinc-900'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            )}>
              {listing.type === 'offer' ? t(lang, 'offer_badge') : t(lang, 'request_badge')}
            </div>
          </div>

          <div className="p-6">
            {/* Category */}
            <div className="flex items-center gap-2 text-[#8BC34A] text-sm mb-2">
              <CategoryIcon category={listing.category} size={16} />
              {categoryLabels[listing.category]}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>

            {/* Description */}
            {description && (
              <p className="text-zinc-400 leading-relaxed mb-6">{description}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mb-6">
              {listing.price && (
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-[#8BC34A]">€{listing.price}</span>
                  <span className="text-zinc-400 text-sm">{priceUnitMap[listing.price_unit ?? 'hour']}</span>
                </div>
              )}
              {listing.location && (
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <MapPin size={14} />
                  {listing.location}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                <Calendar size={14} />
                {new Date(listing.created_at).toLocaleDateString(lang === 'lv' ? 'lv-LV' : 'ru-RU')}
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <Link href={`/profile?id=${listing.user_id}`} className="flex items-center gap-3 group">
                {listing.profiles?.avatar_url ? (
                  <img
                    src={listing.profiles.avatar_url}
                    alt={listing.profiles.display_name ?? ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <UserIcon size={18} className="text-zinc-500" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium group-hover:text-[#8BC34A] transition-colors">
                    {listing.profiles?.display_name ?? 'User'}
                  </p>
                  {listing.profiles?.rating_count > 0 && (
                    <RatingDisplay
                      avg={listing.profiles.rating_avg}
                      count={listing.profiles.rating_count}
                      reviewsLabel={t(lang, 'reviews')}
                      reviewSingular={t(lang, 'review_singular')}
                    />
                  )}
                </div>
              </Link>

              {user && user.id !== listing.user_id && (
                <button
                  onClick={handleContact}
                  className="flex items-center gap-2 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <MessageCircle size={18} />
                  {t(lang, 'contact')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-[#8BC34A]" />
            {t(lang, 'reviews_title')} ({reviews.length})
          </h2>

          {/* Leave review form */}
          {user && user.id !== listing.user_id && !reviewSuccess && (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-zinc-800 rounded-xl">
              <p className="text-sm font-medium text-zinc-300 mb-3">{t(lang, 'leave_review')}</p>
              <div className="mb-3">
                <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder={t(lang, 'review_placeholder')}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm resize-none mb-3"
              />
              <button
                type="submit"
                disabled={submittingReview || reviewRating === 0}
                className="bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                {submittingReview ? t(lang, 'loading') : t(lang, 'review_submit')}
              </button>
            </form>
          )}

          {reviewSuccess && (
            <div className="mb-4 p-3 bg-[#8BC34A]/10 border border-[#8BC34A]/20 rounded-xl text-[#8BC34A] text-sm">
              {t(lang, 'review_success')}
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p className="text-zinc-500 text-sm">{lang === 'lv' ? 'Nav atsauksmju' : 'Нет отзывов'}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-zinc-800 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {review.reviewer?.avatar_url ? (
                        <img src={review.reviewer.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <UserIcon size={14} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{review.reviewer?.display_name ?? 'User'}</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readonly size={12} />
                        <span className="text-zinc-500 text-xs">
                          {new Date(review.created_at).toLocaleDateString(lang === 'lv' ? 'lv-LV' : 'ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-zinc-400 text-sm ml-11">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
