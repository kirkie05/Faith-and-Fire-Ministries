import React from "react";
import { CheckCircle, Shield } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

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

