const admin = require("firebase-admin");
admin.initializeApp({ projectId: "faithandfire-b0455" });
const db = admin.firestore();

const WEEKLY_SERVICES = [
  {
    title: "Sunday Glory Service",
    category: "Sunday",
    start: "09:00",
    end: "11:30",
    venue: "Main Sanctuary",
    description: "Our flagship spirit-filled Sunday celebration with worship, the Word and prayer ministry.",
    startDay: 0
  },
  {
    title: "Wednesday Prayer & Bible Study",
    category: "Midweek",
    start: "18:30",
    end: "20:00",
    venue: "Prayer Hall",
    description: "Midweek prayer and Word — intercession, praise and practical Bible teaching.",
    startDay: 3
  },
  {
    title: "Friday Youth Service",
    category: "Youth",
    start: "18:00",
    end: "20:00",
    venue: "Youth Centre",
    description: "High-energy youth service with worship, testimonies and life application.",
    startDay: 5
  }
];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const nextOccurrence = (startDay) => {
  const today = new Date();
  const diff = (startDay - today.getDay() + 7) % 7;
  return addDays(today, diff === 0 ? 7 : diff);
};

const formatAMPM = (timeStr) => {
  let [h, m] = timeStr.split(":");
  let hours = parseInt(h);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours < 10 ? "0" + hours : hours}:${m} ${ampm}`;
};

(async () => {
  for (const svc of WEEKLY_SERVICES) {
    const startDate = nextOccurrence(svc.startDay);
    const dates = [];
    for (let i = 0; i < 12; i++) dates.push(toISODate(addDays(startDate, i * 7)));
    const endDate = toISODate(addDays(startDate, 77));
    const primary = new Date(startDate);
    const payload = {
      title: svc.title,
      slug: svc.title.toLowerCase().replace(/\s+/g, "-"),
      category: svc.category,
      date: primary.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fullDate: toISODate(startDate),
      time: `${formatAMPM(svc.start)} - ${formatAMPM(svc.end)}`,
      startTime: svc.start,
      endTime: svc.end,
      venue: svc.venue,
      description: svc.description,
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
      archived: false,
      featured: false,
      dates,
      isDateRange: false,
      endDate,
      repeat: "weekly",
      ministers: [],
      createdBy: "seed",
      updatedBy: "seed",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection("events").add(payload);
    console.log("Seeded:", ref.id, "-", svc.title, "from", toISODate(startDate), "to", endDate);
  }
  console.log("DONE");
  process.exit(0);
})().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});