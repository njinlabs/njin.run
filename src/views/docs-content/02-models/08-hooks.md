---
title: Hooks
description: Run code before or after a model is created, updated, deleted or published.
---

# Hooks

Hooks let you run your own code at a fixed point in a model's life. A `before` hook can change the data or stop the operation. An `after` hook reacts to what happened.

## Lifecycle hooks

All hook functions are imported from `@njinlabs/njin` and take the model as their first argument.

| Hook | Receives | When |
| --- | --- | --- |
| `beforeCreate(model, fn)` | `data` | Before a record is created |
| `afterCreate(model, fn)` | `record` | After a record is created |
| `beforeUpdate(model, fn)` | `data`, `{ id }` | Before a record is updated |
| `afterUpdate(model, fn)` | `record` | After a record is updated |
| `beforeDestroy(model, fn)` | `id` | Before a record is deleted |
| `afterDestroy(model, fn)` | `record` | After a record is deleted |
| `afterPublish(model, fn)` | `record` | After a record is published (draftable models) |
| `afterUnpublish(model, fn)` | `record` | After a record is unpublished (draftable models) |

Settings groups have their own hooks: `beforeVarsUpdate`, `afterVarsUpdate`, `afterVarsPublish` and `afterVarsUnpublish`. See [Vars](/docs/vars/defining-vars).

Hooks run for every create, update and delete, whether it comes from the REST API, the admin panel, or a call such as `post.create()` in your own code.

## Writing a hook

Put hooks in a file, for example under `src/events/`, and register the file in the `hooks` list of `config.ts`:

```ts
// src/events/post_hooks.ts
import { beforeCreate, afterCreate } from "@njinlabs/njin";
import post from "../models/post";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

beforeCreate(post, (data) => {
  if (!data.slug && data.title) return { slug: slugify(data.title) };
});

afterCreate(post, (record) => {
  // react to the new record
});
```

```ts
// config.ts
export default defineConfig({
  hooks: [() => import("./src/events/post_hooks")],
});
```

The file is imported when the server starts, and importing it registers the hooks. Restart the dev server after adding one.

## Changing data in a before hook

A `beforeCreate` or `beforeUpdate` hook can return an object. It is merged into the data before the record is written:

```ts
beforeCreate(post, (data) => {
  return { title: data.title?.trim() };
});
```

Hooks for the same event run one after another, in the order they were registered, and each receives the data as the previous one left it. Return nothing to leave the data as it is.

Remember that the API validates a request **before** hooks run. For the slug example above to work, `slug` must be optional in the schema, because a request without it would be rejected first:

```ts
slug: text({ label: "Slug", unique: true }, (z) => z.optional()),
```

## Stopping an operation

Throw an error in a `before` hook to cancel the create, update or delete:

```ts
beforeDestroy(page, async (id) => {
  const record = await page.show(id);
  if (record?.slug === "home") throw new Error("The homepage cannot be deleted");
});
```

The record is not changed. Over the REST API, the request fails with `500 Internal Server Error`. In your own code, the error reaches your `try`/`catch`.

An error thrown in an `after` hook also reaches the caller, after the change has already been made.

## Hooks vs. events

Hooks belong to one model and can stop the operation. [Events](/docs/extending/events) are for notifying other parts of your app: a listener that throws is logged but never stops the code that dispatched the event. A common pattern is to dispatch an event from an `after` hook.
