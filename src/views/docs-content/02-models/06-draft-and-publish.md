---
title: Draft and publish
description: Keep a live copy of each record apart from the one being edited.
---

# Draft and publish

With drafts, editing a record never changes what visitors see. Edits go to a working copy, and a separate live copy changes only when you publish.

## Enabling drafts

Add `draftable: true` to the model:

```ts
const post = makeModel("post", {
  name: "Post",
  searchFields: ["title"],
  draftable: true,
  schema: z.object({
    title: text({ label: "Title" }),
    body: richtext({ label: "Body" }),
  }),
});
```

Every record then carries two extra fields, so do not declare fields named `status` or `publishedAt` on a draftable model:

| Field | Value |
| --- | --- |
| `status` | `"draft"`, `"published"` or `"changed"` |
| `publishedAt` | When the record was published, or `null` |

If you turn `draftable` on for a model that already has records, those records predate drafts, so they are treated as live content: when the server starts and nothing has been published yet, njin publishes the records that have no status.

## Working copy vs. live copy

| Status | Meaning |
| --- | --- |
| `draft` | Never published, or unpublished since |
| `published` | The working copy is the same as the live copy |
| `changed` | Published, but the working copy has edits that are not live yet |

A new record starts as `draft`. Editing a `published` record makes it `changed`. The live copy is untouched until you publish again.

## Publishing

```ts
await post.publish(id); // copy the working copy to the live copy
await post.unpublish(id); // take the live copy offline; the working copy stays as a draft
await post.discard(id); // throw away unpublished edits: the working copy goes back to the live copy
```

Over HTTP: `POST /api/post/:id/publish`, and likewise `/unpublish` and `/discard`.

- `discard` answers `409` when the record was never published, because there is nothing to go back to.
- Deleting a record removes both its working copy and its live copy.
- `unique` is enforced on the working copy.

## Reading published content

`read()` and `show()` return **working copies**, which is what the admin panel edits. Nothing filters drafts out of them for you. In public pages and routes, use `published`:

```edge
@let(result = await post.published.read({ sort: 'publishedAt', order: 'desc' }))
@each(item in result.data)
  <h2>{{ item.title }}</h2>
@end
```

`post.published.read()` and `post.published.show(id)` accept the same options as `read()` and `show()`.

To list only drafts in the working copies:

```ts
await post.read({ filters: { status: "draft" } });
```

## Hooks

Run code after a publish or unpublish with `afterPublish(model, fn)` and `afterUnpublish(model, fn)`. See [Hooks](/docs/models/hooks).

## With languages

When a draftable model also has `i18n: true`, each language is drafted and published on its own. See [Languages](/docs/models/languages#drafts-per-language).
