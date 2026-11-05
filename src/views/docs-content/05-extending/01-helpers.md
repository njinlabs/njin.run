---
title: Helpers
description: Add your own functions to every template.
---

# Helpers

A helper is a plain function that you make available in every template. It has no database record and no API endpoint. It is just a function you can call from `.edge` files.

## Defining a helper

Create a file in `src/helpers/` that default-exports `defineHelper(name, fn)`:

```ts
// src/helpers/format_date.ts
import { defineHelper } from "@njinlabs/njin";

export default defineHelper("formatDate", (date: string, locale = "en-US") => {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
```

- The first argument is the name the helper has in templates.
- The function can take any arguments and return anything. It may be `async`.

## Registering a helper

Add the file to `config.ts`:

```ts
export default defineConfig({
  helpers: [() => import("./src/helpers/format_date")],
});
```

Restart the dev server after changing `config.ts`.

## Using a helper in templates

Call it by name. A synchronous helper needs no `await`:

```edge
<time>{{ formatDate(post.createdAt) }}</time>
```

An `async` helper is called with `await`, like a model method:

```edge
@let(rate = await exchangeRate('USD'))
```

If the helper returns HTML that you trust, print it with three braces: `{{{ icon('arrow-right-duotone') }}}`. With two braces the HTML is escaped. This project's own `icon()` helper works this way.

## Things to know

- Helpers are stateless functions. If you need to read data, call a model inside an `async` helper, or load the data in the template and pass it in.
- A helper's name becomes a global, next to your models, vars and `params`. Pick a name that does not collide with any of them.
- Helpers are for templates. In server code such as hooks, routes and events, import and call the function directly.
