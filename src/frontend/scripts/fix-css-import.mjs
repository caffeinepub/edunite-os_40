/**
 * Prebuild guard: ensures main.tsx always imports "./index.css"
 * (the full design token system) and never "../index.css" (empty placeholder).
 *
 * Run automatically via "prebuild" in package.json before every vite build.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainPath = resolve(__dirname, "../src/main.tsx");

let content = readFileSync(mainPath, "utf8");

const wrong = 'import "../index.css";';
const correct = 'import "./index.css";';

if (content.includes(wrong)) {
  content = content.replace(wrong, correct);
  writeFileSync(mainPath, content, "utf8");
  console.log("[fix-css-import] Fixed: ../index.css -> ./index.css in main.tsx");
} else if (content.includes(correct)) {
  console.log("[fix-css-import] OK: main.tsx already imports ./index.css");
} else {
  console.warn("[fix-css-import] WARNING: Could not find CSS import in main.tsx — please verify manually");
}
