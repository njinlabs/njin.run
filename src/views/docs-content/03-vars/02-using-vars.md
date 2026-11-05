---
title: Using vars in templates
description: Read and update settings from templates, code and the API.
---

# Using vars in templates

## Reading values

Each registered group is a global in templates, named after its prefix. Call `get()` with `await`:

```edge
@let(settings = await general.get())

<title>{{ settings.siteName }}</title>

@if(settings.maintenanceMode)
  <p>We will be back soon.</p>
@end
```

`get()` returns your fields plus `updatedAt`. Before anything has been saved, it returns the `.default()` of every field:

```ts
await general.get();
// { siteName: "My Site", maintenanceMode: false, updatedAt: null }
```

A group has far fewer methods than a model: `get()` and `update()`, plus the draft methods described in [Drafts and languages](/docs/vars/drafts-and-languages). The group object itself is the template global, so `update()` is reachable from a template too, but templates should only read.

## Updating values

In server code, `update()` changes the fields you pass and leaves the others alone:

```ts
await general.update({ siteName: "Acme" });
```

It saves the first time too, because a group has no record to create beforehand. It returns the group's values after the change.

Like a model, `update()` called from your own code does not run the schema's rules. The REST API does. See [Validation](/docs/models/validation).

## API

| Request | What it does |
| --- | --- |
| `GET /api/vars/{prefix}` | Read the group |
| `PUT /api/vars/{prefix}` | Update the fields in the body. Fields you leave out are unchanged |

```bash
curl -X PUT http://localhost:3000/api/vars/general \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "siteName": "Acme" }'
```

The response is `{ "data": { "siteName": "Acme", "maintenanceMode": false, "updatedAt": "..." } }`. A body that breaks a rule gets `422`, in the same format as a model.

## Permissions

A group is its own resource, named `vars.{prefix}`, with two actions:

| Grant | Allows |
| --- | --- |
| `vars.general:read` | Reading the group |
| `vars.general:write` | Updating it. Publishing counts as writing |

A group has no owner, so it only takes the scope `all`. See [Grants](/docs/access-control/grants).

## Hooks

`beforeVarsUpdate(group, fn)` runs before an update and can change the data or throw to cancel it. `afterVarsUpdate(group, fn)` runs after, with the group's values. See [Hooks](/docs/models/hooks).
