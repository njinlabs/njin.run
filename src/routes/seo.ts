import { route } from "@njinlabs/njin";
import { readFile, stat } from "node:fs/promises";
import { docsTree } from "../lib/docs";

const ORIGIN = (process.env.SITE_URL ?? "https://njin.run").replace(/\/$/, "");
const TAGLINE = "One model in, a REST API, an admin panel and a server-rendered website out. Built for people and AI agents.";
const isProd = process.env.NODE_ENV === "production";

const text = (body: string, type: string) =>
  new Response(body, {
    headers: {
      "Content-Type": `${type}; charset=utf-8`,
      "Cache-Control": isProd ? "public, max-age=3600" : "no-cache",
    },
  });

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const stripFrontmatter = (src: string) => src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

const day = (d: Date) => d.toISOString().slice(0, 10);

// Public pages only. Internal pages (like /token) and /_admin, /api stay out of every list below.
async function sitemap() {
  const tree = await docsTree();
  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: "/", priority: "1.0" },
    { loc: "/docs", priority: "0.9" },
  ];
  for (const section of tree) {
    urls.push({ loc: `/docs/${section.slug}`, priority: "0.6" });
    for (const page of section.pages) {
      urls.push({ loc: page.href, lastmod: day((await stat(page.file)).mtime), priority: "0.8" });
    }
  }
  const items = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(ORIGIN + u.loc)}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

// https://llmstxt.org: a short, linked index of the docs for language models.
async function llmsIndex() {
  const lines = [`# njin`, ``, `> ${TAGLINE}`, ``];
  lines.push(
    `njin is a full-stack web framework for Bun. You define your content once as a Zod model, and njin generates the REST API, the admin panel, validation and server-rendered pages from it. AI agents can read and manage the content over MCP.`,
    ``,
    `- Source: https://github.com/njinlabs/njin`,
    `- npm: https://www.npmjs.com/package/@njinlabs/njin`,
    `- Full docs in one file: ${ORIGIN}/llms-full.txt`,
    ``,
  );
  for (const section of await docsTree()) {
    lines.push(`## ${section.title}`, ``);
    for (const p of section.pages) {
      lines.push(`- [${p.title}](${ORIGIN}${p.href})${p.description ? `: ${p.description}` : ""}`);
    }
    lines.push(``);
  }
  return lines.join("\n");
}

// Every docs page in one text file, for tools that want the whole documentation in a single request.
async function llmsFull() {
  const parts = [`# njin documentation`, ``, `> ${TAGLINE}`, ``];
  for (const section of await docsTree()) {
    for (const p of section.pages) {
      const body = stripFrontmatter(await readFile(p.file, "utf8")).trim();
      parts.push(`---`, ``, `Source: ${ORIGIN}${p.href}`, `Section: ${section.title}`, ``, body, ``);
    }
  }
  return parts.join("\n");
}

export default route()
  .get("/robots.txt", () =>
    text(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /_admin",
        "Disallow: /api/",
        "Disallow: /token",
        "",
        `Sitemap: ${ORIGIN}/sitemap.xml`,
        "",
      ].join("\n"),
      "text/plain",
    ),
  )
  .get("/sitemap.xml", async () => text(await sitemap(), "application/xml"))
  .get("/llms.txt", async () => text(await llmsIndex(), "text/plain"))
  .get("/llms-full.txt", async () => text(await llmsFull(), "text/plain"));
