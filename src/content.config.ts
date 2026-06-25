// ============================================================
//  Content collections — static OMNIX content (no Shopify data).
//  Chrome (announcements/nav/footer) + home section copy live as
//  YAML data; testimonials are Markdown; blog teasers are MDX.
//  Images are stored as bare filenames and resolved at render via
//  ~/lib/asset → optimized with Astro <Image />.
// ============================================================
import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

// ---- shared field shapes ---------------------------------------------------
const link = z.object({ label: z.string(), href: z.string().default('#') });
const cta = z.object({ label: z.string(), href: z.string().default('#') });

// ---- chrome ----------------------------------------------------------------
const announcements = defineCollection({
  loader: file('src/content/announcements.yaml'),
  schema: z.object({ icon: z.string().default('spark'), text: z.string() }),
});

const navigation = defineCollection({
  loader: file('src/content/navigation.yaml'),
  schema: z.object({
    topLinks: z.array(z.object({ label: z.string(), href: z.string().default('#'), badge: z.string().optional() })).default([]),
    mega: z
      .object({
        columns: z.array(z.object({ heading: z.string(), links: z.array(link) })).default([]),
        feature: z
          .object({ tag: z.string(), title: z.string(), body: z.string(), image: z.string() })
          .optional(),
      })
      .optional(),
    mobile: z.array(link).default([]),
    metaLinks: z.array(link).default([]),
  }),
});

const footer = defineCollection({
  loader: file('src/content/footer.yaml'),
  schema: z.object({
    columns: z.array(z.object({ title: z.string(), links: z.array(link) })).default([]),
    blurb: z.string().optional(),
    // App-store badges shown under the last column.
    app: z
      .array(z.object({ icon: z.enum(['apple', 'play']), sub: z.string(), label: z.string(), href: z.string().default('#') }))
      .default([]),
    legal: z.string().optional(),
    payments: z.array(z.string()).default([]),
  }),
});

// ---- home sections ---------------------------------------------------------
const heroSlide = z.object({
  headingLead: z.string(),
  headingAccent: z.string(),
  headingTail: z.string(),
  sub: z.string().optional(),
  image: z.string(),
  primary: cta.optional(),
  secondary: cta.optional(),
});

// Small companion-card slide — the right hero card rotates through these.
const heroSmSlide = z.object({
  eyebrow: z.string().optional(),
  desc: z.string().optional(),
  image: z.string().optional(),
  watermark: z.string().optional(),
  para: z.string().optional(),
  cta: cta.optional(),
});

const hero = defineCollection({
  loader: file('src/content/hero.yaml'),
  schema: z.object({
    // Large lead card — first slide is the default; `slides` rotates it.
    headingLead: z.string(),
    headingAccent: z.string(),
    headingTail: z.string(),
    sub: z.string().optional(),
    image: z.string(),
    primary: cta.optional(),
    secondary: cta.optional(),
    slides: z.array(heroSlide).default([]),
    // Small companion card — top-level fields are the default; `smSlides` rotates it.
    smEyebrow: z.string().optional(),
    smDesc: z.string().optional(),
    smImage: z.string().optional(),
    smWatermark: z.string().optional(),
    smPara: z.string().optional(),
    smCta: cta.optional(),
    smSlides: z.array(heroSmSlide).default([]),
  }),
});

const trust = defineCollection({
  loader: file('src/content/trust.yaml'),
  schema: z.object({ icon: z.string().default('check'), title: z.string(), body: z.string() }),
});

// Two promo banners (Trade-in / Gaming).
const promo = defineCollection({
  loader: file('src/content/promo.yaml'),
  schema: z.object({
    tag: z.string().optional(),
    title: z.string(), // may contain <br>
    body: z.string().optional(),
    image: z.string(),
    cta: cta.optional(),
  }),
});

// Scrolling marquee items (image + label, alternating accent).
const marquee = defineCollection({
  loader: file('src/content/marquee.yaml'),
  schema: z.object({ label: z.string(), image: z.string(), accent: z.boolean().default(false) }),
});

// Lookbook — single hero image with positioned product hotspots.
// Hero image + hotspot coordinates are editorial (static). The product shown
// at each hotspot is pulled LIVE from Shopify: set `handle` to pin a specific
// product, or leave it out to fall back to best-sellers in order.
const lookbook = defineCollection({
  loader: file('src/content/lookbook.yaml'),
  schema: z.object({
    image: z.string(),
    hotspots: z
      .array(
        z.object({
          top: z.string(),
          left: z.string(),
          handle: z.string().optional(),
          cardLeft: z.boolean().default(false),
        }),
      )
      .default([]),
  }),
});

const spotlight = defineCollection({
  loader: file('src/content/spotlight.yaml'),
  schema: z.object({
    eyebrow: z.string().optional(),
    badge: z.string().optional(),
    title: z.string(), // may contain <br>
    body: z.string().optional(),
    image: z.string(),
    priceNow: z.string().optional(),
    priceWas: z.string().optional(),
    features: z.array(z.string()).default([]),
    primary: cta.optional(),
    secondary: cta.optional(),
    order: z.number().default(0),
  }),
});

// "Compare top models" — flagship comparison columns.
// PRODUCT is pulled LIVE from Shopify when `handle` is set (name/price/image/
// href auto-fill). `name`/`price`/`image` act as fallback/override if no handle
// or the product is missing. Specs + best badge + order stay editorial — Shopify
// has no native spec source (wire metafields later if you want them live).
const compare = defineCollection({
  loader: file('src/content/compare.yaml'),
  schema: z.object({
    handle: z.string().optional(),
    name: z.string().optional(),
    price: z.string().optional(),
    image: z.string().optional(),
    best: z.boolean().default(false),
    bestLabel: z.string().optional(),
    specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    href: z.string().default('/products'),
    order: z.number().default(0),
  }),
});

const brands = defineCollection({
  loader: file('src/content/brands.yaml'),
  schema: z.object({ name: z.string(), logo: z.string().optional() }),
});

const newsletter = defineCollection({
  loader: file('src/content/newsletter.yaml'),
  schema: z.object({
    eyebrow: z.string().optional(),
    title: z.string(), // may contain <span class="accent">…</span>
    body: z.string().optional(),
    placeholder: z.string().default('Enter your email'),
    cta: z.string().default('Subscribe'),
    perks: z.array(z.string()).default([]),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    avatar: z.string().optional(),
    verified: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    image: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    href: z.string().default('#'),
    readingTime: z.string().optional(),
    order: z.number().default(0),
    // Author slug → key into the `authors` collection (/blog/author/<slug>).
    author: z.string().optional(),
  }),
});

// Blog authors — keyed by slug, referenced by a post's `author` field.
const authors = defineCollection({
  loader: file('src/content/authors.yaml'),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

export const collections = {
  announcements,
  navigation,
  footer,
  hero,
  trust,
  promo,
  marquee,
  lookbook,
  spotlight,
  compare,
  brands,
  newsletter,
  testimonials,
  blog,
  authors,
};
