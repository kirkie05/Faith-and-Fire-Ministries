import React, { useRef, useState } from "react";
import { Check, Target } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

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

