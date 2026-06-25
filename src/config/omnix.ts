// ============================================================
//  OMNIX brand constants — used by the SEO head + chrome.
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

export const BRAND = {
  name: "Omnix",
  /** Shown in the <title> default and OG site name. */
  legalName: "Omnix Electronics",
  tagline: "Premium Consumer Electronics",
  description:
    "Omnix — premium consumer electronics. Audio, wearables, mobile, cameras, gaming. 30-day return promise and a 2-year warranty.",
  /**
   * Free-shipping threshold — drives the cart "Add $X more to unlock FREE
   * shipping" meter. Set to a number (e.g. 99) to show it; set to 0 (or null)
   * to turn the meter OFF and hide it entirely (for stores with no free
   * shipping). ⚠️ This is display only — it does NOT create a shipping rate.
   * If you show it, you MUST add a matching free-shipping rate in Shopify
   * (Settings → Shipping and delivery → "Free, over $99") or the cart promises
   * free shipping the customer never gets at checkout.
   */
  freeShippingThreshold: 0 as number | null,
  social: {
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com",
  },
} as const;

/**
 * Cart "extras" — gift wrap, order notes, and the protection plan on the cart
 * page. All reach the REAL Shopify cart and require ZERO gid-pasting:
 *
 *  - Order notes  → cart `note`        (works out of the box, no product)
 *  - Gift message → cart `attribute`   (works out of the box, no product)
 *  - Gift wrap / protection are PAID, so they need real Shopify products. The
 *    storefront finds them by **handle** (set below) at render time — create a
 *    product with the matching handle and it lights up automatically; no code
 *    edit, no variant gid. Shopify derives the handle from the title, so
 *    "Gift Wrap" → `gift-wrap`. Override the handle here if yours differs.
 *
 * SETUP for each paid product (do this in Shopify admin):
 *   1. Create the product; confirm its handle matches `handle` below.
 *   2. PUBLISH it to the sales channel your Storefront token uses (Headless /
 *      Online Store) — unpublished products can't be added to the cart.
 *   3. Set Inventory → "Don't track quantity" (so it never shows sold out).
 *   4. Protection: add an option (e.g. "Plan") whose VALUES exactly match each
 *      plan's `optionValue` below — that's how a plan maps to its variant.
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
  protection: {
    enabled: true,
    /** Product handle of the protection product (Shopify slug). */
    handle: "omnix-protection",
    plans: [
      // `none` is the always-present free default — no variant, no optionValue.
      {
        id: "none",
        name: "No protection",
        meta: "Standard 2-year manufacturer warranty",
        price: 0,
        best: false,
        optionValue: "",
      },
      // `optionValue` must equal the Shopify variant's option value exactly.
      // `name` is the display label; `optionValue` is the Shopify variant value.
      {
        id: "essential",
        name: "Essential — 2 years",
        meta: "Accidental damage + battery replacement",
        price: 49,
        best: false,
        optionValue: "Essential",
      },
      {
        id: "premium",
        name: "Premium — 3 years",
        meta: "Damage, theft, failure + priority replacement",
        price: 99,
        best: true,
        optionValue: "Premium",
      },
    ],
  },
} as const;

/**
 * "Shop by lifestyle" presentation map. Cards are real Shopify `for-*`
 * collections (title/count/image/link come from Shopify); the icon and
 * display order live here in code, keyed by collection handle. Array order
 * = card order. A `for-*` collection not listed still shows, appended last
 * with the default `bolt` icon. Icon names must exist in `ui/omnix/Icon.astro`.
 */
export const LIFESTYLE_CARDS = [
  { handle: "for-gamers", icon: "bolt" as const },
  { handle: "for-creators", icon: "spark" as const },
  { handle: "for-athletes", icon: "heart" as const },
  { handle: "for-music-lovers", icon: "chat" as const },
  { handle: "for-remote-work", icon: "user" as const },
];
