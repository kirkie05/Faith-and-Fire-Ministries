const fs = require('fs');
const file = 'src/components/AdminScreens.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Upgrade cards
code = code.replace(/className="([^"]*)bg-white p-[0-9]+ rounded border border-neutral-200\/60 shadow-xs([^"]*)"/g, 'className="$1bg-white p-6 rounded-3xl shadow-sm border border-neutral-100$2"');
code = code.replace(/className="([^"]*)bg-white p-[0-9]+ rounded-xl border border-neutral-200\/60 shadow-xs([^"]*)"/g, 'className="$1bg-white p-6 rounded-3xl shadow-sm border border-neutral-100$2"');

// 2. Upgrade headers (H1)
code = code.replace(/<h1 className="text-xl font-bold text-(?:neutral-900|#1e1548) tracking-tight uppercase">/g, '<h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">');
code = code.replace(/<h2 className="text-lg font-bold text-neutral-900 tracking-tight uppercase">/g, '<h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">');

// 3. Upgrade subtitles (P immediately after H1)
code = code.replace(/(<h1 className="text-3xl font-extrabold text-\[#1e1548\] tracking-tight">.*?<\/h1>\s*)<p className="text-xs text-neutral-500">/g, '$1<p className="text-sm text-neutral-500 font-medium mt-1">');

// 4. Upgrade main wrapper to include font-sans and animate-fade-in (if it has space-y-6 or space-y-8 at the root)
// We'll just append font-sans animate-fade-in to standard root wrappers, but actually it's easier to just ensure global font-sans on the main container. AdminPortal already wraps it.

// 5. Enhance specific gradient headers from the Module wrappers
code = code.replace(/rounded-2xl bg-gradient-to-r from-([a-z]+)-900 to-\[#1e1548\] p-7 text-white shadow-lg/g, 'rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100');
code = code.replace(/<h1 className="mt-2 text-2xl font-black">/g, '<h1 className="mt-2 text-3xl font-extrabold tracking-tight">');

fs.writeFileSync(file, code);
console.log("Applied design system globally.");
