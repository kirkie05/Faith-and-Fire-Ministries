import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

export const AdminCellGroups: React.FC = () => {
  const { cellGroups, addCellGroup, updateCellGroup, deleteCellGroup } = useChurch();

  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [area, setArea] = useState("Johannesburg South");
  const [day, setDay] = useState("Wednesday");
  const [time, setTime] = useState("06:30 PM");
  const [venue, setVenue] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderTitle, setLeaderTitle] = useState("Cell Leader");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("15");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setSuburb("");
    setArea("Johannesburg South");
    setDay("Wednesday");
    setTime("06:30 PM");
    setVenue("");
    setLeaderName("");
    setLeaderTitle("Cell Leader");
    setLeaderPhone("");
    setDescription("");
    setCapacity("15");
    setEditingId(null);
  };

  const handleEditInit = (group: any) => {
    setEditingId(group.id);
    setName(group.name);
    setSuburb(group.suburb);
    setArea(group.area);
    setDay(group.day);
    setTime(group.time);
    setVenue(group.venue);
    setLeaderName(group.leaderName);
    setLeaderTitle(group.leaderTitle);
    setLeaderPhone(group.leaderPhone);
    setDescription(group.description);
    setCapacity(String(group.capacity || 15));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !suburb || !leaderName) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const groupData = {
      id: editingId || "cg_" + Date.now(),
      name,
      slug,
      suburb,
      area,
      day,
      time,
      venue,
      leaderName,
      leaderTitle,
      leaderPhone,
      description,
      capacity: parseInt(capacity) || 15,
      memberCount: editingId
        ? (cellGroups.find((g) => g.id === editingId)?.memberCount || 0)
        : 0,
      active: true
    };

    if (editingId) {
      updateCellGroup(groupData);
    } else {
      addCellGroup(groupData);
    }

    setSuccess(true);
    resetForm();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Cell group list */}
      <div className="lg:col-span-7 bg-white p-6 rounded border border-neutral-200/60 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight uppercase">Active Cell Groups</h2>
          <p className="text-xs text-neutral-500">Location-based fellowship groups members can join from their dashboard.</p>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {cellGroups.filter((g) => !g.archived).map((group) => (
            <div key={group.id} className="p-4 border border-neutral-100 rounded bg-neutral-50 flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <div className="w-16 h-12 rounded bg-gradient-to-br from-[#1e1548] to-[#150d36] flex items-center justify-center text-amber-400 font-black text-lg shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div>
                  <span className="bg-sky-50 text-[#0F2342] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                    {group.area} · {group.suburb}
                  </span>
                  <h4 className="font-bold text-neutral-800 text-xs mt-1">{group.name}</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {group.day} {group.time} · {group.venue} · Led by {group.leaderName}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                    {group.memberCount || 0}/{group.capacity || 15} members
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleEditInit(group)}
                  className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCellGroup(group.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                  title="Archive Cell Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {cellGroups.length === 0 && (
            <div className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded">
              No cell groups found — charter the first one on the right
            </div>
          )}
        </div>
      </div>

      {/* Creation & Edit Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded border border-neutral-200/60 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight uppercase">
            {editingId ? "Modify Cell Group" : "Charter New Cell Group"}
          </h2>
          <p className="text-xs text-neutral-500">Location, meeting details, and the leader hosting the fellowship.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Cell Group Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rosettenville Central Cell"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Suburb / Location *</label>
              <input
                type="text"
                required
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Rosettenville"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Johannesburg South"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Meeting Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Meeting Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="06:30 PM"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Sis. Thandi's Home"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the fellowship focus..."
              className="w-full"
            />
          </div>

          {/* Cell leader info */}
          <div className="p-3 bg-purple-50/50 rounded border border-purple-100/50 space-y-3">
            <span className="block font-bold text-[#0F2342] uppercase text-[9px] tracking-wide">
              CELL LEADERSHIP
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">Leader Name *</label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="e.g. Elder Eric Malaba"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Leader Title</label>
                <input
                  type="text"
                  value={leaderTitle}
                  onChange={(e) => setLeaderTitle(e.target.value)}
                  placeholder="e.g. Cell Leader"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Leader Phone</label>
              <input
                type="text"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                placeholder="e.g. +27 82 123 4567"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary-sm">
              {editingId ? "Update Cell Group" : "Publish Cell Group"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-primary-sm">
                Cancel
              </button>
            )}
          </div>
          {success && (
            <span className="text-green-700 text-center block font-bold animate-pulse">
              ✓ Cell group details committed and updated live!
            </span>
          )}
        </form>
      </div>
    </div>
  );
};