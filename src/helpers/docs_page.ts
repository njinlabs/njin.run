import { defineHelper } from "@njinlabs/njin";
import { docsPage } from "../lib/docs";

/** { entry, html, headings, prev, next } for /docs/:topic/:page, or null when it doesn't exist. */
export default defineHelper("docsPage", (topic: string, page: string) => docsPage(topic, page));
