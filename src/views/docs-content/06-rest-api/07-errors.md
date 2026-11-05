---
title: Errors
description: Status codes and the shape of error responses.
---

# Errors

API errors are JSON with a `message`. Some add details.

```json
{ "message": "Unauthorized" }
```

## Status codes

| Status | When | Example |
| --- | --- | --- |
| `400` | The request cannot be done | `"You cannot delete your own account"` |
| `401` | No credential, an invalid one, or a kind of credential this endpoint does not accept | `"Unauthorized"` |
| `403` | The credential is valid but not allowed. Also a cookie request that changes data without `X-Requested-With`, and a second setup | `"Forbidden"`, `"Setup already completed"` |
| `404` | The record exists, but the caller's `own` grant does not cover it. Also a token or connected app that is not yours | `"Not Found"`, `"Token not found"` |
| `409` | A conflict with the current state. See below | `"Field \"slug\" must be unique..."` |
| `422` | The request is not valid. See below | `"Validation error"` |
| `429` | Too many failed logins for an email | `"Too many failed attempts. Try again in a few minutes."` |
| `500` | An unexpected error, including an error thrown from a [hook](/docs/models/hooks) | `"Internal Server Error"` |

A missing record is not a `404`. See [Model endpoints](/docs/rest-api/model-endpoints#a-record-that-does-not-exist).

## Validation errors

When a body or a query parameter breaks a rule, the response is `422`, and `errors` lists each problem with the field it belongs to:

```json
{
  "message": "Validation error",
  "errors": [
    { "path": "title", "message": "Too small: expected string to have >=3 characters" },
    { "path": "status", "message": "Invalid option: expected one of \"DRAFT\"|\"PUBLISH\"" }
  ]
}
```

A missing required field is reported the same way, for example `"Invalid input: expected array, received undefined"`. The same format is used for query parameters, such as a `limit` above 100:

```json
{
  "message": "Validation error",
  "errors": [{ "path": "limit", "message": "Too big: expected number to be <=100" }]
}
```

Other `422` responses have their own messages:

| Where | Message |
| --- | --- |
| Creating or updating an access group | `"Some grants are not valid"`, with an `errors` list of strings |
| Uploading a file | `"This file type can't be uploaded (HTML, JavaScript and XML run on the site's origin)."` |
| Narrowing a connected app | `"Access can be narrowed here, not widened"` |
| Updating a localized field of a vars group with a plain value | A message asking for an object keyed by locale |

## Unique conflicts

A `409` with a `field` means a `unique` value is already taken. It is returned by `POST` and `PUT`:

```json
{ "message": "Field \"slug\" must be unique — value already exists", "field": "slug" }
```

Other `409` responses:

| When | Message |
| --- | --- |
| Discarding a record that was never published | `"Post is not published, nothing to discard"` |
| Deleting the last language of a record | `"..." is the only language left — delete the record instead` |
| A change that would leave nobody with full access | A message saying so |

## Handling errors in a client

```ts
const res = await fetch("/api/post", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (res.status === 422) {
  const { errors } = await res.json();
  for (const { path, message } of errors) showFieldError(path, message);
} else if (res.status === 409) {
  const { field, message } = await res.json();
  showFieldError(field, message);
} else if (!res.ok) {
  const { message } = await res.json();
  throw new Error(message);
}
```
