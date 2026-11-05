---
title: Configuration
description: Every option of config.ts, and how to use environment variables.
---

# Configuration

`config.ts` at the project root is the single source of truth for how your site runs. It exports `defineConfig({ ... })`:

```ts
import { defineConfig } from "@njinlabs/njin/config";

export default defineConfig({
  port: Number(process.env.PORT ?? 3000),
  models: [() => import("./src/models/post")],
});
```

njin reads the file once when the server starts, so restart the server after you change it. If there is no `config.ts`, njin runs with its defaults.

## All options

| Option | What it does | Default |
| --- | --- | --- |
| `port` | The port the server listens on | `3000` |
| `publicUrl` | The public address of the site, such as `https://example.com` | The address of each request |
| `db` | The default database: its path, namespace, database and auth. See [Database](#database) | `rocksdb://data` |
| `adapters.db` | Another database, instead of `db`. See [Database](#database) | SurrealDB from `db` |
| `adapters.file` | Where uploaded files are stored. See [File adapters](/docs/models/files#file-adapters) | Filesystem, `./uploads` |
| `img.hosts` | External hosts that `/img` may fetch images from. See [Image optimization](/docs/website/image-optimization) | None |
| `models`, `vars`, `helpers`, `hooks`, `events`, `routes` | What you register, each as a list of `() => import(...)` | Empty |
| `plugins` | Installed [plugins](/docs/extending/plugins) | Empty |
| `mcp` | `redirectUris` and `tools` for [AI agents](/docs/ai-agents/mcp) | Empty |
| `static` | Pages to [cache as static HTML](/docs/website/static-caching) | None |
| `edgeCache` | A shared cache in front of njin that is told about purges | None |
| `i18n` | The languages of the site. See [Languages](/docs/models/languages) | None |
| `logger` | Log level and destinations. See [Logging](#logging) | `info`, console |
| `permissions`, `admin` | Extra permissions and admin pages for your own project. See [Plugins](/docs/extending/plugins) | None |
| `rootDir` | The base folder that project-relative paths resolve against | The current directory |

Relative paths in the configuration, such as `./uploads` and `rocksdb://data`, resolve against the folder the server is started from. Run njin from the project folder (or from `out/` after a build).

## Database

### SurrealDB (the default)

SurrealDB is the default, and it runs embedded in your project, so no database server is needed:

```ts
export default defineConfig({
  db: {
    path: "rocksdb://data",
    namespace: "general",
    database: "general",
  },
});
```

`path` decides where the data is:

| Path | Where |
| --- | --- |
| `rocksdb://data` | Embedded. Stored in the `data/` folder. This is the default |
| `surrealkv://data` | Embedded, with another storage engine |
| `mem://` | Embedded, in memory. Everything is lost when the server stops |
| `ws://`, `wss://`, `http://`, `https://` | A remote SurrealDB server |

An embedded database can be opened by only one process at a time. Do not run two servers on the same folder.

For a remote server, add `auth` with either a token or a username and password:

```ts
db: {
  path: "wss://db.example.com",
  auth: process.env.DB_TOKEN
    ? process.env.DB_TOKEN
    : { username: process.env.DB_USERNAME!, password: process.env.DB_PASSWORD! },
},
```

Embedded engines take no `auth`.

### SQLite, PostgreSQL and MySQL or MariaDB

To use another database, pass its adapter in `adapters.db`. When you set it, the `db` option is ignored:

```ts
import sqliteAdapter from "@njinlabs/njin/adapters/sqlite";
import postgresAdapter from "@njinlabs/njin/adapters/postgres";
import mysqlAdapter from "@njinlabs/njin/adapters/mysql";

// SQLite: one file, no server
adapters: { db: sqliteAdapter({ path: "data/app.db" }) },

// PostgreSQL
adapters: { db: postgresAdapter({ url: process.env.DATABASE_URL, max: 10, tls: true }) },

// MySQL or MariaDB
adapters: { db: mysqlAdapter({ url: process.env.DATABASE_URL, tls: true }) },
```

| Adapter | Options |
| --- | --- |
| `sqliteAdapter` | `path`, a file such as `"data/app.db"` or `":memory:"`. `busyTimeout`, how long to wait for another process's write lock, in milliseconds |
| `postgresAdapter` | `url`, a connection string. `max`, the pool size. `tls`, `true` or TLS options, for anything but a local database. `schema`, a schema that must already exist |
| `mysqlAdapter` | `url` (`mysql://user:pass@host:3306/database`), `max`, `tls`, `schema`, a database that must already exist. One adapter serves both MySQL and MariaDB |

Use `tls` for any database that is not on your own machine. For MySQL 8 on a trusted network without TLS, `allowPublicKeyRetrieval: true` lets an account that uses `caching_sha2_password` log in. Prefer `tls: true`.

You can choose the database by environment, so that development uses one and production another:

```ts
adapters: {
  db: process.env.DATABASE_URL
    ? postgresAdapter({ url: process.env.DATABASE_URL, tls: true })
    : sqliteAdapter({ path: "data/app.db" }),
},
```

The tables are created and updated for you when the server starts.

## Logging

njin logs with [pino](https://getpino.io). Use `logger()` in your own code. See [Events](/docs/extending/events#when-a-listener-fails).

```ts
export default defineConfig({
  logger: {
    level: "info",
    console: true,
    streams: [{ stream: myStream, level: "error" }],
  },
});
```

| Option | What it does |
| --- | --- |
| `level` | The lowest level that is logged: `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`. Default `info` |
| `console` | Pretty-printed output in the terminal. Default `true`. Set it to `false` to log only to `streams` |
| `streams` | Extra destinations, written as JSON lines. A stream is anything pino accepts, so ready-made pino streams plug in directly. A stream's own `level` can only be stricter than the logger's |

An uncaught exception or unhandled promise rejection is logged as `fatal`, and then the process exits. Run the server under something that restarts it. See [Building and deploying](/docs/operations/deploying).

## Environment variables

njin does not define any environment variables of its own. Reading them is your choice, inside `config.ts`. Bun loads a `.env` file automatically, so a value you put there is available as `process.env.NAME`.

The starter `config.ts` reads these, and the starter `.env.example` lists them:

| Variable | What it sets |
| --- | --- |
| `PORT` | `port` |
| `DB_PATH`, `DB_NAMESPACE`, `DB_DATABASE` | The SurrealDB path, namespace and database |
| `DB_TOKEN`, or `DB_USERNAME` and `DB_PASSWORD` | Auth for a remote SurrealDB |
| `IMG_HOSTS` | A comma-separated list for `img.hosts` |
| `FILE_DIR`, `S3_*` | Used if your `config.ts` passes them to a file adapter. For example `bunFilesystemAdapter({ dir: process.env.FILE_DIR })` |

Keep `.env` out of version control. The starter `.gitignore` already does.
