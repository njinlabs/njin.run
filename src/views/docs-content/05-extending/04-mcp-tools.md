---
title: Custom MCP tools
description: Give AI agents your own actions on top of the built-in content tools.
---

# Custom MCP tools

AI agents that support MCP can connect to your site at `/mcp`. Out of the box they get tools to read and manage your content: models, vars and files. See [Managing content over MCP](/docs/ai-agents/mcp).

A custom tool adds an action of your own: "publish the weekly newsletter", "count orders this month", "sync products from the supplier". You describe it, and the agent decides when to call it.

## Defining a tool

Create a file that default-exports `defineTool()`. A good place is `src/mcp/`:

```ts
// src/mcp/count_posts.ts
import { defineTool } from "@njinlabs/njin";
import z from "zod";
import post from "../models/post";

export default defineTool({
  name: "count_posts",
  title: "Count posts",
  description: "Count the posts, optionally only those whose title contains a word.",
  input: {
    contains: z.string().optional().describe("Only count titles containing this word"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ contains }, { can }) => {
    if (!can("post", "read")) throw new Error("You are not allowed to read posts");

    const result = await post.read({
      filters: contains ? { title: { $contains: contains } } : {},
      limit: 1,
    });
    return { total: result.meta.total };
  },
});
```

| Field | Required | What it is |
| --- | --- | --- |
| `name` | Yes | The tool's name. Letters, digits, `_` and `-`, up to 64 characters. It must be unique |
| `description` | Yes | What the agent reads to decide when to use the tool. Say what it does and when to use it |
| `handler` | Yes | The function that does the work |
| `input` | No | The arguments, as an object of Zod fields. Use `.describe()` on a field to explain it to the agent |
| `title` | No | A readable name |
| `annotations` | No | Hints about the tool, such as `readOnlyHint` and `destructiveHint`, from the MCP specification |

The description and the argument descriptions matter more than anything else here. They are all the agent knows about your tool.

## Registering a tool

Add the file to `mcp.tools` in `config.ts`:

```ts
export default defineConfig({
  mcp: {
    tools: [() => import("./src/mcp/count_posts")],
  },
});
```

Restart the dev server after changing `config.ts`. Tools are checked at startup, so a bad tool fails `njin dev` immediately rather than when an agent first connects. It fails when a name uses characters that are not allowed, clashes with a built-in tool such as `list_models` or `create_record`, or is registered twice.

A [plugin](/docs/extending/plugins) can add tools too, through its `mcp: { tools: [...] }` field.

## The handler

```ts
handler: async (args, context) => { ... }
```

`args` holds the validated arguments. If the agent sends something that does not match `input`, the call is rejected with a validation message before your handler runs.

`context` has:

| Field | What it is |
| --- | --- |
| `can(resource, action)` | Whether the caller may do that, for example `can("post", "update")` |
| `principal` | Who is calling: `principal.user`, the kind of token and the token itself |
| `token` | The connection the agent called through: `{ id, name, createdBy }` |
| `baseUrl` | The public address of the site, for building absolute links |

### Checking permissions

**Your handler is not checked for you.** The built-in content tools check the caller's permissions, but a custom tool runs your code, and calling a model from it does not go through any permission check. Guard it yourself with `can()`, using the same resources and actions as [grants](/docs/access-control/grants).

### Returning a result

- Return a **string** and the agent receives it as plain text.
- Return anything else, such as an object or an array, and it is sent as JSON.

### Failing

Throw an error and its message is sent to the agent as an error result it can read and react to:

```ts
throw new Error("The newsletter was already sent today");
```

Write messages the agent can act on. A Zod error you throw is turned into a readable validation message.

## Trying it out

Connect an agent to `/mcp` as described in [Managing content over MCP](/docs/ai-agents/mcp), then ask it to do what the tool does. The agent sees your tool in its list next to the built-in ones.

You can also test a tool without an agent, by sending the MCP request yourself. In a test:

```ts
const res = await app.post("/mcp", {
  headers: {
    authorization: `Bearer ${personalToken}`,
    accept: "application/json, text/event-stream",
  },
  body: {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "count_posts", arguments: { contains: "hello" } },
  },
});
```

`/mcp` accepts personal and OAuth tokens, not a signed-in session. You can create a personal token with `POST /api/token`.
