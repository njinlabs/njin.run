---
title: Users and tokens
description: Manage users, access groups and tokens over the API.
---

# Users and tokens

These endpoints manage who can use your site. They need a **session** credential, so a personal or OAuth token cannot call them and gets `401`. See [Authentication](/docs/rest-api/authentication). They also need the matching permissions: `user`, `access_group` and so on, as described in [Access control](/docs/access-control/overview).

## Users

`/api/user` behaves like a model endpoint, and `GET /api/user` takes the same query parameters. See [Model endpoints](/docs/rest-api/model-endpoints).

| Request | What it does |
| --- | --- |
| `GET /api/user` | List users |
| `POST /api/user` | Create a user |
| `GET /api/user/:id` | Read one user |
| `PUT /api/user/:id` | Update a user |
| `DELETE /api/user/:id` | Delete a user |

```bash
curl -X POST http://localhost:3000/api/user \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Bob", "email": "bob@example.com", "password": "a-long-password" }'
```

The body takes `name`, `email`, `password` and, optionally, `groups`, a list of access group ids. The password is hashed on the server, and it is never returned in a response.

- Emails are unique, and are compared ignoring case. A second user with the same email gets `409`.
- Putting a user in groups also needs permission to update access groups. Without it the request is answered with `403`.
- A change that would leave nobody with full access is refused with `409`.
- You cannot delete your own account. It answers `400` with `"You cannot delete your own account"`.

## Access groups

`/api/access_group` has the same endpoints as a model, with the same list parameters.

```bash
curl -X POST http://localhost:3000/api/access_group \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Editors", "description": "Can edit their own posts", "grants": ["post:*:own"] }'
```

The body takes `name`, an optional `description`, and `grants`, a list of grant strings. Grants are checked against the catalog, and an invalid one answers `422`:

```json
{
  "message": "Some grants are not valid",
  "errors": ["\"nope:x\": unknown resource \"nope\""]
}
```

`GET /api/access/catalog` lists every resource and action a grant can name on this site, and whether the resource supports `own`:

```json
{
  "data": [
    { "resource": "post", "actions": ["read", "create", "update", "delete", "publish"], "scoped": true },
    { "resource": "analytics", "actions": ["read"], "scoped": false }
  ]
}
```

It needs permission to read access groups. See [Grants](/docs/access-control/grants).

## Personal tokens

A personal token lets a script or an integration call the API without a password.

| Request | What it does |
| --- | --- |
| `GET /api/token` | List your credentials: sessions, personal tokens and connected apps |
| `POST /api/token` | Create a personal token |
| `DELETE /api/token/:id` | Delete a token |

```bash
curl -X POST http://localhost:3000/api/token \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "ci", "scopes": ["post:read"] }'
```

The body takes:

| Field | What it is |
| --- | --- |
| `name` | Required. 1 to 100 characters |
| `scopes` | A list of `"<resource>:<action>"`, where `*` is allowed. Defaults to `["*:*"]` |

The response includes the token itself:

```json
{
  "data": {
    "id": "01a1aaf9-9531-75c3-a8b8-776a9cd8fd30",
    "name": "ci",
    "kind": "pat",
    "clientId": null,
    "scopes": ["post:read"],
    "createdAt": "2026-11-05T09:10:45.809Z",
    "expiresAt": null,
    "lastUsedAt": "2026-11-05T09:10:45.809Z",
    "token": "njt:01a1aaf9-9531-75c3-a8b8-776a9cd8fd30:RS9ulf1-..."
  }
}
```

**The `token` value is shown only once.** Only a hash is stored, so copy it now.

A token can never do more than its owner can, and `scopes` narrows it further. A token with `["post:read"]` can read posts, but creating one answers `403`.

`GET /api/token` lists only your own credentials, and never includes the secret. Sessions appear in the list with `"kind": "session"`. `DELETE /api/token/:id` returns the removed token, or `404` with `"Token not found"` if it is not yours.

## Connected apps

Apps that you approved over OAuth, such as an AI agent, are listed under `/api/oauth/consents`. Like the endpoints above, these need a session.

| Request | What it does |
| --- | --- |
| `GET /api/oauth/consents` | The apps you connected, with their scopes and tokens |
| `PUT /api/oauth/consents/:id` | Narrow an app's access. The body is `{ "scopes": [...] }` |
| `DELETE /api/oauth/consents/:id` | Disconnect the app and delete its tokens |

Access can be narrowed here but not widened. A `PUT` with scopes beyond the original answers `422`. See [Connected apps](/docs/ai-agents/connected-apps).
