import React, { useState } from "react";
import { Member, AttendanceRecord, Ministry } from "../types";
import { MemberAttendanceHeatmap } from "./MemberAttendanceHeatmap";
import { Users, GraduationCap, X, Mail, Phone, MapPin, Calendar, HeartPulse, Send } from "lucide-react";

interface AdminMemberProfileProps {
  member: Member;
  attendance: AttendanceRecord[];
  ministries: Ministry[];
  onClose: () => void;
  onUpdateMember: (member: Member) => void;
}

export const AdminMemberProfile: React.FC<AdminMemberProfileProps> = ({ 
  member, 
  attendance, 
  ministries, 
  onClose, 
  onUpdateMember 
}) => {
  const [whatsappCareText, setWhatsappCareText] = useState("");

  const handleWhatsAppSend = () => {
    const digits = member.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(whatsappCareText);
    window.open(`https://wa.me/${digits}?text=${encoded}`, '_blank');
  };

  const toggleMinistry = (ministryName: string) => {
    const currentMins = member.ministries || [];
    const updatedMins = currentMins.includes(ministryName)
      ? currentMins.filter(name => name !== ministryName)
      : [...currentMins, ministryName];
    onUpdateMember({ ...member, ministries: updatedMins });
  };

  return (
    <div className="fixed inset-0 bg-[#0A192F]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header - Premium Dark gradient */}
        <div className="bg-gradient-to-r from-[#0A192F] to-[#1e1548] p-6 text-white relative shrink-0">
          <button onClick={onClose} className="btn-primary absolute"><X className="w-5 h-5"/></button>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-3xl shadow-xl overflow-hidden border-2 border-white/20">
              {member.photo ? (
                <img src={member.photo} alt={member.firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{member.firstName[0]}{member.lastName[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black">{member.firstName} {member.lastName}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${member.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'}`}>
                  {member.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sky-200/70 text-xs font-mono">
                <span>ID: {member.id}</span>
                <span>•</span>
                <span>Joined: {member.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 flex-1">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3 h-3"/> Contact Details</h4>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Phone className="w-4 h-4"/></div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold leading-tight">Phone Number</p>
                  <p className="font-bold text-[#0A192F] font-mono">{member.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Mail className="w-4 h-4"/></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-neutral-400 uppercase font-bold leading-tight">Email Address</p>
                  <p className="font-bold text-[#0A192F] truncate">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4"/></div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold leading-tight">Residential Area</p>
                  <p className="font-bold text-[#0A192F]">{member.suburb}</p>
                </div>
              </div>
            </div>

            {/* Ministry Memberships */}
            <div className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><HeartPulse className="w-3 h-3"/> Ministry Involvement</h4>
              <div className="flex flex-wrap gap-1.5">
                {ministries.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMinistry(m.name)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border flex items-center gap-1.5 ${
                      member.ministries?.includes(m.name)
                        ? "bg-[#0A192F] text-white border-[#0A192F] shadow-sm"
                        : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:border-purple-300"
                    }`}
                  >
                    {member.ministries?.includes(m.name) ? `✓ ${m.name}` : `＋ Add ${m.name}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Spiritual Pathway */}
            <div className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><GraduationCap className="w-3 h-3"/> Spiritual Pathway</h4>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent hidden"></div>
              
              <div className="flex gap-2 text-center text-[9px] uppercase font-bold">
                <div className="flex-1 bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">✓</div>
                  Salvation
                </div>
                <div className="flex-1 bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">✓</div>
                  Believer
                </div>
                <div className="flex-1 bg-orange-50 text-orange-700 p-2 rounded-lg border border-orange-200 shadow-xs ring-1 ring-orange-100 flex flex-col items-center justify-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-orange-400 text-white flex items-center justify-center text-xs">⋯</div>
                  Member
                </div>
                <div className="flex-1 bg-neutral-100 text-neutral-400 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                  <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"></div>
                  Disciple
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Attendance Heatmap */}
            <div className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Attendance Heatmap</h4>
              <MemberAttendanceHeatmap
                memberId={member.id}
                attendance={attendance}
                memberName={`${member.firstName} ${member.lastName}`}
              />
            </div>

            {/* WhatsApp Automation */}
            <div className="bg-white rounded-xl border border-[#25D366]/30 overflow-hidden shadow-sm flex flex-col h-full">
              <div className="bg-[#25D366]/10 p-4 border-b border-[#25D366]/20 flex justify-between items-center">
                <h4 className="text-[#075E54] font-bold text-[11px] uppercase tracking-widest flex items-center gap-2">
                  WhatsApp Pastoral Engine
                </h4>
                <span className="text-[9px] bg-white text-[#075E54] px-2 py-0.5 rounded font-mono font-bold shadow-xs border border-[#25D366]/30">Target: {member.phone}</span>
              </div>
              <div className="p-4 space-y-3 bg-neutral-50 flex-1 flex flex-col">
                <textarea
                  rows={4}
                  value={whatsappCareText}
                  onChange={(e) => setWhatsappCareText(e.target.value)}
                  placeholder="Type a custom message or select a template below..."
                  className="w-full flex-1"
                />
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => setWhatsappCareText(`Shalom ${member.firstName}, peace be unto you! Just following up from Faith & Fire Ministries. How can we pray for you today?`)} className="text-[9px] font-bold bg-white text-[#0A192F] border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors shadow-xs">
                    📌 Pastoral Check-in
                  </button>
                  <button onClick={() => setWhatsappCareText(`Dear ${member.firstName}, we warmly invite you to join us this Sunday at 09:00 AM for our Apostolic Fire & Revival service!`)} className="text-[9px] font-bold bg-white text-[#0A192F] border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors shadow-xs">
                    📌 Service Invite
                  </button>
                  <button onClick={() => setWhatsappCareText(`Greetings ${member.firstName}, thank you for serving with us! Let us know if you need any leadership resources or prayer support.`)} className="text-[9px] font-bold bg-white text-[#0A192F] border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors shadow-xs">
                    📌 Team Encouragement
                  </button>
                </div>

                <button onClick={handleWhatsAppSend} disabled={!whatsappCareText} className="btn-primary-sm mt-2 w-full">
                  <Send className="w-3.5 h-3.5"/> Dispatch WhatsApp Payload
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
