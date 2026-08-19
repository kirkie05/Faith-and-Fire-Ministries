import React, { useState } from "react";
import { AlertTriangle, Check, Image, Settings, Trash2 } from "lucide-react";
import { FileUploadInput } from "./FileUploadInput";
import { useChurch } from "../context/ChurchContext";


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

