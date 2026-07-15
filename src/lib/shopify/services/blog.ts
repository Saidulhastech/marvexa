// ============================================================
//  Blog service — Shopify's native blog/article objects (2026-04)
// ============================================================
import { shopifyFetch } from '../client';
import { ARTICLE_BY_HANDLE_QUERY, AUTHOR_METAOBJECT_QUERY, BLOG_ARTICLES_QUERY } from '../graphql/blog';
import { mapArticleDetail, mapArticleSummary, mapAuthorMetaobject } from '../transforms';
import type { BlogArticle, BlogArticleSummary, BlogAuthor } from '../types';
import { BLOG } from '~/config/marvexa';

const authorFieldVars = { authorNamespace: BLOG.authorMetafield.namespace, authorKey: BLOG.authorMetafield.key };

/** Every published article, newest first. Small blog (<250 posts) — one call, filtered/sorted in-page like the old content collection. */
export async function getBlogArticles(first = 250): Promise<BlogArticleSummary[]> {
  const data = await shopifyFetch<{ blog: { articles: { nodes: any[] } } | null }>(BLOG_ARTICLES_QUERY, {
    blogHandle: BLOG.handle,
    first,
    ...authorFieldVars,
  });
  return (data.blog?.articles.nodes ?? []).map(mapArticleSummary);
}

/** A single article by handle, or null if it doesn't exist. */
export async function getArticleByHandle(handle: string): Promise<BlogArticle | null> {
  const data = await shopifyFetch<{ blog: { articleByHandle: any | null } | null }>(ARTICLE_BY_HANDLE_QUERY, {
    blogHandle: BLOG.handle,
    articleHandle: handle,
    ...authorFieldVars,
  });
  const article = data.blog?.articleByHandle;
  return article ? mapArticleDetail(article) : null;
}

/** An author profile by its Metaobject handle (the /blog/author/[slug] slug), or null if it doesn't exist. */
export async function getAuthorByHandle(handle: string): Promise<BlogAuthor | null> {
  const data = await shopifyFetch<{ metaobject: any | null }>(AUTHOR_METAOBJECT_QUERY, { handle });
  return mapAuthorMetaobject(data.metaobject) ?? null;
}
