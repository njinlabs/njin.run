---
title: Overview
description: How njin decides who can do what.
---

# Overview

Having an account does not let anyone do anything. A user can do only what the access groups they belong to allow.

## Access groups

An **access group** is a named list of **grants**. A grant says that something may be done, such as reading posts or managing users:

```text
post:*:own        every action on posts, but only on posts the user created
category:read     read categories
vars.site:write   change the "site" settings
```

A user belongs to any number of groups. What they can do is everything their groups grant, added together. There is no "deny" grant, so a user can never lose a permission by joining another group.

A user in no group can do nothing. Requests for content, such as `GET /api/post`, answer `403`.

## Full access

When you create the first admin during [setup](/docs/getting-started/installation#create-your-admin-account), njin creates a built-in group called **Full access** with the grant `*:*:all`, which means every action on everything, and puts the admin in it.

From then on, njin makes sure someone always keeps full access. A change that would leave nobody with it is refused with `409` and `"This would leave nobody with full access to the site"`. This covers removing the last user from the group, emptying the group's grants, and deleting the group.

## Managing groups and users

Groups and users are managed in the admin panel, or over the API. See [Users and tokens](/docs/rest-api/users-and-tokens).

- To put a user in groups, the person making the change also needs permission to update access groups (`access_group:update`).
- Grants are checked when a group is saved. Naming a resource or action that does not exist is rejected. See [Grants](/docs/access-control/grants).

## What is checked, and when

Permissions are worked out on every request, from the user's groups at that moment. Nothing is copied into a session or token. Changing a group, or removing a user, takes effect immediately, even for sessions and agents that are already signed in.

The same rules apply everywhere njin accepts a request from a caller:

- The REST API
- The admin panel, which uses the REST API
- AI agents connected over MCP

The admin panel uses what a user is allowed to see to decide which screens to show. `GET /api/schema` returns only the models and vars the caller may use.

## What is not checked

njin checks callers. It does not check your own code. Hooks, helpers, templates, event listeners, custom routes and custom MCP tools call models directly, and a model call does not ask whether anyone is allowed. Guarding that code is up to you. See [Code you write](/docs/access-control/your-own-code).

## Seeing your own permissions

`GET /api/auth/permissions` returns what the current credential may do, for each resource. A client can use it to show only what will work. See [Authentication](/docs/rest-api/authentication#what-the-caller-may-do).

## Next steps

- The syntax of a grant: [Grants](/docs/access-control/grants)
- Limiting a token to fewer permissions: [Tokens and scopes](/docs/access-control/tokens-and-scopes)
