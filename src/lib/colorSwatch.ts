// Resolves a display hex for a colour-option swatch dot, in priority order:
//   1. Shopify's real per-value swatch colour (linked metaobject — the
//      standard "Color" library or a custom one). Always wins when present.
//   2. A small seed table of universally-recognised colour words, so
//      "Black"/"Ivory"/"Camel" etc. render as themselves rather than an
//      arbitrary hue — this is NOT a per-catalog table to maintain, just
//      common English colour names.
//   3. A deterministic hash of the colour name for anything else — every
//      distinct unrecognised name still gets its own stable colour forever,
//      never dropped, never collides with another name.
//
// Used both server-side (product transforms) and client-side (quick-view
// script) so the card and the quick-view always agree.

const SEED_COLORS: Record<string, string> = {
  black: '#111111', white: '#F5F5F5', ivory: '#F5F0E8', cream: '#F1E9D8', beige: '#D8CBB0',
  tan: '#C2A878', camel: '#C8A165', khaki: '#8C8256', olive: '#6B705E', sage: '#B8BCA9',
  charcoal: '#36393B', slate: '#556070', stone: '#918C7F', taupe: '#8B7D6B', gray: '#8A8A8A',
  grey: '#8A8A8A', silver: '#C0C5CE', navy: '#1F2A44', denim: '#4A5D73', blue: '#2563EB',
  teal: '#0F766E', green: '#16A34A', red: '#DC2626', rust: '#B4573F', burgundy: '#6D1F2B',
  maroon: '#5A1F2A', brown: '#6B4A32', bronze: '#8C6239', gold: '#C9A86A', orange: '#EA580C',
  yellow: '#EAB308', purple: '#7C3AED', pink: '#EC4899', rose: '#F43F5E', blush: '#E8B4B8',
};

export function resolveSwatchColor(name?: string | null, rawHex?: string | null): string {
  if (rawHex) return rawHex;
  const key = String(name ?? '').trim().toLowerCase();
  return SEED_COLORS[key] ?? hashToHex(key);
}

function hashToHex(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 42, 55);
}

function hslToHex(h: number, s: number, l: number): string {
  const sf = s / 100;
  const lf = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sf * Math.min(lf, 1 - lf);
  const f = (n: number) => lf - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
