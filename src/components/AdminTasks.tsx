import React, { useState } from "react";
import { ListTodo, CheckCircle, Clock, AlertTriangle, MessageCircle, Send, X, Users } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

interface Task {
  id: string;
  desc: string;
  assignee: string;
  due: string;
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
}

const INITIAL_TASKS: Task[] = [
  { id: "t1", desc: "Follow up with new visitor family", assignee: "Ps. David", due: "Today", status: "Overdue" },
  { id: "t2", desc: "Hospital visit for John Smith", assignee: "Sarah M.", due: "Tomorrow", status: "Pending" },
  { id: "t3", desc: "Prepare welcome packs for Sunday", assignee: "Volunteer Team", due: "Friday", status: "In Progress" },
  { id: "t4", desc: "Call to verify member details", assignee: "Admin Desk", due: "Oct 10, 2026", status: "Completed" }
];

export const AdminTasks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tasks" | "pipeline">("tasks");
  const [filter, setFilter] = useState("All Tasks");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  // New Task State
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  // Pipeline State
  const [firstTimers, setFirstTimers] = useState([
    { id: "ft1", name: "Michael O.", phone: "555-0199", date: "Last Sunday", status: "Needs Follow-up" },
    { id: "ft2", name: "Jessica T.", phone: "555-0211", date: "Last Sunday", status: "Contacted" },
    { id: "ft3", name: "David L.", phone: "555-0344", date: "2 Weeks Ago", status: "Integrated" }
  ]);
  const [whatsappTemplate, setWhatsappTemplate] = useState("Shalom [Name], it was wonderful having you at Faith & Fire this Sunday! We'd love to connect. How was your experience?");

  const filteredTasks = tasks.filter(t => {
    if (filter === "All Tasks") return true;
    return t.status === filter;
  });

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc || !newTaskAssignee || !newTaskDue) return;

    const newTask: Task = {
      id: `t${Date.now()}`,
      desc: newTaskDesc,
      assignee: newTaskAssignee,
      due: new Date(newTaskDue).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      status: "Pending"
    };

    setTasks([newTask, ...tasks]);
    setShowNewTask(false);
    setNewTaskDesc(""); setNewTaskAssignee(""); setNewTaskDue("");
  };

  const handleTaskStatusToggle = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' };
      }
      return t;
    }));
  };

  const triggerPipelineWhatsApp = (name: string, phone: string, id: string) => {
    const personalizedText = whatsappTemplate.replace("[Name]", name);
    const digits = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(personalizedText);
    
    // Mark as contacted
    setFirstTimers(firstTimers.map(ft => ft.id === id ? { ...ft, status: "Contacted" } : ft));
    
    window.open(`https://wa.me/${digits}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Follow-up & Task Management
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Assign and track tasks, and automate first-timer WhatsApp follow-ups.
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
              {['All Tasks', 'Pending', 'In Progress', 'Completed', 'Overdue'].map(f => (
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
                {filteredTasks.map((t, i) => (
                  <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-[#0A192F]">{t.desc}</td>
                    <td className="p-4 text-[10px] text-neutral-600 font-mono uppercase bg-neutral-100/50 rounded m-2 inline-block px-2 py-1 mt-3 ml-4">{t.assignee}</td>
                    <td className="p-4 text-[10px] text-neutral-500 font-mono">{t.due}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded flex items-center gap-1.5 w-max ${
                        t.status === 'Overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
                        t.status === 'Pending' ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {t.status === 'Overdue' && <AlertTriangle className="w-3 h-3"/>}
                        {t.status === 'Completed' && <CheckCircle className="w-3 h-3"/>}
                        {t.status === 'Pending' && <Clock className="w-3 h-3"/>}
                        {t.status === 'In Progress' && <ListTodo className="w-3 h-3"/>}
                        {t.status}
                      </span>
                    </td>
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
                      No tasks found in this view
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    {firstTimers.filter(ft => ft.status === "Needs Follow-up").length} Action Required
                  </span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {firstTimers.map((ft) => (
                    <div key={ft.id} className="p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors group">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-[#0A192F] text-sm">{ft.name}</h3>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest ${
                            ft.status === 'Needs Follow-up' ? 'bg-red-100 text-red-700 border border-red-200' :
                            ft.status === 'Contacted' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {ft.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-neutral-500 font-mono bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">{ft.phone}</span>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">Visited: {ft.date}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerPipelineWhatsApp(ft.name, ft.phone, ft.id)}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer opacity-90 group-hover:opacity-100"
                      >
                        <Send className="w-3.5 h-3.5" /> Trigger WhatsApp
                      </button>
                    </div>
                  ))}
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
