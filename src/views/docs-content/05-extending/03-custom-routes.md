---
title: Custom routes
description: Add your own server endpoints, such as webhooks.
---

# Custom routes

The generated API covers your models and vars. For anything else, such as a webhook, a form handler or a small integration, you add your own route.

A custom route is an [Elysia](https://elysiajs.com) instance, so everything Elysia offers is available: params, body and query validation, groups and more.

## Writing a route

Create a file in `src/routes/` that default-exports a `route()`:

```ts
// src/routes/webhook.ts
import { route } from "@njinlabs/njin";

export default route({ prefix: "/hooks" })
  .get("/ping", () => ({ ok: true }))
  .post("/payment", async ({ body }) => {
    // handle the payload
    return { received: true };
  });
```

`route()` takes the same options as `new Elysia()`. Set a `prefix` to keep your paths together. This route answers `GET /hooks/ping` and `POST /hooks/payment`.

The path is exactly what you write. Nothing is added in front of it, so a route is not under `/api` unless you put it there. Avoid paths njin uses itself, such as `/api/{model}`, `/_admin`, `/img` and `/uploads`.

## Registering a route

Add the file to `config.ts`:

```ts
export default defineConfig({
  routes: [() => import("./src/routes/webhook")],
});
```

Restart the dev server after changing `config.ts`.

## Protecting a route

A route is open to everyone unless you protect it. njin's authentication is available through the `auth` option on a route:

| Option | Who can call it |
| --- | --- |
| `{ auth: true }` | A signed-in user: a session, a personal token or an OAuth token |
| `{ auth: { session: true } }` | A session only |
| `{ auth: { mcp: true } }` | A personal or OAuth token only |
| `{ auth: { can: ["post", "update"] } }` | As `auth: true`, and the user must also be allowed that action on that resource |

```ts
export default route({ prefix: "/reports" })
  .get("/summary", ({ principal }) => ({ user: principal.user.id }), {
    auth: { can: ["post", "read"] },
  });
```

Without a valid credential the route answers `401`, and without the permission it answers `403`. In a protected route's handler, `principal` holds the caller: `principal.user`, the kind of token, and the token itself.

The resource and action in `can` are the same ones used by [grants](/docs/access-control/grants). A [plugin](/docs/extending/plugins) can add its own resources.

## Reaching your data

Import a model and call it, as anywhere else in server code:

```ts
import post from "../models/post";

export default route({ prefix: "/feed" }).get("/latest", async () => {
  const result = await post.read({ sort: "createdAt", order: "desc", limit: 5 });
  return result.data;
});
```

A model call from your own code is not checked against permissions. Guarding the route with `auth`, as above, is how you decide who can reach it. See [Code you write](/docs/access-control/your-own-code).

## Logging

Use `logger()` from `@njinlabs/njin/logger` instead of `console`, so output reaches the configured log streams. Call it inside the handler:

```ts
import logger from "@njinlabs/njin/logger";

route().post("/webhook", ({ body }) => {
  logger().info({ body }, "webhook received");
  return { ok: true };
});
```
