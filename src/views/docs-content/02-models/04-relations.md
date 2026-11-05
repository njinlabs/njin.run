---
title: Relations
description: Link records to each other with relation and relationMany.
---

# Relations

A relation field links a record to a record of another model. In the admin panel it appears as a picker.

## relation

`relation()` links to one record. It takes a meta object, the model it points at, and an optional rule:

```ts
import { makeModel, text, relation, relationMany } from "@njinlabs/njin";
import z from "zod";
import author from "./author";
import tag from "./tag";

const article = makeModel("article", {
  name: "Article",
  searchFields: ["title", "author.name"],
  schema: z.object({
    title: text({ label: "Title" }),
    author: relation({ label: "Author", labelKey: "name" }, author),
    editor: relation({ label: "Editor", labelKey: "name" }, author, (z) => z.optional()),
    tags: relationMany({ label: "Tags", labelKey: "label" }, tag),
  }),
});

export default article;
```

- You pass the model itself, so import it with a normal `import`.
- `labelKey` is the field of the related record that the admin panel shows as its label.
- Like any field, a relation is required unless you make it optional, as `editor` is above.

## relationMany

`relationMany()` links to a list of records. It takes the same arguments as `relation()` and stores an array of ids.

## Writing a relation

When you create or update a record, give the related record's **id** as a plain string. For `relationMany`, give an array of ids:

```json
{
  "title": "Hello",
  "author": "01a1aabb-897b-751e-aab9-f93df2fd3846",
  "tags": ["01a1aabb-897a-7560-b92c-a1d5e98bb616", "01a1aabb-897b-751d-90fe-6e566b1f249f"]
}
```

Send the id, not the whole record.

## Populating relations

`read()` and `show()` replace each relation with the related record:

```edge
@let(item = await article.show(params.id))
<p>By {{ item.author.name }}</p>
```

The `POST` and `PUT` responses return the ids you stored, not the expanded records.

Use `populate` to control what is expanded:

```ts
await article.read({ populate: ["author"] }); // expand only author; tags stay as ids
await article.read({ populate: "none" }); // every relation stays as an id
```

To get only some fields of a related record, use `select` with `"relation.field"`, one level deep:

```ts
await article.read({ select: ["title", "author.name"] });
```

Over HTTP: `GET /api/article?select=title,author.name`.

## Filtering and searching across relations

Filter on a relation field with the related record's id:

```ts
await article.read({ filters: { author: authorId } });
```

To search by a field of a related record, list it in `searchFields` as `"relation.field"`, as `"author.name"` is above. `search` then also matches the author's name.

## Relations and languages

A relation is never localized itself. It follows the language of the model it points at. See [Languages](/docs/models/languages).

## Relations and permissions

Being allowed to read, create or update `article` also lets a user pick the records an `article` can link to. For `author` they get a reference, which is each record's id and label, and nothing more. This follows from your relations; there is nothing to configure. See [Grants](/docs/access-control/grants).
