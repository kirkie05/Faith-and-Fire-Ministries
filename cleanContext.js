const fs = require('fs');
const file = './src/context/ChurchContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove imports
content = content.replace(/Announcement,\s*/g, '');
content = content.replace(/AuditLog,\s*/g, '');
content = content.replace(/initialAnnouncements,\s*/g, '');
content = content.replace(/initialAuditLogs,\s*/g, '');

// Remove interface properties
content = content.replace(/\s*announcements:\s*Announcement\[\];/g, '');
content = content.replace(/\s*setAnnouncements:\s*\(announcements:\s*Announcement\[\]\)\s*=>\s*void;/g, '');
content = content.replace(/\s*auditLogs:\s*AuditLog\[\];/g, '');
content = content.replace(/\s*setAuditLogs:\s*\(logs:\s*AuditLog\[\]\)\s*=>\s*void;/g, '');
content = content.replace(/\s*addAuditLog:\s*\(.*?=>\s*void;/g, '');
content = content.replace(/\s*addAnnouncement:\s*\(.*?=>\s*void;/g, '');
content = content.replace(/\s*updateAnnouncement:\s*\(.*?=>\s*void;/g, '');
content = content.replace(/\s*deleteAnnouncement:\s*\(.*?=>\s*void;/g, '');

// Remove states
content = content.replace(/\s*const \[announcements,\s*setAnnouncementsState\].*?;\s*}/gs, (match) => {
  if (match.includes('church_announcements')) return '';
  return match;
});

content = content.replace(/\s*const \[auditLogs,\s*setAuditLogsState\].*?;\s*}/gs, (match) => {
  if (match.includes('church_audit_logs')) return '';
  return match;
});

// Remove addAuditLog function definition
content = content.replace(/\s*const addAuditLog = \((.*?)\) => \{.*?\n  \};\n/gs, '');

// Remove all addAuditLog calls
content = content.replace(/\s*addAuditLog\(.*?\);/g, '');

// Remove announcement functions
content = content.replace(/\s*const setAnnouncements = \((.*?)\) => \{.*?\n  \};\n/gs, '');
content = content.replace(/\s*const setAuditLogs = \((.*?)\) => \{.*?\n  \};\n/gs, '');
content = content.replace(/\s*const addAnnouncement = \((.*?)\) => \{.*?\n  \};\n/gs, '');
content = content.replace(/\s*const updateAnnouncement = \((.*?)\) => \{.*?\n  \};\n/gs, '');
content = content.replace(/\s*const deleteAnnouncement = \((.*?)\) => \{.*?\n  \};\n/gs, '');

// Remove from value object
content = content.replace(/\s*announcements,/g, '');
content = content.replace(/\s*setAnnouncements,/g, '');
content = content.replace(/\s*auditLogs,/g, '');
content = content.replace(/\s*setAuditLogs,/g, '');
content = content.replace(/\s*addAuditLog,/g, '');
content = content.replace(/\s*addAnnouncement,/g, '');
content = content.replace(/\s*updateAnnouncement,/g, '');
content = content.replace(/\s*deleteAnnouncement,/g, '');

fs.writeFileSync(file, content);
console.log('Cleaned ChurchContext.tsx');
