---
title: Field types
description: The field helpers you can use in a model's schema.
---

# Field types

Fields are built with njin's helpers, imported from `@njinlabs/njin`. Each helper takes a meta object whose `label` is the name shown in the admin form, and each one decides which input the admin panel draws.

```ts
import {
  text, richtext, email, numeric, boolean, date, select,
  object, array, relation, relationMany, file, multiFile,
} from "@njinlabs/njin";
```

## Text, email and richtext

```ts
title: text({ label: "Title" }),
contact: email({ label: "Contact email" }),
body: richtext({ label: "Body" }),
```

- `text()` is a string. `email()` is a string that must be a valid email address.
- `richtext()` is a string that holds HTML, edited with a rich text editor in the admin panel. It behaves like `text()` otherwise. Output it in templates with three braces, `{{{ post.body }}}`, so the HTML is not escaped.
- An empty string counts as "no value". A required `text()` field therefore rejects `""`.

## Numeric, boolean, date and select

```ts
price: numeric({ label: "Price" }),
featured: boolean({ label: "Featured?" }, (z) => z.default(false)),
publishedOn: date({ label: "Published on" }),
status: select({ label: "Status" }, ["DRAFT", "PUBLISH"]),
```

- `numeric()` is a number.
- `boolean()` is a real `true` or `false`. The API does not convert strings such as `"true"` or `"on"`.
- `date()` is stored as an ISO 8601 string. It accepts a date string and converts it to ISO 8601 (on a server running in UTC, `"2026-01-02"` becomes `"2026-01-02T00:00:00.000Z"`). The admin panel shows a date picker.
- `select()` takes the list of allowed values as its second argument, and rejects anything else.

## Object and array

```ts
seo: object(
  { label: "SEO" },
  {
    metaTitle: text({ label: "Meta title" }),
    metaDescription: text({ label: "Meta description" }),
  },
),

tags: array({ label: "Tags" }, text({ label: "Tag" })),
images: array({ label: "Images" }, text({ label: "URL" }), (z) => z.min(1)),
```

- `object()` groups fields under one key. Its second argument is a shape of fields.
- `array()` is a list of one field type. A single value is wrapped into a one-item array.

## Relations and files

Fields that point at other records have their own pages:

- `relation()` and `relationMany()`: [Relations](/docs/models/relations)
- `file()` and `multiFile()`: [Files and uploads](/docs/models/files)

## Meta options

The first argument of every helper accepts these options:

| Option | What it does |
| --- | --- |
| `label` | Required. The name shown in the admin form |
| `unique` | Rejects a second record with the same value. See [Validation](/docs/models/validation#unique-fields) |
| `localized` | Keeps one value per language on a model with `i18n: true`. See [Languages](/docs/models/languages) |
| `hideForm` | Leaves the field out of the admin form |

`relation()` and `relationMany()` also accept `labelKey`, the field of the related record used as its label in the admin panel.

## Choosing a type

| You want to store | Use |
| --- | --- |
| A short string | `text` |
| Formatted content | `richtext` |
| An email address | `email` |
| A number | `numeric` |
| A yes or no | `boolean` |
| A date | `date` |
| One of a fixed set of values | `select` |
| A group of related fields | `object` |
| A list of values | `array` |
| A link to another record | `relation` |
| A list of links to other records | `relationMany` |
| An uploaded file | `file` |
| Several uploaded files | `multiFile` |

Every field is required unless you make it optional. See [Validation](/docs/models/validation).

## Custom inputs

Any field can be drawn with an input from an admin plugin by wrapping it with `plugin()`, without changing how it is validated or stored. See [Custom field inputs](/docs/extending/plugins#custom-field-inputs).
