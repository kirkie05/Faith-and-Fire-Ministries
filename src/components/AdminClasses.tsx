import React, { useState, useEffect, useCallback } from "react";
import { GraduationCap, Edit, Check, X, UserPlus, Award, Users } from "lucide-react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChurch } from "../context/ChurchContext";

interface MembershipClass {
  id: string;
  name: string;
  description: string;
  status: string;
  assignedTo: string;
  dueDate: string;
  archived: boolean;
}

export const AdminClasses: React.FC = () => {
  const { currentUser } = useChurch();
  const [classes, setClasses] = useState<MembershipClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Create Class State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // Edit Class State
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstructor, setEditInstructor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "membershipClasses"));
      const fetched = snap.docs
        .map((record) => ({ id: record.id, ...record.data() } as MembershipClass))
        .filter((c) => !c.archived);
      setClasses(fetched);
      setSelectedClassId((prev) => (prev && fetched.some((c) => c.id === prev) ? prev : fetched[0]?.id || null));
    } catch (e) {
      console.warn("Failed to load membership classes:", e);
      setError("Unable to load membership classes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;

  const handleCreateClass = async () => {
    const name = newName.trim();
    if (!name) {
      alert("A class name is required.");
      return;
    }
    const id = "cls_" + Date.now();
    try {
      await setDoc(doc(db, "membershipClasses", id), {
        id,
        name,
        description: newDescription.trim(),
        status: "Active",
        assignedTo: newInstructor.trim(),
        dueDate: newDueDate || "",
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewName("");
      setNewInstructor("");
      setNewDescription("");
      setNewDueDate("");
      setShowCreateForm(false);
      await fetchClasses();
    } catch (e) {
      console.warn("Failed to create class:", e);
      alert("Unable to create the class. Please try again.");
    }
  };

  const handleEditInit = () => {
    if (!selectedClass) return;
    setEditName(selectedClass.name);
    setEditInstructor(selectedClass.assignedTo);
    setEditDescription(selectedClass.description);
    setEditDueDate(selectedClass.dueDate);
    setIsEditingClass(true);
  };

  const handleSaveClass = async () => {
    if (!selectedClass) return;
    try {
      await setDoc(doc(db, "membershipClasses", selectedClass.id), {
        name: editName.trim() || selectedClass.name,
        description: editDescription.trim(),
        assignedTo: editInstructor.trim(),
        dueDate: editDueDate,
        status: selectedClass.status,
        archived: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditingClass(false);
      await fetchClasses();
    } catch (e) {
      console.warn("Failed to update class:", e);
      alert("Unable to save the class details. Please try again.");
    }
  };

  const handleArchiveClass = async (classId: string) => {
    if (!confirm("Are you sure you want to archive this class? It will no longer appear in the list.")) return;
    try {
      await setDoc(doc(db, "membershipClasses", classId), {
        archived: true,
        status: "Archived",
        updatedAt: serverTimestamp()
      }, { merge: true });
      await fetchClasses();
    } catch (e) {
      console.warn("Failed to archive class:", e);
      alert("Unable to archive the class. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="py-12 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
          Loading membership classes…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Membership Classes
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Manage discipleship classes for new and existing members.
          </p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowCreateForm((v) => !v)}>
          <GraduationCap className="w-4 h-4" /> Create Class
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-5">
          <h3 className="font-bold text-[#0F2342] uppercase text-xs mb-4">New Class</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-neutral-500 font-bold uppercase mb-1">Class Name *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full" placeholder="e.g. Foundation 101" />
            </div>
            <div>
              <label className="block text-neutral-500 font-bold uppercase mb-1">Instructor</label>
              <input type="text" value={newInstructor} onChange={(e) => setNewInstructor(e.target.value)} className="w-full" placeholder="e.g. Pastor John" />
            </div>
            <div className="col-span-2">
              <label className="block text-neutral-500 font-bold uppercase mb-1">Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full" rows={2} placeholder="What does this class cover?" />
            </div>
            <div>
              <label className="block text-neutral-500 font-bold uppercase mb-1">Start Date</label>
              <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={() => setShowCreateForm(false)} className="text-[10px] font-bold text-neutral-500 hover:bg-neutral-100 px-4 py-2 rounded uppercase cursor-pointer">Cancel</button>
            <button onClick={handleCreateClass} className="btn-primary-sm"><Check className="w-3 h-3"/> Create Class</button>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <Users className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">No membership classes yet</p>
          <p className="text-[11px] text-neutral-400 mt-1">Create your first class above to start tracking discipleship.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 border-b border-neutral-200 overflow-x-auto hide-scrollbar pb-px">
            {classes.map((c) => (
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
              <div className="lg:col-span-8 space-y-6">
                {isEditingClass ? (
                  <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-5">
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
                      <div className="col-span-2">
                        <label className="block text-neutral-500 font-bold uppercase mb-1">Description</label>
                        <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full" rows={2} />
                      </div>
                      <div>
                        <label className="block text-neutral-500 font-bold uppercase mb-1">Start Date</label>
                        <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="w-full" />
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
                        {selectedClass.name}
                        <button onClick={handleEditInit} className="text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer" title="Edit Class Settings"><Edit className="w-3.5 h-3.5"/></button>
                      </h2>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                        {selectedClass.assignedTo ? `Instructor: ${selectedClass.assignedTo}` : "No instructor assigned"} | Status: {selectedClass.status}
                      </p>
                    </div>
                    <button
                      onClick={() => handleArchiveClass(selectedClass.id)}
                      className="text-[9px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded uppercase cursor-pointer"
                    >
                      Archive Class
                    </button>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {selectedClass.description || "No description provided."}
                    </p>
                    {selectedClass.dueDate && (
                      <p className="text-[10px] font-mono text-neutral-400 mt-3">
                        Start date: {selectedClass.dueDate}
                      </p>
                    )}
                    <div className="mt-5 border-t border-dashed border-neutral-200 pt-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" /> Participant tracking
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Per-class participant and session attendance tracking is not available yet.
                        Enrolment is handled in the member roster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-purple-900 to-[#1e1548] border border-[#17325B] shadow-md rounded-xl p-6 text-white relative overflow-hidden">
                  <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10" />
                  <h2 className="text-sm font-bold text-amber-300 uppercase mb-2 tracking-widest relative z-10">Graduation Readiness</h2>
                  <p className="text-[10px] text-purple-200 mb-5 leading-relaxed relative z-10 font-medium">
                    Completion certificates are not available yet. Once participant tracking is added, eligible members will be listed here.
                  </p>
                  <button className="btn-primary-sm w-full" disabled>Generate Certificates</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};