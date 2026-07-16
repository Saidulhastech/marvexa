// ============================================================
//  MARVEXA brand constants — used by the SEO head + chrome.
//  Section *content* (hero copy, testimonials, etc.) lives in
//  content collections (src/content/*); this file holds only the
//  stable brand identity referenced from code.
// ============================================================

/**
 * Storefront market — the Shopify country whose currency the whole shop
 * prices in. Pins the cart to one market so cart/checkout always match the
 * product cards (otherwise Shopify localises the cart by buyer IP and the
 * currency drifts, e.g. cards in USD but cart in BDT).
 *
 * This is the *fallback* market — the country used when a request carries no
 * saved choice and no geo hint. Multi-currency localisation is now live: the
 * active market is resolved per-request (cookie → `cf-ipcountry` → this
 * default) in `src/middleware.ts`, exposed on `Astro.locals.market`, and
 * threaded into the catalogue via `@inContext(country:, language:)` and into
 * the cart's `buyerIdentity.countryCode` (see `~/lib/market`).
 */
export const DEFAULT_COUNTRY = "US";
/** Fallback language (ISO 639-1, uppercase) when none is chosen/derivable. */
export const DEFAULT_LANGUAGE = "EN";
/** @deprecated Use DEFAULT_COUNTRY / per-request `Astro.locals.market`. */
export const MARKET_COUNTRY = DEFAULT_COUNTRY;

/**
 * Default "Order today for delivery by [date]" estimate on the PDP — days
 * from today, real `Date` math computed client-side on every page load (not
 * a fake countdown). Override per product via the `custom.processing_days`
 * metafield (see README "Product metafields"); products without it fall
 * back to this default.
 */
export const DELIVERY_ESTIMATE_DAYS = 5;

/** Return window shown on the PDP trust badge ("Free Returns — N-day window"). Purely display — set your actual Shopify return policy separately in Settings → Policies. */
export const RETURNS_WINDOW_DAYS = 30;

export const BRAND = {
  name: "Marvexa",
  /** Shown in the <title> default and OG site name. */
  legalName: "Marvexa",
  tagline: "Modern Fashion Headless Shopify Storefront",
  description:
    "Marvexa — modern fashion. Clean, refined, everyday confidence. Quality materials, considered design, easy shopping.",
  /**
   * Free-shipping threshold — drives the cart "Add $X more to unlock FREE
   * shipping" meter. Set to a number (e.g. 99) to show it; set to 0 (or null)
   * to turn the meter OFF and hide it entirely (for stores with no free
   * shipping). ⚠️ This is display only — it does NOT create a shipping rate.
   * If you show it, you MUST add a matching free-shipping rate in Shopify
   * (Settings → Shipping and delivery → "Free, over $99") or the cart promises
   * free shipping the customer never gets at checkout.
   */
  freeShippingThreshold: 99 as number | null,
  social: {
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com",
    pinterest: "https://pinterest.com",
  },
} as const;

/**
 * Cart "extras" — gift wrap and order notes on the cart page. Both reach the
 * REAL Shopify cart and require ZERO gid-pasting:
 *
 *  - Order notes  → cart `note`        (works out of the box, no product)
 *  - Gift message → cart `attribute`   (works out of the box, no product)
 *  - Gift wrap is PAID, so it needs a real Shopify product. The storefront
 *    finds it by **handle** (set below) at render time — create a product
 *    with the matching handle and it lights up automatically; no code edit,
 *    no variant gid. Shopify derives the handle from the title, so
 *    "Gift Wrap" → `gift-wrap`. Override the handle here if yours differs.
 *
 * SETUP for the paid product (do this in Shopify admin):
 *   1. Create the product; confirm its handle matches `handle` below.
 *   2. PUBLISH it to the sales channel your Storefront token uses (Headless /
 *      Online Store) — unpublished products can't be added to the cart.
 *   3. Set Inventory → "Don't track quantity" (so it never shows sold out).
 *
 * A feature with `enabled: false`, or whose product/variant can't be found in
 * the store, is simply HIDDEN on the cart page (no broken non-charging toggle).
 * `price` here is a display fallback only — the real charge is the variant's.
 */
export const CART_EXTRAS = {
  giftWrap: {
    enabled: true,
    /** Product handle of the gift-wrap product (Shopify slug). */
    handle: "gift-wrap",
    label: "Premium gift wrap",
    desc: "Matte navy box, woven ribbon & a personal message",
    price: 12,
    messageMaxLength: 200,
  },
  orderNotes: {
    enabled: true,
    maxLength: 500,
  },
} as const;

/**
 * The Journal — Shopify's native blog (Online Store → Blog posts), not a
 * content collection. `handle` is the blog's handle in Admin. Author
 * profiles (role/bio/avatar/twitter) resolve from an `author` Metaobject
 * linked via this metafield on each article — see CLAUDE.md "Blog" section
 * for the Admin setup (metaobject definition + metafield definition).
 */
export const BLOG = {
  handle: "news",
  authorMetafield: { namespace: "custom", key: "author" },
} as const;

/**
 * Home "Best Sellers" section — a real Shopify Collection, curated in Admin
 * (manual hand-picks, or automated with a "Total sold" descending rule) so
 * merchants control the row without a code deploy. Create a collection with
 * this exact handle; if it's missing or empty, `src/pages/index.astro` falls
 * back to the top 3 products from a `sortKey: BEST_SELLING` catalogue query.
 */
export const BEST_SELLERS_COLLECTION_HANDLE = "best-sellers";

/**
 * Home "New Arrivals" section — a real Shopify Collection, curated in Admin
 * (manual order, or automated e.g. sorted "Date, new to old") so merchants
 * control the row without a code deploy. Also drives the section footer's
 * "View All" link + total count. Create a collection with this exact handle;
 * if it's missing or empty, `src/pages/index.astro` falls back to the newest
 * products from a `sortKey: CREATED_AT` catalogue query.
 */
export const NEW_ARRIVALS_COLLECTION_HANDLE = "new-arrivals";

/**
 * Home "Shop the Look" section — one real Shopify Collection per look.
 * Collection title = look label, collection image = the editorial look
 * photo, member products (in the collection's Admin sort order) = the
 * outfit pieces. Array order here = display order on the homepage. A
 * missing/empty collection is skipped (that look just doesn't render).
 *
 * Shopify has no per-product x/y coordinate on a collection, so hotspot pin
 * placement can't be curated in Admin — each collection's Nth product maps
 * to the Nth entry in `LOOKBOOK_HOTSPOT_SLOTS` below instead (same 3 pin
 * positions reused for every look). Add more handles/slots if a look needs
 * more than 3 pinned products.
 */
export const LOOKBOOK_COLLECTION_HANDLES = ["lookbook1", "lookbook2", "lookbook3"];

/** Fixed hotspot pin positions (top/left % over the look photo, cardLeft = popup card opens to the left). Edit to reposition all looks at once. */
export const LOOKBOOK_HOTSPOT_SLOTS = [
  { top: "30%", left: "38%", cardLeft: false },
  { top: "62%", left: "32%", cardLeft: false },
  { top: "72%", left: "78%", cardLeft: true },
] as const;

/**
 * "Shop by lifestyle" presentation map. Cards are real Shopify `for-*`
 * collections (title/count/image/link come from Shopify); the icon and
 * display order live here in code, keyed by collection handle. Array order
 * = card order. A `for-*` collection not listed still shows, appended last
 * with the default `bolt` icon. Icon names must exist in `ui/marvexa/Icon.astro`.
 */
export const LIFESTYLE_CARDS = [
  { handle: "for-gamers", icon: "bolt" as const },
  { handle: "for-creators", icon: "spark" as const },
  { handle: "for-athletes", icon: "heart" as const },
  { handle: "for-music-lovers", icon: "chat" as const },
  { handle: "for-remote-work", icon: "user" as const },
];
