import React, { useState, useEffect, useRef, useMemo } from "react";
import { useChurch, generateMemberPin } from "../context/ChurchContext";
import { Member, ChurchEvent, CellGroup } from "../types";
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
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  LayoutDashboard,
  Search,
  ArrowUpRight,
  CheckSquare,
  HelpCircle,
  Globe,
  CalendarClock,
  MessageSquare,
  Camera,
  Trash2,
  ImageUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "firebase/auth";
import { auth, storage } from "../lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Html5Qrcode } from "html5-qrcode";

interface MemberDashboardProps {
  setCurrentTab?: (tab: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ setCurrentTab }) => {
  const {
    members,
    addMember,
    updateMemberProfile,
    checkInMember,
    verifyMemberPin,
    setMemberPin,
    attendance,
    donations,
    connectSubmissions,
    addConnectSubmission,
    addDonation,
    ministries,
    cellGroups,
    joinCellGroup,
    events,
    milestoneRequests,
    requestMilestone,
    currentUser,
    userRole,
    communications,
    sendCommunication,
    markCommunicationRead,
    memberApplications
  } = useChurch();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Authenticated Member Session state stored in localStorage or null.
  // Sessions expire after 24 hours, and every localStorage read/write is
  // guarded so a storage-blocked browser degrades to a page-load-only
  // session instead of crashing or leaving a stale session behind.
  const SESSION_KEY = "current_authenticated_member_id";
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

  const readMemberSession = (): string | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: unknown; ts?: unknown };
      if (typeof parsed.id !== "string" || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > SESSION_TTL_MS) return null;
      return parsed.id;
    } catch {
      return null;
    }
  };

  const writeMemberSession = (id: string) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
    } catch {
      // Storage unavailable — session lives for this page load only.
    }
  };

  const clearMemberSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable — nothing to clear.
    }
  };

  const [authenticatedMemberId, setAuthenticatedMemberId] = useState<string | null>(() => {
    const saved = readMemberSession();
    if (saved && members.some((m) => m.id === saved)) {
      return saved;
    }
    return null;
  });

  // Invalidate the session whenever it no longer resolves to a known member
  // profile (covers profiles deleted or replaced after the initializer ran).
  useEffect(() => {
    if (authenticatedMemberId && !members.some((m) => m.id === authenticatedMemberId)) {
      setAuthenticatedMemberId(null);
      clearMemberSession();
    }
  }, [members, authenticatedMemberId]);

  // Security Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "attendance" | "prayers" | "giving" | "communications" | "edit-profile">("overview");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMemberSelectorModal, setShowMemberSelectorModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEventCheckInModal, setShowEventCheckInModal] = useState(false);
  const [selectedCheckInEvent, setSelectedCheckInEvent] = useState("");
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [qrScannerReady, setQrScannerReady] = useState(false);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Admin-style top bar state (module search + notifications)
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sidebar menu (member functions — same design as the admin portal)
  const memberMenuItems = [
    { id: "overview", label: "DASHBOARD OVERVIEW", icon: LayoutDashboard },
    { id: "attendance", label: "ATTENDANCE HISTORY", icon: Calendar },
    { id: "prayers", label: "PRAYER & COUNSELING", icon: Heart },
    { id: "giving", label: "TITHES & GIVING", icon: DollarSign },
    { id: "communications", label: "NOTIFICATIONS & CHAT", icon: MessageSquare },
    { id: "edit-profile", label: "EDIT PROFILE", icon: Edit3 }
  ];

  const filteredMemberModules = memberMenuItems.filter((m) =>
    m.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    firstName: memberApplications.find((a) => a.ownerId === currentUser.uid)?.firstName
      || currentUser.displayName?.split(" ")[0] || "Member",
    lastName: memberApplications.find((a) => a.ownerId === currentUser.uid)?.lastName
      || currentUser.displayName?.split(" ").slice(1).join(" ") || "User",
    email: currentUser.email || "",
    phone: memberApplications.find((a) => a.ownerId === currentUser.uid)?.phone || "",
    suburb: memberApplications.find((a) => a.ownerId === currentUser.uid)?.suburb || "Johannesburg",
    joinedDate: memberApplications.find((a) => a.ownerId === currentUser.uid)?.joinedDate
      || new Date().toISOString().split("T")[0],
    ministries: memberApplications.find((a) => a.ownerId === currentUser.uid)?.ministries || ["m1"],
    status: "Active" as const,
    photo: memberApplications.find((a) => a.ownerId === currentUser.uid)?.photo || currentUser.photoURL || undefined,
    pin: ""
  } : null);

  // NOTE: activeMember may be a freshly constructed fallback object on every
  // render, so the effect must depend on stable identity keys (id/email)
  // rather than the object reference — otherwise the dashboard re-renders
  // infinitely and React bails out with "Maximum update depth exceeded".
  useEffect(() => {
    if (activeMember) {
      setEditForm({ ...activeMember });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatedMemberId, activeMember?.id, activeMember?.email]);

  // Handle Login Authentication with Security PIN
  // The PIN is verified server-side by the verifyMemberPin callable; the
  // client never compares PINs against locally held state.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const term = loginIdentifier.trim().toLowerCase();
    const pin = loginPin.trim();

    if (!term || !pin) {
      setLoginError("Please enter your Member Email, Phone or ID and Security PIN.");
      return;
    }

    try {
      const result = await verifyMemberPin(term, pin);
      setAuthenticatedMemberId(result.memberId);
      writeMemberSession(result.memberId);
      setLoginIdentifier("");
      setLoginPin("");
      setLoginError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed.";
      if (message.includes("not found")) {
        setLoginError("Member profile not found. Please check your details or Register a new profile.");
      } else if (message.includes("Too many")) {
        setLoginError("Too many PIN attempts. Please wait a minute and try again.");
      } else if (message.includes("PIN")) {
        setLoginError("Incorrect Security PIN. If you have never set one, use the PIN shown when your profile was created.");
      } else {
        setLoginError("Unable to verify your PIN right now. Please try again.");
      }
    }
  };

  // Handle Switching Member profile with mandatory Security PIN re-authentication
  const handleSelectMember = (id: string) => {
    setShowMemberSelectorModal(false);
    const target = members.find((m) => m.id === id);
    if (target) {
      setLoginIdentifier(target.email || target.id);
    }
    setAuthenticatedMemberId(null);
    clearMemberSession();
  };

  // Events created by admins become the check-in targets. Weekly services
  // (repeat: "weekly") are constant repeating events shown with a badge.
  const checkInEventOptions: ChurchEvent[] = (events || []).filter((ev) => !ev.archived);

  // Camera-based event check-in: the member scans the event QR code (as
  // generated by the admin calendar, which encodes ?event=<eventId>). The
  // scanned code resolves to the event and the check-in is recorded as
  // Pending until an usher or administrator verifies it.
  const stopQrScanner = async () => {
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // The scanner may already be stopped — ignore.
    }
  };

  const startQrScanner = async () => {
    setQrScanError(null);
    setQrScannerReady(false);
    try {
      const scanner = new Html5Qrcode("member-qr-scanner");
      qrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => handleScannedQr(decodedText),
        () => {}
      );
      setQrScannerReady(true);
    } catch (err) {
      console.warn("Camera unavailable:", err);
      setQrScanError("Camera could not be started. Allow camera access, or select the event manually below.");
    }
  };

  const handleScannedQr = async (decodedText: string) => {
    if (!activeMember) return;
    // The admin event QR encodes a URL like <origin>/?event=<eventId>; the
    // generic QR presets encode ?service=<service name>. Resolve both.
    const match = (() => {
      try {
        const params = new URLSearchParams(new URL(decodedText).search);
        const evId = params.get("event");
        if (evId) return { kind: "event", value: evId } as const;
        const service = params.get("service");
        if (service) return { kind: "service", value: service } as const;
      } catch {
        // Not a URL payload — treat as a bare event code below.
      }
      return { kind: "code", value: decodedText.trim() } as const;
    })();

    const ev = checkInEventOptions.find((e) =>
      match.kind === "event"
        ? e.id === match.value
        : e.title.trim().toLowerCase() === match.value.toLowerCase()
    );
    if (!ev) {
      setQrScanError("This QR code does not match a known event. Please scan the event QR code displayed by the church.");
      return;
    }
    await stopQrScanner();
    setSelectedCheckInEvent(ev.title);
    setShowEventCheckInModal(false);
    const msg = await checkInMember(activeMember.id, ev.title);
    const isSuccess = msg.startsWith("Success");
    setCheckInStatusMsg({ text: msg, success: isSuccess });
    setTimeout(() => setCheckInStatusMsg(null), 6000);
  };

  // Start the camera scanner while the check-in modal is open and always
  // release the camera when it closes or the portal unmounts.
  useEffect(() => {
    if (showEventCheckInModal) {
      startQrScanner();
    } else {
      stopQrScanner();
    }
    return () => {
      stopQrScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEventCheckInModal]);

  useEffect(() => () => { stopQrScanner(); }, []);

  // Handle Instant Self Check-in (opens the camera scanner modal)
  const handleOpenEventCheckIn = () => {
    if (!activeMember) return;
    setSelectedCheckInEvent("");
    setQrScanError(null);
    setShowManualCheckIn(false);
    setShowEventCheckInModal(true);
  };

  // Member self check-in is queued as Pending until an usher or
  // administrator verifies it — members can never self-verify.
  const handleEventCheckIn = async (serviceName?: string) => {
    if (!activeMember) return;
    const target = serviceName || selectedCheckInEvent;
    if (!target) return;
    await stopQrScanner();
    setShowEventCheckInModal(false);
    const msg = await checkInMember(activeMember.id, target);
    const isSuccess = msg.startsWith("Success");
    setCheckInStatusMsg({ text: msg, success: isSuccess });
    setTimeout(() => setCheckInStatusMsg(null), 6000);
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
      photo: editForm.photo !== undefined ? editForm.photo : activeMember.photo
    };

    updateMemberProfile(updated);

    // A PIN entered in the edit form is applied server-side (hashed) — it is
    // never part of the member document.
    const newPin = (editForm.pin || "").trim();
    if (newPin && newPin !== (activeMember as any).pin) {
      if (!/^\d{4,10}$/.test(newPin)) {
        setSaveSuccessMsg("Profile saved, but the Security PIN must be 4 to 10 digits.");
        setTimeout(() => setSaveSuccessMsg(null), 3500);
        return;
      }
      setMemberPin(activeMember.id, newPin)
        .then(() => {
          setSaveSuccessMsg("✓ Member Profile & Security PIN Updated Successfully!");
          setEditForm((prev) => ({ ...prev, pin: "" }));
          setTimeout(() => setSaveSuccessMsg(null), 3500);
        })
        .catch((err) => {
          console.warn("PIN update failed:", err);
          setSaveSuccessMsg("Profile saved, but the Security PIN could not be updated. Try again.");
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        });
    } else {
      setSaveSuccessMsg("✓ Member Profile Updated Successfully!");
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  // Avatar upload / delete / replace. Photos go to Firebase Storage under
  // the user's own avatar folder (owner-only write, public read) and the
  // download URL is what gets saved to the profile — never base64 blobs.
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!currentUser) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveSuccessMsg("Avatar must be smaller than 5MB. Please choose a compressed photo.");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      return;
    }
    const fileRef = storageRef(storage, `users/${currentUser.uid}/avatar/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);
    const task = uploadBytesResumable(fileRef, file);
    setAvatarUploading(true);
    task.on(
      "state_changed",
      () => {},
      (err) => {
        console.warn("Avatar upload failed:", err);
        setAvatarUploading(false);
        setSaveSuccessMsg("Avatar upload failed. Please try again.");
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          setEditForm((prev) => ({ ...prev, photo: downloadURL }));
          setAvatarUploading(false);
          setSaveSuccessMsg("✓ Avatar uploaded. Click Save Member Profile Changes to keep it.");
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        } catch (err) {
          console.warn("Avatar URL fetch failed:", err);
          setAvatarUploading(false);
        }
      }
    );
  };

  const handleDeleteAvatar = async () => {
    const currentPhoto = editForm.photo;
    if (currentPhoto && currentPhoto.startsWith("https://firebasestorage.googleapis.com")) {
      try {
        await deleteObject(storageRef(storage, currentPhoto));
      } catch {
        // The object may already be gone — the profile still clears below.
      }
    }
    setEditForm((prev) => ({ ...prev, photo: "" }));
    setSaveSuccessMsg("Avatar removed. Click Save Member Profile Changes to keep it.");
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Chat with the church office: thread messages are scoped to this member
  // (ownerUid == their auth uid) and read by the staff team.
  const [chatDraft, setChatDraft] = useState("");
  const chatThreadRef = useRef<HTMLDivElement>(null);

  const chatThread = communications.filter((c) => c.type === "message" && c.ownerUid === currentUser?.uid);

  const unreadCommCount = communications.filter((c) => !c.readBy.includes(currentUser?.uid || "")).length;

  const formatCommTime = (ts: any) => {
    if (!ts) return "";
    const ms = ts?.toMillis ? ts.toMillis() : typeof ts === "number" ? ts : Date.parse(ts);
    if (!ms) return "";
    return new Date(ms).toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSendChatMessage = async () => {
    if (!chatDraft.trim() || !currentUser) return;
    const ok = await sendCommunication({
      type: "message",
      body: chatDraft.trim(),
      audience: "member",
      ownerUid: currentUser.uid,
      senderRole: "member",
      senderName: `${activeMember.firstName} ${activeMember.lastName}`.trim() || "Member"
    });
    if (ok) {
      setChatDraft("");
      setTimeout(() => chatThreadRef.current?.scrollTo({ top: chatThreadRef.current.scrollHeight, behavior: "smooth" }), 200);
    } else {
      setCheckInStatusMsg({ text: "Error: Could not send your message. Please try again.", success: false });
      setTimeout(() => setCheckInStatusMsg(null), 6000);
    }
  };

  // Keep the chat scrolled to the newest message while on the tab.
  useEffect(() => {
    if (activeSubTab === "communications") {
      chatThreadRef.current?.scrollTo({ top: chatThreadRef.current.scrollHeight });
    }
  }, [chatThread.length, activeSubTab]);

  // Handle New Member Registration
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSuburb, setRegSuburb] = useState("Rosettenville");
  const [regPin, setRegPin] = useState("");

  const handleRegisterNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regPhone) return;

    const newId = "m_u" + Date.now();
    const created = addMember(regFirstName, regLastName, regEmail, regPhone, regSuburb, ["m1"], {
      id: newId,
      dob: "1990-01-01",
      baptismStatus: "Not Baptized",
      pin: regPin
    });

    // Auto-authenticate into new profile
    setAuthenticatedMemberId(newId);
    writeMemberSession(newId);

    const isStaffUser = !!userRole && ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"].includes(userRole);
    if (isStaffUser) {
      setSaveSuccessMsg(regPin
        ? "✓ Member profile registered successfully!"
        : `✓ Member profile registered! Their Security PIN is ${created.pin}. Keep it safe — it is needed to unlock the dashboard.`);
    } else {
      setSaveSuccessMsg(`✓ Membership application submitted! Your Security PIN is ${created.pin}. Keep it safe — it will unlock your dashboard once staff approve your application.`);
    }
    setTimeout(() => setSaveSuccessMsg(null), 5000);

    setShowRegisterModal(false);
    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegPhone("");
    setRegPin("");
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

  // Only usher/admin-verified check-ins count towards stats, streaks and the
  // heatmap. Pending member requests show in the history table with a
  // "Pending Verification" chip but never inflate the record.
  const verifiedMemberAttendance = memberAttendance.filter(
    (a) => a.status === "Verified" || !a.status || a.status === "present"
  );
  const pendingMemberAttendance = memberAttendance.filter((a) => a.status === "Pending");
  const rejectedMemberAttendance = memberAttendance.filter((a) => a.status === "Rejected");

  // Real consecutive-Sunday attendance streak computed from attendance records.
  const attendanceStreak = useMemo(() => {
    const sundayDates = verifiedMemberAttendance
      .map((a) => {
        const d = new Date(a.date);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d): d is Date => d !== null && d.getDay() === 0)
      .sort((a, b) => b.getTime() - a.getTime());
    if (sundayDates.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < sundayDates.length; i++) {
      const prev = new Date(sundayDates[i - 1]);
      prev.setDate(prev.getDate() - 7);
      if (sundayDates[i].getTime() === prev.getTime()) streak += 1;
      else break;
    }
    return streak;
  }, [verifiedMemberAttendance]);

  // Filter Donations records for active member
  const memberDonations = donations.filter(
    (d) => d.email && activeMember?.email && d.email.toLowerCase() === activeMember.email.toLowerCase()
  );

  const totalMemberGiving = memberDonations.reduce((sum, d) => sum + d.amount, 0);

  // Filter Prayer Requests for active member
  const memberPrayers = connectSubmissions.filter(
    (s) => s.type === "Prayer" && ((activeMember?.email && s.email?.toLowerCase() === activeMember.email.toLowerCase()) || s.name.includes(activeMember?.firstName || ""))
  );

  // Admin-style weekday analytics chart built from the member's own records.
  const memberWeekdayCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    verifiedMemberAttendance.forEach((a) => {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) counts[d.getDay()] += 1;
    });
    const max = Math.max(1, ...counts);
    return counts.map((c) => ({ count: c, height: c === 0 ? 8 : Math.round((c / max) * 100) }));
  }, [verifiedMemberAttendance]);

  // Admin-style action alerts derived from real member data.
  const memberAlerts = useMemo(() => {
    const alerts: { id: string; type: string; title: string; desc: string; action: string; targetTab?: string }[] = [];
    if (verifiedMemberAttendance.length === 0) {
      alerts.push({
        id: "alert-checkin",
        type: "blue",
        title: "No Check-in Yet",
        desc: "You have not checked in to a service yet. Check in at your next service to start your attendance record.",
        action: "Check In Now",
        targetTab: "attendance"
      });
    }
    if (memberPrayers.length === 0) {
      alerts.push({
        id: "alert-prayer",
        type: "red",
        title: "Share a Prayer Request",
        desc: "The pastoral care team is standing by. Submit a confidential prayer request from your dashboard.",
        action: "Prayer & Counseling",
        targetTab: "prayers"
      });
    }
    if (pendingMemberAttendance.length > 0) {
      alerts.push({
        id: "alert-pending",
        type: "amber",
        title: "Check-in Awaiting Verification",
        desc: `${pendingMemberAttendance.length} check-in${pendingMemberAttendance.length > 1 ? "s are" : " is"} pending usher or administrator verification. Your attendance counts once verified.`,
        action: "View Pending Check-ins",
        targetTab: "attendance"
      });
    }
    return alerts;
  }, [memberAttendance, memberPrayers, pendingMemberAttendance, verifiedMemberAttendance]);

  // The member's cell group — stored on their member record (or the pending
  // application for brand-new signups) via the joinCellGroup callable, with a
  // localStorage fallback so the module renders instantly after joining.
  const memberCellGroupId =
    ((activeMember as any)?.cellGroupId) ||
    (() => {
      try {
        return localStorage.getItem("member_cell_group_id");
      } catch {
        return null;
      }
    })();
  const activeCellGroup = cellGroups.find((g) => g.id === memberCellGroupId && !g.archived) || null;

  // Nearby cell groups ranked by how close they are to the member's suburb:
  // exact suburb match first, then broader area match, then the rest.
  const nearbyCellGroups = useMemo(() => {
    const memberSuburb = (activeMember?.suburb || "").trim().toLowerCase();
    const score = (g: CellGroup) => {
      const gs = (g.suburb || "").trim().toLowerCase();
      const ga = (g.area || "").trim().toLowerCase();
      if (!memberSuburb) return 2;
      if (memberSuburb === gs) return 0;
      if (gs && (gs.includes(memberSuburb) || memberSuburb.includes(gs))) return 0.5;
      if (ga && (ga.includes(memberSuburb) || memberSuburb.includes(ga))) return 1;
      return 2;
    };
    return [...cellGroups.filter((g) => !g.archived && g.id !== memberCellGroupId)].sort(
      (a, b) => score(a) - score(b) || a.name.localeCompare(b.name)
    );
  }, [cellGroups, memberCellGroupId, activeMember?.suburb]);

  const handleJoinCellGroup = async (groupId: string) => {
    const ok = await joinCellGroup(groupId);
    setCheckInStatusMsg(
      ok
        ? { text: "✓ You have joined your cell group. It is now part of your dashboard.", success: true }
        : { text: "Error: Could not join the cell group. Please try again.", success: false }
    );
    setTimeout(() => setCheckInStatusMsg(null), 6000);
  };

  // Member QR Code Payload — the usher scans this at the door. The encoded
  // URL carries this member's id and opens the QR check-in kiosk with their
  // profile pre-filled, so staff can verify their attendance instantly.
  const memberQrPayload = JSON.stringify({
    type: "FFM_MEMBER_PASS",
    memberId: activeMember?.id || "",
    name: `${activeMember?.firstName || ""} ${activeMember?.lastName || ""}`.trim(),
    suburb: activeMember?.suburb,
    checkInUrl: activeMember?.id ? `${window.location.origin}/#check-in?memberId=${activeMember.id}` : ""
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

  // Mounted in BOTH the locked gate and the unlocked dashboard — otherwise
  // the success banner carrying the one-time member PIN is destroyed the
  // instant the profile resolves after sign-in, and the member could never
  // unlock their portal again.
  const authModalEl = (
    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      currentUser={currentUser}
      onNavigate={(tab) => {
        if (setCurrentTab) setCurrentTab(tab);
        setAuthModalOpen(false);
      }}
    />
  );

  return (
    <>
      {!activeMember ? (
        <div className="bg-neutral-900 min-h-screen py-16 px-4 flex items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#2563eb]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#1e1548] mx-auto flex items-center justify-center text-white shadow-xl border border-amber-400/30">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <span className="bg-[#1e1548] text-amber-400 border border-amber-400/30 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest">
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#1e1548] font-black py-4 rounded-full uppercase tracking-wider transition-all duration-300 ease-out cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-6px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Member Portal
            </button>
            <button
              onClick={() => {
                if (setCurrentTab) setCurrentTab("home");
              }}
              className="w-full bg-white/5 border border-white/15 hover:bg-white/10 text-neutral-300 font-bold py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-[11px] flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Return to Website
            </button>
            <p className="text-[11px] text-neutral-500 font-mono">
              Production Firebase Auth 2.0 • Role-Based Access Control
            </p>
          </div>
        </div>
      </div>
      ) : (
        <div className="min-h-screen bg-[#F4F7FE] flex flex-col lg:flex-row font-sans">
          {/* Sidebar navigation (admin-style) */}
          <aside className="w-full lg:w-64 bg-white text-neutral-800 flex flex-col justify-between shrink-0 border-r border-neutral-100 h-screen sticky top-0 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-6 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
              {/* Brand header */}
              <div className="flex items-center gap-3 px-2">
                <img src="/images/Logo.png" alt="Faith & Fire Logo" className="h-8 object-contain" />
              </div>

              {/* Menus */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">
                    MY MENU
                  </h4>
                  <nav className="space-y-1">
                    {memberMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSubTab(item.id as any)}
                          className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left ${
                            isActive
                              ? "bg-[#1e1548] text-white shadow-sm"
                              : "text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} />
                          {item.label}
                          {item.id === "communications" && unreadCommCount > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-[#1e1548] text-[9px] font-black">
                              {unreadCommCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* General actions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">
                    GENERAL
                  </h4>
                  <nav className="space-y-1">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                    >
                      <QrCode className="w-5 h-5 shrink-0 text-neutral-400" />
                      My Digital Pass
                    </button>
                    <button
                      onClick={handleOpenEventCheckIn}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                    >
                      <UserCheck className="w-5 h-5 shrink-0 text-neutral-400" />
                      Event Check-In
                    </button>
                    <button
                      onClick={() => {
                        if (setCurrentTab) setCurrentTab("home");
                      }}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                    >
                      <Globe className="w-5 h-5 shrink-0 text-neutral-400" />
                      Return to Website
                    </button>
                    <button
                      onClick={() => alert("Connecting with church tech support...")}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                    >
                      <HelpCircle className="w-5 h-5 shrink-0 text-neutral-400" />
                      Help
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to log out of the Member Portal?")) {
                          signOut(auth).finally(() => {
                            window.location.href = "/";
                          });
                        }
                      }}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-left text-neutral-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-5 h-5 shrink-0 text-neutral-400" />
                      Logout
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Sidebar footer info */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-[#1e1548] to-[#150d36] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-[#38BDF8]/20">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider">Member Portal</h3>
                    <p className="text-[10px] text-white/60">Protected by secure PIN access.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content pane */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto space-y-8">

              {/* Top Bar: Search & Profile */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-transparent py-2">
                <div className="relative w-full md:w-96 flex-1 md:flex-none">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    className="w-full bg-white border border-neutral-100 rounded-full pl-10 pr-12 py-2.5 text-sm font-medium text-neutral-600 focus:bg-white transition-all outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-neutral-200 px-2 py-1 rounded text-[10px] font-bold text-neutral-400 shadow-sm pointer-events-none">
                    ⌘ F
                  </div>

                  {showSearchDropdown && searchQuery.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        {filteredMemberModules.length > 0 ? (
                          filteredMemberModules.map((module) => {
                            const Icon = module.icon;
                            return (
                              <button
                                key={module.id}
                                onClick={() => {
                                  setActiveSubTab(module.id as any);
                                  setSearchQuery("");
                                  setShowSearchDropdown(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center gap-3 transition-colors text-sm font-bold text-neutral-700 border-b border-neutral-50 last:border-0 cursor-pointer"
                              >
                                <Icon className="w-5 h-5 text-neutral-400" />
                                {module.label}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-sm text-neutral-400">No modules found matching "{searchQuery}"</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right Actions & Profile */}
                <div className="flex items-center gap-5 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setActiveSubTab("prayers")}
                    className="text-neutral-400 hover:text-[#1e1548] transition-colors cursor-pointer relative"
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="text-neutral-400 hover:text-[#1e1548] transition-colors relative cursor-pointer"
                    >
                      <Bell className="w-5 h-5" />
                      {memberPrayers.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#fb923c] rounded-full border-2 border-[#F4F7FE]"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-neutral-50 flex justify-between items-center bg-white">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Notifications</span>
                          <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-bold">
                            {memberPrayers.length} New
                          </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {memberPrayers.length === 0 ? (
                            <div className="p-8 text-center text-xs text-neutral-400 font-bold uppercase tracking-wider">No new notifications</div>
                          ) : (
                            memberPrayers.slice(0, 5).map((p) => (
                              <div
                                key={p.id}
                                className="p-4 border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors cursor-pointer"
                                onClick={() => { setShowNotifications(false); setActiveSubTab("prayers"); }}
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="text-xs font-bold text-[#1e1548] truncate pr-2">Prayer Request</span>
                                  <span className="text-[9px] font-medium text-neutral-400 shrink-0">{p.timestamp ? p.timestamp.substring(0, 10) : ""}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-orange-50 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{p.status}</span>
                                  <span className="text-[10px] text-neutral-500 line-clamp-1">Pastoral care in progress</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {memberPrayers.length > 0 && (
                          <div
                            className="p-3 bg-white text-center border-t border-neutral-50 text-[11px] font-bold text-[#1e1548] hover:text-[#38bdf8] cursor-pointer transition-colors"
                            onClick={() => { setShowNotifications(false); setActiveSubTab("prayers"); }}
                          >
                            View All
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
                    <div className="w-9 h-9 rounded-full bg-neutral-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                      {activeMember.photo ? (
                        <img src={activeMember.photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-[#1e1548]">{activeMember.firstName.charAt(0)}{activeMember.lastName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="text-left hidden md:block cursor-pointer flex items-center gap-1 group">
                      <span className="block text-sm font-bold text-neutral-700 group-hover:text-[#1e1548] transition-colors">{activeMember.firstName} {activeMember.lastName} <ChevronDown className="w-3 h-3 inline-block ml-1 text-neutral-400" /></span>
                    </div>
                  </div>
                </div>
              </div>

      {/* Global Check-In Notification Banner */}
      {checkInStatusMsg && (
        <div className="mt-2">
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
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
      <div className="space-y-8">

        {/* Page header (admin-style) - Hidden in clean template, replaced by topbar context */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">
              Member Dashboard
            </h1>
            <p className="text-sm text-neutral-500 font-medium mt-1">
              Manage your membership profile, attendance, giving, and prayer requests.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-[#1e1548]/10 text-[#1e1548] border border-[#1e1548]/20 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                OFFICIAL MEMBER ID: {activeMember.id.toUpperCase()}
              </span>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                ● UNLOCKED &amp; SECURE
              </span>
              <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                <MapPin className="w-3 h-3 inline -mt-0.5" /> {activeMember.suburb} • Joined {activeMember.joinedDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenEventCheckIn}
              className="bg-[#1e1548] hover:bg-[#1e1548] text-white font-bold text-sm py-2.5 px-5 rounded-full transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CalendarClock className="w-4 h-4" />
              Event Check-In
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="bg-white border border-[#1e1548] text-[#1e1548] hover:bg-neutral-50 font-bold text-sm py-2.5 px-5 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Show QR
            </button>
          </div>
        </div>

        {/* Stat Cards (admin-style) — overview tab only. */}
        {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-4 right-4">
              <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#1e1548]/10 text-[#1e1548] flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{verifiedMemberAttendance.length}</h2>
                <span className="text-[13px] font-medium text-neutral-400">Services Attended</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-4 right-4">
              <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#fb923c]/10 text-[#fb923c] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{attendanceStreak}</h2>
                <span className="text-[13px] font-medium text-neutral-400">Attendance Streak</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-4 right-4">
              <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{activeMember.ministries?.length || 1}</h2>
                <span className="text-[13px] font-medium text-neutral-400">Active Ministries</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-4 right-4">
              <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">R{totalMemberGiving.toLocaleString()}</h2>
                <span className="text-[13px] font-medium text-neutral-400">Kingdom Giving</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Row 2: Digital Pass + Analytics + Alerts — overview tab only */}
        {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Digital Membership Pass Display */}
          <div className="lg:col-span-4 bg-white text-neutral-800 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-5 relative overflow-hidden print-card">
            <div className="absolute top-0 right-0 bg-[#f8fafc] text-neutral-500 text-[9px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-widest border-l border-b border-neutral-100">
              FAITH &amp; FIRE DIGITAL PASS
            </div>

            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#1e1548]">
                  FAITH &amp; FIRE MINISTRIES
                </h3>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                  JOHANNESBURG SOUTH HEADQUARTERS
                </span>
              </div>
            </div>

            {/* Pass Body */}
            <div className="flex items-center gap-4">
              <div ref={cardCanvasRef} className="p-2.5 bg-white rounded-xl shadow-sm shrink-0 border border-neutral-100">
                <QRCodeCanvas
                  value={memberQrPayload}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#1e1548"
                  level="H"
                />
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase block">
                  MEMBER BADGE
                </span>
                <h4 className="text-lg font-black uppercase tracking-tight text-[#1e1548] leading-tight">
                  {activeMember.firstName} {activeMember.lastName}
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {activeMember.suburb}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  <span className="bg-sky-50 text-sky-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-sky-100">
                    {activeMember.baptismStatus || "Not Baptized"}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-100">
                    {activeMember.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Pass Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs">
              <button
                onClick={handleDownloadCardPng}
                className="bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={handlePrintCard}
                className="bg-[#1e1548] hover:bg-[#1e1548]/90 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                Print Card
              </button>
            </div>
          </div>

          {/* My Attendance Analytics (by weekday) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 flex flex-col">
            <h3 className="text-[#1e1548] font-bold text-sm mb-6 uppercase tracking-wider">Attendance Analytics</h3>
            <div className="flex-1 flex items-end justify-between gap-2 px-2">
              {memberWeekdayCounts.map((wc, i) => {
                const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const isActive = wc.count > 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full relative h-32 flex items-end justify-center group">
                      <div className={`w-full max-w-[40px] rounded-t-lg ${isActive ? "bg-sky-500" : "bg-neutral-100"}`} style={{ height: `${Math.max(8, wc.height)}%` }}>
                        {wc.count > 0 && (
                          <div className="absolute -top-6 bg-white shadow-sm border border-neutral-100 text-[10px] font-bold px-1.5 py-0.5 rounded text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">{wc.count}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{labels[i]}</span>
                  </div>
                );
              })}
            </div>
            {verifiedMemberAttendance.length === 0 && (
              <p className="mt-4 text-center text-xs font-bold text-neutral-400">No verified attendance yet.</p>
            )}
          </div>

          {/* Action Alerts */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 flex flex-col">
            <h3 className="text-[#1e1548] font-bold text-sm mb-6 uppercase tracking-wider">Action Alerts</h3>
            <div className="space-y-4 flex-1">
              {memberAlerts.length > 0 ? (
                memberAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      alert.type === "red"
                        ? "bg-red-50/50 border-red-100"
                        : alert.type === "amber"
                        ? "bg-amber-50/50 border-amber-100"
                        : "bg-sky-50/50 border-sky-100"
                    }`}
                  >
                    <h4 className={`text-sm font-bold leading-tight ${alert.type === "red" ? "text-red-700" : alert.type === "amber" ? "text-amber-700" : "text-sky-700"}`}>
                      {alert.title}
                    </h4>
                    <p className="text-neutral-500 text-xs font-medium leading-relaxed">
                      {alert.desc}
                    </p>
                    <button
                      onClick={() => {
                        if (alert.id === "alert-checkin") {
                          handleOpenEventCheckIn();
                        } else if (alert.targetTab) {
                          setActiveSubTab(alert.targetTab as any);
                        }
                      }}
                      className={`w-full font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer ${
                        alert.type === "red"
                          ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                          : alert.type === "amber"
                          ? "bg-white border border-amber-200 text-amber-600 hover:bg-amber-50"
                          : "bg-white border border-sky-200 text-sky-600 hover:bg-sky-50"
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {alert.action || "Action"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs font-bold text-neutral-400">
                  No open alerts.
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Your Cell Group module */}
        {activeSubTab === "overview" && (
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                YOUR CELL GROUP
              </span>
              {activeCellGroup ? (
                <>
                  <h4 className="text-base font-bold text-[#1e1548]">
                    {activeCellGroup.name}
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md leading-relaxed font-medium">
                    {activeCellGroup.day} at {activeCellGroup.time} · {activeCellGroup.venue || "Home Fellowship"} · Led by {activeCellGroup.leaderName || "the Pastoral Care Team"}
                  </p>
                  <p className="text-[11px] font-medium text-neutral-400 mt-1">
                    📍 {activeCellGroup.suburb}{activeCellGroup.area ? `, ${activeCellGroup.area}` : ""} · {activeCellGroup.memberCount || 0}/{activeCellGroup.capacity || 15} members
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-base font-bold text-[#1e1548]">
                    Find Your Closest Cell Group
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md leading-relaxed font-medium">
                    Cell groups meet in suburbs across {activeMember.suburb || "your area"}.
                    Join the one closest to you and it becomes part of your dashboard.
                  </p>
                </>
              )}
            </div>

            {activeCellGroup ? (
              <button
                onClick={() => handleJoinCellGroup(activeCellGroup.id)}
                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Switch Group
              </button>
            ) : (
              <button
                onClick={() => {
                  if (setCurrentTab) setCurrentTab("contact?module=counselling");
                }}
                className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Book Counseling
              </button>
            )}
          </div>

          {!activeCellGroup && nearbyCellGroups.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyCellGroups.slice(0, 6).map((group) => {
                const memberSuburb = (activeMember?.suburb || "").trim().toLowerCase();
                const isExactMatch =
                  memberSuburb !== "" &&
                  (group.suburb || "").trim().toLowerCase() === memberSuburb;
                return (
                  <div key={group.id} className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-4 space-y-2 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-[#1e1548] leading-tight">
                          {group.name}
                        </h5>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          📍 {group.suburb}{group.area ? ` · ${group.area}` : ""}
                        </span>
                      </div>
                      {isExactMatch && (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          Closest
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed pt-2">
                      {group.day} {group.time} · {group.venue || "Home Fellowship"}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Led by {group.leaderName || "Pastoral Care"}
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => handleJoinCellGroup(group.id)}
                        className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
                      >
                        Join Group
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!activeCellGroup && nearbyCellGroups.length === 0 && (
            <p className="text-xs text-neutral-400 font-medium pt-2">
              No cell groups have been chartered yet. Check back soon.
            </p>
          )}
        </div>
        )}

        {/* Sub-Tab 1: Overview & Spiritual Growth Track */}
        {activeSubTab === "overview" && (
          <div className="space-y-8">
            {/* Member Attendance Heatmap Component */}
            <MemberAttendanceHeatmap
              memberId={activeMember.id}
              attendance={verifiedMemberAttendance}
              memberName={`${activeMember.firstName} ${activeMember.lastName}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Discipleship Track Progress */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
              <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#1e1548] uppercase tracking-tight">
                  Spiritual Discipleship Track &amp; Growth Milestones
                </h3>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">
                  PROGRESS TRACKER
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    key: "salvation",
                    title: "Salvation & Faith Decision",
                    desc: "Public decision to follow Jesus Christ and surrender life to the Gospel."
                  },
                  {
                    step: "2",
                    key: "waterBaptism",
                    title: "Water Baptism",
                    desc: "Full immersion water baptism as commanded by Jesus Christ."
                  },
                  {
                    step: "3",
                    key: "believersFoundation",
                    title: "Believers Foundation Course",
                    desc: "4-week discipleship class building unshakeable biblical conviction."
                  },
                  {
                    step: "4",
                    key: "cellFellowship",
                    title: "Suburb Cell Group Fellowship",
                    desc: "Weekly gathering in Rosettenville / Johannesburg South for communion."
                  },
                  {
                    step: "5",
                    key: "ministryDeployment",
                    title: "Ministry Deployment & Serving",
                    desc: "Active serving in Men of Fire, Radiant Women, or Worship Team."
                  }
                ].map((item) => {
                  const storedStatus = (activeMember as any).milestones?.[item.key];
                  const isCompleted = storedStatus === "Completed";
                  const hasPendingRequest = (milestoneRequests || []).some(
                    (r) => r.milestoneId === item.key && r.status === "Pending"
                  );
                  const displayStatus = isCompleted
                    ? "Completed"
                    : hasPendingRequest
                    ? "Awaiting Confirmation"
                    : "Pending";
                  return (
                    <div key={item.key} className="flex items-start gap-4 p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : hasPendingRequest
                            ? "bg-amber-100 text-amber-700"
                            : "bg-white border border-neutral-200 text-neutral-500 shadow-sm"
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : item.step}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1e1548]">{item.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : hasPendingRequest
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-white text-neutral-500 border border-neutral-200 shadow-sm"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">{item.desc}</p>
                        {isCompleted ? (
                          <span className="text-[10px] font-medium text-emerald-600 block pt-1">
                            ✓ Confirmed by church administration.
                          </span>
                        ) : hasPendingRequest ? (
                          <span className="text-[10px] font-medium text-amber-600 block pt-1">
                            Request submitted — awaiting admin confirmation.
                          </span>
                        ) : (
                          <div className="pt-2">
                            <button
                              onClick={async () => {
                                const ok = await requestMilestone(item.key, item.title);
                                setCheckInStatusMsg(
                                  ok
                                    ? { text: `✓ Confirmation requested for "${item.title}". An administrator will verify it shortly.`, success: true }
                                    : { text: "Error: Could not submit the milestone request. Please try again.", success: false }
                                );
                                setTimeout(() => setCheckInStatusMsg(null), 6000);
                              }}
                              className="text-xs font-bold bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                            >
                              Request Confirmation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                Milestones start as Pending. Each milestone is confirmed by the church administration after
                it is completed — your attendance and ministry records are reviewed before progress is marked.
              </p>
            </div>

            {/* Right Column: Serving Ministries & Pastoral Care */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Serving Departments */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-4">
                <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#1e1548] uppercase tracking-wider">
                    Your Deployed Ministries
                  </h3>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">
                    {activeMember.ministries?.length || 0} DEPARTMENTS
                  </span>
                </div>

                <div className="space-y-3">
                  {ministries
                    .filter((m) => activeMember.ministries?.includes(m.id))
                    .map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-2 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#1e1548]">{m.name}</h4>
                          <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-sky-100 uppercase">
                            {m.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">{m.blurb || m.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-medium text-neutral-400 pt-2 border-t border-neutral-100/60 mt-2">
                          <span>📅 {m.schedule}</span>
                          <span>📍 {m.location}</span>
                        </div>
                      </div>
                    ))}

                  {(!activeMember.ministries || activeMember.ministries.length === 0) && (
                    <p className="text-xs text-neutral-400 font-medium p-4 text-center border border-dashed border-neutral-200 rounded-2xl">
                      No serving departments selected yet. Edit your profile to join a ministry.
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Prayer Request Card */}
              {/* Quick Prayer Request Card */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    PASTORAL INTERCESSION
                  </span>
                  <h3 className="text-sm font-bold text-[#1e1548] uppercase tracking-wider">
                    Submit Prayer Request
                  </h3>
                </div>

                <form onSubmit={handleSubmitPrayerRequest} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Prayer Category
                    </label>
                    <select
                      value={prayerCategory}
                      onChange={(e) => setPrayerCategory(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                    >
                      <option value="Healing & Health">Healing &amp; Health</option>
                      <option value="Family & Marriage">Family &amp; Marriage</option>
                      <option value="Financial Breakthrough">Financial Breakthrough</option>
                      <option value="Spiritual Growth">Spiritual Growth &amp; Deliverance</option>
                      <option value="Job & Career">Job &amp; Business Breakthrough</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Your Prayer Request Details
                    </label>
                    <textarea
                      rows={4}
                      value={newPrayerText}
                      onChange={(e) => setNewPrayerText(e.target.value)}
                      placeholder="Type your prayer need here..."
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow resize-none"
                    />
                  </div>

                  {prayerSubmittedMsg && (
                    <p className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[11px] text-center">
                      {prayerSubmittedMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#1e1548] hover:bg-[#1e1548]/90 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
              attendance={verifiedMemberAttendance}
              memberName={`${activeMember.firstName} ${activeMember.lastName}`}
            />

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  SANCTUARY LOG
                </span>
                <h3 className="text-lg font-bold text-[#1e1548] tracking-tight">
                  Your Sanctuary Attendance History
                </h3>
              </div>

              <button
                onClick={handleOpenEventCheckIn}
                className="bg-[#1e1548] hover:bg-[#1e1548]/90 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CalendarClock className="w-4 h-4" />
                Event Check-In
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-100">
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Service Name</th>
                    <th className="p-3 font-bold">Time</th>
                    <th className="p-3 font-bold">Check-in Method</th>
                    <th className="p-3 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {memberAttendance.map((rec) => {
                    const status = rec.status || "present";
                    const isVerified = status === "Verified" || status === "present";
                    const isPending = status === "Pending";
                    const isRejected = status === "Rejected";
                    return (
                      <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3 text-[#1e1548] font-bold">{rec.date}</td>
                        <td className="p-3 font-bold">{rec.serviceName}</td>
                        <td className="p-3 text-neutral-400">{rec.timestamp || "—"}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isVerified ? "bg-sky-50 text-sky-700" : isPending ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>
                            {isVerified ? "Usher / QR Scan" : isPending ? "Self Check-In" : "Rejected"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : isPending ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {isVerified ? "✓ Verified" : isPending ? "⏳ Pending" : "✗ Rejected"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {memberAttendance.length === 0 && (
                <p className="p-6 text-center text-xs font-semibold text-neutral-400">
                  No check-in history yet. Check in at your next service and it will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Sub-Tab 3: Prayer Requests & Pastoral Counseling */}
        {activeSubTab === "prayers" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  PASTORAL CARE PORTAL
                </span>
                <h3 className="text-lg font-bold text-[#1e1548] tracking-tight">
                  Your Confidential Prayer Requests &amp; Submissions
                </h3>
              </div>
            </div>

            {/* Prayer & Counseling CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (setCurrentTab) setCurrentTab("contact?module=prayer");
                }}
                className="bg-white p-5 rounded-2xl text-left border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1e1548]">
                      Submit a Prayer Request
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Open the website prayer form — the intercessors receive it confidentially.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-4 group-hover:gap-2 transition-all">
                  Go to Prayer Form <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <button
                onClick={() => {
                  if (setCurrentTab) setCurrentTab("contact?module=counselling");
                }}
                className="bg-white p-5 rounded-2xl text-left border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1e1548]">
                      Book Pastoral Counseling
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Request a private session with the pastoral care team.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-4 group-hover:gap-2 transition-all">
                  Open Counseling Form <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberPrayers.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-2 hover:bg-neutral-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      PRAYER SUBMISSION
                    </span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 font-medium leading-relaxed">{p.details}</p>
                  <span className="text-[10px] text-neutral-400 block pt-1">
                    Submitted {p.timestamp ? p.timestamp.substring(0, 10) : "Recently"}
                  </span>
                </div>
              ))}

              {memberPrayers.length === 0 && (
                <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">
                    No active prayer requests found under your email ({activeMember.email}). Use the form on the dashboard to submit a request.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Tithes & Kingdom Giving Record */}
        {activeSubTab === "giving" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  FINANCIAL LEDGER
                </span>
                <h3 className="text-lg font-bold text-[#1e1548] tracking-tight">
                  Kingdom Giving &amp; Tithes Record
                </h3>
              </div>

              <button
                onClick={() => setShowQuickGiveModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Give Online Now
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-100">
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Fund Category</th>
                    <th className="p-3 font-bold">Type</th>
                    <th className="p-3 font-bold">Amount</th>
                    <th className="p-3 text-right font-bold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {memberDonations.map((don) => (
                    <tr key={don.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 text-[#1e1548] font-bold">{don.date}</td>
                      <td className="p-3 font-bold">{don.fund}</td>
                      <td className="p-3">
                        <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {don.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">R{don.amount.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => alert(`Official Church Giving Receipt issued for R${don.amount} on ${don.date}`)}
                          className="text-neutral-500 hover:text-[#1e1548] text-[10px] font-bold uppercase cursor-pointer flex items-center justify-end gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}

                  {memberDonations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-400 font-medium text-xs">
                        No giving records found under email ({activeMember.email}).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Notifications & Admin Chat */}
        {activeSubTab === "communications" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  CHURCH COMMUNICATIONS
                </span>
                <h3 className="text-lg font-bold text-[#1e1548] tracking-tight">
                  Notifications, Messages &amp; Admin Chat
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full uppercase">
                {communications.filter((c) => !c.readBy.includes(currentUser?.uid || "")).length} unread
              </span>
            </div>

            {/* Broadcast notifications from the church */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-neutral-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Church Announcements
                </h4>
              </div>
              {communications.filter((c) => c.type === "notification" && c.audience === "all").length === 0 && (
                <p className="text-xs text-neutral-400 font-medium bg-white border border-dashed border-neutral-200 rounded-2xl p-4 text-center">
                  No announcements yet. The church will post service updates and event news here.
                </p>
              )}
              {communications
                .filter((c) => c.type === "notification" && c.audience === "all")
                .slice()
                .reverse()
                .map((note) => {
                  const unread = !note.readBy.includes(currentUser?.uid || "");
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => markCommunicationRead(note.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                        unread
                          ? "bg-sky-50 border-sky-200 hover:bg-sky-100/70"
                          : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {unread && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1"></span>
                          )}
                          <span className="text-xs font-black uppercase text-[#1e1548] truncate">
                            {note.title || "Church Announcement"}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 shrink-0">
                          {formatCommTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium leading-relaxed mt-1.5">
                        {note.body}
                      </p>
                      <p className="text-[9px] font-mono text-neutral-400 mt-1.5 uppercase">
                        From the Church Office • {note.senderName}
                      </p>
                    </button>
                  );
                })}
            </div>

            {/* Admin chat thread */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#1e1548]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1e1548]">
                  Chat with Admin
                </h4>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto hide-scrollbar" ref={chatThreadRef}>
                {chatThread.length === 0 && (
                  <p className="text-xs text-neutral-500 font-medium text-center py-4">
                    No messages yet. Send a message and the church office will reply here.
                  </p>
                )}
                {chatThread.map((msg) => {
                  const fromStaff = msg.senderRole === "staff";
                  return (
                    <div key={msg.id} className={`flex ${fromStaff ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          fromStaff
                            ? "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm"
                            : "bg-[#1e1548] text-white rounded-tr-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-[9px] font-mono font-bold uppercase ${fromStaff ? "text-[#1e1548]" : "text-sky-300"}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-[9px] font-mono ${fromStaff ? "text-neutral-400" : "text-white/50"}`}>
                            {formatCommTime(msg.createdAt)}
                          </span>
                        </div>
                        <p>{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Type a message to the church office…"
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e1548]/30"
                />
                <button
                  type="submit"
                  disabled={!chatDraft.trim() || !currentUser}
                  className="bg-[#1e1548] hover:bg-[#1e1548]/90 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
              <p className="text-[10px] font-mono text-neutral-400">
                Messages are visible to the church office and you only. Staff replies appear in this thread.
              </p>
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Edit Profile Settings */}
        {activeSubTab === "edit-profile" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-neutral-100 pb-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                MEMBER SETTINGS
              </span>
              <h3 className="text-lg font-bold text-[#1e1548] tracking-tight">
                Update Your Personal &amp; Church Profile
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Photo Upload Module */}
              <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                <label className="block font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Profile Portrait Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0F2342] text-white flex items-center justify-center font-black text-xl overflow-hidden shrink-0 border-2 border-purple-400 shadow-md">
                    {editForm.photo ? (
                      <img src={editForm.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{activeMember.firstName[0]}{activeMember.lastName[0]}</span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 bg-[#1e1548] text-white text-[11px] font-black px-3 py-2 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-[#1e1548]/90 transition-colors">
                        <ImageUp className="w-3.5 h-3.5" />
                        {editForm.photo ? "Edit Photo" : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFile}
                          className="hidden"
                        />
                      </label>
                      {editForm.photo && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-[11px] font-black px-3 py-2 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Photo
                        </button>
                      )}
                    </div>
                    {avatarUploading && (
                      <p className="text-[10px] font-mono text-[#1e1548] font-bold animate-pulse">
                        Uploading photo…
                      </p>
                    )}
                    <span className="text-[10px] text-neutral-500 block font-mono">
                      Photos are stored securely and the URL is saved to your profile.
                      Click "Edit Photo" to replace it or "Delete Photo" to remove it.
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

              <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-neutral-500" />
                  <span className="font-bold text-neutral-500 uppercase tracking-wider">Profile Security PIN</span>
                </div>
                <div>
                  <label className="block font-bold text-neutral-500 uppercase tracking-wider mb-1 text-[10px]">
                    New Security PIN Code (4-10 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    inputMode="numeric"
                    value={editForm.pin || ""}
                    onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                    className="w-full"
                    placeholder="Leave blank to keep your current PIN"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                    Your PIN is stored hashed on the server and is required to unlock your profile dashboard and check in at the kiosk.
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
                className="w-full bg-[#1e1548] hover:bg-[#1e1548]/90 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
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
              className="bg-gradient-to-b from-[#1e1548] to-slate-900 text-white p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-6 border-2 border-amber-400/50 shadow-2xl relative"
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
                  fgColor="#1e1548"
                  level="H"
                />
              </div>

              <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                Present this QR code to the usher at the sanctuary entrance. The usher scans it to identify
                you instantly and verify your attendance.
              </p>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-[#1e1548] font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
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
                <h3 className="text-xl font-black uppercase text-[#1e1548]">
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
                        ? "bg-[#1e1548] text-white border-purple-950 shadow"
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
                      <span className="bg-amber-500 text-[#1e1548] text-[10px] font-black uppercase px-2 py-0.5 rounded">
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
                <h3 className="text-xl font-black uppercase text-[#1e1548]">
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
                  <label className="block font-bold text-[#1e1548] uppercase mb-1">
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

      {/* MODAL 3B: Event Check-In — camera QR scan (admin-created events /
      weekly services). The member scans the event QR code shown at the door;
      the scan resolves the event and records a Pending check-in. */}
      <AnimatePresence>
        {showEventCheckInModal && (
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
                onClick={() => setShowEventCheckInModal(false)}
                className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#1e1548] font-extrabold uppercase tracking-widest block">
                  EVENT CHECK-IN
                </span>
                <h3 className="text-xl font-black uppercase text-[#1e1548]">
                  Scan Event QR Code
                </h3>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Point your camera at the event QR code displayed at the door or on
                  the event page. Your check-in is recorded as
                  <span className="font-bold text-amber-600"> Pending</span> until an
                  usher or administrator verifies it.
                </p>
              </div>

              {!showManualCheckIn && (
                <div className="space-y-3">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-neutral-950 relative">
                    <div id="member-qr-scanner" className="w-full h-full" />
                    {!qrScannerReady && !qrScanError && (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                        <span className="text-[11px] font-mono font-bold uppercase animate-pulse">
                          Starting camera…
                        </span>
                      </div>
                    )}
                  </div>
                  {qrScanError && (
                    <p className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {qrScanError}
                    </p>
                  )}
                  <p className="text-[10px] text-neutral-400 font-mono text-center">
                    {qrScannerReady
                      ? "Scanning… hold the event QR code steady inside the frame."
                      : "Camera access is needed to scan the event QR code."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualCheckIn(true)}
                    className="w-full text-[11px] font-bold text-[#1e1548] hover:text-amber-600 underline cursor-pointer"
                  >
                    Can't scan? Choose the event manually
                  </button>
                </div>
              )}

              {showManualCheckIn && (
                <>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {checkInEventOptions.length === 0 ? (
                      <div className="p-6 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                        <p className="text-xs text-neutral-500 font-bold">
                          No upcoming events yet. The church calendar is updated by the administration.
                        </p>
                      </div>
                    ) : (
                      checkInEventOptions.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedCheckInEvent(ev.title)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            selectedCheckInEvent === ev.title
                              ? "bg-[#1e1548] text-white border-[#1e1548]"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          <CalendarClock className={`w-5 h-5 shrink-0 ${selectedCheckInEvent === ev.title ? "text-amber-400" : "text-neutral-400"}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-black uppercase truncate">{ev.title}</span>
                            <span className={`block text-[10px] font-mono mt-0.5 ${selectedCheckInEvent === ev.title ? "text-sky-200" : "text-neutral-500"}`}>
                              {ev.time || `${ev.startTime || "09:00"} - ${ev.endTime || "11:30"}`} • {ev.venue || "Main Sanctuary"}
                            </span>
                          </span>
                          {ev.repeat === "weekly" && (
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0 ${selectedCheckInEvent === ev.title ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                              Weekly
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => handleEventCheckIn()}
                    disabled={!selectedCheckInEvent || checkInEventOptions.length === 0}
                    className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4" />
                    Confirm Event Check-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualCheckIn(false)}
                    className="w-full text-[11px] font-bold text-[#1e1548] hover:text-amber-600 underline cursor-pointer"
                  >
                    ← Back to camera scanning
                  </button>
                </>
              )}
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
                <h3 className="text-xl font-black uppercase text-[#1e1548]">
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
                        giveAmount === amt ? "bg-[#1e1548] text-white border-purple-950" : "bg-neutral-100 text-neutral-700"
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
      </main>
      </div>
      )}
      {authModalEl}
    </>
  );
};
