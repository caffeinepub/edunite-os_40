/**
 * Prebuild guard: ensures main.tsx always imports ./index.css (not ../index.css).
 * This prevents the recurring CSS import bug that breaks the design system.
 */
const fs = require("fs");
const path = require("path");

const mainPath = path.join(__dirname, "src", "main.tsx");
let content = fs.readFileSync(mainPath, "utf8");

if (content.includes('../index.css')) {
  content = content.replace(/import ['"]\.\.\/index\.css['"]/g, "import './index.css'");
  fs.writeFileSync(mainPath, content, "utf8");
  console.log("[prebuild] Fixed main.tsx: ../index.css -> ./index.css");
} else {
  console.log("[prebuild] main.tsx CSS import is correct.");
}
