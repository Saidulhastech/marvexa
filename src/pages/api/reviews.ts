// POST /api/reviews — { productId, rating, name, email, title?, body }
// Submits a customer review to Judge.me. Server-only: keeps the private
// token off the browser, same pattern as /api/cart/*.
import type { APIRoute } from 'astro';
import { createReview, JudgeMeError } from '~/lib/judgeme';
import { json, buyerIpFrom } from '~/lib/cart-server';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const productId = String(body?.productId ?? '');
    const rating = Math.round(Number(body?.rating));
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const title = body?.title ? String(body.title).trim().slice(0, 120) : undefined;
    const reviewBody = String(body?.body ?? '').trim();

    if (!productId.startsWith('gid://shopify/Product/')) {
      return json({ ok: false, error: 'Invalid product.' }, 400);
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return json({ ok: false, error: 'Please select a rating from 1 to 5.' }, 400);
    }
    if (!name || !email || !reviewBody) {
      return json({ ok: false, error: 'Name, email and review are required.' }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return json({ ok: false, error: 'Please enter a valid email.' }, 400);
    }

    await createReview({
      productGid: productId,
      name: name.slice(0, 120),
      email,
      rating,
      title,
      body: reviewBody.slice(0, 5000),
      ipAddress: buyerIpFrom(request),
    });

    return json({ ok: true });
  } catch (err) {
    const message = err instanceof JudgeMeError ? err.message : 'Could not submit your review. Please try again.';
    return json({ ok: false, error: message }, err instanceof JudgeMeError && err.status ? err.status : 500);
  }
};
