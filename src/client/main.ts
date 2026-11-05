import Alpine from "alpinejs";
import { registerDocsSearch } from "./docs-search";

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

window.Alpine = Alpine;
registerDocsSearch(Alpine);
Alpine.start();
