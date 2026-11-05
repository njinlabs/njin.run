---
title: Reading data
description: Load records in templates with read() and show().
---

# Reading data

In a template, every registered model is a global with async methods. The two you use for pages are `read()` for lists and `show()` for one record.

## read()

```edge
@let(result = await post.read({ sort: 'createdAt', order: 'desc', limit: 12 }))

@each(item in result.data)
  <h2>{{ item.title }}</h2>
@end
```

`read()` returns `{ data, meta }`:

- `result.data` is the array of records.
- `result.meta` is `{ total, page, limit, pageCount }`.

## show()

`show(id)` returns one record by its id, or `undefined` when none exists:

```edge
@let(item = await post.show(params.id))
@if(!item)
  {{ abort(404) }}
@end
```

To find a record by another field, such as a slug, use `read()` with a filter:

```edge
@let(result = await post.read({ filters: { slug: params.slug }, limit: 1 }))
@let(item = result.data[0])
```

## Options reference

```ts
post.read({
  page: 1,                       // default 1
  limit: 20,                     // default 20
  sort: "title",                 // a field of the model, or "id", "createdAt", "updatedAt"
  order: "asc",                  // "asc" | "desc"
  search: "hello",               // search the model's searchFields
  populate: ["author"],          // which relations to expand
  populate: "none",              // expand none of them
  select: ["title", "slug"],     // return only these fields ("id" is always included)
  select: ["title", "author.name"], // a field of a related record
  filters: { status: "PUBLISH" },
});
```

| Option | What it does |
| --- | --- |
| `page`, `limit` | Pagination. `limit` defaults to 20. Anything that is not a positive whole number falls back to the default. `read()` itself sets no upper limit; the REST API accepts at most 100 |
| `sort`, `order` | Sort by a field. An unknown field name is ignored |
| `search` | Searches the model's `searchFields`, including related fields such as `"author.name"` |
| `populate` | By default, `read()` and `show()` replace every relation with its record. Pass a list of relation names to expand only those, or `"none"` to leave ids. See [Relations](/docs/models/relations) |
| `select` | Return only some fields. `"id"` is always included. Names that do not exist are dropped, and if none are valid you get the full record |
| `filters` | Conditions on fields. See below |
| `locale`, `fallback` | For models and relations with i18n. See [Languages](/docs/models/languages) |

On a draftable model, `read()` returns working copies. Use `post.published.read()` for what is live. See [Draft and publish](/docs/models/draft-and-publish).

## Filters

A plain value means equality. An object picks an operator:

```ts
filters: {
  status: "PUBLISH",                // equal
  status: { $eq: "PUBLISH" },       // equal, explicit
  status: { $ne: "DRAFT" },         // not equal
  price: { $gt: 100 },              // greater than
  price: { $gte: 100 },             // greater than or equal
  price: { $lt: 1000 },             // less than
  price: { $lte: 1000 },            // less than or equal
  title: { $contains: "hello" },    // contains, case-insensitive
  title: { $startsWith: "intro" },  // starts with
  tags: { $in: "javascript" },      // an array field contains the value
}
```

Things to know:

- Filters can only use fields that exist in the model's schema. Names that do not exist are ignored.
- Values may be strings. For a `numeric` field `"100"` becomes the number `100`, and for a `boolean` field `"true"` and `"false"` become booleans. A value that cannot be converted is ignored.
- A filter whose value is `undefined` or `null` is skipped, so you can pass query string values straight through. `filters: { status: query.status }` filters only when `?status=` is present.

## Pagination

```edge
@let(page = Number(query.page || 1))
@let(result = await post.read({ page: page, limit: 12 }))

@each(item in result.data)
  <h2>{{ item.title }}</h2>
@end

@if(result.meta.page > 1)
  <a href="?page={{ result.meta.page - 1 }}">Previous</a>
@end
@if(result.meta.page < result.meta.pageCount)
  <a href="?page={{ result.meta.page + 1 }}">Next</a>
@end
```

Remember that pages listed under `static` in `config.ts` ignore the query string, so a paginated list should not be one of them. See [Static page caching](/docs/website/static-caching).

## Search

```edge
@let(result = await post.read({ search: query.q }))
```

A search form is a plain `GET` form whose field is named `q`.

## Over HTTP

The same options are available on the REST API as query parameters. See [Filtering and pagination](/docs/rest-api/filtering-and-pagination).
