---
title: Validation
description: Required fields, chained rules, defaults and unique values.
---

# Validation

Validation rules live in the model's schema. The REST API enforces them on every `POST` and `PUT`, and answers with `422` when a request breaks one.

## Required and optional

Every field is required by default. To make one optional, pass a rule as the last argument. The rule is a function that receives the underlying Zod type and returns the type you want:

```ts
schema: z.object({
  title: text({ label: "Title" }),
  subtitle: text({ label: "Subtitle" }, (z) => z.optional()),
}),
```

## Chained rules

The same callback is where you add Zod rules. It receives the Zod type of the field, such as a string for `text()`, so its methods are available directly:

```ts
title: text({ label: "Title" }, (z) => z.min(3).max(100)),
price: numeric({ label: "Price" }, (z) => z.min(0)),
images: array({ label: "Images" }, text({ label: "URL" }), (z) => z.min(1)),
```

## Defaults

Use `z.default()` to give a field a value when a request leaves it out:

```ts
featured: boolean({ label: "Featured?" }, (z) => z.default(false)),
```

Defaults are applied by the API. A record you create with `model.create()` in your own code does not get them.

## Validation errors

When a request breaks a rule, the API answers `422` with one entry per invalid field:

```json
{
  "message": "Validation error",
  "errors": [
    { "path": "title", "message": "Too small: expected string to have >=3 characters" },
    { "path": "status", "message": "Invalid option: expected one of \"DRAFT\"|\"PUBLISH\"" }
  ]
}
```

## Unique fields

Add `unique: true` to a field's meta to reject duplicates:

```ts
slug: text({ label: "Slug", unique: true }),
```

A request that would create a second record with the same value, or change one to a value that is taken, is rejected with `409`:

```json
{ "message": "Field \"slug\" must be unique — value already exists", "field": "slug" }
```

Things to know:

- The check runs in njin before the record is written. It is not a database index, so two requests that arrive at the same moment could both pass. This is a deliberate trade-off.
- It also runs for `model.create()` and `model.update()` calls in your own code, which throw `UniqueConstraintError` (exported from `@njinlabs/njin`).
- On a model with `i18n: true`, a localized field is unique within each language.
- On a draftable model, uniqueness is enforced on the working copy.

## Validating data in your own code

`model.create()` and `model.update()` do not run the schema's rules. To validate data from an outside source, parse it with the model's schema first:

```ts
const data = post.validation.parse(input); // throws a ZodError when invalid
await post.create(data);
```
