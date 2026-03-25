'use client';
import { useState } from 'react';

interface Review {
  name: string;
  rating: number;
  comment: string;
  date: string;
  location: string;
  verified: boolean;
}

// Deterministic pseudo-random mock reviews based on product id
function getReviews(productId: string): Review[] {
  const seed = productId.charCodeAt(0) + productId.charCodeAt(productId.length - 1);
  const allReviews: Review[] = [
    { name: 'Priya S.', rating: 5, comment: 'Absolutely stunning! The fabric is so soft and the colour is exactly as shown. Got many compliments at the wedding.', date: '2 weeks ago', location: 'Hyderabad', verified: true },
    { name: 'Meera R.', rating: 5, comment: 'Perfect fit and gorgeous design. Delivery was quick too. Will definitely order again!', date: '1 month ago', location: 'Bangalore', verified: true },
    { name: 'Anitha K.', rating: 4, comment: 'Beautiful saree. The zari work is very detailed. Packaging was excellent. Slightly heavier than expected but still lovely.', date: '3 weeks ago', location: 'Chennai', verified: true },
    { name: 'Sunita M.', rating: 5, comment: 'I wore this for Diwali and everyone loved it. Quality is amazing for the price!', date: '5 weeks ago', location: 'Mumbai', verified: true },
    { name: 'Kavitha P.', rating: 4, comment: 'The colour is vibrant and the material is comfortable. Good value for money.', date: '2 months ago', location: 'Pune', verified: true },
    { name: 'Lakshmi D.', rating: 5, comment: 'Excellent product! Exactly what I was looking for. The blouse material is also very good quality.', date: '1 week ago', location: 'Vijayawada', verified: true },
  ];
  const start = seed % 3;
  return allReviews.slice(start, start + 4);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const reviews = getReviews(productId);
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, 2);

  return (
    <div className="border-t pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-xl mb-1">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-sm text-gray-600">{avgRating.toFixed(1)} out of 5 · {reviews.length} reviews</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {displayed.map((review, i) => (
          <div key={i} className="border-b border-gray-50 pb-5 last:border-0">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <span className="font-medium text-sm">{review.name}</span>
                {review.verified && (
                  <span className="ml-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Verified Purchase</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{review.date}</span>
            </div>
            <StarRating rating={review.rating} />
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
            <p className="text-xs text-gray-400 mt-1">{review.location}</p>
          </div>
        ))}
      </div>

      {reviews.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-rose-gold hover:underline"
        >
          {showAll ? 'Show less' : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </div>
  );
}
