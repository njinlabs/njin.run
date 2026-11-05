---
title: Static page caching
description: Serve pages from cached HTML and refresh them when content changes.
---

# Static page caching

By default njin renders a page on every request. For pages that are the same for everyone, such as a home page or an article, you can have njin keep the rendered HTML and serve it from a file instead.

## Enabling caching

List the page routes in `config.ts`:

```ts
export default defineConfig({
  static: ["/", "/about", "/blog/:slug"],
});
```

In production:

- A page is rendered the first time it is requested, and the HTML is saved in `.cache/static/`.
- Every later request is served from that file, without running the template or querying the database.
- Plain routes without params, like `/` and `/about`, are also rendered at startup so even the first visitor gets the cached page.
- The cache is cleared every time the server starts.

`njin dev` ignores `static` and renders every page live, so you always see your latest changes while you work.

## Dynamic routes

A route with a param, such as `/blog/:slug`, caches each URL on its own: `/blog/hello` and `/blog/world` are two entries. The param name must match the file name: `pages/blog/[slug].edge` is `/blog/:slug`. You can also write `[slug]` in the list, and njin converts it.

A route is a page path, so wildcards and `..` segments are not allowed. njin throws an error at startup if a route is invalid.

## What a cached page must be

The same HTML is served to every visitor, so a cached page must not depend on who is asking:

- **The query string is ignored.** `query` is empty in a cached page, and `/blog?page=2` is served the same HTML as `/blog`. Do not cache pages that paginate or filter by query.
- **Nothing visitor-specific.** Do not put a signed-in user's name or a per-visitor value in the page.
- `request.url` is built from `publicUrl` in `config.ts` when you set it, and from the request's own address otherwise. Set `publicUrl` if your site is behind a proxy that changes the host.
- Pages that end in an error, such as `abort(404)`, are never cached.

## Revalidation

Without `revalidate`, a cached page changes only when you purge it. To refresh a page on its own after some time, give the route as an object:

```ts
static: [
  "/about",
  { route: "/news", revalidate: 60 },
],
```

Once a cached page is older than `revalidate` seconds, the next request still gets the old HTML, and a fresh render replaces it in the background. If that render fails, the old page stays.

## Purging

When content changes, drop the cached HTML with `purgeStatic()`:

```ts
import { purgeStatic } from "@njinlabs/njin/static";

await purgeStatic("/about");       // one URL
await purgeStatic("/blog/hello");  // one URL of a dynamic route
await purgeStatic("/blog/*");      // /blog and everything under it
await purgeStatic();               // every static page
```

Call it after the content has changed. The best place is a [hook](/docs/models/hooks):

```ts
import { afterUpdate, afterDestroy } from "@njinlabs/njin";
import { purgeStatic } from "@njinlabs/njin/static";
import post from "../models/post";

afterUpdate(post, async () => { await purgeStatic("/blog/*"); });
afterDestroy(post, async () => { await purgeStatic("/blog/*"); });
```

Plain routes that were purged are rendered again right away in the background, so no visitor waits for them. Pass `{ warm: false }` to leave them until their next request.

## Response headers

A page served from the cache carries an `X-Njin-Cache` header:

| Value | Meaning |
| --- | --- |
| `MISS` | Rendered for this request, and now cached |
| `HIT` | Served from the cache |
| `STALE` | Served from the cache while a fresh render runs in the background |
| `BYPASS` | The route is listed, but this URL cannot be cached (for example, its path is badly encoded), so it was rendered live |

It also sends `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=60`. Browsers check the `ETag` on each visit, and a shared cache in front of njin may keep the page for `s-maxage` seconds. With `revalidate`, both `s-maxage` and `stale-while-revalidate` use that number of seconds instead.

## A cache in front of njin

If a shared cache such as Varnish sits in front of njin, tell it about purges so it drops its own copy:

```ts
export default defineConfig({
  edgeCache: {
    ban: "http://127.0.0.1:6081",
    headers: { "X-Purge-Token": "secret" },
  },
});
```

`purgeStatic()` then sends an HTTP `BAN` request to each URL in `ban`, with the pattern to drop in an `X-Ban-Url` header. If the cache is down, it keeps its copy until `s-maxage` runs out.
