'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getReviews, submitReview } from '@/lib/api';

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <svg className={`w-4 h-4 transition-colors ${i <= (hover || rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({ customerName: '', rating: 5, title: '', body: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getReviews(productId),
  });

  const mutation = useMutation({
    mutationFn: () => submitReview(productId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review submitted! Thank you.');
      setShowForm(false);
      setForm({ customerName: '', rating: 5, title: '', body: '' });
    },
    onError: () => toast.error('Could not submit review. Please try again.'),
  });

  const reviews = data?.reviews || [];
  const avgRating = data?.avgRating || 0;
  const displayed = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="border-t pt-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="font-serif text-2xl mb-1">Customer Reviews</h3>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm text-gray-600">{avgRating.toFixed(1)} out of 5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No reviews yet — be the first!</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-outline px-4 py-2 text-sm"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Rating Distribution */}
        {data && data.distribution && reviews.length > 0 && (
          <div className="mb-6 max-w-xs">
            {data.distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 w-6">{d.star}★</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: reviews.length > 0 ? `${(d.count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-5">{d.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!form.customerName.trim() || form.rating < 1) { toast.error('Please add your name and a rating'); return; } mutation.mutate(); }}
            className="bg-warm-white rounded-sm p-5 mb-6 space-y-4"
          >
            <h4 className="font-medium">Share Your Experience</h4>
            <div>
              <label className="block text-xs font-medium mb-1">Your Rating *</label>
              <StarRating rating={form.rating} interactive onChange={(r) => setForm({ ...form, rating: r })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name *</label>
                <input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Your name"
                  required
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Review Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Summarise your review"
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Your Review</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                placeholder="Tell others about your experience with this product..."
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-gold resize-none"
              />
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {mutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded" />)}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-5">
            {displayed.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-5 last:border-0">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <span className="font-medium text-sm">{review.customerName}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <StarRating rating={review.rating} />
                {review.title && <p className="text-sm font-medium mt-2">{review.title}</p>}
                {review.body && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        )}

        {reviews.length > 3 && (
          <button onClick={() => setShowAll(!showAll)} className="mt-4 text-sm text-rose-gold hover:underline">
            {showAll ? 'Show less' : `Show all ${reviews.length} reviews`}
          </button>
        )}
      </div>
    </div>
  );
}
