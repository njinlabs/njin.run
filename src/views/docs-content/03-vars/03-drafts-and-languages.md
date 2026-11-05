---
title: Drafts and languages
description: Give a settings group a live copy and a value per language.
---

# Drafts and languages

Vars groups support the same two options as models: drafts and languages. They work together or on their own.

```ts
const general = makeVars("general", {
  name: "General",
  i18n: true,
  draftable: true,
  schema: z.object({
    siteName: text({ label: "Site name" }, (z) => z.default("My Site")),
    tagline: text({ label: "Tagline", localized: true }, (z) => z.default("")),
  }),
});
```

## Localized vars

`i18n: true` needs `i18n` set in `config.ts` (see [Languages](/docs/models/languages)) and at least one field with `localized: true`. A relation field cannot be localized. It follows the language of the model it points at.

Write a localized field as an object keyed by language. A language you leave out is untouched:

```ts
await general.update({ tagline: { en: "Welcome" } });
```

Read one language, flat, with `locale`. A language that has no value of its own falls back to the default language. Pass `fallback: false` to turn that off:

```ts
await general.get({ locale: "en" });
// { siteName: "Acme", tagline: "Welcome", updatedAt: "...", ... }
```

Without `locale`, `get()` returns every language, and a localized field is an object: `tagline: { id: "", en: "Welcome" }`. This is what the admin panel edits.

## Draftable vars

`draftable: true` gives the group a live copy next to the working copy, as in [Draft and publish](/docs/models/draft-and-publish).

| Method | What it does |
| --- | --- |
| `group.get()` | The working copy, which is what the admin panel edits |
| `group.published.get()` | What is live |
| `group.publish()` | Copy the working copy to the live copy |
| `group.unpublish()` | Take the live copy offline |
| `group.discard()` | Throw away unpublished edits |

**Use `published.get()` in public templates.** Nothing is live until the first `publish()`, so before that it returns the `.default()` of every field:

```edge
@let(site = await general.published.get({ locale: 'en' }))
<title>{{ site.siteName }}</title>
```

On a draftable group, `get()` also returns `status`, which is `"draft"`, `"published"` or `"changed"`, and `publishedAt`. Do not name a field `status` or `publishedAt` on a draftable group.

## Languages and drafts together

With both options, each language is published on its own. `publish()`, `unpublish()` and `discard()` take a `locale`: one code, a list of codes, or nothing for every language.

```ts
await general.publish({ locale: "en" });
```

`status` is then an object with one entry per language: `{ id: "draft", en: "published" }`.

## API

| Request | What it does |
| --- | --- |
| `GET /api/vars/{prefix}?locale=en` | One language, flat. Add `fallback=false` to turn off the fallback |
| `GET /api/vars/{prefix}/published` | The live copy. Also takes `locale` |
| `POST /api/vars/{prefix}/publish` | Publish. Also `/unpublish` and `/discard` |
| `POST /api/vars/{prefix}/publish?locale=en` | Publish only some languages: `en` or `en,id` |

## Hooks

`afterVarsPublish(group, fn)` and `afterVarsUnpublish(group, fn)` run after a publish or unpublish, with the group's values. See [Hooks](/docs/models/hooks).
