// @ts-check
import { defineConfig, envField, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Headless Shopify storefront — server-rendered on Cloudflare Workers so the
// private Storefront token stays on the server and cart cookies work.
// https://astro.build/config
export default defineConfig({
  // Public origin — used by the sitemap and canonical URLs.
  // Replace with your production domain before deploying.
  site: "https://omnix.store",
  output: "server",
  adapter: cloudflare({
    // Use Cloudflare's platform proxy in `astro dev` so getSecret() and
    // bindings resolve from .dev.vars / wrangler config locally.
    platformProxy: { enabled: true },
    // Workers has no sharp/native image binary — don't optimize at runtime.
    // Local images are pre-optimized in src/assets/images; remote Shopify
    // images are already served from its CDN.
    imageService: "passthrough",
  }),
  integrations: [mdx(), sitemap()],
  // This app doesn't use Astro.session. Pick the in-memory driver so the
  // Cloudflare adapter doesn't force a KV "SESSION" binding at deploy time.
  // Switch to a KV driver (and provision the namespace) if you add sessions.
  session: {
    driver: sessionDrivers.memory(),
  },
  // Single source of truth for env vars. Secrets are read at runtime via
  // getSecret() (Workers exposes them per-request, not as process.env).
  env: {
    schema: {
      SHOPIFY_SHOP_DOMAIN: envField.string({ context: "server", access: "secret" }),
      SHOPIFY_STOREFRONT_PRIVATE_TOKEN: envField.string({ context: "server", access: "secret" }),
      SHOPIFY_API_VERSION: envField.string({ context: "server", access: "secret", optional: true }),
      CUSTOMER_ACCOUNT_API_CLIENT_ID: envField.string({ context: "server", access: "secret", optional: true }),
      SHOPIFY_SHOP_ID: envField.string({ context: "server", access: "secret", optional: true }),
      CUSTOMER_ACCOUNT_API_VERSION: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  image: {
    // Allow <Image>/<Picture> to reference remote Shopify product images
    // (and the placeholder avatar service used by demo testimonials).
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  vite: {
    // Allow the tunnel host to reach the dev server (otherwise Vite
    // blocks unknown Host headers). localhost is always allowed.
    server: {
      allowedHosts: true,
    },
  },
});
