---
title: Installation
description: Create a new njin project and run it locally.
---

# Installation

This page takes you from nothing to a running site with an admin panel.

## Requirements

- **[Bun](https://bun.sh) 1.3.0 or newer.** njin runs on Bun, not Node.js.
- **`tar` on your PATH.** The create command uses it to unpack the project template.
- **An internet connection.** The create command downloads the project template and the admin panel.

You do not need a database server. By default njin stores data in an embedded SurrealDB database inside the project folder.

## Create a project

```bash
bunx @njinlabs/njin create my-web
cd my-web
```

The command:

1. Downloads the project template that matches the installed njin version.
2. Downloads the latest admin panel into `_admin/`.
3. Runs `bun install`.

The target directory must not exist yet, or must be empty. Leave the name out to create the project in the current directory (the project is then named `njin-app`):

```bash
bunx @njinlabs/njin create
```

## Run the dev server

```bash
bunx njin dev
```

The server starts with Vite hot reloading for your templates and styles. When it is ready it prints a summary:

```text
Local     http://localhost:3000
Database  ...
Models    0 registered
Admin     http://localhost:3000/_admin
```

Open `http://localhost:3000` to see the site.

The project's `package.json` also defines these scripts, so `bun run dev` works too:

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build the site for production into `out/` |
| `bun run start` | Run the site in production mode |
| `bun run test` | Run the tests |

To use another port, set `PORT` (the starter `config.ts` reads it) or change `port` in `config.ts`.

## Create your admin account

Open `http://localhost:3000/_admin`. The first time, the admin panel asks you to create an account with a name, an email and a password of at least 8 characters.

This account is put in the built-in **Full access** group, so it can do everything, including creating other users and groups.

Setup works only once. After the first user exists, the setup step is locked, and new users are created from inside the admin panel.

## Troubleshooting

### Directory already exists and is not empty

`create` refuses to write into a folder that already has files. Pick a new name or an empty folder.

### The admin panel could not be downloaded

Project creation continues with a warning. Fetch the panel later from inside the project:

```bash
bunx njin update --admin
```

### `bun install` failed

The project was still scaffolded. Run `bun install` inside the project folder to retry.

### The server fails with a database lock error

The embedded database can be opened by only one process at a time. Stop the other `njin dev` or `njin start` process that uses the same project folder, then start again.

## Next steps

- Learn what is in the project: [Folder structure](/docs/getting-started/folder-structure)
- Define your first content type: [Your first model](/docs/getting-started/your-first-model)
