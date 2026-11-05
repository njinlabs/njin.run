---
title: Testing
description: Test your real app without opening a port.
---

# Testing

`@njinlabs/njin/testing` starts your real app, with your models, hooks, events, routes and vars, and lets a test call it without opening a port. Tests use Bun's own test runner.

## Setting up

A test file creates the app once, and closes it at the end:

```ts
// tests/post.test.ts
import { afterAll, expect, it } from "bun:test";
import { createTestApp } from "@njinlabs/njin/testing";
import config from "../config";
import post from "../src/models/post";

const app = await createTestApp(config);
afterAll(() => app.close());

it("lists posts for a signed-in user", async () => {
  await app.seed(post, { title: "Hello" });
  const res = await app.get("/api/post", { as: await app.createUser() });
  expect(res.status).toBe(200);
});
```

Run the tests with:

```bash
bun test --isolate
```

The project's `bun run test` script does this. njin's modules are process-wide singletons, so one process can hold only one test app. `--isolate` gives every test file its own process. Without it, a second `createTestApp()` call throws an error that says so.

What `createTestApp()` does differently from the real server:

- The database is an **in-memory SQLite database**, unless you pass `adapters: { db }` in the config you give it. Your real `config.ts` may use another database, and the test ignores it.
- It listens on no port. Requests go straight to the app.
- Logging is turned off. Pass `logger` in the config to change it.
- No Vite dev server starts.

To test against the database you use in production, pass its adapter:

```ts
import postgresAdapter from "@njinlabs/njin/adapters/postgres";

const app = await createTestApp({
  ...config,
  adapters: { db: postgresAdapter({ url: process.env.TEST_DATABASE_URL }) },
});
```

## Calling the API

`get`, `post`, `put`, `patch` and `delete` take a path and an options object, and return a standard `Response`:

```ts
const res = await app.post("/api/post", {
  body: { title: "Hello", slug: "hello" },
  as: user,
});

expect(res.status).toBe(200);
const { data } = await res.json();
```

| Option | What it does |
| --- | --- |
| `body` | Sent as JSON. A `FormData`, string or `Uint8Array` is sent as it is, which is how you test an upload |
| `query` | An object of query string parameters |
| `headers` | Extra headers |
| `as` | Signs the request in. Pass a user, and a session token is created for it. You can also pass a ready-made token string |

`app.request(method, path, init)` is the same call with the method as an argument.

## Seeding data and users

```ts
const record = await app.seed(post, { title: "Hello" });

const user = await app.createUser();
const token = await app.tokenFor(user);
```

- `seed(model, data)` creates a record through the model, so its [hooks](/docs/models/hooks) run and `unique` fields are checked. The schema's own rules, such as `min(3)`, are not applied. They run only on API requests, so test them by calling the endpoint.
- `createUser()` makes a user with a random email and the password `"password"`. You can pass `name`, `email`, `password` and `groups`.
- `tokenFor(user)` returns a session token, to put in your own `Authorization` header.

## Testing permissions

A user from `createUser()` is in the built-in Full access group, so it can do everything. To test a narrower role, make a group and put the user in it:

```ts
const editors = await app.createGroup({
  name: "Editors",
  grants: ["post:*:own"],
});

const editor = await app.createUser({ groups: [editors.id] });
const nobody = await app.createUser({ groups: [] });

const own = await app.get("/api/post", { as: editor });
const denied = await app.get("/api/post", { as: nobody });
expect(denied.status).toBe(403);
```

`createUser({ groups: [] })` makes a user that can do nothing. `createGroup()` takes `name`, `grants` and an optional `description`. See [Grants](/docs/access-control/grants).

## Resetting between tests

`app.reset()` empties every table, including users and sessions, and keeps the schema. Use it in `beforeEach` when tests must not see each other's data:

```ts
import { beforeEach } from "bun:test";

beforeEach(() => app.reset());
```

`app.db` is the database adapter, for assertions the HTTP surface cannot express.

## Testing your own code

Anything that runs in the app can be tested by calling it through the app. A custom route, a hook triggered by creating a record, or an event listener runs as it does in production:

```ts
it("creates a slug before saving", async () => {
  const res = await app.post("/api/post", { body: { title: "Hello World" }, as: user });
  const { data } = await res.json();
  expect(data.slug).toBe("hello-world");
});
```
