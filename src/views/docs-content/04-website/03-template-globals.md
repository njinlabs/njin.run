---
title: Template globals
description: The variables and functions available in every template.
---

# Template globals

These are available in every page, layout and component, without importing anything.

| Global | What it is |
| --- | --- |
| `params` | URL params of the route: `params.slug` |
| `query` | The query string as an object of strings: `query.page` |
| `request.path` | The path of the request, without the query string: `/blog/hello` |
| `request.url` | The full URL, including the query string |
| `vite.asset(entry)` | The tags for a CSS or JavaScript entry |
| `vite.static(path)` | The URL of a file in `static/` |
| `imgOptimize(url, options?)` | A URL that serves the image resized and as WebP |
| `abort(status, message?)` | Stops rendering and answers with an error |
| Each registered model | `post`, `category` and so on |
| Each registered vars group | `general` and so on |
| Each registered helper | By the name you gave it |

## Request data

```edge
<p>Page {{ query.page ?? 1 }} of the blog</p>
<a class="{{ request.path === '/about' ? 'active' : '' }}" href="/about">About</a>
```

For a request to `/zz/5?a=1&b=2`, a page at `zz/[id].edge` sees:

```text
params      { "id": "5" }
query       { "a": "1", "b": "2" }
request.path  /zz/5
request.url   http://localhost:3000/zz/5?a=1&b=2
```

On a page that is [cached as static HTML](/docs/website/static-caching), `query` is empty and `request.path` is the path without a trailing slash, because the same HTML is served to every visitor.

## Models and vars

Each registered model and vars group is a global named after its prefix. Their methods are async, so call them with `await`:

```edge
@let(result = await post.read({ limit: 10 }))
@let(site = await general.get())
```

See [Reading data](/docs/website/reading-data) and [Using vars](/docs/vars/using-vars).

## Helpers

A helper is a function you register in `config.ts`, and it becomes a global of the same name. Besides your own, njin adds `imgOptimize`. See [Helpers](/docs/extending/helpers).

## vite

```edge
{{{ await vite.asset('src/client/app.css') }}}
<img src="{{ vite.static('logo.svg') }}" alt="Logo" />
```

`vite.asset()` returns HTML tags, so print it with three braces. See [Tailwind and Alpine.js](/docs/website/tailwind-and-alpine) and [Static assets](/docs/website/static-assets).

## imgOptimize

```edge
<img src="{{ imgOptimize(item.thumbnail.url, { w: 800 }) }}" alt="" />
```

See [Image optimization](/docs/website/image-optimization).

## abort

`abort(404)` stops the page and answers with that status. An optional message is passed to the error page:

```edge
@if(!item)
  {{ abort(404, 'Post not found') }}
@end
```

The status can be any code. The response uses `src/views/errors/<status>.edge` if it exists. See [Layouts and pages](/docs/website/layouts-and-pages#custom-error-pages).

## Escaping

`{{ value }}` escapes HTML, and `{{{ value }}}` does not. Use three braces only for content you trust, such as a `richtext` field or the output of `vite.asset()`.
