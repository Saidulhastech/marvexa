import type { ProductReview } from '~/lib/shopify/types';
import type { JudgeMeReviewRaw } from './types';

export function transformReview(r: JudgeMeReviewRaw): ProductReview {
  return {
    author: r.reviewer?.name || 'Verified buyer',
    rating: r.rating,
    title: r.title ?? undefined,
    body: r.body ?? undefined,
    date: r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : undefined,
    verified: r.verified === 'verified',
  };
}
