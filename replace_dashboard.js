const fs = require('fs');
const file = 'src/components/AdminScreens.tsx';
let code = fs.readFileSync(file, 'utf8');
let newJSX = fs.readFileSync('new_dashboard.jsx', 'utf8');

const startMarker = '  return (\n    <div className="space-y-8 pb-12 font-sans animate-fade-in">\n      {/* Header section */}';
const endMarker = '  );\n};\n\n// ==========================================\n// MODULE 2:';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1) {
  console.log("Start marker not found");
  process.exit(1);
}

if (endIdx === -1) {
  console.log("End marker not found");
  process.exit(1);
}

code = code.substring(0, startIdx) + newJSX + code.substring(endIdx);
fs.writeFileSync(file, code);
console.log("Successfully replaced AdminDashboard");
