// ============================================================
//  Content collections — static MARVEXA content (no Shopify data).
//  Chrome (announcements/nav/footer) + home section copy live as
//  YAML data; testimonials are Markdown; blog teasers are MDX.
//  Images are stored as bare filenames and resolved at render via
//  ~/lib/asset → optimized with Astro <Image />.
// ============================================================
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';

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

export const collections = {
  announcements,
  footer,
  proof,
};
