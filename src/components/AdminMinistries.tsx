import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useChurch } from "../context/ChurchContext";
import { FileUploadInput } from "./FileUploadInput";

export const AdminMinistries: React.FC = () => {
  const { ministries, addMinistry, updateMinistry, deleteMinistry } = useChurch();

  // Ministry form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Departments");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("Weekly");
  const [meetingTime, setMeetingTime] = useState("10:00 AM - 12:00 PM");
  const [location, setLocation] = useState("Youth Hall, Main Campus");
  const [leaderName, setLeaderName] = useState("");
  const [leaderTitle, setLeaderTitle] = useState("Leader");
  const [leaderPhoto, setLeaderPhoto] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400");
  const [leaderQuote, setLeaderQuote] = useState("");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setCategory("Departments");
    setDescription("");
    setSchedule("Weekly");
    setMeetingTime("10:00 AM - 12:00 PM");
    setLocation("Youth Hall, Main Campus");
    setLeaderName("");
    setLeaderTitle("Leader");
    setLeaderPhoto("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400");
    setLeaderQuote("");
    setImage("https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800");
    setEditingId(null);
  };

  const handleEditInit = (min: any) => {
    setEditingId(min.id);
    setName(min.name);
    setCategory(min.category);
    setDescription(min.description);
    setSchedule(min.schedule);
    setMeetingTime(min.meetingTime);
    setLocation(min.location);
    setLeaderName(min.leaderName);
    setLeaderTitle(min.leaderTitle);
    setLeaderPhoto(min.leaderPhoto);
    setLeaderQuote(min.leaderQuote);
    setImage(min.image);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const mData = {
      id: editingId || "min_" + Date.now(),
      name,
      slug,
      category,
      description,
      schedule,
      meetingTime,
      location,
      leaderName,
      leaderTitle,
      leaderPhoto,
      leaderQuote,
      image,
      active: true
    };

    if (editingId) {
      updateMinistry(mData);
    } else {
      addMinistry(mData);
    }

    setSuccess(true);
    resetForm();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Ministry list */}
      <div className="lg:col-span-7 bg-white p-6 rounded border border-neutral-200/60 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight uppercase">Active Ministries</h2>
          <p className="text-xs text-neutral-500">Edit, inspect, or retire active departments of the church sanctuary.</p>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {ministries.map((min) => (
            <div key={min.id} className="p-4 border border-neutral-100 rounded bg-neutral-50 flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <img src={min.image} alt={min.name} className="w-16 h-12 rounded object-cover border border-neutral-200/50 shrink-0" />
                <div>
                  <span className="bg-sky-50 text-[#0F2342] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                    {min.category}
                  </span>
                  <h4 className="font-bold text-neutral-800 text-xs mt-1">{min.name}</h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{min.description.substring(0, 50)}...</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleEditInit(min)}
                  className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMinistry(min.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                  title="Delete Ministry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {ministries.length === 0 && (
            <div className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded">
              No ministries found
            </div>
          )}
        </div>
      </div>

      {/* Creation & Edit Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded border border-neutral-200/60 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight uppercase">
            {editingId ? "Modify Department" : "Charter New Ministry"}
          </h2>
          <p className="text-xs text-neutral-500">Input official coordinates, cover graphics, and leader biographies.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Ministry Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Women of Fire"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full"
              >
                <option value="Departments">Departments</option>
                <option value="Small Groups">Small Groups</option>
                <option value="More">More</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Meeting Frequency</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full"
              >
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Meeting Time</label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="10:00 AM - 12:00 PM"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Meeting Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Youth Hall"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <FileUploadInput
              label="Cover Picture Asset (Upload Image File)"
              value={image}
              onChange={setImage}
              accept="image/*"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Full Mission Narrative *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the ministry's focus and goal..."
              className="w-full"
            />
          </div>

          {/* Department Leader info */}
          <div className="p-3 bg-purple-50/50 rounded border border-purple-100/50 space-y-3">
            <span className="block font-bold text-[#0F2342] uppercase text-[9px] tracking-wide">
              DEPARTMENT LEADERSHIP COORDINATORS
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">Leader Name</label>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="e.g. Sis. Ruth"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Leader Title</label>
                <input
                  type="text"
                  value={leaderTitle}
                  onChange={(e) => setLeaderTitle(e.target.value)}
                  placeholder="e.g. HOD / Coordinator"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <FileUploadInput
                  label="Leader Portrait Photo (Upload Image File)"
                  value={leaderPhoto}
                  onChange={setLeaderPhoto}
                  accept="image/*"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Leader Quote / Inspiration</label>
                <input
                  type="text"
                  value={leaderQuote}
                  onChange={(e) => setLeaderQuote(e.target.value)}
                  placeholder="e.g. Raising stars of faith."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              {editingId ? "Update Department" : "Publish Ministry"}
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
              ✓ Ministry details committed and updated live!
            </span>
          )}
        </form>
      </div>
    </div>
  );
};
