---
title: Plugins
description: Build a reusable bundle of models, routes, events and admin panel pages.
---

# Plugins

A plugin is a bundle of the things you normally register one by one: models, vars, hooks, events, routes and more. It can also extend the admin panel with its own menu entries, pages, dashboard widgets and field inputs. It works like a small njin project that extends whichever project installs it.

Most features belong in your project's own `src/models`, `src/helpers` and `src/events`. Reach for a plugin when you want to reuse a feature across projects, or to share it.

This page covers a plugin from start to finish, in the order you build one:

1. [Create a plugin](#create-a-plugin)
2. [The server side](#the-server-side): models, routes, hooks, events, permissions
3. [The admin side](#the-admin-side): menu, pages, widgets, custom field inputs
4. [Publish and install](#publish-and-install)

Every example belongs to one plugin, `editorial`. It adds a draftable `editorial_note` model for an editorial team, a CSV export, a queue of notes waiting to be published, and two custom inputs for the note form.

## Create a plugin

There are two ways to start. Both create the same pieces: a server side (`index.ts`) and an admin side (`admin/`).

### Inside your project

```bash
bunx njin plugin:create editorial
```

This creates `src/plugins/editorial/` and prints how to register it. The name must be lowercase letters, digits and dashes, starting with a letter. The name matters: it prefixes the plugin's field inputs (`editorial:slugify`).

```
src/plugins/editorial/
├── index.ts          # the server side: definePlugin()
└── admin/
    ├── index.tsx     # the admin side: defineAdminPlugin()
    └── index.css     # Tailwind for the admin side
```

Register it in `config.ts`:

```ts
import editorial from "./src/plugins/editorial";

export default defineConfig({
  plugins: [editorial()],
});
```

The admin side needs the `@njinlabs/njin-admin` package. If it is not in your `package.json` yet, the command says so, and you add it with `bun add @njinlabs/njin-admin`.

Use this when the plugin is only for one project, or while you are still shaping it.

### As a package to publish

```bash
bunx @njinlabs/njin create --plugin editorial
```

This scaffolds a package for a plugin instead of a project. The folder name is the plugin's name, so it follows the same rules. It includes a small project in `dev/` to try the plugin in, and a `dev` and a `build` script. See [Publish and install](#publish-and-install).

## The server side

The server side is `index.ts`: a function that returns `definePlugin({...})`. Every field is optional, so a plugin can be only a model, or only an admin page.

```ts
// src/plugins/editorial/index.ts
import { definePlugin } from "@njinlabs/njin";

export default () =>
  definePlugin({
    models: [() => import("./models/editorial_note")],
    hooks: [() => import("./hooks/note_hooks")],
    events: [() => import("./events/note_listeners")],
    routes: [() => import("./routes/export")],
    permissions: [{ resource: "editorial", actions: ["export"] }],
    admin: [import.meta.resolve("./admin/index.tsx")],
  });
```

| Field | What it adds |
| --- | --- |
| `models` | Models, as `() => import(...)` like in `config.ts` |
| `vars` | Settings groups |
| `helpers` | Template helpers |
| `hooks` | Hook files |
| `events` | Event listener files |
| `routes` | [Custom routes](/docs/extending/custom-routes) |
| `static` | Pages to [cache as static HTML](/docs/website/static-caching) |
| `permissions` | Resources and actions that can be granted. See [Permissions](#permissions) |
| `admin` | The files of the plugin's [admin side](#the-admin-side) |
| `mcp` | [Custom MCP tools](/docs/extending/mcp-tools) for AI agents: `{ tools: [...] }` |
| `logger` | Extra log destinations: `{ streams: [...] }` |
| `init` | A function that runs once when the server starts |

The files behind `models`, `hooks`, `events` and `routes` are written exactly as they are in a project. Paths are relative to the plugin, not to `config.ts`.

### Options

A plugin is a function so that the project using it can pass options. The options are in scope for everything the function builds:

```ts
// src/plugins/editorial/index.ts
import { definePlugin } from "@njinlabs/njin";
import { logger } from "@njinlabs/njin/logger";

export type EditorialOptions = { webhookUrl?: string };

export default (options: EditorialOptions = {}) =>
  definePlugin({
    models: [() => import("./models/editorial_note")],
    init: () => {
      logger().info({ webhook: options.webhookUrl }, "editorial plugin ready");
    },
  });
```

```ts
// config.ts
plugins: [editorial({ webhookUrl: process.env.EDITORIAL_WEBHOOK })],
```

Options reach the plugin's `init` and anything else built inside the function. A file loaded with `() => import(...)` is a normal module and does not receive them, so to hand it a setting, store it in a small module of the plugin from `init`, or read it from `process.env`.

Call the plugin's function directly in `plugins`. Do not wrap it in `() => import(...)` as you do for models.

### Models and vars

A plugin's model is an ordinary [model](/docs/models/defining-a-model). Note the prefix: it is global, so give it a prefix that will not clash with the project's own.

```ts
// src/plugins/editorial/models/editorial_note.ts
import { makeModel, plugin, richtext, text } from "@njinlabs/njin";
import z from "zod";

export default makeModel("editorial_note", {
  name: "Editorial note",
  draftable: true,
  searchFields: ["title"],
  schema: z.object({
    title: text({ label: "Title" }),
    slug: plugin(text({ label: "Slug", unique: true }), ["editorial:slugify", { from: "title" }]),
    accent: plugin(
      text({ label: "Accent color" }, (z) => z.regex(/^#[0-9a-f]{6}$/i)),
      ["editorial:color", { palette: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"] }],
    ),
    body: richtext({ label: "Body" }),
  }),
});
```

The `plugin()` wrappers draw `slug` and `accent` with the plugin's own inputs. They are built in [Custom field inputs](#custom-field-inputs). Without them, both are plain text fields.

A model registered by a plugin gets its REST endpoints, its admin screens and its entry in the schema, like any other. Settings groups work the same way, through `vars`.

### Hooks and events

A hook file is a normal [hook](/docs/models/hooks) file. It registers its hooks when it is imported:

```ts
// src/plugins/editorial/hooks/note_hooks.ts
import { afterPublish } from "@njinlabs/njin";
import editorialNote from "../models/editorial_note";
import notePublished from "../events/note_published";

afterPublish(editorialNote, (record) => {
  notePublished.dispatch({ id: record.id, title: String(record.title) });
});
```

An [event](/docs/extending/events) is defined in one file and listened to in another. Both files are the plugin's:

```ts
// src/plugins/editorial/events/note_published.ts
import { makeEvent } from "@njinlabs/njin";

export default makeEvent<{ id: string; title: string }>();
```

```ts
// src/plugins/editorial/events/note_listeners.ts
import { logger } from "@njinlabs/njin/logger";
import notePublished from "./note_published";

notePublished.listen(({ title }) => {
  logger().info({ title }, "note published");
});
```

A project that installs the plugin can import `note_published` too, and listen to it from its own `events`. That is how a plugin lets a project react to what it does.

### Routes

A route file default-exports a `route()`. Everything about [custom routes](/docs/extending/custom-routes) applies, including the `auth` option:

```ts
// src/plugins/editorial/routes/export.ts
import { route } from "@njinlabs/njin";
import editorialNote from "../models/editorial_note";

export default route({ prefix: "/editorial" }).get(
  "/export",
  async ({ set }) => {
    const { data } = await editorialNote.read({ limit: 100, select: ["title", "slug"] });
    set.headers["content-type"] = "text/csv";
    set.headers["content-disposition"] = 'attachment; filename="notes.csv"';

    return ["title,slug", ...data.map((n) => `"${String(n.title)}",${n.slug}`)].join("\n");
  },
  { auth: { can: ["editorial", "export"] } },
);
```

Paths are exactly what you write. Keep a plugin's routes under one prefix named after the plugin, so they do not clash with the project's or another plugin's.

### Permissions

A plugin can add resources to the access catalog, so that groups can be granted rights on them like on any model:

```ts
definePlugin({
  permissions: [{ resource: "editorial", actions: ["export"] }],
});
```

- A group can then be given `editorial:export`. It shows up in the access group screen of the admin and in `GET /api/access/catalog`.
- Guard the plugin's routes with the same pair, as `export.ts` above does with `auth: { can: ["editorial", "export"] }`.
- In the admin panel, a menu entry, page or widget asks for the same permission with `requires`. See [Hiding what a user may not use](#hiding-what-a-user-may-not-use).
- Set `scoped: true` only when the resource has rows with an owner, so that `own` means something. See [Grants](/docs/access-control/grants).

A plugin's model needs no entry here. Models are already in the catalog under their prefix, so `editorial_note:read` and `editorial_note:publish` exist.

### Load order and clashes

Everything a plugin contributes is added ahead of your own project's registrations, so your own models, hooks and routes run after the plugin's and can build on them.

njin does not detect clashes. Two plugins, or a plugin and your project, that register the same model prefix or the same route path will fail at runtime. Prefix what you add with the plugin's name.

## The admin side

The admin panel is a React app that loads plugins at runtime. A plugin's admin side is a file that default-exports `defineAdminPlugin()` from `@njinlabs/njin-admin/sdk`, and the server side points to it with its `admin` field:

```ts
definePlugin({
  admin: [import.meta.resolve("./admin/index.tsx")],
});
```

`config.ts` accepts an `admin` list too, for admin pages that belong to your own project rather than a plugin. Each file in it exports its own `defineAdminPlugin()` with its own `name`.

You write plain React with Tailwind classes. The admin provides React itself, the router, data fetching, the signed-in session and a kit of ready-made inputs, so you do not install or bundle them.

### The admin file

Here is the whole admin side of `editorial`. The next sections build the pieces it imports.

```tsx
// src/plugins/editorial/admin/index.tsx
import { defineAdminPlugin } from "@njinlabs/njin-admin/sdk";
import "./index.css";
import { ColorField } from "./color-field";
import { QueuePage } from "./queue-page";
import { QueueWidget } from "./queue-widget";
import { SlugifyField } from "./slugify-field";

export default defineAdminPlugin({
  name: "editorial",
  navs: [
    {
      icon: () => <span aria-hidden>✎</span>,
      label: "Editorial queue",
      to: "/editorial/queue",
      requires: { resource: "editorial_note", action: "publish" },
      order: 20,
    },
  ],
  routes: [
    {
      path: "/editorial/queue",
      component: QueuePage,
      requires: { resource: "editorial_note", action: "publish" },
    },
  ],
  widgets: [
    {
      id: "queue",
      title: "Waiting to be published",
      size: "md",
      component: QueueWidget,
      requires: { resource: "editorial_note", action: "read" },
    },
  ],
  fields: {
    slugify: SlugifyField,
    color: ColorField,
  },
});
```

| Field | What it adds |
| --- | --- |
| `name` | Required. The plugin's name, which prefixes its field inputs (`editorial:slugify`). Use the plugin's folder name |
| `navs` | Entries in the admin's side menu |
| `routes` | Pages, at a path relative to the admin |
| `widgets` | Tiles that users can add to their dashboard |
| `fields` | Custom inputs for model fields |

### Menu entries

```tsx
navs: [{ icon: () => <span aria-hidden>✎</span>, label: "Editorial queue", to: "/editorial/queue" }],
```

- `icon` is a component with no props. Any React component works, such as an inline SVG.
- `to` is the path of a page, relative to the admin: `/editorial/queue` is served at `/_admin/editorial/queue`.
- `order` sorts entries, lowest first. Entries with the same order (or none) keep the order they were registered in.

### Pages

A page is a React component. The admin wraps it in a route, so inside it you use the hooks of `@tanstack/react-router` (`useParams`, `Link`, `useNavigate`) as in any page of the admin.

This one lists the notes waiting to be published, with a button to publish each and one to download the export:

```tsx
// src/plugins/editorial/admin/queue-page.tsx
import { modelApi, useClient } from "@njinlabs/njin-admin/sdk";
import { Badge, Button, Skeleton, toast } from "@njinlabs/njin-admin/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Note = { id: string; title: string; status: "draft" | "published" | "changed" };

export const QueuePage = () => {
  const client = useClient();
  const queryClient = useQueryClient();
  const notes = modelApi<Note>(client, "editorial_note");

  const waiting = useQuery({
    queryKey: ["model", "editorial_note", "list", "waiting"],
    queryFn: () =>
      notes.read({
        filters: { status: { $ne: "published" } },
        sort: "updatedAt",
        order: "desc",
        select: ["title", "status"],
      }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => notes.draft(id, "publish"),
    onSuccess: () => {
      toast.success("Published");
      return queryClient.invalidateQueries({ queryKey: ["model", "editorial_note"] });
    },
    onError: () => toast.error("Could not publish"),
  });

  const download = async () => {
    const { data } = await client.get<Blob>("/editorial/export", { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(data);
    link.download = "notes.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (waiting.isPending) return <Skeleton className="m-4 h-40" />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Waiting to be published</h1>
        <Button variant="outline" size="sm" onClick={download}>
          Export CSV
        </Button>
      </div>

      {waiting.data?.data.map((note) => (
        <div key={note.id} className="flex items-center justify-between rounded-control border p-3">
          <div>
            <p className="font-medium">{note.title}</p>
            <Badge variant={note.status === "changed" ? "primary" : "default"}>{note.status}</Badge>
          </div>
          <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(note.id)}>
            Publish
          </Button>
        </div>
      ))}

      {waiting.data?.data.length === 0 && <p className="text-muted-foreground">Nothing is waiting.</p>}
    </div>
  );
};
```

A path can have params. `path: "/editorial/$id"` is read with `useParams()`, and `<Link to="/editorial/$id" params={{ id }}>` links to it.

### Widgets

A widget is a tile on the dashboard. Every user picks the tiles they want, so a widget works on its own, with no props.

```tsx
// src/plugins/editorial/admin/queue-widget.tsx
import { recordsQuery, useClient } from "@njinlabs/njin-admin/sdk";
import { useQuery } from "@tanstack/react-query";

export const QueueWidget = () => {
  const client = useClient();
  const { data } = useQuery(
    recordsQuery(client, "editorial_note", { filters: { status: "draft" }, limit: 5, select: ["title"] }),
  );

  return (
    <div className="p-4">
      <p className="text-3xl font-semibold">{data?.meta.total ?? "–"}</p>
      <ul className="mt-2 text-sm text-muted-foreground">
        {data?.data.map((note) => (
          <li key={note.id}>{String(note.title)}</li>
        ))}
      </ul>
    </div>
  );
};
```

| Field | Meaning |
| --- | --- |
| `id` | Required, unique within the plugin |
| `title` | Shown in the list where users pick tiles |
| `size` | Columns taken on the dashboard grid: `"sm"`, `"md"`, `"lg"` or `"full"` |
| `order` | Lowest first |
| `requires` | The permission needed to see it |
| `component` | The tile itself |

### Hiding what a user may not use

`requires: { resource, action }` on a menu entry, page or widget means "show this only to someone with that permission". The resource is anything in the access catalog: a model prefix (`editorial_note`), `vars.<prefix>`, `file`, `user`, or a resource your server side declared in [`permissions`](#permissions) (`editorial`).

- A menu entry or widget without the permission is hidden.
- A page without the permission shows "no access" instead of your component, even when the URL is typed in.

This only decides what is shown. The server decides in the end, so guard routes with `auth` too.

To decide something inside a component, use the session hooks:

```tsx
import { useCan, useCanOn, useSession } from "@njinlabs/njin-admin/sdk";

const canPublish = useCan("editorial_note", "publish"); // "all" | "own" | "ref" | false
const canEdit = useCanOn("editorial_note", "update", note); // true for this one row
const { user, permissions, client } = useSession();
```

### Talking to the server

`useClient()` returns the admin's own axios instance. It carries the signed-in session, and a `401` on it signs the user out. The SDK has typed helpers over it for every part of the API:

```tsx
import { getVars, modelApi, updateVars, uploadFile } from "@njinlabs/njin-admin/sdk";

const notes = modelApi<Note>(client, "editorial_note");
await notes.read({ page: 2, filters: { status: "published" } });
await notes.show(id, { locale: "en" });
await notes.create({ title: "Hello" });
await notes.update(id, { title: "Hello again" });
await notes.draft(id, "publish"); // or "unpublish" / "discard"
await notes.destroy(id);

const general = await getVars<{ siteName: string }>(client, "general");
```

For your own routes, call the client directly: `client.get("/editorial/export")`.

Query keys are nested by model: `["model", "editorial_note", ...]`. After a write, `queryClient.invalidateQueries({ queryKey: ["model", "editorial_note"] })` refreshes every list and record of that model, including the admin's own screens. `recordsQuery`, `recordQuery` and the `createRecordMutation`, `updateRecordMutation`, `destroyRecordMutation` and `draftActionMutation` helpers already do both.

Use `toApiError(error)` to turn a failed request into `{ message, fields, details }`, where `fields` is keyed by form field path.

### Custom field inputs

Every field type has a default input in the admin: `text()` draws a text box, `boolean()` a switch. A plugin can replace that input for one field. A custom input has two halves:

1. **On the server**, `plugin()` marks the field with the name of a renderer. The `editorial_note` model above already does.
2. **In the admin**, the plugin registers a component under that name in `fields`.

The field's data does not change. It keeps validating and being stored as its base type, so a custom input only changes how the value is filled in. It needs no migration, and the REST API, MCP tools and templates see an ordinary `text()`.

#### Marking the field

```ts
slug: plugin(text({ label: "Slug", unique: true }), ["editorial:slugify", { from: "title" }]),
```

- `"editorial:slugify"` is `<plugin name>:<renderer>`. The name is checked when the model is defined, and a wrong shape throws.
- The second item is an options object that your component receives.
- Everything the base type supports still applies: `unique: true`, chained validators, `localized`, `.default()`. Validation happens on the server, whatever the input does.
- `plugin()` works on any field type, including `numeric()`, `boolean()`, `select()`, `array()` and `relation()`. The component receives that type's value.
- If no plugin has registered the renderer (it is not installed, or failed to load), the admin draws the plain base input. The form still works.

#### What a renderer receives

A renderer is a component that takes `FieldProps` and draws **the input only**. The admin draws the label, the error message and the position in the form around it.

| Prop | Meaning |
| --- | --- |
| `name` | The field's name, such as `slug`. Inside an object or array, its dotted path |
| `value` | The current value. Its type is the base type's, and it is `unknown` for you to narrow |
| `onChange(value)` | Call it with the new value |
| `onBlur()` | Call it when the input loses focus, so the form knows the field was touched |
| `disabled` | The field cannot be edited right now, such as while the form is saving |
| `invalid` | The field has an error. Pass it on to the input for the red border |
| `field` | The field as the schema describes it: `label`, `type`, `required`, `options` for a `select`, `model` for a relation, and so on |
| `options` | The second item you wrote on the server (`{ from: "title" }`). It is `unknown`, so cast it |
| `values` | The form's top-level values right now, to follow another field |
| `locale` | The language being edited, when the model has `i18n` |

For a `localized` field, `value` and `values` already hold the value of `locale`, not the map of languages. A renderer does not need to know about i18n.

#### Example: a slug that follows the title

The slug fills itself from `title` until the editor types in it, and a button brings the automatic behavior back.

```tsx
// src/plugins/editorial/admin/slugify-field.tsx
import type { FieldProps } from "@njinlabs/njin-admin/sdk";
import { Button, Input } from "@njinlabs/njin-admin/ui";
import { useEffect, useRef, useState } from "react";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const SlugifyField = ({ name, value, onChange, onBlur, disabled, invalid, options, values }: FieldProps) => {
  const { from } = options as { from: string };
  const source = String(values[from] ?? "");
  const current = String(value ?? "");

  // A slug that already matches its title, or an empty one, keeps following the title.
  // One an editor wrote by hand does not.
  const [manual, setManual] = useState(() => current !== "" && current !== slugify(source));
  const last = useRef(current);

  useEffect(() => {
    if (manual) return;
    const next = slugify(source);
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  }, [source, manual, onChange]);

  return (
    <div className="flex gap-2">
      <Input
        name={name}
        value={current}
        disabled={disabled}
        aria-invalid={invalid}
        onBlur={onBlur}
        onChange={(event) => {
          setManual(true);
          last.current = event.target.value;
          onChange(event.target.value);
        }}
      />
      {manual && (
        <Button variant="outline" disabled={disabled} onClick={() => setManual(false)}>
          Auto
        </Button>
      )}
    </div>
  );
};
```

`{ from: "title" }` is why this works for any model, whatever its title field is called.

#### Example: a color picker over a text field

The value is the same `"#0ea5e9"` string a `text()` holds, so templates keep reading `{{ note.accent }}`.

```tsx
// src/plugins/editorial/admin/color-field.tsx
import type { FieldProps } from "@njinlabs/njin-admin/sdk";
import { cn } from "@njinlabs/njin-admin/ui";

export const ColorField = ({ value, onChange, onBlur, disabled, options }: FieldProps) => {
  const { palette } = options as { palette: string[] };

  return (
    <div className="flex gap-2" onBlur={onBlur}>
      {palette.map((color) => (
        <button
          key={color}
          type="button"
          disabled={disabled}
          aria-label={color}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className={cn("size-8 rounded-full border-2", value === color ? "border-foreground" : "border-transparent")}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
```

#### Inside objects and arrays

A marked field works nested. The admin finds it wherever it sits, so `object()` members and `array()` elements can be custom inputs too:

```ts
palette: array({ label: "Palette" }, plugin(text({ label: "Color" }), ["editorial:color", { palette: COLORS }])),
```

Inside an object or array, `name` is the dotted path of the input (such as `palette.0`), and `values` is still the form's top-level values, so `options.from` should name a top-level field.

#### Tips

- Draw the input only. Do not add a label or an error; the admin does, and a second one would show twice.
- Treat `value` as possibly `undefined` or `null` for a new record.
- Call `onChange` with the type the base field stores: a string for `text()`, a number for `numeric()`, a plain id string for a relation.
- A renderer only runs in the browser. If a rule matters, put it in the field's validator, where it is enforced for the API too.
- Use `useClient()` inside a renderer if it needs data, such as a picker that loads suggestions.

### The UI kit

Import ready-made components from `@njinlabs/njin-admin/ui` so your pages look like part of the panel and follow dark mode:

`Button`, `Input`, `NumberInput`, `Select`, `Combobox`, `MultiSelect`, `MultiCombobox`, `Checkbox`, `Switch`, `DatePicker`, `RichTextEditor`, `RelationInput`, `Dialog`, `ConfirmDialog`, `Popover`, `Badge`, `Skeleton`, `Field`, `FieldLabel`, `FieldError`, `FieldDescription`, `toast`, and `cn` for joining class names.

```tsx
<Button variant="outline" size="sm" onClick={() => toast.info("Saved")}>Save</Button>
<Select options={[{ value: "a", label: "A" }]} value={value} onValueChange={setValue} />
```

`Button` takes `variant` of `default`, `outline`, `ghost`, `danger` or `danger-ghost`, and `size` of `default`, `sm` or `icon`. `Badge` takes `default`, `primary` or `danger`.

### Styling

`admin/index.css` starts with:

```css
@import "@njinlabs/njin-admin/plugin.css";
@source "./";
```

- Keep `@source "./";`. Without it, Tailwind scans the whole project it runs in and your stylesheet carries every class the rest of the site uses.
- Take colors from the admin's tokens (`text-foreground`, `bg-primary`, `text-muted-foreground`, `border-danger`, `var(--color-*)`), not from hex values, so dark mode and themes follow.
- Prefix classes of your own (`editorial-card`). A common name such as `.card` can override the admin's or another plugin's.

### What the admin shares with your plugin

React, `react-dom`, `@tanstack/react-query`, `@tanstack/react-router`, `@njinlabs/njin-admin/sdk` and `@njinlabs/njin-admin/ui` come from the admin at runtime, so there is one copy of React on the page. A plugin's build leaves them out. Do not bundle your own.

A plugin is built for a version of the admin's contract. If the versions differ, the admin refuses to load the plugin and says whether to rebuild the plugin with a current `@njinlabs/njin-admin`, or to update the admin with `bunx njin update --admin`.

## Publish and install

### Develop

In a project, the dev server serves `admin/index.tsx` directly, so a change shows after a reload.

In a package made with `njin create --plugin`, run these once and then develop:

```bash
bun install
bun run dev:admin   # once: downloads the admin panel into dev/_admin
bun run dev         # runs dev/ on http://localhost:3000, with the plugin from source
```

`dev/` is a small njin project that only exists to try the plugin in. Add the plugin's models and routes to `src/index.ts`, and its pages to `admin/`.

### Build and publish

```bash
bun publish
```

`prepublishOnly` runs `bun run build`, which builds the admin side into `admin/dist`. The package ships `src` and `admin/dist`, and its `src/index.ts` points `admin` at the built file. A project that installs the plugin needs neither Vite nor Tailwind for the admin side.

### Install

In the project that uses the plugin:

```bash
bun add editorial @njinlabs/njin-admin
```

```ts
// config.ts
import editorial from "editorial";

export default defineConfig({
  plugins: [editorial({ webhookUrl: process.env.EDITORIAL_WEBHOOK })],
});
```

Restart the server. The model, routes and admin pages are there, and the access groups can now be given `editorial:export`.
