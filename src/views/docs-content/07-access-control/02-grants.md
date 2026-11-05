---
title: Grants
description: The syntax of a grant, and what own, all and reference access mean.
---

# Grants

A grant is a string with up to three parts, separated by colons:

```text
<resource>:<action>[:<scope>]
```

## Grant syntax

| Part | What it is |
| --- | --- |
| `resource` | What the grant is about. See below |
| `action` | What may be done to it |
| `scope` | `all` or `own`. Optional, and `all` when left out |

`post:read` and `post:read:all` mean the same.

### Resources

| Resource | What it is |
| --- | --- |
| A model's prefix, such as `post` | The records of that model |
| `vars.<prefix>`, such as `vars.site` | A settings group |
| `file` | Uploaded files |
| `user` | Users |
| `access_group` | Access groups |
| `analytics` | Page view statistics |
| Names added by [plugins](/docs/extending/plugins#permissions) | Whatever the plugin defines |
| `*` | Every resource |

`GET /api/access/catalog` lists every resource and action that exists on your site.

### Actions

| Resource | Actions |
| --- | --- |
| A model | `read`, `create`, `update`, `delete`, and `publish` if the model is draftable |
| A vars group | `read`, `write`. Publishing counts as writing |
| `file` | `read`, `create`, `delete` |
| `user`, `access_group` | `read`, `create`, `update`, `delete` |
| `analytics` | `read` |
| Any of the above | `*` for every action |

On a vars group, a wildcard grant such as `vars.site:*` gives `read` and `write`.

### Examples

```text
post:*:own          every action on posts, only the user's own
post:read:all       read every post   (same as post:read)
post:publish        publish and unpublish posts
category:read       read categories
vars.general:read   read the "general" settings
vars.general:write  change the "general" settings
file:create:own     upload files
*:read              read everything
*:*:all             everything: the Full access group
```

## Own and all

The scope decides which records an action covers:

- **`all`** covers every record.
- **`own`** covers only records whose `createdBy` is the user. The server records the creator of each record that is created through the API.

With `own`:

- A list shows only the user's own records.
- Reading, updating, deleting or publishing someone else's record answers `404`. njin does not reveal that the record exists.
- Creating a record is allowed, and the record belongs to the user.

Records that have no owner, such as ones created by your own code without a `createdBy`, or created before ownership was recorded, are covered only by `all`.

`own` means something only for resources whose records have an owner. A vars group has no owner and neither does analytics, so a grant like `vars.site:read:own` is rejected when you save the group, with `"vars.site" has no owner to scope by`.

## How grants combine

Grants only add up. If a user has several grants for the same resource and action, the widest one wins: `all` beats `own`.

Wildcards combine the same way. A user with `post:read:own` and `*:read:all` can read every post.

## Reference access

A user who can pick a related record usually needs to see its name, even if they cannot read the record. For this, njin gives a read-only **reference** level automatically.

If a user may read, create or update a model that links to another model, they get a reference on the linked model. A reference shows each record's `id` and its label, and nothing more. The label is the `labelKey` of the relation, or the first plain field in the model's `searchFields`.

For example, a user with `post:*:own`, where `post` has a `category` relation, can list categories to choose from, and sees only this:

```json
{ "data": [{ "id": "01a1ab0b-0a51-718f-a6bb-5d988d557504", "title": "News" }] }
```

Fields such as `secret` are not included. Filters, sorting by other fields and field selection are ignored in a reference list. A category that is expanded inside a post is cut down to the same two fields.

To let the user read categories in full, add `category:read`.

This follows from your relations, so there is nothing to configure. A reference reaches one step only: it never grants a reference on yet another model.

In `GET /api/auth/permissions`, this level is shown as `"ref"`.

## Valid grants

When you save an access group, each grant is checked against the catalog. A problem is rejected with `422` and a message for each grant:

| Grant | Message |
| --- | --- |
| `bad` | `"bad" is not a valid grant` |
| `nope:read` | `"nope:read": unknown resource "nope"` |
| `post:publishx` | `"post:publishx": "post" has no action "publishx"` |
| `category:publish` on a model that is not draftable | `"category:publish": "category" has no action "publish"` |
| `vars.site:read:own` | `"vars.site:read:own": "vars.site" has no owner to scope by` |

## Examples of groups

| Group | Grants |
| --- | --- |
| Editors, who manage only their own posts | `post:*:own`, `category:read`, `file:create:own`, `file:read:own` |
| Reviewers, who publish anyone's posts | `post:read`, `post:publish` |
| Site settings managers | `vars.general:*`, `vars.seo:*` |
| Viewers of statistics | `analytics:read` |
| Administrators | `*:*:all` |
