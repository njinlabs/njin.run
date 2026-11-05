---
title: Plugins
description: Bundle models, routes, events and admin pages into something reusable.
---

# Plugins

A plugin is a bundle of the things you normally register one by one: models, vars, hooks, events, routes and more, plus its own pages in the admin panel. It works like a small njin project that extends whichever project installs it.

Most features belong in your project's own `src/models`, `src/helpers` and `src/events`. Reach for a plugin when you want to reuse a feature across projects, or to share it.

## What a plugin can contain

| Field | What it adds |
| --- | --- |
| `models` | Models, as `() => import(...)` like in `config.ts` |
| `vars` | Settings groups |
| `helpers` | Template helpers |
| `hooks` | Hook files |
| `events` | Event listener files |
| `routes` | [Custom routes](/docs/extending/custom-routes) |
| `static` | Pages to [cache as static HTML](/docs/website/static-caching) |
| `permissions` | Resources and actions that can be granted. See below |
| `admin` | The plugin's admin panel pages |
| `mcp` | [Custom MCP tools](/docs/extending/mcp-tools) for AI agents: `{ tools: [...] }` |
| `logger` | Extra log destinations: `{ streams: [...] }` |
| `init` | A function that runs once when the server starts |

All fields are optional. A plugin is created with `definePlugin()`, and it is usually wrapped in a function so that it can take options:

```ts
// my-plugin/src/index.ts
import { definePlugin } from "@njinlabs/njin";

export default (options: { apiKey: string }) =>
  definePlugin({
    models: [() => import("./models/report")],
    routes: [() => import("./routes/report")],
    init: () => {
      // set up something with options.apiKey
    },
  });
```

## Installing a plugin

Install the package, then call its factory in the `plugins` list of `config.ts`:

```ts
import myPlugin from "my-plugin";

export default defineConfig({
  plugins: [myPlugin({ apiKey: process.env.MY_PLUGIN_KEY! })],
});
```

Call the factory directly. Do not wrap it in `() => import(...)` as you do for models.

Everything a plugin contributes is added ahead of your own project's registrations, so your own models, hooks and routes run after the plugin's and can build on them. njin does not detect clashes: two plugins, or a plugin and your project, that register the same model prefix will fail at runtime.

## Creating a plugin

### Inside your project

```bash
bunx njin plugin:create reports
```

This creates `src/plugins/reports/` with an `index.ts` and an admin side (`admin/index.tsx` and `admin/index.css`), and prints how to register it. The name must be lowercase letters, digits and dashes, starting with a letter.

Register it in `config.ts` as the command tells you:

```ts
import reports from "./src/plugins/reports";

export default defineConfig({
  plugins: [reports()],
});
```

The admin side needs the `@njinlabs/njin-admin` package. If it is not in your `package.json` yet, the command says so, and you add it with `bun add @njinlabs/njin-admin`.

### As a package to publish

```bash
bunx @njinlabs/njin create --plugin my-plugin
```

This scaffolds a package for a plugin instead of a project. The folder name is the plugin's name, so it follows the same rules as above. It includes a small project in `dev/` to try the plugin in, and its scripts include `dev` and `build`. The admin side is published already built, so a project that installs your plugin needs neither Vite nor Tailwind for it.

## Admin panel extensions

A plugin's admin side is a file that default-exports `defineAdminPlugin()` from `@njinlabs/njin-admin/sdk`. The generated one registers a menu entry and a page:

```tsx
// admin/index.tsx
import { defineAdminPlugin } from "@njinlabs/njin-admin/sdk";
import "./index.css";

const Page = () => <div className="p-4">Reports</div>;

export default defineAdminPlugin({
  name: "reports",
  navs: [{ icon: () => <span aria-hidden>•</span>, label: "Reports", to: "/reports" }],
  routes: [{ path: "/reports", component: Page }],
});
```

Point to the file from the plugin's `admin` field:

```ts
definePlugin({
  admin: [import.meta.resolve("./admin/index.tsx")],
});
```

`config.ts` accepts an `admin` list too, for admin pages that belong to your own project rather than a plugin.

### Custom field inputs

A plugin can also draw its own input for a field. Wrap the field with `plugin()` and name the renderer as `"<plugin>:<renderer>"`:

```ts
import { plugin, text } from "@njinlabs/njin";

slug: plugin(text({ label: "Slug" }), ["reports:slugify", { from: "title" }]),
```

The field keeps validating and storing its value as a `text()`. If no plugin has registered that renderer, the admin panel draws the plain `text()` input.

## Permissions

A plugin can add resources to the access catalog, so that groups can be granted rights on them like on any model:

```ts
definePlugin({
  permissions: [{ resource: "reports", actions: ["read", "export"] }],
  routes: [() => import("./routes/report")],
});
```

Guard the plugin's routes with the same resource and action:

```ts
route().get("/reports/export", handler, { auth: { can: ["reports", "export"] } });
```

A group can then be given `reports:export`. Set `scoped: true` on a permission only when its rows have an owner, so that `own` means something. See [Grants](/docs/access-control/grants).
