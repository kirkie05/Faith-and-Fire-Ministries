import React, { useState } from "react";
import { Lock, HeartPulse, Calendar, Plus, X } from "lucide-react";

import { useChurch } from "../context/ChurchContext";

export const AdminCare: React.FC = () => {
  const { members, careCases, addCareCase, updateCareCaseStatus, updateCareCaseNotes, addCareVisit } = useChurch();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // New Note State
  const [newNote, setNewNote] = useState("");
  
  // New Case Modal State
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseMember, setNewCaseMember] = useState("");
  const [newCaseType, setNewCaseType] = useState("Hospitalization");
  const [newCasePastor, setNewCasePastor] = useState("Ps. David");
  const [newCaseNotes, setNewCaseNotes] = useState("");

  // New Visit Modal State
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState("");
  const [newVisitNotes, setNewVisitNotes] = useState("");

  const selectedCase = careCases.find(c => c.id === selectedCaseId);

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseMember.trim()) return;

    const memberId = members.find(m => `${m.firstName} ${m.lastName}` === newCaseMember)?.id || "Unknown";
    
    addCareCase(memberId, newCaseMember, newCaseType, newCasePastor, newCaseNotes);
    setShowNewCase(false);
    setNewCaseMember(""); setNewCaseNotes("");
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedCase) return;
    updateCareCaseStatus(selectedCase.id, status);
  };

  const handleSaveNote = () => {
    if (!selectedCase || !newNote.trim()) return;
    updateCareCaseNotes(selectedCase.id, newNote);
    setNewNote("");
  };

  const handleLogVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newVisitDate || !newVisitNotes.trim()) return;

    addCareVisit(selectedCase.id, {
      id: `v${Date.now()}`,
      date: new Date(newVisitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      pastor: selectedCase.pastor,
      notes: newVisitNotes
    });

    setShowNewVisit(false);
    setNewVisitDate(""); setNewVisitNotes("");
  };

  return (
    <div className="space-y-6 animate-fade-in relative">


      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Pastoral Care
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Manage sensitive care cases, counselling, bereavement, and pastoral visits.
          </p>
        </div>
        <button onClick={() => setShowNewCase(true)} className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider cursor-pointer">
          <HeartPulse className="w-4 h-4" /> Open New Case
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cases List */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden flex flex-col h-[600px]">
            {careCases.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                <HeartPulse className="w-12 h-12 mb-3 text-neutral-300" />
                <p>No active pastoral care cases.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 overflow-y-auto flex-1">
                {careCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${selectedCaseId === c.id ? 'bg-red-50 border-l-4 border-red-600' : 'hover:bg-neutral-50 border-l-4 border-transparent'}`}
                  >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{c.type}</span>
                  <span className="text-[9px] text-neutral-400 font-mono">{c.date}</span>
                </div>
                <h4 className="font-bold text-xs text-neutral-800">{c.member}</h4>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-neutral-500">Assigned: {c.pastor}</p>
                  {c.status === 'Resolved' && <span className="text-[9px] font-bold text-green-600 uppercase">Resolved</span>}
                </div>
              </div>
                ))}
              </div>
            )}
          </div>

        {/* Case Details & Visits */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 shadow-xs rounded-xl p-6 h-[600px] flex flex-col">
          {selectedCase ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-neutral-100 pb-4 mb-4 shrink-0 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-[#1e1548]">{selectedCase.member} - {selectedCase.type}</h2>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">Case ID: {selectedCase.id} • Opened: {selectedCase.fullDate}</p>
                </div>
                <select 
                  value={selectedCase.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  
                >
                  <option value="Active">Status: Active</option>
                  <option value="Pending">Status: Pending</option>
                  <option value="Follow-up Required">Status: Follow-up Required</option>
                  <option value="Resolved">Status: Resolved</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div>
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Confidential Notes</h4>
                  <div className="bg-orange-50/50 border border-orange-100 p-3 rounded text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {selectedCase.confidentialNotes}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase">Pastoral Visits Log</h4>
                    <button onClick={() => setShowNewVisit(true)} className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer">+ Log New Visit</button>
                  </div>
                  <div className="space-y-3">
                    {selectedCase.visits.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No visits logged yet.</p>
                    ) : (
                      selectedCase.visits.map(visit => (
                        <div key={visit.id} className="border border-neutral-100 p-3 rounded bg-neutral-50 flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-purple-700" />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span className="font-bold text-xs text-neutral-800">Visit by {visit.pastor}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">{visit.date}</span>
                            </div>
                            <p className="text-[10px] text-neutral-600 mt-1">{visit.notes}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100 shrink-0">
                <textarea 
                  rows={2} 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an update to confidential notes..." 
                  className="w-full mb-2"
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveNote} disabled={!newNote.trim()} className="btn-primary-sm">Save Update</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs font-bold uppercase">
              Select a case to view details
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {showNewCase && (
        <div className="fixed inset-0 bg-[#0A192F]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowNewCase(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5"/></button>
            <h3 className="font-bold text-[#1e1548] text-lg mb-4">Open New Pastoral Case</h3>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Member Name *</label>
                <input required list="members_list" type="text" value={newCaseMember} onChange={(e) => setNewCaseMember(e.target.value)} className="w-full" placeholder="Search member name..." />
                <datalist id="members_list">
                  {members.map(m => <option key={m.id} value={`${m.firstName} ${m.lastName}`} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Case Type</label>
                <select value={newCaseType} onChange={(e) => setNewCaseType(e.target.value)} className="w-full">
                  <option value="Hospitalization">Hospitalization</option>
                  <option value="Bereavement">Bereavement</option>
                  <option value="Marriage Counselling">Marriage Counselling</option>
                  <option value="General Counselling">General Counselling</option>
                  <option value="Financial Hardship">Financial Hardship</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Assigned Pastor/Worker</label>
                <input required list="pastors_list" type="text" value={newCasePastor} onChange={(e) => setNewCasePastor(e.target.value)} className="w-full" placeholder="Assign someone..." />
                <datalist id="pastors_list">
                  {members.map(m => <option key={m.id} value={`${m.firstName} ${m.lastName}`} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Initial Confidential Notes</label>
                <textarea value={newCaseNotes} onChange={(e) => setNewCaseNotes(e.target.value)} rows={3} className="w-full" />
              </div>
              <button type="submit" className="btn-primary-sm w-full">Open Case</button>
            </form>
          </div>
        </div>
      )}

      {/* Log Visit Modal */}
      {showNewVisit && selectedCase && (
        <div className="fixed inset-0 bg-[#0A192F]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowNewVisit(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5"/></button>
            <h3 className="font-bold text-[#1e1548] text-lg mb-4">Log Pastoral Visit for {selectedCase.member}</h3>
            <form onSubmit={handleLogVisit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Visit Date *</label>
                <input required type="date" value={newVisitDate} onChange={(e) => setNewVisitDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Visit Notes & Outcome *</label>
                <textarea required value={newVisitNotes} onChange={(e) => setNewVisitNotes(e.target.value)} rows={4} placeholder="Discussed..." className="w-full" />
              </div>
              <button type="submit" className="btn-primary-sm w-full">Save Visit Log</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
