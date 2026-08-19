import React, { useState } from "react";
import { Calendar, CheckCircle, Image, QrCode, Trash2 } from "lucide-react";
import { FileUploadInput } from "./FileUploadInput";
import { useChurch } from "../context/ChurchContext";

const AdminEvents: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useChurch();
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Sunday" | "Midweek" | "Revival" | "Special">("Sunday");
  const [date, setDate] = useState("");
  const [fullDate, setFullDate] = useState("");
  const [time, setTime] = useState("09:00 AM - 11:30 AM");
  const [venue, setVenue] = useState("Main Sanctuary, Rosettenville");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("90% Full");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCategory("Sunday");
    setDate("");
    setFullDate("");
    setTime("09:00 AM - 11:30 AM");
    setVenue("Main Sanctuary, Rosettenville");
    setDescription("");
    setCapacity("90% Full");
    setImage("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800");
    setEditingId(null);
  };

  const handleEditInit = (evt: any) => {
    setEditingId(evt.id);
    setTitle(evt.title);
    setCategory(evt.category);
    setDate(evt.date);
    setFullDate(evt.fullDate);
    setTime(evt.time);
    setVenue(evt.venue);
    setDescription(evt.description);
    setCapacity(evt.capacity || "95% Full");
    setImage(evt.image);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !fullDate) return;

    const eventData = {
      id: editingId || "e_" + Date.now(),
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      date,
      fullDate,
      time,
      venue,
      description,
      image,
      featured: true,
      capacity,
      rsvpCount: 0
    };

    if (editingId) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }

    setSuccess(true);
    resetForm();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Event list */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Public Events Calendar</h2>
            <p className="text-xs text-neutral-500">Edit schedule cards or remove outdated activities.</p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-[#0F2342] hover:bg-[#0A192F] text-white font-bold text-[10px] px-3 py-2 rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4" /> Scan Tickets
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {events.map((evt) => (
            <div key={evt.id} className="p-3 border border-neutral-100 rounded bg-neutral-50 flex justify-between items-center gap-4 text-xs">
              <div>
                <span className="bg-amber-500 text-[#0A192F] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {evt.category} | {evt.date}
                </span>
                <h4 className="font-bold text-neutral-800 text-xs mt-1">{evt.title}</h4>
                <p className="text-[10px] text-neutral-500">{evt.time} &bull; {evt.venue}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEditInit(evt)}
                  className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEvent(evt.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creation Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">
            {editingId ? "Update Event Diary" : "Schedule Event Node"}
          </h2>
          <p className="text-xs text-neutral-500">Inject or revise a diary node on the public calendars.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Night of Holy Fire"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full"
              >
                <option value="Sunday">Sunday Morning</option>
                <option value="Midweek">Midweek Service</option>
                <option value="Revival">Revival Night</option>
                <option value="Special">Special Conference</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Capacity Indicator</label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 85% Full"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Short Date (e.g. "12 Oct") *</label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="12 Oct"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Full Date (e.g. "October 12, 2026") *</label>
              <input
                type="text"
                required
                value={fullDate}
                onChange={(e) => setFullDate(e.target.value)}
                placeholder="October 12, 2026"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Time Range</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <FileUploadInput
                label="Cover Picture Asset (Upload Image File)"
                value={image}
                onChange={setImage}
                accept="image/*"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Campus Venue Name</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Detailed Event Agenda</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What to expect, what to bring..."
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              {editingId ? "Save Event Changes" : "Schedule Event Live"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-primary-sm"
              >
                Cancel
              </button>
            )}
          </div>
          {success && (
            <span className="text-green-700 text-center block font-bold animate-pulse">
              ✓ Event calendar changes applied successfully!
            </span>
          )}
        </form>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md relative">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2 text-[#0A192F] font-bold uppercase tracking-wider text-sm">
                <QrCode className="w-5 h-5 text-amber-500" /> Ticket Scanner
              </div>
              <button onClick={() => { setShowScanner(false); setScanResult(null); }} className="text-neutral-400 hover:text-[#0A192F]">
                &times;
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              {scanResult ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-[#0A192F] uppercase">{scanResult}</h3>
                  <p className="text-xs text-neutral-500">Ticket valid and attendee checked in successfully.</p>
                  <button
                    onClick={() => setScanResult(null)}
                    className="mt-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-4 py-2 rounded text-xs uppercase cursor-pointer"
                  >
                    Scan Another
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-48 h-48 mx-auto border-2 border-amber-400 border-dashed rounded-lg flex items-center justify-center bg-neutral-50 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=400')] bg-cover opacity-20 filter grayscale"></div>
                    <div className="w-full h-0.5 bg-amber-500 absolute top-1/2 left-0 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase relative z-10">Camera Active</span>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">Position the attendee's QR ticket inside the frame to scan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

