---
title: Introduction
description: What njin is, who it is for, and what you can build with it.
---

# Introduction

njin is a full-stack web framework for Bun. You define your content once as a model, and njin generates the REST API, the admin panel, validation, and server-rendered pages from it. It then lets AI agents read and manage that content over MCP.

Your business logic lives in its own layer. The core never touches it, and your code never has to reimplement the plumbing.

```bash
bunx @njinlabs/njin create my-web
```

## Who is njin for?

njin is for developers who build content-driven websites and web apps, and who are tired of keeping several pieces in sync by hand.

It is a good fit if you:

- Build sites or apps for clients and want an admin panel your team can use without writing one from scratch.
- Currently split your work across a frontend, a backend, and a headless CMS, and spend too much time copying types and contracts between them.
- Work with AI coding agents and want a codebase where the agent edits your logic without breaking the infrastructure around it.
- Prefer a small, opinionated stack (Bun, Elysia, and SurrealDB by default) over assembling your own.

It is probably not the right choice if you need a mature plugin ecosystem, a large community, or a framework with years of production history behind it. njin is young, and it is honest about that.

## Why njin

njin started from a specific frustration: building a site with a separate frontend and a separate CMS, then watching every schema change ripple through three places. The more AI agents were involved in the work, the worse it got. More repos and more boundaries meant more room for the agent to guess wrong.

njin is built around three ideas.

**One source of truth.** A model describes your data. The REST API, the admin panel, and request validation are generated from it. Change the model, and everything follows.

**Strict layers.** Core code (routing, generation, admin) and your business logic are separated by a hard boundary. You write logic in your layer. The core does not reach into it, and you do not patch the core. This keeps changes small and predictable, for you and for any agent working in your codebase.

**Agent-ready by default.** Your models are exposed over MCP, so AI agents can read and manage content through a defined interface instead of scraping or guessing.

Under the hood, njin runs on Bun and Elysia, uses SurrealDB for storage by default (SQLite, PostgreSQL, and MySQL/MariaDB are also supported), EdgeJS for server-rendered templates, and Alpine.js for light interactivity in the browser.

## What can you build with njin?

njin is a good fit for anything where structured content is at the center:

- Marketing sites and company websites with an editable admin panel.
- Blogs, documentation sites, and other content-heavy pages.
- Client sites where non-developers need to manage content themselves.
- Internal tools and small back-office apps built around a set of models.
- Backends that need a REST API and an admin interface, with an AI agent in the loop.

Because your business logic has its own layer, njin is not limited to read-only content. You can add custom endpoints, workflows, and rules on top of the generated base.

## How njin compares

njin sits between a headless CMS and a full application framework. Here is how it differs from the tools you are most likely to be weighing it against.

**Headless CMSs (Payload, Strapi).** These give you a content backend that you connect to a separate frontend. njin generates the admin and API the same way, but also renders pages and hosts your business logic in the same project, so there is no second repo to keep in sync. The trade-off is ecosystem size: established CMSs have more plugins, more integrations, and more community answers.

**Full-stack frameworks (Next.js, Remix, Laravel).** These give you maximum flexibility, but you build the admin panel, the API layer, and the validation yourself or assemble them from packages. njin gives you those by default, in exchange for being more opinionated about how your project is structured.

**Choosing njin.** Pick it when you want the generated API and admin panel, a single project instead of split repos, and a codebase that is easy for AI agents to work in. Pick something else when you need a large ecosystem or a runtime other than Bun.

Performance benchmarks against other tools will be published once they are complete. Until then, njin makes no performance claims.