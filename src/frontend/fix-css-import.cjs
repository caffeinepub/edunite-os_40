/**
 * Prebuild guard: ensures main.tsx always imports ./index.css (not ../index.css).
 * Prevents the recurring CSS design-system breakage bug.
 */
const fs = require("fs");
const path = require("path");

const mainPath = path.join(__dirname, "src", "main.tsx");
let content = fs.readFileSync(mainPath, "utf8");

if (content.includes('../index.css')) {
  content = content.replace(/import ["']\.\.\/index\.css["'];/, 'import "./index.css";');
  fs.writeFileSync(mainPath, content, "utf8");
  console.log("[fix-css-import] Fixed: main.tsx now imports ./index.css");
} else {
  console.log("[fix-css-import] OK: main.tsx already imports ./index.css");
}
