---
title: Tokens and scopes
description: Give a script or an AI agent less access than its owner has.
---

# Tokens and scopes

A user's access comes from their groups. A **token** lets a script or an AI agent act as that user, and a **scope** narrows what the token may do, so you can hand it only what it needs.

## Scopes

A scope has the form `<resource>:<action>`. Either half can be `*`:

| Scope | Allows |
| --- | --- |
| `post:read` | Reading posts |
| `post:*` | Every action on posts |
| `*:read` | Reading everything |
| `vars.site:write` | Changing the "site" settings |
| `*:*` | Everything the user can do. This is the default |

Resources and actions are the same ones used in [grants](/docs/access-control/grants). A scope has no `own` or `all` part. It decides which actions are open to the token, and the user's own grants decide on which records.

## A token can never do more than its user

What a token can do is the **intersection** of two things: what its user's groups grant, and what its scopes allow. A scope that names something the user cannot do changes nothing.

For example, take a user whose group grants `post:*:own`:

- A token with the scope `post:read` can read the user's own posts. Creating a post answers `403`.
- A token with the scope `category:*` can do nothing with categories beyond what the user can. Creating a category still answers `403`, because the user cannot.
- A token with `*:*` can do exactly what the user can, no more.

Because permissions are worked out on every request, taking a permission away from the user, or deleting the user, changes every one of their tokens at once.

## Personal tokens

Create a personal token from a signed-in session, with the scopes it should have:

```bash
curl -X POST http://localhost:3000/api/token \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "ci", "scopes": ["post:read"] }'
```

Without `scopes`, a token gets `["*:*"]`. The token is shown once. See [Users and tokens](/docs/rest-api/users-and-tokens).

To see what a token can do, call `GET /api/auth/permissions` with it. The result already takes the scopes into account.

A personal token never expires, until you delete it. Give one token to each integration, so that you can revoke it on its own.

## OAuth tokens

When an AI agent connects to your site, you approve it on a consent screen, and it receives an **OAuth token**. These tokens are narrowed to the scopes you approve:

- The access token lasts one hour. The agent renews it with a refresh token, which lasts 30 days.
- You can see the connected apps in the admin panel, and in the API under `/api/oauth/consents`.
- You can **narrow** an app's scopes later. You cannot widen them. A request for more than was approved is rejected with `422`.
- You can **disconnect** an app, which deletes all of its tokens.

See [Connected apps](/docs/ai-agents/connected-apps).

## What tokens cannot do

Personal and OAuth tokens work on the content API. Managing users, access groups, tokens and connected apps needs a signed-in session, and a token that tries gets `401`. This is deliberate: a leaked token could otherwise create a replacement for itself, or give itself more access.

See [Authentication](/docs/rest-api/authentication#which-credential-works-where).
