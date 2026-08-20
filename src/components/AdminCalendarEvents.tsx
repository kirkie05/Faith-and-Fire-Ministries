import React, { useState } from "react";
import { QrCode, Plus, X, Calendar as CalendarIcon, MapPin, Clock, Image as ImageIcon, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useChurch } from "../context/ChurchContext";

export const AdminCalendarEvents: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useChurch();
  const [activeTab, setActiveTab] = useState<"events" | "calendar">("events");
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Event Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sunday");
  const [isDateRange, setIsDateRange] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:30");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [bannerBase64, setBannerBase64] = useState("");
  
  // Ministers State
  const [ministers, setMinisters] = useState<{name: string, image: string}[]>([]);
  const [currentMinisterName, setCurrentMinisterName] = useState("");
  const [currentMinisterImage, setCurrentMinisterImage] = useState("");
  
  const [eventSuccess, setEventSuccess] = useState(false);
  const [selectedEventQR, setSelectedEventQR] = useState<string | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setter(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMinister = () => {
    if (currentMinisterName.trim()) {
      setMinisters([...ministers, { name: currentMinisterName.trim(), image: currentMinisterImage }]);
      setCurrentMinisterName("");
      setCurrentMinisterImage("");
    }
  };

  const handleUpdateMinisterImage = (index: number, imageBase64: string) => {
    const updated = [...ministers];
    updated[index].image = imageBase64;
    setMinisters(updated);
  };

  const handleRemoveMinister = (index: number) => {
    setMinisters(ministers.filter((_, i) => i !== index));
  };

  // Date generation for range
  const generateDateRange = (start: string, end: string) => {
    const dates = [];
    let curr = new Date(start);
    const endNode = new Date(end);
    while (curr <= endNode) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  // Weekly services become constant repeating events: the same weekday is
  // generated every 7 days from the start date (default: 12 weeks ahead).
  const generateWeeklyDates = (start: string, end?: string) => {
    const dates = [];
    const maxEnd = end || new Date(new Date(start).getTime() + 84 * 86400000).toISOString().split("T")[0];
    let curr = new Date(start);
    const endNode = new Date(maxEnd);
    while (curr <= endNode) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 7);
    }
    return dates;
  };

  const formatAMPM = (timeStr: string) => {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":");
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours < 10 ? '0' + hours : hours}:${m} ${ampm}`;
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Sunday");
    setIsDateRange(false);
    setRepeat("none");
    setStartDate("");
    setEndDate("");
    setStartTime("09:00");
    setEndTime("11:30");
    setVenue("");
    setDescription("");
    setBannerBase64("");
    setMinisters([]);
    setCurrentMinisterName("");
    setCurrentMinisterImage("");
    setEditingEventId(null);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    if (isDateRange && !endDate) return;
    if (repeat === "weekly" && !endDate) return;
    
    const formattedTime = `${formatAMPM(startTime)} - ${formatAMPM(endTime)}`;
    
    const primaryDateObj = new Date(startDate);
    const isWeekly = repeat === "weekly";
    const generatedDates = isWeekly
      ? generateWeeklyDates(startDate, endDate)
      : isDateRange ? generateDateRange(startDate, endDate) : [startDate];

    const eventPayload = {
      title: title.trim(),
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      category: category || "General",
      date: primaryDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fullDate: startDate,
      time: formattedTime,
      startTime: startTime,
      endTime: endTime,
      venue: venue || "Main Sanctuary",
      description: description.trim() || "Join us.",
      image: bannerBase64 || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
      archived: false,
      featured: false,
      dates: generatedDates,
      isDateRange: isWeekly ? false : isDateRange,
      endDate: isWeekly || isDateRange ? endDate : undefined,
      repeat: isWeekly ? "weekly" : "none",
      ministers: ministers
    };

    if (editingEventId) {
      const existing = events.find(ev => ev.id === editingEventId);
      updateEvent({
        ...existing,
        ...eventPayload,
        id: editingEventId
      } as any);
    } else {
      addEvent({
        ...eventPayload,
        id: "evt_" + Date.now(),
        rsvpCount: 0
      } as any);
    }
    
    resetForm();
    setEventSuccess(true);
    setTimeout(() => setEventSuccess(false), 3000);
  };

  const handleEditClick = (ev: any) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || "");
    setCategory(ev.category || "General");
    setIsDateRange(ev.isDateRange || false);
    setRepeat(ev.repeat === "weekly" ? "weekly" : "none");
    setStartDate(ev.fullDate || "");
    setEndDate(ev.endDate || "");
    setStartTime(ev.startTime || "09:00");
    setEndTime(ev.endTime || "11:30");
    setVenue(ev.venue || "");
    setDescription(ev.description || "");
    setBannerBase64(ev.image || "");
    setMinisters(ev.ministers || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // CALENDAR LOGIC
  // -------------------------------------------------------------
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  // Padding for start of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Extract all occurrences of events
  const allOccurrences: {date: Date, event: any}[] = [];
  events.filter(e => !e.archived).forEach(ev => {
    if (ev.dates && ev.dates.length > 0) {
      ev.dates.forEach(d => {
        allOccurrences.push({ date: new Date(d), event: ev });
      });
    } else if (ev.fullDate) {
      allOccurrences.push({ date: new Date(ev.fullDate), event: ev });
    }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#1e1548] to-purple-900 p-7 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Church Operations</p>
        <h1 className="mt-2 text-2xl font-black">Calendar & Events</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">Manage recurring events, announcements and the visual church calendar. Every event auto-generates a shareable QR code.</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        <button onClick={() => setActiveTab("events")} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "events" ? "border-[#1e1548] text-[#1e1548]" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>Events Manager</button>
        <button onClick={() => setActiveTab("calendar")} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "calendar" ? "border-[#1e1548] text-[#1e1548]" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>Visual Calendar</button>
      </div>

      {activeTab === "events" && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest">{editingEventId ? "Edit Event" : "+ Create New Event"}</h2>
              {editingEventId && <button type="button" onClick={resetForm} className="text-xs font-bold text-neutral-500 hover:text-neutral-700 underline">Cancel Edit</button>}
            </div>
            <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Event Details */}
              <div className="space-y-4 border-r border-neutral-100 pr-0 md:pr-6">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Event Title *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holy Spirit Conference 2026" className="w-full" />
                </div>
                
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
                    <option value="Sunday">Sunday</option>
                    <option value="Midweek">Midweek</option>
                    <option value="Revival">Revival</option>
                    <option value="Special">Special</option>
                    <option value="Conference">Conference</option>
                    <option value="Youth">Youth</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Date Selection *</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={!isDateRange && repeat !== "weekly"} onChange={() => { setIsDateRange(false); setRepeat("none"); }} className="accent-[#1e1548]" />
                      <span>Single Date</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={isDateRange} onChange={() => { setIsDateRange(true); setRepeat("none"); }} className="accent-[#1e1548]" />
                      <span>Date Range</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={repeat === "weekly"} onChange={() => { setIsDateRange(false); setRepeat("weekly"); }} className="accent-[#1e1548]" />
                      <span>Repeats Weekly</span>
                    </label>
                  </div>
                  {repeat === "weekly" && (
                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-2">
                      Weekly service — becomes a constant repeating event for member check-in
                    </p>
                  )}
                  
                  {repeat === "weekly" ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-500 mb-1">Start Date</label>
                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-500 mb-1">End Date</label>
                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                      </div>
                    </div>
                  ) : !isDateRange ? (
                    <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-500 mb-1">Start Date</label>
                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-500 mb-1">End Date</label>
                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Time (Start - End)</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
                    <span className="text-neutral-400 font-bold">-</span>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Venue</label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Main Sanctuary" className="w-full" />
                </div>
              </div>

              {/* Media & Ministers */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Event Banner Image</label>
                  {bannerBase64 ? (
                    <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-neutral-200">
                      <img src={bannerBase64} alt="Banner" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setBannerBase64("")} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase text-[10px] tracking-widest"><X className="w-4 h-4 mr-1"/> Remove</button>
                    </div>
                  ) : (
                    <div className="w-full border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-neutral-400 relative hover:border-purple-300 transition-colors bg-neutral-50">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBannerBase64)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="font-bold">Click to upload banner</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Guest Ministers</label>
                  <div className="flex gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden relative shrink-0">
                      {currentMinisterImage ? (
                        <img src={currentMinisterImage} alt="Minister" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-white"><Users className="w-4 h-4" /></div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setCurrentMinisterImage)} title="Upload Photo" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    </div>
                    <input type="text" value={currentMinisterName} onChange={(e) => setCurrentMinisterName(e.target.value)} placeholder="e.g. Pastor John Doe" className="flex-1" />
                    <button type="button" onClick={handleAddMinister} className="btn-primary">Add</button>
                  </div>
                  
                  {ministers.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {ministers.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 border border-neutral-100 rounded-lg bg-neutral-50">
                          <div className="w-10 h-10 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden relative shrink-0">
                            {m.image ? (
                              <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-white"><Users className="w-4 h-4" /></div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => handleUpdateMinisterImage(idx, b64))} title="Change Photo" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          </div>
                          <span className="font-bold text-neutral-700 flex-1">{m.name}</span>
                          <button type="button" onClick={() => handleRemoveMinister(idx)} className="p-2 text-neutral-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Description</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-4 mt-2 border-t border-neutral-100 pt-6">
                {eventSuccess && <span className="text-emerald-600 font-bold text-xs animate-pulse">✓ Event saved successfully!</span>}
                <button type="submit" className="bg-[#1e1548] text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-purple-900 transition-colors">
                  {editingEventId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.filter((ev) => !ev.archived).map((ev) => (
              <div key={ev.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${ev.category === "Sunday" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{ev.category}</span>
                      {ev.repeat === "weekly" && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Repeats Weekly</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#1e1548] text-sm mt-1">{ev.title}</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/> {ev.time} <span className="mx-1">•</span> <MapPin className="w-3 h-3"/> {ev.venue}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => handleEditClick(ev)} className="text-[9px] font-bold text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={() => setSelectedEventQR(selectedEventQR === ev.id ? null : ev.id)} className="text-[9px] font-bold bg-[#1e1548] text-white px-2 py-1 rounded flex items-center gap-1"><QrCode className="w-3 h-3" /> QR</button>
                    <button onClick={() => deleteEvent(ev.id)} className="text-[9px] font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                  </div>
                </div>
                
                {ev.dates && ev.dates.length > 0 ? (
                   <div className="flex flex-wrap gap-1 mt-2">
                     {ev.dates.map(d => <span key={d} className="text-[9px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">{d}</span>)}
                   </div>
                ) : (
                  <div className="mt-2 text-[9px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200 self-start">{ev.date}</div>
                )}
                
                {ev.ministers && ev.ministers.length > 0 && (
                  <div className="flex -space-x-2 mt-3 pt-3 border-t border-neutral-50">
                    {ev.ministers.map((m, i) => (
                      m.image ? 
                      <img key={i} src={m.image} alt={m.name} title={m.name} className="w-8 h-8 rounded-full border-2 border-white object-cover bg-neutral-200" /> :
                      <div key={i} title={m.name} className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700 uppercase">{m.name.substring(0,2)}</div>
                    ))}
                  </div>
                )}

                {selectedEventQR === ev.id && (
                  <div className="border-t border-neutral-100 pt-3 mt-3 flex flex-col items-center gap-2 bg-neutral-50 rounded-lg p-4">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Event QR Code</p>
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-neutral-200">
                      <QRCodeSVG value={`${window.location.origin}/?event=${ev.id}`} size={140} bgColor="#ffffff" fgColor="#1e1548" level="H" />
                    </div>
                    <p className="text-[9px] text-neutral-400 font-mono">{`${window.location.origin}/?event=${ev.id}`}</p>
                  </div>
                )}
              </div>
            ))}
            {events.filter((ev) => !ev.archived).length === 0 && <div className="col-span-2 border border-dashed border-neutral-300 rounded-xl p-8 text-center text-neutral-500 text-sm">No events yet. Create one above.</div>}
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-[#1e1548] text-xl uppercase tracking-widest">{monthNames[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="btn-primary-sm">Prev</button>
              <button onClick={nextMonth} className="btn-primary-sm">Next</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="bg-neutral-50 p-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">{d}</div>
            ))}
            
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="bg-white min-h-[100px] p-2"></div>;
              
              const isToday = new Date().toDateString() === date.toDateString();
              const dayEvents = allOccurrences.filter(occ => occ.date.toDateString() === date.toDateString());
              
              return (
                <div key={i} className={`bg-white min-h-[120px] p-2 border-t border-transparent hover:bg-neutral-50 transition-colors flex flex-col group`}>
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-purple-600 text-white" : "text-neutral-700"}`}>
                    {date.getDate()}
                  </span>
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayEvents.map((evt, idx) => (
                      <div key={idx} className={`text-[9px] p-1.5 rounded truncate font-bold ${evt.event.category === 'Sunday' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`} title={evt.event.title}>
                        {evt.event.startTime || evt.event.time?.split("-")[0]} {evt.event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
