// Prebuild guard: ensures main.tsx always imports ./index.css (not ../index.css)
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.tsx');
let content = fs.readFileSync(mainPath, 'utf8');

const fixed = content.replace(
  /import\s+['"]\.\.\/index\.css['"]\s*;/g,
  'import "./index.css";'
);

if (fixed !== content) {
  fs.writeFileSync(mainPath, fixed);
  console.log('[prebuild] Fixed: main.tsx CSS import corrected to ./index.css');
} else {
  console.log('[prebuild] CSS import OK: ./index.css');
}
