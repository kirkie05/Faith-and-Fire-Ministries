import React, { useState, useEffect } from "react";
import { Check, Heart } from "lucide-react";
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AdminTasks } from "./AdminTasks";

interface FollowUpRecord {
  id: string;
  personName: string;
  email?: string | null;
  phone?: string | null;
  status: "New" | "Assigned" | "Contacted" | "In Progress" | "Completed" | "Unreachable" | "Closed";
  assignedWorkerId?: string | null;
  nextFollowUpAt?: string | null;
}

const followUpStatuses: FollowUpRecord["status"][] = ["New", "Assigned", "Contacted", "In Progress", "Completed", "Unreachable", "Closed"];

export const AdminFollowUps: React.FC = () => {
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onSnapshot(collection(db, "followUps"), (snapshot) => {
    setRecords(snapshot.docs.map((record) => ({ id: record.id, ...record.data() } as FollowUpRecord)));
    setLoading(false);
  }, (listenerError) => {
    setError(listenerError.message);
    setLoading(false);
  }), []);

  const updateStatus = async (record: FollowUpRecord, status: FollowUpRecord["status"]) => {
    setError(null);
    try {
      await updateDoc(doc(db, "followUps", record.id), {
        status,
        lastContactAt: status === "Contacted" || status === "Completed" ? serverTimestamp() : record.nextFollowUpAt || null,
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update follow-up status.");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-sm font-semibold text-neutral-500">Loading follow-up records…</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error}</div>;

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-[#1e1548] to-purple-950 p-7 text-white shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Pastoral care</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Follow-up queue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">Every visitor card creates a record here. Assign, contact, and close the loop without losing the person behind the form.</p>
    </div>
    {records.length === 0 ? <div><Heart className="mx-auto h-7 w-7 text-amber-400" /><h2 className="mt-3 font-black text-[#0A192F]">No follow-ups yet</h2><p className="mt-1 text-sm text-neutral-500">New visitor cards will appear here automatically.</p></div> : <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"><div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-neutral-100 bg-neutral-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500"><span>Person</span><span>Contact</span><span>Status</span></div>{records.map((record) => <div key={record.id} className="grid grid-cols-1 gap-3 border-b border-neutral-100 px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1fr_1fr] md:items-center"><div><p className="font-bold text-[#0A192F]">{record.personName}</p><p className="mt-1 text-xs text-neutral-500">{record.email || "No email recorded"}</p></div><p className="text-sm text-neutral-600">{record.phone || "No phone recorded"}</p><select value={record.status} onChange={(event) => updateStatus(record, event.target.value as FollowUpRecord["status"])} >{followUpStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>)}</div>}
  </div>;
};


export const AdminFollowUpModule: React.FC<{ initialTab?: "followups" | "tasks" | "firsttimers" | "whatsapp" }> = ({ initialTab = "followups" }) => {
  const [activeTab, setActiveTab] = useState<"followups" | "tasks" | "firsttimers" | "whatsapp">(initialTab);
  const [firstTimers, setFirstTimers] = useState<any[]>([]);
  const [timerName, setTimerName] = useState(""); const [timerPhone, setTimerPhone] = useState(""); const [timerEmail, setTimerEmail] = useState(""); const [timerNote, setTimerNote] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("Hi {name}! Thank you for joining us at Faith & Fire Ministries. We\u2019d love to connect with you. Please reply to this message or contact the church office. God bless!");
  const followupTabs = [{ id: "followups", label: "Follow-Ups" }, { id: "tasks", label: "Tasks" }, { id: "firsttimers", label: "First Timers" }, { id: "whatsapp", label: "WhatsApp Automation" }] as const;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "firstTimers"), (snap) => {
      setFirstTimers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    }, (err) => console.warn("firstTimers listener failed:", err));
    return unsub;
  }, []);

  const handleAddFirstTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timerName.trim()) return;
    try {
      await addDoc(collection(db, "firstTimers"), {
        name: timerName.trim(),
        phone: timerPhone.trim(),
        email: timerEmail.trim(),
        note: timerNote.trim(),
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setTimerName(""); setTimerPhone(""); setTimerEmail(""); setTimerNote("");
    } catch (err) {
      console.error("Failed to add first timer:", err);
      alert("Unable to save first-timer record. Check your connection and try again.");
    }
  };

  const getWhatsAppLink = (name: string, phone: string) => {
    const msg = encodeURIComponent(whatsappTemplate.replace("{name}", name));
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/${cleaned.startsWith("0") ? "27" + cleaned.slice(1) : cleaned}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">Pastoral Operations</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Follow-Up</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-100">Manage follow-ups, tasks, first-timer records and automate WhatsApp pastoral outreach.</p>
      </div>
      <div className="flex gap-1 border-b border-neutral-200">
        {followupTabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-rose-600 text-rose-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>))}
      </div>
      {activeTab === "followups" && <AdminFollowUps />}
      {activeTab === "tasks" && <AdminTasks />}
      {activeTab === "firsttimers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest">First Timer Records ({firstTimers.length})</h2>
            <div className="space-y-3">
              {firstTimers.map((ft: any) => (
                <div key={ft.id} className="p-3 border border-neutral-100 rounded-lg bg-neutral-50 flex justify-between items-center gap-4">
                  <div><p className="font-bold text-[#1e1548] text-sm">{ft.name}</p><p className="text-[10px] text-neutral-500">{ft.phone} · {ft.email}</p><p className="text-[10px] text-neutral-400">{ft.date}</p></div>
                  {ft.phone && <a href={getWhatsAppLink(ft.name, ft.phone)} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider whitespace-nowrap">📱 WhatsApp</a>}
                </div>
              ))}
              {firstTimers.length === 0 && <div className="text-center text-neutral-400 text-sm py-6">No first timers recorded yet.</div>}
            </div>
          </div>
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest">Add First Timer</h2>
            <form onSubmit={handleAddFirstTimer} className="space-y-3 text-xs">
              <input type="text" required value={timerName} onChange={(e) => setTimerName(e.target.value)} placeholder="Full Name *" className="w-full" />
              <input type="tel" value={timerPhone} onChange={(e) => setTimerPhone(e.target.value)} placeholder="Phone (for WhatsApp)" className="w-full" />
              <input type="email" value={timerEmail} onChange={(e) => setTimerEmail(e.target.value)} placeholder="Email" className="w-full" />
              <textarea rows={2} value={timerNote} onChange={(e) => setTimerNote(e.target.value)} placeholder="Notes / Prayer requests..." className="w-full" />
              <button type="submit" className="btn-primary-sm w-full">Add First Timer</button>
            </form>
          </div>
        </div>
      )}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
            <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest mb-3">WhatsApp Follow-Up Template</h2>
            <p className="text-xs text-neutral-500 mb-4">Use <code className="bg-neutral-100 px-1 rounded">{"{name}"}</code> as a placeholder for the visitor's name.</p>
            <textarea rows={5} value={whatsappTemplate} onChange={(e) => setWhatsappTemplate(e.target.value)} className="w-full" />
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Preview</p>
              <p className="text-sm text-green-900">{whatsappTemplate.replace("{name}", "John Doe")}</p>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
            <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest mb-4">Quick Dispatch</h2>
            {firstTimers.filter((ft: any) => ft.phone).length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">Add first timers with phone numbers to dispatch WhatsApp messages here.</p>
            ) : (
              <div className="space-y-3">
                {firstTimers.filter((ft: any) => ft.phone).map((ft: any) => (
                  <div key={ft.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg">
                    <div><p className="font-bold text-sm text-[#1e1548]">{ft.name}</p><p className="text-[10px] text-neutral-500">{ft.phone}</p></div>
                    <a href={getWhatsAppLink(ft.name, ft.phone)} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg uppercase">Send</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

