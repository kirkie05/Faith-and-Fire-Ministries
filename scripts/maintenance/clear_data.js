/**
 * ⚠️ DANGEROUS — MAINTENANCE SCRIPT ⚠️
 *
 * Rewrites src/data.ts, replacing the initialEvents / initialMinistries /
 * initialDonations / initialMembers / initialMessages / initialVideos arrays
 * with empty arrays.
 *
 * This script is NOT part of any build, deploy or test pipeline and must
 * NEVER run automatically. It requires an explicit `--yes` flag; any other
 * invocation exits without modifying source files.
 *
 * Usage: node scripts/maintenance/clear_data.js --yes
 */
const fs = require('fs');
const file = 'src/data.ts';

if (!process.argv.includes('--yes')) {
  console.error('ABORT: this script rewrites src/data.ts. Re-run with --yes to confirm.');
  process.exit(1);
}

let code = fs.readFileSync(file, 'utf8');

const toClear = [
  'initialEvents',
  'initialMinistries',
  'initialDonations',
  'initialMembers',
  'initialMessages',
  'initialVideos'
];

for (const name of toClear) {
  // Regex to match "export const name: Type[] = [ ... ];"
  // This will match everything from "export const name" up to the balancing bracket, but since it's hard with regex,
  // we'll just match to the end of the array by finding the opening bracket and its corresponding closing bracket.

  const regex = new RegExp(`export const ${name}: [a-zA-Z\\[\\]]+ = \\[[\\s\\S]*?\\n\\];`);
  code = code.replace(regex, (match) => {
    // Extract the type from the original
    const typeMatch = match.match(/export const \w+: (.*?) =/);
    if (typeMatch) {
      return `export const ${name}: ${typeMatch[1]} = [];`;
    }
    return match;
  });
}

fs.writeFileSync(file, code);