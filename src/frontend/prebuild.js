#!/usr/bin/env node
/**
 * Prebuild guard: ensures main.tsx imports ./index.css (design tokens)
 * and NOT ../index.css (empty stub). Auto-corrects if wrong.
 */
const fs = require("fs");
const path = require("path");

const mainPath = path.join(__dirname, "src", "main.tsx");
const indexCssPath = path.join(__dirname, "src", "index.css");

// 1. Check main.tsx import
let mainContent = fs.readFileSync(mainPath, "utf8");
if (mainContent.includes('"../index.css"') || mainContent.includes("'../index.css'")) {
  console.warn("[prebuild] WARNING: main.tsx was importing ../index.css — auto-correcting to ./index.css");
  mainContent = mainContent
    .replace(/['"]\.\.\/index\.css['"]/g, '"./index.css"');
  fs.writeFileSync(mainPath, mainContent, "utf8");
  console.log("[prebuild] Fixed: main.tsx now imports ./index.css");
} else if (mainContent.includes('"./index.css"') || mainContent.includes("'./index.css'")) {
  console.log("[prebuild] OK: main.tsx correctly imports ./index.css");
} else {
  console.error("[prebuild] ERROR: main.tsx does not import index.css at all! Check the file.");
  process.exit(1);
}

// 2. Check index.css is non-empty and starts with :root
if (!fs.existsSync(indexCssPath)) {
  console.error("[prebuild] ERROR: src/index.css does not exist!");
  process.exit(1);
}
const cssContent = fs.readFileSync(indexCssPath, "utf8").trim();
if (!cssContent.startsWith(":root") && !cssContent.includes(":root")) {
  console.error("[prebuild] ERROR: src/index.css does not contain :root — design tokens may be missing!");
  process.exit(1);
}
console.log("[prebuild] OK: src/index.css contains design tokens.");
