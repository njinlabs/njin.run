import { route } from "@njinlabs/njin";
import { docsSearchIndex } from "../lib/docs";

// The search index for the docs, fetched once by the search box in the browser.
// no-cache + ETag: the browser asks every time, and gets a cheap 304 while nothing has changed.
export default route().get("/docs/search-index.json", async ({ request }) => {
  const body = JSON.stringify(await docsSearchIndex());
  const etag = `W/"${Bun.hash(body).toString(36)}"`;
  const headers = { "Cache-Control": "no-cache", ETag: etag };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, {
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
});
