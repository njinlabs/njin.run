---
title: Image optimization
description: Serve resized WebP images on the fly.
---

# Image optimization

njin can resize an image and convert it to WebP on request. The response is marked as cacheable for a year, so browsers and CDNs keep it instead of asking again.

## imgOptimize()

In templates, `imgOptimize()` returns the URL to use:

```edge
{{-- Resize --}}
<img src="{{ imgOptimize(item.thumbnail.url, { w: 800 }) }}" alt="" />

{{-- Resize and set the quality --}}
<img src="{{ imgOptimize(item.thumbnail.url, { w: 800, q: 85 }) }}" alt="" />

{{-- A fixed size for a social preview image --}}
<meta property="og:image" content="{{ imgOptimize(item.thumbnail.url, { w: 1200, h: 630 }) }}" />

{{-- Convert to WebP without resizing --}}
<img src="{{ imgOptimize(item.thumbnail.url) }}" alt="" />
```

It only builds a URL on your own site: `imgOptimize('/uploads/a.png', { w: 800, q: 85 })` returns `/img?url=%2Fuploads%2Fa.png&w=800&q=85`. The work happens when the browser requests that URL.

## The /img endpoint

`GET /img` does the conversion. It needs no authentication.

| Parameter | Required | Default | What it is |
| --- | --- | --- | --- |
| `url` | Yes | | The source image |
| `w` | No | Original | Width in pixels |
| `h` | No | Original | Height in pixels |
| `q` | No | `80` | Quality from 1 to 100. Values outside the range are clamped |

- The image keeps its aspect ratio. It is fitted inside the size you give, and is never enlarged.
- If you give only `h`, the width is worked out from it.
- The output is always WebP.
- The response is sent with `Cache-Control: public, max-age=31536000, immutable` and an `ETag`, and a repeat request with the same `ETag` gets `304`.

Errors: `400` when `url` is missing or `q` is not a number, `403` when the source is not allowed, `404` when a relative source does not exist, and `502` when an external source cannot be fetched.

## Allowed sources

To stop `/img` from being used to fetch any image on the internet, the source must be one of these:

- **A relative path**, such as `/uploads/photo.jpg`. This is always allowed, and it is what files stored with the default filesystem adapter have as their `url`.
- **`localhost` or `127.0.0.1`**, but only when not in production. This covers the Vite dev server, which serves `vite.static()` files in development.
- **A host listed in `img.hosts`** in `config.ts`.

An absolute URL to your own site's hostname is not allowed unless you list the hostname, so prefer relative paths for your own files.

```ts
// config.ts
export default defineConfig({
  img: {
    hosts: ["cdn.example.com", "images.example.com"],
  },
});
```

This matters when files live elsewhere. With the S3 adapter, a file's `url` is an absolute address on the storage service, so add its hostname to `img.hosts` before you pass those URLs to `imgOptimize()`. See [File adapters](/docs/models/files#file-adapters).

External images are fetched without following redirects.
