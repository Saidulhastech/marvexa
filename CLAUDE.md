# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Marvexa** — a headless Shopify storefront (modern fashion theme) built with **Astro 7 in SSR mode**, deployed to **Cloudflare Workers** via `@astrojs/cloudflare`. The Shopify Storefront API is the data source; all Shopify traffic is server-side so the private token never reaches the browser. Node `>=22.12.0`.

> Naming note: the brand is "Marvexa" (`src/config/marvexa.ts` → `BRAND.name`). The theme namespace is `marvexa` throughout: `src/components/home/marvexa/*` is the Marvexa homepage; `*/marvexa/*` (layout/product/ui/collection) is the shared chrome/product/collection layer. `maison-modern-html/` is the static HTML design reference, not part of the build.

## Commands

```bash
npm run dev        # astro dev (Cloudflare platformProxy on → secrets/bindings resolve from .dev.vars)
npm run build      # astro build
npm run preview    # astro build && wrangler dev   (run the built Worker locally)
npm run deploy     # astro build && wrangler deploy
npx astro check    # typecheck (@astrojs/check + tsconfig strict). No test suite, no ESLint configured.
```

There is **no test runner and no linter** in this repo — `astro check` is the only static gate.

### Local env

Copy `.env.example` → `.env` (or `.dev.vars` for wrangler). Required secrets: `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`. Optional: `SHOPIFY_API_VERSION` (default `2026-04`), plus the `CUSTOMER_ACCOUNT_API_*` / `SHOPIFY_SHOP_ID` set for customer login. Env vars are declared in `astro.config.mjs` (`env.schema`) — add new ones there, not ad hoc.

Customer Account API (OAuth) requires a **public HTTPS origin** (a tunnel host); Shopify rejects `localhost`/`http`. The origin is derived per-request from `X-Forwarded-Proto/Host` — see `src/lib/shopify/customer/origin.ts`.

## Architecture

### Path alias

`~/*` → `src/*` (tsconfig). Import the Shopify layer from the barrel: `import { getProducts, type Cart } from '~/lib/shopify'`.

### Shopify data layer (`src/lib/shopify/`)

Strict layering — keep these responsibilities separate:

- **`client.ts`** — the single `shopifyFetch<T>()` entry point. Secrets read lazily via `getSecret()` at request time (Workers exposes them per-request; reading at module top level yields `undefined` on the edge). Handles retries (429/5xx, honours `Retry-After`), timeouts (`AbortSignal.timeout`), buyer-IP forwarding, and `@inContext` market injection. Returns partial data when GraphQL gives partial errors (e.g. a field the token isn't scoped for). Throws `ShopifyError`.
- **`graphql/`** — raw query/mutation strings + `fragments.ts`. No logic.
- **`services/`** — fetch + transform per domain (`products`, `collections`, `cart`, `search`, `content`). Call `shopifyFetch` with a query, then map via `transforms.ts`. **This is the layer pages/components call.**
- **`transforms.ts`** — Shopify GraphQL shapes → the app's domain types (`types.ts`). `nodes()`/`paginate()` unwrap edges/connections.
- **`customer/`** — Customer Account API OAuth 2.0 + PKCE (login/session/queries), separate from the Storefront token.

Adding a Shopify feature = new query in `graphql/` → new mapper in `transforms.ts` → new function in the relevant `services/` file → export from `index.ts`.

### Markets / multi-currency

The active market is resolved **once per request** in `src/middleware.ts` (`resolveMarket`: cookie → `cf-ipcountry` → `DEFAULT_COUNTRY`) and exposed on `Astro.locals.market`. Thread it into catalogue queries (`shopifyFetch(..., { inContext: market })`) and into the cart's `buyerIdentity.countryCode` so card prices and checkout currency never drift. Only pass `inContext` to queries that declare `@inContext(country:, language:)`. Fallback country/language live in `src/config/marvexa.ts`.

### Cart

The cart lives in the **real Shopify cart**; the browser only mutates it through same-origin `/api/cart/*` routes (`src/pages/api/cart/`), which call the server-side service with the private token. `src/lib/cart-server.ts` centralizes "ensure a cart exists", cookie sync (`cart-cookie.ts`), and self-healing when a stored cart id has expired. Cart "extras" (gift wrap, protection plan) resolve paid Shopify products **by handle** (configured in `src/config/marvexa.ts`) — no gid pasting.

### Client state — nanostores, NOT React

There is **no UI framework** (no React/Vue; no `.tsx`, no `client:` directives). Interactivity is plain `<script>` tags inside `.astro` components. Because Astro mounts each script as a separate root, shared state goes through **nanostores** (`src/stores/cart.ts`): `$cart`, `$cartOpen`, `$cartBusy`, etc. keep the header badge, drawer, and PDP buttons in sync. The cart store has deliberate concurrency control — a monotonic request `seq` so a slow earlier `/api/cart` reply can't clobber a fresher one, and a ref-counted busy flag. Preserve both when editing cart mutations.

### Content collections (`src/content/`)

Static, non-Shopify content (site chrome, homepage section copy, testimonials, blog teasers) is data, not hardcoded. YAML for chrome + home copy, Markdown for testimonials, MDX for blog. Schemas in `src/content.config.ts`. **Images are stored as bare filenames** (e.g. `"hero-banner.png"`) and resolved at render via `~/lib/asset` (`resolveImage`) → Astro `<Image />`. `resolveImage` throws in dev on a missing file so typos surface early. Brand identity referenced from code lives in `src/config/marvexa.ts`; everything else is content.

**"Shop the Look" — Collection-driven, not a content collection.** [`src/components/home/marvexa/Lookbook.astro`](src/components/home/marvexa/Lookbook.astro) renders 1 real Shopify Collection per look — see `LOOKBOOK_COLLECTION_HANDLES` in `src/config/marvexa.ts` for the handles/display order. Collection title → look label, collection image → the editorial look photo, member products (in the collection's Admin manual sort order) → the outfit pieces; all curated in Shopify Admin, no YAML. Shopify has no per-product x/y field on a collection, so hotspot pin placement is fixed presets (`LOOKBOOK_HOTSPOT_SLOTS`, same config file) applied by product order, not per-look editorial coordinates. Resolution happens in [`src/pages/index.astro`](src/pages/index.astro) (fetch-in-page, pass-as-prop — same as the other dynamic home sections) and the component maps each product to **inline size/colour variant pickers**. Picking a size resolves the row's variant id client-side; per-item "+ Bag" and "Add Complete Look" both add real variants through the nanostore cart (`addItem`), adding sequentially so the store's `seq` guard commits every line. A missing/empty look collection is skipped, not shown broken.

### Rendering / images

`output: "server"` — every route is SSR. Cloudflare has no sharp binary, so `imageService: "passthrough"` (no runtime optimization): local images in `src/assets/images` are pre-optimized; remote Shopify CDN images are already optimized. Remote image hosts are allowlisted in `astro.config.mjs` (`image.remotePatterns`). Styling is **plain CSS** (`src/styles/`), no Tailwind.

### Sessions

`session.driver: sessionDrivers.lruCache()` (in-memory) is set deliberately so the Cloudflare adapter doesn't demand a KV `SESSION` binding at deploy. The app does not use `Astro.session`. If you add sessions, switch to `sessionDrivers.cloudflareKVBinding()` and provision the namespace.
