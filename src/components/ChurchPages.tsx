import React, { FormEvent, useState } from "react";
import { ArrowRight, Heart, Image as ImageIcon, Play, Send, Users } from "lucide-react";
import { useChurch } from "../context/ChurchContext";
import { PageHero } from "./PublicScreens";

type PageKind = "pastor" | "leadership" | "gallery" | "prayer" | "new-here";

interface ChurchPageProps {
  kind: PageKind;
  onNavigate: (tab: string) => void;
}

const pageCopy: Record<PageKind, { eyebrow: string; title: string; subtitle: string; description: string }> = {
  pastor: { eyebrow: "OUR PASTOR", title: "A Shepherd With a Heart for People", subtitle: "Home > Our Pastor", description: "Meet the spiritual leadership guiding Faith & Fire Ministries with passion and purpose." },
  leadership: { eyebrow: "LEADERSHIP TEAM", title: "People Who Serve With Purpose", subtitle: "Home > Leadership", description: "Our leaders make room for every person to grow, belong, and serve in God's Kingdom." },
  gallery: { eyebrow: "PHOTO GALLERY", title: "Moments of Faith, Captured", subtitle: "Home > Gallery", description: "A glimpse into the worship, fellowship, and service that fill our church family." },
  prayer: { eyebrow: "PRAYER REQUESTS", title: "We Would Be Honoured to Pray With You", subtitle: "Home > Prayer", description: "Share a request in confidence. Our dedicated prayer team reads and prays over every submission." },
  "new-here": { eyebrow: "NEW HERE", title: "There is a Place for You Here", subtitle: "Home > New Here", description: "Find what to expect, plan your first visit, and make Faith & Fire feel like home." }
};

export const ChurchPage: React.FC<ChurchPageProps> = ({ kind, onNavigate }) => {
  const { churchInfo, addConnectSubmission } = useChurch();
  const [sent, setSent] = useState(false);
  const copy = pageCopy[kind];
  const leaders = churchInfo.pastors?.length ? churchInfo.pastors : [{ id: "pastor", name: churchInfo.pastorName, title: churchInfo.pastorTitle, photo: churchInfo.pastorPhoto, bio: churchInfo.pastorBio }];

  const submitPrayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addConnectSubmission("Prayer", String(data.get("name") || "Anonymous"), String(data.get("request") || ""), String(data.get("email") || ""));
    event.currentTarget.reset();
    setSent(true);
  };

  if (kind === "prayer") {
    return (
      <>
        <PageHero
          title={copy.title}
          subtitle={copy.subtitle}
          category={copy.eyebrow}
          bgImage="/images/Generated image 1 (8).png"
        />
        <section className="section-space bg-[#f8fafc]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sec-title sec-title--center mb-16">
              <h6 className="sec-title__tagline">{copy.eyebrow}</h6>
              <h3 className="sec-title__title">{copy.title}</h3>
              <p className="mt-4 text-[#64748b] text-[15px] max-w-xl mx-auto">{copy.description}</p>
            </div>

            <div className="max-w-2xl mx-auto bg-white p-8 border border-slate-200 shadow-sm">
              <form onSubmit={submitPrayer} className="space-y-6">
                <div>
                  <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Your Name *</label>
                  <input name="name" required  placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Email Address *</label>
                  <input name="email" type="email" required  placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Prayer Request *</label>
                  <textarea required name="request" rows={5}  placeholder="Tell us how we can pray for you..." />
                </div>
                <button type="submit" className="floens-btn w-full justify-center cursor-pointer">
                  <span>Send Prayer Request</span>
                  <Send className="w-4 h-4" />
                </button>
                {sent && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center">
                    Thank you. Our prayer team will hold your request in agreement and prayer.
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (kind === "new-here") {
    return (
      <>
        <PageHero
          title={copy.title}
          subtitle={copy.subtitle}
          category={copy.eyebrow}
          bgImage="/images/Generated image 1 (7).png"
        />
        <section className="section-space bg-[#f8fafc]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sec-title sec-title--center mb-16">
              <h6 className="sec-title__tagline">{copy.eyebrow}</h6>
              <h3 className="sec-title__title">{copy.title}</h3>
              <p className="mt-4 text-[#64748b] text-[15px] max-w-xl mx-auto">{copy.description}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto mb-12">
              {[
                [Users, "Come As You Are", "You will be welcomed by a friendly team from the moment you step through our doors."],
                [Play, "Meaningful Worship", "Services are built around sound biblical preaching, spirit-filled worship, and genuine community."],
                [ArrowRight, "Take Your Next Step", "Plan your visit so our ushering team can make your first Sunday unforgettable."]
              ].map(([Icon, title, text]) => {
                const CardIcon = Icon as typeof Users;
                return (
                  <div key={String(title)} className="service-card-two bg-white border border-slate-200 p-8 shadow-sm">
                    <div className="w-14 h-14 bg-[#0a192f] text-[#38bdf8] flex items-center justify-center mb-6">
                      <CardIcon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold text-[#0a192f] mb-3">{String(title)}</h4>
                    <p className="text-sm text-[#64748b] leading-relaxed">{String(text)}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => onNavigate("visitor-card")} className="floens-btn cursor-pointer">
                <span>Complete Visitor Card</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => onNavigate("plan-your-visit")} className="floens-btn floens-btn--border cursor-pointer">
                <span>Plan Your Visit</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const visibleLeaders = kind === "pastor" ? leaders.slice(0, 1) : kind === "leadership" ? leaders : [];
  const galleryImages = [
    churchInfo.pastorPhoto,
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=900"
  ];

  return (
    <>
      <PageHero
        title={copy.title}
        subtitle={copy.subtitle}
        category={copy.eyebrow}
        bgImage="/images/Generated image 1 (9).png"
      />
      <section className="section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">{copy.eyebrow}</h6>
            <h3 className="sec-title__title">{copy.title}</h3>
            <p className="mt-4 text-[#64748b] text-[15px] max-w-xl mx-auto">{copy.description}</p>
          </div>

          {kind === "gallery" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {galleryImages.map((image, index) => (
                <div key={image} className="blog-card group overflow-hidden border border-slate-200 bg-white">
                  <div className="blog-card__image h-64 overflow-hidden relative">
                    <img src={image} alt={`Church life moment ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {visibleLeaders.map((leader) => (
                <div key={leader.id} className="bg-[#0a192f] text-white border border-white/10 overflow-hidden shadow-xl group">
                  <div className="h-80 overflow-hidden">
                    <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <span className="text-[#38bdf8] text-xs font-bold uppercase tracking-wider block font-mono">{leader.title}</span>
                    <h3 className="text-xl font-bold text-white mt-1">{leader.name}</h3>
                    <p className="text-white/70 text-xs leading-relaxed mt-3">{leader.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

