# Marvexa — Headless Shopify Storefront Theme

A production-ready headless e-commerce storefront built with **Astro 7 (SSR)** and powered end-to-end by the **Shopify Storefront API**. No UI framework — every page is server-rendered `.astro`; interactivity (cart, search, wishlist, compare) is plain vanilla JS, with shared cart state in a lightweight nanostore. Deploys to **Cloudflare Workers** by default (Node/Vercel/Netlify also supported).

> **No fake commerce data.** Products, collections, prices, stock, search, cart, checkout, and the blog are all live Shopify. Only pure marketing copy (hero text, About/Contact, testimonials) is static content you edit directly.

![Marvexa storefront preview](public/og-image.png)

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Shopify store setup](#shopify-store-setup) — read this first
6. [Project structure](#project-structure)
7. [Pages & API routes](#pages--api-routes)
8. [Editing content & brand](#editing-content--brand)
9. [Customising the design](#customising-the-design)
10. [Deploying](#deploying)
11. [Troubleshooting](#troubleshooting)
12. [License](#license)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 7, SSR (`output: "server"`) |
| Hosting | Cloudflare Workers (default) — Node, Vercel, Netlify adapters also included, see [DEPLOYMENT.md](DEPLOYMENT.md) |
| State | `nanostores` — cart state shared across vanilla-JS islands |
| Styling | Plain CSS (`src/styles/*.css`) — no Tailwind, no CSS framework |
| Interactivity | Vanilla JS `<script>` blocks — no React/Vue |
| Content | Astro content collections (YAML/Markdown/MDX) |
| Commerce | Shopify Storefront API + Customer Account API (login) |
| Requirements | Node `>=22.12.0`, npm |

⚠️ **Don't bump `astro` or the adapter packages independently** — they're version-locked to each other. Don't reintroduce React or Tailwind.

---

## Features

- **Home** — hero, new arrivals, best sellers, category grid, campaign banner, curated lookbook, style feed, testimonials, blog teasers, newsletter — all data-driven, see [store setup](#shopify-store-setup).
- **Catalogue** — collections index/detail, all-products with sort + faceted filters + pagination.
- **Product page** — gallery, variants/colours, stock + low-stock labels, real Shopify Local Pickup, specs/reviews from metafields, size guide, recommendations.
- **Cart** — drawer + full page, free-shipping meter, discount codes, gift wrap / notes / gift message, redirects to Shopify's hosted checkout.
- **Search, Wishlist, Compare** — instant search; wishlist/compare are client-side (`localStorage`).
- **Blog (Journal)** — Shopify's native blog, with author profiles via a metaobject.
- **Account** — Shopify Customer Account API login (OAuth 2.0 + PKCE), order history.
- **Multi-currency** — market resolved per request, threaded through prices and checkout.
- SEO (meta/OG/JSON-LD), sitemap, custom 404, accessibility (skip link, focus-trapped drawers, AA contrast).

---

## Quick start

```bash
npm install
cp .env.example .env     # fill in your Shopify credentials, see below
npm run dev               # http://localhost:4321
```

The store renders whatever exists in your Shopify catalogue — an empty store shows empty grids until you add products. Go through [Shopify store setup](#shopify-store-setup) to light up every section.

---

## Environment variables

Server-only secrets, never sent to the browser. Copy `.env.example` → `.env` (or `.dev.vars` for wrangler).

| Variable | Required | Notes |
|---|---|---|
| `SHOPIFY_SHOP_DOMAIN` | ✅ | `your-shop.myshopify.com` |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | ✅ | **Private** Storefront API token (not the public access token) |
| `SHOPIFY_API_VERSION` | optional | Defaults to `2026-04` |
| `CUSTOMER_ACCOUNT_API_CLIENT_ID` / `SHOPIFY_SHOP_ID` / `CUSTOMER_ACCOUNT_API_VERSION` | login only | For account login, see [below](#customer-login-setup) |
| `JUDGEME_PRIVATE_TOKEN` | reviews only | Enables individual review cards on the PDP (Judge.me admin → Settings → API) |

**Getting the Storefront token:** Shopify admin → install the **Headless** (or Hydrogen) sales channel → it issues a private Storefront token. Then **publish your products/collections to that same channel**, or the API returns nothing.

⚠️ **Customer login needs a public HTTPS origin** — Shopify rejects `localhost`/`http`. Browsing/cart/checkout work fine on localhost; only login requires a tunnel.

---

## Shopify store setup

Nothing below needs code changes — it's all data in Shopify admin. Every optional feature looks up its data **by handle/tag/metafield** and hides cleanly if that data doesn't exist.

**1. Publish everything (required).** Unpublished products/collections are invisible to the API — the #1 cause of "I made it but it's not showing."

**2. Home sections read real collections** (all optional — each falls back automatically if missing):
| Section | Collection handle | Fallback |
|---|---|---|
| New Arrivals | `new-arrivals` | Newest-created products |
| Best Sellers | `best-sellers` | Live best-selling products |
| Shop the Look | `lookbook1`, `lookbook2`, `lookbook3` | Look is skipped |

Handles are configurable in `src/config/marvexa.ts`. For Shop the Look, each collection's title/image become the look's label/photo, and its member products (in manual sort order) become the hotspot pins — **all three must be individually published**.

**3. Navigation is hardcoded**, not collection-driven. The mega menu (`src/components/layout/marvexa/Header.astro`, `MEGAS` array) links to `/products?cat=...` filters that match your products' real `productType` — creating a Shopify collection does not add a nav item. Edit `MEGAS` to add categories.

**4. Product metafields enrich the PDP** (all optional, namespace `reviews.*` / `custom.*`): star rating, spec table, highlights, materials & care, shipping/returns text, size chart link, saves count, processing days. Full field list and setup steps are in the codebase's inline config comments and `src/config/marvexa.ts` — absent fields are simply hidden, never faked.

**5. Size Guide** falls back in order: product's own `custom.size_chart` metafield → a `size_chart` Metaobject matching the product's Type field → a static universal chart. Works with zero setup; richer with a Metaobject.

**6. Local Pickup** — enable under Settings → Shipping and delivery → Local pickup; the PDP pickup block appears automatically per variant/location.

**7. Free shipping meter is ON by default** (`freeShippingThreshold: 99` in config). ⚠️ It's **display only** — you must add a matching shipping rate in Shopify, or the cart promises a discount checkout doesn't honour. Set to `0`/`null` to hide it.

**8. Blog (Journal)** is Shopify's native blog, not a content collection. One-time setup: create an `Author` metaobject definition (Name/Role/Bio/Twitter/Avatar), add author entries, link it to Blog posts via a `custom.author` metafield, then set each post's Author metafield (in **Metafields**, not the built-in Organization → Author field). Config: `BLOG` in `src/config/marvexa.ts`.

**9. Cart extras (gift wrap)** — see [Editing content & brand](#editing-content--brand) below.

---

## Project structure

```
src/
  config/marvexa.ts      Brand identity, collection handles, cart-extras, feature flags — single source of truth
  content/                Editable YAML content (announcements, footer, proof stats)
  content.config.ts       Content-collection schemas
  middleware.ts           Resolves active market per request
  layouts/Layout.astro    HTML shell, SEO head, fonts
  styles/                 Plain CSS — marvexa.css is the design system/tokens
  components/
    home/marvexa/         Home page sections (Hero, NewArrivals, Lookbook, ...)
    layout/marvexa/        Header, Footer, CartDrawer, Overlays
    product/marvexa/       ProductCard, ProductGrid
  lib/shopify/
    client.ts              Server-side fetch client (private token stays here)
    graphql/                Raw queries by domain
    services/                Fetch + transform per domain — pages call this layer
    customer/                Customer Account API (OAuth + PKCE)
  stores/cart.ts           nanostore cart, shared across islands
  pages/                   Routes (see below)
public/                    Static assets, robots.txt, og-image.png
```

`~/*` aliases to `src/*`. `maison-modern-html/` is a static design reference, not part of the build.

---

## Pages & API routes

| Route | Data source |
|---|---|
| `/`, `/products`, `/products/[handle]` | Shopify |
| `/collections`, `/collections/[handle]` | Shopify |
| `/cart`, `/search` | Shopify |
| `/wishlist`, `/compare` | Client-side (`localStorage`) + Shopify |
| `/blog`, `/blog/[slug]`, `/blog/author/[slug]` | Shopify (native blog) |
| `/about`, `/contact` | Static content |
| `/pages/[handle]` | Shopify CMS pages |
| `/account` | Customer Account API (login required) |

All cart/search/market mutations go through same-origin `POST /api/cart/*`, `GET /api/search`, `POST /api/market` — the browser never talks to Shopify directly; the private token never leaves the server.

---

## Editing content & brand

| What | Where |
|---|---|
| Brand name, tagline, social links, free-shipping threshold | `src/config/marvexa.ts` → `BRAND` |
| Announcement bar, footer, best-sellers proof stats | `src/content/*.yaml` |
| Hero, marquee, campaign banner, testimonials, newsletter copy | Edit the component directly in `src/components/home/marvexa/` |
| New Arrivals / Best Sellers / Shop the Look | Not files — real Shopify collections, see [store setup](#shopify-store-setup) |

**Gift wrap (optional paid cart extra):** create a `Gift Wrap` product in Shopify (handle `gift-wrap`), untrack inventory, mark non-physical, publish it — it's picked up automatically. Configure in `CART_EXTRAS` in `src/config/marvexa.ts` (`enabled: false` to hide it).

**Customer login setup:** enable New customer accounts in Shopify Settings, register your callback/origin/logout URIs under the Headless channel's Customer Account API, copy the Client ID + Shop ID into your env vars, and request **Protected customer data access** (separate from the scope checkboxes) — required or `/account` returns a 403.

---

## Customising the design

No build step for CSS — edit `src/styles/marvexa.css` directly. Design tokens live at the top (`:root`):

```css
--bg / --bg2 / --card    /* backgrounds */
--text / --muted         /* text colors */
--accent / --accent-dk   /* electric olive — CTAs, selected states */
--rust                   /* sale / limited labels */
--fh / --fb              /* heading / body fonts (Plus Jakarta Sans + Inter) */
```

Fonts load from Google Fonts in `src/layouts/Layout.astro` — swap the `<link>` and the `--fh`/`--fb` tokens to change them.

**Before going live:**
1. Set `site` in `astro.config.mjs` to your production domain (and `public/robots.txt`).
2. Set `name` in `wrangler.toml` to your Worker name.
3. Fill in `BRAND` in `src/config/marvexa.ts` with real values.
4. Replace demo images in `src/assets/images` and `public/og-image.png`.

---

## Deploying

Default target is Cloudflare Workers:

```bash
npm run build
npx wrangler deploy
```

Set secrets once per environment:

```bash
npx wrangler secret put SHOPIFY_SHOP_DOMAIN
npx wrangler secret put SHOPIFY_STOREFRONT_PRIVATE_TOKEN
```

Node, Vercel, and Netlify adapters are also installed and wired up — switching only changes where the SSR server runs, nothing in the Shopify/cart/auth layer is Cloudflare-specific. **Full walkthrough for every platform is in [DEPLOYMENT.md](DEPLOYMENT.md).**

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Product/collection grids empty | Not published to the channel your Storefront token uses |
| Cart add fails / extras hidden | Product unpublished, sold out, or handle mismatch |
| Login redirect rejected | Needs a public HTTPS origin; check the 3 registered URIs match exactly |
| `/account` shows 403 Forbidden | **Protected customer data access** not approved — separate from scope checkboxes, see store setup |
| Mega-menu link shows 0 results | `MEGAS` category doesn't match a real `productType` in your catalogue |
| New Arrivals / Best Sellers showing generic picks | Collection missing, empty, or not published — falls back silently |
| "Free shipping" shown but customer charged | Meter is display-only — add the matching Shopify shipping rate |
| Ratings/specs missing on PDP | Add the matching product metafield, see store setup |
| Blog post has no author photo | Author metafield not set on that post (separate from the built-in Organization → Author field) |
| Shopify edits take ~2 min to appear | Edge cache on catalogue pages — expected, tune in `src/lib/market.ts` |

---

## License

MIT — see [LICENSE](LICENSE).
