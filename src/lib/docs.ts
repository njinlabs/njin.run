import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Marked } from "marked";
import { createHighlighter } from "shiki";

// Kept under src/views because `njin build` copies that folder (and not src/docs) next to the server.
// Resolved relative to this file first, not process.cwd(): when the app is run by a supervisor the cwd is
// not the project directory. The cwd-based paths remain as fallbacks (e.g. a compiled build, where it is ./views).
const ROOT =
  [
    join(import.meta.dir, "..", "views", "docs-content"),
    join(process.cwd(), "src", "views", "docs-content"),
    join(process.cwd(), "views", "docs-content"),
  ].find((p) => existsSync(p)) ?? join(import.meta.dir, "..", "views", "docs-content");
const isProd = process.env.NODE_ENV === "production";

const SECTION_TITLES: Record<string, string> = {
  "rest-api": "REST API",
  "ai-agents": "AI agents",
};

const LANGS = ["ts", "tsx", "js", "json", "bash", "sh", "html", "css", "yaml", "md", "diff", "sql"];

const highlighter = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: [...LANGS],
});

export type DocHeading = { id: string; text: string; depth: number };
export type DocEntry = { topic: string; page: string; title: string; description: string; href: string; file: string };
export type DocSection = { slug: string; title: string; pages: DocEntry[] };
export type DocPage = { entry: DocEntry; html: string; headings: DocHeading[]; prev?: DocEntry; next?: DocEntry };

const stripPrefix = (name: string) => name.replace(/^\d+-/, "");
const humanize = (slug: string) => SECTION_TITLES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
const slugify = (text: string) =>
  text.toLowerCase().replace(/[`*_]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function parseFrontmatter(src: string) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const data: Record<string, string> = {};
  if (!m) return { data, body: src };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: src.slice(m[0].length) };
}

let treeCache: DocSection[] | undefined;

export async function docsTree(): Promise<DocSection[]> {
  if (isProd && treeCache) return treeCache;
  const sections: DocSection[] = [];
  const dirs = (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  for (const dir of dirs) {
    const topic = stripPrefix(dir);
    const files = (await readdir(join(ROOT, dir))).filter((f) => f.endsWith(".md")).sort();
    const pages: DocEntry[] = [];
    for (const f of files) {
      const page = stripPrefix(f.replace(/\.md$/, ""));
      const file = join(ROOT, dir, f);
      const { data } = parseFrontmatter(await readFile(file, "utf8"));
      pages.push({ topic, page, title: data.title ?? humanize(page), description: data.description ?? "", href: `/docs/${topic}/${page}`, file });
    }
    sections.push({ slug: topic, title: humanize(topic), pages });
  }
  return (treeCache = sections);
}

async function render(markdown: string) {
  const hl = await highlighter;
  const headings: DocHeading[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        let id = slugify(text);
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) headings.push({ id, text: text.replace(/[`*_]/g, ""), depth });
        if (depth === 1) return `<h1 id="${id}">${inner}</h1>`;
        return `<h${depth} id="${id}"><a href="#${id}" class="docs-anchor">${inner}</a></h${depth}>`;
      },
      code({ text, lang }) {
        const l = (lang ?? "").split(/\s/)[0].replace(/^edge$/, "html");
        const language = hl.getLoadedLanguages().includes(l) ? l : "text";
        return hl.codeToHtml(text, {
          lang: language,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        });
      },
    },
  });
  return { html: await marked.parse(markdown), headings };
}

export async function docsPage(topic: string, page: string): Promise<DocPage | null> {
  const tree = await docsTree();
  const flat = tree.flatMap((s) => s.pages);
  const i = flat.findIndex((e) => e.topic === topic && e.page === page);
  if (i < 0) return null;
  const entry = flat[i];
  const { body } = parseFrontmatter(await readFile(entry.file, "utf8"));
  const { html, headings } = await render(body);
  return { entry, html, headings, prev: flat[i - 1], next: flat[i + 1] };
}

// ---- search index ------------------------------------------------------------------------

export type SearchEntry = {
  id: string;
  url: string;
  page: string;
  section: string;
  heading: string;
  text: string;
};

// Markdown to the text a reader would search for: links keep their label, code keeps its words.
const plainText = (md: string) =>
  md
    .replace(/^```[^\n]*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`/g, "")
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ")
    .replace(/[|*>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// One entry per page intro and per "##" section, so a result can link straight to a heading.
// Heading ids are made exactly as render() makes them, so the anchors match.
const indexPage = (entry: DocEntry, sectionTitle: string, body: string): SearchEntry[] => {
  const used = new Map<string, number>();
  const parts: { heading: string; id: string; lines: string[] }[] = [{ heading: "", id: "", lines: [] }];
  let inFence = false;

  for (const line of body.split(/\r?\n/)) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      parts[parts.length - 1].lines.push(line);
      continue;
    }
    const m = inFence ? null : line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (!m) {
      parts[parts.length - 1].lines.push(line);
      continue;
    }
    const depth = m[1].length;
    let id = slugify(m[2]);
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n) id = `${id}-${n}`;
    if (depth === 2) parts.push({ heading: m[2].replace(/[`*]/g, ""), id, lines: [] });
    else if (depth > 2) parts[parts.length - 1].lines.push(m[2]);
  }

  return parts.flatMap((part) => {
    const text = plainText(part.lines.join("\n"));
    if (!text && !part.heading) return [];
    return [
      {
        id: part.id ? `${entry.href}#${part.id}` : entry.href,
        url: part.id ? `${entry.href}#${part.id}` : entry.href,
        page: entry.title,
        section: sectionTitle,
        heading: part.heading,
        text,
      },
    ];
  });
};

let searchCache: SearchEntry[] | undefined;

export async function docsSearchIndex(): Promise<SearchEntry[]> {
  if (isProd && searchCache) return searchCache;
  const entries: SearchEntry[] = [];
  for (const section of await docsTree()) {
    for (const page of section.pages) {
      const { body } = parseFrontmatter(await readFile(page.file, "utf8"));
      entries.push(...indexPage(page, section.title, body));
    }
  }
  return (searchCache = entries);
}
