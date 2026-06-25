// ============================================================
//  Cart store (nanostores) — shared across every React island.
//  Astro mounts islands as separate roots, so a framework-agnostic
//  store is the right tool to keep the header badge, the drawer,
//  and the PDP buttons in sync. All mutations hit same-origin
//  /api/cart/* (server-side Shopify with the private token).
// ============================================================
import { atom, map } from 'nanostores';
import type { Cart } from '~/lib/shopify/types';

export const $cart = atom<Cart | null>(null);
export const $cartOpen = atom<boolean>(false);
/** A network mutation is in flight (drives button spinners). */
export const $cartBusy = atom<boolean>(false);
export const $cartError = atom<string | null>(null);
/** Per-line ids with a request in flight (drawer row spinners). */
export const $busyLines = map<Record<string, boolean>>({});

let initialized = false;

/** Hydrate the cart once on first island mount. */
export async function initCart(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    const res = await fetch('/api/cart', { headers: { accept: 'application/json' } });
    const data = await res.json();
    $cart.set(data.cart ?? null);
  } catch {
    /* offline / first load — leave cart null, surfaces empty state */
  }
}

export function openCart(): void {
  $cartOpen.set(true);
}
export function closeCart(): void {
  $cartOpen.set(false);
}
export function toggleCart(): void {
  $cartOpen.set(!$cartOpen.get());
}

interface MutationResponse {
  cart: Cart | null;
  userErrors?: { field?: string[] | null; message: string }[];
  warnings?: { code: string; message: string; target?: string | null }[];
  error?: string;
}

async function post(url: string, body: unknown): Promise<MutationResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as MutationResponse;
}

function applyResult(data: MutationResponse): MutationResponse {
  if (data.cart) $cart.set(data.cart);
  // Shopify RE-VALIDATES discount codes on every cart mutation. A stale/no-longer
  // applicable code on the cart makes cartLinesAdd/Update/Remove return a
  // discountCodes userError ("Enter a valid discount code") even though the line
  // change itself succeeded. That belongs in the coupon message area, NOT the
  // global banner — drop it here so add/remove don't flash an irrelevant error.
  const relevant = (data.userErrors ?? []).filter((e) => !isDiscountError(e));
  // Precedence: hard userError → Shopify warning (out-of-stock / qty clamped,
  // where the mutation "succeeds" but the cart didn't change as asked) → 500 error.
  const message =
    relevant[0]?.message ?? data.warnings?.[0]?.message ?? data.error ?? null;
  $cartError.set(message);
  return data;
}

/** A discount-code validation userError (field references discountCodes, or the message says so). */
function isDiscountError(e: { field?: string[] | null; message: string }): boolean {
  if (e.field?.some((f) => f.toLowerCase().includes('discountcode'))) return true;
  return /discount code/i.test(e.message);
}

/** Add a variant to the cart; opens the drawer on success by default. */
export async function addItem(
  merchandiseId: string,
  quantity = 1,
  options: { open?: boolean } = {},
): Promise<MutationResponse> {
  const { open = true } = options;
  $cartBusy.set(true);
  $cartError.set(null);
  try {
    const data = applyResult(await post('/api/cart/add', { merchandiseId, quantity }));
    if (open && data.cart) openCart();
    return data;
  } catch {
    $cartError.set('Could not add to cart. Please try again.');
    return { cart: null };
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Add several variants at once — one cart line per chosen bundle component
 * (build-your-own bundle). Opens the drawer on success. The bundle discount
 * is a Shopify automatic discount applied server-side, shown in the drawer.
 */
export async function addBundle(
  lines: { merchandiseId: string; quantity?: number }[],
  options: { open?: boolean } = {},
): Promise<MutationResponse> {
  const { open = true } = options;
  const clean = lines
    .filter((l) => l.merchandiseId?.startsWith('gid://shopify/ProductVariant/'))
    .map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity ?? 1 }));
  if (clean.length === 0) {
    $cartError.set('This bundle has nothing available to add.');
    return { cart: null };
  }
  $cartBusy.set(true);
  $cartError.set(null);
  try {
    const data = applyResult(await post('/api/cart/add-bundle', { lines: clean }));
    if (open && data.cart) openCart();
    return data;
  } catch {
    $cartError.set('Could not add the bundle. Please try again.');
    return { cart: null };
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Buy now: checks out a single item via a SEPARATE one-off cart, so the
 * shopper's persistent cart isn't polluted if they abandon checkout.
 */
export async function buyNow(merchandiseId: string, quantity = 1): Promise<void> {
  $cartBusy.set(true);
  $cartError.set(null);
  try {
    const res = await fetch('/api/cart/buy-now', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchandiseId, quantity }),
    });
    const data = (await res.json()) as { checkoutUrl?: string | null; userErrors?: { message: string }[] };
    const url = data.checkoutUrl;
    if (url) {
      window.location.href = url;
    } else {
      $cartError.set(data.userErrors?.[0]?.message ?? 'Could not start checkout. Please try again.');
    }
  } catch {
    $cartError.set('Could not start checkout. Please try again.');
  } finally {
    $cartBusy.set(false);
  }
}

export async function updateItem(lineId: string, quantity: number): Promise<void> {
  $busyLines.setKey(lineId, true);
  $cartError.set(null);
  try {
    applyResult(await post('/api/cart/update', { lineId, quantity }));
  } catch {
    $cartError.set('Could not update the cart.');
  } finally {
    $busyLines.setKey(lineId, false);
  }
}

export async function removeItem(lineId: string): Promise<void> {
  $busyLines.setKey(lineId, true);
  $cartError.set(null);
  try {
    applyResult(await post('/api/cart/remove', { lineId }));
  } catch {
    $cartError.set('Could not remove the item.');
  } finally {
    $busyLines.setKey(lineId, false);
  }
}

/**
 * Remove every line in ONE atomic mutation. Looping removeItem() per line
 * fired N concurrent requests whose responses raced — a failure or out-of-order
 * reply could leave a stale line behind. cartLinesRemove takes the full id set.
 */
export async function clearCart(): Promise<void> {
  const lineIds = ($cart.get()?.lines ?? []).map((l) => l.id);
  if (!lineIds.length) return;
  $cartBusy.set(true);
  $cartError.set(null);
  try {
    applyResult(await post('/api/cart/remove', { lineIds }));
  } catch {
    $cartError.set('Could not clear the cart.');
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Save the order note to the cart (Shopify `cartNoteUpdate`). Surfaces on the
 * order in the Shopify admin. Errors are non-fatal — kept off the global banner.
 */
export async function setNote(note: string): Promise<MutationResponse> {
  $cartBusy.set(true);
  try {
    const data = await post('/api/cart/note', { note });
    if (data.cart) $cart.set(data.cart);
    return data;
  } catch {
    return { cart: null, error: 'Could not save the note.' };
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Replace the cart's custom attributes (gift message, gift-wrap flag, plan id).
 * Wholesale replace — pass the full desired set each call.
 */
export async function setAttributes(
  attributes: { key: string; value: string }[],
): Promise<MutationResponse> {
  $cartBusy.set(true);
  try {
    const data = await post('/api/cart/attributes', { attributes });
    if (data.cart) $cart.set(data.cart);
    return data;
  } catch {
    return { cart: null, error: 'Could not save cart details.' };
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Apply discount codes via Shopify (replaces any current codes).
 * Discount validation feedback ("invalid code", etc.) is returned to the caller
 * and shown in the coupon message area ONLY — it must NOT go through applyResult,
 * which would set the global $cartError banner and leave a sticky "Enter a valid
 * discount code" at the top of the cart long after the coupon attempt.
 */
export async function applyDiscount(codes: string[]): Promise<MutationResponse> {
  $cartBusy.set(true);
  try {
    const data = await post('/api/cart/discount', { codes });
    if (data.cart) $cart.set(data.cart); // keep the cart fresh (totals/chips)
    return data;
  } catch {
    return { cart: null, error: 'Could not reach the server. Please try again.' };
  } finally {
    $cartBusy.set(false);
  }
}

/**
 * Jump to Shopify's hosted checkout. Re-fetches the cart first so we never
 * redirect to a stale/expired checkoutUrl (which lands on a dead/empty
 * checkout). Falls back to the cached url, and surfaces an error if none.
 */
export async function checkout(): Promise<void> {
  $cartBusy.set(true);
  try {
    let url = $cart.get()?.checkoutUrl ?? null;
    try {
      const res = await fetch('/api/cart', { headers: { accept: 'application/json' } });
      const data = (await res.json()) as { cart: Cart | null };
      if (data.cart) {
        $cart.set(data.cart);
        url = data.cart.checkoutUrl;
      } else {
        url = null; // cart expired server-side
      }
    } catch {
      /* network — fall back to the cached url below */
    }
    if (url) {
      window.location.href = url;
    } else {
      $cartError.set('Your cart has expired. Please add items again.');
    }
  } finally {
    $cartBusy.set(false);
  }
}
