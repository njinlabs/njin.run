import { defineHelper } from "@njinlabs/njin";
import { docsTree } from "../lib/docs";

/** Sidebar data: [{ slug, title, pages: [{ title, href, topic, page }] }] */
export default defineHelper("docsNav", () => docsTree());
