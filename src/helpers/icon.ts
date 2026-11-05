import { defineHelper } from "@njinlabs/njin";
import icons from "@iconify-json/ph/icons.json";
import { getIconData, iconToSVG } from "@iconify/utils";

/**
 * Inline SVG icon from Phosphor (Iconify set "ph"), rendered on the server.
 * Always use the "-duotone" weight (house-duotone, arrow-right-duotone, ...):
 *   {{{ icon('arrow-right-duotone', 'size-icon-md') }}}
 * The icon uses currentColor, so color it with a text-* class.
 */
export default defineHelper("icon", (name: string, cls = "") => {
  const data = getIconData(icons as any, name);
  if (!data) return `<!-- icon "${name}" not found -->`;
  const { attributes, body } = iconToSVG(data, { height: "1em" });
  const attrs = Object.entries(attributes)
    .filter(([k]) => k !== "width" && k !== "height")
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs} class="${cls}" fill="currentColor" aria-hidden="true">${body}</svg>`;
});
