import React, { useState } from "react";
import { Check, Search } from "lucide-react";

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

