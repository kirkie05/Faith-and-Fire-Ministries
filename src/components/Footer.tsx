import React from "react";
import { useChurch } from "../context/ChurchContext";
import { MapPin, Phone, Mail, Facebook, Youtube, Instagram, Linkedin, Heart, ChevronRight } from "lucide-react";
import { StaggeredList, StaggeredItem } from "./Animations";

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const { churchInfo } = useChurch();

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#0A192F] text-white border-t-4 border-sky-400">
      {/* Upper Footer Segment */}
      <StaggeredList className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Col 1: About the ministry */}
        <StaggeredItem className="space-y-6">
          <div className="flex items-center gap-2">
            {(churchInfo.footerLogoImage || (churchInfo.logoType === "image" && churchInfo.logoImage)) ? (
              <img
                src="/images/Logo.png"
                alt={churchInfo.name}
                className="h-12 max-w-[200px] object-contain"
              />
            ) : (
              <div>
                <span className="block font-heading font-bold text-3xl text-white tracking-tight uppercase leading-none">
                  FAITH & FIRE
                </span>
                <span className="block text-[10px] tracking-widest text-sky-400 uppercase font-sans font-bold leading-tight">
                  MINISTRIES
                </span>
              </div>
            )}
          </div>
          <p className="text-white/70 text-[15px] leading-relaxed font-sans">
            We are a vibrant, Spirit-filled congregation located in Rosettenville, JHB South. 
            Dedicated to preaching holiness, righteousness, and the unadulterated Word of God.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href={churchInfo.socials.facebook}
              target="_blank"
              referrerPolicy="no-referrer"
              className="icon-hover w-10 h-10 rounded-full bg-[#0F2342] border border-[#17325B] flex items-center justify-center shadow-sm text-white"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={churchInfo.socials.youtube}
              target="_blank"
              referrerPolicy="no-referrer"
              className="icon-hover w-10 h-10 rounded-full bg-[#0F2342] border border-[#17325B] flex items-center justify-center shadow-sm text-white"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href={churchInfo.socials.instagram}
              target="_blank"
              referrerPolicy="no-referrer"
              className="icon-hover w-10 h-10 rounded-full bg-[#0F2342] border border-[#17325B] flex items-center justify-center shadow-sm text-white"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            {churchInfo.socials.linkedin && (
              <a
                href={churchInfo.socials.linkedin}
                target="_blank"
                referrerPolicy="no-referrer"
                className="icon-hover w-10 h-10 rounded-full bg-[#0F2342] border border-[#17325B] flex items-center justify-center shadow-sm text-white"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        </StaggeredItem>

        {/* Col 2: Service Times */}
        <StaggeredItem className="space-y-6">
          <h3 className="text-xl font-heading font-bold text-white uppercase relative pb-3 inline-block">
            Service Times
            <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-sky-400"></span>
          </h3>
          <ul className="space-y-4 text-[15px]">
            <li className="flex flex-col border-b border-[#17325B] pb-3">
              <strong className="text-white font-bold">Sunday Morning Service</strong>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white/60 text-sm">Main Sanctuary</span>
                <span className="text-sky-400 font-bold">09:00 AM</span>
              </div>
            </li>
            <li className="flex flex-col border-b border-[#17325B] pb-3">
              <strong className="text-white font-bold">Midweek Bible Study</strong>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white/60 text-sm">Youth Arena / Zoom</span>
                <span className="text-sky-400 font-bold">Wed 06:00 PM</span>
              </div>
            </li>
            <li className="flex flex-col">
              <strong className="text-white font-bold">Night of Fire Encounter</strong>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white/60 text-sm">Monthly Friday</span>
                <span className="text-sky-400 font-bold">07:00 PM</span>
              </div>
            </li>
          </ul>
        </StaggeredItem>

        {/* Col 3: Quick Navigation */}
        <StaggeredItem className="space-y-6">
          <h3 className="text-xl font-heading font-bold text-white uppercase relative pb-3 inline-block">
            Support
            <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-sky-400"></span>
          </h3>
          <ul className="space-y-3">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About Us" },
              { id: "ministries", label: "Ministries" },
              { id: "events", label: "Events" },
              { id: "sermons", label: "Sermons" },
              { id: "contact", label: "Contact Us" }
            ].map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => handleTabClick(link.id)}
                  className="group flex items-center text-white/80 hover:text-sky-400 transition-colors font-medium text-[15px]"
                >
                  <ChevronRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300 mr-2" />
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </StaggeredItem>

        {/* Col 4: Contact details */}
        <StaggeredItem className="space-y-6">
          <h3 className="text-xl font-heading font-bold text-white uppercase relative pb-3 inline-block">
            Contact Info
            <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-sky-400"></span>
          </h3>
          <ul className="space-y-4 text-[15px] text-white/80">
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-400/10 flex items-center justify-center shrink-0 border border-sky-400/20">
                <MapPin className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="block text-white font-bold mb-1">Location</span>
                <span className="block">{churchInfo.address}</span>
                <span className="block">{churchInfo.city}</span>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-400/10 flex items-center justify-center shrink-0 border border-sky-400/20">
                <Phone className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="block text-white font-bold mb-1">Phone Number</span>
                <span>{churchInfo.phone}</span>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-400/10 flex items-center justify-center shrink-0 border border-sky-400/20">
                <Mail className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="block text-white font-bold mb-1">Email Address</span>
                <span className="break-all">{churchInfo.email}</span>
              </div>
            </li>
          </ul>
        </StaggeredItem>
      </StaggeredList>

      {/* Lower Footer Segment */}
      <div className="bg-[#071325] py-6 px-4 border-t border-[#17325B] text-white/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Faith & Fire Ministries Johannesburg South. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 justify-center">
            Ministering the Word so the world may be pleasing to God
            <Heart className="w-4 h-4 text-sky-400 fill-sky-400" />
          </p>
        </div>
      </div>
    </footer>
  );
};
