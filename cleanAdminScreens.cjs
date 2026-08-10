const fs = require('fs');
const file = './src/components/AdminScreens.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove blurb state and input from AdminNextSteps
content = content.replace(/\s*const \[blurb,\s*setBlurb\]\s*=\s*useState\(min\?\.blurb\s*\|\|\s*""\);/g, '');
content = content.replace(/\s*blurb:\s*blurb\.trim\(\),/g, '');
content = content.replace(/<div>\s*<label[^>]*>Short Blurb[\s\S]*?<\/div>/g, '');
// Remove blurb from the component view list if any
content = content.replace(/<p className="text-\[10px\] text-neutral-500 mb-2 line-clamp-1">{min.blurb}<\/p>/g, '');


// 2. Remove Announcements logic from AdminCalendarEvents
content = content.replace(/\s*const { events, addEvent, updateEvent, announcements, addAnnouncement, deleteAnnouncement } = useChurch\(\);/g, '  const { events, addEvent, updateEvent } = useChurch();');
content = content.replace(/\s*const \[activeTab, setActiveTab\] = useState<"events" | "announcements" | "calendar">\("events"\);/g, '  const [activeTab, setActiveTab] = useState<"events" | "calendar">("events");');
content = content.replace(/\{ id: "announcements", label: "Announcements" \},\s*/g, '');

// Strip the Announcements tab content entirely
content = content.replace(/\{\/\* ==========================================\s*\*\/.*?\{\/\* ==========================================\s*\*\/.*?\{\/\* MODULE 8: CALENDAR VIEW/gs, '{/* ==========================================\n      {/* MODULE 8: CALENDAR VIEW');
content = content.replace(/\{activeTab === "announcements".*?\}.*?\{activeTab === "calendar"/gs, '{activeTab === "calendar"');

fs.writeFileSync(file, content);
console.log('Cleaned AdminScreens.tsx');
