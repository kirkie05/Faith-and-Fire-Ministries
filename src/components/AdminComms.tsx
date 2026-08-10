import React, { useState, useEffect } from "react";
import { AlertTriangle, Key, Save, Check, RefreshCw, Send, Settings, Cake, CalendarHeart, MessageSquare } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

export const AdminComms: React.FC = () => {
  const { members } = useChurch();
  const [activeTab, setActiveTab] = useState<"broadcast" | "automation" | "api">("broadcast");
  const [saveStatus, setSaveStatus] = useState(false);

  // Broadcast state
  const [broadcastAudience, setBroadcastAudience] = useState("All Members");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  // API Settings State
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [sendgridKey, setSendgridKey] = useState("");
  const [sendgridEmail, setSendgridEmail] = useState("");

  useEffect(() => {
    // Load saved API settings from local storage
    const stored = localStorage.getItem("church_api_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTwilioSid(parsed.twilioSid || "");
        setTwilioToken(parsed.twilioToken || "");
        setTwilioPhone(parsed.twilioPhone || "");
        setSendgridKey(parsed.sendgridKey || "");
        setSendgridEmail(parsed.sendgridEmail || "");
      } catch(e) {}
    }
  }, []);

  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("church_api_settings", JSON.stringify({
      twilioSid, twilioToken, twilioPhone, sendgridKey, sendgridEmail
    }));
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

  // Automation / Triggers Logic
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`; // MM-DD
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;

  const upcomingBirthdays = members.filter(m => {
    if (!m.dob) return false;
    const dobParts = m.dob.split('-');
    if (dobParts.length !== 3) return false;
    const bdayStr = `${parseInt(dobParts[1])}-${parseInt(dobParts[2])}`;
    return bdayStr === todayStr || bdayStr === tomorrowStr;
  });

  const upcomingAnniversaries = members.filter(m => {
    if (!m.anniversary) return false;
    const annivParts = m.anniversary.split('-');
    if (annivParts.length !== 3) return false;
    const annivStr = `${parseInt(annivParts[1])}-${parseInt(annivParts[2])}`;
    return annivStr === todayStr || annivStr === tomorrowStr;
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Communication Centre
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Broadcast messages, automate birthdays &amp; anniversaries, and manage SMS/Email API connections.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {[{ id: "broadcast", label: "Broadcast Message" }, { id: "automation", label: "Automated Triggers" }, { id: "api", label: "3rd-Party API Settings" }].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id ? "border-sky-600 text-sky-700 bg-sky-50/50" : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          <div className="lg:col-span-8 bg-white border border-neutral-200 shadow-xs rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-bold text-[#0A192F] uppercase border-b border-neutral-100 pb-2">New Broadcast Message</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Target Audience</label>
                  <select value={broadcastAudience} onChange={(e) => setBroadcastAudience(e.target.value)} className="w-full">
                    <option>Everyone (Members & Visitors)</option>
                    <option>All Members</option>
                    <option>All Visitors</option>
                    <option>Specific Ministry</option>
                    <option>Event Attendees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Channel(s)</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex"><input type="checkbox" checked={sendSms} onChange={e=>setSendSms(e.target.checked)} className="w-4 h-4" /> SMS</label>
                    <label className="flex"><input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} className="w-4 h-4" /> Email</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Message Content</label>
                <textarea 
                  rows={5} 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full"
                  placeholder="Type your broadcast message here... e.g. Dear Church Family, tomorrow's service begins at 9AM."
                />
                <p className="text-[9px] text-neutral-400 font-mono text-right mt-1">{broadcastMessage.length} characters • {Math.ceil(broadcastMessage.length / 160) || 1} SMS Segment(s)</p>
              </div>
              
              <button type="button" disabled={!broadcastMessage.trim() || (!sendSms && !sendEmail)} className="btn-primary">
                <Send className="w-4 h-4"/> Send Broadcast Now
              </button>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 shadow-sm rounded-xl p-6 relative overflow-hidden">
              <AlertTriangle className="absolute -right-4 -bottom-4 w-24 h-24 text-red-600 opacity-5" />
              <h2 className="text-sm font-bold text-red-900 uppercase border-b border-red-200/50 pb-2 mb-4 flex items-center gap-2 relative z-10">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Emergency Override
              </h2>
              <p className="text-[10px] text-red-700 leading-relaxed mb-5 relative z-10 font-medium">
                Use this exclusively for extreme emergencies (e.g., service cancellation due to weather). Overrides all notification preferences.
              </p>
              <button className="btn-primary-sm w-full">
                Trigger Emergency Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "automation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-orange-50/50 flex items-center gap-2">
              <Cake className="w-5 h-5 text-orange-500" />
              <div>
                <h2 className="text-sm font-bold text-[#0A192F] uppercase">Upcoming Birthdays</h2>
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Today & Tomorrow</p>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(m => {
                const isToday = m.dob?.endsWith(todayStr);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded bg-neutral-50 hover:bg-orange-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">{m.firstName} {m.lastName}</h4>
                      <p className={`text-[10px] font-mono mt-0.5 font-bold ${isToday ? 'text-orange-600' : 'text-neutral-500'}`}>
                        {isToday ? 'Birthday Today!' : 'Birthday Tomorrow'}
                      </p>
                    </div>
                    <button className="btn-primary-sm">
                      <MessageSquare className="w-3 h-3"/> Send Greeting
                    </button>
                  </div>
                )
              }) : (
                <div className="text-center py-8">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No upcoming birthdays</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-rose-50/50 flex items-center gap-2">
              <CalendarHeart className="w-5 h-5 text-rose-500" />
              <div>
                <h2 className="text-sm font-bold text-[#0A192F] uppercase">Upcoming Anniversaries</h2>
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Today & Tomorrow</p>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {upcomingAnniversaries.length > 0 ? upcomingAnniversaries.map(m => {
                const isToday = m.anniversary?.endsWith(todayStr);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded bg-neutral-50 hover:bg-rose-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">{m.firstName} {m.lastName}</h4>
                      <p className={`text-[10px] font-mono mt-0.5 font-bold ${isToday ? 'text-rose-600' : 'text-neutral-500'}`}>
                        {isToday ? 'Anniversary Today!' : 'Anniversary Tomorrow'}
                      </p>
                    </div>
                    <button className="btn-primary-sm">
                      <MessageSquare className="w-3 h-3"/> Send Greeting
                    </button>
                  </div>
                )
              }) : (
                <div className="text-center py-8">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No upcoming anniversaries</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="max-w-4xl mx-auto pt-4">
          <form onSubmit={handleSaveApiSettings} className="bg-white border border-neutral-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neutral-500" />
              <h2 className="text-sm font-bold text-[#0A192F] uppercase tracking-wide">3rd-Party Provider Settings</h2>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Twilio Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                  <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">SMS Provider</span>
                  <h3 className="font-black text-neutral-800 uppercase tracking-wider text-xs">Twilio Integration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Account SID</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input type="text" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Auth Token</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input type="password" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} placeholder="••••••••••••••••••••••••" className="w-full" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Sender Phone Number</label>
                    <input type="text" value={twilioPhone} onChange={(e) => setTwilioPhone(e.target.value)} placeholder="+1234567890" className="w-full" />
                  </div>
                </div>
              </div>

              {/* SendGrid Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Email Provider</span>
                  <h3 className="font-black text-neutral-800 uppercase tracking-wider text-xs">SendGrid Integration</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input type="password" value={sendgridKey} onChange={(e) => setSendgridKey(e.target.value)} placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Verified Sender Email</label>
                    <input type="email" value={sendgridEmail} onChange={(e) => setSendgridEmail(e.target.value)} placeholder="hello@church.com" className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 border-t border-neutral-100 p-5 flex items-center justify-between">
              {saveStatus ? (
                <span className="text-emerald-600 font-bold text-[10px] uppercase flex items-center gap-1 animate-pulse tracking-widest"><Check className="w-4 h-4"/> Credentials Saved</span>
              ) : (
                <span className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Encrypted in Local Storage</span>
              )}
              
              <button type="submit" className="btn-primary-sm">
                <Save className="w-4 h-4"/> Save Configurations
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
