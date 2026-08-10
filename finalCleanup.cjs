const fs = require('fs');

// 1. Fix AdminScreens.tsx
let adminScreens = fs.readFileSync('src/components/AdminScreens.tsx', 'utf8');

// Remove AdminSettings component completely
adminScreens = adminScreens.replace(/\/\/ ==========================================\n\/\/ MODULE 2: SETTINGS & PREFERENCES\n\/\/ ==========================================\nconst AdminSettings: React.FC[\s\S]*?(?=\/\/ ==========================================\n\/\/ MODULE 3: MEMBERS DATABASE\n\/\/ ==========================================)/, '');

// Remove {activeTab === "settings" && <AdminSettings />} and {activeTab === "audit" && <AdminAuditLog />}
adminScreens = adminScreens.replace(/\{activeSubMenu === "settings" && <AdminSettings \/>\}/g, '');
adminScreens = adminScreens.replace(/\{activeTab === "settings" && <AdminSettings \/>\}/g, '');
adminScreens = adminScreens.replace(/\{activeTab === "audit" && <AdminAuditLog \/>\}/g, '');

// Remove announcements from AdminCalendarEvents
adminScreens = adminScreens.replace(/<div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">[\s\S]*?No announcements yet\.<\/div>\n\s*\}[\s\S]*?<\/div>\n\s*<\/div>/g, '');

// Save AdminScreens
fs.writeFileSync('src/components/AdminScreens.tsx', adminScreens);

// 2. Fix PublicScreens.tsx
let publicScreens = fs.readFileSync('src/components/PublicScreens.tsx', 'utf8');

// Remove announcements from destructuring
publicScreens = publicScreens.replace(/,\s*announcements/g, '');
publicScreens = publicScreens.replace(/announcements,\s*/g, '');

// Remove announcements sections
publicScreens = publicScreens.replace(/\{announcements && announcements\.length > 0 && \([\s\S]*?\)\}/g, '');

// Remove <br />& Announcements
publicScreens = publicScreens.replace(/See Latest Events<br \/>& Announcements/g, 'See Latest Events');

// Save PublicScreens
fs.writeFileSync('src/components/PublicScreens.tsx', publicScreens);

// 3. Fix ChurchContext.tsx
let context = fs.readFileSync('src/context/ChurchContext.tsx', 'utf8');

// Remove onSnapshot for announcements and auditLogs
context = context.replace(/const annSnap = await getDoc\(doc\(db, "settings", "announcements"\)\);[\s\S]*?batch\.set\(doc\(db, "settings", "announcements"\), \{ list: initialAnnouncements \}\);/g, '');
context = context.replace(/onSnapshot\(doc\(db, "settings", "announcements"\)[\s\S]*?setAnnouncementsState\(snap\.data\(\)\?\.list\);[\s\S]*?\};/g, '');
context = context.replace(/onSnapshot\(doc\(db, "settings", "auditLogs"\)[\s\S]*?setAuditLogsState\(snap\.data\(\)\?\.list\);[\s\S]*?\};/g, '');

// Save ChurchContext
fs.writeFileSync('src/context/ChurchContext.tsx', context);

// 4. Fix types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/\s*announcements:\s*GroupAnnouncement\[\];/g, '');
fs.writeFileSync('src/types.ts', types);

// 5. Fix AuthModal.tsx
let authModal = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');
authModal = authModal.replace(/and receive announcements\./g, '.');
fs.writeFileSync('src/components/AuthModal.tsx', authModal);

console.log('Cleanup script completed successfully.');
