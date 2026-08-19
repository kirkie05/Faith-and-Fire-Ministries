import React, { useState } from "react";
import { Image } from "lucide-react";
import { FileUploadInput } from "./FileUploadInput";
import { useChurch } from "../context/ChurchContext";

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

