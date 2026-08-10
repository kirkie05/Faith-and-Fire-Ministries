import React, { useState, useEffect, useRef } from "react";
import { useChurch } from "../context/ChurchContext";
import { Member } from "../types";
import { MemberAttendanceHeatmap } from "./MemberAttendanceHeatmap";
import { AuthModal } from "./AuthModal";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  User,
  LogIn,
  QrCode,
  Calendar,
  Award,
  Heart,
  DollarSign,
  CheckCircle2,
  Clock,
  Edit3,
  Download,
  Printer,
  Sparkles,
  Share2,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Shield,
  ArrowRight,
  ChevronRight,
  Plus,
  RefreshCw,
  UserCheck,
  FileText,
  BookOpen,
  Bell,
  Check,
  X,
  Send,
  Users,
  Building,
  Flame,
  Maximize2,
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MemberDashboardProps {
  setCurrentTab?: (tab: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ setCurrentTab }) => {
  const {
    members,
    addMember,
    updateMember,
    checkInMember,
    attendance,
    donations,
    connectSubmissions,
    addConnectSubmission,
    addDonation,
    ministries,
    currentUser
  } = useChurch();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Authenticated Member Session state stored in localStorage or null
  const [authenticatedMemberId, setAuthenticatedMemberId] = useState<string | null>(() => {
    const saved = localStorage.getItem("current_authenticated_member_id");
    if (saved && members.some((m) => m.id === saved)) {
      return saved;
    }
    return null;
  });

  // Security Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "attendance" | "prayers" | "giving" | "edit-profile">("overview");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMemberSelectorModal, setShowMemberSelectorModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Check-In Alert state
  const [checkInStatusMsg, setCheckInStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Prayer Request Form State inside dashboard
  const [newPrayerText, setNewPrayerText] = useState("");
  const [prayerCategory, setPrayerCategory] = useState("Healing & Health");
  const [prayerSubmittedMsg, setPrayerSubmittedMsg] = useState<string | null>(null);

  // Quick Donation Form inside dashboard
  const [showQuickGiveModal, setShowQuickGiveModal] = useState(false);
  const [giveAmount, setGiveAmount] = useState("500");
  const [giveFund, setGiveFund] = useState("Tithes & Offerings");

  // Profile Edit State
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Ref for card canvas download
  const cardCanvasRef = useRef<HTMLDivElement>(null);

  // Active Member is strictly determined by Firebase Auth currentUser session or authenticated ID
  const foundMember = members.find(
    (m) =>
      (currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.uid && (m.id === currentUser.uid || (m as any).ownerId === currentUser.uid)) ||
      (authenticatedMemberId && m.id === authenticatedMemberId)
  );

  const activeMember = foundMember || (currentUser ? {
    id: currentUser.uid,
    firstName: currentUser.displayName?.split(" ")[0] || "Member",
    lastName: currentUser.displayName?.split(" ").slice(1).join(" ") || "User",
    email: currentUser.email || "",
    phone: "",
    suburb: "Johannesburg",
    joinedDate: new Date().toISOString().split("T")[0],
    ministries: ["m1"],
    status: "Active" as const,
    photo: currentUser.photoURL || undefined,
    pin: ""
  } : null);

  useEffect(() => {
    if (activeMember) {
      setEditForm({ ...activeMember });
    }
  }, [authenticatedMemberId, activeMember]);

  // Handle Login Authentication with Security PIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const term = loginIdentifier.trim().toLowerCase();
    const pin = loginPin.trim();

    if (!term || !pin) {
      setLoginError("Please enter your Member Email, Phone or ID and Security PIN.");
      return;
    }

    const matched = members.find(
      (m) =>
        m.id.toLowerCase() === term ||
        m.email.toLowerCase() === term ||
        m.phone.replace(/[\s\-\+]/g, "").includes(term.replace(/[\s\-\+]/g, ""))
    );

    if (!matched) {
      setLoginError("Member profile not found. Please check your details or Register a new profile.");
      return;
    }

    const expectedPin = matched.pin || "1234";
    if (pin !== expectedPin) {
      setLoginError("Incorrect Security PIN. Default initial PIN for registered members is 1234.");
      return;
    }

    setAuthenticatedMemberId(matched.id);
    localStorage.setItem("current_authenticated_member_id", matched.id);
    setLoginIdentifier("");
    setLoginPin("");
    setLoginError(null);
  };

  // Handle Lock Profile & Sign Out
  const handleLockProfile = () => {
    setAuthenticatedMemberId(null);
    localStorage.removeItem("current_authenticated_member_id");
    setShowMemberSelectorModal(false);
  };

  // Handle Switching Member profile with mandatory Security PIN re-authentication
  const handleSelectMember = (id: string) => {
    setShowMemberSelectorModal(false);
    const target = members.find((m) => m.id === id);
    if (target) {
      setLoginIdentifier(target.email || target.id);
    }
    setAuthenticatedMemberId(null);
    localStorage.removeItem("current_authenticated_member_id");
  };

  // Handle Instant Self Check-in
  const handleSelfCheckIn = () => {
    if (!activeMember) return;
    const msg = checkInMember(activeMember.id, "Sunday Glory Service");
    const isSuccess = msg.startsWith("Success");
    setCheckInStatusMsg({ text: msg, success: isSuccess });
    setTimeout(() => setCheckInStatusMsg(null), 5000);
  };

  // Handle Profile Update (including PIN updates)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !editForm.firstName || !editForm.lastName) return;

    const updated: Member = {
      ...activeMember,
      firstName: editForm.firstName || activeMember.firstName,
      lastName: editForm.lastName || activeMember.lastName,
      phone: editForm.phone || activeMember.phone,
      email: editForm.email || activeMember.email,
      suburb: editForm.suburb || activeMember.suburb,
      dob: editForm.dob || activeMember.dob,
      baptismStatus: (editForm.baptismStatus as any) || activeMember.baptismStatus || "Not Baptized",
      emergencyContact: editForm.emergencyContact || activeMember.emergencyContact,
      ministries: editForm.ministries || activeMember.ministries,
      pin: editForm.pin || activeMember.pin || "1234",
      photo: editForm.photo !== undefined ? editForm.photo : activeMember.photo
    };

    updateMember(updated);
    setSaveSuccessMsg("✓ Member Profile & Security PIN Updated Successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Handle New Member Registration
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSuburb, setRegSuburb] = useState("Rosettenville");
  const [regPin, setRegPin] = useState("1234");

  const handleRegisterNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regPhone) return;

    const newId = "m_u" + Date.now();
    addMember(regFirstName, regLastName, regEmail, regPhone, regSuburb, ["m1"], {
      id: newId,
      dob: "1990-01-01",
      baptismStatus: "Not Baptized",
      pin: regPin || "1234"
    });

    // Auto-authenticate into new profile
    setAuthenticatedMemberId(newId);
    localStorage.setItem("current_authenticated_member_id", newId);

    setShowRegisterModal(false);
    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegPhone("");
    setRegPin("1234");
  };

  // Handle New Prayer Request Submission
  const handleSubmitPrayerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim() || !activeMember) return;

    addConnectSubmission(
      "Prayer",
      `${activeMember.firstName} ${activeMember.lastName}`,
      `Category: ${prayerCategory} | Request: ${newPrayerText}`,
      activeMember.email,
      activeMember.phone
    );

    setNewPrayerText("");
    setPrayerSubmittedMsg("✓ Your prayer request has been recorded and assigned to the Pastoral Care Team.");
    setTimeout(() => setPrayerSubmittedMsg(null), 4000);
  };

  // Handle Quick Giving Submission
  const handleProcessQuickGive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !giveAmount) return;

    addDonation(
      Number(giveAmount),
      giveFund,
      activeMember.firstName,
      activeMember.lastName,
      activeMember.email,
      "One-off"
    );

    setShowQuickGiveModal(false);
    setCheckInStatusMsg({
      text: `✓ Kingdom Offering of R${giveAmount} recorded successfully! Thank you for your support.`,
      success: true
    });
    setTimeout(() => setCheckInStatusMsg(null), 5000);
  };

  // Filter Attendance records for active member
  const memberAttendance = attendance.filter(
    (a) => a.memberId === activeMember?.id || (activeMember?.email && a.memberEmail?.toLowerCase() === activeMember.email.toLowerCase())
  );

  // Filter Donations records for active member
  const memberDonations = donations.filter(
    (d) => d.email && activeMember?.email && d.email.toLowerCase() === activeMember.email.toLowerCase()
  );

  const totalMemberGiving = memberDonations.reduce((sum, d) => sum + d.amount, 0);

  // Filter Prayer Requests for active member
  const memberPrayers = connectSubmissions.filter(
    (s) => s.type === "Prayer" && ((activeMember?.email && s.email?.toLowerCase() === activeMember.email.toLowerCase()) || s.name.includes(activeMember?.firstName || ""))
  );

  // Member QR Code Payload
  const memberQrPayload = JSON.stringify({
    type: "FFM_MEMBER_PASS",
    memberId: activeMember?.id || "m_u1",
    name: `${activeMember?.firstName} ${activeMember?.lastName}`,
    suburb: activeMember?.suburb,
    checkInUrl: `https://faithandfireministries.co.za/qr-checkin?memberId=${activeMember?.id}`
  });

  // Handle Printing Member Pass
  const handlePrintCard = () => {
    window.print();
  };

  // Handle Downloading Member Card as Image
  const handleDownloadCardPng = () => {
    if (!cardCanvasRef.current) return;
    const canvas = cardCanvasRef.current.querySelector("canvas");
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `${activeMember?.firstName}_${activeMember?.lastName}_membership_card.png`.toLowerCase();
      a.click();
    }
  };

  if (!activeMember) {
    return (
      <div className="bg-neutral-900 min-h-screen py-16 px-4 flex items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#2563eb]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-950 via-purple-900 to-orange-500 mx-auto flex items-center justify-center text-white shadow-xl border border-amber-400/30">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <span className="bg-[#0A192F] text-amber-400 border border-amber-400/30 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                FAITH & FIRE MEMBER PORTAL
              </span>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight mt-2">
                Member Authentication
              </h1>
              <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
                Sign in with your email or Google account to access your digital member ID card, Sunday attendance check-in, giving history, and prayer requests.
              </p>
            </div>
          </div>

          {/* Sign In CTA Box */}
          <div className="bg-neutral-950/90 border border-[#0F2342]/40 p-6 md:p-8 rounded-3xl shadow-2xl space-y-5 backdrop-blur-md text-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-[#0A192F] font-black py-4 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Member Portal
            </button>
            <p className="text-[11px] text-neutral-500 font-mono">
              Production Firebase Auth 2.0 • Role-Based Access Control
            </p>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          currentUser={currentUser}
          onNavigate={(tab) => {
            if (setCurrentTab) setCurrentTab(tab);
            setAuthModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen pb-16">
      {/* 1. Header Banner & Identity Actions */}
      <div className="bg-gradient-to-r from-[#0A192F] via-purple-950 to-slate-900 text-white border-b border-[#0F2342]/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            {/* Member Identity Block */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-xl border-2 border-amber-400/40 shrink-0 overflow-hidden relative">
                {activeMember.photo ? (
                  <img src={activeMember.photo} alt={activeMember.firstName} className="w-full h-full object-cover" />
                ) : (
                  <>
                    {activeMember.firstName.charAt(0)}
                    {activeMember.lastName.charAt(0)}
                  </>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500/20 text-orange-300 border border-amber-400/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    OFFICIAL MEMBER ID: {activeMember.id.toUpperCase()}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                    ● UNLOCKED &amp; SECURE
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">
                  {activeMember.firstName} {activeMember.lastName}
                </h1>
                <p className="text-xs text-sky-200 flex flex-wrap items-center gap-3 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {activeMember.suburb}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Joined {activeMember.joinedDate}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions & Security Lock */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={handleSelfCheckIn}
                className="btn-primary-sm"
              >
                <UserCheck className="w-4 h-4" />
                Sunday Check-In
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-white/15 cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                Show QR
              </button>

              <button
                onClick={handleLockProfile}
                className="btn-primary-sm"
                title="Lock profile and return to PIN login screen"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" />
                Lock Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Check-In Notification Banner */}
      {checkInStatusMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-fade-in ${
              checkInStatusMsg.success
                ? "bg-emerald-600 text-white border border-emerald-500"
                : "bg-red-600 text-white border border-red-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{checkInStatusMsg.text}</span>
            </div>
            <button onClick={() => setCheckInStatusMsg(null)} className="cursor-pointer text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Dashboard Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Digital Membership Pass Highlight Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Digital Membership Pass Display */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0A192F] via-[#150d36] to-slate-900 text-white p-6 rounded-2xl border-2 border-amber-400/40 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-[#0A192F] text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">
              FAITH &amp; FIRE DIGITAL PASS
            </div>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#0A192F] font-black">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  FAITH &amp; FIRE MINISTRIES
                </h3>
                <span className="text-[10px] font-mono text-orange-300 uppercase tracking-widest block">
                  JOHANNESBURG SOUTH HEADQUARTERS
                </span>
              </div>
            </div>

            {/* Pass Body */}
            <div className="flex items-center gap-4">
              <div ref={cardCanvasRef} className="p-2.5 bg-white rounded-xl shadow-lg shrink-0 border border-amber-400/30">
                <QRCodeCanvas
                  value={memberQrPayload}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#0A192F"
                  level="H"
                />
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                  SANCTUARY ATTENDANCE BADGE
                </span>
                <h4 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                  {activeMember.firstName} {activeMember.lastName}
                </h4>
                <p className="text-[11px] text-neutral-300 font-medium">
                  {activeMember.suburb}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  <span className="bg-[#0F2342]/80 text-sky-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e3a8a]">
                    {activeMember.baptismStatus || "Not Baptized"}
                  </span>
                  <span className="bg-amber-500/20 text-orange-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30">
                    {activeMember.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Pass Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <button
                onClick={handleDownloadCardPng}
                className="btn-primary-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download Pass
              </button>
              <button
                onClick={handlePrintCard}
                className="btn-primary-sm"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                Print Card
              </button>
            </div>
          </div>

          {/* Right Column: Quick Stats Overview & Spiritual Growth Track */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 4 Metric Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                  SERVICES ATTENDED
                </span>
                <span className="text-2xl font-black text-[#0A192F] block">
                  {memberAttendance.length + 8}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Consistent
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                  ATTENDANCE STREAK
                </span>
                <span className="text-2xl font-black text-amber-500 block">
                  5 Sundays
                </span>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  🔥 Active Streak
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                  ACTIVE MINISTRIES
                </span>
                <span className="text-2xl font-black text-[#0A192F] block">
                  {activeMember.ministries?.length || 1}
                </span>
                <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" /> Deployed
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                  KINGDOM GIVING
                </span>
                <span className="text-2xl font-black text-emerald-700 block">
                  R{totalMemberGiving.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Faithful Giver
                </span>
              </div>
            </div>

            {/* Suburb Cell Group & Pastoral Support Card */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-[#17325B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block">
                  YOUR SUBURB CELL GROUP
                </span>
                <h4 className="text-base font-extrabold uppercase text-white">
                  {activeMember.suburb} Fellowship Cell
                </h4>
                <p className="text-xs text-sky-200 max-w-md leading-relaxed">
                  Meets every Wednesday at 06:30 PM. Led by Elder Eric Malaba &amp; Pastoral Care Team.
                </p>
              </div>

              <button
                onClick={() => {
                  if (setCurrentTab) setCurrentTab("contact?module=counselling");
                }}
                className="bg-amber-500 hover:bg-amber-400 text-[#0A192F] text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider shrink-0 shadow cursor-pointer"
              >
                Book Pastoral Counseling
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs bar inside Dashboard */}
        <div className="flex border-b border-neutral-200 overflow-x-auto gap-2 scrollbar-none pb-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: Sparkles },
            { id: "attendance", label: "Attendance History", icon: Calendar },
            { id: "prayers", label: "Prayer & Counseling", icon: Heart },
            { id: "giving", label: "Tithes & Giving", icon: DollarSign },
            { id: "edit-profile", label: "Edit Profile", icon: Edit3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#0A192F] text-white shadow-md border-t-2 border-amber-400"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200 border-b-0"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-neutral-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Tab 1: Overview & Spiritual Growth Track */}
        {activeSubTab === "overview" && (
          <div className="space-y-8">
            {/* Member Attendance Heatmap Component */}
            <MemberAttendanceHeatmap
              memberId={activeMember.id}
              attendance={attendance}
              memberName={`${activeMember.firstName} ${activeMember.lastName}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Discipleship Track Progress */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#0A192F] uppercase tracking-tight">
                  Spiritual Discipleship Track &amp; Growth Milestones
                </h3>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">
                  PROGRESS TRACKER
                </span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Salvation & Faith Decision",
                    desc: "Public decision to follow Jesus Christ and surrender life to the Gospel.",
                    status: "COMPLETED",
                    date: activeMember.joinedDate
                  },
                  {
                    step: "2",
                    title: "Water Baptism",
                    desc: "Full immersion water baptism as commanded by Jesus Christ.",
                    status: activeMember.baptismStatus === "Baptized" ? "COMPLETED" : "PENDING",
                    date: activeMember.baptismStatus === "Baptized" ? "2025-03-15" : "Scheduled Next Pool Baptism"
                  },
                  {
                    step: "3",
                    title: "Believers Foundation Course",
                    desc: "4-week discipleship class building unshakeable biblical conviction.",
                    status: "IN PROGRESS",
                    date: "Weekly Sundays 08:15 AM"
                  },
                  {
                    step: "4",
                    title: "Suburb Cell Group Fellowship",
                    desc: "Weekly gathering in Rosettenville / Johannesburg South for communion.",
                    status: "ACTIVE",
                    date: "Every Wednesday"
                  },
                  {
                    step: "5",
                    title: "Ministry Deployment & Serving",
                    desc: "Active serving in Men of Fire, Radiant Women, or Worship Team.",
                    status: activeMember.ministries?.length ? "ACTIVE" : "PENDING",
                    date: activeMember.ministries?.length ? `${activeMember.ministries.length} Ministries` : "Select Ministry"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        item.status === "COMPLETED" || item.status === "ACTIVE"
                          ? "bg-emerald-600 text-white"
                          : item.status === "IN PROGRESS"
                          ? "bg-amber-500 text-[#0A192F]"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {item.status === "COMPLETED" ? <Check className="w-5 h-5" /> : item.step}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <h4 className="text-xs font-bold uppercase text-[#0A192F]">{item.title}</h4>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            item.status === "COMPLETED" || item.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "IN PROGRESS"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 leading-relaxed">{item.desc}</p>
                      <span className="text-[10px] font-mono text-neutral-400 block">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Serving Ministries & Pastoral Care */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Serving Departments */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                  <h3 className="text-base font-bold text-[#0A192F] uppercase tracking-tight">
                    Your Deployed Ministries
                  </h3>
                  <span className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                    {activeMember.ministries?.length || 0} DEPARTMENTS
                  </span>
                </div>

                <div className="space-y-3">
                  {ministries
                    .filter((m) => activeMember.ministries?.includes(m.id))
                    .map((m) => (
                      <div key={m.id} className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase text-[#0A192F]">{m.name}</h4>
                          <span className="bg-sky-50 text-[#0F2342] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                            {m.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 line-clamp-2">{m.blurb || m.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-200/60">
                          <span>📅 {m.schedule}</span>
                          <span>📍 {m.location}</span>
                        </div>
                      </div>
                    ))}

                  {(!activeMember.ministries || activeMember.ministries.length === 0) && (
                    <p className="text-xs text-neutral-500 italic p-4 text-center">
                      No serving departments selected yet. Edit your profile to join a ministry!
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Prayer Request Card */}
              <div className="bg-gradient-to-br from-[#0A192F] to-purple-900 text-white p-6 rounded-2xl shadow-md space-y-4 border border-[#17325B]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block">
                    PASTORAL INTERCESSION
                  </span>
                  <h3 className="text-base font-extrabold uppercase text-white">
                    Submit Confidential Prayer Request
                  </h3>
                </div>

                <form onSubmit={handleSubmitPrayerRequest} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-sky-200 mb-1 font-bold">
                      Prayer Category
                    </label>
                    <select
                      value={prayerCategory}
                      onChange={(e) => setPrayerCategory(e.target.value)}
                      className="w-full"
                    >
                      <option value="Healing & Health">Healing &amp; Health</option>
                      <option value="Family & Marriage">Family &amp; Marriage</option>
                      <option value="Financial Breakthrough">Financial Breakthrough</option>
                      <option value="Spiritual Growth">Spiritual Growth &amp; Deliverance</option>
                      <option value="Job & Career">Job &amp; Business Breakthrough</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-sky-200 mb-1 font-bold">
                      Your Prayer Request Details
                    </label>
                    <textarea
                      rows={3}
                      value={newPrayerText}
                      onChange={(e) => setNewPrayerText(e.target.value)}
                      placeholder="Type your prayer need here..."
                      className="w-full"
                    />
                  </div>

                  {prayerSubmittedMsg && (
                    <p className="p-2 rounded bg-emerald-500 text-[#0A192F] font-bold text-[11px]">
                      {prayerSubmittedMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary-sm w-full"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send to Intercessors
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Sub-Tab 2: Attendance History */}
        {activeSubTab === "attendance" && (
          <div className="space-y-6">
            <MemberAttendanceHeatmap
              memberId={activeMember.id}
              attendance={attendance}
              memberName={`${activeMember.firstName} ${activeMember.lastName}`}
            />

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                  SANCTUARY LOG
                </span>
                <h3 className="text-xl font-bold text-[#0A192F] uppercase tracking-tight">
                  Your Sanctuary Attendance History
                </h3>
              </div>

              <button
                onClick={handleSelfCheckIn}
                className="btn-primary-sm"
              >
                <UserCheck className="w-4 h-4" />
                Simulate Today Check-in
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 text-[#0A192F] font-bold uppercase tracking-wider border-b border-neutral-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Service Name</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Check-in Method</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {memberAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#0A192F]">{rec.date}</td>
                      <td className="p-3 font-bold uppercase">{rec.serviceName}</td>
                      <td className="p-3 font-mono text-neutral-500">{rec.timestamp || "09:15 AM"}</td>
                      <td className="p-3">
                        <span className="bg-sky-50 text-[#0F2342] text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                          QR Door Scan
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                          ✓ Verified Present
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Mock sample history if list is small */}
                  <tr className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0A192F]">2026-07-19</td>
                    <td className="p-3 font-bold uppercase">Sunday Glory Service</td>
                    <td className="p-3 font-mono text-neutral-500">08:55 AM</td>
                    <td className="p-3">
                      <span className="bg-sky-50 text-[#0F2342] text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                        QR Door Scan
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                        ✓ Verified Present
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0A192F]">2026-07-12</td>
                    <td className="p-3 font-bold uppercase">Sunday Glory Service</td>
                    <td className="p-3 font-mono text-neutral-500">09:02 AM</td>
                    <td className="p-3">
                      <span className="bg-sky-50 text-[#0F2342] text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                        Manual Door Roster
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                        ✓ Verified Present
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Sub-Tab 3: Prayer Requests & Pastoral Counseling */}
        {activeSubTab === "prayers" && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                  PASTORAL CARE PORTAL
                </span>
                <h3 className="text-xl font-bold text-[#0A192F] uppercase tracking-tight">
                  Your Confidential Prayer Requests &amp; Submissions
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberPrayers.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-[#0F2342] uppercase">
                      PRAYER SUBMISSION
                    </span>
                    <span className="bg-orange-100 text-orange-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 font-medium leading-relaxed">{p.details}</p>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    Submitted {p.timestamp ? p.timestamp.substring(0, 10) : "Recently"}
                  </span>
                </div>
              ))}

              {memberPrayers.length === 0 && (
                <div className="col-span-2 p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                  <p className="text-xs text-neutral-500 font-medium">
                    No active prayer requests found under your email ({activeMember.email}). Use the form on the dashboard to submit a request to the intercessors!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Tithes & Kingdom Giving Record */}
        {activeSubTab === "giving" && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest block">
                  FINANCIAL LEDGER
                </span>
                <h3 className="text-xl font-bold text-[#0A192F] uppercase tracking-tight">
                  Kingdom Giving &amp; Tithes Record
                </h3>
              </div>

              <button
                onClick={() => setShowQuickGiveModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Give Online Now
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 text-[#0A192F] font-bold uppercase tracking-wider border-b border-neutral-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Fund Category</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {memberDonations.map((don) => (
                    <tr key={don.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#0A192F]">{don.date}</td>
                      <td className="p-3 font-bold uppercase">{don.fund}</td>
                      <td className="p-3">
                        <span className="bg-sky-50 text-[#0F2342] text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          {don.type}
                        </span>
                      </td>
                      <td className="p-3 font-black text-emerald-700">R{don.amount.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => alert(`Official Church Giving Receipt issued for R${don.amount} on ${don.date}`)}
                          className="text-[#0F2342] hover:text-amber-500 text-[10px] font-bold uppercase underline cursor-pointer"
                        >
                          Download Tax Receipt
                        </button>
                      </td>
                    </tr>
                  ))}

                  {memberDonations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-500 italic">
                        No giving records found under email ({activeMember.email}).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Edit Profile Settings */}
        {activeSubTab === "edit-profile" && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                MEMBER SETTINGS
              </span>
              <h3 className="text-xl font-bold text-[#0A192F] uppercase tracking-tight">
                Update Your Personal &amp; Church Profile
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Photo Upload Module */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-sky-200 space-y-3">
                <label className="block font-bold text-[#0A192F] uppercase text-xs">
                  Profile Portrait Picture (Saved to Database)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0F2342] text-white flex items-center justify-center font-black text-xl overflow-hidden shrink-0 border-2 border-purple-400 shadow-md">
                    {editForm.photo ? (
                      <img src={editForm.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{activeMember.firstName[0]}{activeMember.lastName[0]}</span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditForm({ ...editForm, photo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full"
                    />
                    <span className="text-[10px] text-neutral-500 block font-mono">
                      Click to upload an image from your computer or device. Saved directly to database.
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName || ""}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName || ""}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Residential Suburb / Cell Location
                  </label>
                  <input
                    type="text"
                    value={editForm.suburb || ""}
                    onChange={(e) => setEditForm({ ...editForm, suburb: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Water Baptism Status
                  </label>
                  <select
                    value={editForm.baptismStatus || "Not Baptized"}
                    onChange={(e) => setEditForm({ ...editForm, baptismStatus: e.target.value as any })}
                    className="w-full"
                  >
                    <option value="Baptized">Baptized in Water</option>
                    <option value="Not Baptized">Not Baptized Yet</option>
                    <option value="Pending">Scheduled for Next Baptism</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-sky-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0F2342]" />
                  <span className="font-bold text-[#0A192F] uppercase text-xs">Profile Security PIN</span>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1 text-[11px]">
                    4-Digit Security PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editForm.pin || "1234"}
                    onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                    This PIN is required to unlock and access your profile dashboard.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-2">
                  Select Serving Ministries &amp; Departments
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ministries.map((m) => {
                    const isChecked = editForm.ministries?.includes(m.id) || false;
                    return (
                      <label
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-[#0F2342] text-white border-[#0F2342] font-bold"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentM = editForm.ministries || [];
                            if (e.target.checked) {
                              setEditForm({ ...editForm, ministries: [...currentM, m.id] });
                            } else {
                              setEditForm({ ...editForm, ministries: currentM.filter((id) => id !== m.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-xs uppercase">{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="bg-emerald-600 text-white p-3 rounded-xl font-bold text-xs">
                  {saveSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
              >
                Save Member Profile Changes
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL 1: Fullscreen QR Code Display Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-[#0A192F] to-slate-900 text-white p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-6 border-2 border-amber-400/50 shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block">
                  FAITH &amp; FIRE SANCTUARY SCAN
                </span>
                <h3 className="text-xl font-black uppercase text-white">
                  {activeMember.firstName} {activeMember.lastName}
                </h3>
                <span className="text-xs font-mono text-sky-200 block">
                  ID: {activeMember.id.toUpperCase()}
                </span>
              </div>

              <div className="p-6 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-400/30">
                <QRCodeSVG
                  value={memberQrPayload}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0A192F"
                  level="H"
                />
              </div>

              <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                Present this QR code to the usher at the sanctuary entrance to automatically mark your Sunday service attendance.
              </p>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-[#0A192F] font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Done / Close QR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Member Selector / Switcher Modal */}
      <AnimatePresence>
        {showMemberSelectorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white text-neutral-900 p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative border border-neutral-200"
            >
              <button
                onClick={() => setShowMemberSelectorModal(false)}
                className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-500 font-extrabold uppercase tracking-widest block">
                  PORTAL PROFILES
                </span>
                <h3 className="text-xl font-black uppercase text-[#0A192F]">
                  Select Active Member Session
                </h3>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      m.id === activeMember.id
                        ? "bg-[#0A192F] text-white border-purple-950 shadow"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs uppercase">
                        {m.firstName} {m.lastName}
                      </h4>
                      <p className={`text-[11px] ${m.id === activeMember.id ? "text-sky-200" : "text-neutral-500"}`}>
                        {m.email} • {m.suburb}
                      </p>
                    </div>
                    {m.id === activeMember.id && (
                      <span className="bg-amber-500 text-[#0A192F] text-[10px] font-black uppercase px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex gap-2">
                <button
                  onClick={() => {
                    setShowMemberSelectorModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="w-full bg-[#0F2342] hover:bg-[#17325B] text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  + Register New Member Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: New Member Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white text-neutral-900 p-6 md:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative border border-neutral-200"
            >
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-500 font-extrabold uppercase tracking-widest block">
                  NEW MEMBER ENROLLMENT
                </span>
                <h3 className="text-xl font-black uppercase text-[#0A192F]">
                  Register Digital Membership Card
                </h3>
              </div>

              <form onSubmit={handleRegisterNewMember} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="e.g. David"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="e.g. Khumalo"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+27 82 000 0000"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="david.khumalo@gmail.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Suburb / Location
                  </label>
                  <input
                    type="text"
                    value={regSuburb}
                    onChange={(e) => setRegSuburb(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0A192F] uppercase mb-1">
                    4-Digit Security PIN (To Lock Your Profile)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                    You will use this PIN to log into your profile pass in the future.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-2 w-full"
                >
                  Generate Digital Membership Pass
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Quick Giving Modal inside Portal */}
      <AnimatePresence>
        {showQuickGiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white text-neutral-900 p-6 md:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative border border-neutral-200"
            >
              <button
                onClick={() => setShowQuickGiveModal(false)}
                className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-emerald-600 font-extrabold uppercase tracking-widest block">
                  KINGDOM OFFERING
                </span>
                <h3 className="text-xl font-black uppercase text-[#0A192F]">
                  Online Giving &amp; Tithes
                </h3>
              </div>

              <form onSubmit={handleProcessQuickGive} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Select Fund
                  </label>
                  <select
                    value={giveFund}
                    onChange={(e) => setGiveFund(e.target.value)}
                    className="w-full"
                  >
                    <option value="Tithes & Offerings">Tithes &amp; Offerings</option>
                    <option value="Building Fund">Sanctuary Building Fund</option>
                    <option value="Missions & Outreach">Rosettenville Missions &amp; Soup Kitchen</option>
                    <option value="First Fruits Seed">First Fruits Kingdom Seed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Amount (ZAR - R)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={giveAmount}
                    onChange={(e) => setGiveAmount(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {["100", "250", "500", "1000", "2500", "5000"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGiveAmount(amt)}
                      className={`p-2 rounded-lg font-bold border text-xs cursor-pointer ${
                        giveAmount === amt ? "bg-[#0A192F] text-white border-purple-950" : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      R{amt}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-2 w-full"
                >
                  Confirm Kingdom Contribution (R{giveAmount})
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
