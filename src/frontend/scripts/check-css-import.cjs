#!/usr/bin/env node
// Prebuild guard: ensures main.tsx imports ./index.css (not ../index.css)
const fs = require("fs");
const path = require("path");

const mainPath = path.resolve(__dirname, "../src/main.tsx");
const content = fs.readFileSync(mainPath, "utf8");

if (content.includes('import "../index.css"')) {
  console.log("[prebuild] Fixing CSS import in main.tsx...");
  const fixed = content.replace('import "../index.css"', 'import "./index.css"');
  fs.writeFileSync(mainPath, fixed, "utf8");
  console.log("[prebuild] Fixed: ../index.css -> ./index.css");
} else if (content.includes('import "./index.css"')) {
  console.log("[prebuild] CSS import OK.");
} else {
  console.warn("[prebuild] WARNING: Could not find expected CSS import in main.tsx. Check manually.");
}
