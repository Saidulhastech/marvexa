// ============================================================
//  Content collections — static MARVEXA content (no Shopify data).
//  Chrome (announcements/nav/footer) + home section copy live as
//  YAML data; testimonials are Markdown; blog teasers are MDX.
//  Images are stored as bare filenames and resolved at render via
//  ~/lib/asset → optimized with Astro <Image />.
// ============================================================
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

// ---- shared field shapes ---------------------------------------------------
const link = z.object({ label: z.string(), href: z.string().default('#') });

// ---- chrome ----------------------------------------------------------------
const announcements = defineCollection({
  loader: file('src/content/announcements.yaml'),
  schema: z.object({ icon: z.string().default('spark'), text: z.string() }),
});

const footer = defineCollection({
  loader: file('src/content/footer.yaml'),
  schema: z.object({
    columns: z.array(z.object({ title: z.string(), links: z.array(link), note: z.string().optional() })).default([]),
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
// Best-Sellers proof strip (home). `rating` stat/label may be replaced at
// render time with real aggregate review data.
const proof = defineCollection({
  loader: file('src/content/proof.yaml'),
  schema: z.object({ icon: z.string().default('check'), stat: z.string(), label: z.string() }),
});

// Lookbook ("Shop the Look") — curated outfit looks. Each YAML list entry is
// ONE look: an editorial model photo + label + a few positioned hotspots. Every
// hotspot is a REAL Shopify product — name / price / image / variants (size +
// colour) are pulled LIVE. Only the look photo, label, order and pin coordinates
// are editorial. `handle` pins a specific product; omit it and the slot falls
// back to a best-seller (filled in order, no repeats) so the section works
// out-of-the-box before any handles are curated.
const lookbook = defineCollection({
  loader: file('src/content/lookbook.yaml'),
  schema: z.object({
    label: z.string(),
    image: z.string(), // local filename (resolveImage) or a full http(s) URL
    order: z.number().default(0),
    items: z
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
    // Single category label shown as a coloured pill on cards / detail meta.
    category: z.string().optional(),
    // Optional inline CSS for the category pill (background + colour). Falls
    // back to a per-category map in the page when omitted.
    featured: z.boolean().default(false),
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
  footer,
  proof,
  lookbook,
  blog,
  authors,
};
