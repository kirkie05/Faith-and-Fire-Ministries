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
import { AdminCellGroups } from "./AdminCellGroups";
import { AdminFormsModule } from "./AdminFormsModule";
import { AdminComms } from "./AdminComms";
import { AdminFollowUpModule } from "./AdminFollowUps";
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
import { httpsCallable } from "firebase/functions";
import { db, auth, functions } from "../lib/firebase";
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
      <aside className="w-full lg:w-64 bg-white text-neutral-800 flex flex-col justify-between shrink-0 border-r border-neutral-100 h-screen sticky top-0 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
          {/* Brand header from image */}
          <div className="flex items-center gap-3 px-2">
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
                  onClick={() => { window.location.href = "/"; }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all text-neutral-500 hover:text-[#1e1548] hover:bg-neutral-50`}
                >
                  <span className="flex items-center gap-3">
                    <Globe className="w-5 h-5 shrink-0 text-neutral-400" />
                    Return to Website
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

        {/* Sidebar footer info */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-[#1e1548] to-[#0A192F] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-[#38BDF8]/20">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-extrabold mb-1">Admin Portal</h3>
              <p className="text-[10px] text-white/60">Secure church administration suite.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* Top Bar: Search & Profile */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-transparent py-2">
            {/* Search Input */}
            <div className="relative w-full md:w-96 flex-1 md:flex-none">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                ref={searchInputRef}
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
            <div className="flex items-center gap-5 w-full md:w-auto justify-end">
              <button 
                onClick={() => setActiveSubMenu("comms")}
                className="text-neutral-400 hover:text-[#1e1548] transition-colors cursor-pointer relative"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-neutral-400 hover:text-[#1e1548] transition-colors relative cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {connectSubmissions.filter(s => s.status === "Pending").length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#fb923c] rounded-full border-2 border-[#F4F7FE]"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-neutral-50 flex justify-between items-center bg-white">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Notifications</span>
                      <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-bold">
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
                            className="p-4 border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors cursor-pointer" 
                            onClick={() => { 
                              setShowNotifications(false); 
                              setActiveSubMenu("comms"); 
                            }}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-xs font-bold text-[#1e1548] truncate pr-2">{sub.name}</span>
                              <span className="text-[9px] font-medium text-neutral-400 shrink-0">{new Date(sub.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{sub.type}</span>
                              <span className="text-[10px] text-neutral-500 line-clamp-1">New submission received</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {connectSubmissions.filter(s => s.status === "Pending").length > 0 && (
                      <div 
                        className="p-3 bg-white text-center border-t border-neutral-50 text-[11px] font-bold text-[#1e1548] hover:text-[#38bdf8] cursor-pointer transition-colors"
                        onClick={() => { setShowNotifications(false); setActiveSubMenu("comms"); }}
                      >
                        View All
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
                <div className="w-9 h-9 rounded-full bg-neutral-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden md:block cursor-pointer flex items-center gap-1 group">
                  <span className="block text-sm font-bold text-neutral-700 group-hover:text-[#1e1548] transition-colors">Emma Kwan <ChevronDown className="w-3 h-3 inline-block ml-1 text-neutral-400" /></span>
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
    // Only usher/admin-verified check-ins count; member self check-ins sit in
    // a Pending state until an usher verifies them from the members module.
    const verifiedAttendance = attendance.filter((a) => a.status !== "Pending" && a.status !== "Rejected");
    const presentEmails = new Set(verifiedAttendance.map((a) => a.memberEmail.toLowerCase()));
    const neverCheckedIn = members.filter((m) => !presentEmails.has(m.email.toLowerCase()));
    if (neverCheckedIn.length > 0) {
      alerts.push({
        id: "alert-never",
        type: "red",
        title: "New Members Awaiting Check-in",
        desc: `${neverCheckedIn.length} member${neverCheckedIn.length === 1 ? "" : "s"} have no verified attendance record yet. A first check-in helps them stay connected.`,
        action: "View Members",
        targetMenu: "members"
      });
    }
    const pendingCheckIns = attendance.filter((a) => a.status === "Pending");
    if (pendingCheckIns.length > 0) {
      alerts.push({
        id: "alert-pending",
        type: "amber",
        title: "Check-ins Awaiting Verification",
        desc: `${pendingCheckIns.length} member check-in${pendingCheckIns.length === 1 ? "" : "s"} submitted via the member portal need usher or administrator verification.`,
        action: "Verify Check-ins",
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

  // Determine present vs missing members from real VERIFIED attendance
  // records (pending member self check-ins never inflate the tally).
  const presentEmails = new Set(
    attendance
      .filter((a) => a.status !== "Pending" && a.status !== "Rejected")
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
      }).filter((a) => a.status !== "Pending" && a.status !== "Rejected");
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
    attendance
      .filter((a) => a.status !== "Pending" && a.status !== "Rejected")
      .forEach((a) => {
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
      {/* Header section - Hidden in clean design, we use top bar */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
          <div className="absolute top-4 right-4">
            <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#1e1548]/5 text-[#1e1548] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{members.length}</h2>
              <span className="text-[13px] font-medium text-neutral-400">Total Members</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
          <div className="absolute top-4 right-4">
            <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{missingMembers.length}</h2>
              <span className="text-[13px] font-medium text-neutral-400">Absent Members</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
          <div className="absolute top-4 right-4">
            <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#fb923c]/10 text-[#fb923c] flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{visitors.length}</h2>
              <span className="text-[13px] font-medium text-neutral-400">New Visitors</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-neutral-50/50 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
          <div className="absolute top-4 right-4">
            <MoreVertical className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-neutral-500" />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[26px] font-extrabold text-neutral-800 leading-tight">{ministries.filter((m) => m.active !== false && !m.archived).length}</h2>
              <span className="text-[13px] font-medium text-neutral-400">Active Ministries</span>
            </div>
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
// ==========================================
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
  const { members, attendance, addMember, ministries, reviewAttendance, milestoneRequests, reviewMilestoneRequest } = useChurch();
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

      {/* Pending Verifications: member self check-ins + milestone confirmations */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1548] tracking-tight">Pending Verifications</h2>
          <p className="text-xs text-neutral-500">
            Member self check-ins and discipleship milestone requests need usher or administrator confirmation before they count.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending check-ins */}
          <div className="border border-amber-100 rounded-2xl bg-amber-50/50 overflow-hidden">
            <div className="px-4 py-3 bg-amber-100/70 border-b border-amber-200 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest">Member Check-ins (Pending)</span>
              <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full">
                {attendance.filter((a) => a.status === "Pending").length}
              </span>
            </div>
            <div className="divide-y divide-amber-100 max-h-64 overflow-y-auto">
              {attendance.filter((a) => a.status === "Pending").length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-neutral-400">
                  No pending check-ins — all verified.
                </div>
              ) : (
                attendance.filter((a) => a.status === "Pending").map((att) => (
                  <div key={att.id} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <strong className="block text-xs text-amber-900 truncate">{att.memberName}</strong>
                      <span className="block text-[10px] text-amber-700 font-mono truncate">
                        {att.serviceName} • {att.date} {att.timestamp}
                      </span>
                    </div>
                    <button
                      onClick={async () => { await reviewAttendance(att.id, true); }}
                      className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded cursor-pointer shrink-0"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => { await reviewAttendance(att.id, false); }}
                      className="text-[9px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded cursor-pointer shrink-0"
                    >
                      Reject
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending milestone requests */}
          <div className="border border-purple-100 rounded-2xl bg-purple-50/50 overflow-hidden">
            <div className="px-4 py-3 bg-purple-100/70 border-b border-purple-200 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-800 uppercase tracking-widest">Milestone Confirmations (Pending)</span>
              <span className="text-[10px] bg-purple-600 text-white font-black px-2 py-0.5 rounded-full">
                {(milestoneRequests || []).filter((r) => r.status === "Pending").length}
              </span>
            </div>
            <div className="divide-y divide-purple-100 max-h-64 overflow-y-auto">
              {(milestoneRequests || []).filter((r) => r.status === "Pending").length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-neutral-400">
                  No pending milestone confirmations.
                </div>
              ) : (
                (milestoneRequests || []).filter((r) => r.status === "Pending").map((req) => (
                  <div key={req.id} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <strong className="block text-xs text-purple-900 truncate">{req.milestoneLabel}</strong>
                      <span className="block text-[10px] text-purple-700 font-mono truncate">
                        {req.memberName} • {req.memberEmail}
                      </span>
                    </div>
                    <button
                      onClick={async () => { await reviewMilestoneRequest(req.id, true); }}
                      className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded cursor-pointer shrink-0"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={async () => { await reviewMilestoneRequest(req.id, false); }}
                      className="text-[9px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded cursor-pointer shrink-0"
                    >
                      Reject
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400 font-sans">
                    No active members logged yet. Try checking in a member at the top "QR Check-in" menu!
                  </td>
                </tr>
              ) : (
                attendance.map((att) => {
                  const status = att.status || "present";
                  const isVerified = status === "Verified" || status === "present";
                  const isPending = status === "Pending";
                  return (
                    <tr key={att.id} className="hover:bg-neutral-50/30 transition-colors">
                      <td className="p-3 font-sans font-bold text-neutral-800">{att.memberName}</td>
                      <td className="p-3 text-neutral-500">{att.memberEmail}</td>
                      <td className="p-3 text-[#0F2342] font-semibold">{att.serviceName}</td>
                      <td className="p-3 text-neutral-400">{att.date}</td>
                      <td className="p-3 text-amber-500 font-semibold">{att.timestamp}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isVerified ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"
                        }`}>
                          {isVerified ? "✓ Verified" : isPending ? "⏳ Pending" : "✗ Rejected"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                await reviewAttendance(att.id, true);
                              }}
                              className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await reviewAttendance(att.id, false);
                              }}
                              className="text-[9px] font-bold bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
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

// ==========================================
// NEW MODULE: NEXT STEPS (Task 10)
// ==========================================
const AdminNextSteps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ministries" | "classes" | "cellgroups">("ministries");
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1e1548] to-[#0A192F] p-8 text-white shadow-sm border border-neutral-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Discipleship Journey</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Next Steps</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100">Manage ministries, discipleship classes and location-based cell groups — helping members take their next step in faith.</p>
      </div>
      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "ministries", label: "Ministries" }, { id: "classes", label: "Membership Classes" }, { id: "cellgroups", label: "Cell Groups" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-amber-600 text-amber-700" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "ministries" && <AdminMinistries />}
      {activeTab === "classes" && <AdminClasses />}
      {activeTab === "cellgroups" && <AdminCellGroups />}
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

