'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Listing, Review } from '@/types';
import CategoryIcon from '@/components/CategoryIcon';
import StarRating from '@/components/StarRating';
import { TranslationKey } from '@/lib/i18n';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { T } = useLang();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    async function load() {
      const [listingRes, reviewsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*, profiles(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(*)')
          .eq('listing_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (listingRes.data) setListing(listingRes.data as Listing);
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function startChat() {
    if (!user || !listing) return;
    // Check if chat already exists
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .contains('participant_ids', [user.id, listing.user_id])
      .eq('listing_id', listing.id)
      .single();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data } = await supabase
      .from('chats')
      .insert({
        listing_id: listing.id,
        participant_ids: [user.id, listing.user_id],
      })
      .select()
      .single();

    if (data) router.push(`/chat/${data.id}`);
  }

  async function deleteListing() {
    if (!listing) return;
    setDeleting(true);
    await supabase.from('listings').delete().eq('id', listing.id);
    router.push('/');
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !listing) return;
    setSubmittingReview(true);
    setReviewError('');

    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: listing.user_id,
      listing_id: listing.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });

    if (error) {
      setReviewError(error.message);
    } else {
      setShowReviewForm(false);
      // Refresh reviews
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviewer_id(*)')
        .eq('listing_id', id)
        .order('created_at', { ascending: false });
      if (data) setReviews(data as Review[]);
    }
    setSubmittingReview(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#8BC34A] text-lg">{T('loading')}</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Listing not found
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const canReview = user && !isOwner && !reviews.find((r) => r.reviewer_id === user.id);

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm mb-6 inline-block">
          ← {T('back')}
        </Link>

        {/* Main card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <CategoryIcon category={listing.category} size="lg" />
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#8BC34A]/10 text-[#8BC34A] font-medium">
                  {T(listing.category as TranslationKey)}
                </span>
                <div className="mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      listing.type === 'offer'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-purple-900/30 text-purple-400'
                    }`}
                  >
                    {T(listing.type as TranslationKey)}
                  </span>
                </div>
              </div>
            </div>
            {listing.price != null && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#8BC34A]">
                  {listing.price}€
                </div>
                <div className="text-gray-500 text-sm">
                  {listing.price_unit === 'h' ? T('per_hour') : T('per_job')}
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{listing.title}</h1>

          {listing.description && (
            <p className="text-gray-300 leading-relaxed mb-4">{listing.description}</p>
          )}

          {listing.location && (
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
              <span>📍</span>
              <span>{listing.location}</span>
            </div>
          )}

          {/* Author */}
          {listing.profiles && (
            <div className="flex items-center gap-3 pt-4 border-t border-[#2a2a2a]">
              <div className="w-10 h-10 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] font-bold">
                {(listing.profiles.full_name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-white">{listing.profiles.full_name || '—'}</div>
                {listing.profiles.rating_count > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRating value={listing.profiles.rating_avg} readonly size="sm" />
                    <span className="text-gray-500 text-xs">({listing.profiles.rating_count})</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          {!isOwner && user && (
            <button
              onClick={startChat}
              className="flex-1 bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] transition-colors"
            >
              💬 {T('contact')}
            </button>
          )}
          {!user && (
            <Link
              href="/auth"
              className="flex-1 text-center bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] transition-colors"
            >
              {T('login')} to contact
            </Link>
          )}
          {isOwner && (
            <>
              <Link
                href={`/listings/${listing.id}/edit`}
                className="flex-1 text-center bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium py-3 rounded-xl hover:border-[#8BC34A]/40 transition-colors"
              >
                ✏️ {T('edit')}
              </Link>
              <button
                onClick={deleteListing}
                disabled={deleting}
                className="px-6 bg-red-900/30 border border-red-800 text-red-400 font-medium py-3 rounded-xl hover:bg-red-900/50 disabled:opacity-50 transition-colors"
              >
                🗑 {T('delete')}
              </button>
            </>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">{T('reviews')}</h2>
            {canReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm text-[#8BC34A] hover:underline"
              >
                + {T('leave_review')}
              </button>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form onSubmit={submitReview} className="mb-6 p-4 bg-[#0f0f0f] rounded-xl border border-[#2a2a2a]">
              <div className="mb-3">
                <label className="text-sm text-gray-400 block mb-1">{T('your_rating')}</label>
                <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-400 block mb-1">{T('your_comment')}</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors resize-none text-sm"
                />
              </div>
              {reviewError && (
                <p className="text-red-400 text-sm mb-2">{reviewError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#8BC34A] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#9DD45B] disabled:opacity-50 transition-colors text-sm"
                >
                  {submittingReview ? T('loading') : T('submit_review')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-500 hover:text-white transition-colors text-sm px-3"
                >
                  {T('cancel')}
                </button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">{T('no_reviews')}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-[#2a2a2a] pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] text-xs font-bold">
                      {(review.reviewer?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {review.reviewer?.full_name || '—'}
                    </span>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-gray-400 text-sm mt-1 ml-9">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
