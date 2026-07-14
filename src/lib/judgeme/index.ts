// Judge.me reviews — fetch + transform, called from PDP frontmatter (SSR).
// Aggregate rating/count still come from the standard Shopify
// `reviews.rating` / `reviews.rating_count` metafields (see
// src/lib/shopify/graphql/products.ts) — Judge.me writes those itself when
// "Enable product metafields" is on in the Judge.me admin. This layer only
// adds the individual review cards, which metafields don't carry.
import { judgemeConfigured, judgemeFetch, judgemePost, JudgeMeError } from './client';
import { transformReview } from './transforms';
import type { JudgeMeReviewsResponse, JudgeMeProductsResponse } from './types';
import type { ProductReview } from '~/lib/shopify/types';

export { JudgeMeError, judgemeConfigured };

// Judge.me's /reviews?product_id= filter takes Judge.me's OWN internal
// product id, not Shopify's — confirmed against a live call (passing the
// Shopify id is rejected as "too big", and neither /reviews?external_id=
// nor /products?external_id= actually filter server-side, they just return
// everything). So resolve Shopify external_id -> Judge.me product id via
// /products first, paginating since that endpoint can't filter either.
async function findJudgeMeProductId(externalId: string): Promise<number | null> {
  const PER_PAGE = 100;
  const MAX_PAGES = 20; // bounds worst-case latency on very large catalogues
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await judgemeFetch<JudgeMeProductsResponse>('/products', { per_page: PER_PAGE, page });
    const match = data.products?.find((p) => String(p.external_id) === externalId);
    if (match) return match.id;
    if (!data.products || data.products.length < PER_PAGE) break;
  }
  return null;
}

/**
 * Published, non-hidden reviews for a product, newest first.
 * `productGid` is the Shopify GID (`gid://shopify/Product/123…`).
 */
export async function getProductReviews(productGid: string, perPage = 20): Promise<ProductReview[]> {
  if (!judgemeConfigured()) return [];

  const externalId = productGid.split('/').pop();
  if (!externalId) return [];

  const judgemeProductId = await findJudgeMeProductId(externalId);
  if (judgemeProductId == null) return [];

  const data = await judgemeFetch<JudgeMeReviewsResponse>('/reviews', {
    product_id: judgemeProductId,
    per_page: perPage,
    page: 1,
  });

  return (data.reviews ?? [])
    .filter((r) => r.published && !r.hidden)
    .map(transformReview);
}

export interface CreateReviewInput {
  /** Shopify product GID (`gid://shopify/Product/123…`). */
  productGid: string;
  name: string;
  email: string;
  /** 1–5. */
  rating: number;
  title?: string;
  body: string;
  ipAddress?: string;
}

/** Submit a new review to Judge.me. Throws JudgeMeError on validation failure. */
export async function createReview(input: CreateReviewInput): Promise<void> {
  if (!judgemeConfigured()) {
    throw new JudgeMeError('Reviews are not available right now. Please try again later.');
  }
  const externalId = input.productGid.split('/').pop();
  if (!externalId) throw new JudgeMeError('Invalid product.');

  await judgemePost('/reviews', {
    id: externalId,
    name: input.name,
    email: input.email,
    rating: input.rating,
    title: input.title || undefined,
    body: input.body,
    ip_address: input.ipAddress,
  });
}
