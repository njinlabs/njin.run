---
title: Defining vars
description: Singleton settings such as the site name or SEO defaults.
---

# Defining vars

Vars are settings that exist exactly once: the site name, default SEO text, a maintenance switch. Where a model holds a list of records, a vars group holds a single object. Editors change it in the admin panel, and your templates read it.

## What vars are for

Use vars for values that describe the whole site, and a [model](/docs/models/defining-a-model) for anything you have many of.

| Use vars for | Use a model for |
| --- | --- |
| Site name and tagline | Blog posts |
| Contact details | Team members |
| Default SEO title and description | Products |
| Feature toggles | Pages |

## Defining a group

Create a file in `src/vars/` with `makeVars()`:

```ts
// src/vars/general.ts
import { makeVars, text, boolean } from "@njinlabs/njin";
import z from "zod";

const general = makeVars("general", {
  name: "General",
  schema: z.object({
    siteName: text({ label: "Site name" }, (z) => z.default("My Site")),
    maintenanceMode: boolean({ label: "Maintenance mode" }, (z) => z.default(false)),
  }),
});

export default general;
```

`makeVars(prefix, config)` takes:

| Option | Required | What it does |
| --- | --- | --- |
| `prefix` (first argument) | Yes | The name of the group: its API path (`/api/vars/general`) and the name of the global you use in templates |
| `name` | Yes | The label shown in the admin panel |
| `schema` | Yes | A `z.object()` of fields. They use the same helpers as a model's fields. See [Field types](/docs/models/field-types) |
| `draftable` | No | Keeps a live copy apart from the one being edited. See [Drafts and languages](/docs/vars/drafts-and-languages) |
| `i18n` | No | Lets fields hold one value per language. See [Drafts and languages](/docs/vars/drafts-and-languages) |

Give every field a `.default(...)`. `get()` always returns a complete object, even before anything has been saved, and the defaults are what fill it in.

A vars group has no `id`, `createdAt` or `createdBy`. It has only your fields and an `updatedAt`, which is `null` until the first save.

## Registering a group

Register the group in `config.ts`:

```ts
export default defineConfig({
  vars: [() => import("./src/vars/general")],
});
```

Restart the dev server after changing `config.ts`. The group now has:

- `GET` and `PUT` on `/api/vars/{prefix}`
- A settings screen in the admin panel
- A global in templates, named after the prefix: `await general.get()`
- Its schema under `vars` in `GET /api/schema`
