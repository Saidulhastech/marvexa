// ============================================================
//  Shopify Storefront API — flattened domain types (2026-04)
// ============================================================
// These describe the *clean* shapes our transforms produce, not
// the raw edges/node GraphQL envelopes.

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  id?: string;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

/** Per-location in-store pickup availability for a variant (Shopify Local Pickup). */
export interface PickupLocation {
  available: boolean;
  /** Human prep time from Shopify, e.g. "Usually ready in 24 hours". */
  pickUpTime?: string | null;
  locationName: string;
  city?: string | null;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice?: Money | null;
  image?: Image | null;
  /** Local-pickup availability per store; [] when none queried/available (PDP only). */
  storeAvailability?: PickupLocation[];
}

export interface ProductOptionValue {
  id: string;
  name: string;
  /** Swatch colour (hex) from the option value, when the merchant sets one. */
  swatch?: { color?: string | null } | null;
}

export interface ProductOption {
  id: string;
  name: string;
  optionValues: ProductOptionValue[];
}

export interface Seo {
  title?: string | null;
  description?: string | null;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  /** ISO publish date — drives the "New" badge (recently published). */
  createdAt?: string | null;
  availableForSale: boolean;
  featuredImage?: Image | null;
  images: Image[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange?: {
    minVariantPrice: Money;
  };
  options: ProductOption[];
  variants: ProductVariant[];
  seo?: Seo;
  /** Total sellable units across variants (null when inventory not tracked). */
  totalInventory?: number | null;
  /** Review rating from the `reviews.rating` metafield; null when none. */
  rating?: number | null;
  /** Review count from `reviews.rating_count`; null when none. */
  ratingCount?: number | null;
  /** "N people saved this" from `custom.saves_count`; null when unset (hidden). */
  savesCount?: number | null;
  /** Size chart pinned directly to this product via `custom.size_chart` (Metaobject reference); null when unset — see `getSizeCharts()` for the productType-level fallback. */
  sizeChart?: SizeChart | null;
  /** Structured spec rows from `custom.specifications` (JSON list); [] when none. */
  specs?: { label: string; value: string }[];
  /** Highlight bullets from `custom.highlights` (JSON list); [] when none. */
  highlights?: string[];
  /** Materials & Care bullets from `custom.materials_care` (JSON list); [] when none. */
  materialsCare?: string[];
  /** Shipping & Returns bullets from `custom.shipping_returns` (JSON list); [] when none. */
  shippingReturns?: string[];
  /** Returns Policy sidebar bullets from `custom.returns_policy` (JSON list); [] when none. */
  returnsPolicy?: string[];
  /** Delivery-estimate override (days from order date) from `custom.processing_days`; null when unset — falls back to `DELIVERY_ESTIMATE_DAYS` in config. */
  processingDays?: number | null;
  /** Individual reviews from a review metafield; [] when none available. */
  reviews?: ProductReview[];
  /** Star distribution [5★..1★] counts, derived from `reviews`; null when none. */
  ratingDistribution?: number[] | null;
}

export interface ProductReview {
  author: string;
  rating: number;
  title?: string;
  body?: string;
  date?: string;
  /** True for a real verified-buyer review (Judge.me). Absent for other sources. */
  verified?: boolean;
}

/** Lightweight product shape used in grids/cards. */
export interface ProductCard {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  /** Shopify product type — drives the shop "Category" facet. */
  productType?: string;
  /** Product tags — drive the shop "Features" facet. */
  tags?: string[];
  /** Collections the product belongs to — drive dynamic category tabs. */
  collections?: { title: string; handle: string }[];
  availableForSale: boolean;
  featuredImage?: Image | null;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange?: {
    minVariantPrice: Money;
  };
  /** First variant gid — lets product grids "quick add" without a PDP fetch. */
  firstVariantId?: string | null;
  /** Whether that first variant can be purchased. */
  firstVariantAvailable?: boolean;
  /** All variants — power grid quick-add variant selection + swatch→image swap. */
  variants?: ProductVariant[];
  /** Product options (name + values) — drive grid swatches & the quick-add picker. */
  options?: ProductOption[];
  /** Short product description (truncated) — for the quick-view modal. */
  description?: string;
  /** Recently published — drives the "New" badge. */
  isNew?: boolean;
  /** Color swatches derived from the product's colour option (if any). */
  swatches?: { name: string; color: string }[];
  /** Review rating (e.g. 4.7) from the `reviews.rating` metafield; null if none. */
  rating?: number | null;
  /** Number of reviews from `reviews.rating_count`; null if none. */
  ratingCount?: number | null;
  /** Total sellable units across variants (Shopify `totalInventory`); null if untracked. */
  totalInventory?: number | null;
  /** Optional stock goal (`custom.stock_goal` metafield) for the deal stock bar. */
  stockGoal?: number | null;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

/** A flattened paginated list. */
export interface Paginated<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface CollectionFilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
}

export interface CollectionFilter {
  id: string;
  label: string;
  type: string;
  values: CollectionFilterValue[];
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  image?: Image | null;
  seo?: Seo;
  /** Product count (capped at the fetch limit; see productCountPlus). */
  productCount?: number;
  /** True when the collection has more products than were counted. */
  productCountPlus?: boolean;
}

export interface CollectionWithProducts extends Collection {
  products: Paginated<ProductCard>;
  filters?: CollectionFilter[];
}

// ── Cart ────────────────────────────────────────────────────

export interface CartLineMerchandise {
  id: string;
  title: string;
  availableForSale: boolean;
  /** Sellable units for this variant; null when inventory isn't tracked. */
  quantityAvailable?: number | null;
  selectedOptions: SelectedOption[];
  price: Money;
  /** Variant "was" price — present only when the merchant set a compare-at. */
  compareAtPrice?: Money | null;
  image?: Image | null;
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage?: Image | null;
  };
}

export interface CartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
    amountPerQuantity: Money;
  };
  merchandise: CartLineMerchandise;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note?: string | null;
  /** Cart-level custom attributes (gift message, plan choice, etc.). */
  attributes?: { key: string; value: string }[];
  /** Market pin — the country whose currency the cart prices in. */
  buyerIdentity?: { countryCode: string | null };
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount?: Money | null;
  };
  /** Discount codes applied to the cart (with their applicable status). */
  discountCodes?: { applicable: boolean; code: string }[];
  /** Cart-level discount allocations (sum = total discount applied). */
  discountAllocations?: { discountedAmount: Money }[];
  lines: CartLine[];
}

// ── Navigation / content ────────────────────────────────────

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: string;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface Shop {
  name: string;
  description?: string;
  primaryDomain: { url: string; host: string };
}

// ── Localization (markets) ──────────────────────────────────

export interface Currency {
  isoCode: string;
  symbol: string;
  name?: string;
}

export interface Language {
  isoCode: string;
  name: string;
  endonymName?: string;
}

export interface Country {
  isoCode: string;
  name: string;
  currency: Currency;
  availableLanguages: Language[];
}

/** Shop's configured localized experiences — drives the market selector. */
export interface Localization {
  availableCountries: Country[];
  /** Active country for the query context (shop default unless @inContext set). */
  country: { isoCode: string; name: string; currency: Currency };
  /** Active language for the query context. */
  language: Language;
}

// ── Size charts (a `size_chart` Metaobject, per-product or per-productType) ──

/** One size-chart row; keys are whatever columns the chart defines (e.g. Size/Bust/Waist). */
export type SizeChartRow = Record<string, string>;

/** A resolved size chart — column order comes from the first row's field order. */
export interface SizeChart {
  title?: string;
  note?: string;
  columns: string[];
  rows: SizeChartRow[];
}

/** A `size_chart` Metaobject with its `product_type` matcher — used for the productType-level fallback list (see `getSizeCharts()`). Empty `productType` = only reachable via a product's direct `custom.size_chart` reference. */
export interface SizeChartEntry extends SizeChart {
  productType: string;
}

// ── Blog (Shopify's native blog/article objects) ────────────

/** Resolved from the `author` Metaobject (or `authorV2` as fallback — see transforms.ts). */
export interface BlogAuthor {
  /** Metaobject handle — powers /blog/author/[slug]. Empty when only `authorV2` was available. */
  handle: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  /** Every other text field on the Author metaobject (twitter, facebook, instagram, …) — add a field in Shopify and it shows up here automatically, no code change. */
  socialLinks: { key: string; label: string; url: string }[];
}

export interface BlogArticleSummary {
  id: string;
  handle: string;
  title: string;
  excerpt: string;
  image?: Image | null;
  tags: string[];
  /** First tag, used as the single category pill (Shopify has no dedicated category field). */
  category: string;
  publishedAt: string;
  /** Derived from word count — Shopify has no reading-time field. */
  readingTime: string;
  author?: BlogAuthor;
}

export interface BlogArticle extends BlogArticleSummary {
  /** Rich text body with `id` attributes injected on every <h2> for the TOC sidebar. */
  contentHtml: string;
  /** <h2> headings extracted from contentHtml, in document order. */
  headings: { slug: string; text: string }[];
}

// ── Sort options surfaced in the UI ─────────────────────────

export interface SortOption {
  label: string;
  value: string;
  sortKey: string;
  reverse: boolean;
}
