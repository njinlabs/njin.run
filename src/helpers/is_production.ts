import { defineHelper } from "@njinlabs/njin";

/** True when running `njin start` or a built server. Used to keep internal pages (like /token) out of production. */
export default defineHelper("isProduction", () => process.env.NODE_ENV === "production");
