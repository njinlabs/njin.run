---
title: Your first model
description: Define a model, edit it in the admin panel, and show it on a page.
---

# Your first model

In this walkthrough you build a small blog: a `post` model, its admin screen and API, and two pages that list and show posts.

## Define a model

Create `src/models/post.ts`:

```ts
import { makeModel, text, richtext } from "@njinlabs/njin";
import z from "zod";

const post = makeModel("post", {
  name: "Post",
  searchFields: ["title", "excerpt"],
  schema: z.object({
    title: text({ label: "Title" }),
    slug: text({ label: "Slug", unique: true }),
    excerpt: text({ label: "Excerpt" }),
    body: richtext({ label: "Body" }),
  }),
});

export default post;
```

- The first argument, `"post"`, is the model's prefix. It becomes the API path (`/api/post`) and the name you use in templates.
- `name` is the label shown in the admin panel.
- `searchFields` lists the fields used for search. It is required.
- `schema` is a Zod object. Each field is built with a njin helper such as `text()` or `richtext()`, which takes the label shown in the admin form.
- `unique: true` makes njin reject a second post with the same slug.

Every record also gets `id`, `createdAt`, `updatedAt` and `createdBy` automatically. Do not declare those yourself.

## Register it

Add the model to `config.ts`:

```ts
export default defineConfig({
  // ...
  models: [() => import("./src/models/post")],
});
```

Restart the dev server. njin reads `config.ts` at startup, so a new model is picked up after a restart.

The model now has:

- `GET` and `POST` on `/api/post`
- `GET`, `PUT` and `DELETE` on `/api/post/:id`
- A **Post** section in the admin panel

## Manage it in the admin panel

Open `http://localhost:3000/_admin`, sign in, and open **Post**. Create a post. The form is built from your schema, so you will see a Title, a Slug, an Excerpt and a rich text editor for the Body.

Because `slug` is `unique`, saving a second post with the same slug is rejected: the API answers `409` with a message naming the field.

## Show it on a page

Every registered model is available in templates as an async function named after its prefix. Create `src/views/pages/blog/index.edge`:

```html
@component('layouts/main')
  @slot('title')
    Blog
  @end

  @slot('main')
    @let(result = await post.read({ sort: 'createdAt', order: 'desc', limit: 12 }))

    <div class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="text-3xl font-bold">Blog</h1>
      @each(item in result.data)
        <a href="/blog/{{ item.slug }}" class="mt-8 block">
          <h2 class="text-xl font-semibold">{{ item.title }}</h2>
          <p class="text-slate-600">{{ item.excerpt }}</p>
        </a>
      @end
    </div>
  @end
@end
```

`post.read()` returns `{ data, meta }`. `data` is the list of records, and `meta` holds `total`, `page`, `limit` and `pageCount`.

This example assumes a layout at `src/views/layouts/main.edge`. Use your own layout's name if it differs.

Then create `src/views/pages/blog/[slug].edge` for a single post. The file name in square brackets becomes a URL parameter, available as `params.slug`:

```html
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
    <article class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="text-4xl font-bold">{{ item.title }}</h1>
      <div class="mt-8">{{{ item.body }}}</div>
    </article>
  @end
@end
```

Two details worth noticing:

- `richtext` fields store HTML. Output them with three braces, `{{{ item.body }}}`, so the HTML is not escaped. Use two braces for plain text.
- `abort(404)` stops the render and returns a 404 page when no post matches the slug.

Open `http://localhost:3000/blog` to see your post.

## Next steps

- All the field types you can use: [Field types](/docs/models/field-types)
- Add drafts and publishing: [Draft and publish](/docs/models/draft-and-publish)
- Everything `read()` accepts: [Reading data](/docs/website/reading-data)
