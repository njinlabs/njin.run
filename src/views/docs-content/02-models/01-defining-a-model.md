---
title: Defining a model
description: Describe your content once and get an API and an admin screen.
---

# Defining a model

A model describes one kind of content: its fields, how they are validated, and how they appear in the admin panel. You define it with `makeModel()` in `src/models/`.

## Basic example

```ts
// src/models/post.ts
import { makeModel, text, richtext } from "@njinlabs/njin";
import z from "zod";

const post = makeModel("post", {
  name: "Post",
  searchFields: ["title", "body"],
  schema: z.object({
    title: text({ label: "Title" }),
    body: richtext({ label: "Body" }),
  }),
});

export default post;
```

`makeModel(prefix, config)` takes:

| Option | Required | What it does |
| --- | --- | --- |
| `prefix` (first argument) | Yes | The API path (`/api/post`), the name of the global you use in templates, and the table name |
| `name` | Yes | The label shown in the admin panel |
| `schema` | Yes | A `z.object()` whose fields are built with njin's field helpers. See [Field types](/docs/models/field-types) |
| `searchFields` | Yes | Fields used by `search`. Use `"author.name"` to search a field of a related record |
| `draftable` | No | Adds a draft and publish workflow. See [Draft and publish](/docs/models/draft-and-publish) |
| `i18n` | No | Lets fields hold one value per language. See [Languages](/docs/models/languages) |

A nested entry like `"author.name"` is checked when the file loads: `makeModel()` throws if `author` is not a relation or file field, or if the related model has no `name` field.

## Registering a model

A model only exists once it is listed in `config.ts`:

```ts
// config.ts
export default defineConfig({
  models: [() => import("./src/models/post")],
});
```

Restart the dev server after changing `config.ts`. On startup njin creates or updates the model's table for you.

A registered model gets:

- `GET` and `POST` on `/api/{prefix}`
- `GET`, `PUT` and `DELETE` on `/api/{prefix}/:id`
- A section in the admin panel, built from its schema
- A global in templates, named after the prefix: `await post.read()`
- Its schema in `GET /api/schema`, which is what the admin panel reads

## What you get for free

Every record has these fields in addition to your own:

| Field | Value |
| --- | --- |
| `id` | The record's id |
| `createdAt`, `updatedAt` | ISO 8601 timestamps |
| `createdBy` | The id of the user who created the record, or `null` |

You cannot declare a field named `createdBy`: `makeModel()` throws, because njin fills it in. On a draftable model, `status` and `publishedAt` are reserved in the same way.

## Working with a model in code

The value returned by `makeModel()` is the model. Use it in templates, hooks, events, routes and tests:

| Method | Returns |
| --- | --- |
| `read(options?)` | `{ data, meta }`, where `meta` is `{ total, page, limit, pageCount }`. See [Reading data](/docs/website/reading-data) |
| `show(id)` | The record, or `undefined` when there is no record with that id |
| `create(data)` | The new record |
| `update(id, data)` | The updated record. Only the fields you pass are changed |
| `destroy(id)` | The deleted record |

`create()` also accepts `{ createdBy: userId }` as a second argument to set the owner.

```ts
const created = await post.create({ title: "Hello", body: "<p>Hi</p>" });
await post.update(created.id, { title: "Hello again" });
await post.destroy(created.id);
```

These calls run the model's [hooks](/docs/models/hooks) and its unique checks, but they are **not** checked against the user's permissions. Code you write calls the model directly, so guarding it is up to you. See [Access control](/docs/access-control/your-own-code).

### Validation happens at the API

The rules in your schema are enforced on requests to the REST API (`POST` and `PUT`). Calling `post.create()` yourself skips them, and it does not apply `.default()` values either. If your code accepts data from outside, validate it first:

```ts
const data = post.validation.parse(input);
await post.create(data);
```

See [Validation](/docs/models/validation).
