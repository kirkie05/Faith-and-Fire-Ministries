import React, { useState, useEffect, useCallback } from "react";
import { ListTodo, CheckCircle, Clock, AlertTriangle, MessageCircle, Send, X, Users } from "lucide-react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  notes: string;
}

interface FirstTimerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  note?: string;
}

const TASK_STATUSES = ["Pending", "In Progress", "Completed"];

export const AdminTasks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tasks" | "pipeline">("tasks");
  const [filter, setFilter] = useState("All Tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstTimers, setFirstTimers] = useState<FirstTimerRecord[]>([]);
  const [whatsappTemplate, setWhatsappTemplate] = useState("Shalom [Name], it was wonderful having you at Faith & Fire this Sunday! We'd love to connect. How was your experience?");

  // New Task State
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "tasks"));
      const fetched = snap.docs
        .map((record) => ({ id: record.id, ...record.data() } as Task))
        .filter((t) => !(t as any).archived);
      fetched.sort((a, b) => (a.status === "Completed" ? 1 : 0) - (b.status === "Completed" ? 1 : 0));
      setTasks(fetched);
    } catch (e) {
      console.warn("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "firstTimers"), (snap) => {
      setFirstTimers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirstTimerRecord)));
    }, (err) => console.warn("firstTimers listener failed:", err));
    return unsub;
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "All Tasks") return true;
    return t.status === filter;
  });

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim() || !newTaskAssignee.trim() || !newTaskDue) return;
    const id = "task_" + Date.now();
    try {
      await setDoc(doc(db, "tasks", id), {
        id,
        title: newTaskDesc.trim(),
        name: newTaskDesc.trim(),
        description: newTaskDesc.trim(),
        assignedTo: newTaskAssignee.trim(),
        dueDate: newTaskDue,
        status: "Pending",
        notes: "",
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowNewTask(false);
      setNewTaskDesc(""); setNewTaskAssignee(""); setNewTaskDue("");
      await fetchTasks();
    } catch (e) {
      console.warn("Failed to create task:", e);
      alert("Unable to create the task. Please try again.");
    }
  };

  const handleTaskStatusToggle = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await setDoc(doc(db, "tasks", id), { status: nextStatus, updatedAt: serverTimestamp() }, { merge: true });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));
    } catch (e) {
      console.warn("Failed to update task:", e);
      alert("Unable to update the task. Please try again.");
    }
  };

  const statusBadge = (status: string) => {
    const cls =
      status === "Overdue" ? "bg-red-50 text-red-700 border border-red-200" :
      status === "Pending" ? "bg-neutral-100 text-neutral-600 border border-neutral-200" :
      status === "In Progress" ? "bg-blue-50 text-blue-700 border border-blue-200" :
      "bg-emerald-50 text-emerald-700 border border-emerald-200";
    const Icon = status === "Overdue" ? AlertTriangle : status === "Completed" ? CheckCircle : status === "In Progress" ? ListTodo : Clock;
    return (
      <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded flex items-center gap-1.5 w-max ${cls}`}>
        <Icon className="w-3 h-3" /> {status}
      </span>
    );
  };

  const triggerPipelineWhatsApp = (name: string, phone: string) => {
    const personalizedText = whatsappTemplate.replace("[Name]", name);
    const digits = phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(personalizedText);
    window.open(`https://wa.me/${digits}?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Follow-up & Task Management
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Assign and track tasks, and follow up with first-time visitors via WhatsApp.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        <button onClick={() => setActiveTab("tasks")} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "tasks" ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>Task Manager</button>
        <button onClick={() => setActiveTab("pipeline")} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === "pipeline" ? "border-[#25D366] text-[#075E54] bg-[#25D366]/10" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}><MessageCircle className="w-3.5 h-3.5"/> First-Timer Pipeline</button>
      </div>

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {['All Tasks', ...TASK_STATUSES].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${filter === f ? 'bg-[#1e1548] text-white shadow-sm' : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNewTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-widest shrink-0 shadow-sm cursor-pointer ml-4">
              <ListTodo className="w-3.5 h-3.5" /> Assign New Task
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading tasks…</div>
          ) : (
            <div className="bg-white border border-neutral-200 shadow-xs rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="p-4 font-bold text-neutral-400 uppercase tracking-widest">Task Description</th>
                    <th className="p-4 font-bold text-neutral-400 uppercase tracking-widest">Assigned To</th>
                    <th className="p-4 font-bold text-neutral-400 uppercase tracking-widest">Due Date</th>
                    <th className="p-4 font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 font-bold text-neutral-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 font-bold text-[#0A192F]">{t.title}</td>
                      <td className="p-4 text-[10px] text-neutral-600 font-mono uppercase bg-neutral-100/50 rounded inline-block px-2 py-1">{t.assignedTo || "Unassigned"}</td>
                      <td className="p-4 text-[10px] text-neutral-500 font-mono">{t.dueDate || "—"}</td>
                      <td className="p-4">{statusBadge(t.status)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleTaskStatusToggle(t.id)}
                          className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer transition-colors ${t.status === 'Completed' ? 'text-neutral-500 hover:bg-neutral-100' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                        >
                          {t.status === 'Completed' ? 'Reopen' : 'Mark Done'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-widest border-t border-dashed border-neutral-200">
                        {tasks.length === 0 ? "No tasks assigned yet. Create your first task above." : "No tasks found in this view"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-[#25D366]/30 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="bg-[#25D366]/10 p-5 border-b border-[#25D366]/20">
                <h2 className="text-[#075E54] font-black text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5"/> Automation Engine
                </h2>
                <p className="text-[10px] text-[#128C7E] font-bold mt-1 leading-relaxed">
                  Configure the default WhatsApp template used when triggering native follow-ups for First-Timers. Use [Name] as a dynamic variable.
                </p>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3 bg-neutral-50/50">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">WhatsApp Template</label>
                <textarea
                  rows={6}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full"
                />
                <div className="text-[9px] text-neutral-400 font-mono bg-white p-2 rounded border border-neutral-200">
                  Variable Preview: {whatsappTemplate.replace("[Name]", "John")}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                <h2 className="text-[#1e1548] font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Users className="w-4 h-4 text-purple-600"/> First-Timer Queue</h2>
                <span className="bg-[#25D366]/20 text-[#075E54] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-[#25D366]/30">
                  {firstTimers.length} Awaiting Follow-up
                </span>
              </div>
              <div className="divide-y divide-neutral-100">
                {firstTimers.map((ft) => (
                  <div key={ft.id} className="p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors group">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-[#0A192F] text-sm">{ft.name}</h3>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest bg-neutral-100 text-neutral-500 border border-neutral-200">
                          New
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-neutral-500 font-mono bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">{ft.phone || "No phone"}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Visited: {ft.date || "—"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => ft.phone && triggerPipelineWhatsApp(ft.name, ft.phone)}
                      disabled={!ft.phone}
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer opacity-90 group-hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" /> Trigger WhatsApp
                    </button>
                  </div>
                ))}
                {firstTimers.length === 0 && (
                  <div className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-widest">
                    No first-time visitors recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-[#0A192F]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in border border-blue-100">
            <button onClick={() => setShowNewTask(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 p-1.5 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4"/></button>
            <h3 className="font-black text-[#1e1548] text-xl mb-1 flex items-center gap-2"><ListTodo className="w-5 h-5 text-blue-600"/> Assign New Task</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-6">Internal Team Delegation</p>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1.5 tracking-widest">Task Description *</label>
                <textarea required value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} rows={3} placeholder="What needs to be done?" className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1.5 tracking-widest">Assign To *</label>
                  <input required type="text" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="e.g. Ps. David" className="w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1.5 tracking-widest">Due Date *</label>
                  <input required type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="w-full" />
                </div>
              </div>
              <button type="submit" className="btn-primary-sm mt-2 w-full">Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};