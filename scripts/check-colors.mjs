#!/usr/bin/env node
// Regression check for the dark-mode color palette (dark mode == prod colors).
// Guards against the two ways this broke once already:
//   1. a `.dark { --token: ... }` value silently drifting from its prod hex/rgba
//   2. a component using the wrong color token (e.g. --muted instead of --dim),
//      which no CSS-only check can catch — it has to look at the className itself
//
// Run: npm run check:colors

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

let failures = 0;
function check(label, ok) {
  if (ok) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
}

// 1. Dark-mode token values must match the exact prod baseline.
const DARK_TOKEN_BASELINE = {
  "--bg": "#000000",
  "--surface": "rgba(0, 0, 0, 0.4)",
  "--surface-strong": "#000000",
  "--fg": "#e5e5e5",
  "--muted": "#b4b4b8",
  "--dim": "#737373",
  "--border": "rgba(255, 255, 255, 0.12)",
  "--border-strong": "rgba(255, 255, 255, 0.2)",
  "--hover-outline": "rgba(255, 255, 255, 0.4)",
  "--heading-ghost": "#a6a6a6ee",
  "--quote-strong": "#ffffffd5",
  "--quote-muted": "#8c8c93bf",
};

console.log("Dark-mode token values (app/globals.css):");
const css = read("app/globals.css");
const darkBlockMatch = css.match(/\.dark\s*{([^}]*)}/s);
const darkBlock = darkBlockMatch ? darkBlockMatch[1] : "";
if (!darkBlockMatch) {
  check(".dark { ... } block exists in app/globals.css", false);
} else {
  for (const [token, expected] of Object.entries(DARK_TOKEN_BASELINE)) {
    const re = new RegExp(
      `${token.replace("-", "\\-")}:\\s*([^;]+);`,
    );
    const found = darkBlock.match(re)?.[1]?.trim();
    check(`${token}: ${expected}`, found === expected);
  }
}

// 2. Specific elements that were once silently miscolored (Tailwind neutral-500/600
// collapsed into the brighter --muted token instead of the dimmer --dim token) must
// keep using the dimmer token. Each snippet below is the exact fixed source line —
// if it goes missing, either the line moved/changed (update this snippet) or the
// regression came back (fix the component).
const DIM_TOKEN_SITES = [
  ["app/blog/[slug]/page.tsx", 'text-xs uppercase tracking-wide text-dim">'],
  ["components/blog/blog-index-motion.tsx", 'className="mt-8 text-dim">'],
  ["components/blog/blog-index-motion.tsx", 'text-xs uppercase tracking-wide text-dim">'],
  ["components/hero/hero.tsx", 'translate-x-[0.14em] text-dim md:-mt-5"'],
  ["components/hero/scatter-name.tsx", '"text-fg" : "text-dim";'],
  ["components/quotes/quote-cloud.tsx", 'tracking-[0.2em] text-dim"'],
  ["components/sections/skills-section.tsx", '<span className="text-dim transition-colors group-hover:text-fg">'],
  ["components/sections/skills-section.tsx", 'h-4 w-4 shrink-0 text-dim transition-colors'],
  ["components/site-header.tsx", '"text-dim hover:text-fg",'],
];

console.log("\nElements that must use --dim, not --muted:");
for (const [file, snippet] of DIM_TOKEN_SITES) {
  const content = read(file);
  check(`${file} — "${snippet}"`, content.includes(snippet));
}

// projects-section.tsx uses the same snippet twice (two link icons) — check count.
const projectsFile = read("components/sections/projects-section.tsx");
const dimIconSnippet =
  'className="text-dim transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 -m-1.5 p-1.5"';
const projectsDimCount = projectsFile.split(dimIconSnippet).length - 1;
check(
  `components/sections/projects-section.tsx — "${dimIconSnippet}" (x2)`,
  projectsDimCount === 2,
);

// 3. tailwind.config.ts must still map every color token to its CSS variable.
console.log("\ntailwind.config.ts token mapping:");
const twConfig = read("tailwind.config.ts");
for (const token of ["bg", "fg", "muted", "dim", "surface", "surface-strong", "border", "border-strong", "hover-outline"]) {
  const re = new RegExp(`["']?${token}["']?:\\s*"var\\(--${token}\\)"`);
  check(`colors.${token} -> var(--${token})`, re.test(twConfig));
}

console.log(
  failures === 0
    ? "\nAll color checks passed."
    : `\n${failures} color check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
