// ============================================================
//  Shopify Storefront API client (server-side, private token)
// ============================================================
// All Shopify traffic flows through here. It is imported only by
// server code (Astro frontmatter + /api routes), so the private
// token never reaches the browser.

// Secrets are read at request time via getSecret(): Cloudflare Workers exposes
// them per-request (no process.env, and non-PUBLIC vars aren't inlined). Reading
// at module top-level would yield undefined on the edge, so resolve lazily.
import { getSecret } from 'astro:env/server';

const getDomain = () => getSecret('SHOPIFY_SHOP_DOMAIN');
const getVersion = () => getSecret('SHOPIFY_API_VERSION') ?? '2026-04';
const getToken = () => getSecret('SHOPIFY_STOREFRONT_PRIVATE_TOKEN');
const getEndpoint = () => `https://${getDomain()}/api/${getVersion()}/graphql.json`;

export class ShopifyError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ShopifyError';
    this.status = status;
    this.details = details;
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface ShopifyFetchOptions {
  /** Real buyer IP — forwarded so Shopify's bot rate-limiting attributes correctly. */
  buyerIp?: string;
  /** Per-request timeout in ms (default 10s). */
  timeoutMs?: number;
  /** Max attempts on 429/5xx/network (default 3, i.e. 2 retries). */
  retries?: number;
  /**
   * Active localized market. When set, `country`/`language` are merged into the
   * operation's variables so a query declaring `@inContext(country: $country,
   * language: $language)` returns market-localized prices + translations. Only
   * pass this for queries that declare those variables (catalogue queries).
   */
  inContext?: { country?: string | null; language?: string | null };
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Retry on transient transport failures: rate limit + server errors. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 430 || (status >= 500 && status <= 599);
}

/**
 * Execute a Storefront GraphQL operation. Throws ShopifyError on
 * transport or GraphQL errors; otherwise returns the typed `data`.
 */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: ShopifyFetchOptions = {},
): Promise<T> {
  const domain = getDomain();
  const token = getToken();
  if (!domain || !token) {
    throw new ShopifyError(
      'Missing Shopify config. Set SHOPIFY_SHOP_DOMAIN and SHOPIFY_STOREFRONT_PRIVATE_TOKEN in .env',
    );
  }

  const endpoint = getEndpoint();
  // Merge the active market into the variables so @inContext localizes the
  // operation. Caller-supplied country/language win; null values are dropped
  // (a null variable == "use the shop default" for the @inContext directive).
  const ctx = options.inContext;
  const vars: Record<string, unknown> = ctx
    ? {
        ...variables,
        ...(ctx.country ? { country: ctx.country } : {}),
        ...(ctx.language ? { language: ctx.language } : {}),
      }
    : variables;
  const body = JSON.stringify({ query, variables: vars });
  const headers = {
    'Content-Type': 'application/json',
    'Shopify-Storefront-Private-Token': token,
    ...(options.buyerIp ? { 'Shopify-Storefront-Buyer-IP': options.buyerIp } : {}),
  };
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = Math.max(1, options.retries ?? DEFAULT_RETRIES);

  let res: Response | undefined;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
        // Abort a hung connection so a slow Shopify can't block the SSR render
        // until the platform kills the Worker.
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      // Network failure or timeout — retry with backoff, then give up.
      lastErr = cause;
      if (attempt < maxAttempts) {
        await sleep(250 * 2 ** (attempt - 1));
        continue;
      }
      const timedOut = (cause as Error)?.name === 'TimeoutError';
      throw new ShopifyError(
        timedOut ? `Shopify request timed out after ${timeoutMs}ms` : 'Network error talking to Shopify',
        undefined,
        cause,
      );
    }

    // Retry transient HTTP statuses, honouring Retry-After when present.
    if (isRetryableStatus(res.status) && attempt < maxAttempts) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** (attempt - 1);
      await sleep(wait);
      continue;
    }
    break;
  }

  if (!res) {
    throw new ShopifyError('Network error talking to Shopify', undefined, lastErr);
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch (cause) {
    throw new ShopifyError(`Invalid JSON from Shopify (HTTP ${res.status})`, res.status, cause);
  }

  if (!res.ok) {
    throw new ShopifyError(`Shopify HTTP ${res.status} ${res.statusText}`, res.status, json);
  }
  // GraphQL can return partial `data` alongside field-level `errors` — e.g. a
  // field the token isn't scoped for (`totalInventory` needs the inventory
  // scope) comes back null while the rest of the query succeeds. Honour that:
  // only throw when there is no usable data; otherwise log and return what we got.
  const hasData =
    json.data != null && Object.values(json.data as Record<string, unknown>).some((v) => v != null);
  if (json.errors?.length) {
    const message = json.errors.map((e) => e.message).join('; ');
    if (!hasData) {
      throw new ShopifyError(message, res.status, json.errors);
    }
    console.warn('[shopify] partial GraphQL errors (returning partial data):', message);
  }
  if (!json.data) {
    throw new ShopifyError('Empty response from Shopify', res.status);
  }
  return json.data;
}

// Lazy accessors — values aren't known until a request supplies the secrets.
export const shopifyConfig = {
  get DOMAIN() {
    return getDomain();
  },
  get VERSION() {
    return getVersion();
  },
  get ENDPOINT() {
    return getEndpoint();
  },
};
