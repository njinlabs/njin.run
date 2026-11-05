---
title: File-based routing
description: How files in src/views/pages become URLs.
---

# File-based routing

Every `.edge` file in `src/views/pages/` is a page, and its path is its URL. There is no route table to maintain.

```text
pages/index.edge                    GET /
pages/about.edge                    GET /about
pages/blog/index.edge               GET /blog
pages/blog/[slug].edge              GET /blog/:slug
pages/portfolio/[id]/index.edge     GET /portfolio/:id
```

## Static routes

A file name becomes a path segment, and `index.edge` is the root of its folder. Pages answer `GET` requests only.

## Dynamic params

A name in square brackets is a parameter. Its value is available in the template as `params.<name>`:

```edge
{{-- src/views/pages/blog/[slug].edge, requested as /blog/hello --}}
<h1>{{ params.slug }}</h1>
```

Param values are strings. Use more than one when you need to:

```text
pages/shop/[category]/[product].edge     GET /shop/:category/:product
```

When a static route and a dynamic one could both match, the static one wins. With `pages/blog/new.edge` and `pages/blog/[slug].edge`, the URL `/blog/new` is served by `new.edge`, and `/blog/hello` by `[slug].edge`. A trailing slash is accepted: `/blog/hello/` matches the same page.

## Query strings

The query string is available as `query`, an object of strings: for `/blog?page=2`, `query.page` is `"2"`. See [Template globals](/docs/website/template-globals).

## Adding and removing pages

njin scans `src/views/pages/` when the server starts. After you add or delete a page file, restart the dev server. Editing a page that already exists is picked up without a restart.

## Missing pages

A `GET` that matches no page gets a `404`. The 404 page is `src/views/errors/404.edge` if you have one, and a plain built-in page otherwise. A page can also trigger an error itself with `abort()`. See [Layouts and pages](/docs/website/layouts-and-pages#custom-error-pages).

## Reserved paths

njin serves some paths itself, so do not create pages there: `/api`, `/_admin`, `/img`, `/uploads` and `/mcp`.

## Page views

Pageviews are recorded automatically for every page njin renders, and appear in the analytics API. There is nothing to set up. See [Analytics](/docs/rest-api/analytics).
