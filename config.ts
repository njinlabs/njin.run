import postgresAdapter from "@njinlabs/njin/adapters/postgres";
import s3Adapter from "@njinlabs/njin/adapters/s3";
import { defineConfig } from "@njinlabs/njin/config";

export default defineConfig({
  port: Number(process.env.PORT ?? 3000),
  img: {
    hosts: process.env.IMG_HOSTS
      ? process.env.IMG_HOSTS.split(",")
          .map((h) => h.trim())
          .filter(Boolean)
      : [],
  },
  adapters: {
    db: postgresAdapter({ url: process.env.DATABASE_URL! }),
    file: s3Adapter({
      bucket: process.env.S3_BUCKET!,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicUrl: process.env.S3_PUBLIC_URL,
    }),
  },
  models: [
    // Register your models here, e.g.:
    // () => import("./src/models/post"),
  ],
  vars: [
    // Singleton settings objects (site name, SEO meta, ...), e.g.:
    // () => import("./src/vars/general"),
  ],
  helpers: [
    // Stateless functions exposed as Edge template globals, e.g.:
    // () => import("./src/helpers/format_date"),
    () => import("./src/helpers/icon"),
    () => import("./src/helpers/docs_nav"),
    () => import("./src/helpers/docs_page"),
    () => import("./src/helpers/is_production"),
  ],
  events: [
    // Listener files, imported here so their .listen() calls run at boot, e.g.:
    // () => import("./src/events/listeners/send_receipt"),
  ],
  // Logging goes to the console by default; add more destinations (any pino stream):
  // logger: { level: "info", streams: [{ stream: myStream, level: "error" }] },
  // Pages rendered on their first request and then cached until purgeStatic() (from "@njinlabs/njin/static");
  // dynamic routes like "/blog/:slug" work too, and { route: "/news", revalidate: 60 } refreshes in the background:
  // static: ["/", "/about"],
  static: ["/docs/:topic/:page"],
  routes: [
    // Custom Elysia routes, e.g.:
    // () => import("./src/routes/webhook"),
    () => import("./src/routes/docs_search"),
    () => import("./src/routes/seo"),
  ],
  plugins: [
    // Installable bundles of models/vars/hooks/events/routes, e.g.:
    // myPlugin({ apiKey: process.env.MY_PLUGIN_KEY! }),
  ],
});
