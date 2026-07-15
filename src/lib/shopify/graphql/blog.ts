// ============================================================
//  Blog GraphQL operations — Shopify's native blog/article objects
//  (2026-04). Author profiles resolve from an `author` Metaobject via
//  a metafield reference on the article (see config/marvexa.ts `BLOG`).
// ============================================================

// Shared across list + detail so both expose the same shape to transforms.ts.
const ARTICLE_FIELDS = /* GraphQL */ `
  id
  handle
  title
  excerpt
  contentHtml
  image {
    url
    altText
  }
  tags
  publishedAt
  authorV2 {
    name
    bio
  }
  authorProfile: metafield(namespace: $authorNamespace, key: $authorKey) {
    reference {
      ... on Metaobject {
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

/** Every article in the blog, newest first. Small blog (<250 posts) — fetched in one call. */
export const BLOG_ARTICLES_QUERY = /* GraphQL */ `
  query BlogArticles($blogHandle: String!, $authorNamespace: String!, $authorKey: String!, $first: Int!) {
    blog(handle: $blogHandle) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          ${ARTICLE_FIELDS}
        }
      }
    }
  }
`;

/** A single article by handle. */
export const ARTICLE_BY_HANDLE_QUERY = /* GraphQL */ `
  query ArticleByHandle($blogHandle: String!, $articleHandle: String!, $authorNamespace: String!, $authorKey: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        ${ARTICLE_FIELDS}
      }
    }
  }
`;

/** An `author` Metaobject by handle — powers /blog/author/[slug] directly. */
export const AUTHOR_METAOBJECT_QUERY = /* GraphQL */ `
  query AuthorMetaobject($handle: String!) {
    metaobject(handle: { handle: $handle, type: "author" }) {
      handle
      fields {
        key
        value
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;
