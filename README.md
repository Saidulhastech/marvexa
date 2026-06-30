# Marvexa — Headless Shopify Storefront Theme

A production-ready headless e-commerce storefront built with **Astro 7 (SSR)**, **nanostores**, and **plain CSS**, powered end-to-end by the **Shopify Storefront API `2026-04`** and the **Customer Account API `2025-01`**.

Zero UI framework — every page is server-rendered `.astro`; interactivity (cart drawer, search, wishlist, compare, overlays) is lightweight vanilla JS. Shared cart state lives in a framework-agnostic nanostore. Deploys to **Cloudflare Workers** (`@astrojs/cloudflare`).

Design direction: *Marvexa* — modern fashion editorial. **Plus Jakarta Sans** display + **Inter** body, an electric-olive accent with a rust sale label, on a warm stone palette.

> **No fake commerce data.** Products, collections, prices, variants, stock, search, cart, checkout, local pickup and customer login are all live Shopify. Only editorial/marketing copy is static (hero text, testimonials, blog, trust badges, About/Contact, shipping blurbs) — it lives in editable content files and `.astro` pages, so nothing dishonest ships by default.

![Marvexa storefront preview](public/og-image.png)

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Shopify store setup](#shopify-store-setup) — the part most people miss
6. [Project layout](#project-layout)
7. [Pages](#pages)
8. [API routes](#api-routes)
9. [Editable content (content collections)](#editable-content-content-collections)
10. [Brand & feature config (`src/config/marvexa.ts`)](#brand--feature-config-srcconfigmarvexats)
11. [Cart extras (gift wrap, notes, protection)](#cart-extras-gift-wrap-notes-protection)
12. [Markets & multi-currency](#markets--multi-currency)
13. [Customer accounts (login)](#customer-accounts-login)
14. [Customising the design](#customising-the-design)
15. [Architecture](#architecture)
16. [Performance & caching](#performance--caching)
17. [Scripts](#scripts)
18. [Deploy (Cloudflare Workers)](#deploy-cloudflare-workers)
19. [Troubleshooting](#troubleshooting)
20. [License](#license)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 7, `output: "server"` (SSR) |
| Hosting | Cloudflare Workers via `@astrojs/cloudflare@^14` |
| State | `nanostores@^1.4` (cart store, shared across vanilla-JS islands) |
| Styling | Plain CSS (`src/styles/*.css`) — **no Tailwind**, no CSS framework |
| Interactivity | Vanilla JS in `<script>` blocks — **no React/Vue** |
| Content | Astro content collections (YAML / Markdown / MDX) |
| Commerce | Shopify Storefront API `2026-04` + Customer Account API `2025-01` |
| Node | `>=22.12.0`, package manager **npm** |

**Version compatibility — do not bump blindly.** `astro@7` ⇄ `@astrojs/cloudflare@^14` are mutually locked (the unified Worker entrypoint is version-tied). Also `@astrojs/mdx@^7`, `@astrojs/sitemap@^3`, `nanostores@^1`. No React or Tailwind in the tree — don't add them back. PKCE uses the Web Crypto API (`crypto.subtle`), so it runs on Workers without extra polyfills.

---

## Features

**Storefront**
- **Home** — rotating hero, new arrivals, best-sellers, category grid, campaign banner, scrolling marquee, curated lookbook with product hotspots, style feed, testimonials, journal (blog) teasers, newsletter.
- **Collections** — index + per-collection product listing with sort and bidirectional cursor pagination.
- **All products** — full catalogue listing with sort, faceted filters (price/category/colour/size/availability derived from the **real** catalogue), and pagination.
- **Product (PDP)** — image gallery, variant + colour-swatch selector, quantity, **Add to cart** + **Buy it now**, rich-text details, specs / highlights / materials & care / reviews (from metafields), real-time stock + low-stock labels, **real Shopify Local Pickup** availability per variant, recommendations, sticky add-to-cart bar.
- **Cart** — slide-over drawer **and** a full cart page; free-shipping progress bar, quantity/remove, discount codes, **gift wrap / order notes / gift message / protection plan** extras, subtotal, **Checkout** → Shopify hosted checkout.
- **Search** — full results page (sort + pagination) and header instant search.
- **Wishlist** — header drawer + full `/wishlist` page (client-side, `localStorage` `marvexa_wishlist`).
- **Compare** — `/compare` side-by-side, add-to-cart from the table (client-side `localStorage` `marvexa_compare`).
- **Blog (Journal)** — MDX posts, author pages, tags, content collections.
- **Static pages** — About, Contact (demo form), plus Shopify CMS pages at `/pages/[handle]`.

**Account & platform**
- **Account** — Shopify Customer Account API (OAuth 2.0 + PKCE) login / logout / order overview.
- **Multi-currency** — active market resolved per-request (cookie → `cf-ipcountry` → default), threaded into catalogue prices and the cart's buyer identity so currency never drifts. See [Markets & multi-currency](#markets--multi-currency).
- **Navigation** — sticky header driven by **live Shopify collections**, mega menu + mobile nav.
- Custom 404, SEO meta + Open Graph + JSON-LD, sitemap, `robots.txt`, accessibility (skip link, focus-trapped drawers, WCAG AA contrast), reduced-motion support.

---

## Quick start

```bash
npm install
cp .env.example .env     # then fill in your Shopify credentials (see below)
npm run dev              # http://localhost:4321
```

The store renders with whatever products/collections exist in your Shopify store. Empty store → empty grids; that's expected until you add products. See [Shopify store setup](#shopify-store-setup) to light up every feature.

---

## Environment variables

Server-only secrets (no `PUBLIC_` prefix → **never shipped to the browser**). Defined in `astro.config.mjs` (`env.schema`) and read at request time via `getSecret()`. Locally, copy `.env.example` → `.env` (or use `.dev.vars` for wrangler).

| Variable | Required | Description |
|---|---|---|
| `SHOPIFY_SHOP_DOMAIN` | ✅ | `your-shop.myshopify.com` |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | ✅ | Storefront API **private** token (header `Shopify-Storefront-Private-Token`) |
| `SHOPIFY_API_VERSION` | optional | Pinned Storefront API version — defaults to `2026-04` |
| `CUSTOMER_ACCOUNT_API_CLIENT_ID` | login only | Customer Account API client id |
| `SHOPIFY_SHOP_ID` | login only | Numeric shop id for the Customer Account API |
| `CUSTOMER_ACCOUNT_API_VERSION` | login only | Pinned Customer Account API version — `2025-01` |

**Where to get the Storefront token:** Shopify admin → install the **Headless** sales channel (or **Hydrogen**) → it exposes a **private** Storefront API token. Use the *private* one (not the public `X-Shopify-Storefront-Access-Token`), and **publish your products/collections to that channel** or the API won't return them.

> ⚠️ The **Customer Account API rejects `http` and `localhost`.** For local login, expose the dev server over a public HTTPS origin (e.g. a tunnel). The app derives the origin from `X-Forwarded-Proto`/`Host` (see `src/lib/shopify/customer/origin.ts`), so it works behind tunnels automatically. Storefront browsing/cart/checkout work fine on plain `localhost`; only login needs the tunnel.

---

## Shopify store setup

This is what turns demo placeholders into a live store. Nothing here needs code edits — it's all data you create in the Shopify admin. The template looks features up **by handle / tag / metafield**, so each lights up automatically when the matching data exists, and **hides itself cleanly when it doesn't** (no broken toggles).

### 1. Products & collections (required)
- **Publish** all products and collections to the same sales channel your Storefront token belongs to (Headless / Online Store). Unpublished items are invisible to the API.
- The home page pulls **new arrivals** and **best-sellers** from your catalogue automatically; a **sale** item = a product with a compare-at price.

### 2. Navigation (recommended)
- The header is driven by your **live Shopify collections** — create and publish collections and they appear in the nav and mega menu. No content fallback file to maintain.

### 3. "Shop by lifestyle" collections (optional)
- Create collections with handles prefixed `for-` (e.g. `for-gamers`, `for-creators`, `for-athletes`, `for-music-lovers`, `for-remote-work`).
- Title / product count / image / link come from Shopify; the icon + display order are set in `src/config/marvexa.ts` → `LIFESTYLE_CARDS`. An unlisted `for-*` collection still shows (appended last, default icon).

### 4. Product metafields (optional — enrich the PDP)
All `reviews` or `custom` namespace metafields; absent ones are simply skipped.

| Metafield | Powers |
|---|---|
| `reviews.rating` | Star rating on cards + PDP |
| `reviews.rating_count` | Review count |
| `custom.specifications` | PDP spec table (label/value rows) |
| `custom.highlights` | PDP highlight bullets |
| `custom.materials_care` | PDP "Materials & care" panel |
| `custom.shipping_returns` | PDP "Shipping & returns" panel |
| `custom.reviews` (or `reviews.reviews`) | Individual review entries |

The `reviews.rating` / `reviews.rating_count` fields are also written by review apps (Judge.me, Yotpo, Shopify Product Reviews) — install one and ratings appear with no extra work.

### 5. Cart-extra products (optional — see [Cart extras](#cart-extras-gift-wrap-notes-protection))
- `gift-wrap` and `order-protection` products (paid extras). Created in admin, found by handle.

### 6. Local pickup (optional — PDP pickup block)
- The PDP shows a **real** "Free pickup available at …" block driven by Shopify **Local Pickup** (`storeAvailability`), per selected variant.
- Enable at **Settings → Shipping and delivery → Local pickup** for a location, set the prep time (e.g. "Usually ready in 24 hours"), and keep the variant stocked at that location. The block hides automatically when no location offers pickup for the selected variant; "Check other stores" appears only with 2+ locations.

### 7. Free-shipping rate (the meter is ON by default)
- The cart free-shipping meter is **on** (`freeShippingThreshold: 99`). ⚠️ **The meter is display only — it does not create a shipping rate.** You **must** add a matching "Free, over $99" rate per zone in **Settings → Shipping and delivery**, or the cart promises a discount checkout never honours. To hide the meter for a store with no free shipping, set the threshold to `0` / `null` (see [config](#brand--feature-config-srcconfigmarvexats)).

---

## Project layout

```
src/
  config/marvexa.ts          Brand identity, market defaults, cart-extras, lifestyle map (single source of truth)
  content.config.ts          Content-collection schemas (Zod)
  content/                   Editable editorial content (YAML / MD / MDX) — see below
  middleware.ts              Resolve the active market once per request → Astro.locals.market
  layouts/Layout.astro       HTML shell — SEO <head>, fonts (Plus Jakarta Sans + Inter), chrome
  assets/images/             Local demo images (pre-optimized via Astro <Image>)
  styles/
    marvexa.css              Design system — tokens (colors, fonts, radii, motion) + base
    drawers.css              Cart / overlay drawer styles
    product.css cart.css about.css contact.css blog.css blog-detail.css   Per-page styles

  components/
    ui/marvexa/              Icon, PageHeader
    seo/                     SEO.astro
    layout/marvexa/          Header, Footer, Announcement, CartDrawer, Overlays (search/wishlist/compare)
    home/marvexa/            Hero, NewArrivals, BestSellers, Categories, Campaign, Marquee,
                             Lookbook, StyleFeed, Testimonials, Journal, Newsletter
    product/marvexa/         ProductCard, ProductGrid

  lib/
    shopify/
      client.ts              Server fetch client (private token, retries, buyer-IP forwarding, @inContext, ShopifyError)
      graphql/*.ts           Raw GraphQL strings by domain (cart/collections/products/search/content) + fragments.ts
      services/*.ts          Typed fetch + transform functions
      transforms.ts          Shopify edges/node → clean domain shapes
      types.ts               Domain types
      pagination.ts sort-options.ts
      customer/*.ts          Customer Account API (OAuth + PKCE): client, oauth, pkce, session, origin, queries
      index.ts               Barrel — import everything as ~/lib/shopify
    market.ts                Market resolve/normalize + applyMarketCache (edge cache, market-safe)
    cart-server.ts           ensure-cart / cookie-sync / self-healing + json() helper
    cart-cookie.ts           httpOnly cart-id cookie
    cart-extras.ts           Resolve handle-based CART_EXTRAS → render-ready (looked up live)
    asset.ts money.ts pagination.ts

  stores/cart.ts             nanostore cart — shared by header badge, drawer, PDP buttons
  pages/                     Routes (see below)
public/                      robots.txt, favicons, og-image.png + static assets
```

`~/*` is a path alias for `src/*`. `maison-modern-html/` is the static HTML design reference — not part of the build.

---

## Pages

| Route | File | Data | Notes |
|---|---|---|---|
| `/` | `pages/index.astro` | Shopify + content | Full home layout |
| `/products` | `pages/products/index.astro` | Shopify | Catalogue, sort + faceted filters + pagination |
| `/products/[handle]` | `pages/products/[handle].astro` | Shopify | PDP |
| `/collections` | `pages/collections/index.astro` | Shopify | Collections index |
| `/collections/[handle]` | `pages/collections/[handle].astro` | Shopify | Per-collection listing |
| `/cart` | `pages/cart.astro` | Shopify | Full cart page + extras |
| `/search` | `pages/search.astro` | Shopify | Results, sort + pagination |
| `/wishlist` | `pages/wishlist.astro` | client | localStorage `marvexa_wishlist` |
| `/compare` | `pages/compare.astro` | Shopify + client | localStorage `marvexa_compare` |
| `/blog` | `pages/blog/index.astro` | content | MDX posts (Journal) |
| `/blog/[slug]` | `pages/blog/[slug].astro` | content | Post |
| `/blog/author/[slug]` | `pages/blog/author/[slug].astro` | content | Author page |
| `/about` | `pages/about.astro` | static | Brand story (editorial copy inline) |
| `/contact` | `pages/contact.astro` | static | Demo contact form (client success view) |
| `/pages/[handle]` | `pages/pages/[handle].astro` | Shopify | Shopify CMS pages |
| `/account` | `pages/account/index.astro` | Customer API | Order overview (login required) |
| `404` | `pages/404.astro` | — | Custom 404 |

Auth route handlers: `pages/account/{login,authorize,logout}.ts`.

---

## API routes

All under `pages/api/*`, `prerender = false`, same-origin only. They validate input (variant ids must start with `gid://shopify/ProductVariant/`, quantities clamped), forward the buyer IP, and return `{ cart, userErrors }` (or `{ cart: null, error }` on 500).

| Route | Purpose |
|---|---|
| `POST /api/cart/add` | Add a line to the persistent cart |
| `POST /api/cart/update` | Change a line quantity |
| `POST /api/cart/remove` | Remove a line |
| `POST /api/cart/discount` | Apply / clear a discount code |
| `POST /api/cart/note` | Save cart note (→ admin order **Notes**) |
| `POST /api/cart/attributes` | Save cart attributes (e.g. gift message) |
| `POST /api/cart/buy-now` | One-off cart for immediate checkout (leaves persistent cart untouched) |
| `GET  /api/cart` | Read current cart |
| `GET  /api/search` | Header instant-search results |
| `POST /api/market` | Switch the active market (sets the market cookie) |

---

## Editable content (content collections)

Editorial copy lives in `src/content/` — edit these files (no code) to change site text. Schemas are in `src/content.config.ts`. Images are bare filenames resolved from `src/assets/images` via `~/lib/asset` and optimized with Astro `<Image>`.

| File | Type | Drives |
|---|---|---|
| `announcements.yaml` | YAML list | Top announcement bar items |
| `footer.yaml` | YAML | Footer columns, blurb, app badges, payments, legal |
| `hero.yaml` | YAML | Home hero (lead card + rotating slides + companion card) |
| `trust.yaml` | YAML list | Trust-bar items |
| `proof.yaml` | YAML list | Best-sellers proof strip stats |
| `promo.yaml` | YAML list | Promo banners |
| `marquee.yaml` | YAML list | Scrolling marquee items |
| `lookbook.yaml` | YAML | Lookbook image + product hotspots (each pins a Shopify `handle`, or falls back to best-sellers) |
| `spotlight.yaml` | YAML | Product spotlight section |
| `compare.yaml` | YAML list | "Compare top models" columns — `handle` pulls product live; specs/badge stay editorial |
| `brands.yaml` | YAML list | Brand strip logos |
| `newsletter.yaml` | YAML | Newsletter section copy |
| `testimonials/*.md` | Markdown | Customer testimonials (quote, author, rating, avatar) |
| `blog/*.mdx` | MDX | Blog posts (title, excerpt, image, tags, date, author) |
| `authors.yaml` | YAML | Blog authors, keyed by slug |

Note: lookbook hotspots and compare columns are **hybrid** — editorial layout, live Shopify product data (price/image/link) when you set a `handle`.

---

## Brand & feature config (`src/config/marvexa.ts`)

Single source of truth for stable brand identity referenced from code (section *content* lives in content collections).

- `DEFAULT_COUNTRY` / `DEFAULT_LANGUAGE` — the **fallback** market (default `'US'` / `'EN'`). The active market is resolved per-request (cookie → `cf-ipcountry` → these defaults) in `src/middleware.ts`; see [Markets & multi-currency](#markets--multi-currency).
- `BRAND` — name, legal name, tagline, description, `freeShippingThreshold`, social links.

> **Free-shipping meter (`freeShippingThreshold`).** Drives the cart "Add $X more to unlock FREE shipping" bar. Set a number (default `99`) to show it, or `0` / `null` to **turn it off and hide it** for stores with no free shipping. ⚠️ **The meter is display only — it does not create a shipping rate.** If you keep it on, you **must** add a matching free-shipping rate in Shopify (Settings → Shipping and delivery → "Free, over $99"), or the cart promises free shipping the customer never gets at checkout.

- `CART_EXTRAS` — gift wrap / order notes / protection config (see below).
- `LIFESTYLE_CARDS` — `for-*` collection handles → icon + order for the shop-by-lifestyle grid. Icon names must exist in `ui/marvexa/Icon.astro`.

---

## Cart extras (gift wrap, notes, protection)

Three optional add-ons on the cart page. **All write to the real Shopify cart** — nothing is fake. Configured in `src/config/marvexa.ts` → `CART_EXTRAS`.

| Extra | What it does | Needs a product? |
|---|---|---|
| **Order notes** | Saves to cart `note` → admin order **Notes** | No — works out of the box |
| **Gift message** | Saves to cart `attribute` → admin order **Additional details**. Lives in the Gift Wrap box | No (shows only when Gift Wrap does) |
| **Gift wrap** (paid) | Adds a real product line so the customer is **charged** | Yes |
| **Protection plan** (paid) | Adds the chosen plan as a real product line (charged) | Yes |

> Money can only be charged through a real Shopify **product** — a storefront cart can't add arbitrary fees. So the two paid extras are backed by products you create. They're looked up **by handle**, so it works on any store with no code edit. A paid extra is **hidden automatically** when its product isn't found, isn't published, or is sold out.

### Setup — Gift Wrap
1. **Products → Add product.** Title `Gift Wrap` (handle becomes `gift-wrap`, matching the config).
2. Price e.g. `12.00`.
3. **Inventory → uncheck "Track quantity"** (never shows sold out).
4. **Shipping → uncheck "This is a physical product."**
5. **Status: Active**, and **publish it to the channel your Storefront token uses.** ⚠️ Unpublished = can't add to cart.

### Setup — Order Protection
1. **Products → Add product.** Title `Order Protection` (handle `order-protection`).
2. Add a variant **option** (e.g. `Plan`) with values matching the config **exactly**:
   - `Essential`
   - `Premium`
3. Set each variant's price (e.g. `49`, `99`).
4. Untrack inventory, not a physical product, **Active + published**.

### Customising
In `CART_EXTRAS`: `enabled: false` hides an extra; `handle` overrides the product slug; `protection.plans[].optionValue` must equal the Shopify variant's option value exactly (that's the mapping); `label`/`desc`/`maxLength` are display only — **prices shown come from the live variant**, not config.

**Where data lands for the merchant:** order notes → order **Notes**; gift message → order **Additional details**; gift wrap / protection → ordinary paid line items.

---

## Markets & multi-currency

Multi-currency is **live**. The active market (country + language) is resolved **once per request** in `src/middleware.ts` (`resolveMarket`: cookie → `cf-ipcountry` → `DEFAULT_COUNTRY`) and exposed on `Astro.locals.market`.

- Catalogue queries pass `@inContext(country:, language:)` via `shopifyFetch(..., { inContext: market })`, so card/PDP prices are in the visitor's market currency.
- The cart's `buyerIdentity.countryCode` is pinned + self-healed to the same market, so cart and checkout currency **never drift** from the product cards.
- `POST /api/market` switches markets (writes the market cookie); fallback country/language live in `src/config/marvexa.ts`.

To restrict to a single currency, just leave every visitor on the default market (don't surface the switcher).

---

## Customer accounts (login)

A separate OAuth 2.0 + PKCE flow (`lib/shopify/customer/*`) with its own endpoint and token, distinct from the Storefront API.

**Enable it in Shopify:**
1. Settings → **Customer accounts** → enable **New customer accounts**.
2. Open the **Headless / Hydrogen** channel → **Customer Account API**.
3. In **Application setup**, register all three (use your public HTTPS origin — Shopify rejects `http`/`localhost`):
   - **Callback URI:** `https://YOUR_HOST/account/authorize`
   - **JavaScript origin:** `https://YOUR_HOST`
   - **Logout URI:** `https://YOUR_HOST`
4. Copy the **Client ID** and numeric **Shop ID** into your env vars.

The client auto-refreshes the access token, re-persists cookies, and sends the raw token as `Authorization` (**not** `Bearer <token>`). Routes: `pages/account/{login,authorize,logout}.ts`, page `pages/account/index.astro`.

---

## Customising the design

No build step for CSS — edit `src/styles/*.css` directly.

**Design tokens** live at the top of `src/styles/marvexa.css` (`:root`). Change these to re-skin globally:

```css
--bg: #FAFAF7;        /* page background */
--bg2: #F0EEE9;       /* soft stone secondary */
--card: #E8E4DC;      /* warm gray card */
--dark: #1D1D1B;      /* graphite dark section / footer */
--text: #111111;      /* primary text */
--muted: #666666;     /* secondary text */
--border: #D8D5CE;    /* divider line */
--accent: #7A8F3A;    /* electric olive — CTA hover, labels, selected */
--accent-dk: #617230; /* accent pressed/hover */
--rust: #B4573F;      /* rust — sale / limited labels */
--fh: 'Plus Jakarta Sans', sans-serif;   /* headings */
--fb: 'Inter', sans-serif;               /* body / UI */
--container: 1280px;            /* max content width */
--ease / --ease-md             /* motion */
```

- **Fonts** are loaded in `src/layouts/Layout.astro` from Google Fonts (Plus Jakarta Sans + Inter). Swap the `<link>` and the `--fh` / `--fb` tokens to change them.
- `marvexa.css` is the design system + base; `drawers.css` covers the cart/overlay drawers; the rest (`product`, `cart`, `about`, `contact`, `blog`, `blog-detail`) are page-scoped.
- Accessibility: a skip link, focus-trapped drawers, AA-contrast `--muted`, and reduced-motion are respected.

**Before deploying:**
1. Set `site` in `astro.config.mjs` to your production domain (also update `public/robots.txt`).
2. Set `name` in `wrangler.toml` to your Worker name.
3. Fill `BRAND` in `src/config/marvexa.ts` (incl. real social URLs — placeholder homepages are dropped from JSON-LD).
4. Replace placeholder demo images in `src/assets/images` and `public/` (incl. `public/og-image.png`).
5. Edit the content files in `src/content/` (hero, footer, testimonials, blog…).

---

## Architecture

```
Browser ──▶ Astro SSR pages / same-origin /api/* ──▶ Shopify Storefront API (private token)
                                  │
   Vanilla JS islands ◀── nanostores cart store ──▶ /api/cart/* (httpOnly cart-id cookie)
```

- **The browser never talks to Shopify directly.** All Shopify traffic flows through `lib/shopify/client.ts` (`shopifyFetch`), imported only by server code (Astro frontmatter + `/api` routes). The private token stays server-side; clients only hit same-origin `/api/*`.
- **Layered data flow** (keep this separation when adding features): `client.ts` (fetch) → `graphql/*.ts` (raw queries) → `services/*.ts` (typed fetch + transform) → `transforms.ts` (edges/node → domain shapes) → `types.ts`. Barrel-import everything from `~/lib/shopify`.
- **Cart state** is a framework-agnostic nanostore (`stores/cart.ts`) — the right tool because the header badge, drawer, and PDP buttons are independent vanilla-JS islands that must stay in sync. The store has deliberate concurrency control (a monotonic request `seq` so a slow earlier reply can't clobber a fresher one, and a ref-counted busy flag). Mutations call `/api/cart/*` and replace the store with the server's authoritative cart.
- **Cart identity** is an httpOnly `cart-id` cookie with **self-healing** — a stale/expired cart id is cleared and a fresh cart created on the next add. Checkout redirects to Shopify's hosted `cart.checkoutUrl`; there is no custom checkout.
- **Markets** are resolved per-request and threaded into catalogue queries (`@inContext`) + cart buyer identity, so currency stays consistent (see [Markets & multi-currency](#markets--multi-currency)).
- **Client-only state.** Wishlist and Compare live in the browser's `localStorage` (`marvexa_wishlist`, `marvexa_compare`) — they're per-device, not tied to the customer account, and clear with the browser's site data. No server storage.

---

## Performance & caching

Catalogue-driven SSR pages set a **market-safe** edge cache header (`applyMarketCache` in `src/lib/market.ts`) so Cloudflare serves them fast and revalidates in the background. Applied to the **home, all-products, collection, and product** pages.

```
# default market (shared CDN — full performance)
Cache-Control: public, max-age=0, s-maxage=120, stale-while-revalidate=600
# any non-default market
Cache-Control: private, no-store
```

What it means:

- The HTML is **shopper-agnostic within a market** (cart + account are client-side), so the default market's page is safe to share across visitors. The CDN serves a cached page for up to **120s** (`s-maxage`), then refreshes; for up to **600s** it may serve a stale page while revalidating. Browsers always revalidate (`max-age=0`).
- A localized (non-default-market) page is served `private, no-store` so a page priced in one currency is never replayed to another.
- **If you edge-cache multiple markets,** add the `fl_market` cookie to your CDN cache key (e.g. a Cloudflare Cache Rule) so each market caches independently.
- **Trade-off:** a product/price/inventory edit in Shopify can take up to ~2 minutes to appear on the default-market pages. Lower `s-maxage` for fresher data, raise it for less load. The cart, search, and account routes are never cached.

Images: local assets are pre-optimized at build (`src/assets/images` via Astro `<Image>`); Shopify product images are served straight from its CDN (`imageService: "passthrough"` — Workers has no sharp binary).

---

## Scripts

```bash
npm run dev       # dev server on http://localhost:4321 (Workers runtime via vite plugin)
npm run build     # production build → dist/ (Cloudflare Worker + static assets)
npm run preview   # build + preview on the Workers runtime (wrangler dev)
npm run deploy    # build + wrangler deploy
```

No test / lint scripts ship. Type checking comes from `astro/tsconfigs/strict`; run it manually with `npx astro check` (the only static gate).

---

## Deploy (Cloudflare Workers)

`npm run build` outputs a Cloudflare Worker to `dist/`. Deploy:

```bash
npx wrangler deploy
```

Set the **secrets** once per environment (never commit them):

```bash
npx wrangler secret put SHOPIFY_SHOP_DOMAIN
npx wrangler secret put SHOPIFY_STOREFRONT_PRIVATE_TOKEN
# …plus the Customer Account API secrets if you use login
```

Non-secret pins (`SHOPIFY_API_VERSION`, `CUSTOMER_ACCOUNT_API_VERSION`) live in `wrangler.toml [vars]`. Locally, secrets come from `.env` / `.dev.vars` via the Cloudflare platform proxy.

> ⚠️ `wrangler.toml` `main` **must** be `@astrojs/cloudflare/entrypoints/server` (the adapter's unified entry). Pointing it at the built `dist/_worker.js` path fails `astro build`, which clears `dist` during sync before the worker exists.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Product grids empty | Products/collections not **published** to the channel your Storefront token uses |
| Cart "add" fails / extras hidden | The product isn't published, is sold out, or the handle doesn't match the config |
| Login redirect rejected | Customer Account API can't use `http`/`localhost` — use a public HTTPS origin; check the three registered URIs |
| Currency drifts (cards vs cart) | Confirm the market is threaded — middleware sets `Astro.locals.market`; cart buyer identity follows it |
| Header nav empty | Create and **publish** Shopify collections — the nav is driven by live collections |
| "Free shipping unlocked" but customer charged shipping | The cart meter is display-only — add a matching free-shipping rate in Shopify, or set `freeShippingThreshold` to `0`/`null` to hide the meter |
| Ratings/specs missing on PDP | Add the matching product metafields (see [store setup](#shopify-store-setup)) |
| Pickup block missing on PDP | Enable Local Pickup for a location, stock the variant there, and publish the location to your channel (see store setup #6) |
| Shopify edits take ~2 min to show | Edge cache (`s-maxage=120`) on default-market catalogue pages — lower it in `applyMarketCache` for fresher data |
| `astro build` clears dist / worker error | `wrangler.toml` `main` must be `@astrojs/cloudflare/entrypoints/server` |

---

## License

MIT — see [LICENSE](LICENSE).
