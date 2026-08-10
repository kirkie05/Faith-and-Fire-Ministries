import React, { useState } from "react";
import { QrCode, Plus, X, Calendar as CalendarIcon, MapPin, Clock, Image as ImageIcon, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useChurch } from "../context/ChurchContext";

export const AdminCalendarEvents: React.FC = () => {
  const { events, addEvent, updateEvent } = useChurch();
  const [activeTab, setActiveTab] = useState<"events" | "calendar">("events");
  
  // Event Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sunday");
  const [dates, setDates] = useState<string[]>([]);
  const [currentDateInput, setCurrentDateInput] = useState("");
  
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:30");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [bannerBase64, setBannerBase64] = useState("");
  
  // Ministers State
  const [ministers, setMinisters] = useState<{name: string, image: string}[]>([]);
  const [currentMinisterName, setCurrentMinisterName] = useState("");
  
  const [eventSuccess, setEventSuccess] = useState(false);
  const [selectedEventQR, setSelectedEventQR] = useState<string | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMinister = () => {
    if (currentMinisterName.trim()) {
      setMinisters([...ministers, { name: currentMinisterName.trim(), image: "" }]);
      setCurrentMinisterName("");
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

  const handleAddDate = () => {
    if (currentDateInput && !dates.includes(currentDateInput)) {
      setDates([...dates, currentDateInput].sort());
      setCurrentDateInput("");
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setDates(dates.filter(d => d !== dateToRemove));
  };

  const formatAMPM = (timeStr: string) => {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":");
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours < 10 ? '0' + hours : hours}:${m} ${ampm}`;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || dates.length === 0) return;
    
    const formattedTime = `${formatAMPM(startTime)} - ${formatAMPM(endTime)}`;
    
    // Create an event object for the first date to maintain backward compatibility,
    // but include the `dates` and `ministers` array for the upgraded UI.
    const primaryDate = dates[0];
    const primaryDateObj = new Date(primaryDate);

    addEvent({
      id: "evt_" + Date.now(),
      title: title.trim(),
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      category: category || "General",
      date: primaryDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fullDate: primaryDate,
      time: formattedTime,
      startTime: startTime,
      endTime: endTime,
      venue: venue || "Main Sanctuary",
      description: description.trim() || "Join us.",
      image: bannerBase64 || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
      archived: false,
      featured: false,
      rsvpCount: 0,
      dates: dates,
      ministers: ministers
    });
    
    setTitle(""); 
    setDates([]); 
    setDescription(""); 
    setBannerBase64(""); 
    setMinisters([]); 
    setVenue("");
    setEventSuccess(true);
    setTimeout(() => setEventSuccess(false), 3000);
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
            <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest mb-4">+ Create New Event</h2>
            <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
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
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Recurring Dates *</label>
                  <div className="flex gap-2 mb-2">
                    <input type="date" value={currentDateInput} onChange={(e) => setCurrentDateInput(e.target.value)} className="flex-1" />
                    <button type="button" onClick={handleAddDate} className="btn-primary">Add</button>
                  </div>
                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dates.map(d => (
                        <div key={d} className="bg-purple-50 border border-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                          {d} <button type="button" onClick={() => handleRemoveDate(d)}><X className="w-3 h-3 hover:text-red-500" /></button>
                        </div>
                      ))}
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
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBannerBase64)}  />
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="font-bold">Click to upload banner</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase">Guest Ministers</label>
                  <div className="flex gap-2 mb-2">
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
                              <div className="w-full h-full flex items-center justify-center text-neutral-400"><Users className="w-4 h-4" /></div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => handleUpdateMinisterImage(idx, b64))}  title="Upload Photo" />
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
                <button type="submit" disabled={dates.length === 0} className="btn-primary">Create Event + Auto QR</button>
                {eventSuccess && <span className="text-emerald-600 font-bold text-xs animate-pulse">✓ Event created with QR!</span>}
                {dates.length === 0 && <span className="text-red-500 font-bold text-[10px] uppercase">Please add at least one date</span>}
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.filter((ev) => !ev.archived).map((ev) => (
              <div key={ev.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${ev.category === "Sunday" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{ev.category}</span>
                    <h3 className="font-bold text-[#1e1548] text-sm mt-1">{ev.title}</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/> {ev.time} <span className="mx-1">•</span> <MapPin className="w-3 h-3"/> {ev.venue}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => setSelectedEventQR(selectedEventQR === ev.id ? null : ev.id)} className="text-[9px] font-bold bg-[#1e1548] text-white px-2 py-1 rounded flex items-center gap-1"><QrCode className="w-3 h-3" /> QR</button>
                    <button onClick={() => updateEvent({ ...ev, archived: true })} className="text-[9px] font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Archive</button>
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
