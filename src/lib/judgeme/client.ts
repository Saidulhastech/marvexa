// Judge.me REST API — server-only. Same rule as the Shopify layer: the
// private token never reaches the browser, so this is called from PDP
// frontmatter (SSR), not client <script>. Secrets read lazily via
// getSecret() — reading at module top level yields undefined on Workers.
import { getSecret } from 'astro:env/server';

export class JudgeMeError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'JudgeMeError';
    this.status = status;
  }
}

const BASE = 'https://judge.me/api/v1';

const getToken = () => getSecret('JUDGEME_PRIVATE_TOKEN');
const getShopDomain = () => getSecret('SHOPIFY_SHOP_DOMAIN');

export function judgemeConfigured(): boolean {
  return !!getToken() && !!getShopDomain();
}

export async function judgemeFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const token = getToken();
  const shopDomain = getShopDomain();
  if (!token || !shopDomain) {
    throw new JudgeMeError('Judge.me is not configured (missing JUDGEME_PRIVATE_TOKEN or shop domain)');
  }

  const qs = new URLSearchParams({ api_token: token, shop_domain: shopDomain });
  for (const [key, value] of Object.entries(params)) {
    if (value != null) qs.set(key, String(value));
  }

  const res = await fetch(`${BASE}${path}?${qs.toString()}`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new JudgeMeError(`Judge.me API ${path} failed: ${res.status} ${res.statusText}`, res.status);
  }

  return res.json() as Promise<T>;
}

/** POST (review creation) — Judge.me returns 422 + an `errors` object on validation failure. */
export async function judgemePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getToken();
  const shopDomain = getShopDomain();
  if (!token || !shopDomain) {
    throw new JudgeMeError('Judge.me is not configured (missing JUDGEME_PRIVATE_TOKEN or shop domain)');
  }

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ api_token: token, shop_domain: shopDomain, platform: 'shopify', ...body }),
    signal: AbortSignal.timeout(8000),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new JudgeMeError(summarizeErrors(data), res.status);
  }
  return data as T;
}

function summarizeErrors(data: unknown): string {
  const errors = data && typeof data === 'object' ? (data as { errors?: unknown }).errors : undefined;
  if (!errors) return 'Could not submit your review. Please try again.';
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) return errors.join(', ');
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>)
      .map(([field, msgs]) => `${field} ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
      .join('; ');
  }
  return 'Could not submit your review. Please try again.';
}
