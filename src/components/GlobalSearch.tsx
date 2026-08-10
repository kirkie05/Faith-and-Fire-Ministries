import React, { useState, useEffect, useRef } from "react";
import { Search, Users, Calendar, Video, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

interface GlobalSearchProps {
  onNavigate: (module: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { members, events, videos, ministries } = useChurch();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle Debouncing
  useEffect(() => {
    if (query.trim() === "") {
      setDebouncedQuery("");
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
      setIsOpen(true);
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search Logic
  const getResults = () => {
    if (!debouncedQuery) return [];
    
    const lowerQuery = debouncedQuery.toLowerCase();
    const results = [];

    // Members (max 5)
    const matchedMembers = (members || []).filter(
      m => (m?.firstName || "").toLowerCase().includes(lowerQuery) || 
           (m?.lastName || "").toLowerCase().includes(lowerQuery) || 
           (m?.email || "").toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
    
    if (matchedMembers.length > 0) {
      results.push({
        group: "Members",
        icon: Users,
        color: "text-blue-500",
        items: matchedMembers.map(m => ({
          id: m.id,
          title: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
          subtitle: m.email || "No email",
          module: "members"
        }))
      });
    }

    // Events (max 5)
    const matchedEvents = (events || []).filter(
      e => (e?.title || "").toLowerCase().includes(lowerQuery) || 
           (e?.category || "").toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    if (matchedEvents.length > 0) {
      results.push({
        group: "Events",
        icon: Calendar,
        color: "text-purple-500",
        items: matchedEvents.map(e => ({
          id: e.id,
          title: e.title || "Unnamed Event",
          subtitle: `${e.date || ""} | ${e.category || ""}`,
          module: "calendar"
        }))
      });
    }

    // Sermons (max 5)
    const matchedSermons = (videos || []).filter(
      v => (v?.title || "").toLowerCase().includes(lowerQuery) || 
           (v?.speaker || v?.preacher || "").toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    if (matchedSermons.length > 0) {
      results.push({
        group: "Sermons",
        icon: Video,
        color: "text-red-500",
        items: matchedSermons.map(v => ({
          id: v.id,
          title: v.title || "Unnamed Sermon",
          subtitle: `By ${v.speaker || v.preacher || "Unknown"}`,
          module: "media"
        }))
      });
    }

    // Ministries (max 5)
    const matchedMinistries = (ministries || []).filter(
      m => (m?.name || "").toLowerCase().includes(lowerQuery) || 
           (m?.category || "").toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    if (matchedMinistries.length > 0) {
      results.push({
        group: "Ministries",
        icon: GraduationCap,
        color: "text-emerald-500",
        items: matchedMinistries.map(m => ({
          id: m.id,
          title: m.name || "Unnamed Ministry",
          subtitle: m.category || "General",
          module: "nextsteps"
        }))
      });
    }

    return results;
  };

  const results = getResults();

  const handleSelect = (module: string) => {
    setIsOpen(false);
    setQuery("");
    onNavigate(module);
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
      <input 
        id="global-search-input"
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (debouncedQuery) setIsOpen(true);
        }}
        placeholder="Search members, events, sermons, or ministries..." 
        className="w-full"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
        ) : (
          <span className="text-[9px] font-bold text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded bg-white">⌘K</span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-100 max-h-[70vh] overflow-y-auto z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-500">
              No results found for "<span className="font-bold text-[#1e1548]">{debouncedQuery}</span>"
            </div>
          ) : (
            <div className="py-2">
              {results.map((group, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                    <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
                    {group.group}
                  </div>
                  <ul className="py-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button 
                          onClick={() => handleSelect(item.module)}
                          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-purple-50 transition-colors text-left group"
                        >
                          <div>
                            <span className="block text-sm font-bold text-[#0A192F] group-hover:text-purple-700 transition-colors">{item.title}</span>
                            <span className="block text-[11px] text-neutral-500">{item.subtitle}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
