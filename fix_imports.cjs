const fs = require('fs');
const file = 'src/components/AdminScreens.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('ArrowUpRight')) {
  code = code.replace(/import {([^}]*)Plus/g, 'import {$1Plus, ArrowUpRight, Target');
  fs.writeFileSync(file, code);
  console.log("Added missing lucide-react icons");
}
