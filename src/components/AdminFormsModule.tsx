import React, { useState, useEffect } from "react";
import { Plus, QrCode, ClipboardType, Edit2, Trash2, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useChurch } from "../context/ChurchContext";
import { db } from "../lib/firebase";
import { collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
  options?: string[]; // For select type
  required: boolean;
}

interface AdminFormItem {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  createdAt?: any;
  responses: number;
  fields: FormField[];
}

export const AdminFormsModule: React.FC = () => {
  const { connectSubmissions } = useChurch();
  const [forms, setForms] = useState<AdminFormItem[]>([]);

  const [activeTab, setActiveTab] = useState<"forms" | "submissions">("forms");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedFormQR, setSelectedFormQR] = useState<string | null>(null);

  // Form Builder State
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Survey");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  
  // Field Editor State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FormField["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "forms"), (snap) => {
      setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminFormItem)));
    }, (err) => console.warn("forms listener failed:", err));
    return unsub;
  }, []);

  const toggleForm = (id: string) => {
    setDoc(doc(db, "forms", id), { isActive: !(forms.find((f) => f.id === id)?.isActive ?? false), updatedAt: serverTimestamp() }, { merge: true })
      .catch((e) => console.error("Failed to toggle form:", e));
  };

  const handleInitCreate = () => {
    setEditingFormId(null);
    setFormTitle("");
    setFormType("Survey");
    setFormFields([]);
    setShowNewForm(true);
  };

  const handleInitEdit = (form: AdminFormItem) => {
    setEditingFormId(form.id);
    setFormTitle(form.title);
    setFormType(form.type);
    setFormFields([...form.fields]);
    setShowNewForm(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formFields.length === 0) return;

    try {
      if (editingFormId) {
        await setDoc(doc(db, "forms", editingFormId), {
          title: formTitle.trim(),
          type: formType,
          fields: formFields,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, "forms"), {
          id: "form_" + Date.now(),
          title: formTitle.trim(),
          type: formType,
          isActive: false,
          createdAt: serverTimestamp(),
          responses: 0,
          fields: formFields
        });
      }
      setShowNewForm(false);
    } catch (err) {
      console.error("Failed to save form:", err);
      alert("Unable to save form. Check your connection and try again.");
    }
  };

  const handleDeleteForm = (id: string) => {
    deleteDoc(doc(db, "forms", id)).catch((e) => console.error("Failed to delete form:", e));
  };

  // Field Builder Logic
  const handleSaveField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: FormField = {
      id: editingFieldId || `field_${Date.now()}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      ...(newFieldType === 'select' ? { options: newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) } : {})
    };

    if (editingFieldId) {
      setFormFields(prev => prev.map(f => f.id === editingFieldId ? newField : f));
    } else {
      setFormFields(prev => [...prev, newField]);
    }

    resetFieldEditor();
  };

  const resetFieldEditor = () => {
    setEditingFieldId(null);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setNewFieldOptions("");
  };

  const handleEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setNewFieldLabel(field.label);
    setNewFieldType(field.type);
    setNewFieldRequired(field.required);
    setNewFieldOptions(field.options ? field.options.join(", ") : "");
  };

  const handleRemoveField = (id: string) => {
    setFormFields(prev => prev.filter(f => f.id !== id));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setFormFields(prev => {
        const arr = [...prev];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        return arr;
      });
    } else if (direction === 'down' && index < formFields.length - 1) {
      setFormFields(prev => {
        const arr = [...prev];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return arr;
      });
    }
  };

  const formatCreated = (createdAt?: any) => {
    if (!createdAt) return "—";
    if (createdAt?.toDate) return createdAt.toDate().toLocaleDateString();
    return String(createdAt).slice(0, 10);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-[#1e1548] p-7 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Data Collection</p>
        <h1 className="mt-2 text-2xl font-black">Forms & Surveys</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Create forms, configure dynamic fields, toggle them on/off. Active forms appear on the Contact page with their own unique QR code.</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "forms", label: "Form Manager" }, { id: "submissions", label: "Submissions" }].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id ? "border-[#1e1548] text-[#1e1548]" : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "forms" && (
        <div className="space-y-4">
          {!showNewForm && (
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Toggle a form ON to make it visible on the public Contact page</p>
              <button 
                onClick={handleInitCreate} 
                className="btn-primary-sm"
              >
                <Plus className="w-4 h-4" /> New Form
              </button>
            </div>
          )}

          {showNewForm && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                <h3 className="font-black text-xl text-[#1e1548] uppercase tracking-wider">
                  {editingFormId ? "Edit Form Builder" : "New Form Builder"}
                </h3>
                <button onClick={() => setShowNewForm(false)} className="text-neutral-400 hover:bg-neutral-100 p-1.5 rounded-full cursor-pointer"><X className="w-5 h-5"/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Settings & Field Editor */}
                <div className="lg:col-span-5 space-y-6 border-r border-neutral-100 pr-8">
                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Form Details</h4>
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Form Title *</label>
                      <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Volunteer Sign-up" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Form Type</label>
                      <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full">
                        <option>Survey</option><option>Registration</option><option>Contact</option><option>Prayer</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs">
                    <h4 className="font-bold text-[#1e1548] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4"/> {editingFieldId ? "Edit Field" : "Add Field"}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-neutral-700 font-bold uppercase mb-1">Field Label *</label>
                        <input type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="e.g. Your Name" className="w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-700 font-bold uppercase mb-1">Field Type</label>
                          <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as FormField["type"])} className="w-full">
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="select">Dropdown Select</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 text-neutral-700 font-bold uppercase cursor-pointer mb-2">
                            <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="w-4 h-4" />
                            Required Field
                          </label>
                        </div>
                      </div>
                      {newFieldType === 'select' && (
                        <div>
                          <label className="block text-neutral-700 font-bold uppercase mb-1">Options (comma-separated)</label>
                          <input type="text" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" className="w-full" />
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveField} className="btn-primary-sm">
                          {editingFieldId ? "Update Field" : "Add Field"}
                        </button>
                        {editingFieldId && (
                          <button onClick={resetFieldEditor} className="btn-primary-sm">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Preview / Fields List */}
                <div className="lg:col-span-7">
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 mb-4 text-xs">Form Structure</h4>

                  {formFields.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-neutral-200 rounded-xl text-center">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No fields added yet</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Use the builder on the left to add fields.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formFields.map((field, index) => (
                        <div key={field.id} className="group bg-white border border-neutral-200 rounded-lg p-3 flex gap-4 items-center shadow-xs hover:border-blue-300 transition-colors">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleMoveField(index, 'up')} disabled={index === 0} className="text-neutral-300 hover:text-[#1e1548] disabled:opacity-30 cursor-pointer p-0.5 rounded hover:bg-neutral-100"><ChevronUp className="w-4 h-4"/></button>
                            <button onClick={() => handleMoveField(index, 'down')} disabled={index === formFields.length - 1} className="text-neutral-300 hover:text-[#1e1548] disabled:opacity-30 cursor-pointer p-0.5 rounded hover:bg-neutral-100"><ChevronDown className="w-4 h-4"/></button>
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm text-[#0F2342] flex items-center gap-2">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </p>
                              <p className="text-[10px] font-mono text-neutral-500 uppercase">{field.type} {field.options ? `(${field.options.length} opts)` : ''}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditField(field)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer" title="Edit Field"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => handleRemoveField(field.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer" title="Remove Field"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8 pt-4 border-t border-neutral-100 flex gap-3 justify-end">
                    <button onClick={() => setShowNewForm(false)} className="text-neutral-500 font-bold px-6 py-2.5 rounded-lg text-xs uppercase hover:bg-neutral-100 cursor-pointer">Discard Form</button>
                    <button onClick={handleSaveForm} disabled={formFields.length === 0 || !formTitle} className="btn-primary-sm"><Check className="w-4 h-4"/> Save Form</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showNewForm && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Form Title</th>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Type</th>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Fields</th>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Responses</th>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Status (Toggle)</th>
                    <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {forms.map((form) => (
                    <React.Fragment key={form.id}>
                      <tr className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-[#0F2342] text-sm">{form.title}</span>
                          <span className="block text-[9px] text-neutral-400 font-mono mt-0.5">Created: {formatCreated(form.createdAt)}</span>
                        </td>
                        <td className="p-4 text-neutral-500 font-mono text-[10px] uppercase"><span className="bg-neutral-100 px-2 py-1 rounded">{form.type}</span></td>
                        <td className="p-4 text-neutral-700 font-bold text-[10px]">{form.fields.length} Fields</td>
                        <td className="p-4 text-neutral-700 font-bold">{form.responses} <span className="text-neutral-400 font-normal">subs</span></td>
                        <td className="p-4">
                          <button 
                            onClick={() => toggleForm(form.id)} 
                            className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase border cursor-pointer transition-all ${
                              form.isActive 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200" 
                                : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            }`}
                          >
                            {form.isActive ? "Active — Disable" : "Disabled — Enable"}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => setSelectedFormQR(selectedFormQR === form.id ? null : form.id)} 
                              className="text-[10px] font-bold text-purple-700 hover:bg-purple-50 p-2 rounded flex items-center gap-1 transition-colors cursor-pointer"
                              title="Show QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleInitEdit(form)} 
                              className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 p-2 rounded flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit Form"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteForm(form.id)} 
                              className="text-[10px] font-bold text-red-500 hover:bg-red-50 p-2 rounded flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete Form"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {selectedFormQR === form.id && (
                        <tr>
                          <td colSpan={6} className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 border-b border-purple-100">
                            <div className="flex items-start gap-8 justify-center">
                              <div className="p-2 bg-white rounded-xl shadow-sm border border-purple-100">
                                <QRCodeSVG value={`${window.location.origin}/contact?form=${form.id}`} size={120} bgColor="#ffffff" fgColor="#1e1548" level="H" />
                              </div>
                              <div className="max-w-md pt-2">
                                <p className="font-black text-[#1e1548] text-sm uppercase tracking-widest mb-1">{form.title}</p>
                                <p className="text-xs font-mono text-purple-700/80 mb-2 bg-white px-2 py-1 rounded border border-purple-100 inline-block">{`${window.location.origin}/contact?form=${form.id}`}</p>
                                
                                <div className="space-y-2">
                                  <div className={`text-[10px] font-bold px-3 py-1 rounded w-fit uppercase flex items-center gap-1.5 ${form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>
                                    {form.isActive ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                                    {form.isActive ? "Enabled — public page rendering pending" : "Form is DISABLED"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {forms.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 font-bold uppercase text-xs tracking-widest border-t border-dashed border-neutral-200">
                        No forms found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Details</th>
                <th className="p-4 font-bold text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {connectSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 text-neutral-500 font-mono text-[10px]">{new Date(sub.timestamp).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="font-bold text-[#0F2342]">{sub.name}</span>
                    {(sub.email || sub.phone) && (
                      <span className="block text-[9px] text-neutral-400 mt-0.5">
                        {sub.email} {sub.phone && `| ${sub.phone}`}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="bg-sky-50 text-[#0F2342] text-[9px] font-bold px-2 py-1 rounded uppercase">
                      {sub.type}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-600 max-w-xs truncate">{sub.details}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                      sub.status === "Pending" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
              {connectSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-neutral-50 p-6 rounded-full mb-4 border border-neutral-100">
                        <ClipboardType className="w-12 h-12 text-neutral-300" />
                      </div>
                      <p className="font-bold text-sm text-[#0F2342] uppercase tracking-wider mb-2">No Submissions Recorded</p>
                      <p className="text-xs max-w-sm leading-relaxed">Visitor and member form submissions will be aggregated here in a tabular format once data starts flowing in.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};