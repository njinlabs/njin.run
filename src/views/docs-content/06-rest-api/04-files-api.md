---
title: Files
description: Upload, list, delete and serve files over the API.
---

# Files

Uploaded files are records of njin's own `file` model. Models refer to them with `file()` and `multiFile()` fields. See [Files and uploads](/docs/models/files).

| Request | What it does |
| --- | --- |
| `POST /api/file` | Upload a file |
| `GET /api/file` | List files |
| `DELETE /api/file/:id` | Delete a file |
| `GET /uploads/*` | The file's bytes. Public |

These endpoints need a credential and the `file` permissions. See [Authentication](/docs/rest-api/authentication).

## Uploading

Send a `multipart/form-data` request with the file in a field named `file`:

```bash
curl -X POST http://localhost:3000/api/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg"
```

The response holds the created file record **in an array with one element**:

```json
{
  "data": [
    {
      "id": "01a1aaf9-955d-71c4-8028-ae79455ee666",
      "name": "photo_wrbgtk8wo5.jpg",
      "size": 48213,
      "type": "image/jpeg",
      "url": "/uploads/photo_wrbgtk8wo5.jpg",
      "meta": null,
      "createdAt": "2026-11-05T09:10:45.853Z",
      "updatedAt": "2026-11-05T09:10:45.853Z",
      "createdBy": "01a1aaf9-9469-731b-a4e1-de525d7171aa"
    }
  ]
}
```

- `id` is what you write into a `file()` field of a model.
- `name` is the stored name. njin makes it safe and adds a random suffix, so uploading the same file name twice never overwrites.
- `url` is where the file is served. With the default filesystem adapter it is a relative path. With the S3 adapter it is an absolute address on the storage service.

On the default filesystem adapter, files with these extensions are refused with `422`, because a browser would run them from your site's own address: `html`, `htm`, `xhtml`, `shtml`, `js`, `mjs` and `xml`.

## Listing

`GET /api/file` returns `{ data, meta }` like a model list. It accepts `search`, `page`, `limit`, `sort` and `order`, but not `filters`. See [Filtering and pagination](/docs/rest-api/filtering-and-pagination).

## Deleting

`DELETE /api/file/:id` deletes the file record and the stored file, and returns the record as `{ "data": record }`.

Model records that still refer to the deleted file are not updated, and will point at nothing. Check where a file is used before you delete it.

## Serving files

With the default filesystem adapter, `GET /uploads/*` returns the file's bytes. It needs no authentication, so the URLs can be used directly in pages and shared. These responses carry `X-Content-Type-Options: nosniff` and a `Content-Security-Policy: sandbox` header, so a file that a browser could render, such as an SVG, runs without scripts.

The route exists only when the configured file adapter has a `dir`. With S3, files are served from the storage service's own URL instead.
