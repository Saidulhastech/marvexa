# Marvexa — Headless Shopify Storefront Theme

A production-ready headless e-commerce storefront built with **Astro 7 (SSR)**, **nanostores**, and **plain CSS**, powered end-to-end by the **Shopify Storefront API `2026-04`** and the **Customer Account API `2025-01`**.

Zero UI framework — every page is server-rendered `.astro`; interactivity (cart drawer, search, wishlist, compare, overlays) is lightweight vanilla JS. Shared cart state lives in a framework-agnostic nanostore. Deploys to **Cloudflare Workers** (`@astrojs/cloudflare`).

Design direction: *Marvexa* — modern fashion editorial. **Plus Jakarta Sans** display + **Inter** body, an electric-olive accent with a rust sale label, on a warm stone palette.

> **No fake commerce data.** Products, collections, prices, variants, stock, search, cart, checkout, local pickup, customer login, and the **blog** are all live Shopify. Only pure marketing copy is static (hero text, testimonials, trust badges, About/Contact, shipping blurbs) — it lives in editable content files and `.astro` pages, so nothing dishonest ships by default.

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
11. [Cart extras (gift wrap, notes)](#cart-extras-gift-wrap-notes)
12. [Markets & multi-currency](#markets--multi-currency)
13. [Customer accounts (login)](#customer-accounts-login)
14. [Customising the design](#customising-the-design)
15. [Architecture](#architecture)
16. [Performance & caching](#performance--caching)
17. [Scripts](#scripts)
18. [Deploy (Cloudflare Workers)](#deploy-cloudflare-workers) — also see [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel/Netlify/Node
19. [Troubleshooting](#troubleshooting)
20. [License](#license)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 7, `output: "server"` (SSR) |
| Hosting | Cloudflare Workers via `@astrojs/cloudflare@^14` (default) — also ships `@astrojs/node`, `@astrojs/vercel`, `@astrojs/netlify` for portability, see [Alternative deploy targets](#alternative-deploy-targets-node--vercel--netlify) |
| State | `nanostores@^1.4` (cart store, shared across vanilla-JS islands) |
| Styling | Plain CSS (`src/styles/*.css`) — **no Tailwind**, no CSS framework |
| Interactivity | Vanilla JS in `<script>` blocks — **no React/Vue** |
| Content | Astro content collections (YAML / Markdown / MDX) |
| Commerce | Shopify Storefront API `2026-04` + Customer Account API `2025-01` |
| Node | `>=22.12.0`, package manager **npm** |

**Version compatibility — do not bump blindly.** `astro@7` ⇄ `@astrojs/cloudflare@^14` are mutually locked (the unified Worker entrypoint is version-tied); the other installed adapters are pinned the same way (`@astrojs/node@^11`, `@astrojs/vercel@^11`, `@astrojs/netlify@^8` — bump alongside `astro`, not independently). Also `@astrojs/mdx@^7`, `@astrojs/sitemap@^3`, `nanostores@^1`. No React or Tailwind in the tree — don't add them back. PKCE uses the Web Crypto API (`crypto.subtle`), so it runs on any of the above adapters without extra polyfills.

---

## Features

**Storefront**
- **Home** — rotating hero, new arrivals, best-sellers, category grid, campaign banner, scrolling marquee, curated lookbook with product hotspots, style feed, testimonials, journal (blog) teasers, newsletter.
- **Collections** — index + per-collection product listing with sort and bidirectional cursor pagination.
- **All products** — full catalogue listing with sort, faceted filters (price/category/colour/size/availability derived from the **real** catalogue), and pagination.
- **Product (PDP)** — image gallery, variant + colour-swatch selector, quantity, **Add to cart** + **Buy it now**, rich-text details, specs / highlights / materials & care / reviews (from metafields), real-time stock + low-stock labels, **real Shopify Local Pickup** availability per variant, recommendations, sticky add-to-cart bar.
- **Cart** — slide-over drawer **and** a full cart page; free-shipping progress bar, quantity/remove, discount codes, **gift wrap / order notes / gift message** extras, subtotal, **Checkout** → Shopify hosted checkout.
- **Search** — full results page (sort + pagination) and header instant search.
- **Wishlist** — header drawer + full `/wishlist` page (client-side, `localStorage` `marvexa_wishlist`).
- **Compare** — `/compare` side-by-side, add-to-cart from the table (client-side `localStorage` `marvexa_compare`).
- **Blog (Journal)** — Shopify's native blog. Posts, tags, and author profiles (name/role/bio/avatar/twitter) are all managed in Shopify admin — see [Blog (Journal) setup](#12-blog-journal--shopifys-native-blog).
- **Static pages** — About, Contact (demo form), plus Shopify CMS pages at `/pages/[handle]`.

**Account & platform**
- **Account** — Shopify Customer Account API (OAuth 2.0 + PKCE) login / logout / order overview.
- **Multi-currency** — active market resolved per-request (cookie → `cf-ipcountry` → default), threaded into catalogue prices and the cart's buyer identity so currency never drifts. See [Markets & multi-currency](#markets--multi-currency).
- **Navigation** — sticky header with Women/Men mega menus + mobile nav. Menu structure (columns/labels) is hardcoded in `Header.astro`, **not** driven by Shopify collections; every link points at a real `/products` filter (`?cat=`, `?mat=`, `?max=`) computed from the live catalogue, and the "X% Off" sale badge shows the actual deepest live markdown (hidden when nothing's on sale). See [store setup #5](#shopify-store-setup) for what this means for adding new categories.
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
| `JUDGEME_PRIVATE_TOKEN` | reviews only | Judge.me API token — server-only, powers individual review cards on the PDP + review submission (Judge.me admin → **Settings → API**) |
| `JUDGEME_PUBLIC_TOKEN` | not currently used | Reserved for a future client-side widget; safe to leave unset |

**Where to get the Storefront token:** Shopify admin → install the [**Headless**](https://apps.shopify.com/headless) sales channel (or **Hydrogen**) → it exposes a **private** Storefront API token. Use the *private* one (not the public `X-Shopify-Storefront-Access-Token`), and **publish your products/collections to that channel** or the API won't return them.

> ⚠️ The **Customer Account API rejects `http` and `localhost`.** For local login, expose the dev server over a public HTTPS origin (e.g. a tunnel). The app derives the origin from `X-Forwarded-Proto`/`Host` (see `src/lib/shopify/customer/origin.ts`), so it works behind tunnels automatically. Storefront browsing/cart/checkout work fine on plain `localhost`; only login needs the tunnel.

---

## Shopify store setup

This is what turns demo placeholders into a live store. Nothing here needs code edits — it's all data you create in the Shopify admin. The template looks features up **by handle / tag / metafield**, so each lights up automatically when the matching data exists, and **hides itself cleanly when it doesn't** (no broken toggles).

### 1. Products & collections (required)
- **Publish** all products and collections to the same sales channel your Storefront token belongs to (Headless / Online Store). Unpublished items are invisible to the API — this is the #1 cause of "I created it in admin but it's not showing" (see "Shop the Look collections" below, a common trip-up).
- A **sale** item = a product with a compare-at price.

### 2. New Arrivals collection (optional — falls back automatically)
- The home page's "New Arrivals" section reads a real Shopify **Collection** with handle **`new-arrivals`** (`NEW_ARRIVALS_COLLECTION_HANDLE` in `src/config/marvexa.ts`), up to 8 products (fewer if any overlap with Best Sellers, which are excluded so nothing shows twice).
- Sort it however you like in admin — **Manual** for hand-picked order, or **Automated** (e.g. "Date, new to old") to self-update. The storefront just reads the collection's own order.
- Also drives the section footer's total count + "View All" link (→ `/collections/new-arrivals`).
- If the collection doesn't exist yet, is empty, or isn't published to your Storefront channel, the section **falls back automatically** to the newest-created products from a live `sortKey: CREATED_AT` catalogue query, and "View All" points at `/products` instead — never a broken/empty section.

### 3. Best Sellers collection (optional — falls back automatically)
- The home page's "Best Sellers" section reads a real Shopify **Collection** with handle **`best-sellers`** (`BEST_SELLERS_COLLECTION_HANDLE` in `src/config/marvexa.ts`), top 3 products.
- Two ways to run it: a **Manual** collection you hand-pick and drag-order, or an **Automated** one with a "Total sold" descending rule that self-updates. Either works — the storefront just reads whatever's in it (respects the collection's own sort/manual order).
- If the collection doesn't exist yet, is empty, or isn't published to your Storefront channel, the section **falls back automatically** to the top 3 products from a live `sortKey: BEST_SELLING` catalogue query — never a broken/empty section.

### 4. Shop the Look collections (optional — falls back to nothing shown)
- The home page's "Shop the Look" section is **3 real Shopify Collections**, one per look: handles **`lookbook1`**, **`lookbook2`**, **`lookbook3`** (`LOOKBOOK_COLLECTION_HANDLES` in `src/config/marvexa.ts`). Add more handles there if you want a 4th+ look.
- Per collection: **Title** → the look's on-page label, **Collection image** → the editorial look photo, **member products** (up to 3, in the collection's own manual sort order) → the outfit pieces shown as hotspot pins on the photo.
- **Publish every one of the 3 collections** to your Storefront sales channel — a collection that exists in admin but isn't published returns nothing to the API and that look is silently skipped (this bites people: creating the collection isn't enough, it must be *published*).
- Shopify has no per-product x/y coordinate on a collection, so hotspot pin position on the photo is a **fixed preset** in code (`LOOKBOOK_HOTSPOT_SLOTS`, same config file) applied by product order — 1st product → pin 1, 2nd → pin 2, 3rd → pin 3, same 3 positions reused for every look. Edit that constant to reposition pins for your photos.
- A missing/empty/unpublished look collection is simply skipped — the other looks still render.

### 5. Navigation
- The mega-menu structure (Women/Men columns, sub-category labels) is **hardcoded** in `src/components/layout/marvexa/Header.astro` — creating a Shopify collection does **not** add it to the nav. Each link is generated as `/products?cat=<lowercased productType>` (or `?mat=`/`?max=` for the material/price shortcuts), matching the same real `productType` values the `/products` sidebar filters read.
- To add a category to the mega menu, edit the `MEGAS` array in `Header.astro` — a label only works if a real product in your catalogue has a matching `productType`; otherwise the link filters to zero results.
- The "X% Off" badges and the `/collections` index/pages **are** live: the mega menu's sale badge scans the real catalogue for the deepest `compareAtPrice` markdown, and `/collections`, `/collections/[handle]` are separate routes still driven entirely by your published Shopify collections (see [Pages](#pages)).

### 6. "Shop by lifestyle" collections (scaffolded, not wired up)
- The data layer already splits `for-*`-handle collections out from the rest (`getHomeCollectionGroups()` in `lib/shopify/services/collections.ts`), and `src/config/marvexa.ts` → `LIFESTYLE_CARDS` maps handle → icon/order for a future "Shop by lifestyle" grid.
- **Nothing currently renders it** — no page or component calls `getHomeCollectionGroups()`. Creating `for-*` collections in Shopify has no visible effect on the storefront today. Wire it into a home component (mirroring how `Categories.astro` consumes the plain collections list) if you want to use it.

### 7. Product metafields (optional — enrich the PDP)
All `reviews` or `custom` namespace metafields; absent ones are simply skipped. Every "List of Single line text" field below follows the same setup: Settings → Custom data → Metafield definitions → **Products** → Add definition → Name it (key auto-fills, must match the table exactly) → Type **Single line text** → switch the cardinality dropdown next to the type (labeled "One") to **List** → toggle **Storefront API access** ON → Save. Then per product → Metafields → add one row per bullet.

| Metafield | Type | Powers | Fallback when unset |
|---|---|---|---|
| `reviews.rating` | Decimal | Star rating on cards + PDP | Hidden |
| `reviews.rating_count` | Integer | Review count | Hidden |
| `custom.specifications` | JSON *(or List of Single line text `Label: Value`)* | PDP spec table (label/value rows) | Falls back to real Vendor/Type/SKU fields only — never fabricated. Card hides entirely if none of that exists either |
| `custom.highlights` | List of Single line text | PDP Product Description bullet list | **Hidden** — no fallback (tags are filter facets, not customer copy, so they're deliberately never shown here) |
| `custom.materials_care` | List of Single line text | PDP "Materials & Care" accordion | Generic boilerplate text (same on every product until you set this) |
| `custom.shipping_returns` | List of Single line text | PDP "Shipping & Returns" **accordion** (left column, under Materials & Care) | Generic boilerplate text |
| `custom.returns_policy` | List of Single line text | PDP "Returns Policy" **sidebar card** (right column — a separate block from the Shipping & Returns accordion, same idea, different spot on the page) | Generic boilerplate text |
| `custom.reviews` (or `reviews.reviews`) | JSON | Individual review entries | Hidden |
| `custom.saves_count` | Integer | "N people saved this" next to the rating row. Merchant-set (no live wishlist tracking backend) | Hidden |
| `custom.size_chart` | Metaobject reference (type `size_chart`) | Pins an exact size chart to this one product, overriding the productType-level match | Falls back to the productType match, then the static universal chart — see [Size Guide setup #8](#8-size-guide-optional--falls-back-to-a-static-chart) |
| `custom.processing_days` | Integer | Per-product override for the "Order today for delivery by [date]" estimate | Falls back to `DELIVERY_ESTIMATE_DAYS` in [config](#brand--feature-config-srcconfigmarvexats) (default `5`) |

The `reviews.rating` / `reviews.rating_count` fields are also written by review apps (Judge.me, Yotpo, Shopify Product Reviews) — install one and ratings appear with no extra work.

**Individual review cards (optional, Judge.me only).** The star-rating summary above works with any review app via metafields, but the PDP's individual review cards are fetched live from Judge.me's own API — a separate integration:
1. Install [Judge.me](https://apps.shopify.com/judgeme).
2. Judge.me admin → **Settings → API** → copy the private token into `JUDGEME_PRIVATE_TOKEN`.
3. Judge.me admin → turn on **"Enable product metafields"** so the aggregate rating/count sync to the `reviews.rating` / `reviews.rating_count` metafields above.
Without `JUDGEME_PRIVATE_TOKEN` set, the PDP just skips the review cards (`judgemeConfigured()` returns false) — no error, no broken UI.

> **"You may also like" needs zero setup.** It's Shopify's native `productRecommendations` API — algorithmic (based on sales data / collection / tags / product type), no collection to create, no metafield. Section just hides if Shopify returns none.

### 8. Size Guide (optional — falls back to a static chart)
The PDP's "Size Guide" button/modal only appears on products that have a real Shopify size option (no fake button on sizeless products — `hasSizeOption` in `pages/products/[handle].astro`). Its table content resolves in priority order:

1. **The product's own `custom.size_chart` metafield** (see the metafields table above) — an exact override for that one product.
2. **A `size_chart` Metaobject whose `product_type` matches the product's Shopify Type field** (Organization → Type on the product — not the standardized "Category" field, and not tags).
3. **A static universal chart baked into the page** (XS–XXL, Bust/Waist/Hip/Shoulder) — always available, so Size Guide never breaks even with zero setup.

**One-time setup — create the `Size Chart` Metaobject definition:**
1. Settings → **Custom data** → Metaobject definitions → **Add definition**.
   - Name: `Size Chart` (type auto-fills `size_chart` — must stay exactly that)
   - Fields: `title` (Single line text, required — internal label only), `product_type` (Single line text, **not** required), `note` (Single line text, **not** required), `rows` (**JSON**, required)
   - Toggle **Storefronts API access** ON — required, or the storefront can't read entries.
   - Save.
2. Add an entry per garment category. `rows` is a JSON array of row objects — the **first row's keys become the table's columns**, so different charts can use different columns (e.g. Waist/Hip/Inseam for trousers vs Bust/Waist/Hip/Shoulder for tops):
   ```json
   [
     {"Size":"XS","Waist":"64–68","Hip":"88–92","Inseam":"76"},
     {"Size":"S","Waist":"68–72","Hip":"92–96","Inseam":"77"}
   ]
   ```
3. Set `product_type` to **exactly** match a real product's **Type** field (Product → Organization → Type — check the actual value in your catalogue, it's often broader than expected, e.g. `Women`/`Men` rather than a specific garment name). Leave it blank if this chart is only ever reached via a product's direct `custom.size_chart` link.

**Per-product override (optional):** Settings → Custom data → Metafield definitions → **Products** → Add definition → Name `Size Chart` (key auto-fills `custom.size_chart`) → Type → **Metaobject** → pick the **Size Chart** definition → Storefront API access ON. Then on any product → Metafields → Size Chart → pick an entry.

### 9. Cart-extra products (optional — see [Cart extras](#cart-extras-gift-wrap-notes))
- `gift-wrap` product (paid extra). Created in admin, found by handle.

### 10. Local pickup (optional — PDP pickup block)
- The PDP shows a **real** "Free pickup available at …" block driven by Shopify **Local Pickup** (`storeAvailability`), per selected variant.
- Enable at **Settings → Shipping and delivery → Local pickup** for a location, set the prep time (e.g. "Usually ready in 24 hours"), and keep the variant stocked at that location. The block hides automatically when no location offers pickup for the selected variant; "Check other stores" appears only with 2+ locations.

### 11. Free-shipping rate (the meter is ON by default)
- The cart free-shipping meter is **on** (`freeShippingThreshold: 99`). ⚠️ **The meter is display only — it does not create a shipping rate.** You **must** add a matching "Free, over $99" rate per zone in **Settings → Shipping and delivery**, or the cart promises a discount checkout never honours. To hide the meter for a store with no free shipping, set the threshold to `0` / `null` (see [config](#brand--feature-config-srcconfigmarvexats)).

### 12. Blog (Journal) — Shopify's native blog
The Journal (`/blog`, `/blog/[slug]`, `/blog/author/[slug]`, and the home page's latest-posts section) is **not** a content collection — it's driven entirely by Shopify's native **Blogs / Blog posts**, plus a **Metaobject** for author profiles. Everything below is admin-only, no code edits. Config lives in `src/config/marvexa.ts` → `BLOG` (blog handle + author metafield key).

**One-time setup — build the Author profile system:**

1. **Create the Author metaobject definition.**
   Settings → **Custom data** → scroll to **Metaobject definitions** → **Add definition**.
   - Name: `Author`
   - Add fields: `Name` (Single line text), `Role` (Single line text), `Bio` (Multi-line text), `Twitter` (Single line text), `Avatar` (Image/File)
   - Scroll to **Access** → toggle **Storefront API access** ON (required — without it the site can't read the data)
   - Save

2. **Create your author entries.**
   Settings → Custom data → Metaobjects → **Author** → **Add entry**. Fill in Name/Role/Bio/Twitter/Avatar for each writer. Check the auto-generated **handle** (e.g. "Sophie Laurent" → `sophie-laurent`) — it becomes the URL `/blog/author/sophie-laurent`; edit it if it looks wrong. Repeat per author.

3. **Link Author to Blog posts (a metafield, not the metaobject itself).**
   Settings → Custom data → **Metafield definitions** → **Blog posts** row → **Add definition**.
   - Name: `Author` (key auto-fills as `custom.author`, matching `BLOG.authorMetafield` in config)
   - **Type** — click the type dropdown (not the "One/List" cardinality one next to it) → search **Metaobject** → select it → pick your **Author** definition
   - Toggle **Storefront API access** ON
   - **Save**, and confirm the **Blog posts** row now shows `1` (if it still shows `0`, the definition didn't save — repeat this step)

**Per-post — attach an author (do this for every post):**

4. Content → **Blog posts** → open a post → scroll down to the **Metafields** section (appears once step 3 is saved) → **Author** → pick an entry → **Save**.
   > Don't confuse this with the **Organization → Author** field near the top of the post editor — that's Shopify's built-in staff-account author (shows your login name), unrelated to the metaobject-based author. The one you want is in **Metafields**, further down.

**Ongoing — publishing a new post:**
- Content → Blog posts → **Add blog post** → write it (title/content/excerpt/image/tags as usual) → set **Blog** to your configured blog (`BLOG.handle` in config, default `news`) → scroll to Metafields → set **Author** → publish.
- Category pill, reading time, and the featured/hero slot on `/blog` are all derived automatically — no fields for them: category = the post's first tag, reading time = word count, and the hero slot = whichever post is newest.

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
| `/blog` | `pages/blog/index.astro` | Shopify | Journal index — Shopify's native blog |
| `/blog/[slug]` | `pages/blog/[slug].astro` | Shopify | Post |
| `/blog/author/[slug]` | `pages/blog/author/[slug].astro` | Shopify | Author page (metaobject) |
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
| `POST /api/reviews` | Submit a customer review to Judge.me (validates rating/email/body server-side) — requires `JUDGEME_PRIVATE_TOKEN` |

---

## Editable content (content collections)

**4** collections are wired up in `src/content.config.ts` — edit these files (no code) to change that content. Images are bare filenames resolved from `src/assets/images` via `~/lib/asset` and optimized with Astro `<Image>`.

| File | Type | Drives |
|---|---|---|
| `announcements.yaml` | YAML list | Top announcement bar items (`Announcement.astro`) |
| `footer.yaml` | YAML | Footer columns, blurb, app badges, payments, legal (`getEntry('footer', 'main')`) |
| `proof.yaml` | YAML list | Best-sellers proof strip stats (`BestSellers.astro`) |

> **Blog is no longer a content collection.** `src/content/blog/*.mdx` and `src/content/authors.yaml` are legacy files from before the migration to Shopify's native blog — unused by any page, safe to delete. Manage posts/authors entirely in Shopify admin; see [Blog (Journal) setup](#12-blog-journal--shopifys-native-blog).

**Everything else on the home page is hardcoded markup/data inside its own component, not a content collection** — edit the component directly to change it:

| Section | Component | 
|---|---|
| Hero (headline, stats, slides) | `components/home/marvexa/Hero.astro` |
| Scrolling marquee strip | `components/home/marvexa/Marquee.astro` |
| Campaign banner | `components/home/marvexa/Campaign.astro` |
| Style feed | `components/home/marvexa/StyleFeed.astro` |
| Testimonials carousel | `components/home/marvexa/Testimonials.astro` |
| Newsletter section copy | `components/home/marvexa/Newsletter.astro` |

`/compare` (`pages/compare.astro`) has no YAML either — it's entirely client-driven from real Shopify product data (`localStorage` selection + live product fetch), no editorial config to maintain. There's no brand-logo strip or product-spotlight section in the current build.

**New Arrivals, Best Sellers, and Shop the Look are also not content collections** — all three are real Shopify Collections, resolved server-side in `pages/index.astro`. See [Shopify store setup #2](#2-new-arrivals-collection-optional--falls-back-automatically), [#3](#3-best-sellers-collection-optional--falls-back-automatically), and [#4](#4-shop-the-look-collections-optional--falls-back-to-nothing-shown) for the admin setup, and the config bullets below for the handles/constants.

---

## Brand & feature config (`src/config/marvexa.ts`)

Single source of truth for stable brand identity referenced from code (section *content* lives in content collections).

- `DEFAULT_COUNTRY` / `DEFAULT_LANGUAGE` — the **fallback** market (default `'US'` / `'EN'`). The active market is resolved per-request (cookie → `cf-ipcountry` → these defaults) in `src/middleware.ts`; see [Markets & multi-currency](#markets--multi-currency).
- `BRAND` — name, legal name, tagline, description, `freeShippingThreshold`, social links.

> **Free-shipping meter (`freeShippingThreshold`).** Drives the cart "Add $X more to unlock FREE shipping" bar **and** the PDP's "Free Shipping" trust badge (both read this one value, so they can never drift out of sync with each other). Set a number (default `99`) to show them, or `0` / `null` to **turn both off and hide them** for stores with no free shipping. ⚠️ **Display only — it does not create a shipping rate.** If you keep it on, you **must** add a matching free-shipping rate in Shopify (Settings → Shipping and delivery → "Free, over $99"), or the storefront promises free shipping the customer never gets at checkout.

- `CART_EXTRAS` — gift wrap / order notes config (see below).
- `LIFESTYLE_CARDS` — `for-*` collection handles → icon + order for the shop-by-lifestyle grid. Icon names must exist in `ui/marvexa/Icon.astro`.
- `NEW_ARRIVALS_COLLECTION_HANDLE` — the Shopify Collection handle the home "New Arrivals" section reads (default `new-arrivals`). See [Shopify store setup #2](#2-new-arrivals-collection-optional--falls-back-automatically).
- `BEST_SELLERS_COLLECTION_HANDLE` — the Shopify Collection handle the home "Best Sellers" section reads (default `best-sellers`). See [Shopify store setup #3](#3-best-sellers-collection-optional--falls-back-automatically).
- `LOOKBOOK_COLLECTION_HANDLES` — ordered array of Collection handles for "Shop the Look" (default `["lookbook1","lookbook2","lookbook3"]`); array order = display order. Add a handle to add a 4th+ look.
- `LOOKBOOK_HOTSPOT_SLOTS` — fixed `{ top, left, cardLeft }` pin positions applied by product order within each look collection (1st product → slot 1, etc.), since Shopify collections have no per-product x/y field. See [Shopify store setup #4](#4-shop-the-look-collections-optional--falls-back-to-nothing-shown).
- `DELIVERY_ESTIMATE_DAYS` — default days added to today for the PDP's "Order today for delivery by [date]" line (default `5`). Real `Date` math, computed fresh client-side on every page load — not a fake countdown. Override per product with the `custom.processing_days` metafield (see [Product metafields #7](#7-product-metafields-optional--enrich-the-pdp)); products without it use this default.
- `RETURNS_WINDOW_DAYS` — days shown on the PDP's "Free Returns — N-day window" trust badge (default `30`). Display only — set your actual return policy separately in **Settings → Policies**.

---

## Cart extras (gift wrap, notes)

Two optional add-ons on the cart page. **Both write to the real Shopify cart** — nothing is fake. Configured in `src/config/marvexa.ts` → `CART_EXTRAS`.

| Extra | What it does | Needs a product? |
|---|---|---|
| **Order notes** | Saves to cart `note` → admin order **Notes** | No — works out of the box |
| **Gift message** | Saves to cart `attribute` → admin order **Additional details**. Lives in the Gift Wrap box | No (shows only when Gift Wrap does) |
| **Gift wrap** (paid) | Adds a real product line so the customer is **charged** | Yes |

> Money can only be charged through a real Shopify **product** — a storefront cart can't add arbitrary fees. So the paid extra is backed by a product you create. It's looked up **by handle**, so it works on any store with no code edit. It's **hidden automatically** when the product isn't found, isn't published, or is sold out.

### Setup — Gift Wrap
1. **Products → Add product.** Title `Gift Wrap` (handle becomes `gift-wrap`, matching the config).
2. Price e.g. `12.00`.
3. **Inventory → uncheck "Track quantity"** (never shows sold out).
4. **Shipping → uncheck "This is a physical product."**
5. **Status: Active**, and **publish it to the channel your Storefront token uses.** ⚠️ Unpublished = can't add to cart.

### Customising
In `CART_EXTRAS`: `enabled: false` hides an extra; `handle` overrides the product slug; `label`/`desc`/`maxLength` are display only — **prices shown come from the live variant**, not config.

**Where data lands for the merchant:** order notes → order **Notes**; gift message → order **Additional details**; gift wrap → an ordinary paid line item.

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
5. **Request "Protected customer data access."** The **Permissions** checklist on that same Customer Account API page (`customer_read_customers`, `customer_read_orders`, etc.) is self-declared scopes — it is **not** the same as approval to actually read that data. Look for a separate "Customer data requests" / "Protected customer data access" section (same page, or your app's entry in the **Partner Dashboard → API access**) and request/enable it — this app reads customer name, email, and order history. Self-serve/instant on a dev store; can require Shopify review on a live store.

The client auto-refreshes the access token, re-persists cookies, and sends the raw token as `Authorization` (**not** `Bearer <token>`). Every authenticated GraphQL request also sends `Origin` (must match a registered **JavaScript origin**, checked on *every* call, not just login) and `User-Agent` (Shopify's edge returns an HTML "Access denied" 403 — not a GraphQL error — without one) — both required per [Shopify's Customer Account API docs](https://shopify.dev/docs/api/customer/latest). Routes: `pages/account/{login,authorize,logout}.ts`, page `pages/account/index.astro`, client `lib/shopify/customer/client.ts`.

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

### Alternative deploy targets (Node / Vercel / Netlify)

Cloudflare Workers (above) is the default and the only target this README's Shopify setup / caching / secrets sections assume — but `astro.config.mjs` picks its adapter at build time (`ASTRO_ADAPTER` env var, or auto-detected from the platform's own `VERCEL`/`NETLIFY`/`CF_PAGES` build-time var), and `@astrojs/node`, `@astrojs/vercel`, `@astrojs/netlify` are installed alongside `@astrojs/cloudflare` — not just documented, actually wired up. Switching only changes *where the SSR server runs*; the Shopify data layer, cart cookies, and Customer Account API OAuth are plain `Request`/`Response`/Web Crypto with nothing Cloudflare-specific, so they work unmodified elsewhere.

**Full walkthrough (Cloudflare Pages / Vercel / Netlify / self-hosted Node+PM2+Nginx) is in [DEPLOYMENT.md](DEPLOYMENT.md).** One caveat DEPLOYMENT.md doesn't cover: [Performance & caching](#performance--caching)'s `applyMarketCache` assumes a Cloudflare-style shared CDN honouring `s-maxage`/`stale-while-revalidate` — the `Cache-Control` headers are standard, but confirm your platform's CDN actually respects them before relying on the 2-minute edge-cache trade-off described there.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Product grids empty | Products/collections not **published** to the channel your Storefront token uses |
| Cart "add" fails / extras hidden | The product isn't published, is sold out, or the handle doesn't match the config |
| Login redirect rejected | Customer Account API can't use `http`/`localhost` — use a public HTTPS origin; check the three registered URIs |
| `/account` shows "Couldn't load your account: HTTP 403 Forbidden" (HTML "Access denied" body) | **Protected customer data access** isn't approved for this Customer Account API client — this is separate from the Permissions/scope checkboxes on the same admin page. See [Customer accounts (login) step 5](#customer-accounts-login). Rarely, this exact 403 also fires if Shopify has flagged the store itself as fraudulent — check for an Admin banner |
| `/account` shows "Couldn't load your account: ...non-JSON response..." | Customer Account API returned something other than JSON (upstream error page, wrong `SHOPIFY_SHOP_ID`). The error message now includes the real HTTP status/body — check that first |
| Currency drifts (cards vs cart) | Confirm the market is threaded — middleware sets `Astro.locals.market`; cart buyer identity follows it |
| `/collections` page empty | Create and **publish** Shopify collections — that index/detail route (not the header mega menu, which is hardcoded — see store setup #5) is driven by live collections |
| Mega-menu category filters to zero results | The label's `catHref()` target doesn't match any real `productType` in your catalogue — edit `MEGAS` in `Header.astro` to use a productType that actually exists |
| New Arrivals section shows generic newest-created picks, not your curated collection | The `new-arrivals` collection is missing, empty, or **not published** to your Storefront channel — the section falls back to a live `CREATED_AT`-sorted query silently, and "View All" points at `/products`. Check publishing (store setup #2) |
| Best Sellers section shows generic catalogue picks, not your curated collection | The `best-sellers` collection is missing, empty, or **not published** to your Storefront channel — the section falls back to a live `BEST_SELLING`-sorted query silently. Check publishing (store setup #3) |
| Shop the Look: one look shows, others don't | Each `lookbook1`/`lookbook2`/`lookbook3` collection must be **individually published** to your Storefront channel — creating it in admin isn't enough. Open the collection → Publishing → check the channel your Storefront token uses (store setup #4) |
| "Free shipping unlocked" but customer charged shipping | The cart meter is display-only — add a matching free-shipping rate in Shopify, or set `freeShippingThreshold` to `0`/`null` to hide the meter |
| Ratings/specs missing on PDP | Add the matching product metafields (see [store setup](#shopify-store-setup)) |
| Individual review cards missing on PDP | Set `JUDGEME_PRIVATE_TOKEN` and confirm the product exists in Judge.me (aggregate rating from metafields still shows without it) |
| Materials & Care / Shipping & Returns / Returns Policy show the same generic text on every product | That's the fallback boilerplate — the matching `custom.*` metafield isn't set on that product yet (store setup #7). Not a bug, just unconfigured |
| PDP metafield text saved but not showing on the storefront | The metafield definition's **Storefront API access** toggle is OFF, or the field type isn't **Single line text + List** cardinality — a single "One" value won't render as bullets |
| Product Description shows raw tags (e.g. "Clothing", "Unisex") instead of real highlights | Fixed — highlights no longer fall back to tags. Set `custom.highlights` for real bullets, or leave it unset to hide the list entirely |
| Pickup block missing on PDP | Enable Local Pickup for a location, stock the variant there, and publish the location to your channel (see store setup #10) |
| Size Guide shows the static universal chart, not my Metaobject data | The product's Shopify **Type** field doesn't match any `size_chart` entry's `product_type` — check Type under Product → Organization (not the standardized "Category" field, and not tags). Also confirm the Metaobject definition has **Storefronts API access** ON |
| Blog post shows your account name / no author photo | The post's **Author metafield** isn't set — that's separate from the built-in "Organization → Author" field. Open the post → Metafields → Author → pick an entry → Save. If no Metafields section appears at all, the `custom.author` metafield definition (Blog posts) was never saved — redo store setup #12 step 3 |
| `/blog/author/[slug]` 404s | The URL slug must match the Author metaobject's **handle** exactly (auto-generated from its Name, editable in the entry) |
| Shopify edits take ~2 min to show | Edge cache (`s-maxage=120`) on default-market catalogue pages — lower it in `applyMarketCache` for fresher data |
| `astro build` clears dist / worker error | `wrangler.toml` `main` must be `@astrojs/cloudflare/entrypoints/server` |

---

## License

MIT — see [LICENSE](LICENSE).
