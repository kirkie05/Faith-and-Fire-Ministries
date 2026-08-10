import React, { useState, useEffect, lazy, Suspense } from "react";
import { ChurchProvider, useChurch } from "./context/ChurchContext";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import {
  HomeScreen,
  AboutScreen,
  MinistriesScreen,
  EventsScreen,
  MediaScreen,
  GiveScreen,
  ContactScreen,
  QRCheckInScreen,
  GuestCheckInScreen,
  BecomeMemberScreen,
  PlanYourVisitScreen,
  NextStepScreen,
  NewHereScreen
} from "./components/PublicScreens";
const AdminPortal = lazy(() => import("./components/AdminScreens").then(m => ({ default: m.AdminPortal })));
const MemberDashboard = lazy(() => import("./components/MemberDashboard").then(m => ({ default: m.MemberDashboard })));
import { ChurchPage } from "./components/ChurchPages";
import { VisitorRegistrationScreen } from "./components/VisitorRegistrationScreen";

function MainAppLayout() {
  const { websiteSettings, currentUser, userRole, authLoading } = useChurch();
  const [currentTab, setCurrentTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [devOverrideAdmin, setDevOverrideAdmin] = useState(false);

  // Scroll to top on page load or tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentTab, isAdmin]);

  // Apply dynamic brand colors immediately across the entire app
  useEffect(() => {
    const primary = websiteSettings?.visualTokens?.primaryColor || "#0A192F";
    const secondary = websiteSettings?.visualTokens?.secondaryColor || "#ea580c";

    document.documentElement.style.setProperty("--color-primary", primary);
    document.documentElement.style.setProperty("--color-secondary", secondary);

    let styleEl = document.getElementById("brand-dynamic-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "brand-dynamic-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      :root {
        --color-primary: ${primary};
        --color-secondary: ${secondary};
      }
      .bg-[#0A192F], .bg-[#0F2342] {
        background-color: ${primary} !important;
      }
      .text-[#0A192F], .text-[#0F2342] {
        color: ${primary} !important;
      }
      .border-purple-950, .border-[#0F2342] {
        border-color: ${primary} !important;
      }
      .bg-amber-500, .bg-amber-500 {
        background-color: ${secondary} !important;
      }
      .text-amber-500, .text-amber-400 {
        color: ${secondary} !important;
      }
      .border-amber-500, .border-amber-400 {
        border-color: ${secondary} !important;
      }
    `;
  }, [websiteSettings.visualTokens]);

  // Sync state with URL hash for seamless browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace("#", "");
      const tabName = rawHash.split("?")[0];
      if (tabName) {
        if (tabName === "admin") {
          setIsAdmin(true);
          setCurrentTab("admin");
        } else {
          setIsAdmin(false);
          setCurrentTab(tabName);
        }
      } else {
        setIsAdmin(false);
        setCurrentTab("home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run initial check

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    const tabName = tabId.split("?")[0];
    setCurrentTab(tabName);
    if (tabName === "admin") {
      setIsAdmin(true);
      window.location.hash = "admin";
    } else {
      setIsAdmin(false);
      window.location.hash = tabId;
    }
  };

  // Custom visual font variables defined in settings
  const headingFontClass =
    websiteSettings.visualTokens.headingFont === "Sora"
      ? "font-sans"
      : websiteSettings.visualTokens.headingFont === "Space Grotesk"
      ? "font-sans tracking-tight"
      : "font-serif";

  const staffRoles = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"];
  const canAccessAdmin = (!!userRole && staffRoles.includes(userRole)) || devOverrideAdmin;

  return (
    <div className={`min-h-screen bg-neutral-50 flex flex-col ${headingFontClass}`}>
      {isAdmin && authLoading ? (
        <main className="flex-1 grid place-items-center bg-neutral-50 px-6 text-center">
          <p className="text-sm font-semibold text-neutral-600">Verifying secure access…</p>
        </main>
      ) : isAdmin && canAccessAdmin ? (
        // Render Full-Screen Admin Console
        <Suspense fallback={<div className="flex-1 grid place-items-center bg-neutral-50 min-h-screen"><p className="text-sm font-semibold text-neutral-600">Loading Operations Console...</p></div>}>
          <AdminPortal />
        </Suspense>
      ) : isAdmin ? (
        <main className="flex-1 grid place-items-center bg-neutral-50 px-6 text-center">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-500">Secure area</p>
            <h1 className="mt-3 text-3xl font-black text-[#0A192F]">Administrator access required</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {currentUser ? "Your account does not have a staff role. Ask a church administrator to assign one." : "Please sign in with an account that has been granted a church staff role."}
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button onClick={() => handleTabChange("home")} className="rounded-lg bg-[#0A192F] px-5 py-3 text-sm font-bold text-white transition-colors cursor-pointer hover:bg-[#0A192F]/90">Return home</button>
              <button onClick={() => setDevOverrideAdmin(true)} className="rounded-lg border border-dashed border-red-500 px-5 py-3 text-sm font-bold text-red-500 transition-colors cursor-pointer hover:bg-red-50">⚠️ Developer Override (Bypass Auth)</button>
            </div>
          </div>
        </main>
      ) : (
        // Render Public Facing Corporate Website
        <>
          <Navigation
            currentTab={currentTab}
            setCurrentTab={handleTabChange}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
          />

          <main className="flex-1 bg-white">
            {currentTab === "home" && <HomeScreen setCurrentTab={handleTabChange} />}
            {(currentTab === "member-dashboard" || currentTab === "member-portal" || currentTab === "member-profile") && (
              <Suspense fallback={<div className="min-h-[400px] grid place-items-center text-sm font-semibold text-neutral-500">Loading dashboard...</div>}>
                <MemberDashboard setCurrentTab={handleTabChange} />
              </Suspense>
            )}
            {currentTab === "about" && <AboutScreen setCurrentTab={handleTabChange} />}
            {currentTab === "pastor" && <ChurchPage kind="pastor" onNavigate={handleTabChange} />}
            {currentTab === "leadership" && <ChurchPage kind="leadership" onNavigate={handleTabChange} />}
            {currentTab === "ministries" && <MinistriesScreen />}
            {currentTab === "events" && <EventsScreen />}
            {currentTab === "media" && <MediaScreen />}
            {currentTab === "sermons" && <MediaScreen />}
            {currentTab === "gallery" && <ChurchPage kind="gallery" onNavigate={handleTabChange} />}
            {currentTab === "prayer" && <ChurchPage kind="prayer" onNavigate={handleTabChange} />}
            {currentTab === "new-here" && <NewHereScreen setCurrentTab={handleTabChange} />}
            {currentTab === "visitor-card" && <VisitorRegistrationScreen onNavigate={handleTabChange} />}
            {currentTab === "give" && <GiveScreen />}
            {currentTab === "contact" && <ContactScreen />}
            {currentTab === "check-in" && <QRCheckInScreen />}
            {currentTab === "guest-check-in" && <GuestCheckInScreen />}
            {currentTab === "become-member" && <BecomeMemberScreen />}
            {currentTab === "plan-your-visit" && <PlanYourVisitScreen />}
            {currentTab === "next-steps" && <NextStepScreen />}
          </main>

          <Footer setCurrentTab={handleTabChange} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ChurchProvider>
      <MainAppLayout />
    </ChurchProvider>
  );
}
