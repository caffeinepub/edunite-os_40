/**
 * Prebuild guard: ensures main.tsx always imports "./index.css" (the real design tokens),
 * never "../index.css" (the empty root-level file).
 * This runs before every build and auto-corrects the import if it has drifted.
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainPath = join(__dirname, "src", "main.tsx");

let content = readFileSync(mainPath, "utf8");
const before = content;

content = content.replace(/import ['"]\.\.\/index\.css['"]/g, 'import "./index.css"');

if (content !== before) {
  writeFileSync(mainPath, content, "utf8");
  console.log("[fix-css-import] Corrected main.tsx: ../index.css -> ./index.css");
} else {
  console.log("[fix-css-import] CSS import OK.");
}
