---
title: Managing content over MCP
description: Connect an AI agent to your site so it can read and edit content.
---

# Managing content over MCP

[MCP](https://modelcontextprotocol.io) is a standard way for AI agents to use tools. Every njin site has an MCP endpoint at `/mcp`, through which an agent such as Claude can read and edit your content. The agent works through tools, and every tool follows the same permissions as the REST API, so an agent can do only what you allow.

For example, once connected you can ask an agent to "write three draft posts about our new product and attach the images I uploaded", or to "change the footer text".

## Connecting an agent

The address is your site's address followed by `/mcp`:

```text
https://example.com/mcp
http://localhost:3000/mcp
```

Add that address as a remote MCP server in your agent or client. With Claude Code, for example:

```bash
claude mcp add --transport http mysite https://example.com/mcp
```

Most clients then handle sign-in themselves:

1. The client calls `/mcp` and is told it needs to sign in. njin answers `401` and points to its sign-in details.
2. The client registers itself with njin and opens the njin sign-in page in your browser.
3. You sign in with your normal njin account and choose what the client may do.
4. The client receives its own token, limited to what you chose. Nobody pastes a token anywhere.

You can see and revoke each connection at any time. See [Connected apps](/docs/ai-agents/connected-apps).

### A site on your own computer

`http://localhost:3000/mcp` can be reached only by clients running on the same computer. An agent that runs in the cloud cannot reach `localhost`. To use one, give your site a public HTTPS address.

### Setting the public address

njin publishes its sign-in details with the address a client used to reach it. When the site sits behind a proxy that changes the host, set `publicUrl` in `config.ts` so the address is exact:

```ts
export default defineConfig({
  publicUrl: "https://example.com",
});
```

### Which clients are accepted

Sign-in needs a callback address that njin trusts, so that no unknown program can receive a sign-in. These are accepted out of the box:

- Claude (`claude.ai` and `claude.com`)
- ChatGPT
- Cursor
- VS Code
- Any program on your own computer that uses a loopback address (`localhost` or `127.0.0.1`), which covers command-line clients

For another client, add its callback address to `config.ts`. An entry that ends in `*` matches any path below it:

```ts
export default defineConfig({
  mcp: {
    redirectUris: ["https://agent.example.com/oauth/callback", "https://app.example.com/oauth/*"],
  },
});
```

Add only the clients you trust: the callback is where the sign-in result is sent.

### With a personal token

A client that lets you set a request header can skip the sign-in and use a personal token. Create one in the admin panel or with `POST /api/token`, and send it as `Authorization: Bearer <token>`. See [Users and tokens](/docs/rest-api/users-and-tokens). `/mcp` accepts personal and OAuth tokens, not a signed-in session.

## The built-in tools

An agent is told to start with `list_models`, which returns every model and settings group with its schema, so it knows what it can work with.

| Tools | What they do |
| --- | --- |
| `list_models` | List the models and vars groups, with their schemas |
| `read_records`, `get_record` | List records with search, filters, sorting and pagination. Get one record with its relations expanded |
| `create_record`, `update_record`, `delete_record` | Create, change and delete records. An update changes only the fields it sends |
| `publish_record`, `unpublish_record`, `discard_changes` | The draft workflow, for models with `draftable` |
| `remove_locale` | Delete one language of a record, for models with `i18n` |
| `get_vars`, `update_vars` | Read and change a settings group |
| `publish_vars`, `unpublish_vars`, `discard_vars` | The draft workflow, for vars groups with `draftable` |
| `create_upload_url`, `check_upload` | Add files to the site. See below |
| `list_files`, `get_file`, `delete_file` | Look at and delete uploaded files |

You can add your own. See [Custom MCP tools](/docs/extending/mcp-tools).

### How fields are written

The tools follow the same rules as the API:

- A relation or file field takes the **id** of the related record, as a plain string. Never an object.
- `update_record` and `update_vars` change only the fields they send.
- A localized field is an object keyed by language: `{ "en": "About", "id": "Tentang" }`.
- A validation error names the field, and the agent can fix it and try again.

### Permissions

Every agent sees the same list of tools, but each call is checked against the permissions of the token. Without permission, the call returns a `Forbidden` error, which the agent can read. A token that was approved only for `post:read` and `post:create` can create posts, but publishing or deleting one fails.

See [Tokens and scopes](/docs/access-control/tokens-and-scopes).

### Uploading files

A file cannot be sent through a tool call, since the bytes would flood the conversation. Instead, `create_upload_url` returns a short-lived address, and the file travels outside the conversation:

1. The agent calls `create_upload_url`.
2. The agent uploads the file to that address, for example with `curl -F file=@photo.jpg <url>`. If it cannot reach the address, it gives the address to you, and you open it in a browser and drop the file on it.
3. The agent calls `check_upload` and gets the ids of the files that arrived.
4. The agent writes those ids into a `file()` field.

An upload address works for 10 minutes, accepts up to 10 files, and each file can be up to 10 MB. Only these file types are accepted:

`jpg`, `jpeg`, `png`, `gif`, `webp`, `avif`, `bmp`, `ico`, `pdf`, `txt`, `csv`, `md`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `zip`, `mp3`, `wav`, `ogg`, `mp4`, `webm`, `mov`, `woff` and `woff2`.

This list is stricter than the one for `POST /api/file`. Web pages and scripts (`html`, `js`, `xml`, `svg`) are not accepted over MCP.

## What gets logged

Every tool call is written to the log at `info` level with the name of the token, the tool, the model or group and the record id. Use it to see what an agent has done.

## Errors

An error inside a tool is returned to the agent as an error result with a message, not as a failure of the connection. A tool call with arguments of the wrong type is rejected before it runs, with a message that names the argument.
