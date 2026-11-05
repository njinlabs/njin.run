---
title: Analytics
description: Page view statistics, collected automatically.
---

# Analytics

njin records a page view every time it successfully renders a page, and exposes the numbers over the API. There is nothing to install or configure.

## What is collected

For each page view njin stores:

| Field | Value |
| --- | --- |
| Path | The page's path, such as `/blog/hello` |
| Referrer | The page the visitor came from. Links from your own site are not stored |
| Country | Worked out from the visitor's IP address |
| User agent | The browser's `User-Agent` header |
| Visitor hash | A one-way hash, used to count unique visitors |

**The visitor's IP address is never stored.** It is used only to look up the country and to build the visitor hash. The hash combines the IP address, the user agent and the current date, so it changes every day, and the same person cannot be followed from one day to the next.

Page views are recorded in the background and never slow a response down. Only pages are counted: API requests, files and images are not.

If njin runs behind a proxy, it reads the visitor's address from the `X-Forwarded-For` header, then `X-Real-IP`, and falls back to the connection's own address. Make sure your proxy sets one of these headers, or every visit will look like it comes from the proxy.

## Endpoints

All of them need a credential with the `analytics:read` permission. See [Authentication](/docs/rest-api/authentication).

| Request | Returns |
| --- | --- |
| `GET /api/analytics/summary` | `{ "data": { "totalPageviews": 120, "uniqueVisitors": 48 } }` |
| `GET /api/analytics/by-country` | `{ "data": [{ "country": "ID", "count": 80 }] }` |
| `GET /api/analytics/by-referrer` | `{ "data": [{ "referrer": "https://example.com/", "count": 12 }] }` |
| `GET /api/analytics/by-page` | `{ "data": [{ "path": "/blog/hello", "count": 33 }] }` |
| `GET /api/analytics/timeseries` | `{ "data": [{ "date": "2026-11-05", "count": 17 }] }` |

Views without a known country or referrer may appear with a `null` value.

## Query parameters

| Parameter | What it does |
| --- | --- |
| `from` | Only views at or after this time |
| `to` | Only views at or before this time |
| `path` | Only views of this exact path. Not accepted by `by-page` |
| `interval` | `timeseries` only. `day` (the default) or `hour` |

`from` and `to` must be complete ISO 8601 date-times. A date alone, such as `2026-01-01`, is rejected with `422`:

```
GET /api/analytics/summary?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z
GET /api/analytics/timeseries?interval=hour&path=/blog/hello
```

In a time series, `date` is `YYYY-MM-DD` for `day`, and `YYYY-MM-DDTHH` for `hour`.

## Unique visitors

`uniqueVisitors` is the number of distinct visitor hashes in the range. Because the hash changes every day, someone who visits on three different days is counted as three visitors when the range spans those days.
