---
title: Filtering and pagination
description: Search, filter, sort and page a list with query parameters.
---

# Filtering and pagination

`GET /api/{prefix}` takes these query parameters. They map to the options of `read()`, which are described in [Reading data](/docs/website/reading-data).

| Parameter | Default | What it does |
| --- | --- | --- |
| `page` | `1` | The page number |
| `limit` | `20` | Records per page, from 1 to 100 |
| `sort` | | A field to sort by: a field of the model, or `id`, `createdAt`, `updatedAt` |
| `order` | `asc` | `asc` or `desc` |
| `search` | | Searches the model's `searchFields` |
| `filters[...]` | | Conditions on fields. See below |
| `select` | | A comma-separated list of fields to return |
| `populate` | | A comma-separated list of relations to expand, or `none` |
| `locale`, `fallback` | | For models with i18n. See [Languages](/docs/models/languages) |

A `limit` above 100 is rejected with `422`. Unknown field names in `sort`, `select` and `filters` are ignored.

## Pagination

The `meta` object in the response describes where you are:

```json
{ "meta": { "total": 42, "page": 2, "limit": 20, "pageCount": 3 } }
```

```
GET /api/post?page=2&limit=20
```

## Sorting

```
GET /api/post?sort=createdAt&order=desc
```

## Searching

```
GET /api/post?search=hello
```

## Filtering

Filters use bracket notation, which works out of the box with Axios, `qs` and similar libraries. A plain value means equality, and an operator goes in a second pair of brackets:

```
GET /api/post?filters[status]=PUBLISH
GET /api/post?filters[price][$gte]=100&filters[status][$ne]=DRAFT
GET /api/post?filters[title][$contains]=hello
```

| Operator | Meaning |
| --- | --- |
| `$eq` | Equal |
| `$ne` | Not equal |
| `$gt`, `$gte` | Greater than, greater than or equal |
| `$lt`, `$lte` | Less than, less than or equal |
| `$contains` | Contains the text, ignoring case |
| `$startsWith` | Starts with the text |
| `$in` | An array field contains the value |

Values are strings in a URL. For a `numeric` field, `"100"` is read as the number `100`, and for a `boolean` field, `"true"` and `"false"` are read as booleans. A relation is filtered with the related record's id: `filters[author]=<id>`.

## Selecting fields

`select` returns only some fields. `id` is always included:

```
GET /api/post?select=title,slug,createdAt
GET /api/post?select=title,author.name
```

`author.name` picks one field of a related record, one level deep. A name that does not exist is dropped, and if none are valid you get the full record.

## Populating relations

By default a list expands every relation into the related record. Expand only some, or none:

```
GET /api/post?populate=author
GET /api/post?populate=none
```

With `populate=none`, a relation is returned as an id.

## Users, access groups and files

`GET /api/user`, `GET /api/access_group` and `GET /api/file` take the same `search`, `page`, `limit`, `sort` and `order`. `/api/file` does not accept `filters`.
