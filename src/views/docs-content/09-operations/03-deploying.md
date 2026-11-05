---
title: Building and deploying
description: Build for production and run your site on a server.
---

# Building and deploying

## Commands

| Command | What it does |
| --- | --- |
| `bunx njin dev` | Start the development server, with Vite hot reload |
| `bunx njin build` | Build for production into `./out` |
| `bunx njin start` | Run the project in production mode, from source |
| `bunx njin build:worker` | Build a bundled `worker.js` instead of a program. See below |

The starter `package.json` has scripts for them, so `bun run dev`, `bun run build` and `bun run start` work too.

## Production mode

When the server runs in production mode, it behaves differently from `njin dev`:

- Pages listed under `static` in `config.ts` are cached as HTML. See [Static page caching](/docs/website/static-caching). The cache is cleared every time the server starts.
- There is no Vite dev server. Styles and scripts come from files that were built beforehand.
- A page that throws an error shows your `errors/500.edge` (or a plain page), not the debug page with a stack trace. The error is logged.
- `Strict-Transport-Security` is added to pages served over HTTPS.

## Building for production

```bash
bunx njin build
```

The build writes everything the server needs to `out/`:

| Path | What it is |
| --- | --- |
| `out/server` (`out/server.exe` on Windows) | The compiled server, which contains your `config.ts`, your models and the framework |
| `out/public/` | The CSS and JavaScript built by Vite, and your `static/` files |
| `out/src/views/` | A copy of your `src/views/` templates |
| `out/_admin/` | The admin panel |
| `out/geoip-data/` | The country data used by [analytics](/docs/rest-api/analytics). It must stay next to the server |
| `out/bindings/` | The native SurrealDB library, when you use an embedded SurrealDB database |

Run it from `out/`:

```bash
cd out
./server
```

The server reads templates, the admin panel and built assets from the folders next to it, and it resolves relative paths such as `rocksdb://data` and `./uploads` against the folder it was started from. So start it from `out/`, or from wherever you copied that folder to.

Copy the whole `out/` folder to your server. The server does not need Bun, `node_modules` or your source.

### Keep your own files inside src/views

Only `src/views/` is copied into `out/`. If your site reads files at runtime, such as Markdown for a docs section, keep them under `src/views/` so that they ship with the build. This documentation site does exactly that, and keeps its pages in `src/views/docs-content/`.

## Running from source

`njin start` runs the project directly, without a build step for the server:

```bash
bunx vite build
bunx njin start
```

This needs your project folder, `node_modules` (`bun install`) and Bun on the server. Because `start` serves styles and scripts from `public/`, run `vite build` first, which writes them there.

Use `build` when you want one folder to copy. Use `start` when you deploy the project folder itself, for example from git.

## Worker build

`bunx njin build:worker` produces a bundled `out/worker.js` instead of a compiled program, together with the same `public/`, `src/views/` and `_admin/` folders. It is for hosting setups where a supervisor process runs njin sites as workers, and it runs from inside a project tree, using the real `node_modules`. Most projects use `build`.

## Before you go live

- **Persist your data.** Keep `data/` (the embedded database) and `uploads/` (uploaded files) on storage that survives a restart or a new deploy. Back them up. Or use an external database and the S3 file adapter, and keep the server itself stateless. See [Configuration](/docs/operations/configuration).
- **Restart on failure.** An uncaught exception or unhandled rejection is logged and then the process exits. Run the server under something that restarts it: systemd, a process manager, or a container restart policy.
- **Use one process per embedded database.** An embedded database can be opened by only one process. For more than one server, use an external database.
- **Put HTTPS in front of it.** Run a reverse proxy that terminates TLS, and have it pass `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto`. Analytics reads the visitor's address, and the site builds some of its addresses, from them.
- **Set `publicUrl`.** In `config.ts`, set `publicUrl` to your site's public address, such as `https://example.com`. AI agents use it to find your sign-in details, and cached pages use it to build `request.url`.
- **Create the first admin.** On a new database, open `/_admin` and create the account right away. Setup is open to anyone until the first user exists.
- **Add your image hosts.** If pages show images from other hosts, list them in `img.hosts`.
- **Check that it is up.** `GET /api/setup/status` needs no sign-in and answers quickly, so it is handy as a health check.

## Environment variables

Set them on the server in the way your host provides. The server reads them when it starts. See [Configuration](/docs/operations/configuration#environment-variables).
