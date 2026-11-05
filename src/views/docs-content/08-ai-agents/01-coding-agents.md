---
title: Building with a coding agent
description: Let an AI coding agent add models and pages to your njin project.
---

# Building with a coding agent

njin is designed so that a coding agent such as Claude Code can build on it without reading the framework's source. Every new project comes with two guides for the agent.

## CLAUDE.md and AGENTS.md

| File | What it is |
| --- | --- |
| `AGENTS.md` | A short brief for AI agents: what the project is, where to work, and which commands to run. It tells the agent to read `CLAUDE.md` before changing anything |
| `CLAUDE.md` | The full reference: models, vars, helpers, events, plugins, templates, the REST API, access control, configuration, testing and commands |

Agents read these files at the start of a session, so you do not need to explain njin to them in every prompt. `AGENTS.md` is a common convention that several coding agents look for, and Claude Code reads `CLAUDE.md`.

The framework itself lives in `node_modules/@njinlabs/njin`. There is no framework source in the project to read or change, and the guides say so. That is why the agent is told to work only in your project's own folders.

## The rules the guides set

The guides tell an agent that, to add a feature, it should only create or edit:

- `config.ts`, to register models, vars, helpers, events, routes and plugins
- `src/models/`, `src/vars/`, `src/helpers/` and `src/events/`
- `src/views/pages/`, `src/views/layouts/` and `src/views/components/`
- `src/client/main.ts` and `src/client/app.css`

They also tell it to register anything new in `config.ts`, to use `logger()` from `@njinlabs/njin/logger` instead of `console` in handlers, hooks and events, and to run `bun run dev` and `bun run test`.

Because the boundary is clear, a change stays small and easy to review, and the agent cannot break the framework by editing it.

## What to ask for

Ask for outcomes in the language of your site. For example:

- "Add a `post` model with a title, a slug, a body and a cover image, and a blog page that lists published posts."
- "Make the site name and footer text editable in the admin panel."
- "Add an English version of the About page. We write in Indonesian and English."
- "Send an email when a contact form entry is created."
- "Only let editors change the posts they created."

An agent that has read the guides knows how to turn each of these into a model, a vars group, a page, a hook or an access group.

## Tips

- **Restart the dev server after changes to `config.ts`.** njin reads it at startup, and a new model, helper or listener is not picked up until then. The same goes for adding a page file.
- **Decide on languages before the data exists.** Converting a model that already has records to i18n is not supported. See [Languages](/docs/models/languages).
- **Have the agent run the tests.** The project is set up for `bun run test`, and `createTestApp()` lets a test call your real app without opening a port. See [Testing](/docs/operations/testing).
- **Review what it writes.** Look at models and access groups in particular. They decide who can read and change your content.
- **Let it manage content separately.** A coding agent edits code. To let an agent add and edit content on a running site, connect it over MCP. See [Managing content over MCP](/docs/ai-agents/mcp).

## Keeping the guides current

`CLAUDE.md` and `AGENTS.md` are copied into your project from the project template when you create it. `bunx njin update` updates the framework and the admin panel, but it does not change these two files. After a major update, compare them with the template of the new version, which lives in the `template/` folder of the [njin repository](https://github.com/njinlabs/njin) at the matching tag, and copy over what changed.

You can also edit the files. Add your own conventions, such as your naming rules or the languages of the site, and every agent that works on the project will follow them.
