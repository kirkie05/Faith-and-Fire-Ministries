import React, { useState, useEffect, useRef, useMemo } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useChurch } from "../context/ChurchContext";
import { AdminCalendarEvents } from "./AdminCalendarEvents";
import { AdminMemberProfile } from "./AdminMemberProfile";
import { AdminCare } from "./AdminCare";
import { AdminReports, AdminImportExport } from "./AdminReportsExport";
import { AdminTasks } from "./AdminTasks";
import { AdminMinistries } from "./AdminMinistries";
import { AdminClasses } from "./AdminClasses";
import { AdminFormsModule } from "./AdminFormsModule";
import { AdminComms } from "./AdminComms";
import { FileUploadInput } from "./FileUploadInput";
import {
  Shield,
  LayoutDashboard,
  Settings,
  Image,
  Video,
  Calendar,
  Megaphone,
  Globe,
  FileText,
  Navigation as NavIcon,
  Activity,
  Mail,
  Users,
  TrendingUp,
  Heart,
  Plus,
  ArrowUpRight,
  Target,
  Trash2,
  CheckCircle,
  Eye,
  Search,
  Filter,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  CreditCard,
  User,
  UserPlus,
  Key,
  Lock,
  Building,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  FileBox,
  ClipboardList,
  MessageSquare,
  PieChart,
  BarChart3,
  MoreVertical,
  FolderOpen,
  Newspaper,
  ClipboardType,
  FileSpreadsheet,
  Bell,
  ListTodo,
  QrCode,
  CheckSquare,
  GraduationCap,
  HeartPulse,
  HandHeart
} from "lucide-react";
import { Member, ChurchEvent, SermonVideo, ContactMessage, ConnectFormSubmission } from "../types";
import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

// Base64 file upload helper component

export const AdminPortal: React.FC = () => {
  const { messages, connectSubmissions } = useChurch();
  const [activeSubMenu, setActiveSubMenu] = useState<string>("dashboard");
  const [membersInitialTab, setMembersInitialTab] = useState<"roster" | "care" | "analytics" | "reports" | "import">("roster");
  const [followupInitialTab, setFollowupInitialTab] = useState<"followups" | "tasks" | "firsttimers" | "whatsapp">("followups");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // New consolidated sidebar structure
  const primaryMenuItems = [
    { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard },
    { id: "calendar", label: "CALENDAR & EVENTS", icon: Calendar },
    { id: "members", label: "MEMBERS", icon: Users },
    { id: "followup", label: "FOLLOW-UP", icon: Heart },
    { id: "nextsteps", label: "NEXT STEPS", icon: GraduationCap },
    { id: "finance", label: "FINANCE & GIVING", icon: CreditCard },
    { id: "media", label: "SERMON LIBRARY", icon: Video },
    { id: "forms", label: "FORMS & SURVEYS", icon: ClipboardType }
  ];


  const cmsMenuItems = [
    { id: "comms", label: "COMMUNICATIONS", icon: MessageSquare, badge: messages.filter((m) => m.status === "Unread").length + connectSubmissions.filter((s) => s.status === "Pending").length },
    { id: "prayer", label: "PRAYER REQUESTS", icon: HandHeart },
    { id: "navigation", label: "NAVIGATION & SOCIAL", icon: NavIcon }
  ];

  const allModules = [
    ...primaryMenuItems,
    ...cmsMenuItems,
    { id: "settings", label: "SETTINGS", icon: Settings },
    { id: "help", label: "HELP", icon: HelpCircle }
  ];

  const filteredModules = allModules.filter(m => m.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col lg:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 bg-white text-neutral-800 flex flex-col justify-between shrink-0 border-r border-neutral-100 m-4 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
          {/* Brand header from image */}
          <div className="flex items-center gap-3">
            <img src="/images/Logo.png" alt="Faith & Fire Logo" className="h-8 object-contain" />
          </div>

          {/* Menus */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">
                MENU
              </h4>
              <nav className="space-y-1">
                {primaryMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#1e1548] text-white shadow-sm"
                          : "text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} />
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* CMS / More Panels */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">
                GENERAL
              </h4>
              <nav className="space-y-1">
                {cmsMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#1e1548] text-white shadow-xs"
                          : "text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="bg-[#fb923c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <button 
                  onClick={() => setActiveSubMenu("settings")}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                    activeSubMenu === "settings"
                      ? "bg-[#1e1548] text-white shadow-xs"
                      : "text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Settings className={`w-5 h-5 shrink-0 ${activeSubMenu === "settings" ? "text-white" : "text-neutral-400"}`} />
                    Settings
                  </span>
                </button>

                <button 
                  onClick={() => alert("Connecting with church tech support...")}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50`}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 shrink-0 text-neutral-400" />
                    Help
                  </span>
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to log out of the Admin Portal?")) {
                      signOut(auth).finally(() => {
                        window.location.href = "/";
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-neutral-500 hover:text-red-600 hover:bg-red-50`}
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 shrink-0 text-neutral-400" />
                    Logout
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer info in sidebar - App Promo Card */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-[#1e1548] to-[#0A192F] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-[#38BDF8]/20">
            {/* Background pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 C20,20 40,80 60,50 C80,20 100,50 100,50 L100,100 L0,100 Z" fill="#38BDF8" />
              <path d="M0,70 C30,40 50,90 80,60 C90,50 100,60 100,60 L100,100 L0,100 Z" fill="#1e1548" />
            </svg>
            
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <span className="text-white font-bold text-xs">APP</span>
              </div>
              <h3 className="text-sm font-extrabold mb-1">Download our<br/>Mobile App</h3>
              <p className="text-[10px] text-white/60 mb-4">Get easy access anywhere.</p>
              <button className="w-full bg-[#1e1548] border border-white/20 hover:bg-[#38BDF8] hover:text-[#1e1548] transition-colors py-2 rounded-xl text-xs font-bold shadow-sm">
                Download
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* Top Bar: Search & Profile */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl shadow-xs border border-neutral-100">
            {/* Search Input */}
            <div className="relative w-full md:w-96 flex-1 md:flex-none">
              <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search module..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full bg-neutral-50/50 border border-neutral-100 rounded-full pl-12 pr-12 py-3 text-sm focus:bg-white transition-colors outline-none focus:border-[#38bdf8]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-neutral-200 px-2 py-1 rounded text-[10px] font-bold text-neutral-400 shadow-sm pointer-events-none">
                ⌘ F
              </div>
              
              {showSearchDropdown && searchQuery.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {filteredModules.length > 0 ? (
                      filteredModules.map(module => {
                        const Icon = module.icon;
                        return (
                          <button
                            key={module.id}
                            onClick={() => {
                              if (module.id === "help") {
                                alert("Connecting with church tech support...");
                              } else {
                                setActiveSubMenu(module.id);
                              }
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
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <button 
                onClick={() => setActiveSubMenu("comms")}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors border border-neutral-100 cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors relative border border-neutral-100 cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {connectSubmissions.filter(s => s.status === "Pending").length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#fb923c] rounded-full border border-white animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Notifications</span>
                      <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">
                        {connectSubmissions.filter(s => s.status === "Pending").length} New
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {connectSubmissions.filter(s => s.status === "Pending").length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-400 font-bold uppercase tracking-wider">No new notifications</div>
                      ) : (
                        connectSubmissions.filter(s => s.status === "Pending").slice(0, 5).map(sub => (
                          <div 
                            key={sub.id} 
                            className="p-4 border-b border-neutral-50 hover:bg-sky-50 transition-colors cursor-pointer" 
                            onClick={() => { 
                              setShowNotifications(false); 
                              setActiveSubMenu("comms"); 
                            }}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-xs font-bold text-[#1e1548] truncate pr-2">{sub.name}</span>
                              <span className="text-[9px] font-mono text-neutral-400 shrink-0">{new Date(sub.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-sky-100 text-sky-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">{sub.type}</span>
                              <span className="text-[10px] text-neutral-500 line-clamp-1">New submission received</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {connectSubmissions.filter(s => s.status === "Pending").length > 0 && (
                      <div 
                        className="p-3 bg-neutral-50 text-center border-t border-neutral-100 text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-neutral-100 cursor-pointer transition-colors"
                        onClick={() => { setShowNotifications(false); setActiveSubMenu("comms"); }}
                      >
                        View All Submissions
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-neutral-200 mx-2"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <span className="block text-sm font-extrabold text-[#1e1548]">Admin User</span>
                  <span className="block text-[11px] text-neutral-500">admin@faithfire.org</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Routing — Merged Modules */}
          {activeSubMenu === "dashboard" && <AdminDashboard setActiveSubMenu={setActiveSubMenu} setMembersInitialTab={setMembersInitialTab} setFollowupInitialTab={setFollowupInitialTab} />}
          {activeSubMenu === "calendar" && <AdminCalendarEvents />}
          {activeSubMenu === "members" && <AdminMembersModule initialTab={membersInitialTab} />}
          {activeSubMenu === "followup" && <AdminFollowUpModule initialTab={followupInitialTab} />}
          {activeSubMenu === "nextsteps" && <AdminNextSteps />}
          {activeSubMenu === "finance" && <AdminFinanceGiving />}
          {activeSubMenu === "media" && <AdminMedia />}
          {activeSubMenu === "forms" && <AdminFormsModule />}
          
          {activeSubMenu === "comms" && <AdminCommsModule />}
          {activeSubMenu === "prayer" && <AdminPrayer />}
          {activeSubMenu === "navigation" && <AdminNavigation />}
        </div>
      </main>
    </div>
  );
};


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

const AdminFollowUps: React.FC = () => {
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

// ==========================================
// MODULE 1: ADMIN DASHBOARD
// ==========================================
interface Administrator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "SUPER ADMIN" | "EDITOR" | "MEDIA";
  status: "Active" | "Offline";
  lastActivity: string;
}

interface DashboardAudit {
  id: string;
  type: "success" | "warning";
  title: string;
  description: string;
  time: string;
}

const AdminDashboard: React.FC<{ 
  setActiveSubMenu: (m: string) => void;
  setMembersInitialTab: (tab: any) => void;
  setFollowupInitialTab: (tab: any) => void;
}> = ({ setActiveSubMenu, setMembersInitialTab, setFollowupInitialTab }) => {
  const { members, attendance, userRole, users, auditLogs, visitors, ministries, events } = useChurch();

  // Real data only: the administrator roster is derived from the users
  // collection (role records written server-side via claims), never from
  // hardcoded or locally-persisted fake accounts.
  const admins: Administrator[] = useMemo(() => {
    return users
      .filter((u) => u.role === "SuperAdmin" || u.role === "Admin" || u.role === "Pastor" || u.role === "Minister" || u.role === "DepartmentLeader")
      .map((u) => {
        const emailPrefix = (u.email || "").split("@")[0] || "";
        const nameParts = emailPrefix.split(/[._-]/).filter(Boolean);
        const firstName = nameParts[0] ? nameParts[0][0].toUpperCase() + nameParts[0].slice(1) : "Admin";
        const lastName = nameParts[1] ? nameParts[1][0].toUpperCase() + nameParts[1].slice(1) : "";
        const joined = u.createdAt?.toMillis ? new Date(u.createdAt.toMillis()).toLocaleDateString() : "—";
        return {
          id: u.uid,
          firstName,
          lastName,
          email: u.email || "",
          role: u.role === "SuperAdmin" ? "SUPER ADMIN" : u.role === "Admin" ? "EDITOR" : "MEDIA",
          status: "Active" as const,
          lastActivity: joined
        };
      });
  }, [users]);

  // Real audit trail: the dashboard's security feed mirrors the append-only
  // auditLogs collection written by Cloud Functions.
  const dashboardAudits: DashboardAudit[] = useMemo(() => {
    return auditLogs.map((log) => ({
      id: log.id,
      type: log.status === "SUCCESS" ? "success" as const : "warning" as const,
      title: log.action.replace(/_/g, " "),
      description: log.resource,
      time: log.timestamp?.toMillis ? new Date(log.timestamp.toMillis()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
    }));
  }, [auditLogs]);

  // Attendance & Service Filter State
  const [selectedServiceName, setSelectedServiceName] = useState("All Services");

  // Derived action alerts from real data: members with no check-in record yet,
  // members absent from the most recent service, and unreviewed visitors.
  const activeAlerts = useMemo(() => {
    const alerts: { id: string; type: string; title: string; desc: string; action: string; targetMenu: string }[] = [];
    const presentEmails = new Set(attendance.map((a) => a.memberEmail.toLowerCase()));
    const neverCheckedIn = members.filter((m) => !presentEmails.has(m.email.toLowerCase()));
    if (neverCheckedIn.length > 0) {
      alerts.push({
        id: "alert-never",
        type: "red",
        title: "New Members Awaiting Check-in",
        desc: `${neverCheckedIn.length} member${neverCheckedIn.length === 1 ? "" : "s"} have no attendance record yet. A first check-in helps them stay connected.`,
        action: "View Members",
        targetMenu: "members"
      });
    }
    const recentVisitors = visitors.filter((v) => v.followUpStatus === "Pending" || v.followUpStatus === undefined);
    if (recentVisitors.length > 0) {
      alerts.push({
        id: "alert-visitors",
        type: "blue",
        title: "Visitors Awaiting Follow-up",
        desc: `${recentVisitors.length} visitor${recentVisitors.length === 1 ? "" : "s"} checked in without a completed follow-up sequence yet.`,
        action: "View Follow-ups",
        targetMenu: "followup"
      });
    }
    return alerts;
  }, [members, attendance, visitors]);

  // Countdown to the next scheduled service (real event date).
  const [countdown, setCountdown] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Determine present vs missing members from real attendance records.
  const presentEmails = new Set(
    attendance
      .filter((a) => a.serviceName === selectedServiceName || selectedServiceName === "All Services")
      .map((a) => a.memberEmail.toLowerCase())
  );

  const missingMembers = members.filter((m) => !presentEmails.has(m.email.toLowerCase()));
  const presentCount = members.length - missingMembers.length;
  const checkInRatio = members.length > 0 ? presentCount / members.length : 0;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Real attendance flow trend: last 4 calendar weeks from actual attendance
  // records (unique members per week). Empty data renders as an honest
  // "no data yet" state instead of fabricated numbers.
  const attendanceFlowWeeks = useMemo(() => {
    const now = new Date();
    const weeks: { week: string; count: number; firstService: number; secondService: number; pct: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - (w * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const weekRecords = attendance.filter((a) => {
        const t = a.date ? new Date(a.date).getTime() : (a as any).createdAt?.toMillis?.();
        return typeof t === "number" && t >= weekStart.getTime() && t < weekEnd.getTime();
      });
      const unique = new Set(weekRecords.map((a) => a.memberEmail.toLowerCase()));
      const firstService = weekRecords.filter((a) => a.serviceName.toLowerCase().includes("first") || a.serviceName.toLowerCase().includes("1st")).length;
      const secondService = weekRecords.filter((a) => a.serviceName.toLowerCase().includes("second") || a.serviceName.toLowerCase().includes("2nd")).length;
      weeks.push({
        week: w === 0 ? "Week 4 (Current)" : `Week ${3 - w + 1}`,
        count: unique.size,
        firstService,
        secondService,
        pct: 0
      });
    }
    const maxCount = Math.max(1, ...weeks.map((wk) => wk.count));
    weeks.forEach((wk) => { wk.pct = Math.round((wk.count / maxCount) * 100); });
    return weeks;
  }, [attendance]);

  // Real weekday attendance distribution for the analytics chart.
  const weekdayCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    attendance.forEach((a) => {
      const t = a.date ? new Date(a.date).getTime() : (a as any).createdAt?.toMillis?.();
      if (typeof t === "number") {
        const day = new Date(t).getDay();
        counts[day] += 1;
      }
    });
    const max = Math.max(1, ...counts);
    return counts.map((c) => ({ count: c, height: c === 0 ? 8 : Math.round((c / max) * 100) }));
  }, [attendance]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => !e.archived)
      .map((e) => ({ event: e, time: e.fullDate ? new Date(e.fullDate).getTime() : NaN }))
      .filter((e) => !Number.isNaN(e.time) && e.time >= now)
      .sort((a, b) => a.time - b.time)
      .slice(0, 4);
  }, [events]);

  const nextServiceTime = useMemo(() => {
    const next = upcomingEvents[0];
    return next ? next.time : null;
  }, [upcomingEvents]);

  useEffect(() => {
    if (nextServiceTime === null || !isTimerRunning) return;
    const update = () => setCountdown(Math.max(0, Math.floor((nextServiceTime - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nextServiceTime, isTimerRunning]);

  // Search, Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [showRoleFilterMenu, setShowRoleFilterMenu] = useState(false);

  const filteredAdmins = admins.filter((admin) => {
    const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === "ALL" || admin.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const pageSize = 3;
  const totalPages = Math.ceil(filteredAdmins.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredAdmins, currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + pageSize);

  // Recovery select state & Toast
  const [recoveryUserId, setRecoveryUserId] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleGenerateResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryUserId) {
      alert("Please select an administrator from the dropdown.");
      return;
    }

    const selectedAdmin = admins.find(a => a.id === recoveryUserId);
    if (!selectedAdmin) return;

    // Password resets are executed server-side via the adminSendPasswordReset
    // callable (verified Admin/SuperAdmin only); the audit entry is written by
    // the server into the append-only auditLogs collection.
    try {
      const functions = getFunctions();
      const sendReset = httpsCallable(functions, "adminSendPasswordReset");
      await sendReset({ uid: selectedAdmin.id });
      setShowToast(true);
    } catch (err) {
      console.error("Password reset failed:", err);
      alert("Unable to send the password reset. Only verified Admin/SuperAdmin roles may do this.");
    }

    setRecoveryUserId("");
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Add Admin modal state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminLastName, setNewAdminLastName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"SUPER ADMIN" | "EDITOR" | "MEDIA">("SUPER ADMIN");

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminFirstName || !newAdminLastName || !newAdminEmail) return;

    // Invite creation is server-enforced (createAdminInvite): SuperAdmin may
    // invite SuperAdmin/Admin, everyone else is capped at Admin.
    try {
      const functions = getFunctions();
      const createInvite = httpsCallable(functions, "createAdminInvite");
      await createInvite({
        email: newAdminEmail.toLowerCase(),
        role: newAdminRole === "SUPER ADMIN" ? "SuperAdmin" : "Admin",
        firstName: newAdminFirstName,
        lastName: newAdminLastName
      });
    } catch (err) {
      console.error("Failed to save admin invite:", err);
      alert("Unable to create the invite. Only a SuperAdmin can grant the SuperAdmin role.");
      return;
    }

    // The roster and audit feed update automatically from the users and
    // auditLogs listeners once the invite is created server-side.

    setNewAdminFirstName("");
    setNewAdminLastName("");
    setNewAdminEmail("");
    setNewAdminRole("SUPER ADMIN");
    setShowAddAdminModal(false);
  };

  // Stats Counters
  const totalAdminsCount = admins.length;
  const superAdminsCount = admins.filter(a => a.role === "SUPER ADMIN").length;
  const editorsCount = admins.filter(a => a.role === "EDITOR").length;
  const mediaCount = admins.filter(a => a.role === "MEDIA").length;

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : num.toString();
  };

  return (
    <div className="font-sans animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">
            Plan, prioritize, and manage your church operations with ease.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddAdminModal(true)}
            className="bg-[#1e1548] hover:bg-[#0A192F] text-white font-bold text-sm py-2.5 px-5 rounded-full transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
          <button
            onClick={() => {
              setMembersInitialTab("import");
              setActiveSubMenu("members");
            }}
            className="bg-white border border-[#1e1548] text-[#1e1548] hover:bg-neutral-50 font-bold text-sm py-2.5 px-5 rounded-full transition-colors shadow-sm cursor-pointer"
          >
            Import Data
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Row 1: Stat Cards */}
        <div className="bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="flex items-start justify-between relative z-10">
            <span className="text-white/90 text-sm font-bold">Total Members</span>
            <div className="w-8 h-8 rounded-full bg-white text-[#1e1548] flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h2 className="text-5xl font-extrabold text-white tracking-tighter">{members.length}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-[#38BDF8] text-xs font-bold bg-[#38BDF8]/10 w-fit px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3" />
              Increased from last month
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[#1e1548] text-sm font-bold">Absent Members</span>
            <div className="w-8 h-8 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-5xl font-extrabold text-[#1e1548] tracking-tighter">{missingMembers.length}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-[#fb923c] text-xs font-bold bg-[#fb923c]/10 w-fit px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3" />
              Increased from last month
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[#1e1548] text-sm font-bold">New Visitors</span>
            <div className="w-8 h-8 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-5xl font-extrabold text-[#1e1548] tracking-tighter">{visitors.length}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-[#38BDF8] text-xs font-bold bg-[#38BDF8]/10 w-fit px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3" />
              From visitor check-ins
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[#1e1548] text-sm font-bold">Active Ministries</span>
            <div className="w-8 h-8 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-5xl font-extrabold text-[#1e1548] tracking-tighter">{ministries.filter((m) => m.active !== false && !m.archived).length}</h2>
            <p className="text-neutral-400 text-xs font-bold mt-2 h-[24px] flex items-center">Active in the roster</p>
          </div>
        </div>

        {/* Row 2: Analytics, Reminders, Project */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col">
          <h3 className="text-[#1e1548] font-bold text-base mb-6">Attendance Analytics (by weekday)</h3>
          <div className="flex-1 flex items-end justify-between gap-2 px-2">
            {weekdayCounts.map((wc, i) => {
              const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const isActive = wc.count > 0;
              return (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-full relative h-32 flex items-end justify-center group">
                    <div className={`w-full max-w-[40px] rounded-t-full ${isActive ? "bg-[#1e1548]" : "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#d1d5db_2px,#d1d5db_4px)]"}`} style={{ height: `${Math.max(8, wc.height)}%` }}>
                      {wc.count > 0 && (
                        <div className="absolute -top-6 bg-white shadow-sm border border-neutral-100 text-[10px] font-bold px-1.5 py-0.5 rounded text-[#1e1548]">{wc.count}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-400">{labels[i]}</span>
                </div>
              );
            })}
          </div>
          {attendance.length === 0 && (
            <p className="mt-4 text-center text-xs font-bold text-neutral-400">No attendance records yet — data will appear here once members check in.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div>
            <h3 className="text-[#1e1548] font-bold text-base mb-6">Action Alerts</h3>
            {activeAlerts[0] ? (
              <div>
                <h4 className="text-lg font-extrabold text-[#1e1548] leading-tight">{activeAlerts[0].title}</h4>
                <p className="text-neutral-500 text-xs font-medium mt-2 leading-relaxed">
                  {activeAlerts[0].desc}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-bold text-neutral-400">
                No open alerts — everything is up to date.
              </div>
            )}
          </div>
          {activeAlerts[0] && (
          <button 
            onClick={() => {
              if (activeAlerts[0]?.targetMenu === "followup") {
                setFollowupInitialTab("tasks");
              }
              setActiveSubMenu(activeAlerts[0]?.targetMenu || "dashboard");
            }}
            className="w-full bg-[#1e1548] hover:bg-[#0A192F] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 mt-6 transition-colors shadow-sm cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            {activeAlerts[0]?.action || "Action"}
          </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#1e1548] font-bold text-base">Upcoming Events</h3>
            <button 
              onClick={() => setActiveSubMenu("calendar")}
              className="text-[10px] font-bold text-[#1e1548] border border-[#1e1548] rounded-full px-2 py-1 flex items-center gap-1 hover:bg-neutral-50 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {upcomingEvents.length > 0 ? upcomingEvents.map(({ event: ev, time }, i) => {
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-400", "bg-orange-500"];
              const icons = [LayoutDashboard, Users, Target, ClipboardList];
              const Icon = icons[i % icons.length];
              return (
                <div key={ev.id} className="flex gap-3 items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${colors[i % colors.length]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#1e1548] truncate">{ev.title}</span>
                    <span className="block text-[10px] text-neutral-400 font-medium">Date: {new Date(time).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center text-xs font-bold text-neutral-400">
                No upcoming events scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Absent Members, Service Capacity, Countdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#1e1548] font-bold text-base">Absent Members Action List</h3>
            <button 
              onClick={() => setActiveSubMenu("followup")}
              className="text-[10px] font-bold text-[#1e1548] border border-[#1e1548] rounded-full px-3 py-1 flex items-center gap-1 hover:bg-neutral-50 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Follow-up
            </button>
          </div>
          <div className="space-y-4">
            {missingMembers.slice(0, 4).map((m) => {
              return (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-[#1e1548] overflow-hidden shrink-0">
                       <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.firstName}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-[#1e1548] truncate">{m.firstName} {m.lastName}</span>
                      <span className="block text-[11px] text-neutral-500 font-medium truncate max-w-[150px] sm:max-w-[200px]">No check-in record for this service</span>
                    </div>
                  </div>
                  <span className="bg-neutral-100 text-neutral-500 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    No check-in
                  </span>
                </div>
              );
            })}
            {missingMembers.length === 0 && (
              <div className="py-8 text-center text-xs font-bold text-neutral-400">
                All members accounted for.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col items-center">
          <div className="w-full text-left mb-4">
            <h3 className="text-[#1e1548] font-bold text-base">Attendance vs Membership</h3>
          </div>
          <div className="relative w-40 h-40 flex items-center justify-center mt-2">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="15" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1548" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - checkInRatio)} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#1e1548]">{Math.round(checkInRatio * 100)}%</span>
              <span className="text-[10px] font-bold text-neutral-400">{presentCount} of {members.length} checked in</span>
            </div>
          </div>
          <div className="flex gap-4 mt-6 text-[10px] font-bold text-neutral-500 w-full justify-center">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1e1548]"></span> Checked in</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-200"></span> Not yet</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0F2342] to-[#1e1548] p-6 rounded-3xl shadow-lg border border-[#38BDF8]/20 flex flex-col relative overflow-hidden text-white">
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,80 C30,60 50,100 80,70 C90,60 100,70 100,70 L100,100 L0,100 Z" fill="#38BDF8" />
            <path d="M0,90 C20,70 40,110 60,80 C80,50 100,80 100,80 L100,100 L0,100 Z" fill="#fb923c" />
          </svg>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white/80">Next Service</span>
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                <LayoutDashboard className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="my-auto text-center py-4">
              {nextServiceTime !== null ? (
                <div className="text-4xl font-extrabold tracking-widest font-mono drop-shadow-md">
                  {formatTime(countdown)}
                </div>
              ) : (
                <div className="text-sm font-bold text-white/80 px-2">
                  No upcoming service scheduled
                </div>
              )}
            </div>

            {nextServiceTime !== null && (
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-8 h-8 rounded-full bg-white text-[#1e1548] flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform"
              >
                {isTimerRunning ? (
                  <div className="w-2 h-3 border-l-2 border-r-2 border-[#1e1548]"></div>
                ) : (
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-[#1e1548] border-b-[6px] border-b-transparent ml-1"></div>
                )}
              </button>
              <button 
                onClick={() => {
                  setIsTimerRunning(false);
                  if (nextServiceTime !== null) {
                    setCountdown(Math.max(0, Math.floor((nextServiceTime - Date.now()) / 1000)));
                  }
                }}
                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white"></div>
              </button>
            </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Admin Modal mapping */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowAddAdminModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors text-neutral-600 cursor-pointer"
            >
              <span className="font-bold">&times;</span>
            </button>
            <h2 className="text-xl font-extrabold text-[#1e1548] mb-2 font-sans tracking-tight">Add Administrator</h2>
            <p className="text-xs font-bold text-neutral-500 mb-6">Create a new admin account with specific role privileges.</p>
            
            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest block">First Name</label>
                  <input type="text" required value={newAdminFirstName} onChange={(e) => setNewAdminFirstName(e.target.value)} className="w-full text-sm font-bold bg-neutral-50 rounded-lg border-neutral-200 px-3 py-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest block">Last Name</label>
                  <input type="text" required value={newAdminLastName} onChange={(e) => setNewAdminLastName(e.target.value)} className="w-full text-sm font-bold bg-neutral-50 rounded-lg border-neutral-200 px-3 py-2" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest block">Email Address</label>
                <input type="email" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="w-full text-sm font-bold bg-neutral-50 rounded-lg border-neutral-200 px-3 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest block">Role Assignment</label>
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value as any)} className="w-full text-sm font-bold bg-neutral-50 cursor-pointer rounded-lg border-neutral-200 px-3 py-2">
                  {userRole === "SuperAdmin" && <option value="SUPER ADMIN">SUPER ADMIN</option>}
                  <option value="EDITOR">EDITOR</option>
                  <option value="MEDIA">MEDIA</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3 rounded-lg shadow-sm transition-all uppercase tracking-widest cursor-pointer">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MODULE 2: WEBSITE SETTINGS & BRANDING
// ==========================================
const AdminSettings: React.FC = () => {
  const { websiteSettings, setWebsiteSettings, churchInfo, setChurchInfo } = useChurch();

  const [churchName, setChurchName] = useState(websiteSettings.churchName);
  const [primaryColor, setPrimaryColor] = useState(websiteSettings.visualTokens.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(websiteSettings.visualTokens.secondaryColor);
  const [headingFont, setHeadingFont] = useState(websiteSettings.visualTokens.headingFont);
  const [borderRadius, setBorderRadius] = useState(websiteSettings.visualTokens.borderRadius);
  const [toggles, setToggles] = useState(websiteSettings.moduleToggles);
  const [isSaved, setIsSaved] = useState(false);

  // Logo & Branding Settings
  const [logoType, setLogoType] = useState<"text" | "image">(churchInfo.logoType || "text");
  const [logoImage, setLogoImage] = useState(churchInfo.logoImage || "");
  const [footerLogoImage, setFooterLogoImage] = useState(churchInfo.footerLogoImage || "");
  const [faviconUrl, setFaviconUrl] = useState(churchInfo.faviconUrl || "");
  const [logoSubtitle, setLogoSubtitle] = useState(churchInfo.logoSubtitle || "");

  // Social Links
  const [facebookUrl, setFacebookUrl] = useState(churchInfo.socials?.facebook || "");
  const [youtubeUrl, setYoutubeUrl] = useState(churchInfo.socials?.youtube || "");
  const [instagramUrl, setInstagramUrl] = useState(churchInfo.socials?.instagram || "");
  const [linkedinUrl, setLinkedinUrl] = useState(churchInfo.socials?.linkedin || "");

  // Pastor Settings
  const [pastorName, setPastorName] = useState(churchInfo.pastorName);
  const [pastorTitle, setPastorTitle] = useState(churchInfo.pastorTitle);
  const [pastorPhoto, setPastorPhoto] = useState(churchInfo.pastorPhoto);
  const [pastorBio, setPastorBio] = useState(churchInfo.pastorBio);
  const [teamPastors, setTeamPastors] = useState<any[]>(churchInfo.pastors || []);

  // Temporary state for adding a pastor
  const [newPastorName, setNewPastorName] = useState("");
  const [newPastorTitle, setNewPastorTitle] = useState("");
  const [newPastorPhoto, setNewPastorPhoto] = useState("");
  const [newPastorBio, setNewPastorBio] = useState("");
  const [newPastorQuote, setNewPastorQuote] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setWebsiteSettings({
      churchName,
      logoUrl: logoType === "image" ? logoImage : "",
      faviconUrl: faviconUrl,
      moduleToggles: toggles,
      visualTokens: {
        primaryColor,
        secondaryColor,
        headingFont,
        bodyFont: "Inter",
        borderRadius,
      }
    });

    setChurchInfo({
      ...churchInfo,
      name: churchName,
      logoType,
      logoImage,
      footerLogoImage,
      faviconUrl,
      logoSubtitle,
      pastorName,
      pastorTitle,
      pastorPhoto,
      pastorBio,
      pastors: teamPastors,
      socials: {
        facebook: facebookUrl,
        youtube: youtubeUrl,
        instagram: instagramUrl,
        linkedin: linkedinUrl,
        spotify: churchInfo.socials?.spotify || ""
      }
    });

    // Update Favicon link in document head dynamically
    if (faviconUrl) {
      let favEl = document.getElementById("favicon") as HTMLLinkElement;
      if (!favEl) {
        favEl = document.createElement("link");
        favEl.id = "favicon";
        favEl.rel = "icon";
        document.head.appendChild(favEl);
      }
      favEl.href = faviconUrl;
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const addTeamPastor = () => {
    if (!newPastorName || !newPastorTitle) return;
    const newP = {
      id: "p_" + Date.now(),
      name: newPastorName,
      title: newPastorTitle,
      photo: newPastorPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      bio: newPastorBio,
      quote: newPastorQuote
    };
    setTeamPastors([...teamPastors, newP]);
    setNewPastorName("");
    setNewPastorTitle("");
    setNewPastorPhoto("");
    setNewPastorBio("");
    setNewPastorQuote("");
  };

  const removeTeamPastor = (id: string) => {
    setTeamPastors(teamPastors.filter(p => p.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">Website Branding &amp; Configuration</h1>
        <p className="text-sm text-neutral-500 font-medium mt-1">Configure global metadata, active modules, church logo types, and pastoral staff details.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Core details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Church Brand Name</label>
            <input
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Heading Font Family</label>
            <select
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              className="w-full"
            >
              <option value="Sora">Sora (Modern Display Headings)</option>
              <option value="Space Grotesk">Space Grotesk (Tech Display)</option>
              <option value="Playfair Display">Playfair Display (Serif/Editorial)</option>
              <option value="Inter">Inter (Sans-Serif Standard)</option>
            </select>
          </div>
        </div>

        {/* Logo & Brand Asset Customization section */}
        <div className="space-y-4 border-t border-neutral-100 pt-4">
          <h4 className="font-bold text-neutral-700 uppercase tracking-wider">
            1. Brand Logos &amp; Asset Management
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">Header Logo Style</label>
              <select
                value={logoType}
                onChange={(e) => setLogoType(e.target.value as any)}
                className="w-full"
              >
                <option value="text">Typography Brand Text</option>
                <option value="image">Uploaded PNG/JPG Image Icon</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">Header Subtitle (Optional)</label>
              <input
                type="text"
                value={logoSubtitle}
                onChange={(e) => setLogoSubtitle(e.target.value)}
                placeholder="e.g. JOHANNESBURG SOUTH"
                className="w-full"
              />
            </div>
            <div>
              <FileUploadInput
                label="Header Logo (Upload Image)"
                value={logoImage}
                onChange={setLogoImage}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <FileUploadInput
                label="Footer Logo Image (Upload Image)"
                value={footerLogoImage}
                onChange={setFooterLogoImage}
              />
            </div>
            <div>
              <FileUploadInput
                label="Favicon Icon (Upload Image)"
                value={faviconUrl}
                onChange={setFaviconUrl}
              />
            </div>
          </div>
        </div>

        {/* Brand Colors (with strict contrast warnings) */}
        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <h4 className="font-bold text-neutral-700 uppercase tracking-wider">
            2. Brand Palette Tokens
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-600 mb-1">Primary Color (Header/Footers)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-8"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Accent Color (Buttons/Highlights)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-8"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Button Border Radius</label>
              <select
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value as any)}
                className="w-full"
              >
                <option value="none">None (Strict Boxy Retro)</option>
                <option value="sm">Small Radius (6px — Builderrin Style)</option>
                <option value="md">Medium Radius (8px)</option>
                <option value="lg">Large Rounded (12px)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-orange-50 text-orange-800 border border-orange-100 rounded text-[11px] leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block">WCAG AA Contrast Warning:</strong>
              Deep Yellow text on white, or white text on Deep Yellow backgrounds (`#F59E0B`) fails accessibility standards. 
              Always style Deep Yellow fill buttons with deep-purple (`#2E0854`) or black text for optimal readability.
            </div>
          </div>
        </div>

        {/* Senior Pastor settings */}
        <div className="space-y-4 border-t border-neutral-100 pt-4">
          <h4 className="font-bold text-neutral-700 uppercase tracking-wider">
            3. Senior Pastor Profile &amp; Social Links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">Senior Pastor Name</label>
              <input
                type="text"
                value={pastorName}
                onChange={(e) => setPastorName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">Pastor Title / Prefix</label>
              <input
                type="text"
                value={pastorTitle}
                onChange={(e) => setPastorTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <FileUploadInput
                label="Pastor Portrait Photo (Upload or Paste URL)"
                value={pastorPhoto}
                onChange={setPastorPhoto}
              />
              <input
                type="text"
                value={pastorPhoto}
                onChange={(e) => setPastorPhoto(e.target.value)}
                placeholder="Pastor Portrait Image URL..."
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">Brief Bio Narrative</label>
              <textarea
                rows={3}
                value={pastorBio}
                onChange={(e) => setPastorBio(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h5 className="font-bold text-neutral-700 uppercase text-[11px] tracking-wider">Pastor Social Links</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pastoral Leadership Team */}
        <div className="space-y-4 border-t border-neutral-100 pt-4">
          <h4 className="font-bold text-neutral-700 uppercase tracking-wider">
            4. Pastoral Leadership Team
          </h4>
          
          {/* List existing team pastors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamPastors.map((p) => (
              <div key={p.id} className="p-3 border border-neutral-100 rounded bg-neutral-50 flex items-start gap-3 relative">
                <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                <div className="space-y-0.5">
                  <span className="block font-bold text-neutral-800">{p.name}</span>
                  <span className="block text-[10px] text-neutral-500 font-medium">{p.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeTeamPastor(p.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Form to add new pastor */}
          <div className="p-4 bg-purple-50/50 rounded border border-purple-100/50 space-y-3">
            <span className="block font-bold text-[#0F2342] uppercase text-[10px] tracking-wide">Add Leader/Pastor profile</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newPastorName}
                onChange={(e) => setNewPastorName(e.target.value)}
                
              />
              <input
                type="text"
                placeholder="Title / Role (e.g. Executive Pastor)"
                value={newPastorTitle}
                onChange={(e) => setNewPastorTitle(e.target.value)}
                
              />
              <div>
                <FileUploadInput
                  label="Leader/Pastor Portrait Photo"
                  value={newPastorPhoto}
                  onChange={setNewPastorPhoto}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Bio summary"
                value={newPastorBio}
                onChange={(e) => setNewPastorBio(e.target.value)}
                
              />
              <input
                type="text"
                placeholder="Pastoral Quote (Optional)"
                value={newPastorQuote}
                onChange={(e) => setNewPastorQuote(e.target.value)}
                
              />
            </div>
            <button
              type="button"
              onClick={addTeamPastor}
              className="btn-primary-sm"
            >
              ADD TO TEAM LIST
            </button>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <h4 className="font-bold text-neutral-700 uppercase tracking-wider">
            5. Active Feature Modules
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(toggles).map((key) => {
              const checked = (toggles as any)[key];
              return (
                <label key={key} className="flex items-center gap-2.5 p-3 bg-neutral-50 rounded border border-neutral-100 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setToggles({ ...toggles, [key]: e.target.checked });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-bold text-[#0A192F] uppercase tracking-wide">
                    {key}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
          <button
            type="submit"
            className="btn-primary-sm"
          >
            SAVE ALL CONFIGURATIONS
          </button>
          {isSaved && (
            <span className="text-green-700 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Live site and assets re-skinned successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

// MODULE 3: HOMEPAGE HERO MANAGER & SLIDER (REMOVED)

// ==========================================
// MODULE 4: MEDIA LIBRARY & SERMONS
// ==========================================
const AdminMedia: React.FC = () => {
  const { youtubeChannels, addYoutubeChannel, deleteYoutubeChannel, videos, addSermon, deleteSermon } = useChurch();

  // Channel input states
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [channelSuccess, setChannelSuccess] = useState(false);

  // Sermon input states
  const [sermonTitle, setSermonTitle] = useState("");
  const [sermonSpeaker, setSermonSpeaker] = useState("Apostle Eric Malaba");
  const [sermonCategory, setSermonCategory] = useState<"Sermon" | "Worship" | "Testimony">("Sermon");
  const [sermonYoutubeId, setSermonYoutubeId] = useState("");
  const [sermonDescription, setSermonDescription] = useState("");
  const [sermonSeries, setSermonSeries] = useState("Apostolic Service");
  const [sermonSuccess, setSermonSuccess] = useState(false);

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelUrl.trim()) return;
    addYoutubeChannel(newChannelUrl.trim(), newChannelName.trim() || undefined);
    setNewChannelUrl("");
    setNewChannelName("");
    setChannelSuccess(true);
    setTimeout(() => setChannelSuccess(false), 3000);
  };

  const handleAddSermon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle.trim()) return;
    const cleanYid = sermonYoutubeId.trim().replace(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)/, "").split(/[^a-zA-Z0-9_-]/)[0];
    const newVideo: SermonVideo = {
      id: "srv_" + Date.now(),
      title: sermonTitle.trim(),
      speaker: sermonSpeaker.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      category: sermonCategory,
      youtubeId: cleanYid || undefined,
      description: sermonDescription.trim() || "Apostolic sermon recording.",
      series: sermonSeries.trim() || "Apostolic Service",
      thumbnail: cleanYid ? `https://img.youtube.com/vi/${cleanYid}/hqdefault.jpg` : "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=80",
      duration: "45 mins"
    };
    addSermon(newVideo);
    setSermonTitle("");
    setSermonYoutubeId("");
    setSermonDescription("");
    setSermonSuccess(true);
    setTimeout(() => setSermonSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* YouTube Multi-Channel Feed Manager */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-6">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">DYNAMIC LIVE STREAMING ENGINE</span>
          <h2 className="text-xl font-extrabold text-[#1e1548] tracking-tight uppercase flex items-center gap-2 mt-0.5">
            📺 YouTube Channels Feed Importer
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Register your church YouTube channel handle, URL, or Channel ID. The public Sermon Library continuously ingests live streams, recent service recordings, and apostolic messages from all registered feeds automatically.
          </p>
        </div>

        {/* Existing channels list */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Currently Connected Feeds ({youtubeChannels.length})</span>
          {youtubeChannels.length === 0 ? (
            <div className="p-4 border border-dashed border-neutral-300 rounded-lg text-center text-xs text-neutral-500">
              No custom YouTube channel feeds connected. Enter your channel URL or handle below to import live streams automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {youtubeChannels.map((ch) => (
                <div key={ch.id} className="p-3.5 border border-purple-100 rounded-lg bg-purple-50/50 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-[#1e1548] block truncate">{ch.channelName || ch.channelHandle || "YouTube Channel"}</span>
                    <span className="text-[10px] text-neutral-500 font-mono block truncate">{ch.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteYoutubeChannel(ch.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100/60 p-2 rounded cursor-pointer shrink-0 transition-colors"
                    title="Remove Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Channel Form */}
        <form onSubmit={handleAddChannel} className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4 text-xs">
          <span className="block font-bold text-[#1e1548] uppercase text-[11px] tracking-wider">
            ＋ Register New YouTube Channel Feed
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7">
              <label className="block text-neutral-700 mb-1 font-bold">YouTube Channel ID (Required) *</label>
              <input
                type="text"
                required
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                placeholder="e.g. UC4kimR0MvBFVEro4RryplOQ (24-char ID, starts with UC)"
                className="w-full"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Handles (@name) may fail. Find your Channel ID in YouTube Studio settings.</p>
            </div>
            <div className="sm:col-span-5">
              <label className="block text-neutral-700 mb-1 font-bold">Channel Label / Sanctuary Name</label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g. Faith & Fire Main Sanctuary"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              REGISTER YOUTUBE CHANNEL FEED
            </button>
            {channelSuccess && (
              <span className="text-emerald-700 font-bold text-xs animate-pulse">
                ✓ Channel registered! Public Sermon Library is now pulling live videos from this channel.
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Manual Sermon Video Recordings Manager */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-6">
        <div>
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">SERMON ARCHIVE MANAGEMENT</span>
          <h2 className="text-xl font-extrabold text-[#1e1548] tracking-tight uppercase flex items-center gap-2 mt-0.5">
            📹 Manual Sermon & Worship Catalog
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Add custom sermon recordings or standalone video entries directly to the church's media library.
          </p>
        </div>

        {/* Existing manual videos */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Custom Sermon Archives ({videos.length})</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {videos.map((vid) => (
              <div key={vid.id} className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50/50 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1e1548] truncate">{vid.title}</span>
                    <span className="text-[9px] bg-sky-50 text-[#17325B] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">{vid.category}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block truncate">{vid.speaker} • {vid.date}</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSermon(vid.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100/60 p-2 rounded cursor-pointer shrink-0 transition-colors"
                  title="Delete Sermon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Sermon Form */}
        <form onSubmit={handleAddSermon} className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4 text-xs">
          <span className="block font-bold text-[#1e1548] uppercase text-[11px] tracking-wider">
            ＋ Add Custom Sermon Entry
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 mb-1 font-bold">Sermon Title *</label>
              <input
                type="text"
                required
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                placeholder="e.g. Walking in Prophetic Victory"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 mb-1 font-bold">Preacher / Speaker</label>
              <input
                type="text"
                value={sermonSpeaker}
                onChange={(e) => setSermonSpeaker(e.target.value)}
                placeholder="e.g. Apostle Eric Malaba"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 mb-1 font-bold">Category</label>
              <select
                value={sermonCategory}
                onChange={(e) => setSermonCategory(e.target.value as any)}
                className="w-full"
              >
                <option value="Sermon">Sermon</option>
                <option value="Worship">Worship</option>
                <option value="Testimony">Testimony</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 mb-1 font-bold">YouTube Video URL / ID</label>
              <input
                type="text"
                value={sermonYoutubeId}
                onChange={(e) => setSermonYoutubeId(e.target.value)}
                placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-neutral-700 mb-1 font-bold">Description</label>
              <textarea
                rows={2}
                value={sermonDescription}
                onChange={(e) => setSermonDescription(e.target.value)}
                placeholder="Brief summary of message points and key scriptures..."
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              ADD SERMON RECORD
            </button>
            {sermonSuccess && (
              <span className="text-emerald-700 font-bold text-xs animate-pulse">
                ✓ Sermon record saved and added to public library!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODULE 5: EVENTS MANAGER
// ==========================================
const AdminEvents: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useChurch();
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Sunday" | "Midweek" | "Revival" | "Special">("Sunday");
  const [date, setDate] = useState("");
  const [fullDate, setFullDate] = useState("");
  const [time, setTime] = useState("09:00 AM - 11:30 AM");
  const [venue, setVenue] = useState("Main Sanctuary, Rosettenville");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("90% Full");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCategory("Sunday");
    setDate("");
    setFullDate("");
    setTime("09:00 AM - 11:30 AM");
    setVenue("Main Sanctuary, Rosettenville");
    setDescription("");
    setCapacity("90% Full");
    setImage("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800");
    setEditingId(null);
  };

  const handleEditInit = (evt: any) => {
    setEditingId(evt.id);
    setTitle(evt.title);
    setCategory(evt.category);
    setDate(evt.date);
    setFullDate(evt.fullDate);
    setTime(evt.time);
    setVenue(evt.venue);
    setDescription(evt.description);
    setCapacity(evt.capacity || "95% Full");
    setImage(evt.image);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !fullDate) return;

    const eventData = {
      id: editingId || "e_" + Date.now(),
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      date,
      fullDate,
      time,
      venue,
      description,
      image,
      featured: true,
      capacity,
      rsvpCount: 0
    };

    if (editingId) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }

    setSuccess(true);
    resetForm();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Event list */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Public Events Calendar</h2>
            <p className="text-xs text-neutral-500">Edit schedule cards or remove outdated activities.</p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-[#0F2342] hover:bg-[#0A192F] text-white font-bold text-[10px] px-3 py-2 rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4" /> Scan Tickets
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {events.map((evt) => (
            <div key={evt.id} className="p-3 border border-neutral-100 rounded bg-neutral-50 flex justify-between items-center gap-4 text-xs">
              <div>
                <span className="bg-amber-500 text-[#0A192F] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {evt.category} | {evt.date}
                </span>
                <h4 className="font-bold text-neutral-800 text-xs mt-1">{evt.title}</h4>
                <p className="text-[10px] text-neutral-500">{evt.time} &bull; {evt.venue}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEditInit(evt)}
                  className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEvent(evt.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creation Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">
            {editingId ? "Update Event Diary" : "Schedule Event Node"}
          </h2>
          <p className="text-xs text-neutral-500">Inject or revise a diary node on the public calendars.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Night of Holy Fire"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full"
              >
                <option value="Sunday">Sunday Morning</option>
                <option value="Midweek">Midweek Service</option>
                <option value="Revival">Revival Night</option>
                <option value="Special">Special Conference</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Capacity Indicator</label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 85% Full"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Short Date (e.g. "12 Oct") *</label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="12 Oct"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Full Date (e.g. "October 12, 2026") *</label>
              <input
                type="text"
                required
                value={fullDate}
                onChange={(e) => setFullDate(e.target.value)}
                placeholder="October 12, 2026"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Time Range</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <FileUploadInput
                label="Cover Picture Asset (Upload Image File)"
                value={image}
                onChange={setImage}
                accept="image/*"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Campus Venue Name</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Detailed Event Agenda</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What to expect, what to bring..."
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              {editingId ? "Save Event Changes" : "Schedule Event Live"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-primary-sm"
              >
                Cancel
              </button>
            )}
          </div>
          {success && (
            <span className="text-green-700 text-center block font-bold animate-pulse">
              ✓ Event calendar changes applied successfully!
            </span>
          )}
        </form>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md relative">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2 text-[#0A192F] font-bold uppercase tracking-wider text-sm">
                <QrCode className="w-5 h-5 text-amber-500" /> Ticket Scanner
              </div>
              <button onClick={() => { setShowScanner(false); setScanResult(null); }} className="text-neutral-400 hover:text-[#0A192F]">
                &times;
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              {scanResult ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-[#0A192F] uppercase">{scanResult}</h3>
                  <p className="text-xs text-neutral-500">Ticket valid and attendee checked in successfully.</p>
                  <button
                    onClick={() => setScanResult(null)}
                    className="mt-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-4 py-2 rounded text-xs uppercase cursor-pointer"
                  >
                    Scan Another
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-48 h-48 mx-auto border-2 border-amber-400 border-dashed rounded-lg flex items-center justify-center bg-neutral-50 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=400')] bg-cover opacity-20 filter grayscale"></div>
                    <div className="w-full h-0.5 bg-amber-500 absolute top-1/2 left-0 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase relative z-10">Camera Active</span>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">Position the attendee's QR ticket inside the frame to scan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ==========================================
// MODULE 7: SEO CONFIG MANAGER
// ==========================================
const AdminSEO: React.FC = () => {
  const [titleTemplate, setTitleTemplate] = useState("Faith & Fire Ministries Johannesburg South | Holiness Church");
  const [metaDesc, setMetaDesc] = useState("We are a Spirit-filled congregation committed to the unadulterated word of God and the movement of the Holy Spirit. Grounded on Holiness and Righteousness in Johannesburg South.");
  const [ogTitle, setOgTitle] = useState("Where Faith Meets the Fire of Revival");
  const [sitemapState, setSitemapState] = useState("https://faithandfire.org.za/sitemap.xml");
  const [trackingId, setTrackingId] = useState("UA-93821042-1");
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">Search Engine Optimization (SEO)</h1>
        <p className="text-sm text-neutral-500 font-medium mt-1">Configure global tags, Google indexing indexes, and crawl handles.</p>
      </div>

      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">SEO Title Template</label>
            <input
              type="text"
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">OpenGraph OG:Title</label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-neutral-700 font-bold uppercase mb-1">Search Snippet Description</label>
          <textarea
            rows={3}
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Sitemap XML URL</label>
            <input
              type="text"
              value={sitemapState}
              onChange={(e) => setSitemapState(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Google Analytics Measurement ID</label>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="p-3 bg-purple-50 text-[#0A192F] border border-purple-100 rounded text-[11px] leading-relaxed">
          <strong>Crawler Verification File (robots.txt):</strong> Indexed automatically on build. 
          The search maps are pinged with updates upon clicking "Re-crawl Indices".
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
          <button
            onClick={() => {
              setIsSaved(true);
              setTimeout(() => setIsSaved(false), 3000);
            }}
            className="bg-[#0F2342] hover:bg-[#0A192F] text-white font-bold px-6 py-2 rounded transition-colors cursor-pointer text-xs"
          >
            TRANSMIT SEO RE-INDEX
          </button>
          {isSaved && (
            <span className="text-green-700 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Crawler maps re-cached successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MODULE 8: PAGES EDITOR
// ==========================================
const AdminPages: React.FC = () => {
  const { pagesData, setPagesData } = useChurch();
  const [selectedPageId, setSelectedPageId] = useState<string>("about");
  const [success, setSuccess] = useState(false);

  // Active page
  const activePage = pagesData?.find((p) => p.id === selectedPageId) || pagesData?.[0];

  const handleUpdateSectionField = (sectionId: string, field: string, value: string) => {
    const updatedPages = pagesData.map((page) => {
      if (page.id === selectedPageId) {
        const updatedSections = page.sections.map((sec) => {
          if (sec.id === sectionId) {
            return { ...sec, [field]: value };
          }
          return sec;
        });
        return { ...page, sections: updatedSections };
      }
      return page;
    });
    setPagesData(updatedPages);
  };

  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1e1548] tracking-tight uppercase">Structure &amp; Page Blocks</h1>
        <p className="text-xs text-neutral-500">Select any public page tab to edit its sections, text blocks, and graphic uploads live.</p>
      </div>

      {/* Pages Dropdown/Tab System */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-3">
        {pagesData?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPageId(p.id)}
            className={`px-4 py-2 font-bold rounded text-xs transition-all cursor-pointer ${
              selectedPageId === p.id
                ? "bg-[#F59E0B] text-[#0A192F] shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {activePage && (
        <form onSubmit={handleSavePage} className="space-y-6">
          <div className="space-y-6">
            {activePage.sections.map((sec) => (
              <div key={sec.id} className="p-5 border border-neutral-200 rounded-lg bg-neutral-50/50 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                  <span className="text-[10px] font-mono bg-[#0F2342] text-white px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    Block ID: {sec.id}
                  </span>
                  <span className="text-xs font-bold text-neutral-500 uppercase">
                    Editable Section
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {sec.title !== undefined && (
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Section Header / Title</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => handleUpdateSectionField(sec.id, "title", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  {sec.subtitle !== undefined && (
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Section Subtitle / Category Label</label>
                      <input
                        type="text"
                        value={sec.subtitle}
                        onChange={(e) => handleUpdateSectionField(sec.id, "subtitle", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  {sec.content !== undefined && (
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Main Narrative / Content Body</label>
                      <textarea
                        rows={4}
                        value={sec.content}
                        onChange={(e) => handleUpdateSectionField(sec.id, "content", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  {sec.image !== undefined && (
                    <FileUploadInput
                      label="Section Cover/Background Image"
                      value={sec.image}
                      onChange={(imgUrl) => handleUpdateSectionField(sec.id, "image", imgUrl)}
                    />
                  )}

                  {sec.extraText !== undefined && (
                    <div>
                      <label className="block text-neutral-700 font-bold uppercase mb-1">Citation / Extra Attribute Text</label>
                      <input
                        type="text"
                        value={sec.extraText}
                        onChange={(e) => handleUpdateSectionField(sec.id, "extraText", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="btn-primary"
            >
              ✓ SAVE PAGE BLOCKS &amp; REVISIONS
            </button>
            {success && (
              <span className="text-green-700 font-bold animate-pulse text-xs">
                ✓ Page section revisions saved successfully and applied live!
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

// ==========================================
// MODULE 9: NAVIGATION & SOCIAL MANAGER
// ==========================================
const AdminNavigation: React.FC = () => {
  const { churchInfo, setChurchInfo } = useChurch();

  const [facebook, setFacebook] = useState(churchInfo.socials.facebook);
  const [youtube, setYoutube] = useState(churchInfo.socials.youtube);
  const [instagram, setInstagram] = useState(churchInfo.socials.instagram);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChurchInfo({
      ...churchInfo,
      socials: {
        facebook,
        youtube,
        instagram,
        spotify: churchInfo.socials.spotify
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">Navigation &amp; Social Targets</h1>
        <p className="text-sm text-neutral-500 font-medium mt-1">Coordinate official social networks, headers navigation nodes order.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-neutral-700 font-bold uppercase mb-1">Facebook Handle</label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-neutral-700 font-bold uppercase mb-1">YouTube Channel URL</label>
          <input
            type="text"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-neutral-700 font-bold uppercase mb-1">Instagram Profile</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
          <button
            type="submit"
            className="btn-primary-sm"
          >
            SYNCHRONIZE API TARGETS
          </button>
          {isSaved && (
            <span className="text-green-700 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Live links adjusted!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

// ==========================================
// MODULE 10: SECURITY AUDIT LOGS
// ==========================================
// ==========================================
// MODULE 11: MESSAGE INBOX & CONNECT CARDS
// ==========================================
const AdminInbox: React.FC = () => {
  const { messages, setMessages, connectSubmissions, setConnectSubmissions } = useChurch();
  const [inboxTab, setInboxTab] = useState<"messages" | "connect">("messages");
  
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [selectedConnect, setSelectedConnect] = useState<ConnectFormSubmission | null>(null);

  const handleReadMsg = (msg: ContactMessage) => {
    setSelectedMsg(msg);
    setSelectedConnect(null);
    setMessages(messages.map((m) => (m.id === msg.id ? { ...m, status: "Read" as const } : m)));
  };

  const handleReadConnect = (sub: ConnectFormSubmission) => {
    setSelectedConnect(sub);
    setSelectedMsg(null);
    setConnectSubmissions(connectSubmissions.map((s) => (s.id === sub.id ? { ...s, status: "Followed-up" as const } : s)));
  };

  const handleArchiveMsg = (id: string) => {
    setMessages(messages.map((m) => (m.id === id ? { ...m, status: "Archived" as const } : m)));
    setSelectedMsg(null);
  };

  const handleDeleteMsg = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id));
    setSelectedMsg(null);
  };

  const handleStatusConnect = (id: string, nextStatus: ConnectFormSubmission["status"]) => {
    setConnectSubmissions(connectSubmissions.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)));
    setSelectedConnect(null);
  };

  const handleDeleteConnect = (id: string) => {
    setConnectSubmissions(connectSubmissions.filter((s) => s.id !== id));
    setSelectedConnect(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Messages feed */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Administrative Inbox</h2>
          <p className="text-xs text-neutral-500">Read user transmissions, prayer cards, and guest responses.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-neutral-100 p-1 rounded text-xs">
          <button
            type="button"
            onClick={() => {
              setInboxTab("messages");
              setSelectedMsg(null);
              setSelectedConnect(null);
            }}
            className={`flex-1 py-1.5 font-bold rounded text-center transition-all cursor-pointer ${
              inboxTab === "messages"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            CONTACTS ({messages.filter(m => m.status === "Unread").length})
          </button>
          <button
            type="button"
            onClick={() => {
              setInboxTab("connect");
              setSelectedMsg(null);
              setSelectedConnect(null);
            }}
            className={`flex-1 py-1.5 font-bold rounded text-center transition-all cursor-pointer ${
              inboxTab === "connect"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            CONNECT CARDS ({connectSubmissions.filter(s => s.status === "Pending").length})
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {inboxTab === "messages" ? (
            messages.length === 0 ? (
              <p className="text-center text-neutral-400 py-8 text-xs">No guest messages received yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleReadMsg(msg)}
                  className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                    selectedMsg?.id === msg.id
                      ? "bg-purple-50 border-purple-300"
                      : msg.status === "Unread"
                      ? "bg-white border-orange-200 shadow-xs font-bold"
                      : "bg-neutral-50 border-neutral-200/50 opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="truncate text-[#0A192F] font-sans font-bold">{msg.name}</span>
                    <span className="text-[9px] text-neutral-400 shrink-0 font-mono">{msg.timestamp}</span>
                  </div>
                  <h4 className="text-[11px] truncate mt-0.5 text-neutral-800">{msg.subject}</h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-1 font-normal font-sans">
                    {msg.message}
                  </p>
                </div>
              ))
            )
          ) : (
            connectSubmissions.length === 0 ? (
              <p className="text-center text-neutral-400 py-8 text-xs">No Connect Cards submitted yet.</p>
            ) : (
              connectSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleReadConnect(sub)}
                  className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                    selectedConnect?.id === sub.id
                      ? "bg-purple-50 border-purple-300"
                      : sub.status === "Pending"
                      ? "bg-white border-sky-200 shadow-xs font-bold"
                      : "bg-neutral-50 border-neutral-200/50 opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="truncate text-[#0A192F] font-sans font-bold">{sub.name}</span>
                    <span className="text-[9px] text-neutral-400 shrink-0 font-mono">{sub.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-sky-50 text-[#0F2342] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {sub.type}
                    </span>
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                      sub.status === "Pending" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-1 font-normal font-sans">
                    {sub.details}
                  </p>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Reading pane */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 min-h-[350px] flex flex-col justify-between">
        {selectedMsg ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#0A192F]">{selectedMsg.name}</h3>
                  <div className="text-neutral-500 space-y-0.5 font-mono text-[10px] mt-1">
                    <span className="block">Email: {selectedMsg.email}</span>
                    {selectedMsg.phone && <span className="block">Phone: {selectedMsg.phone}</span>}
                  </div>
                </div>
                <span className="bg-amber-500 text-[#0A192F] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0">
                  {selectedMsg.status}
                </span>
              </div>

              {/* Subject copy */}
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  Subject Matter:
                </span>
                <h4 className="text-sm font-bold text-neutral-800 mt-1">{selectedMsg.subject}</h4>
              </div>

              {/* Message body */}
              <div className="p-4 bg-neutral-50 rounded border border-neutral-100 text-sm leading-relaxed text-neutral-700 font-sans italic">
                "{selectedMsg.message}"
              </div>
            </div>

            {/* Actions segment */}
            <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => handleArchiveMsg(selectedMsg.id)}
                  className="bg-neutral-900 text-white hover:bg-neutral-950 px-4 py-2 rounded transition-colors cursor-pointer font-semibold"
                >
                  Archive Message
                </button>
                <button
                  onClick={() => handleDeleteMsg(selectedMsg.id)}
                  className="bg-transparent hover:bg-red-50 text-red-600 px-3 py-2 rounded transition-colors cursor-pointer font-semibold"
                >
                  Delete permanently
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">ID: {selectedMsg.id}</span>
            </div>
          </div>
        ) : selectedConnect ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              {/* Header metadata */}
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#0A192F]">{selectedConnect.name}</h3>
                  <div className="text-neutral-500 space-y-0.5 font-mono text-[10px] mt-1">
                    {selectedConnect.email && <span className="block">Email: {selectedConnect.email}</span>}
                    {selectedConnect.phone && <span className="block">Phone: {selectedConnect.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="bg-[#0F2342] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase">
                    {selectedConnect.type} CARD
                  </span>
                  <span className="bg-amber-500 text-[#0A192F] text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase">
                    {selectedConnect.status}
                  </span>
                </div>
              </div>

              {/* Message body */}
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold mb-1">
                  Connect Card Notes &amp; Requests:
                </span>
                <div className="p-4 bg-purple-50/45 rounded border border-purple-100 text-sm leading-relaxed text-[#0A192F] font-sans font-medium whitespace-pre-wrap">
                  {selectedConnect.details}
                </div>
              </div>
            </div>

            {/* Actions segment */}
            <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-xs">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleStatusConnect(selectedConnect.id, "Followed-up")}
                  className="bg-[#0F2342] text-white hover:bg-[#0A192F] px-3 py-1.5 rounded transition-colors cursor-pointer font-bold uppercase text-[10px]"
                >
                  Mark Followed Up
                </button>
                <button
                  onClick={() => handleStatusConnect(selectedConnect.id, "Prayed")}
                  className="bg-amber-500 text-[#0A192F] hover:bg-orange-700 px-3 py-1.5 rounded transition-colors cursor-pointer font-bold uppercase text-[10px]"
                >
                  Mark Prayed Over
                </button>
                <button
                  onClick={() => handleDeleteConnect(selectedConnect.id)}
                  className="bg-transparent hover:bg-red-50 text-red-600 px-3 py-1.5 rounded transition-colors cursor-pointer font-bold uppercase text-[10px]"
                >
                  Dismiss card
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">ID: {selectedConnect.id}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
            <Mail className="w-12 h-12 text-neutral-300 animate-bounce" />
            <span className="font-bold text-sm text-neutral-500">NO TRANSMISSION OPENED</span>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Select any message or connect card tab on the left pane to initialize reading, marking status, and routing follow-ups.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MODULE 12: MEMBERS & CHECK-IN LIST
// ==========================================
const AdminMembers: React.FC = () => {
  const { members, attendance, addMember, ministries } = useChurch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [whatsappCareText, setWhatsappCareText] = useState("");

  // Update default whatsapp template when selected member changes
  useEffect(() => {
    if (selectedMember) {
      setWhatsappCareText(`Shalom ${selectedMember.firstName}, peace be unto you! Just following up from Faith & Fire Ministries. How can we stand in prayer with you this week?`);
    }
  }, [selectedMember]);

  // New member manual fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [success, setSuccess] = useState(false);

  const statuses = ["All", "Active", "Inactive"];

  const filteredMembers = members.filter((m) => {
    const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                          m.email.toLowerCase().includes(search.toLowerCase()) ||
                          m.phone.includes(search);
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAttendanceHealth = (memberId: string): "Green" | "Amber" | "Red" => {
    const memberAttendance = attendance.filter(a => a.memberId === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (memberAttendance.length === 0) return "Red";
    
    // Check if attended in last 14 days
    const lastAttended = new Date(memberAttendance[0].date);
    const daysSinceLast = Math.floor((new Date().getTime() - lastAttended.getTime()) / (1000 * 3600 * 24));
    
    if (daysSinceLast <= 14 && memberAttendance.length >= 2) return "Green"; // Regular recent
    if (daysSinceLast <= 30) return "Amber"; // Irregular but attended within a month
    return "Red"; // Hasn't attended in over a month
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;

    addMember(firstName, lastName, email, phone, suburb || "Rosettenville, JHB", []);
    setSuccess(true);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSuburb("");
    setTimeout(() => setSuccess(false), 3000);
  };

  // Generate 52 weeks heatmap mock data for selected member
  const getHeatmapWeeks = (memberId: string) => {
    const memberAttendance = attendance.filter((a) => a.memberId === memberId);
    const weeks = [];
    const now = new Date();
    const weekCounts = new Map<number, number>();
    memberAttendance.forEach((a) => {
      const d = new Date(a.date);
      if (isNaN(d.getTime())) return;
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekKey = Math.floor((now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekKey >= 0 && weekKey < 52) {
        weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1);
      }
    });
    for (let i = 0; i < 52; i++) {
      // Intensity 0-3 derived from real check-in counts (capped at 3).
      weeks.push({ week: i + 1, count: Math.min(weekCounts.get(51 - i) || 0, 3) });
    }
    return weeks;
  };

  return (
    <div className="space-y-6">
      {/* Header section split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Members registry */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Membership Registry</h2>
              <p className="text-xs text-neutral-500">Click any member name to inspect their full profile, attendance heatmap, and ministry memberships.</p>
            </div>
            <span className="bg-sky-50 text-[#0F2342] text-xs font-bold px-2.5 py-1 rounded">
              {filteredMembers.length} Members listed
            </span>
          </div>

          {/* Search filters */}
          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Member list table */}
          <div className="border border-neutral-100 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/60">
                  <th className="p-3">Member Name</th>
                  <th className="p-3">Contact Details</th>
                  <th className="p-3">Location/Suburb</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="hover:bg-purple-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-3 font-sans font-bold text-neutral-800 group-hover:text-[#0F2342]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0F2342] flex items-center justify-center font-bold text-xs shrink-0 relative">
                          {m.firstName[0]}{m.lastName[0]}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            getAttendanceHealth(m.id) === 'Green' ? 'bg-emerald-500' :
                            getAttendanceHealth(m.id) === 'Amber' ? 'bg-amber-400' : 'bg-red-500'
                          }`} title={`Attendance: ${getAttendanceHealth(m.id)}`} />
                        </div>
                        <div>
                          <span>{m.firstName} {m.lastName}</span>
                          <span className="block text-[9px] text-neutral-400 font-mono">ID: {m.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-neutral-600">
                      <span className="block">{m.phone}</span>
                      <span className="block text-neutral-400">{m.email}</span>
                    </td>
                    <td className="p-3 text-neutral-600">{m.suburb}</td>
                    <td className="p-3 text-neutral-500">{m.joinedDate}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const digits = m.phone.replace(/[^0-9]/g, '');
                            const text = encodeURIComponent(`Shalom ${m.firstName}, peace be unto you! Just following up from Faith & Fire Ministries. How can we stand in prayer with you this week?`);
                            window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer flex items-center gap-1"
                          title="Trigger WhatsApp Message"
                        >
                          💬 <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember(m);
                          }}
                          className="bg-[#0F2342] hover:bg-[#0A192F] text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member entry form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Create Member Record</h2>
            <p className="text-xs text-neutral-500">Add a new local believer manually.</p>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Thabo"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mokoena"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thabo@gmail.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 82 123 4567"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Suburb / Location</label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Rosettenville, JHB"
                className="w-full"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-sm w-full"
            >
              REGISTER MEMBER RECORD
            </button>
            {success && (
              <span className="text-green-700 text-center block font-bold animate-pulse">
                ✓ Member added to registry successfully!
              </span>
            )}
          </form>
        </div>
      </div>

      {/* MEMBER PROFILE MODAL */}
      {selectedMember && (
        <AdminMemberProfile
          member={selectedMember}
          attendance={attendance}
          ministries={ministries}
          onClose={() => setSelectedMember(null)}
          onUpdateMember={setSelectedMember}
        />
      )}

      {/* Live Check-in Logs list */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Live Checked-in Logs</h2>
          <p className="text-xs text-neutral-500">Checked-in logs updated from the public self check-in desk.</p>
        </div>

        <div className="border border-neutral-100 rounded overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/60">
                <th className="p-3">Member Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Service Name</th>
                <th className="p-3">Checked In Date</th>
                <th className="p-3">Checked In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400 font-sans">
                    No active members logged for this Sunday yet. Try checking in a member at the top "QR Check-in" menu!
                  </td>
                </tr>
              ) : (
                attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="p-3 font-sans font-bold text-neutral-800">{att.memberName}</td>
                    <td className="p-3 text-neutral-500">{att.memberEmail}</td>
                    <td className="p-3 text-[#0F2342] font-semibold">{att.serviceName}</td>
                    <td className="p-3 text-neutral-400">{att.date}</td>
                    <td className="p-3 text-amber-500 font-semibold">{att.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================


export const AdminPayFast: React.FC = () => {
  const { bankingDetails, setBankingDetails, currentUser } = useChurch();

  const [merchantId, setMerchantId] = useState("");
  const [merchantKey, setMerchantKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [sandbox, setSandbox] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Credentials are stored in the admin-only settings/payfast_credentials
  // document (never in the publicly readable church_info document).
  useEffect(() => {
    getDoc(doc(db, "settings", "payfast_credentials")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMerchantId(data.merchantId || "");
        setMerchantKey(data.merchantKey || "");
        setPassphrase(data.passphrase || "");
        setSandbox(data.sandbox !== false);
      }
    }).catch((e) => console.warn("PayFast credentials load failed:", e))
      .finally(() => setIsLoading(false));
  }, []);

  // Banking Details state
  const [bankName, setBankName] = useState(bankingDetails?.bankName || "First National Bank");
  const [accountName, setAccountName] = useState(bankingDetails?.accountName || "Faith & Fire Ministries");
  const [accountNumber, setAccountNumber] = useState(bankingDetails?.accountNumber || "623 456 789 01");
  const [accountType, setAccountType] = useState(bankingDetails?.accountType || "Cheque");
  const [branchCode, setBranchCode] = useState(bankingDetails?.branchCode || "250655");
  const [swiftCode, setSwiftCode] = useState(bankingDetails?.swiftCode || "FIRNZAJJ");
  const [referenceFormat, setReferenceFormat] = useState(bankingDetails?.referenceFormat || "SURNAME + FUND");
  const [isBankSaved, setIsBankSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "payfast_credentials"), {
        merchantId: merchantId.trim(),
        merchantKey: merchantKey.trim(),
        passphrase: passphrase.trim(),
        sandbox,
        updatedBy: currentUser?.uid || null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save PayFast credentials:", err);
      alert("Unable to save credentials. Admin access is required.");
    }
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBankingDetails({
      bankName,
      accountName,
      accountNumber,
      accountType,
      branchCode,
      swiftCode,
      referenceFormat
    });
    setIsBankSaved(true);
    setTimeout(() => setIsBankSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* 1. PayFast Settings */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
<div>
            <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight">PayFast Gateway Settings</h1>
            <p className="text-sm text-neutral-500 font-medium mt-1">Configure your South African PayFast merchant credentials for real-time online giving.</p>
            {isLoading && (
              <p className="text-[10px] text-neutral-400 font-mono mt-1">Loading stored credentials…</p>
            )}
          </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Merchant ID</label>
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full"
              placeholder="Enter your PayFast Merchant ID"
              required
            />
            <span className="text-[10px] text-neutral-400">Your unique PayFast Merchant Identifier.</span>
          </div>
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Merchant Key</label>
            <input
              type="text"
              value={merchantKey}
              onChange={(e) => setMerchantKey(e.target.value)}
              className="w-full"
              placeholder="Enter your PayFast Merchant Key"
              required
            />
            <span className="text-[10px] text-neutral-400">Your secret PayFast Merchant Key.</span>
          </div>
          <div>
            <label className="block text-neutral-700 font-bold uppercase mb-1">Passphrase (Optional)</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full"
              placeholder="Leave empty if not set on PayFast dashboard"
            />
            <span className="text-[10px] text-neutral-400">Required if secure signature generation is enabled with a passphrase on your PayFast profile.</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pf_sandbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="pf_sandbox" className="text-neutral-700 font-bold uppercase cursor-pointer select-none">
              Enable Sandbox Mode (Test Payments)
            </label>
          </div>

          {isSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded font-semibold text-center">
              PayFast Gateway configuration synchronized successfully!
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              SYNCHRONIZE CREDENTIALS
            </button>
          </div>
        </form>
      </div>

      {/* 2. Direct Banking Details (Frontend Display) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight uppercase">EFT Banking Details (Frontend Display)</h2>
          <p className="text-xs text-neutral-500">
            Manage the official banking coordinates displayed to members on the public "Give / Sacrificial Giving" page for direct EFT deposits.
          </p>
        </div>

        <form onSubmit={handleBankSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. First National Bank"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Account Holder Name *</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Faith & Fire Ministries"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 623 456 789 01"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Account Type *</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full"
              >
                <option value="Cheque">Cheque / Current Account</option>
                <option value="Savings">Savings Account</option>
                <option value="Corporate">Corporate / NPO Account</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Branch Code *</label>
              <input
                type="text"
                required
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="e.g. 250655"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">SWIFT / BIC Code (Optional)</label>
              <input
                type="text"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="e.g. FIRNZAJJ"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold uppercase mb-1">Reference Format Guidance</label>
              <input
                type="text"
                value={referenceFormat}
                onChange={(e) => setReferenceFormat(e.target.value)}
                placeholder="e.g. SURNAME + TITHE / SEED"
                className="w-full"
              />
            </div>
          </div>

          {isBankSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded font-semibold text-center">
              ✓ Banking details updated live on the user Give screen!
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
            <button
              type="submit"
              className="btn-primary-sm"
            >
              SAVE BANKING DETAILS LIVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODULE: ADMIN SECURITY STATUS
// Shows real, verifiable security posture from
// Firestore data (admins + audit log) and the
// documented platform controls. No fabricated
// sessions, WAF events, or scan results.
// ==========================================
export const AdminSecuritySystem: React.FC = () => {
  const { users, auditLogs } = useChurch();

  const staffAdmins = users.filter(
    (u) => u.role === "SuperAdmin" || u.role === "Admin" || u.role === "Pastor" || u.role === "Minister" || u.role === "DepartmentLeader"
  );

  const recentAudits = auditLogs.slice(0, 12);

  const implementedControls: { title: string; detail: string }[] = [
    {
      title: "Verified-email access control",
      detail: "All staff-level access requires a verified email address; role checks are enforced from Firebase custom claims in both Firestore and Storage rules."
    },
    {
      title: "Server-only privilege changes",
      detail: "Role assignment, admin invites, and password resets run exclusively through privileged Cloud Functions (setUserRole, createAdminInvite, adminSendPasswordReset). Clients can never write the role field."
    },
    {
      title: "Append-only audit trail",
      detail: "Every server-side action (role changes, invites, check-ins, payments, resets) is written to the immutable auditLogs collection. Audit entries can never be modified or deleted by any client."
    },
    {
      title: "Strict schema enforcement",
      detail: "Every Firestore collection is locked to an allowlisted field schema (hasOnly) with server-stamped timestamps; unknown or spoofed fields are rejected at the rules layer."
    },
    {
      title: "Payment credential isolation",
      detail: "PayFast merchant credentials are stored only in the admin-protected settings/payfast_credentials document and are never exposed to the browser or public settings."
    },
    {
      title: "Server-side identity verification",
      detail: "Member check-ins resolve the member server-side (id/email/phone) and verify the kiosk PIN on the server; guests are rate-limited to 3 check-ins per email per minute."
    },
    {
      title: "Open-redirect protection",
      detail: "PayFast return URLs are validated against a strict app-origin allowlist server-side before being accepted."
    },
    {
      title: "Idempotent payment processing",
      detail: "PayFast ITN callbacks are processed in a Firestore transaction keyed by the transaction document; duplicate or concurrent notifications can never double-credit a donation."
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER BANNER */}
      <div className="bg-[#111625] text-white p-6 md:p-8 rounded-2xl border border-neutral-800 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400 shrink-0" />
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">
                SECURITY STATUS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Platform Security &amp; Audit
            </h1>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              The live security posture of this installation — implemented controls, the administrator
              roster, and the immutable audit trail. All figures below come from production Firestore data.
            </p>
          </div>
        </div>
      </div>

      {/* IMPLEMENTED CONTROLS */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <h3 className="text-sm font-black text-[#0A192F] uppercase tracking-tight mb-4">
          Implemented Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {implementedControls.map((c) => (
            <div key={c.title} className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-extrabold text-neutral-900 uppercase">{c.title}</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ADMIN ROSTER (REAL) */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <h3 className="text-sm font-black text-[#0A192F] uppercase tracking-tight mb-1">
          Administrator Roster
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          {staffAdmins.length} staff account{staffAdmins.length === 1 ? "" : "s"} with privileged role claims, sourced from the users collection.
        </p>
        {staffAdmins.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-neutral-400">
            No staff accounts found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-mono font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role (Claim)</th>
                  <th className="p-3">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {staffAdmins.map((u) => (
                  <tr key={u.uid}>
                    <td className="p-3 font-bold text-[#0A192F]">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === "SuperAdmin" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-500">
                      {u.createdAt?.toMillis ? new Date(u.createdAt.toMillis()).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AUDIT TRAIL (REAL) */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <h3 className="text-sm font-black text-[#0A192F] uppercase tracking-tight mb-1">
          Recent Audit Trail
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          The latest {recentAudits.length} entries from the append-only auditLogs collection.
        </p>
        {recentAudits.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-neutral-400">
            No audit entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-mono font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {recentAudits.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 text-neutral-500 font-mono">
                      {log.timestamp?.toMillis ? new Date(log.timestamp.toMillis()).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 font-bold text-[#0A192F]">{log.action}</td>
                    <td className="p-3 text-neutral-500 font-mono">{log.resource}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MODULE: ADMIN QR CODE GENERATOR SYSTEM
// ==========================================
const AdminQRGenerator: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState("sunday-checkin");
  const [title, setTitle] = useState("Sunday Glory Service Check-In");
  const [category, setCategory] = useState("SANCTUARY ATTENDANCE");
  const [payload, setPayload] = useState("https://faithandfireministries.co.za/qr-checkin?service=Sunday Glory Service");
  const [fgColor, setFgColor] = useState("#0A192F");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(220);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const presets = [
    {
      id: "sunday-checkin",
      title: "Sunday Glory Service Check-In",
      category: "SANCTUARY ATTENDANCE",
      payload: "https://faithandfireministries.co.za/qr-checkin?service=Sunday Glory Service",
      fgColor: "#0A192F"
    },
    {
      id: "plan-visit",
      title: "Plan Your Visit Card",
      category: "FIRST-TIME GUEST",
      payload: "https://faithandfireministries.co.za/#plan-your-visit",
      fgColor: "#ea580c"
    },
    {
      id: "prayer-request",
      title: "Prayer Request Portal",
      category: "PASTORAL CARE",
      payload: "https://faithandfireministries.co.za/#contact?module=prayer",
      fgColor: "#ea580c"
    },
    {
      id: "counseling",
      title: "Pastoral Counseling Request",
      category: "PASTORAL CARE",
      payload: "https://faithandfireministries.co.za/#contact?module=counselling",
      fgColor: "#0f766e"
    },
    {
      id: "new-converts",
      title: "Salvation & New Converts",
      category: "DISCIPLESHIP TRACK",
      payload: "https://faithandfireministries.co.za/#contact?module=new-converts",
      fgColor: "#b91c1c"
    },
    {
      id: "new-members",
      title: "New Members Membership Form",
      category: "DISCIPLESHIP TRACK",
      payload: "https://faithandfireministries.co.za/#contact?module=new-members",
      fgColor: "#1d4ed8"
    },
    {
      id: "online-giving",
      title: "PayFast Online Giving & Tithes",
      category: "KINGDOM GIVING",
      payload: "https://faithandfireministries.co.za/#give",
      fgColor: "#15803d"
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPayload(p.payload);
    setFgColor(p.fgColor);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(payload);
    setCopiedMsg("✓ QR Payload Link Copied to Clipboard!");
    setTimeout(() => setCopiedMsg(null), 3000);
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_qr.png`;
      a.click();
    }
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] via-purple-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-[#0F2342]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block">
            ADMINISTRATIVE ENGINE
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-0.5">
            QR Code Generator &amp; Print System
          </h1>
          <p className="text-xs text-sky-200 mt-1 max-w-xl leading-relaxed">
            Generate, customize, and export high-resolution vector QR codes for sanctuary check-in doors, pastoral connection forms, online giving, and discipleship tracks.
          </p>
        </div>
        <span className="bg-amber-500 text-[#0A192F] text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider shrink-0 shadow-md">
          100% OPERATIONAL
        </span>
      </div>

      {/* Preset Buttons Bar */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Quick Preset QR Templates:
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                selectedPreset === p.id
                  ? "bg-[#0A192F] text-white shadow-md scale-[1.02]"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Form Controls */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-[#0A192F] uppercase tracking-tight">
              QR Code Customization Settings
            </h3>
            <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">
              LIVE PREVIEW ENGINE
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-800 uppercase mb-1">
                Display Title (Poster / Card Label)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 uppercase mb-1">
                Category / Badge Tag
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 uppercase mb-1">
                Target URL or QR Payload Text
              </label>
              <input
                type="text"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10"
                  />
                  <span className="font-mono text-xs font-bold text-neutral-600">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10"
                  />
                  <span className="font-mono text-xs font-bold text-neutral-600">{bgColor}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-neutral-800 uppercase">
                  Render Resolution / Size
                </label>
                <span className="font-mono text-xs font-bold text-[#0A192F]">{qrSize}px</span>
              </div>
              <input
                type="range"
                min="140"
                max="340"
                step="20"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Card Preview & Downloads */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0A192F] via-[#111625] to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-[#0F2342]/40 text-center space-y-6">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest">
              OFFICIAL CHURCH QR CARD
            </span>
            <span className="bg-amber-500 text-[#0A192F] text-[9px] font-black px-2 py-0.5 rounded uppercase">
              HIGH RES
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-orange-300 font-bold uppercase tracking-wider block">
              {category}
            </span>
            <h3 className="text-xl font-extrabold tracking-tight uppercase text-white">
              {title}
            </h3>
          </div>

          {/* QR Canvas Render */}
          <div ref={canvasRef} className="p-4 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-400/30 mx-auto">
            <QRCodeCanvas
              value={payload}
              size={qrSize}
              bgColor={bgColor}
              fgColor={fgColor}
              level="H"
              marginSize={2}
            />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-mono text-neutral-300 truncate max-w-xs mx-auto bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              {payload}
            </p>
            <span className="text-[10px] text-neutral-400 block font-mono">Point camera to open link</span>
          </div>

          {copiedMsg && (
            <div className="bg-emerald-500 text-[#0A192F] text-xs font-black p-2 rounded-lg shadow animate-bounce">
              {copiedMsg}
            </div>
          )}

          {/* Export Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadPng}
              className="btn-primary-sm w-full"
            >
              <span>📥 Download High-Res PNG Image</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="btn-primary-sm"
              >
                📋 Copy Link
              </button>
              <button
                onClick={handlePrintPoster}
                className="btn-primary-sm"
              >
                🖨 Print Poster
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 12. ATTENDANCE ANALYTICS
// ==========================================
const AdminAnalytics: React.FC = () => {
  const { attendance, members } = useChurch();
  
  // Calculate stats
  const totalAttendance = attendance.length;
  const uniqueAttendees = new Set(attendance.map(a => a.memberId)).size;
  // Real average: unique attendance per calendar week of the latest 4 weeks
  // with data. Returns 0 (rendered as an honest "no data yet" state) when
  // there are no attendance records at all.
  const averageAttendance = useMemo(() => {
    const now = new Date();
    const weekOf = (d: Date) => {
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return monday.toISOString().split("T")[0];
    };
    const weeks = new Map<string, Set<string>>();
    attendance.forEach((a) => {
      const d = new Date(a.date);
      if (isNaN(d.getTime())) return;
      const wk = weekOf(d);
      if (!weeks.has(wk)) weeks.set(wk, new Set());
      weeks.get(wk)!.add(a.memberId || a.id);
    });
    if (weeks.size === 0) return 0;
    const sortedWeeks = [...weeks.keys()].sort((a, b) => (a < b ? -1 : 1)).slice(-4);
    const counts = sortedWeeks.map((wk) => weeks.get(wk)!.size);
    return Math.round(counts.reduce((s, c) => s + c, 0) / counts.length);
  }, [attendance]);
  const visitorsCount = attendance.filter(a => a.serviceName === "Guest Check-in" || !a.memberId).length;

  // Calculate attendance by service
  const serviceCounts = attendance.reduce((acc, curr) => {
    acc[curr.serviceName] = (acc[curr.serviceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceColors = ["bg-[#2563eb]", "bg-amber-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"];
  
  const serviceData = Object.entries(serviceCounts).map(([name, count], idx) => {
    const percentage = totalAttendance > 0 ? Math.round((count / totalAttendance) * 100) : 0;
    return { name, percentage, color: serviceColors[idx % serviceColors.length] };
  }).sort((a, b) => b.percentage - a.percentage);

  // Calculate demographics from members DOB
  const demographics = { "Youth/Kids (<18)": 0, "Adults (18-35)": 0, "Adults (36-55)": 0, "Seniors (55+)": 0, "Unknown Age": 0 };
  const currentYear = new Date().getFullYear();
  members.forEach(m => {
    if (m.dob) {
      const age = currentYear - new Date(m.dob).getFullYear();
      if (age < 18) demographics["Youth/Kids (<18)"]++;
      else if (age <= 35) demographics["Adults (18-35)"]++;
      else if (age <= 55) demographics["Adults (36-55)"]++;
      else demographics["Seniors (55+)"]++;
    } else {
      demographics["Unknown Age"]++;
    }
  });
  
  const totalMembers = members.length;
  const demoData = Object.entries(demographics).filter(([_, count]) => count > 0).map(([name, count], idx) => {
    const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
    return { name, percentage, color: serviceColors[idx % serviceColors.length] };
  }).sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
          Attendance Analytics
        </h1>
        <p className="text-xs text-neutral-400 font-semibold max-w-2xl leading-relaxed">
          Detailed metrics on church growth, service attendance, and visitor retention.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">TOTAL ATTENDANCE</span>
          <span className="text-5xl font-black text-[#1e1548] font-sans leading-none">{totalAttendance}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">UNIQUE ATTENDEES</span>
          <span className="text-5xl font-black text-[#1e1548] font-sans leading-none">{uniqueAttendees}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">AVERAGE WEEKLY</span>
          <span className="text-5xl font-black text-[#f97316] font-sans leading-none">{averageAttendance > 0 ? averageAttendance : "—"}</span>
          {averageAttendance === 0 && (
            <span className="text-[10px] font-bold text-neutral-400">No data yet</span>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">FIRST-TIME VISITORS</span>
          <span className="text-5xl font-black text-emerald-600 font-sans leading-none">{visitorsCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
          <h2 className="text-lg font-extrabold text-[#1e1548] mb-6 uppercase tracking-wider">Attendance by Service</h2>
          <div className="space-y-4">
            {serviceData.length > 0 ? serviceData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs font-bold mb-1 text-neutral-600">
                  <span>{item.name}</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-neutral-500 italic">No attendance data yet.</p>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
          <h2 className="text-lg font-extrabold text-[#1e1548] mb-6 uppercase tracking-wider">Demographics Breakdown</h2>
          <div className="space-y-4">
            {demoData.length > 0 ? demoData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs font-bold mb-1 text-neutral-600">
                  <span>{item.name}</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-neutral-500 italic">No member demographic data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 13. CHURCH CALENDAR

// ==========================================
// 14. VOLUNTEER ROSTER & SCHEDULING
// ==========================================

// ==========================================
// 15. MEMBERSHIP CLASSES
// ==========================================




// ==========================================
// 17. PRAYER MANAGEMENT
// ==========================================
export const AdminPrayer: React.FC = () => {
  const { connectSubmissions } = useChurch();
  const prayerRequests = connectSubmissions.filter(sub => sub.type === "Prayer");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Prayer Wall & Management
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Review incoming prayer requests, assign intercessors, and track testimonies.
          </p>
        </div>
      </div>

      {prayerRequests.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-500">
          No prayer requests submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prayerRequests.map(req => (
            <div key={req.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-48 relative overflow-hidden">
              {req.status === 'Followed-up' && (
                <div className="absolute -right-6 top-4 bg-green-500 text-white text-[8px] font-bold uppercase py-1 px-8 rotate-45">
                  Testimony
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                    req.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                    req.status === 'Prayed' ? 'bg-sky-50 text-[#17325B]' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono">{new Date(req.timestamp).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-xs text-[#1e1548] mb-1">{req.name || 'Anonymous'}</h3>
                <p className="text-[11px] text-neutral-600 line-clamp-3 leading-relaxed">{req.details}</p>
              </div>
              
              <div className="border-t border-neutral-100 pt-3 mt-3 flex justify-between items-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase">Assigned to: Intercessory Team</span>
                <button className="text-[10px] font-bold text-purple-700 hover:underline">Update Status</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 18. COMMUNICATIONS & BROADCASTING
// ==========================================

// ==========================================
// 19. GIVING & CAMPAIGNS (RESTRICTED)
// ==========================================
export const AdminGiving: React.FC = () => {
  const { donations, campaigns } = useChurch();

  const totalGiven = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const settledCount = donations.filter((d) => (d as any).status !== "PENDING").length;
  const fundTotals: { fund: string; total: number }[] = [];
  donations.forEach((d) => {
    const existing = fundTotals.find((f) => f.fund === d.fund);
    if (existing) existing.total += Number(d.amount) || 0;
    else fundTotals.push({ fund: d.fund, total: Number(d.amount) || 0 });
  });
  fundTotals.sort((a, b) => b.total - a.total);

  const raisedFor = (title: string) =>
    donations.filter((d) => d.fund.toLowerCase() === title.toLowerCase()).reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const formatRand = (amount: number) => "R " + amount.toLocaleString("en-ZA", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-4 -right-4 bg-red-100 border border-red-200 text-red-800 font-bold px-3 py-1 text-[10px] uppercase rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Finance Role Only
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Giving & Campaigns
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Track donations, manage recurring pledges, and monitor capital campaigns.
          </p>
        </div>
        <button className="btn-primary-sm" disabled title="Report export is not yet implemented">
          <PieChart className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Received</p>
          <p className="text-2xl font-black text-[#1e1548] mt-1">{formatRand(totalGiven)}</p>
          <p className="text-[10px] text-neutral-400 font-mono mt-1">{donations.length} donation record(s)</p>
        </div>
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Settled Payments</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{settledCount}</p>
          <p className="text-[10px] text-neutral-400 font-mono mt-1">Confirmed by payment provider</p>
        </div>
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Active Campaigns</p>
          <p className="text-2xl font-black text-[#1e1548] mt-1">{campaigns.filter((c) => !c.status || c.status !== "Completed").length}</p>
          <p className="text-[10px] text-neutral-400 font-mono mt-1">In the campaigns collection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <h2 className="text-sm font-bold text-[#0A192F] uppercase border-b border-neutral-100 pb-2 mb-4">Capital Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-center text-neutral-400 font-bold uppercase text-[10px] tracking-widest py-8">No campaigns created yet.</p>
          ) : (
            <div className="space-y-6">
              {campaigns.map((c) => {
                const raised = raisedFor(c.title || c.name || "");
                const label = c.title || c.name || c.id;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-800">{label}</h4>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Status: {c.status || "Active"} · Target: not configured</p>
                      </div>
                      <span className="font-black text-emerald-600">{formatRand(raised)}</span>
                    </div>
                    <p className="text-[9px] text-neutral-400 text-right mt-1 font-bold">{raised > 0 ? `${raised.toLocaleString("en-ZA")} raised across matching fund donations` : "No matching fund donations yet"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#0A192F] uppercase">Recent Giving History</h2>
          </div>
          {donations.length === 0 ? (
            <div className="p-10 text-center text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
              No donations recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="p-3 font-bold text-neutral-500 uppercase">Donor</th>
                  <th className="p-3 font-bold text-neutral-500 uppercase">Fund</th>
                  <th className="p-3 font-bold text-neutral-500 uppercase text-right">Amount</th>
                  <th className="p-3 font-bold text-neutral-500 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {donations.slice(0, 8).map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="p-3">
                      <span className="font-bold text-neutral-800 block">{d.firstName || d.lastName ? `${d.firstName || ""} ${d.lastName || ""}`.trim() : "Anonymous"}</span>
                      <span className="text-[9px] text-neutral-400 font-mono">{d.date}</span>
                    </td>
                    <td className="p-3 text-neutral-600 font-bold text-[10px] uppercase">{d.fund}</td>
                    <td className="p-3 text-right font-black text-emerald-700">{formatRand(Number(d.amount) || 0)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${(d as any).status === "PENDING" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {(d as any).status === "PENDING" ? "Pending" : "Settled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};




// ==========================================
// NEW MODULE: FORMS & SURVEYS (Task 2)
// ==========================================
interface AdminFormItem { id: string; title: string; type: string; isActive: boolean; createdAt: string; responses: number; fields: string[]; }




// ==========================================
// NEW MODULE: MEMBERS HUB (Task 5)
// ==========================================
const AdminMembersModule: React.FC<{ initialTab?: "roster" | "care" | "analytics" | "reports" | "import" }> = ({ initialTab = "roster" }) => {
  const [activeTab, setActiveTab] = useState<"roster" | "care" | "analytics" | "reports" | "import">(initialTab);
  const memberTabs = [{ id: "roster", label: "Member Roster" }, { id: "care", label: "Pastoral Care" }, { id: "analytics", label: "Analytics" }, { id: "reports", label: "Reports" }, { id: "import", label: "Import & Export" }] as const;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">Church Community</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Members</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-100">Complete member management — roster, pastoral care, analytics, reports and data portability.</p>
      </div>
      <div className="flex gap-1 flex-wrap border-b border-neutral-200">
        {memberTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-teal-600 text-teal-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "roster" && <AdminMembers />}
      {activeTab === "care" && <AdminCare />}
      {activeTab === "analytics" && <AdminAnalytics />}
      
      {activeTab === "reports" && <AdminReports />}
      {activeTab === "import" && <AdminImportExport />}
    </div>
  );
};


// ==========================================
// NEW MODULE: FOLLOW-UP HUB (Task 6)
// ==========================================
const AdminFollowUpModule: React.FC<{ initialTab?: "followups" | "tasks" | "firsttimers" | "whatsapp" }> = ({ initialTab = "followups" }) => {
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


// ==========================================
// NEW MODULE: NEXT STEPS (Task 10)
// ==========================================
const AdminNextSteps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ministries" | "classes">("ministries");
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Discipleship Journey</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Next Steps</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100">Manage ministries and discipleship classes — helping members take their next step in faith.</p>
      </div>
      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "ministries", label: "Ministries" }, { id: "classes", label: "Membership Classes" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-amber-600 text-amber-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "ministries" && <AdminMinistries />}
      {activeTab === "classes" && <AdminClasses />}
    </div>
  );
};


// ==========================================
// NEW MODULE: FINANCE & GIVING (Task 8)
// ==========================================
const AdminFinanceGiving: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"giving" | "campaigns" | "payfast">("giving");
  const { campaigns, donations } = useChurch();
  const raisedFor = (title: string) =>
    donations.filter((d) => d.fund.toLowerCase() === (title || "").toLowerCase()).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const formatRand = (amount: number) => "R " + amount.toLocaleString("en-ZA", { maximumFractionDigits: 2 });
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Financial Management</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Finance & Giving</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">Complete financial hub — giving dashboard, campaigns and PayFast payment settings.</p>
      </div>
      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "giving", label: "Giving Dashboard" }, { id: "campaigns", label: "Campaigns" }, { id: "payfast", label: "PayFast Settings" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-emerald-600 text-emerald-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "giving" && <AdminGiving />}
      {activeTab === "campaigns" && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-[#1e1548] uppercase text-sm tracking-widest">Giving Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-center text-neutral-400 font-bold uppercase text-[10px] tracking-widest py-10">No campaigns created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((c) => {
                const raised = raisedFor(c.title || c.name || "");
                return (
                  <div key={c.id} className="p-4 border border-neutral-200 rounded-xl hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-[#1e1548] text-sm">{c.title || c.name || c.id}</h3>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.status === "Completed" ? "bg-neutral-100 text-neutral-500" : "bg-emerald-100 text-emerald-800"}`}>{c.status || "Active"}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-mono">{formatRand(raised)} raised · matching fund donations</p>
                    {c.description && <p className="text-[11px] text-neutral-600 mt-2 line-clamp-2">{c.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === "payfast" && <AdminPayFast />}
    </div>
  );
};


// ==========================================
// NEW MODULE: COMMUNICATIONS HUB (Task 12)
// ==========================================
const AdminCommsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"messages" | "campaigns">("messages");
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">Church Communications</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Communications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">Message inbox, contact form submissions, SMS campaigns and church-wide outreach — all in one place.</p>
      </div>
      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "messages", label: "Message Inbox" }, { id: "campaigns", label: "Campaigns & SMS" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-sky-600 text-sky-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "messages" && <AdminInbox />}
      {activeTab === "campaigns" && <AdminComms />}
    </div>
  );
};

