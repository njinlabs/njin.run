---
title: Code you write
description: Permissions are not checked in your own code. Here is how to guard it.
---

# Code you write

njin checks permissions where it receives a request from a caller: the REST API, the admin panel and MCP. The model layer itself knows nothing about callers.

So code you write is **not checked**:

- Hooks, helpers, templates and event listeners
- Custom routes
- Custom MCP tools
- Anything else that calls a model directly, such as `post.read()` or `post.update()`

```ts
// Both of these succeed, whoever triggered the code
await post.update(id, { title: "Changed" });
await post.destroy(id);
```

This is by design. Your code is trusted, and a public page, for instance, must read published content for visitors who have no account. It also means that you are the one who decides who may reach it.

## Templates and public pages

A template can read anything. Be deliberate about what you render:

- On a draftable model, `post.read()` returns drafts. Use `post.published.read()` in public pages. See [Draft and publish](/docs/models/draft-and-publish).
- Do not print fields that visitors should not see, such as an internal note.
- Do not call `update()` or `destroy()` from a template.

## Custom routes

Use the `auth` option on a route. It answers `401` for no credential and `403` for no permission:

```ts
import { route } from "@njinlabs/njin";
import post from "../models/post";

export default route({ prefix: "/reports" }).get(
  "/drafts",
  async () => {
    const result = await post.read({ filters: { status: "draft" } });
    return result.data;
  },
  { auth: { can: ["post", "update"] } },
);
```

`can: [resource, action]` uses the same resources and actions as [grants](/docs/access-control/grants). In the handler, `principal` holds the caller. See [Custom routes](/docs/extending/custom-routes#protecting-a-route).

### Ownership

`can` checks that the caller has the action, at any level. It does not tell you whether they may touch one particular record. If a user with `post:*:own` calls your route with someone else's post id, your code decides. Compare the owner yourself:

```ts
.put("/rename/:id", async ({ params, body, principal, status }) => {
  const record = await post.show(params.id);
  if (!record || record.createdBy !== principal.user.id) {
    return status(404, { message: "Not Found" });
  }
  return post.update(params.id, { title: body.title });
}, { auth: { can: ["post", "update"] } })
```

This matters only for callers whose grant is `own`. A caller with the `all` scope may touch any record, and the comparison above would wrongly stop them. Read the caller's level from `GET /api/auth/permissions` if your route needs to tell the two apart.

## Custom MCP tools

A custom tool receives `can(resource, action)` in its context:

```ts
handler: async (args, { can }) => {
  if (!can("post", "update")) throw new Error("You are not allowed to update posts");
  // ...
}
```

See [Custom MCP tools](/docs/extending/mcp-tools).

## Hooks

Hooks run for every create, update and delete, whoever triggered it. They cannot ask who the caller is. If a rule depends on the caller, put it in the route or the tool, not in a hook. A hook is the right place for rules that apply to everyone, such as "the homepage cannot be deleted". See [Hooks](/docs/models/hooks).

## Setting the owner

Records created through the API get the caller as `createdBy`. When your own code creates a record, pass it yourself if the record should belong to someone:

```ts
await post.create({ title: "Imported" }, { createdBy: user.id });
```

A record created without it has no owner, so only a grant with the `all` scope can reach it. See [Grants](/docs/access-control/grants#own-and-all).

## Testing permissions

The testing helpers make it easy to try a real group:

```ts
import { createTestApp } from "@njinlabs/njin/testing";

const app = await createTestApp(config);

const editors = await app.createGroup({ name: "Editors", grants: ["post:*:own"] });
const editor = await app.createUser({ groups: [editors.id] });

const res = await app.get("/api/post", { as: editor });
```

A user from `createUser()` is in the Full access group unless you pass `groups`. See [Testing](/docs/operations/testing).
