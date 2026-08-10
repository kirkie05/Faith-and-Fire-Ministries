import React, { useState } from "react";
import { GraduationCap, Edit, Check, X, UserPlus, Users, Award } from "lucide-react";

interface ClassSession {
  id: string;
  date: string;
  title: string;
  time: string;
  location: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  sessionsAttended: number[]; // Array of session indices (1-based)
  status: "On Track" | "At Risk" | "Graduated";
}

interface ChurchClass {
  id: string;
  name: string;
  instructor: string;
  totalSessions: number;
  sessions: ClassSession[];
  participants: Participant[];
}

const INITIAL_CLASSES: ChurchClass[] = [
  {
    id: "c1",
    name: "Foundation 101",
    instructor: "Pastor David",
    totalSessions: 6,
    sessions: [
      { id: "s1", date: "Nov 12", title: "Session 5: Serving Others", time: "Tuesday, 18:30", location: "Main Hall" },
      { id: "s2", date: "Nov 19", title: "Session 6: Church Vision", time: "Tuesday, 18:30", location: "Main Hall" }
    ],
    participants: [
      { id: "p1", name: "John Doe", email: "john@example.com", sessionsAttended: [1, 2, 3, 4], status: "On Track" },
      { id: "p2", name: "Sarah M", email: "sarah@example.com", sessionsAttended: [1, 2], status: "At Risk" },
      { id: "p3", name: "Mike T", email: "mike@example.com", sessionsAttended: [1, 2, 3, 4, 5], status: "On Track" }
    ]
  },
  {
    id: "c2",
    name: "Baptism Class",
    instructor: "Pastor Mike",
    totalSessions: 4,
    sessions: [],
    participants: []
  }
];

export const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<ChurchClass[]>(INITIAL_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string>("c1");
  
  // Edit Class State
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstructor, setEditInstructor] = useState("");
  const [editTotalSessions, setEditTotalSessions] = useState(6);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleEditInit = () => {
    if (!selectedClass) return;
    setEditName(selectedClass.name);
    setEditInstructor(selectedClass.instructor);
    setEditTotalSessions(selectedClass.totalSessions);
    setIsEditingClass(true);
  };

  const handleSaveClass = () => {
    if (!selectedClass) return;
    setClasses(classes.map(c => c.id === selectedClass.id ? {
      ...c,
      name: editName,
      instructor: editInstructor,
      totalSessions: editTotalSessions
    } : c));
    setIsEditingClass(false);
  };

  const handleToggleAttendance = (participantId: string, sessionIndex: number) => {
    if (!selectedClass) return;
    
    const updatedParticipants = selectedClass.participants.map(p => {
      if (p.id === participantId) {
        const attended = p.sessionsAttended.includes(sessionIndex);
        let newAttended = [...p.sessionsAttended];
        if (attended) {
          newAttended = newAttended.filter(s => s !== sessionIndex);
        } else {
          newAttended.push(sessionIndex);
        }
        
        // Auto-update status
        const isAtRisk = newAttended.length < (sessionIndex - 1); // Simple logic
        const status: "On Track" | "At Risk" | "Graduated" = isAtRisk ? "At Risk" : "On Track";
        
        return {
          ...p,
          sessionsAttended: newAttended,
          status
        };
      }
      return p;
    });

    setClasses(classes.map(c => c.id === selectedClass.id ? {
      ...c,
      participants: updatedParticipants
    } : c));
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (!selectedClass) return;
    if (confirm("Are you sure you want to remove this participant?")) {
      setClasses(classes.map(c => c.id === selectedClass.id ? {
        ...c,
        participants: c.participants.filter(p => p.id !== participantId)
      } : c));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Membership Classes
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Manage class sessions, track participant attendance, and issue certificates.
          </p>
        </div>
        <button className="btn-primary-sm">
          <GraduationCap className="w-4 h-4" /> Create Class
        </button>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 overflow-x-auto hide-scrollbar pb-px">
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClassId(c.id)}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              selectedClassId === c.id 
                ? "border-amber-500 text-amber-500 bg-orange-50/50" 
                : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-[#0A192F]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Class Details & Attendance */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Class Settings Editor */}
            {isEditingClass ? (
              <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-5 relative">
                <h3 className="font-bold text-[#0F2342] uppercase text-xs mb-4">Edit Class Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-500 font-bold uppercase mb-1">Class Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-neutral-500 font-bold uppercase mb-1">Instructor Name</label>
                    <input type="text" value={editInstructor} onChange={(e) => setEditInstructor(e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-neutral-500 font-bold uppercase mb-1">Total Sessions</label>
                    <input type="number" min="1" value={editTotalSessions} onChange={(e) => setEditTotalSessions(parseInt(e.target.value))} className="w-full" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <button onClick={() => setIsEditingClass(false)} className="text-[10px] font-bold text-neutral-500 hover:bg-neutral-100 px-4 py-2 rounded uppercase cursor-pointer">Cancel</button>
                  <button onClick={handleSaveClass} className="btn-primary-sm"><Check className="w-3 h-3"/> Save Details</button>
                </div>
              </div>
            ) : null}

            <div className="bg-white border border-neutral-200 shadow-xs rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                <div>
                  <h2 className="text-sm font-bold text-[#0A192F] uppercase flex items-center gap-2">
                    {selectedClass.name} - Current Cohort
                    <button onClick={handleEditInit} className="text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer" title="Edit Class Settings"><Edit className="w-3.5 h-3.5"/></button>
                  </h2>
                  <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Instructor: {selectedClass.instructor} | {selectedClass.totalSessions} Sessions</p>
                </div>
                <button className="btn-primary-sm"><UserPlus className="w-3.5 h-3.5"/> Add Participant</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="p-3 font-bold text-neutral-500 uppercase tracking-wider">Participant Name</th>
                      <th className="p-3 font-bold text-neutral-500 uppercase text-center tracking-wider">Sessions Attended</th>
                      <th className="p-3 font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="p-3 font-bold text-neutral-500 uppercase text-right tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedClass.participants.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-[#0A192F]">{p.name}</span>
                          <span className="block text-[9px] text-neutral-400 font-mono font-normal mt-0.5">{p.email}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            {Array.from({length: selectedClass.totalSessions}).map((_, i) => {
                              const sessionNum = i + 1;
                              const isAttended = p.sessionsAttended.includes(sessionNum);
                              return (
                                <button 
                                  key={sessionNum}
                                  onClick={() => handleToggleAttendance(p.id, sessionNum)}
                                  className={`w-4 h-4 rounded-sm border cursor-pointer transition-colors flex items-center justify-center ${isAttended ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-neutral-100 border-neutral-300 hover:border-amber-400'}`}
                                  title={`Toggle Session ${sessionNum}`}
                                >
                                  {isAttended && <Check className="w-3 h-3"/>}
                                </button>
                              )
                            })}
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 block mt-1.5 font-bold">{p.sessionsAttended.length}/{selectedClass.totalSessions} Completed</span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-widest border ${
                            p.status === 'At Risk' ? 'bg-red-50 text-red-700 border-red-200' :
                            p.status === 'Graduated' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleRemoveParticipant(p.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer" title="Remove Participant"><X className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {selectedClass.participants.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-neutral-400 font-bold uppercase text-xs tracking-widest border-t border-dashed border-neutral-200">
                          No participants enrolled yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sessions & Completion */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
              <h2 className="text-sm font-bold text-[#0A192F] uppercase border-b border-neutral-100 pb-2 mb-4 flex justify-between items-center">
                <span>Upcoming Sessions</span>
                <button className="btn-primary-sm">Manage</button>
              </h2>
              <div className="space-y-4">
                {selectedClass.sessions.length > 0 ? selectedClass.sessions.map(s => (
                  <div key={s.id} className="flex gap-3 items-start group">
                    <div className="bg-neutral-100 text-center rounded p-2 min-w-[50px] shrink-0 border border-neutral-200/60 group-hover:border-amber-200 transition-colors">
                      <span className="block text-[9px] text-neutral-500 font-bold uppercase">{s.date.split(' ')[0]}</span>
                      <span className="block text-lg font-black text-[#0F2342] leading-tight">{s.date.split(' ')[1]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-neutral-800 uppercase leading-tight">{s.title}</h4>
                      <p className="text-[10px] text-neutral-500 mt-1 font-mono bg-neutral-50 inline-block px-1 rounded">{s.time}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{s.location}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-neutral-400 italic">No upcoming sessions scheduled.</p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900 to-[#1e1548] border border-[#17325B] shadow-md rounded-xl p-6 text-white relative overflow-hidden">
              <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10" />
              <h2 className="text-sm font-bold text-amber-300 uppercase mb-2 tracking-widest relative z-10">Graduation Readiness</h2>
              <p className="text-[10px] text-purple-200 mb-5 leading-relaxed relative z-10 font-medium">
                {selectedClass.participants.filter(p => p.sessionsAttended.length >= selectedClass.totalSessions * 0.8).length} participants are eligible to receive their completion certificate and be officially welcomed as Members.
              </p>
              <button className="btn-primary-sm w-full">
                Generate Certificates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
