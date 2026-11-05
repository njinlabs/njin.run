---
title: Folder structure
description: What each file and folder in a njin project is for.
---

# Folder structure

A njin project is a regular Bun project. The framework itself is an npm package, `@njinlabs/njin`, installed in `node_modules`, so the project contains only your own code and content.

```text
my-web/
├── config.ts              Site settings and the list of everything you register
├── src/
│   ├── models/            Data models: posts, pages, products...
│   ├── vars/              Singleton settings: site name, SEO defaults...
│   ├── helpers/           Functions you can call from templates
│   ├── events/            Event definitions and their listeners
│   ├── routes/            Custom server routes
│   ├── plugins/           Plugins that live inside the project
│   ├── views/
│   │   ├── pages/         Page templates (file-based routing)
│   │   ├── layouts/       Layouts shared by pages
│   │   ├── components/    Reusable template components
│   │   └── errors/        Optional custom error pages (404.edge, 500.edge...)
│   └── client/
│       ├── main.ts        Browser JavaScript entry point
│       └── app.css        Tailwind CSS
├── static/                Images and files served as they are
├── _admin/                The admin panel
├── CLAUDE.md, AGENTS.md   Guides for AI coding agents
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Folders such as `src/vars/` and `src/events/` are where the matching files go. Create them when you need them.

## config.ts

The single place where you register what your site is made of: models, vars, helpers, events, routes and plugins. It also holds the port, the database, the file storage adapter, the allowed image hosts, logging, the languages of the site, and which pages are cached as static HTML.

njin reads `config.ts` once at startup, so restart the dev server after you change it. See [Configuration](/docs/operations/configuration).

## src/models

One file per model, each exporting the result of `makeModel()`. A model must be registered in `config.ts` before it exists in the API and the admin panel. See [Defining a model](/docs/models/defining-a-model).

## src/vars

One file per settings group, each exporting the result of `makeVars()`. Where a model holds many records, a vars group holds exactly one object, which is a good fit for things like the site name. See [Defining vars](/docs/vars/defining-vars).

## src/helpers, src/events, src/routes, src/plugins

- **helpers** are plain functions exposed as globals in every template. See [Helpers](/docs/extending/helpers).
- **events** are typed events and the listeners for them. See [Events](/docs/extending/events).
- **routes** are custom server routes, for things like webhooks. See [Custom routes](/docs/extending/custom-routes).
- **plugins** are bundles of models, vars, hooks, events and routes. `bunx njin plugin:create <name>` creates one in `src/plugins/<name>`. See [Plugins](/docs/extending/plugins).

## src/views

Templates are written in [EdgeJS](https://edgejs.dev).

- **pages/** maps files to URLs: `pages/about.edge` is `/about`, `pages/blog/[slug].edge` is `/blog/:slug`, and `index.edge` is the root of its folder. See [File-based routing](/docs/website/routing).
- **layouts/** holds the HTML shell shared by pages.
- **components/** holds reusable pieces, used with `@component` and `@include`.
- **errors/** can hold a template per status code, such as `404.edge`.

## src/client

`main.ts` is the browser entry point (Alpine.js is started here) and `app.css` is the Tailwind CSS entry. Both are built by Vite and added to a page with `vite.asset()`. See [Tailwind and Alpine.js](/docs/website/tailwind-and-alpine).

## static

Files that are served as they are, such as `logo.svg` and `favicon.svg`. Reference them in templates with `vite.static('logo.svg')`. See [Static assets](/docs/website/static-assets).

## _admin

The admin panel, served at `/_admin`. It is downloaded when the project is created and refreshed with `bunx njin update` (or `bunx njin update --admin` for the panel only). You do not edit it.

## Generated folders

These appear while you work and are listed in the starter `.gitignore`:

| Folder | What it is |
| --- | --- |
| `data/` | The embedded database, with the default settings |
| `uploads/` | Uploaded files, with the default filesystem adapter |
| `public/` | Assets built by Vite |
| `out/` | The output of `njin build` |
| `.cache/` | Cached static pages |

Keep `data/` and `uploads/` out of version control, but back them up. They hold your content.
