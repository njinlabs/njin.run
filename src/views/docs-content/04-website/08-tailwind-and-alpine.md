---
title: Tailwind and Alpine.js
description: Style pages with Tailwind CSS and add interactivity with Alpine.js.
---

# Tailwind and Alpine.js

A njin project comes with Tailwind CSS v4 for styling and Alpine.js v3 for small interactions in the browser. Vite builds both.

## Client entry points

Your browser code lives in `src/client/`:

| File | What it is |
| --- | --- |
| `app.css` | The CSS entry. It imports Tailwind and tells it to scan your templates |
| `main.ts` | The JavaScript entry. It starts Alpine.js |

Add them to your layout with `vite.asset()`:

```edge
<head>
  {{{ await vite.asset('src/client/app.css') }}}
  {{{ await vite.asset('src/client/main.ts') }}}
</head>
```

`vite.asset()` returns the right tags for the mode:

- In development, the tags point at the Vite dev server and include its hot reload client, so styles and scripts update without a refresh.
- In production, they point at the files that `njin build` produced, which are looked up in the Vite manifest. If the manifest does not exist, `vite.asset()` outputs an HTML comment telling you to run the build.

Both entries are declared in `vite.config.ts` as build inputs. If you add another entry file, add it to `rollupOptions.input` there too.

## Tailwind CSS

Tailwind v4 has no config file. You use utility classes in your templates:

```edge
<div class="mx-auto max-w-3xl px-6 py-16">
  <h1 class="text-4xl font-bold">Hello</h1>
</div>
```

Put your own CSS in `app.css`, and customize the design with `@theme` there. Tailwind scans your `.edge` templates to find the classes you use.

## Alpine.js

Alpine adds behaviour with attributes in your HTML:

```edge
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open" x-transition>Content</div>
</div>
```

`main.ts` starts Alpine:

```ts
import Alpine from "alpinejs";

window.Alpine = Alpine;
Alpine.start();
```

Alpine runs in the browser, and njin's REST API requires authentication, so a public page should not fetch its content from the API. Read it on the server with [`read()`](/docs/website/reading-data) and render it in the template instead. Use Alpine for behaviour: menus, tabs, toggles and the like.

## Adding libraries

Install a package with `bun add`, then import it in `main.ts`. Alpine plugins are registered there before `Alpine.start()`:

```ts
import Alpine from "alpinejs";
import collapse from "@alpinejs/collapse";

Alpine.plugin(collapse);
window.Alpine = Alpine;
Alpine.start();
```
