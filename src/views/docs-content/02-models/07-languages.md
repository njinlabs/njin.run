---
title: Languages (i18n)
description: Store and serve content in more than one language.
---

# Languages (i18n)

A model with i18n keeps a separate value for each language in the fields you mark as localized. Other fields stay the same in every language.

> **Decide this when you create the model.** Converting a model that already has data to i18n, or marking an existing field `localized`, is not supported. There is no migration, and the old records would not appear when you read by language.

## Configuring locales

List the languages of the site in `config.ts`:

```ts
export default defineConfig({
  i18n: { locales: ["id", "en"], defaultLocale: "id" },
});
```

`defaultLocale` is used when a translation is missing. It defaults to the first entry of `locales`.

## Localized fields

Set `i18n: true` on the model and `localized: true` on each field that differs per language:

```ts
const page = makeModel("page", {
  name: "Page",
  searchFields: ["title"],
  i18n: true,
  schema: z.object({
    slug: text({ label: "Slug", unique: true }),
    title: text({ label: "Title", localized: true }),
    body: richtext({ label: "Body", localized: true }),
  }),
});
```

Here `slug` is the same in every language, and `title` and `body` are per language. Any field type can be localized, including arrays and objects. Localized fields can also be files: `file({ label: "Cover", localized: true })`.

Write a localized field as an object keyed by language:

```ts
await page.create({
  slug: "about",
  title: { id: "Tentang", en: "About" },
  body: { id: "<p>...</p>", en: "<p>...</p>" },
});
```

When you update, a language you leave out is untouched:

```ts
await page.update(id, { title: { en: "About us" } }); // the id title is unchanged
```

`unique: true` on a localized field is unique within each language.

## Reading by language

Pass `locale` to get one language as flat records:

```edge
@let(result = await page.read({ locale: 'en', filters: { slug: params.slug } }))
```

```ts
await page.show(id, { locale: "en" });
```

- The record's `id` is the record's id, and `locale` is set on it.
- Only records that have that language are listed.
- A localized value missing in that language falls back to the default locale. Pass `fallback: false` to turn that off.

Without `locale`, `read()` and `show()` return every language, and a localized field comes back as an object: `{ id: "Tentang", en: "About" }`. This is what the admin panel edits.

To delete one language of a record:

```ts
await page.removeLocale(id, "en");
```

The last remaining language cannot be deleted. Delete the record instead.

## Relations to localized models

Relations follow the model they point at. A relation to a model without i18n is the same in every language. A relation to a model with i18n comes back as that record in the language being read, or in the default language when you do not pass `locale`. `select: ["category.name"]` and `searchFields: ["category.name"]` use the related record's text in the language being read.

## Drafts per language

With `draftable: true` as well, each language is drafted and published on its own:

```ts
await page.publish(id, { locale: "en" }); // also unpublish and discard
await page.publish(id); // no locale: every language the record has
```

A record's `status` is then an object: `{ id: "draft", en: "published" }`.

Read what is live with `published`. A `locale` is required here:

```ts
await page.published.read({ locale: "en" });
await page.published.show(id, { locale: "en" });
```

Over HTTP: `POST /api/page/:id/publish?locale=en`.

## HTTP

- `GET /api/page?locale=en` and `GET /api/page/:id?locale=en` return one language, flat. Add `fallback=false` to turn off the fallback.
- `DELETE /api/page/:id/locale/en` deletes one language. It answers `409` for the last language.
