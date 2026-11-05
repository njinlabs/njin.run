---
title: Authentication
description: Sign in, send credentials and see what a caller may do.
---

# Authentication

Every endpoint under `/api` needs a credential, with these exceptions:

- `GET /api/setup/status` and `POST /api/setup`, for the first-run setup
- `POST /api/auth/login`

Pages, `GET /img` and `GET /uploads/*` are public. Without a valid credential, a protected endpoint answers `401` with `{ "message": "Unauthorized" }`.

## Credentials

| Kind | How you get it | Lifetime |
| --- | --- | --- |
| **Session** | `POST /api/auth/login`, or the first-run setup | 30 days, extended each time it is used |
| **Personal token** | `POST /api/token`, from a session. See [Users and tokens](/docs/rest-api/users-and-tokens) | Until you delete it |
| **OAuth token** | An app such as an AI agent that you approved. See [Connected apps](/docs/ai-agents/connected-apps) | Access token 1 hour, refresh token 30 days |

Send the credential in the `Authorization` header:

```bash
curl http://localhost:3000/api/post \
  -H "Authorization: Bearer njt:01a1aaf9-9531-75c3-a8b8-776a9cd8fd30:RS9ulf1-..."
```

A token is a single string of the form `njt:<id>:<secret>`. Only a hash of the secret is stored, so a token is shown once, when it is created.

Permissions are not stored in the token. They are worked out from the user's access groups on every request, so changing a group or removing a user takes effect immediately.

## Logging in

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@example.com", "password": "..." }'
```

The response holds the user and a session token:

```json
{
  "data": {
    "id": "01a1aaf9-9469-731b-a4e1-de525d7171aa",
    "name": "Admin",
    "email": "admin@example.com",
    "groups": ["01a1aaf9-9468-75df-89bf-6bc71ea662ec"],
    "createdAt": "2026-11-05T09:10:45.609Z",
    "updatedAt": "2026-11-05T09:10:45.609Z",
    "createdBy": null,
    "token": "njt:01a1aaf9-94cd-7677-86e5-5c95a2a36737:sWCvU3yQ..."
  }
}
```

The password is never returned. A wrong email or password answers `401`, and the response is the same for both, so it does not reveal which accounts exist.

After 10 failed attempts for the same email within 15 minutes, login answers `429` with `"Too many failed attempts. Try again in a few minutes."`.

## Other auth endpoints

| Request | What it does |
| --- | --- |
| `GET /api/auth/check-token` | Returns the user the credential belongs to as `{ "data": user }`. Use it to test a token |
| `DELETE /api/auth/logout` | Ends the session and clears its cookie. Sessions only |
| `GET /api/auth/permissions` | What the caller may do. See below |

## What the caller may do

`GET /api/auth/permissions` lists each resource the caller has any access to, and the level for each action:

```json
{
  "data": [
    { "resource": "post", "scoped": true, "actions": { "read": "all", "create": "all", "update": "all", "delete": "all", "publish": "all" } },
    { "resource": "file", "scoped": true, "actions": { "read": "all", "create": "all", "delete": "all" } },
    { "resource": "analytics", "scoped": false, "actions": { "read": "all" } }
  ]
}
```

A level is `"all"`, `"own"` (only records the caller created) or `"ref"` (only each record's id and label). Any kind of token may call this, since it only tells the caller about itself. See [Access control](/docs/access-control/overview).

## Session cookies

Login and setup also set an HttpOnly cookie named `njin_session`. A browser can use it instead of a header. This is how the admin panel works.

Because a cookie is sent automatically by the browser, a request that changes data (anything other than `GET` and `HEAD`) must also carry an `X-Requested-With` header with any value. Without it the request is answered with `403`. Another website cannot add that header, which protects you from cross-site requests. A request that uses the `Authorization` header is not affected.

## Which credential works where

| Endpoints | Session | Personal or OAuth token |
| --- | --- | --- |
| Content: models, vars, files, analytics, schema | Yes | Yes, within its scopes |
| Users, access groups, tokens, connected apps | Yes | No. Answers `401` |
| `/mcp` | No | Yes |

A personal or OAuth token can never do more than the user it belongs to, and it can be narrowed to specific scopes. This is why a leaked agent token cannot create a replacement token for itself.

## First-run setup

A new project has no users. `GET /api/setup/status` tells you whether setup is still needed:

```json
{ "needsSetup": true }
```

`POST /api/setup` creates the first admin and signs them in. The body is `name`, `email` and a `password` of at least 8 characters. The response is `{ "data": { "token": "...", "user": { ... } } }`, and the session cookie is set.

The user is put in the built-in Full access group. Once any user exists, setup answers `403` with `"Setup already completed"`.
