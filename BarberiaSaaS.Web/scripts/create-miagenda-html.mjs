import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const original = await readFile(join(dist, "index.html"), "utf8");
let branded = original;

// This is a separate HTML entry served from Vercel based on the Host header.
// Social crawlers do not run React, so OG tags must be correct in the raw response.
const replace = (pattern, next) => {
  if (!pattern.test(branded)) throw new Error("Mi Agenda HTML build: expected metadata missing: " + pattern);
  branded = branded.replace(pattern, next);
};
replace(/<title>[^<]*<\/title>/, "<title>Mi Agenda CR | Tu negocio, tus citas, todo en orden</title>");
replace(/(<link rel="icon"[^>]*href=")[^"]+(")/, '$1/favicon-miagendacr.svg$2');
replace(/(<link rel="canonical" href=")[^"]+(")/, '$1https://www.miagendacr.app/$2');
replace(/(<meta name="theme-color" content=")[^"]+(")/, '$1#A34D78$2');
const substitutions = {
  description: "Mi Agenda CR: reservas online, clientes, agenda y profesionales en un solo lugar. 30 días gratis.",
  "og:site_name": "Mi Agenda CR",
  "og:title": "Mi Agenda CR | Tu negocio, tus citas, todo en orden",
  "og:description": "Reservas 24/7 para salones, uñas, barberías, spa y cualquier negocio con citas. Empezá gratis.",
  "og:url": "https://www.miagendacr.app/",
  "og:image": "https://www.miagendacr.app/share-miagendacr.png",
  "og:image:alt": "Mi Agenda CR: tu negocio, tus citas, todo en orden",
  "twitter:title": "Mi Agenda CR | Tu agenda inteligente",
  "twitter:description": "Reservas, horarios, profesionales y clientes en un solo lugar. Probá Mi Agenda CR gratis.",
  "twitter:image": "https://www.miagendacr.app/share-miagendacr.png"
};
for (const [name, value] of Object.entries(substitutions)) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp('(<meta (?:name|property)="' + escaped + '" content=")[^"]*(")');
  replace(pattern, (_, before, after) => before + value + after);
}
// Prevent a JS-based browser theme from momentarily repainting the shared HTML.
await writeFile(join(dist, "miagendacr-index.html"), branded);
console.log("Generated brand-aware Mi Agenda CR HTML for social previews");
