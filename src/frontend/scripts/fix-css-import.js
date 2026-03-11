#!/usr/bin/env node
/**
 * Prebuild guard: ensures main.tsx always imports ./index.css (design tokens)
 * and never ../index.css (empty stub). Also validates index.css is non-empty.
 * This runs before every build.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainPath = resolve(__dirname, "../src/main.tsx");
const indexCssPath = resolve(__dirname, "../src/index.css");

// ── 1. Fix main.tsx CSS import ────────────────────────────────────────────────
let mainContent = readFileSync(mainPath, "utf8");

if (mainContent.includes('../index.css')) {
  mainContent = mainContent.replace(/import\s+["']\.\.\/index\.css["'];?/g, 'import "./index.css";');
  writeFileSync(mainPath, mainContent, "utf8");
  console.log("[prebuild] ⚠️  Fixed CSS import in main.tsx: ../index.css -> ./index.css");
} else {
  console.log("[prebuild] ✅ CSS import in main.tsx is correct.");
}

// ── 2. Validate index.css is non-empty and starts with :root ─────────────────
const indexCssContent = readFileSync(indexCssPath, "utf8").trim();

if (!indexCssContent || indexCssContent.length < 100) {
  console.error("[prebuild] ❌ index.css appears empty or too short — design tokens may be missing!");
  process.exit(1);
}

if (!indexCssContent.startsWith(":root") && !indexCssContent.startsWith("@")) {
  console.error(`[prebuild] ❌ index.css does not start with ':root {' — content starts with: ${indexCssContent.substring(0, 50)}`);
  process.exit(1);
}

console.log("[prebuild] ✅ index.css looks valid (" + indexCssContent.length + " chars).");
