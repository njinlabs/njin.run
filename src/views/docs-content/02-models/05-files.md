---
title: Files and uploads
description: Attach uploaded files to records and choose where files are stored.
---

# Files and uploads

Uploaded files are records in their own right. A model refers to them with `file()` (one file) or `multiFile()` (several).

## file and multiFile

```ts
import { makeModel, text, file, multiFile } from "@njinlabs/njin";
import z from "zod";

const project = makeModel("project", {
  name: "Project",
  searchFields: ["title"],
  schema: z.object({
    title: text({ label: "Title" }),
    thumbnail: file({ label: "Thumbnail" }),
    gallery: multiFile({ label: "Gallery" }, (z) => z.optional()),
  }),
});
```

- Both are relations to njin's file model, so the rules of [Relations](/docs/models/relations) apply: you write the **id** of a file record, and reading expands it into the file record.
- Like any field, they are required unless you make them optional.
- In the admin panel they appear as an uploader.
- A file can be localized, with a different file per language: `file({ label: "Cover", localized: true })`. See [Languages](/docs/models/languages).

## Using a file in a template

A file record has `id`, `url`, `name`, `size` and `type`. Use `url` for the address:

```edge
<img src="{{ imgOptimize(item.thumbnail.url, { w: 800 }) }}" alt="{{ item.title }}" />
```

`imgOptimize()` returns a resized WebP URL. See [Image optimization](/docs/website/image-optimization).

## Uploading

Upload through the admin panel, or send a `multipart/form-data` request with a field named `file` to `POST /api/file`. Either way you get a file record with an `id`, which is what you write into a `file()` field. See [Files](/docs/rest-api/files-api).

With the default filesystem adapter, files with an extension that a browser would run from your site's own address (`html`, `htm`, `xhtml`, `shtml`, `js`, `mjs` and `xml`) are refused with `422`.

## File adapters

A file adapter decides where uploaded bytes are stored. Set it with `adapters.file` in `config.ts`.

### Filesystem

This is the default. Files go to `./uploads` and are served at `/uploads/*` without authentication:

```ts
import bunFilesystemAdapter from "@njinlabs/njin/adapters/bun_filesystem";

export default defineConfig({
  adapters: {
    file: bunFilesystemAdapter({ dir: "./uploads" }),
  },
});
```

### S3

For Amazon S3 or an S3-compatible service such as R2, Spaces or MinIO:

```ts
import s3Adapter from "@njinlabs/njin/adapters/s3";

export default defineConfig({
  adapters: {
    file: s3Adapter({
      bucket: process.env.S3_BUCKET!,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT,
      publicUrl: process.env.S3_PUBLIC_URL,
    }),
  },
});
```

`bucket` is required. `publicUrl` sets the base address that file URLs are built from. Without it, the URL is built from `endpoint` and `bucket`, or from the AWS address of the bucket and region. Files are served from the storage service itself, not from your site.
