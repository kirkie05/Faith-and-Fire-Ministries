const fs = require('fs');
const file = 'src/components/PublicScreens.tsx';
let code = fs.readFileSync(file, 'utf8');

const getIdx = (str) => {
  const i = code.indexOf(str);
  if (i === -1) throw new Error("Could not find " + str);
  return i;
};

// Section strings
const s5_start = '      {/* =============================================\n          5. PROJECTS THREE';
const s7_start = '      {/* =============================================\n          7. RELIABLE ONE';
const s8_start = '      {/* =============================================\n          8. CONTACT ONE';
const s10_start = '      {/* =============================================\n          10. TEAM TWO';
const s11_start = '      {/* =============================================\n          11. BLOG THREE';
const end_marker = '    </div>\n  );\n};\nexport const AboutScreen';

const sec5 = code.substring(getIdx(s5_start), getIdx(s7_start));
const sec7 = code.substring(getIdx(s7_start), getIdx(s8_start));
const sec8_9 = code.substring(getIdx(s8_start), getIdx(s10_start));
const sec10 = code.substring(getIdx(s10_start), getIdx(s11_start));
const sec11 = code.substring(getIdx(s11_start), getIdx(end_marker));

// New order: 10, 5, 11, 7, 8_9
const newBlock = sec10 + sec5 + sec11 + sec7 + sec8_9;

// Replace in code
code = code.substring(0, getIdx(s5_start)) + newBlock + code.substring(getIdx(end_marker));

fs.writeFileSync(file, code);
console.log("Reordered successfully!");
