---
title: Updating njin
description: Update the framework and the admin panel.
---

# Updating njin

A njin project has two parts that are updated together: the framework package `@njinlabs/njin`, and the admin panel in `_admin/`. The admin panel is a separate project with its own releases.

## Updating the framework and the admin panel

Run this inside your project:

```bash
bunx njin update
```

It does these things:

1. Checks npm for the latest release of `@njinlabs/njin`.
2. Writes the new version to your `package.json` as `^<version>`.
3. Runs `bun install`.
4. Downloads the newest admin panel into `_admin/`.

When your project is already on the latest version, it says so, and it still makes sure the admin panel is current. When your project is on a version newer than the latest stable one, for example a beta, it leaves the framework alone.

If `bun install` fails, `package.json` already points at the new version. Run `bun install` yourself to try again. If only the admin panel could not be downloaded, run `bunx njin update --admin`.

## Updating only the admin panel

```bash
bunx njin update --admin
```

This refreshes `_admin/` and leaves the framework as it is. The command works only for the panel, so you can run it whenever a new panel release is out.

## Beta releases

To follow a prerelease channel instead of the latest stable release:

```bash
bunx njin update --beta
bunx njin update --tag next
```

`--beta` is the same as `--tag beta`. A project that is already on a prerelease follows the matching channel for the admin panel too.

## After updating

1. **Restart the server.** njin reads its configuration at startup.
2. **Run your tests.** `bun run test` checks that your models, hooks and pages still work with the new version. See [Testing](/docs/operations/testing).
3. **Compare the agent guides.** `bunx njin update` does not change `CLAUDE.md` or `AGENTS.md`, which are copied into your project when it is created. If you build with an AI agent, compare them with the template of the new version, in the `template/` folder of the [njin repository](https://github.com/njinlabs/njin) at that version's tag, and bring over what changed. See [Building with a coding agent](/docs/ai-agents/coding-agents#keeping-the-guides-current).
4. **Rebuild before you deploy.** For a production build, run `bunx njin build` again. See [Building and deploying](/docs/operations/deploying).

## Checking your version

The version njin is on is in your `package.json`, under `@njinlabs/njin`, and the server prints it on startup.
