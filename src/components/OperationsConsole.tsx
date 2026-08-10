import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { CheckSquare, HeartHandshake, LayoutGrid, Plus, UsersRound } from "lucide-react";
import { db } from "../lib/firebase";

const modules = {
  departments: { label: "Departments", description: "Teams that make ministry happen.", icon: LayoutGrid },
  smallGroups: { label: "Small groups", description: "Cell, life, and fellowship groups.", icon: UsersRound },
  volunteerApplications: { label: "Volunteers", description: "People ready to serve.", icon: HeartHandshake },
  membershipClasses: { label: "Membership classes", description: "Classes and completion tracking.", icon: UsersRound },
  careCases: { label: "Pastoral care", description: "Restricted care cases and visits.", icon: HeartHandshake },
  tasks: { label: "Tasks", description: "Assignable operational work.", icon: CheckSquare },
  campaigns: { label: "Giving campaigns", description: "Target-based church campaigns.", icon: LayoutGrid }
} as const;
type ModuleKey = keyof typeof modules;
interface RecordItem { id: string; title?: string; name?: string; status?: string; description?: string; updatedAt?: unknown; }

export const OperationsConsole: React.FC = () => {
  const [active, setActive] = useState<ModuleKey>("departments");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const config = modules[active];
  const Icon = config.icon;
  useEffect(() => { setLoading(true); return onSnapshot(collection(db, active), (snapshot) => { setRecords(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as RecordItem))); setLoading(false); }, (listenerError) => { setError(listenerError.message); setLoading(false); }); }, [active]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const title = String(data.get("title") || "").trim(); if (!title) return; try { await addDoc(collection(db, active), { title, description: String(data.get("description") || ""), status: "Active", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); event.currentTarget.reset(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to save this record."); } };
  const archive = async (id: string) => { try { await updateDoc(doc(db, active, id), { status: "Archived", archived: true, updatedAt: serverTimestamp() }); } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to archive this record."); } };
  const activeCount = useMemo(() => records.filter((record) => record.status !== "Archived").length, [records]);
  return <div><div className="rounded-2xl bg-gradient-to-r from-[#1e1548] to-purple-950 p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-300">Church operations</p><h1 className="mt-2 text-2xl font-black">People, care, and ministry operations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">Manage the core operational records of the church from one secure, Firestore-backed workspace.</p></div><div className="flex flex-wrap gap-2">{(Object.keys(modules) as ModuleKey[]).map((key) => <button key={key} onClick={() => { setActive(key); setError(null); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${active === key ? "bg-[#0A192F] text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200"}`}>{modules[key].label}</button>)}</div><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><Icon className="h-6 w-6 text-amber-500"/><h2 className="mt-4 text-xl font-black text-[#0A192F]">Add {config.label.slice(0, -1) || config.label}</h2><p className="mt-2 text-sm text-neutral-500">{config.description}</p><label className="mt-6 block text-sm font-bold text-neutral-800">Name or title<input name="title" required className="mt-2" /></label><label className="mt-4 block text-sm font-bold text-neutral-800">Description<textarea name="description" rows={4} className="mt-2" /></label><button className="btn-primary mt-5"><Plus className="h-4 w-4"/> Save record</button></form><section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"><div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5"><div><h2 className="font-black text-[#0A192F]">{config.label}</h2><p className="mt-1 text-xs text-neutral-500">{activeCount} active record{activeCount === 1 ? "" : "s"}</p></div></div>{error && <p className="m-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}{loading ? <p className="p-6 text-sm font-semibold text-neutral-500">Loading records…</p> : records.length === 0 ? <p className="p-10 text-center text-sm text-neutral-500">No records yet.</p> : <div>{records.map((record) => <article key={record.id} className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-4 last:border-0"><div><h3 className="font-bold text-[#0A192F]">{record.title || record.name}</h3><p className="mt-1 max-w-xl text-xs text-neutral-500">{record.description || "No description"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${record.status === "Archived" ? "bg-neutral-100 text-neutral-500" : "bg-emerald-50 text-emerald-700"}`}>{record.status || "Active"}</span>{record.status !== "Archived" && <button onClick={() => archive(record.id)} className="text-xs font-bold text-red-600">Archive</button>}</div></article>)}</div>}</section></div></div>;
};
