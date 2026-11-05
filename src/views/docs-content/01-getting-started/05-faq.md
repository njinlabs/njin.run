---
title: FAQ
description: Short answers to common questions about njin.
---

# FAQ

## General

### Does njin run on Node.js?

No. njin is built on Bun and requires Bun 1.3.0 or newer.

### Is njin free to use?

Yes. njin is open source under the MIT license.

### Do I have to use the admin panel?

No. The admin panel is a convenient front for the REST API, but every model is also available through the API directly, and your own code can call a model's methods (`read`, `create`, `update` and so on) without either.

### Can an AI agent build my site?

Yes. Every project includes `CLAUDE.md` and `AGENTS.md`, which describe the framework so that a coding agent can add models and pages without reading the framework's source. See [Building with a coding agent](/docs/ai-agents/coding-agents).

### Can an AI agent manage my content?

Yes. Agents that support MCP can connect to the `/mcp` endpoint of your site, for example `http://localhost:3000/mcp`. The admin panel lists connected apps under **Connected apps**, where you can narrow or revoke their access at any time. See [Managing content over MCP](/docs/ai-agents/mcp).

## Content and data

### Which databases does njin support?

SurrealDB, SQLite, PostgreSQL and MySQL/MariaDB.

SurrealDB is the default. It runs embedded in your project (stored in the `data/` folder), so you do not need to run a database server. To use another database, pass its adapter in `config.ts`:

```ts
import sqliteAdapter from "@njinlabs/njin/adapters/sqlite";

export default defineConfig({
  adapters: { db: sqliteAdapter({ path: "data/app.db" }) },
});
```

The PostgreSQL and MySQL/MariaDB adapters are `@njinlabs/njin/adapters/postgres` and `@njinlabs/njin/adapters/mysql`. When you set `adapters.db`, the `db` setting is ignored.

### Where are uploaded files stored?

In the `uploads/` folder by default. To store files elsewhere, such as S3, R2 or MinIO, use the S3 adapter from `@njinlabs/njin/adapters/s3`. See [Configuration](/docs/operations/configuration).

### Can I have drafts and publishing?

Yes. Add `draftable: true` to a model. See [Draft and publish](/docs/models/draft-and-publish).

### Can my site be multilingual?

Yes, with `i18n` in `config.ts` and `i18n: true` on a model. Decide this when you create the model: converting a model that already has data to i18n is not supported. See [Languages](/docs/models/languages).

### How do I control who can edit what?

With access groups and grants, for example `post:*:own` to let a group manage only the posts its members created. See [Access control](/docs/access-control/overview).

## Development

### I changed `config.ts` and nothing happened.

njin reads `config.ts` at startup. Restart the dev server after changing it. Templates and styles reload on their own.

### Why does the server fail with a database lock error?

The embedded database can be opened by only one process at a time. Make sure no other `njin dev` or `njin start` is running for the same project folder.

### How do I update njin?

Run `bunx njin update` inside the project. It updates `@njinlabs/njin` and the admin panel. `bunx njin update --admin` updates only the admin panel. See [Updating njin](/docs/operations/updating).

## Deployment

### How do I deploy?

`bunx njin build` writes a production build to `./out`, and `bunx njin start` runs the project in production mode from source. See [Building and deploying](/docs/operations/deploying).

### Can I serve pages as static HTML?

Yes. List page routes under `static` in `config.ts`. They are rendered on the first request in production and then served from a cached HTML file. See [Static page caching](/docs/website/static-caching).
