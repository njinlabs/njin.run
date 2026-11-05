---
title: Model endpoints
description: The endpoints every registered model gets.
---

# Model endpoints

Registering a model in `config.ts` gives it a set of endpoints under `/api/{prefix}`. All of them need a credential and the matching permission. See [Authentication](/docs/rest-api/authentication).

| Request | What it does |
| --- | --- |
| `GET /api/{prefix}` | List records |
| `POST /api/{prefix}` | Create a record |
| `GET /api/{prefix}/:id` | Read one record |
| `PUT /api/{prefix}/:id` | Update a record |
| `DELETE /api/{prefix}/:id` | Delete a record |
| `POST /api/{prefix}/:id/publish`, `/unpublish`, `/discard` | Draft workflow. Draftable models only |
| `DELETE /api/{prefix}/:id/locale/:locale` | Delete one language. Models with i18n only |

## Creating

```bash
curl -X POST http://localhost:3000/api/post \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Hello", "slug": "hello" }'
```

The response is the new record, with the fields njin adds:

```json
{
  "data": {
    "id": "01a1aaf9-953f-7193-9039-c4a098646a75",
    "createdAt": "2026-11-05T09:10:45.823Z",
    "updatedAt": "2026-11-05T09:10:45.823Z",
    "title": "Hello",
    "slug": "hello",
    "createdBy": "01a1aaf9-9469-731b-a4e1-de525d7171aa"
  }
}
```

`createdBy` is the id of the caller. The body is validated against the model's schema. See [Errors](/docs/rest-api/errors). Relations are written as ids. See [Relations](/docs/models/relations).

On a draftable model, the new record has `"status": "draft"` and `"publishedAt": null`.

## Listing

`GET /api/{prefix}` returns a page of records and the pagination details:

```json
{
  "data": [ { "id": "...", "title": "Hello" } ],
  "meta": { "total": 2, "page": 1, "limit": 20, "pageCount": 1 }
}
```

Use query parameters to search, filter, sort and page. See [Filtering and pagination](/docs/rest-api/filtering-and-pagination).

## Reading one record

`GET /api/{prefix}/:id` returns `{ "data": record }`, with relations expanded into the related records.

## Updating

`PUT /api/{prefix}/:id` changes only the fields in the body. Fields you leave out keep their values:

```bash
curl -X PUT http://localhost:3000/api/post/01a1aaf9-953f-7193-9039-c4a098646a75 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Hello again" }'
```

The response is the updated record. On a published record, an update makes the status `"changed"`. See [Draft and publish](/docs/models/draft-and-publish).

## Deleting

`DELETE /api/{prefix}/:id` removes the record and returns it as `{ "data": record }`. On a draftable model, both the working copy and the live copy are removed.

## A record that does not exist

An id that matches no record is **not** an error. `GET` answers `200` with an empty body object `{}`, and `PUT` and `DELETE` answer `200` with `{ "data": null }`. Check for a missing `data` rather than for a `404`.

A `404` with `{ "message": "Not Found" }` means something different: the record exists, but the caller's grant is `own` and the record was created by someone else.

## Publishing

On a model with `draftable: true`:

```bash
curl -X POST http://localhost:3000/api/post/01a1aaf9-953f-7193-9039-c4a098646a75/publish \
  -H "Authorization: Bearer $TOKEN"
```

`/publish`, `/unpublish` and `/discard` each return the record with its new `status`. `/discard` answers `409` when the record was never published. The caller needs the `publish` action on the model. See [Grants](/docs/access-control/grants).

## Languages

On a model with `i18n: true`:

- `GET /api/{prefix}?locale=en` and `GET /api/{prefix}/:id?locale=en` return one language as flat fields. Add `fallback=false` to turn off the fallback to the default language.
- `DELETE /api/{prefix}/:id/locale/en` deletes one language of a record. It answers `409` for the last one.
- `POST /api/{prefix}/:id/publish?locale=en` publishes only some languages. Use `en,id` for several, and leave `locale` out for every language the record has.

See [Languages](/docs/models/languages).

## The schema endpoint

`GET /api/schema` describes the models and vars the caller may use. It is what the admin panel reads to build its screens:

```json
{
  "models": [
    { "name": "Post", "prefix": "post", "draftable": true, "i18n": false, "schema": { "...": "JSON Schema of the fields" } }
  ],
  "vars": [ { "name": "General", "prefix": "general", "draftable": false, "i18n": false, "schema": { "...": "..." } } ],
  "i18n": { "locales": ["id", "en"], "defaultLocale": "id" }
}
```

`i18n` is `null` when the site has no languages configured. A user only sees the models and vars their permissions allow. Each field's schema includes its `label` and the input the admin panel draws for it (`renderAs`).
