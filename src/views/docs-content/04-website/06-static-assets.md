---
title: Static assets
description: Serve images and other files that never change.
---

# Static assets

Files that your site ships as they are, such as the logo, the favicon and fixed images, go in the `static/` folder at the project root. Files that editors upload are different: those are managed as [files](/docs/models/files).

## The static folder

```text
static/
├── favicon.svg
└── logo.svg
```

A new project starts with njin's own `favicon.svg` and `logo.svg`. Replace them with your site's.

Vite treats `static/` as its public directory:

- In development, Vite serves the files at their original URL.
- When you run `njin build`, Vite copies them to `public/`, and njin serves them from there.

## vite.static()

Reference a static file with `vite.static()` instead of writing its URL yourself:

```edge
<link rel="icon" type="image/svg+xml" href="{{ vite.static('favicon.svg') }}" />
<img src="{{ vite.static('logo.svg') }}" alt="Logo" />
```

In development it returns the address on the Vite dev server (for example `http://localhost:5173/logo.svg`), and in production it returns `/logo.svg`. Never hardcode a path or a port, or one of the two modes will break.

A file in a subfolder is referenced by its path: `vite.static('images/hero.jpg')`.

## Resizing static images

Pass a static image through `imgOptimize()` to serve a smaller WebP. Wrap its path in `vite.static()` so the address is right in development and in production:

```edge
<img src="{{ imgOptimize(vite.static('images/hero.jpg'), { w: 1200 }) }}" alt="" />
```

See [Image optimization](/docs/website/image-optimization).
