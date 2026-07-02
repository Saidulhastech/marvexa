// @ts-check
import { defineConfig, envField, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import netlify from "@astrojs/netlify";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Choose adapter based on environment variable at build time
function getAdapter() {
  const target = process.env.ASTRO_ADAPTER;
  if (target === "node") {
    return node({
      mode: "standalone",
    });
  }
  if (target === "vercel") {
    return vercel();
  }
  if (target === "netlify") {
    return netlify();
  }
  // Default to Cloudflare (pre-configured adapter)
  return cloudflare({
    imageService: "passthrough",
  });
}

// Headless Shopify storefront — server-rendered on Cloudflare Workers so the
// private Storefront token stays on the server and cart cookies work.
// https://astro.build/config
export default defineConfig({
  // Public origin — used by the sitemap and canonical URLs.
  // ⚠️ Replace with your real production domain before deploying.
  site: "https://marvexa.com",
  output: "server",
  adapter: getAdapter(),
  integrations: [mdx(), sitemap()],
  // This app doesn't use Astro.session. Pick an in-memory driver so the
  // Cloudflare adapter doesn't force a KV "SESSION" binding at deploy time.
  // (Astro 7 dropped sessionDrivers.memory() — lruCache is the in-memory
  // unstorage driver.) Switch to cloudflareKVBinding if you add sessions.
  session: {
    driver: sessionDrivers.lruCache(),
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
