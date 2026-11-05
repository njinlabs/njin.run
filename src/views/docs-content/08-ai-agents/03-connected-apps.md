---
title: Connected apps
description: Review, narrow and revoke what AI agents are allowed to do.
---

# Connected apps

An app that you approved to use your site, such as an AI agent, is a **connected app**. You stay in control of it: you decide what it may do when you approve it, and you can narrow or remove its access at any time.

## How an app gets access

When an agent connects over MCP, njin shows you a consent screen in the admin panel, at `/_admin/oauth/authorize`:

1. It names the app and the address the sign-in will return to (the host). Check this address. It is where the result goes, and it is more reliable than the name the app chose for itself.
2. It lists what the app is asking for, limited to what **you** can do. An app can never be offered more than your own access.
3. You choose what to allow, or deny. You must choose at least one thing.

The app then gets its own token, limited to what you chose. Its tokens last a short time: the access token lasts one hour, and the app renews it with a refresh token that lasts 30 days.

If you approved an app before, and it now asks for the same or less, njin signs it in again without asking. An app can ask to be asked again.

If the app asks for everything (`*:*`) and you allow everything it is offered, the approval stays as "everything". Anything you gain access to later, such as a new model, is covered too. If you allow only some of it, the approval is limited to exactly those things.

## Reviewing connected apps

Open **Connected apps** in the admin panel to see the apps you have connected and to take their access back.

The same list is available over the API, with a signed-in session:

```bash
curl http://localhost:3000/api/oauth/consents \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

```json
{
  "data": [
    {
      "id": "01a1ab13-3c41-760e-8b80-63989523322f",
      "clientId": "01a1ab13-3c23-74b8-9337-44da3da7c4d8",
      "clientName": "My Agent",
      "scopes": ["post:read", "post:create"],
      "grantedAt": "2026-11-05T09:38:46.976Z",
      "lastUsedAt": "2026-11-05T09:38:47.020Z",
      "tokens": 1
    }
  ]
}
```

Each connection has its name, the scopes it was approved for, when it was approved and last used, and the number of tokens it holds. You see only your own connections.

## Narrowing access

You can take permissions away from an app without disconnecting it. Over the API, send the scopes it should keep:

```bash
curl -X PUT http://localhost:3000/api/oauth/consents/$ID \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "scopes": ["post:read"] }'
```

The change applies to the tokens the app already holds, at once. Access can be narrowed here, not widened. A request for more than was approved is rejected with `422`. To give an app more, remove it and connect it again.

## Revoking access

To disconnect an app, take its access back in the admin panel, or send `DELETE /api/oauth/consents/:id`. Its approval and all of its tokens are deleted, and its next request is refused with `401`.

An app that has been connected for a while and is no longer wanted should be removed. An app can also revoke its own token through `/oauth/revoke`.

## Limiting what an agent can do

A token can never do more than the user it belongs to. So the safest agent setup is to give an agent its own account:

1. Create an [access group](/docs/access-control/overview) with only what the agent needs, such as `post:*:own` and `file:create:own`.
2. Create a user in that group.
3. Connect the agent while signed in as that user.

The agent then cannot reach anything that user cannot, no matter what it asks for, and the records it creates belong to that user, so `own` grants keep them apart from other people's.

Personal tokens work the same way. You can create one with only the scopes an integration needs. See [Tokens and scopes](/docs/access-control/tokens-and-scopes).

## Things to remember

- Only a signed-in session can approve, narrow or remove a connection. A token, including an agent's own token, cannot do any of these, so a leaked token cannot grant itself more.
- Taking a permission away from the user takes effect at once on every app connected as that user. Permissions are not stored in the token.
- Agent actions are logged. See [Managing content over MCP](/docs/ai-agents/mcp#what-gets-logged).
