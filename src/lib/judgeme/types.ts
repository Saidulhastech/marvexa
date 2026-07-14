// Raw Judge.me REST API shapes. Only the fields this storefront reads.
// Verified against a live call — `published` (boolean) is the reliable
// moderation flag; `curated` is an opaque status string (e.g. "ok") that
// doesn't match Judge.me's own docs, so don't filter on it.

export interface JudgeMeReviewRaw {
  id: number;
  title: string | null;
  body: string | null;
  rating: number;
  reviewer: { name: string; email?: string } | null;
  created_at: string;
  product_external_id: number;
  published: boolean;
  hidden: boolean;
  /** 'verified' = a real verified purchase; 'not-yet' / 'not_verified' otherwise. */
  verified: string;
}

export interface JudgeMeReviewsResponse {
  reviews: JudgeMeReviewRaw[];
  current_page: number;
  per_page: number;
}

export interface JudgeMeProductRaw {
  /** Judge.me's own internal product id — required by /reviews?product_id=. */
  id: number;
  /** Shopify's numeric product id. */
  external_id: number;
  handle: string;
}

export interface JudgeMeProductsResponse {
  products: JudgeMeProductRaw[];
  current_page: number;
  per_page: number;
}
