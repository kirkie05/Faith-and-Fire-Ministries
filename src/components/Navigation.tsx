import React, { useState, useEffect } from "react";
import { useChurch } from "../context/ChurchContext";
import { AuthModal } from "./AuthModal";
import { Search, User, Menu, X, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin
}) => {
  const { churchInfo, currentUser } = useChurch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "ministries", label: "Ministries" },
    { id: "events", label: "Events" },
    { id: "sermons", label: "Sermons" },
    { id: "give", label: "Give" },
    { id: "contact", label: "Contact" }
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Main Header Three - Floens template exact structure */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "nav-scrolled"
            : "bg-transparent py-2"
        }`}
      >
        <div className="w-full px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-[90px]">
            {/* Logo */}
            <div
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleTabClick("home")}
            >
              <img
                src="/images/Logo.png"
                alt="Faith & Fire"
                className={`nav-logo h-10 transition-all duration-300 ${
                  isScrolled ? "brightness-0 invert" : "brightness-0 invert"
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const h1 = document.createElement("h1");
                    h1.className = `text-2xl font-bold tracking-tight ${isScrolled ? "text-[#0a192f]" : "text-white"}`;
                    h1.textContent = "FAITH & FIRE";
                    parent.appendChild(h1);
                  }
                }}
              />
            </div>

            {/* Right side - Nav + Actions */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-12">
              {/* Desktop Navigation */}
              <nav className="flex items-center gap-7 xl:gap-9">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`nav-link font-sans font-medium text-[15px] transition-colors group py-2 cursor-pointer ${
                      currentTab === item.id
                        ? "active text-[#38bdf8]"
                        : isScrolled
                        ? "text-white hover:text-[#38bdf8]"
                        : "text-white hover:text-[#38bdf8]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Search */}
              <button
                className={`transition-colors cursor-pointer ${
                  isScrolled
                    ? "text-white hover:text-[#38bdf8]"
                    : "text-white hover:text-[#38bdf8]"
                }`}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* User / Auth */}
              <button
                onClick={() => setAuthModalOpen(true)}
                className={`transition-colors cursor-pointer ${
                  isScrolled
                    ? "text-white hover:text-[#38bdf8]"
                    : "text-white hover:text-[#38bdf8]"
                }`}
              >
                {currentUser ? (
                  <div className="w-8 h-8 rounded-full bg-[#38bdf8] text-[#0a192f] flex items-center justify-center font-bold text-sm">
                    {(currentUser.displayName || currentUser.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                ) : (
                  <User className="w-[18px] h-[18px]" />
                )}
              </button>

              {/* CTA Button */}
              <button
                onClick={() => handleTabClick("plan-your-visit")}
                className="floens-btn cursor-pointer"
              >
                <span>Plan Your Visit</span>
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 6H13M13 6L8 1M13 6L8 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 cursor-pointer ${
                  isScrolled ? "text-[#0a192f]" : "text-white"
                }`}
              >
                {mobileMenuOpen ? (
                  <X className="w-7 h-7" />
                ) : (
                  <Menu className="w-7 h-7" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[45] bg-[#0a192f] pt-[100px] px-8 pb-8 overflow-y-auto"
          >
            <div className="flex flex-col">
              {navItems.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`text-left py-5 font-sans text-xl font-medium border-b border-white/10 transition-colors cursor-pointer ${
                    currentTab === item.id
                      ? "text-[#38bdf8]"
                      : "text-white hover:text-[#38bdf8]"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="mt-10">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleTabClick("plan-your-visit");
                  }}
                  className="floens-btn w-full justify-center cursor-pointer"
                >
                  <span>Plan Your Visit</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="mt-6 flex items-center justify-center gap-3 py-4 text-[#38bdf8] font-medium text-sm cursor-pointer"
              >
                <User className="w-5 h-5" /> Member Login
              </button>

              {/* Contact info */}
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <a href={`tel:${churchInfo.phone}`} className="flex items-center gap-3 text-white/70 text-sm">
                  <Phone className="w-4 h-4 text-[#38bdf8]" /> {churchInfo.phone}
                </a>
                <a href={`mailto:${churchInfo.email}`} className="flex items-center gap-3 text-white/70 text-sm">
                  <Mail className="w-4 h-4 text-[#38bdf8]" /> {churchInfo.email}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};
