---
title: Layouts and pages
description: Share a page shell, build reusable components and customize error pages.
---

# Layouts and pages

Templates are written in [EdgeJS](https://edgejs.dev) and live in `src/views/`. Pages go in `pages/`, and the pieces they share go in `layouts/` and `components/`. Template names are relative to `src/views`, so `layouts/main` is `src/views/layouts/main.edge`.

## Layouts

A layout is the HTML shell around a page: the `<head>`, the header and footer. It is an ordinary component that renders its slots:

```edge
{{-- src/views/layouts/main.edge --}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{{ await $slots.title?.() ?? 'My site' }}}</title>
  {{{ await vite.asset('src/client/main.ts') }}}
</head>
<body>
  {{{ await $slots.main() }}}
</body>
</html>
```

- `$slots.title?.()` renders the `title` slot if the page provides one. The `?.` and the `??` fallback make it optional.
- `$slots.main()` renders the `main` slot.
- Slot output is already HTML, so print it with three braces.
- `vite.asset()` adds your CSS and JavaScript. See [Tailwind and Alpine.js](/docs/website/tailwind-and-alpine).

## Pages

A page uses a layout with `@component` and fills its slots with `@slot`:

```edge
{{-- src/views/pages/about.edge --}}
@component('layouts/main')
  @slot('title')
    About
  @end

  @slot('main')
    <h1>About us</h1>
  @end
@end
```

Variables you define with `@let` **before** the `@component` are available inside every slot, which is handy for loading a record once and using it in both the title and the body:

```edge
@let(result = await post.read({ filters: { slug: params.slug }, limit: 1 }))
@let(item = result.data[0])
@if(!item)
  {{ abort(404) }}
@end

@component('layouts/main')
  @slot('title')
    {{ item.title }}
  @end
  @slot('main')
    <h1>{{ item.title }}</h1>
  @end
@end
```

## Components and slots

A component is a template that you call with props and slots. Props arrive as variables:

```edge
{{-- src/views/components/card.edge --}}
<div class="card">
  <h3>{{ title }}</h3>
  {{{ await $slots.main() }}}
</div>
```

Call it with `@component` when it has slot content, or with `@!component` when it does not:

```edge
@component('components/card', { title: 'Hello' })
  <p>Body of the card</p>
@end

@!component('components/card', { title: 'Empty card' })
```

Named slots work the same way as in layouts. Check for an optional one before calling it:

```edge
{{{ $slots.footer ? await $slots.footer() : '' }}}
```

## Including a partial

`@include` pastes another template in place. It takes only the template name, with no props:

```edge
@include('partials/analytics')
```

Use a component when you need to pass data.

## Comments

```edge
{{-- This is not sent to the browser --}}
```

## Custom error pages

To style an error page, add `src/views/errors/<status>.edge`, for example `404.edge` or `500.edge`. The template receives `statusCode` and `message`:

```edge
{{-- src/views/errors/404.edge --}}
<h1>{{ statusCode }}</h1>
<p>{{ message }}</p>
```

This template is rendered on its own, so use `@component` inside it if you want your layout around it.

Errors reach this template in two ways: a page calls `abort(status, message?)`, or no page matches the URL. When there is no template for a status, njin shows a plain built-in page.

If a page throws an unexpected error, `njin dev` shows a debug page with the stack trace. In production the visitor gets `errors/500.edge`, or the built-in page, and the error is logged.

## Default response headers

Every page is sent with these headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a `Content-Security-Policy` limited to `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'`. In production over HTTPS, `Strict-Transport-Security` is added too.
