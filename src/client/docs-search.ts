import type { Alpine as AlpineType } from "alpinejs";
import type MiniSearchType from "minisearch";

type Entry = {
  id: string;
  url: string;
  page: string;
  section: string;
  heading: string;
  text: string;
};

type Result = { id: string; url: string; crumb: string; title: string; snippet: string };

const INDEX_URL = "/docs/search-index.json";

// MiniSearch's default splits on punctuation, which breaks identifiers such as create_record or
// x-requested-with into loose words. Keep the whole identifier as a token as well, so searching
// for it finds the pages that really contain it, and searching for its words still works.
const tokenize = (text: string) => [
  ...text.split(/[\n\r\p{Z}\p{P}]+/u).filter(Boolean),
  ...(text.match(/[\p{L}\p{N}]+(?:[_-][\p{L}\p{N}]+)+/gu) ?? []),
];
const MAX_RESULTS = 8;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A short piece of the entry's text around the first matched word, with the matches marked.
// The text is escaped before the marks are added, so nothing from the docs can become markup.
const snippetOf = (text: string, terms: string[]) => {
  if (!text) return "";
  const lower = text.toLowerCase();
  const found = terms.map((t) => lower.indexOf(t.toLowerCase())).filter((i) => i >= 0);
  const at = found.length ? Math.min(...found) : 0;
  const start = Math.max(0, at - 50);
  const end = Math.min(text.length, start + 160);
  let out = escapeHtml(text.slice(start, end));
  if (terms.length) {
    const re = new RegExp(`(${terms.map((t) => escapeRegex(escapeHtml(t))).join("|")})`, "gi");
    out = out.replace(re, '<mark class="docs-search-mark">$1</mark>');
  }
  return `${start > 0 ? "…" : ""}${out}${end < text.length ? "…" : ""}`;
};

export function registerDocsSearch(Alpine: AlpineType) {
  Alpine.data("docsSearch", () => {
    // Kept out of the reactive state: Alpine would wrap them in proxies for no benefit.
    let engine: MiniSearchType<Entry> | null = null;
    let loading: Promise<void> | null = null;

    return {
      open: false,
      q: "",
      results: [] as Result[],
      active: 0,
      status: "idle" as "idle" | "loading" | "ready" | "error",
      mac: false,

      init() {
        this.mac = /Mac|iPhone|iPad/.test(navigator.platform);
      },

      async show() {
        this.open = true;
        this.$nextTick(() => (this.$refs.input as HTMLInputElement | undefined)?.focus());
        await this.load();
        this.run();
      },

      close() {
        this.open = false;
      },

      onKey(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          if (this.open) this.close();
          else void this.show();
        }
      },

      load() {
        if (engine) return Promise.resolve();
        if (loading) return loading;
        this.status = "loading";
        loading = (async () => {
          try {
            const [{ default: MiniSearch }, res] = await Promise.all([
              import("minisearch"),
              fetch(INDEX_URL),
            ]);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const docs = (await res.json()) as Entry[];
            const mini = new MiniSearch<Entry>({
              fields: ["page", "heading", "text"],
              tokenize,
              storeFields: ["url", "page", "section", "heading", "text"],
              searchOptions: { boost: { page: 3, heading: 2 }, prefix: true, fuzzy: 0.2 },
            });
            mini.addAll(docs);
            engine = mini;
            this.status = "ready";
          } catch {
            loading = null;
            this.status = "error";
          }
        })();
        return loading;
      },

      run() {
        const query = this.q.trim();
        this.active = 0;
        if (!engine || !query) {
          this.results = [];
          return;
        }
        // Every word must match. If nothing does, settle for entries that match at least half of them.
        let hits = engine.search(query, { combineWith: "AND" });
        if (!hits.length) {
          const needed = Math.ceil(new Set(tokenize(query).map((t) => t.toLowerCase())).size * 0.6);
          hits = engine.search(query, { combineWith: "OR" }).filter((hit) => hit.queryTerms.length >= needed);
        }

        this.results = hits.slice(0, MAX_RESULTS).map((hit) => {
          const h = hit as unknown as Entry & { terms: string[] };
          return {
            id: h.id,
            url: h.url,
            crumb: h.section,
            title: h.heading ? `${h.page} › ${h.heading}` : h.page,
            snippet: snippetOf(h.text, h.terms),
          };
        });
      },

      move(delta: number) {
        const n = this.results.length;
        if (!n) return;
        this.active = (this.active + delta + n) % n;
        this.$nextTick(() => {
          document.getElementById(`docs-search-result-${this.active}`)?.scrollIntoView({ block: "nearest" });
        });
      },

      go() {
        const result = this.results[this.active];
        if (!result) return;
        this.close();
        window.location.href = result.url;
      },
    };
  });
}
