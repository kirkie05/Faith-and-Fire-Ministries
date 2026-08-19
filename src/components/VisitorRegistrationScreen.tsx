import React, { FormEvent, useState } from "react";
import { CheckCircle, ChevronRight, Heart, MapPin, Send } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChurch } from "../context/ChurchContext";
import { SuccessModal } from "./Animations";

export const VisitorRegistrationScreen: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { churchInfo, ministries, addConnectSubmission } = useChurch();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") || "").trim(), lastName = String(form.get("lastName") || "").trim(), email = String(form.get("email") || "").trim(), phone = String(form.get("phone") || "").trim();
    if (!firstName || !lastName || !email || !phone) return setError("Please complete your name, email address, and phone number.");
    setSubmitting(true); setError(null);
    try { 
      await addDoc(collection(db, "visitors"), { name: `${firstName} ${lastName}`, firstName, lastName, email, phone, whatsapp: String(form.get("whatsapp") || ""), address: String(form.get("address") || ""), ageRange: String(form.get("ageRange") || ""), gender: String(form.get("gender") || ""), maritalStatus: String(form.get("maritalStatus") || ""), heardAbout: String(form.get("heardAbout") || ""), firstVisit: String(form.get("firstVisit") || ""), serviceAttended: String(form.get("serviceAttended") || ""), eventAttended: String(form.get("eventAttended") || ""), prayerRequest: String(form.get("prayerRequest") || ""), ministryInterest: String(form.get("ministryInterest") || ""), preferredContactMethod: String(form.get("preferredContactMethod") || ""), details: "Visitor card submitted from public website.", type: "FirstTimer", status: "New", source: "visitor-card", ownerId: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); 
      addConnectSubmission("FirstTimer", `${firstName} ${lastName}`, "Visitor card submitted from public website.", email, phone);
      setSubmitted(true); 
      event.currentTarget.reset(); // Reset the form fields
    }
    catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "We could not send your visitor card. Please try again."); } finally { setSubmitting(false); }
  };
  return (
    <>
      <section><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.82fr_1.18fr]"><aside className="pt-3"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-500">New here?</p><h1 className="mt-4 text-4xl font-black tracking-tight text-[#0A192F] sm:text-5xl">We would love to know you.</h1><p className="mt-5 max-w-md text-base leading-7 text-neutral-600">Your visitor card helps our hospitality team welcome you well and support your next step at {churchInfo.shortName}.</p><div className="mt-8 space-y-4 text-sm font-semibold text-[#0A192F]"><p className="flex gap-3"><Heart className="h-5 w-5 shrink-0 text-amber-500" /> Your details stay within our church care team.</p><p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-amber-500" /> {churchInfo.address}, {churchInfo.city}</p></div></aside><form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-xl shadow-purple-950/5 ring-1 ring-neutral-200 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><Field label="First name *" name="firstName" required /><Field label="Last name *" name="lastName" required /><Field label="Email *" name="email" type="email" required /><Field label="Phone *" name="phone" type="tel" required /><Field label="WhatsApp number" name="whatsapp" /><Field label="Address" name="address" /></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Select label="Age range" name="ageRange" options={["Under 18", "18–25", "26–35", "36–50", "51+"]} /><Select label="Gender" name="gender" options={["Prefer not to say", "Female", "Male"]} /><Select label="Marital status" name="maritalStatus" options={["Prefer not to say", "Single", "Married", "Other"]} /><Select label="How did you hear about us?" name="heardAbout" options={["Friend or family", "Social media", "Online search", "Walked by", "Other"]} /><Select label="Is this your first visit?" name="firstVisit" options={["Yes", "No"]} /><Select label="Service attended" name="serviceAttended" options={["Sunday service", "Friday prayer", "Midweek service", "Online"]} /><Field label="Event attended" name="eventAttended" /><Select label="Interested ministry" name="ministryInterest" options={["Not sure yet", ...ministries.map((ministry) => ministry.name)]} /><Select label="Preferred contact method" name="preferredContactMethod" options={["WhatsApp", "Phone call", "Email", "SMS"]} /></div><label className="mt-5 block text-sm font-bold text-neutral-800">Prayer request (optional)<textarea name="prayerRequest" rows={4} className="mt-2" placeholder="How can we pray with you?" /></label>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button disabled={submitting} className="btn-primary mt-6"><Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send my visitor card"}</button></form></div></section>
      <SuccessModal 
        isOpen={submitted} 
        onClose={() => { setSubmitted(false); onNavigate("home"); }} 
        title="Thank you for connecting with us!" 
        message="We are so glad you came. A member of our welcome team will follow up using your preferred contact method."
      />
    </>
  );
};
const Field: React.FC<{ label: string; name: string; type?: string; required?: boolean }> = ({ label, name, type = "text", required }) => <label className="block">{label}<input required={required} name={name} type={type} className="mt-2" /></label>;
const Select: React.FC<{ label: string; name: string; options: string[] }> = ({ label, name, options }) => <label className="block">{label}<select name={name} className="mt-2">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
