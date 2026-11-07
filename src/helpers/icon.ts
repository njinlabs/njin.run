import { defineHelper } from "@njinlabs/njin";
import logos from "@iconify-json/logos/icons.json";
import ph from "@iconify-json/ph/icons.json";
import simpleIcons from "@iconify-json/simple-icons/icons.json";
import { getIconData, iconToSVG } from "@iconify/utils";

const sets: Record<string, unknown> = { ph, "simple-icons": simpleIcons, logos };

/**
 * Inline SVG icon from Iconify, rendered on the server.
 *
 * A plain name is a Phosphor icon, always in the "-duotone" weight
 * (house-duotone, arrow-right-duotone, ...):
 *   {{{ icon('arrow-right-duotone', 'size-icon-md') }}}
 *
 * A "set:name" is a brand logo from "simple-icons" (one color, preferred) or "logos":
 *   {{{ icon('simple-icons:claude', 'size-5') }}}
 * Logos are third-party trademarks: use them only to say what njin works with.
 *
 * The icon uses currentColor, so color it with a text-* class.
 */
export default defineHelper("icon", (name: string, cls = "") => {
  const [set, id] = name.includes(":") ? name.split(":") : ["ph", name];
  const data = sets[set] ? getIconData(sets[set] as any, id) : null;
  if (!data) return `<!-- icon "${name}" not found -->`;
  const { attributes, body } = iconToSVG(data, { height: "1em" });
  const attrs = Object.entries(attributes)
    .filter(([k]) => k !== "width" && k !== "height")
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs} class="${cls}" fill="currentColor" aria-hidden="true">${body}</svg>`;
});
