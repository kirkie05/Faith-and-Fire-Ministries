import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useChurch } from "../context/ChurchContext";
import {
  Flame,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  Heart,
  Send,
  Play,
  Volume2,
  CheckCircle,
  HelpCircle,
  Users,
  Search,
  BookOpen,
  DollarSign,
  QrCode,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Award,
  Shield,
  Eye,
  Rocket,
  Lock,
  Building,
  CreditCard,
  ChevronDown,
  Check,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  RefreshCw,
  AlertTriangle,
  Target,
  Music
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Ministry, ChurchEvent, SermonVideo, GoogleReview } from "../types";
import { CustomMediaPlayer } from "./CustomMediaPlayer";
import { ScrollReveal, StaggeredList, StaggeredItem, Counter } from "./Animations";
import { generatePayFastSignature } from "../lib/payfast";
import QRCode from "qrcode";

export const fetchYouTubeFeed = async (youtubeChannels: any[], apiKey?: string) => {
  let combined: any[] = [];
  
  if (!youtubeChannels || youtubeChannels.length === 0) return combined;

  for (const channel of youtubeChannels) {
    const input = channel.url.trim();
    let fetchedForChannel = false;
    
    // 1. Try YouTube Data API if key is provided
    if (apiKey) {
      const ucMatch = input.match(/(UC[A-Za-z0-9_-]{22})/);
      if (ucMatch) {
        const channelId = ucMatch[1];
        const uploadsPlaylistId = 'UU' + channelId.substring(2);
        
        let pageToken = "";
        let pagesFetched = 0;
        
        while (pagesFetched < 5) { // Fetch up to 5 pages (250 videos)
          try {
            let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
            if (pageToken) apiUrl += `&pageToken=${pageToken}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
              const parsed = data.items.map((item: any, idx: number) => {
                const yid = item.snippet.resourceId.videoId;
                return {
                  id: `yt_${yid || idx}`,
                  title: item.snippet.title || "Sermon",
                  pubDate: item.snippet.publishedAt,
                  thumbnail: yid ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` : (item.snippet.thumbnails?.high?.url || ""),
                  youtubeId: yid,
                  description: item.snippet.description || ""
                };
              });
              combined = [...combined, ...parsed];
              fetchedForChannel = true;
            }
            
            if (data.nextPageToken) {
              pageToken = data.nextPageToken;
              pagesFetched++;
            } else {
              break;
            }
          } catch (e) {
            console.warn("YouTube API error:", e);
            break; // Break loop on error, fallback to RSS will not run if fetchedForChannel is true from previous page
          }
        }
      }
    }

    // 2. Fallback to RSS2JSON
    if (!fetchedForChannel) {
      const possibleRss = [];
      const ucMatch = input.match(/(UC[A-Za-z0-9_-]{22})/);
      if (ucMatch) possibleRss.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${ucMatch[1]}`);
      const userMatch = input.match(/\/user\/([a-zA-Z0-9_-]+)/);
      if (userMatch) possibleRss.push(`https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`);
      const handleMatch = input.match(/@([a-zA-Z0-9_.-]+)/);
      if (handleMatch) {
        possibleRss.push(`https://www.youtube.com/feeds/videos.xml?user=${handleMatch[1]}`);
        possibleRss.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${handleMatch[1]}`);
      }
      if (possibleRss.length === 0) {
        const clean = input.replace(/https?:\/\/(www\.)?youtube\.com\/?/, "").replace(/^\//, "");
        possibleRss.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${clean}`);
        possibleRss.push(`https://www.youtube.com/feeds/videos.xml?user=${clean}`);
      }

      for (const rssUrl of possibleRss) {
        if (fetchedForChannel) break;
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
          const data = await response.json();
          if (data.status === 'ok' && data.items && data.items.length > 0) {
            const parsed = data.items.map((item: any, idx: number) => {
              const yid = item.link.split('v=')[1]?.split('&')[0] || item.link.match(/youtu\.be\/([^&#]+)/)?.[1] || item.link;
              return {
                id: `yt_${yid || idx}`,
                title: item.title || "Sermon",
                pubDate: item.pubDate || item.pub_date || "",
                thumbnail: yid ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` : (item.thumbnail || ""),
                youtubeId: yid,
                description: item.description || ""
              };
            });
            combined = [...combined, ...parsed];
            fetchedForChannel = true;
          }
        } catch (e) {
          // Ignore and try next format
        }
      }
    }
  }

  // Deduplicate by youtubeId
  const uniqueVideos = Array.from(new Map(combined.map((v) => [v.youtubeId || v.id, v])).values());
  return uniqueVideos;
};

// Dynamic moving fire ember and golden smoke canvas component
export function FireEmbersCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || 500);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || 500;
    };

    window.addEventListener("resize", handleResize);

    // Particle structure
    interface Ember {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      maxLife: number;
      life: number;
      color: string;
      glowColor: string;
    }

    const particles: Ember[] = [];
    const colors = [
      { base: "rgba(245, 158, 11, ", glow: "#f59e0b" },  // Gold
      { base: "rgba(239, 68, 68, ", glow: "#ef4444" },   // Red
      { base: "rgba(249, 115, 22, ", glow: "#f97316" },  // Orange
      { base: "rgba(168, 85, 247, ", glow: "#a855f7" }   // Soft Purple Accent
    ];

    const createParticle = (): Ember => {
      const life = Math.random() * 120 + 80;
      const col = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: height + Math.random() * 30,
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 1.8 + 0.6),
        speedX: (Math.random() - 0.5) * 0.9,
        opacity: Math.random() * 0.7 + 0.3,
        maxLife: life,
        life: life,
        color: col.base,
        glowColor: col.glow
      };
    };

    // Populate initial particles at various heights
    for (let i = 0; i < 65; i++) {
      const p = createParticle();
      p.y = Math.random() * height;
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle ambient glow spots to build visual depth
      const grad1 = ctx.createRadialGradient(
        width * 0.3, height * 0.4, 0,
        width * 0.3, height * 0.4, Math.max(width * 0.5, 300)
      );
      grad1.addColorStop(0, "rgba(46, 8, 84, 0.5)"); // Deep Purple
      grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.7, height * 0.6, 0,
        width * 0.7, height * 0.6, Math.max(width * 0.4, 250)
      );
      grad2.addColorStop(0, "rgba(245, 158, 11, 0.08)"); // Gold
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Render the floating fire embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life--;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.life * 0.02) * 0.25; // Continuous swaying

        const currentOpacity = p.opacity * (p.life / p.maxLife);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentOpacity})`;

        // Add smooth shadows to create premium glow effects
        ctx.shadowBlur = p.size * 3.5;
        ctx.shadowColor = p.glowColor;
        ctx.fill();

        // Reset when life expires or goes off-screen
        if (p.life <= 0 || p.y < -15 || p.x < -15 || p.x > width + 15) {
          particles[i] = createParticle();
        }
      }

      ctx.shadowBlur = 0; // Reset canvas shadow state

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}

// Container animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

interface PageHeroProps {
  title: string;
  subtitle?: string;
  category?: string;
  bgImage?: string;
  quote?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({ title, bgImage }) => {
  const defaultBg = "/images/Generated image 1 (1).png";
  const mediaUrl = bgImage || defaultBg;

  return (
    <div className="relative h-[420px] md:h-[520px] w-full bg-[#0a192f] overflow-hidden flex items-center justify-center text-center px-4 mb-16">
      {/* Background Media with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={mediaUrl}
          alt={title}
          className="w-full h-full object-cover scale-[1.05]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#0a192f]/60" />
      </div>



      {/* Content - Centered like Floens Home Three */}
      <div className="relative z-20 h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <motion.h2
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-heading font-bold text-white leading-[1.1] uppercase"
          >
            {title}
          </motion.h2>
        </div>
      </div>
    </div>
  );
};

// Helper to split any headline into exactly 2 lines (Line 1: light/clean, Line 2: bold/high-impact)
const splitHeadline = (headline: string) => {
  const h = (headline || "").trim();
  // Normalize double spaces to single spaces
  const normalized = h.replace(/\s+/g, " ");

  if (normalized.toUpperCase().includes("EXPERIENCE FAITH AND FIRE PENTECOSTAL REVIVAL") || normalized.toUpperCase().includes("EXPERIENCE FAITH & FIRE PENTECOSTAL REVIVAL")) {
    return {
      line1: "Experience Faith & Fire",
      line2: "Pentecostal Revival"
    };
  }
  if (normalized.toUpperCase().includes("EXPERIENCE PENTECOSTAL REVIVAL") || normalized.toUpperCase().includes("EXPERIENCE UNCOMPROMISING PENTECOSTAL REVIVAL")) {
    return {
      line1: "Experience",
      line2: "Pentecostal Revival"
    };
  }
  if (normalized.toUpperCase().includes("UNCOMPROMISING HOLY GHOST PREACHING")) {
    return {
      line1: "Uncompromising Holy Ghost",
      line2: "Preaching & Holiness"
    };
  }
  if (normalized.toUpperCase().includes("A SANCTUARY FOR POWERFUL")) {
    return {
      line1: "A Sanctuary For Powerful",
      line2: "Divine Encounters"
    };
  }

  // Handle manual splits
  if (normalized.includes("|")) {
    const parts = normalized.split("|");
    return { line1: parts[0].trim(), line2: parts[1].trim() };
  }
  if (normalized.includes(":")) {
    const parts = normalized.split(":");
    return { line1: parts[0].trim(), line2: parts[1].trim() };
  }

  // Split in half by word count
  const words = normalized.split(" ");
  if (words.length <= 2) {
    return { line1: words[0] || "", line2: words[1] || "" };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(" "),
    line2: words.slice(mid).join(" ")
  };
};

// ==========================================
// 1. HOME SCREEN — Floens WP Home Three
// ==========================================
export const HomeScreen: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { websiteSettings, churchInfo, homepageHero, ministries, events, videos, googleReviews, addConnectSubmission, youtubeChannels, setSelectedEventId } = useChurch();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSliderDirection, setHeroSliderDirection] = useState(1);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewDirection, setReviewDirection] = useState(1);
  const [fetchedYouTubeVideos, setFetchedYouTubeVideos] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchYouTube = async () => {
      if (youtubeChannels && youtubeChannels.length > 0) {
        try {
          const allVideos = await fetchYouTubeFeed(youtubeChannels, (import.meta as any).env.VITE_YOUTUBE_API_KEY); 
          if (active) {
            // Map to the format HomeScreen expects
            const formatted = allVideos.map((v: any) => ({
              title: v.title,
              date: v.pubDate ? v.pubDate.split(' ')[0] : "",
              fullDate: v.pubDate ? new Date(v.pubDate).getTime() : 0,
              thumbnailUrl: v.thumbnail,
              youtubeId: v.youtubeId
            }));
            formatted.sort((a: any, b: any) => b.fullDate - a.fullDate);
            setFetchedYouTubeVideos(formatted);
          }
        } catch (error) {
          console.error("Failed to fetch YouTube videos", error);
        }
      } else {
        if (active) setFetchedYouTubeVideos([]);
      }
    };
    fetchYouTube();
    return () => { active = false; };
  }, [youtubeChannels]);


  const slides = (homepageHero.slides && homepageHero.slides.length > 0)
    ? homepageHero.slides
    : [
      {
        headline: "His Presence|Transforms",
        subhead: "Step into an atmosphere where heartfelt worship, fervent prayer, and the life-changing power of the Holy Spirit draw people closer to Jesus Christ and transform lives forever.",
        cta1Text: "Discover More",
        cta1Tab: "about",
        cta2Text: "Watch Live",
        cta2Tab: "sermons",
        imageUrl: "/images/Generated image 1.png"
      },
      {
        headline: "Faith Ignites|Revival",
        subhead: "Join a Bible-based church committed to proclaiming the Gospel of Jesus Christ through sound biblical teaching, passionate worship, and authentic encounters with God's presence.",
        cta1Text: "Plan Your Visit",
        cta1Tab: "plan-your-visit",
        cta2Text: "Our Beliefs",
        cta2Tab: "about",
        imageUrl: "/images/Generated image 1 (4).png"
      },
      {
        headline: "Walk in|Holy Fire",
        subhead: "Grow in faith, holiness, and righteousness as you are equipped through God's Word and empowered by the Holy Spirit to live a victorious Christian life.",
        cta1Text: "Join Us Sunday",
        cta1Tab: "plan-your-visit",
        cta2Text: "Contact Us",
        cta2Tab: "contact",
        imageUrl: "/images/Generated image 1 (5).png"
      }
    ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeVideos = [...fetchedYouTubeVideos];

  // Safe fallback if activeVideoIndex goes out of bounds
  const currentVideo = (activeVideos && activeVideos.length > activeVideoIndex) 
    ? activeVideos[activeVideoIndex] 
    : (activeVideos && activeVideos.length > 0 ? activeVideos[0] : null);

  const latestSermon = currentVideo || {
    id: "featured",
    title: "Walking in Radical Faith & Holiness",
    speaker: "Apostle Eric Malaba",
    date: "Latest Service",
    category: "Sermon",
    youtubeId: "dQw4w9WgXcQ",
    description: "An anointed message on uncompromised biblical living.",
    thumbnailUrl: "/images/Generated image 1 (6).png"
  };

  // Progress bar refs for animation
  const [progressVisible, setProgressVisible] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setProgressVisible(true);
    }, { threshold: 0.3 });
    if (progressRef.current) observer.observe(progressRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white overflow-hidden">

      {/* =============================================
          1. HERO SLIDER (main-slider-three)
          Exact Floens layout: centered text, white borders,
          social links on left, slide counter bottom
          ============================================= */}
      <section className="relative h-screen min-h-[700px] max-h-[1100px] flex items-center justify-center overflow-hidden bg-[#0a192f]">
        {/* Social links - left side vertical */}
        <div className="absolute left-[40px] top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-5">
          {[
            { href: churchInfo.socials?.facebook || "#", icon: <Facebook className="w-4 h-4" /> },
            { href: churchInfo.socials?.instagram || "#", icon: <Instagram className="w-4 h-4" /> },
            { href: churchInfo.socials?.youtube || "#", icon: <Youtube className="w-4 h-4" /> },
          ].map((s, i) => (
            <a key={i} href={s.href} className="text-white/50 hover:text-[#38bdf8] transition-colors" target="_blank" rel="noopener noreferrer">
              {s.icon}
            </a>
          ))}
        </div>

        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            {/* Background image */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className={`absolute inset-0 bg-cover bg-center ${index === currentSlide ? "animate-ken-burns" : "scale-[1.05]"}`}
                style={{ backgroundImage: `url('${slide.imageUrl || "/images/Generated image 1.png"}')` }}
              />
              <div className="absolute inset-0 bg-[#0a192f]/60" />
            </div>

            {/* Content - Centered like Floens Home Three */}
            <div className="relative z-20 h-full flex items-center justify-center text-center px-4">
              <div className="max-w-4xl mx-auto">
                {/* Rotating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: index === currentSlide ? 1 : 0, scale: index === currentSlide ? 1 : 0.5 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mx-auto mb-8 w-[130px] h-[130px] relative hidden lg:block"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-10 h-10 text-[#f59e0b]" />
                  </div>
                  <div className="animate-spin-slow">
                    <svg viewBox="0 0 200 200" className="w-[130px] h-[130px]">
                      <defs>
                        <path id="circlePath" d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
                      </defs>
                      <text fill="white" fontSize="12.5" fontWeight="600" letterSpacing="4" style={{ textTransform: "uppercase" }}>
                        <textPath href="#circlePath">
                          FAITH & FIRE MINISTRIES • JOHANNESBURG •
                        </textPath>
                      </text>
                    </svg>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: index === currentSlide ? 0 : 40, opacity: index === currentSlide ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                  className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-heading font-bold text-white leading-[1.1] mb-8"
                >
                  {(slide.headline || "").split('|').map((part: string, pi: number) => (
                    <motion.span 
                      key={pi} 
                      className={pi > 0 ? "block mt-2" : "block"}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: index === currentSlide ? 0 : 40, opacity: index === currentSlide ? 1 : 0 }}
                      transition={{ duration: 0.8, delay: 0.25 + (pi * 0.15), ease: "easeOut" }}
                    >
                      {part.trim()}
                    </motion.span>
                  ))}
                </motion.h2>

                {/* Subhead */}
                <motion.p
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: index === currentSlide ? 0 : 40, opacity: index === currentSlide ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
                  className="text-white/70 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                  {slide.subhead}
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: index === currentSlide ? 0 : 40, opacity: index === currentSlide ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <button
                    onClick={() => slide.cta1Tab && setCurrentTab(slide.cta1Tab)}
                    className="floens-btn cursor-pointer"
                  >
                    <span>{slide.cta1Text}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {slide.cta2Text && (
                    <button
                      onClick={() => slide.cta2Tab && setCurrentTab(slide.cta2Tab)}
                      className="floens-btn floens-btn--border cursor-pointer !border-white/30 !text-white hover:!border-[#38bdf8]"
                    >
                      <span>{slide.cta2Text}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        ))}

        {/* Slider arrows */}
        <div className="absolute bottom-[50px] right-[40px] z-30 flex items-center gap-6">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="w-12 h-12 border border-white/20 text-white/60 hover:bg-[#38bdf8] hover:text-[#0a192f] hover:border-[#38bdf8] flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white/50 text-sm font-medium tracking-widest">
            {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="w-12 h-12 border border-white/20 text-white/60 hover:bg-[#38bdf8] hover:text-[#0a192f] hover:border-[#38bdf8] flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* =============================================
          2. ABOUT THREE — Floens about-three
          ============================================= */}
      <section className="section-space bg-white overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Side - Cleaner Grid Layout */}
            <ScrollReveal direction="right" className="relative min-h-[500px] flex gap-4">
              <div className="w-1/2 pt-12">
                <img src="/images/Generated image 1 (1).png" alt="Church Service" className="w-full h-[400px] object-cover rounded-xl shadow-lg hover-image-container" />
              </div>
              <div className="w-1/2 flex flex-col gap-4">
                <img src="/images/Generated image 1 (2).png" alt="Worship" className="w-full h-[240px] object-cover rounded-xl shadow-lg hover-image-container" />
                <img src="/images/Generated image 1 (3).png" alt="Fellowship" className="w-full h-[200px] object-cover rounded-xl shadow-lg hover-image-container" />
              </div>
            </ScrollReveal>

            {/* Content Side */}
            <ScrollReveal direction="left" className="space-y-7">
              <div className="sec-title">
                <h6 className="sec-title__tagline">ABOUT US</h6>
                <h3 className="sec-title__title">
                  A Christ-Centred Church for Every Generation
                </h3>
              </div>

              <p className="text-[#64748b] text-[16px] leading-[1.8]">
                Faith & Fire Ministries is a Christ-centred church where people of every generation are invited to grow in faith, discover God's purpose, and build a lasting relationship with Jesus Christ. Whether you are exploring Christianity, returning to church, or seeking a spiritual home, you will find a welcoming community committed to faith, holiness, and authentic Christian living.
              </p>

              <div className="pt-4">
                <button onClick={() => setCurrentTab("about")} className="floens-btn cursor-pointer">
                  <span>More About Us</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =============================================
          3. SERVICES THREE — Dark bg, video + carousel cards
          ============================================= */}
      <section className="relative bg-[#0a192f] overflow-hidden">
        {/* Top part with title + video/stats inner */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] pb-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
            <ScrollReveal className="sec-title max-w-2xl">
              <h6 className="sec-title__tagline">Our Beliefs</h6>
              <h3 className="sec-title__title !text-white">We Believe in Uncompromised Biblical Truth</h3>
            </ScrollReveal>
            <button onClick={() => setCurrentTab("about")} className="floens-btn floens-btn--border !border-[#38bdf8] !text-[#38bdf8] shrink-0 cursor-pointer">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Video + Stats inner block (REMOVED) */}
        </div>

        {/* Service cards */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-[120px]">
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <BookOpen className="w-10 h-10" />, title: "The Word of Faith", desc: "We believe the Word of God is true, living, powerful, and relevant to every area of life.", img: "/images/Generated image 1 (11).png" },
              { icon: <Shield className="w-10 h-10" />, title: "Undiluted Holiness", desc: "Holiness is not an outdated concept. It is a fundamental expression of our relationship with God.", img: "/images/Generated image 1 (12).png" },
              { icon: <Flame className="w-10 h-10" />, title: "Power of the Spirit", desc: "God still transforms lives, answers prayer, heals, delivers, restores, and equips His people.", img: "/images/Generated image 1 (13).png" },
            ].map((card, i) => (
              <StaggeredItem key={i} className="service-card-two group hover-card">
                <div className="service-card-two__image">
                  <img src={card.img} alt={card.title} />
                </div>
                <div className="service-card-two__content">
                  <h3 className="service-card-two__title">{card.title}</h3>
                  <p className="text-[#64748b] text-[15px] leading-relaxed mb-6">{card.desc}</p>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      </section>

      {/* =============================================
          4. WORK PROCESS — 4 steps with images
          ============================================= */}
      <section className="section-space-two bg-[#f8fafc] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">Your Journey</h6>
            <h3 className="sec-title__title">Steps to Get Connected<br />With Our Church</h3>
          </ScrollReveal>

          <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-[90px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent z-0" />

            {[
              { title: "Plan Your Visit", step: "Step 01", img: "/images/Generated image 1 (7).png", target: "plan-your-visit" },
              { title: "Attend a Service", step: "Step 02", img: "/images/Generated image 1 (8).png", target: "new-here" },
              { title: "Join a Ministry", step: "Step 03", img: "/images/Generated image 1 (9).png", target: "ministries" },
              { title: "Serve & Grow", step: "Step 04", img: "/images/Generated image 1 (10).png", target: "next-steps" },
            ].map((step, i) => (
              <StaggeredItem key={i} className="work-process__item relative z-10" direction="up">
                <div 
                  onClick={() => {
                    setCurrentTab(step.target);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="cursor-pointer group block"
                >
                  <div className="work-process__image transition-transform duration-300 group-hover:scale-105">
                    <div className="work-process__image__inner">
                      <img src={step.img} alt={step.title} />
                    </div>
                  </div>
                  <div className="work-process__content">
                    <h4 className="work-process__title transition-colors duration-300 group-hover:text-[#38bdf8]">{step.title}</h4>
                    <span className="work-process__step">{step.step}</span>
                  </div>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      </section>

      {/* =============================================
          10. TEAM TWO — List layout with stacked items
          ============================================= */}
      <section className="section-space-two bg-[#f8fafc] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
            <div className="sec-title max-w-lg">
              <h6 className="sec-title__tagline">Our Team</h6>
              <h3 className="sec-title__title">Meet our Church<br />Leadership</h3>
            </div>
            <p className="text-[#64748b] max-w-lg text-[16px] leading-[1.8]">
              Faith & Fire Ministries is led by Apostle Eric Malaba, whose ministry is centred on proclaiming biblical truth and calling believers to a life of faith, holiness, and spiritual maturity.
            </p>
          </div>

            <StaggeredList className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Team list */}
            <div className="lg:col-span-8">
              {[
                { 
                  name: "Apostle Eric Malaba", 
                  role: "Senior Pastor", 
                  img: "/images/Pastor 1.png",
                  description: "A visionary leader committed to proclaiming biblical truth and calling believers to a life of faith, holiness, and spiritual maturity."
                },
              ].map((member, i) => (
                <StaggeredItem key={i} className="team-two__item group !p-8 hover-card" direction="left">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#38bdf8]/30 shrink-0">
                        <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="pt-2">
                        <h4 className="team-two__name text-2xl">{member.name}</h4>
                        <span className="team-two__designation text-[#38bdf8] mb-3 block">{member.role}</span>
                        <p className="text-[#64748b] leading-relaxed max-w-lg">{member.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      {[Facebook, Instagram, Youtube].map((Icon, ii) => (
                        <a key={ii} href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0a192f] hover:bg-[#38bdf8] hover:text-white hover:border-[#38bdf8] transition-all">
                          <Icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                </StaggeredItem>
              ))}
            </div>

            {/* Team image stack */}
            <StaggeredItem className="lg:col-span-4 hidden lg:block" direction="right">
              <div className="relative hover-image-container">
                <img src="/images/Pastor 1.png" alt="Apostle Eric Malaba" className="w-full h-[400px] object-cover rounded-xl shadow-lg" />
              </div>
            </StaggeredItem>
          </StaggeredList>
        </div>
      </section>

      {/* =============================================
          5. PROJECTS THREE — Asymmetric grid
          ============================================= */}
      <section className="relative bg-[#0a192f] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url(/images/Generated image 1 (4).png)" }} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-[120px]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
            <ScrollReveal className="sec-title max-w-2xl">
              <h6 className="sec-title__tagline">Media</h6>
              <h3 className="sec-title__title !text-white">Our Recent<br />Services & Sermons</h3>
            </ScrollReveal>
            <button onClick={() => setCurrentTab("sermons")} className="floens-btn floens-btn--border !border-[#38bdf8] !text-[#38bdf8] shrink-0 cursor-pointer">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Latest Sermon */}
            <div className="projects-three__card cursor-pointer w-full h-[400px] lg:h-[500px]" onClick={() => !isPlaying && setIsPlaying(true)}>
              {isPlaying && latestSermon.youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${latestSermon.youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
                  title={latestSermon.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <>
                  <div className="projects-three__card__bg" style={{ backgroundImage: `url('${latestSermon.thumbnailUrl}')` }} />
                  <div className="absolute inset-0 bg-[#0a192f]/40 flex items-center justify-center group-hover:bg-[#0a192f]/20 transition-all">
                    <Play className="w-20 h-20 text-white opacity-80" />
                  </div>
                  <div className="projects-three__card__content text-center w-full pointer-events-none">
                    <h3 className="text-[#38bdf8] text-sm uppercase font-bold tracking-wider mb-2">Latest Sermon</h3>
                    <h4 className="text-white text-2xl lg:text-3xl font-bold">{latestSermon.title}</h4>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Other Recent Sermons */}
            <div className="flex flex-col justify-between">
              {(activeVideos && activeVideos.length > 1 ? activeVideos.slice(1, 4) : [
                { title: "Building a Foundation of Faith", date: "2024-05-12", thumbnailUrl: "/images/Generated image 1 (7).png", youtubeId: "" },
                { title: "The Power of the Holy Spirit", date: "2024-05-05", thumbnailUrl: "/images/Generated image 1 (8).png", youtubeId: "" },
                { title: "Living a Victorious Life", date: "2024-04-28", thumbnailUrl: "/images/Generated image 1 (9).png", youtubeId: "" }
              ]).map((sermon: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer group flex-1 mb-4 last:mb-0" onClick={() => { setActiveVideoIndex(idx + 1); setIsPlaying(true); }}>
                  <div className="w-40 h-24 rounded-lg bg-neutral-800 overflow-hidden shrink-0 relative">
                     <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                       <Play className="w-8 h-8 text-white shadow-sm" />
                     </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-[#38bdf8] transition-colors">{sermon.title}</h4>
                    <p className="text-[#38bdf8]/80 text-xs font-semibold uppercase tracking-wider">{new Date(sermon.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          11. BLOG THREE — 3-column card grid
          ============================================= */}
      <section className="section-space-two bg-white pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">Upcoming Events</h6>
            <h3 className="sec-title__title">See Latest Events</h3>
          </div>

          {/* Announcements Bulletins */}

          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(events && events.filter(e => !e.archived).length > 0 ? events.filter(e => !e.archived).slice(0, 3) : [
              { id: "1", title: "Sunday Morning Worship Service", date: new Date().toISOString(), description: "Join us for a Spirit-filled worship experience.", imageUrl: "/images/Generated image 1 (6).png" },
              { id: "2", title: "Midweek Bible Study & Prayer", date: new Date().toISOString(), description: "Deepen your understanding of God's Word.", imageUrl: "/images/Generated image 1 (12).png" },
              { id: "3", title: "Youth Fellowship & Outreach", date: new Date().toISOString(), description: "Connecting young people with purpose and community.", imageUrl: "/images/Generated image 1 (14).png" },
            ]).map((event: any, i: number) => {
              const d = new Date(event.date);
              return (
                <StaggeredItem key={event.id || i} className="blog-card cursor-pointer hover-card" direction="up">
                  <div className="blog-card__content" onClick={() => { setSelectedEventId(event.id); setCurrentTab("events"); }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-[#0a192f] text-white text-center rounded px-3 py-1">
                        <span className="block font-bold text-xl leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-[#38bdf8]">{d.toLocaleString('en', { month: 'short' })}</span>
                      </div>
                      <h3 className="blog-card__title !mb-0 text-xl">
                        {event.title}
                      </h3>
                    </div>
                    <ul className="blog-card__meta">
                      <li className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Faith & Fire
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {d.toLocaleString('en', { month: 'long', year: 'numeric' })}
                      </li>
                    </ul>
                  </div>
                </StaggeredItem>
              );
            })}
          </StaggeredList>
        </div>
      </section>

      {/* =============================================
          7. RELIABLE ONE — Split layout with experience badge
          ============================================= */}
      <section className="section-space-bottom pt-[120px] bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image side */}
            <div className="relative">
              <div className="w-full overflow-hidden">
                <img src="/images/Generated image 1 (4).png" alt="Faithful Ministry" className="w-full h-[450px] object-cover" />
              </div>
              {/* Experience badge */}
              <ScrollReveal direction="right" className="experience hover-card">
                <h3 className="experience__year"><Counter end={30} duration={2} /></h3>
                <p className="experience__text">years of<br />ministry</p>
              </ScrollReveal>
            </div>

            {/* Content side */}
            <div>
              <div className="sec-title sec-title--border mb-8">
                <h3 className="sec-title__title">We Provide Faithful & Spirit-Filled Ministry</h3>
              </div>
              <p className="text-[#64748b] text-[16px] leading-[1.8] mb-8">
                Our vision is to make the world pleasing to God through the Word of Faith, Holiness, and the power of the Holy Spirit. We believe transformation begins with individuals whose hearts have been surrendered to Jesus Christ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          8. CONTACT ONE — Left info + Right form
          ============================================= */}
      <section className="section-space bg-[#f8fafc] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left content */}
            <div>
              <div className="sec-title sec-title--border mb-8">
                <h6 className="sec-title__tagline">Contact</h6>
                <h3 className="sec-title__title">Reach Out &<br />Connect with Us</h3>
              </div>
              <p className="text-[#64748b] text-[16px] leading-[1.8] mb-10">
                Whether you have a question about our church services, would like to request prayer, need directions, or simply want to connect — we would love to hear from you.
              </p>

              {/* Contact info card */}
              <div className="contact-one__info rounded-none">
                <div className="contact-one__info__item">
                  <div className="contact-one__info__icon">
                    <Phone className="w-5 h-5" />
                  </div>
                  <p className="contact-one__info__text">
                    <a href={`tel:${churchInfo.phone}`}>{churchInfo.phone}</a>
                  </p>
                </div>
                <div className="contact-one__info__item">
                  <div className="contact-one__info__icon">
                    <Mail className="w-5 h-5" />
                  </div>
                  <p className="contact-one__info__text">
                    <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
                  </p>
                </div>
                <div className="contact-one__info__item">
                  <div className="contact-one__info__icon">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="contact-one__info__text">
                    <a href="#">46 Turffontein St, Rosettenville, Johannesburg South, 2190</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Right form */}
            <div className="bg-white p-10 lg:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <h2 className="text-2xl font-bold text-[#0a192f] mb-2">Get In Touch With Us</h2>
              <p className="text-[#64748b] text-sm mb-8">And experience top-notch spiritual guidance</p>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Message sent!"); }}>
                <div className="form-one__control">
                  <input type="text" placeholder="Your name" required />
                </div>
                <div className="form-one__control">
                  <input type="email" placeholder="Your email" required />
                </div>
                <div className="form-one__control">
                  <select>
                    <option>Choose a service</option>
                    <option>Prayer Request</option>
                    <option>Plan Your Visit</option>
                    <option>General Enquiry</option>
                    <option>Ministry Partnership</option>
                  </select>
                </div>
                <div className="form-one__control">
                  <textarea rows={5} placeholder="Write message" required />
                </div>
                <button type="submit" className="floens-btn w-full justify-center cursor-pointer">
                  <span>Send Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          9. TESTIMONIALS THREE — Side-by-side layout
          ============================================= */}
      {googleReviews && googleReviews.length > 0 && (
        <section className="section-space bg-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sec-title sec-title--center mb-16">
              <h6 className="sec-title__tagline">Testimonials</h6>
              <h3 className="sec-title__title">What People are Talking<br />About Faith & Fire</h3>
            </div>

            <div className="max-w-5xl mx-auto relative px-12">
              <button 
                onClick={() => {
                  setReviewDirection(-1);
                  setCurrentReviewIndex((prev) => (prev === 0 ? googleReviews.length - 1 : prev - 1));
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-[#38bdf8] text-[#0a192f] hover:text-white rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <button 
                onClick={() => {
                  setReviewDirection(1);
                  setCurrentReviewIndex((prev) => (prev === googleReviews.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-[#38bdf8] text-[#0a192f] hover:text-white rounded-full transition-colors"
              >
                <ChevronRight size={24} />
              </button>

              <div className="overflow-hidden relative w-full h-[350px]">
                <AnimatePresence initial={false} custom={reviewDirection}>
                  <motion.div
                    key={currentReviewIndex}
                    custom={reviewDirection}
                    variants={{
                      enter: (direction: number) => ({
                        x: direction > 0 ? 1000 : -1000,
                        opacity: 0
                      }),
                      center: {
                        x: 0,
                        opacity: 1
                      },
                      exit: (direction: number) => ({
                        x: direction < 0 ? 1000 : -1000,
                        opacity: 0
                      })
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute w-full h-full"
                  >
                    <div className="testimonials-card-three h-full">
                      <div className="testimonials-card-three__left h-full">
                        <div className="testimonials-card-three__image h-full">
                          {googleReviews[currentReviewIndex].profile_photo_url ? (
                            <img src={googleReviews[currentReviewIndex].profile_photo_url} alt={googleReviews[currentReviewIndex].author_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full min-h-[300px] bg-[#0a192f] flex items-center justify-center">
                              <User className="w-24 h-24 text-[#38bdf8] opacity-50" />
                            </div>
                          )}
                        </div>
                        {/* Quote SVG */}
                        <div className="testimonials-card-three__quotes">
                          <svg className="testimonials-card-three__quotes__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 106" fill="none">
                            <path d="M0 66.712H29.2013L9.73361 105.647H38.9349L58.4026 66.712V8.30945H0V66.712Z" fill="#0a192f" />
                            <path d="M77.8696 8.30945V66.712H107.071L87.6032 105.647H116.805L136.272 66.712V8.30945H77.8696Z" fill="#0a192f" />
                            <path d="M37.5109 57.9026H8.80957V0.5H66.2121V58.2845L46.9354 96.8374H18.8522L37.9581 58.6262L38.3199 57.9026H37.5109Z" stroke="#38bdf8" />
                            <path d="M115.381 57.9026H86.6797V0.5H144.082V58.2845L124.806 96.8374H96.7223L115.828 58.6262L116.19 57.9026H115.381Z" stroke="#38bdf8" />
                          </svg>
                        </div>
                      </div>
                      <div className="testimonials-card-three__right flex flex-col justify-center h-full">
                        <div className="floens-ratings">
                          {'★'.repeat(Math.min(googleReviews[currentReviewIndex].rating, 5)).split('').map((s, i) => <span key={i}>{s}</span>)}
                        </div>
                        <p className="testimonials-card-three__text">
                          "{googleReviews[currentReviewIndex].text}"
                        </p>
                        <div className="testimonials-card-three__info">
                          <h4 className="testimonials-card-three__name">{googleReviews[currentReviewIndex].author_name}</h4>
                          <span className="testimonials-card-three__designation">Church Member</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export const AboutScreen: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { churchInfo } = useChurch();

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="bg-white">
      <PageHero
        title="About Us"
        bgImage="/images/Generated image 1 (4).png"
      />

      {/* 2. A Christ-Centred Church Section */}
      <section className="section-space bg-white overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Side - Cleaner Grid Layout */}
            <ScrollReveal direction="right" className="relative min-h-[500px] flex gap-4">
              <div className="w-1/2 pt-12">
                <img src="/images/Generated image 1 (1).png" alt="Church Service" className="w-full h-[400px] object-cover rounded-xl shadow-lg hover-image-container" />
              </div>
              <div className="w-1/2 flex flex-col gap-4">
                <img src="/images/Generated image 1 (2).png" alt="Worship" className="w-full h-[240px] object-cover rounded-xl shadow-lg hover-image-container" />
                <img src="/images/Generated image 1 (3).png" alt="Fellowship" className="w-full h-[200px] object-cover rounded-xl shadow-lg hover-image-container" />
              </div>
            </ScrollReveal>

            {/* Content Side */}
            <ScrollReveal direction="left" className="space-y-7">
              <div className="sec-title">
                <h6 className="sec-title__tagline">ABOUT US</h6>
                <h3 className="sec-title__title">
                  A Christ-Centred Church for Every Generation
                </h3>
              </div>

              <p className="text-[#64748b] text-[16px] leading-[1.8]">
                Faith & Fire Ministries is a Christ-centred church where people of every generation are invited to grow in faith, discover God's purpose, and build a lasting relationship with Jesus Christ. Whether you are exploring Christianity, returning to church, or seeking a spiritual home, you will find a welcoming community committed to faith, holiness, and authentic Christian living.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 3. Leadership Section (Moved up here) */}
      <section className="relative section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content overlaid on block */}
            <ScrollReveal direction="left" className="bg-[#0a192f] text-white p-10 lg:p-14 shadow-2xl relative z-10 border-l-4 border-[#38bdf8]">
              <div className="inline-flex mb-4">
                <span className="bg-[#38bdf8] text-white font-bold px-3 py-1 text-xs uppercase tracking-wider">OUR LEADERSHIP</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight font-heading mb-6">
                Led by {churchInfo.pastorName || "Apostle Eric Malaba"}
              </h2>
              <p className="text-white/70 text-[16px] leading-[1.8] mb-8">
                {churchInfo.pastorBio || "For more than three decades, he has faithfully preached God's Word, encouraging people to build their lives on biblical truth and experience the transforming work of the Holy Spirit. His ministry is marked by a commitment to sound doctrine, fervent prayer, and raising disciples who faithfully represent Christ."}
              </p>
              <button onClick={() => setCurrentTab && setCurrentTab("contact")} className="floens-btn !bg-[#d97706] text-white border-none">
                <span>CONNECT WITH US</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </ScrollReveal>

            {/* Right Background / Team Cards */}
            <ScrollReveal direction="right" className="relative h-[450px] lg:h-full min-h-[500px]">
              <div className="absolute inset-0 right-[-10vw]">
                <img src="/images/Generated image 1 (1).png" alt="Background" className="w-full h-full object-cover rounded-l-3xl shadow-xl" />
                <div className="absolute inset-0 bg-[#0a192f]/20 rounded-l-3xl" />
              </div>
              
              {/* Overlapping Team Card */}
              <div className="absolute bottom-10 left-0 lg:-left-12 bg-white shadow-2xl w-[280px] p-4 group rounded-xl border border-gray-100">
                <div className="w-full h-[320px] overflow-hidden mb-4 bg-slate-100 rounded-lg relative">
                  <img src="/images/Pastor 1.png" alt={churchInfo.pastorName || "Apostle Eric Malaba"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.currentTarget.src = "/images/Generated image 1 (7).png"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="text-center pb-2">
                  <h4 className="font-heading font-black text-xl text-[#0a192f] mb-1">{churchInfo.pastorName || "Apostle Eric Malaba"}</h4>
                  <p className="text-[#d97706] font-bold text-sm uppercase tracking-wider">{churchInfo.pastorTitle || "Senior Pastor"}</p>
                </div>
                <div className="flex justify-center gap-4 mt-2 mb-2">
                  <a href={churchInfo.socials?.facebook || "#"} className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#0a192f] hover:bg-[#38bdf8] hover:text-white transition-colors"><Facebook className="w-4 h-4" /></a>
                  <a href={churchInfo.socials?.youtube || "#"} className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#0a192f] hover:bg-[#38bdf8] hover:text-white transition-colors"><Youtube className="w-4 h-4" /></a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 4. Our Vision (Rebuilt like a professional UI designer) */}
      <section className="section-space bg-[#0a192f] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <img src="/images/Generated image 1 (14).png" alt="Texture" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <ScrollReveal direction="up">
              <span className="text-[#38bdf8] font-bold tracking-widest uppercase mb-4 block">OUR VISION & MISSION</span>
              <h2 className="text-4xl sm:text-5xl font-black font-heading mb-6 leading-tight">Making the World Pleasing to God</h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Our vision is to make the world pleasing to God through the Word of Faith, Holiness, and the Power of the Holy Spirit. We believe that lasting transformation begins when people encounter Jesus Christ, embrace the truth of His Word, and walk in obedience to His will.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission Card */}
            <ScrollReveal direction="left" delay={0.1} className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1 shadow-2xl">
              <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                <img src="/images/Generated image 1 (11).png" alt="Mission" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-[#0a192f]/80 to-transparent"></div>
              </div>
              <div className="relative p-10 h-full flex flex-col justify-end min-h-[350px]">
                <div className="w-16 h-16 rounded-full bg-[#d97706] flex items-center justify-center mb-6 shadow-lg shadow-[#d97706]/20">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black font-heading mb-4 text-white group-hover:text-[#38bdf8] transition-colors">Our Mission</h3>
                <p className="text-white/80 leading-relaxed text-lg">
                  Our mission is to faithfully proclaim the Gospel of Jesus Christ while equipping believers to grow in faith, maturity, and spiritual purpose.
                </p>
              </div>
            </ScrollReveal>

            {/* Values Card */}
            <ScrollReveal direction="right" delay={0.2} className="group relative rounded-2xl overflow-hidden bg-white shadow-2xl p-10 border-b-4 border-[#d97706]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 h-full flex flex-col justify-center">
                <h3 className="text-2xl font-black font-heading mb-8 text-[#0a192f]">Core Principles</h3>
                <ul className="space-y-6">
                  {[
                    "Uncompromising Faith",
                    "Undiluted Holiness",
                    "Fervent Prayer",
                    "Christ-Centred Worship",
                    "Love & Community"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-full bg-[#f1f5f9] group-hover/item:bg-[#38bdf8] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <Check className="w-5 h-5 text-[#0a192f] group-hover/item:text-white transition-colors duration-300" />
                      </div>
                      <span className="font-bold text-[#64748b] group-hover/item:text-[#0a192f] text-lg transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 5. Our Foundation Section */}
      <section className="section-space bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <ScrollReveal>
            <div className="inline-flex mb-4">
              <span className="bg-[#38bdf8] text-white font-bold px-3 py-1 text-sm uppercase tracking-wider">OUR FOUNDATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0a192f] leading-tight font-heading mb-6">
              Built on God's Unchanging Word
            </h2>
            <p className="text-[#64748b] text-[16px] leading-[1.8] mb-6">
              Everything we do is rooted in the authority of Scripture. We believe that God's Word is living, powerful, and relevant for every generation. It is our guide for faith, our standard for living, and the foundation upon which we build our lives.
            </p>
            <p className="text-[#64748b] text-[16px] leading-[1.8]">
              As a church, we are committed to teaching the Bible with clarity and conviction, helping believers understand God's truth and apply it to everyday life.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. What You'll Experience Section */}
      <section className="section-space bg-[#f8fafc] relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h6 className="text-[#d97706] font-bold tracking-widest uppercase mb-4">WHAT YOU'LL EXPERIENCE</h6>
            <h2 className="text-3xl sm:text-4xl font-black font-heading mb-6 text-[#0a192f]">A Place to Worship, Grow, and Belong</h2>
            <p className="text-[#64748b] text-lg">
              When you visit Faith & Fire Ministries, you'll discover more than a church service—you'll find a welcoming community committed to helping you grow in your walk with Christ.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ScrollReveal direction="up" delay={0.1} className="bg-white p-8 border border-gray-100 hover:border-[#38bdf8] transition-colors rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300">
              <h4 className="font-heading font-black text-xl mb-3 text-[#0a192f]">Christ-Centred Worship</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Experience heartfelt worship that exalts Jesus Christ and creates an atmosphere where people can encounter God's presence.</p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2} className="bg-white p-8 border border-gray-100 hover:border-[#38bdf8] transition-colors rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300">
              <h4 className="font-heading font-black text-xl mb-3 text-[#0a192f]">Biblical Teaching</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Receive practical, life-transforming teaching firmly rooted in Scripture and relevant to everyday life.</p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.3} className="bg-white p-8 border border-gray-100 hover:border-[#38bdf8] transition-colors rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300">
              <h4 className="font-heading font-black text-xl mb-3 text-[#0a192f]">Passionate Prayer</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Join a praying church that believes God hears, answers, and works powerfully in the lives of His people.</p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.4} className="bg-white p-8 border border-gray-100 hover:border-[#38bdf8] transition-colors rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300">
              <h4 className="font-heading font-black text-xl mb-3 text-[#0a192f]">Genuine Fellowship</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Build meaningful relationships with believers who will encourage, support, and walk alongside you in your faith journey.</p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.5} className="bg-white p-8 border border-gray-100 hover:border-[#38bdf8] transition-colors rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300">
              <h4 className="font-heading font-black text-xl mb-3 text-[#0a192f]">Spiritual Growth</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Grow in your understanding of God's Word, deepen your relationship with Him, and discover your purpose in His Kingdom.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 7. Our Church Family & Join Us Section */}
      <section className="section-space bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <ScrollReveal direction="left" className="space-y-8">
              <div>
                <h6 className="text-[#38bdf8] font-bold tracking-widest uppercase mb-3">OUR CHURCH FAMILY</h6>
                <h3 className="text-3xl sm:text-4xl font-black text-[#0a192f] font-heading mb-4">Everyone Is Welcome</h3>
                <p className="text-[#64748b] leading-[1.8]">
                  Faith & Fire Ministries is a church for individuals, couples, families, young adults, children, and seniors. Whether you're exploring Christianity, returning to church, or looking for a spiritual home, you'll be welcomed with love and encouraged to grow in your relationship with Jesus Christ.
                </p>
                <p className="text-[#64748b] leading-[1.8] mt-4">
                  We celebrate the diversity of God's people and believe that every person has a unique purpose and place within His Kingdom.
                </p>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <h6 className="text-[#d97706] font-bold tracking-widest uppercase mb-3">JOIN US</h6>
                <h3 className="text-2xl font-black text-[#0a192f] font-heading mb-4">Your Journey Begins Here</h3>
                <p className="text-[#64748b] leading-[1.8] mb-6">
                  No matter where you are in your faith journey, there is a place for you at Faith & Fire Ministries. We invite you to worship with us, experience God's presence, grow through His Word, and become part of a community that is passionate about knowing Christ and making Him known.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setCurrentTab && setCurrentTab("contact")} className="floens-btn">
                    <span>Plan Your Visit</span>
                  </button>
                  <button onClick={() => setCurrentTab && setCurrentTab("contact")} className="floens-btn floens-btn--border !border-[#0a192f] !text-[#0a192f]">
                    <span>Request Prayer</span>
                  </button>
                </div>
              </div>
            </ScrollReveal>
            
            {/* Right Images */}
            <ScrollReveal direction="right" className="relative h-[600px] rounded-xl overflow-hidden shadow-2xl">
              <img src="/images/Generated image 1 (14).png" alt="Church Family" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-[#0a192f]/20"></div>
              <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-sm p-6 rounded-xl border-l-4 border-[#38bdf8] shadow-2xl">
                <h4 className="font-heading font-black text-xl text-[#0a192f] mb-2">Come and discover a church where faith is strengthened...</h4>
                <p className="text-[#d97706] font-bold text-sm uppercase">Lives are transformed, and Jesus Christ is glorified.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

    </motion.div>
  );
};

// ==========================================
// 3. MINISTRIES SCREEN
// ==========================================
export const MinistriesScreen: React.FC = () => {
  const { ministries, addConnectSubmission, selectedMinistryId, setSelectedMinistryId } = useChurch();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [detailMinistry, setDetailMinistry] = useState<Ministry | null>(null);

  // Join ministry registration form states
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (selectedMinistryId) {
      const found = ministries.find((m) => m.id === selectedMinistryId && m.active);
      if (found) {
        setDetailMinistry(found);
        setJoinSuccess(false);
      }
      setSelectedMinistryId(null);
    }
  }, [selectedMinistryId, ministries, setSelectedMinistryId]);

  const activeMinistries = ministries.filter((m) => m.active !== false && !m.archived);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName || !detailMinistry) return;
    addConnectSubmission(
      "NewMember",
      joinName,
      `Requesting to join ${detailMinistry.name}.`,
      joinEmail,
      joinPhone
    );
    setJoinSuccess(true);
    setTimeout(() => {
      setJoinName("");
      setJoinEmail("");
      setJoinPhone("");
      setJoinSuccess(false);
      setDetailMinistry(null);
    }, 4000);
  };

  if (detailMinistry) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#f8fafc] pb-20">
        <PageHero
          title={detailMinistry.name}
          bgImage={detailMinistry.image}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          {/* Back button */}
          <button
            onClick={() => setDetailMinistry(null)}
            className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#64748b] hover:text-[#38bdf8] transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Ministries
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left Side Info */}
            <div className="md:col-span-8 space-y-8">
              <div className="space-y-4">
                <span className="bg-[#38bdf8] text-[#0a192f] text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-wider">
                  {detailMinistry.category} Department
                </span>
                <h3 className="text-2xl font-bold text-[#0a192f]">MISSION STATEMENT</h3>
                <p className="text-[#64748b] leading-relaxed text-lg whitespace-pre-wrap">{detailMinistry.description}</p>
              </div>

              {/* Leader Spotlight */}
              <div className="border border-slate-200 p-6 bg-white flex flex-col sm:flex-row gap-6 items-start shadow-sm mt-8">
                <img
                  src={detailMinistry.leaderPhoto}
                  alt={detailMinistry.leaderName}
                  className="w-24 h-24 rounded-full object-cover shrink-0 border-4 border-[#38bdf8]/20"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xl font-bold text-[#0a192f]">{detailMinistry.leaderName}</h4>
                    <p className="text-xs font-mono text-[#38bdf8] font-bold uppercase">{detailMinistry.leaderTitle}</p>
                  </div>
                  <p className="text-[#64748b] italic leading-relaxed">
                    "{detailMinistry.leaderQuote}"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side Schedule & Signup Form */}
            <div className="md:col-span-4 space-y-8">
              <div className="bg-[#0a192f] p-6 text-white space-y-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-3xl" />
                <h4 className="font-bold tracking-widest uppercase font-mono text-xs text-[#38bdf8] border-b border-white/10 pb-3">
                  Schedule &amp; Location
                </h4>
                <div className="space-y-4 relative z-10">
                  <div>
                    <strong className="block text-white mb-1">Regular Meeting</strong>
                    <span className="text-white/70 text-sm">{detailMinistry.meetingTime}</span>
                  </div>
                  <div>
                    <strong className="block text-white mb-1">Sanctuary Location</strong>
                    <span className="text-white/70 text-sm">{detailMinistry.location}</span>
                  </div>
                </div>
              </div>

              {/* Registration form */}
              <div className="border border-slate-200 p-6 bg-white shadow-sm space-y-5">
                <h4 className="text-lg font-bold text-[#0a192f] border-b border-slate-100 pb-3">Register Your Interest</h4>
                {joinSuccess ? (
                  <div className="text-center py-8 text-emerald-700 space-y-3">
                    <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
                    <span className="font-bold text-lg block">Request Captured!</span>
                    <p className="text-sm text-[#64748b] leading-relaxed px-4">
                      Thank you for connecting. {detailMinistry.leaderName} will reach out to schedule your integration.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[#0a192f] text-xs font-bold uppercase mb-2">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        placeholder="Samuel Molefe"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0a192f] text-xs font-bold uppercase mb-2">Email Address</label>
                      <input
                        type="email"
                        value={joinEmail}
                        onChange={(e) => setJoinEmail(e.target.value)}
                        placeholder="samuel@gmail.com"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0a192f] text-xs font-bold uppercase mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={joinPhone}
                        onChange={(e) => setJoinPhone(e.target.value)}
                        placeholder="+27 82 555 1234"
                        className="w-full"
                      />
                    </div>
                    <button
                      type="submit"
                      className="floens-btn w-full justify-center cursor-pointer mt-2"
                    >
                      <span>Submit Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <PageHero
        title="Church Ministries"
        subtitle="Find your community and run in your spiritual lane. Explore meeting times, department goals, and register to serve."
        category="DEPARTMENTS & MINISTRIES"
        bgImage="/images/Generated image 1 (5).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">DEPARTMENTS</h6>
            <h3 className="sec-title__title">Serve, Belong & Grow Together</h3>
          </div>

          {/* Ministries Grid */}
          {activeMinistries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeMinistries.map((m) => (
                <div key={m.id} className="service-card-two group">
                  <div className="service-card-two__image">
                    <img
                      src={m.image}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-[#38bdf8] text-[#0a192f] text-[10px] font-mono font-bold px-3 py-1 uppercase shadow">
                      {m.category}
                    </div>
                  </div>
                  <div className="service-card-two__content">
                    <h3 className="service-card-two__title">{m.name}</h3>
                    <p className="text-[#64748b] text-[15px] leading-relaxed mb-4 line-clamp-3">{m.description}</p>

                    <div className="flex items-center gap-2 text-xs font-medium text-[#0a192f] mb-6 pt-2 border-t border-slate-100">
                      <Clock className="w-4 h-4 text-[#38bdf8]" />
                      <span>{m.schedule}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#64748b] font-medium">Led by {m.leaderName}</span>
                      <button
                        onClick={() => {
                          setDetailMinistry(m);
                          setJoinSuccess(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="floens-btn cursor-pointer"
                      >
                        <span>Join Ministry</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#64748b] text-lg font-medium">
              No ministries are currently available. Check back soon or contact the church office for more information.
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// ==========================================
// 4. EVENTS SCREEN
// ==========================================
export const EventsScreen: React.FC = () => {
  const { events, rsvpEvent, selectedEventId, setSelectedEventId } = useChurch();
  const [activeEvent, setActiveEvent] = useState<ChurchEvent | null>(null);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpSuccessId, setRsvpSuccessId] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{ status: string; ticketId: string } | null>(null);

  useEffect(() => {
    if (selectedEventId) {
      let found = events.find((e) => e.id === selectedEventId);
      if (!found) {
        const fallbackEvents = [
          { id: "1", title: "Sunday Morning Worship Service", date: new Date().toISOString(), description: "Join us for a Spirit-filled worship experience.", image: "/images/Generated image 1 (6).png", category: "Sunday", time: "09:00 AM", venue: "Main Sanctuary" },
          { id: "2", title: "Midweek Bible Study & Prayer", date: new Date().toISOString(), description: "Deepen your understanding of God's Word.", image: "/images/Generated image 1 (12).png", category: "Midweek", time: "06:30 PM", venue: "Youth Hall" },
          { id: "3", title: "Youth Fellowship & Outreach", date: new Date().toISOString(), description: "Connecting young people with purpose and community.", image: "/images/Generated image 1 (14).png", category: "Youth", time: "04:00 PM", venue: "Community Center" },
        ];
        found = fallbackEvents.find((e) => e.id === selectedEventId) as any;
      }
      if (found) {
        setActiveEvent(found);
        setRsvpSuccess(false);
        setTicketData(null);
      }
      setSelectedEventId(null);
    }
  }, [selectedEventId, events, setSelectedEventId]);

  const handleRsvp = (id: string) => {
    rsvpEvent(id);
    setRsvpSuccessId(id);
    setTimeout(() => {
      setRsvpSuccessId(null);
    }, 4000);
  };

  if (activeEvent) {
    const isSuccess = rsvpSuccess;
    return (
      <div className="bg-[#f8fafc] min-h-screen">

        {/* Large Immersive Hero Banner */}
        <div className="relative h-[320px] sm:h-[400px] bg-[#0a192f]">
          <img
            src={activeEvent.image}
            alt={activeEvent.title}
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto text-white space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#38bdf8] text-[#0a192f] text-xs font-black px-3.5 py-1.5 uppercase font-mono">
              <Calendar className="w-4 h-4" />
              <span>
                {(() => {
                  const targetStr = activeEvent.fullDate || activeEvent.date;
                  if (!targetStr) return "";
                  const d = new Date(targetStr);
                  if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  }
                  return targetStr;
                })()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase leading-tight text-white drop-shadow-md">
              {activeEvent.title}
            </h1>
          </div>
        </div>

        {/* Back navigation header (moved below hero so hero can sit under transparent navbar) */}
        <div className="bg-[#0a192f] text-white py-4 px-6 sticky top-[90px] z-20 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <button
              onClick={() => setActiveEvent(null)}
              className="text-[#38bdf8] hover:text-white font-bold text-xs tracking-wider uppercase inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Event Calendar
            </button>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#38bdf8] bg-white/10 px-3 py-1 rounded-sm">
              {activeEvent.category} Event
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 border border-slate-200 shadow-sm border-t-4 border-t-[#38bdf8] space-y-6">
              <div>
                <h2 className="text-xs font-mono font-black tracking-widest text-[#38bdf8] uppercase mb-2">ABOUT THE EVENT</h2>
                <p className="text-sm text-[#64748b] leading-relaxed font-medium">
                  {activeEvent.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-base font-black text-[#0a192f] uppercase tracking-tight mb-4">Event Agenda &amp; Focus</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#f8fafc] border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-black">Session 1</span>
                    <h4 className="text-sm font-bold text-[#0a192f]">Apostolic Preaching &amp; Impartation</h4>
                    <p className="text-xs text-[#64748b]">Uncompromised biblical truth and spiritual laying of hands.</p>
                  </div>
                  <div className="p-4 bg-[#f8fafc] border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-black">Session 2</span>
                    <h4 className="text-sm font-bold text-[#0a192f]">Corporate Healing &amp; Altar Prayers</h4>
                    <p className="text-xs text-[#64748b]">Ministering directly to those carrying physical or mental sicknesses.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-base font-black text-[#0a192f] uppercase tracking-tight mb-3">Important Information</h3>
                <ul className="text-xs text-[#64748b] space-y-2 leading-relaxed list-disc list-inside font-medium">
                  <li>Admission is entirely free, but RSVPs are highly recommended to aid seating planning.</li>
                  <li>Children's sanctuary and secure playground available under certified supervisors.</li>
                  <li>Ample gated parking with full armed response security on site.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logistic details */}
            <div className="bg-[#0a192f] text-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[10px] border-b border-white/10 pb-3">
                Logistics &amp; Scheduling
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Start Time</h4>
                    <p className="text-xs text-white/70">{activeEvent.time}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Venue Location</h4>
                    <p className="text-xs text-white/70">{activeEvent.venue}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <a
                  href="https://maps.google.com/?q=46+Turffontein+St+Rosettenville+Johannesburg"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="floens-btn floens-btn--white w-full justify-center text-xs cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* RSVP Form */}
            <div className="bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#0a192f]">RSVP Your Attendance</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Confirm your seat today so our hospitality and prayer teams can prepare for your visit!
              </p>

              {isSuccess && ticketData ? (
                ticketData.status === "Waitlisted" ? (
                  <div className="text-center py-6 text-amber-700 space-y-2 bg-amber-50 border border-amber-200 p-4">
                    <AlertTriangle className="w-10 h-10 mx-auto text-[#38bdf8]" />
                    <span className="font-extrabold text-sm block uppercase">Added to Waitlist</span>
                    <p className="text-[10px] text-amber-600 leading-relaxed">
                      The sanctuary capacity has been reached for this event. You have been added to the waitlist.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-emerald-700 space-y-4 bg-emerald-50 border border-emerald-200 p-4">
                    <div>
                      <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                      <span className="font-extrabold text-sm block uppercase">Ticket Generated!</span>
                    </div>

                    <div className="p-3 bg-white inline-block shadow-sm border border-slate-200 mx-auto w-full flex flex-col items-center justify-center">
                      <QRCodeCanvas
                        value={JSON.stringify({ event: activeEvent.title, ticketId: ticketData.ticketId, name: rsvpName })}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#0a192f"
                        level="Q"
                        marginSize={2}
                      />
                      <span className="mt-2 text-[10px] font-mono font-bold text-[#64748b] tracking-widest">{ticketData.ticketId}</span>
                    </div>

                    <p className="text-[10px] text-emerald-700 leading-relaxed font-bold">
                      Please save this QR code or screenshot it. Show it to the ushers at the entrance.
                    </p>
                  </div>
                )
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rsvpName) return;
                    const res = rsvpEvent(activeEvent.id, rsvpName, rsvpEmail);
                    setTicketData(res);
                    setRsvpSuccess(true);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[#0a192f] font-bold uppercase mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="Samuel Molefe"
                      
                    />
                  </div>
                  <div>
                    <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      placeholder="samuel@gmail.com"
                      
                    />
                  </div>
                  <button
                    type="submit"
                    className="floens-btn w-full justify-center cursor-pointer"
                  >
                    <span>Confirm My RSVP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="block text-center text-[10px] text-[#64748b] font-mono mt-2">
                    Current RSVP count: {activeEvent.rsvpCount} / 50 Capacity
                  </span>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Upcoming Events"
        subtitle="Join us in corporate worship, intensive intercession, or deep-dive word sessions."
        category="DIARY & CALENDAR"
        bgImage="/images/Generated image 1 (6).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">CHURCH CALENDAR</h6>
            <h3 className="sec-title__title">Gathering in Unity & Power</h3>
          </div>

          {/* Announcements Section */}

          {/* Events Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.filter(e => !e.archived).map((evt) => {
              const isSuccess = rsvpSuccessId === evt.id;
              const dateParts = evt.date.split(" ");
              return (
                <div
                  key={evt.id}
                  onClick={() => setActiveEvent(evt)}
                  className="blog-card cursor-pointer"
                >
                  <div className="blog-card__image">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                    />
                    <div className="blog-card__date">
                      <span className="blog-card__date__day">{dateParts[0]}</span>
                      <span className="blog-card__date__month">{dateParts[1]}</span>
                    </div>
                  </div>
                  <div className="blog-card__content">
                    <span className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider block mb-2">
                      {evt.category} • {evt.time}
                    </span>
                    <h3 className="blog-card__title text-xl font-bold text-[#0a192f] mb-3 line-clamp-2 hover:text-[#38bdf8] transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-[#64748b] text-xs leading-relaxed line-clamp-2 mb-6">
                      {evt.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span className="truncate max-w-[140px]">{evt.venue}</span>
                      </div>
                      {isSuccess ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Reserved!
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRsvp(evt.id);
                          }}
                          className="floens-btn !py-2 !px-4 text-xs cursor-pointer"
                        >
                          <span>RSVP</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ==========================================
// 5. MEDIA/SERMONS SCREEN
// ==========================================
export const MediaScreen: React.FC = () => {
  const { videos: localFallbackVideos, churchInfo, youtubeChannels, websiteSettings } = useChurch();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<SermonVideo | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<SermonVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting and Pagination State
  const [sortOption, setSortOption] = useState<"date-desc" | "date-asc" | "title-asc" | "title-desc">("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const VIDEOS_PER_PAGE = 12;

  const categories = ["All", "Sermon", "Worship", "Testimony"];

  // Helper to generate possible YouTube RSS feed URLs from channel URL, handle, or ID
  const getPossibleRssUrls = (urlOrInput: string): string[] => {
    if (!urlOrInput) return [];
    const input = urlOrInput.trim();
    const ucMatch = input.match(/(UC[A-Za-z0-9_-]{22})/);
    if (ucMatch) {
      return [`https://www.youtube.com/feeds/videos.xml?channel_id=${ucMatch[1]}`];
    }
    const userMatch = input.match(/\/user\/([a-zA-Z0-9_-]+)/);
    if (userMatch) {
      return [`https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`];
    }
    const handleMatch = input.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];
      return [
        `https://www.youtube.com/feeds/videos.xml?user=${handle}`,
        `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`
      ];
    }
    const clean = input.replace(/https?:\/\/(www\.)?youtube\.com\/?/, "").replace(/^\//, "");
    return [
      `https://www.youtube.com/feeds/videos.xml?channel_id=${clean}`,
      `https://www.youtube.com/feeds/videos.xml?user=${clean}`
    ];
  };

  // Extract video ID from feed item
  const getYoutubeVideoId = (item: any) => {
    const guidMatch = item.guid?.match(/yt:video:(.+)/);
    if (guidMatch && guidMatch[1]) return guidMatch[1];

    const link = item.link || "";
    const regExp = /[?&]v=([^&#]+)/;
    const match = link.match(regExp);
    if (match && match[1]) return match[1];

    const shortMatch = link.match(/youtu\.be\/([^&#]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    return "";
  };

  // Intelligently parse speaker based on names found in Title & Description
  const parseSpeaker = (title: string, description: string) => {
    const combined = (title + " " + description).toLowerCase();
    if (combined.includes("sarah malaba")) return "Pastor Sarah Malaba";
    if (combined.includes("david mbeki")) return "Pastor David Mbeki";
    if (combined.includes("eric malaba") || combined.includes("apostle") || combined.includes("apostle malaba")) {
      return "Apostle Eric Malaba";
    }
    return "Apostle Eric Malaba"; // Default
  };

  // Intelligently categorize videos
  const parseCategory = (title: string, description: string): "Sermon" | "Worship" | "Testimony" => {
    const combined = (title + " " + description).toLowerCase();
    if (combined.includes("worship") || combined.includes("praise") || combined.includes("song") || combined.includes("singing") || combined.includes("music") || combined.includes("worshipping")) {
      return "Worship";
    }
    if (combined.includes("testimony") || combined.includes("testimonies") || combined.includes("my story") || combined.includes("healed") || combined.includes("delivered") || combined.includes("miracle")) {
      return "Testimony";
    }
    return "Sermon";
  };

  // Format date correctly
  const formatDateStr = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const date = new Date(dateStr.replace(/-/g, "/"));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Extract clean plain text description
  const cleanDescription = (desc: string) => {
    if (!desc) return "";
    let clean = desc.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML
    if (clean.length > 250) {
      return clean.substring(0, 247) + "...";
    }
    return clean;
  };

  // Parse series based on punctuation
  const parseSeries = (title: string) => {
    const bracketMatch = title.match(/\[(.*?)\]/);
    if (bracketMatch) return bracketMatch[1];
    const parenMatch = title.match(/\((.*?)\)/);
    if (parenMatch) return parenMatch[1];
    return "Apostolic Service";
  };

  // Fetch YouTube feed dynamically from configured channels
  useEffect(() => {
    let active = true;
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use youtubeChannels from context if defined; if array is empty (all deleted), do not pull deleted channels
        const channelsToFetch = (youtubeChannels && youtubeChannels.length > 0)
          ? youtubeChannels.map((c) => c.url)
          : (churchInfo.socials.youtube ? [churchInfo.socials.youtube] : []);

        if (channelsToFetch.length === 0) {
          if (active) {
            setYoutubeVideos([]);
            setLoading(false);
          }
          return;
        }

        const rawVideos = await fetchYouTubeFeed(
          youtubeChannels && youtubeChannels.length > 0 
            ? youtubeChannels 
            : channelsToFetch.map(url => ({ url })), 
          (import.meta as any).env.VITE_YOUTUBE_API_KEY
        );

        if (active) {
          const parsedVideos = rawVideos.map((v: any) => ({
            id: v.id,
            title: v.title,
            speaker: parseSpeaker(v.title, v.description),
            date: formatDateStr(v.pubDate),
            category: parseCategory(v.title, v.description),
            youtubeId: v.youtubeId,
            description: cleanDescription(v.description),
            series: parseSeries(v.title),
            thumbnail: v.thumbnail,
            duration: "LIVE"
          } as SermonVideo));
          
          setYoutubeVideos(parsedVideos);
        }
      } catch (err) {
        console.error("Live YouTube dynamic feed error:", err);
        if (active) {
          setError("Could not update live stream directory, showing local archives.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchVideos();
    return () => {
      active = false;
    };
  }, [churchInfo.socials.youtube, youtubeChannels]);

  const sourceVideos = youtubeVideos;

  const filteredVideos = sourceVideos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.series && v.series.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortOption === "title-asc") {
      return a.title.localeCompare(b.title);
    } else if (sortOption === "title-desc") {
      return b.title.localeCompare(a.title);
    } else if (sortOption === "date-asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else { // "date-desc"
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const totalPages = Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = sortedVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  const getCleanEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&autoplay=1&controls=0`;
  };

  return (
    <>
      <PageHero
        title="SERMONS & WORSHIP"
        subtitle="Access the undiluted Word of God. Feed your soul with our media archives, message series, and testimonies."
        category="STREAMING ALTAR"
        bgImage="/images/Generated image 1 (7).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-4 pb-16 space-y-12">

        {/* Embed Frame / Pop-up Overlay (Strictly Branded, modestbranding enabled) */}
        <AnimatePresence>
          {activeVideo && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-neutral-900 text-white rounded-lg max-w-4xl w-full overflow-hidden shadow-2xl relative"
              >
                <button
                  onClick={() => setActiveVideo(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full z-20 cursor-pointer border border-white/10"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>

                {/* Seamless Clean Video Player (No branding) */}
                <div className="aspect-video bg-black relative flex items-center justify-center">
                  <iframe
                    className="w-full h-full"
                    src={getCleanEmbedUrl(activeVideo.youtubeId)}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Video Specs (Custom First-Party styling) */}
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block font-bold">
                        Series: {activeVideo.series || "Stand-alone Message"}
                      </span>
                      <h2 className="text-2xl font-extrabold tracking-tight mt-1">{activeVideo.title}</h2>
                    </div>
                    <div className="text-right text-xs text-neutral-400 font-mono">
                      <span className="block font-semibold text-white">Preached by {activeVideo.speaker}</span>
                      <span>{activeVideo.date}</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed max-h-48 overflow-y-auto pr-2">
                    {activeVideo.description}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Search & Sort Controls */}
        <div className="max-w-4xl mx-auto bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search sermons, series, worship sessions, or speakers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-xs font-bold text-neutral-400 hover:text-neutral-700 uppercase"
              >
                Clear
              </button>
            )}
          </div>
          <div className="w-full md:w-48 shrink-0 relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full bg-white border border-neutral-200 text-sm font-bold text-neutral-700 h-[46px] px-3 pr-8 rounded appearance-none cursor-pointer outline-none focus:border-amber-400"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        {loading && youtubeVideos.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#0A192F] border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Accessing live broadcast directory...</p>
          </div>
        )}

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedVideos.map((v) => (
            <div
              key={v.id}
              onClick={() => setActiveVideo(v)}
              className="bg-[#0A192F] border border-[#0F2342]/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer  hover:-translate-y-1 hover:border-amber-400/50"
            >
              <div className="relative h-44 bg-neutral-900 overflow-hidden shrink-0">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45">
                  <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-[#0A192F] shadow">
                    <Play className="w-5 h-5 fill-purple-950 pl-0.5" />
                  </div>
                </div>

                {v.duration && (
                  <span className="absolute bottom-3 right-3 bg-neutral-950/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded tracking-widest">
                    {v.duration}
                  </span>
                )}
                <span className="absolute top-3 left-3 bg-amber-500 text-[#0A192F] text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase tracking-widest shadow-md">
                  {v.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-white">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block tracking-wider">
                    {v.series || "Stand-alone"}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug mt-1 mb-2 line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-neutral-300 text-xs leading-relaxed line-clamp-2">
                    {v.description}
                  </p>
                </div>

                <div className="border-t border-[#0F2342]/50 pt-3 flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>By {v.speaker}</span>
                  <span>{v.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && !loading && (
          <div className="py-16 text-center text-neutral-400 text-xs">
            No resources found matching your search or filters.
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-neutral-200 rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (
                  p === 1 || 
                  p === totalPages || 
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        currentPage === p 
                          ? "bg-amber-500 text-[#0A192F]" 
                          : "border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                } else if (
                  (p === currentPage - 2 && p > 1) || 
                  (p === currentPage + 2 && p < totalPages)
                ) {
                  return <span key={p} className="px-1 text-neutral-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-neutral-200 rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

// ==========================================
// 6. GIVE SCREEN
// ==========================================
export const GiveScreen: React.FC = () => {
  const { churchInfo, addDonation, bankingDetails } = useChurch();
  const [giveAmount, setGiveAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("500");
  const [giveFund, setGiveFund] = useState("Tithes & Offerings");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [giveType, setGiveType] = useState<"One-off" | "Recurring">("One-off");
  const [giveSuccess, setGiveSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Parse success URL params from PayFast redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("giving_status");
    if (status === "success") {
      const amountStr = urlParams.get("amount");
      const fund = urlParams.get("fund") || "Tithes & Offerings";
      const first = urlParams.get("first") || "Partner";
      const last = urlParams.get("last") || "";
      const emailParam = urlParams.get("email") || "";
      const typeStr = urlParams.get("type") || "One-off";

      const parsedAmount = amountStr ? parseFloat(amountStr) : 0;
      if (parsedAmount > 0) {
        addDonation(parsedAmount, fund, first, last, emailParam, typeStr as "One-off" | "Recurring");
        setGiveSuccess(true);
        setGiveAmount(parsedAmount);
        setCustomAmount(amountStr || "");
        setGiveFund(fund);
        setFirstName(first);
        setLastName(last);
        setEmail(emailParam);
        setGiveType(typeStr as "One-off" | "Recurring");

        // Clean URL params to keep the URL neat
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (status === "cancel") {
      alert("Payment was cancelled. You can try again whenever you are ready.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addDonation]);

  // generatePayFastSignature is now imported from ../lib/payfast

  const handleGiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = customAmount ? parseFloat(customAmount) : giveAmount;
    if (isNaN(finalAmt) || finalAmt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!firstName || !email) {
      alert("First name and email are required.");
      return;
    }

    const pfSettings = churchInfo.payfast || {
      merchantId: "10000100",
      merchantKey: "46f091a35581b",
      passphrase: "",
      sandbox: true
    };

    const returnUrl = `${window.location.origin}${window.location.pathname}?giving_status=success&amount=${finalAmt}&fund=${encodeURIComponent(giveFund)}&first=${encodeURIComponent(firstName)}&last=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&type=${giveType}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?giving_status=cancel`;

    const pfData: Record<string, string> = {
      merchant_id: pfSettings.merchantId,
      merchant_key: pfSettings.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: email,
      m_payment_id: `DON-${Date.now()}`,
      amount: finalAmt.toFixed(2),
      item_name: `Seed: ${giveFund}`,
      item_description: `Faith & Fire Ministries Online Giving - ${giveType}`
    };

    // Generate signature
    const signature = generatePayFastSignature(pfData, pfSettings.passphrase);
    pfData["signature"] = signature;

    // Determine post target URL
    const postUrl = pfSettings.sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Create form element
    const form = document.createElement("form");
    form.method = "POST";
    form.action = postUrl;

    for (const key in pfData) {
      if (Object.prototype.hasOwnProperty.call(pfData, key)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = pfData[key];
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const options = [100, 250, 500];

  return (
    <>
      <PageHero
        title="Sacrificial Giving"
        subtitle="Supporting the expansion of God's Kingdom in Rosettenville, JHB South and beyond. Partner with us in tithes, offerings, and missions."
        category="STREAMS OF WORSHIP"
        bgImage="/images/Generated image 1 (8).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">ONLINE GIVING</h6>
            <h3 className="sec-title__title">Partner With Us in Building God's House</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">
            {/* Left Column - Secure Giving Info */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl font-heading font-bold text-[#0a192f] tracking-tight">Secure & Direct Giving</h2>
              <p className="text-[#64748b] text-[15px] leading-relaxed">
                We utilize industry-leading encryption to ensure your financial contributions are handled with the highest level of security and integrity.
              </p>

              <div className="space-y-4 pt-2">
                {/* Mission Card */}
                <div className="bg-white border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
                  <div className="p-2 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0a192f] tracking-wider uppercase font-mono">IMPACT MISSIONS</h4>
                    <p className="text-xs text-[#64748b] leading-normal mt-1">
                      Funding local outreach and international missionary efforts.
                    </p>
                  </div>
                </div>

                {/* Legacy Card */}
                <div className="bg-white border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
                  <div className="p-2 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0a192f] tracking-wider uppercase font-mono">BUILDING LEGACY</h4>
                    <p className="text-xs text-[#64748b] leading-normal mt-1">
                      Expanding our facilities to serve the growing community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Impact Counter */}
              <div className="pt-6 border-t border-slate-200">
                <span className="text-[#38bdf8] font-extrabold text-5xl tracking-tight block">
                  12.5k
                </span>
                <span className="text-xs font-bold text-[#0a192f] tracking-widest uppercase block mt-1">
                  LIVES IMPACTED THIS YEAR
                </span>
              </div>
            </div>

            {/* Right Column - Online Giving Form */}
            <div className="lg:col-span-7 bg-[#0a192f] border border-white/10 p-6 md:p-8 text-white shadow-2xl">
              {giveSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                  <h3 className="text-2xl font-bold text-white">Thank you for your seed!</h3>
                  <p className="text-sm text-white/70 max-w-sm mx-auto">
                    Your secure donation of{" "}
                    <span className="font-bold text-[#38bdf8]">
                      R{giveAmount.toFixed(2)}
                    </span>{" "}
                    to {giveFund} has been successfully registered.
                  </p>
                  <button
                    onClick={() => setGiveSuccess(false)}
                    className="floens-btn floens-btn--white cursor-pointer"
                  >
                    <span>Make Another Donation</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGiveSubmit} className="space-y-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {step === 1 ? "Online Giving Form" : "Your Details"}
                    </h3>

                    {/* One-off / Recurring Selector (Only in Step 1) */}
                    {step === 1 && (
                      <div className="bg-white/10 p-1 flex items-center self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setGiveType("One-off")}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all cursor-pointer ${
                            giveType === "One-off"
                              ? "bg-[#38bdf8] text-[#0a192f]"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          One-off
                        </button>
                        <button
                          type="button"
                          onClick={() => setGiveType("Recurring")}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all cursor-pointer ${
                            giveType === "Recurring"
                              ? "bg-[#38bdf8] text-[#0a192f]"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          Recurring
                        </button>
                      </div>
                    )}
                  </div>

                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      {/* SELECT FUND dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                          SELECT FUND
                        </label>
                        <div className="relative">
                          <select
                            value={giveFund}
                            onChange={(e) => setGiveFund(e.target.value)}
                            className="w-full"
                          >
                            <option value="Tithes & Offerings">Tithes &amp; Offerings</option>
                            <option value="Sanctuary & Building Fund">Sanctuary &amp; Building Fund</option>
                            <option value="Missions & Outreach">Missions &amp; Outreach</option>
                            <option value="Crisis Care">Crisis Care &amp; Soup Kitchens</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-white/50 pointer-events-none" />
                        </div>
                      </div>

                      {/* SELECT AMOUNT ZAR */}
                      <div>
                        <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                          SELECT AMOUNT (ZAR)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setGiveAmount(opt);
                                setCustomAmount(opt.toString());
                              }}
                              className={`py-3 text-xs font-bold transition-all cursor-pointer ${
                                giveAmount === opt && customAmount === opt.toString()
                                  ? "bg-[#38bdf8] text-[#0a192f]"
                                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                              }`}
                            >
                              R{opt}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setGiveAmount(0);
                              setCustomAmount("");
                            }}
                            className={`py-3 text-xs font-bold transition-all cursor-pointer ${
                              !options.includes(giveAmount) || customAmount !== giveAmount.toString()
                                ? "bg-[#38bdf8] text-[#0a192f]"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            }`}
                          >
                            Other
                          </button>
                        </div>

                        <div className="flex items-center gap-2 border border-white/20 px-4 py-3 mt-3 bg-white/5 focus-within:border-[#38bdf8] transition-all">
                          <span className="text-[#38bdf8] text-xs font-bold">R</span>
                          <input
                            type="number"
                            placeholder="Enter amount..."
                            value={customAmount}
                            onChange={(e) => {
                              setCustomAmount(e.target.value);
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num)) {
                                setGiveAmount(num);
                              } else {
                                setGiveAmount(0);
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const finalAmt = customAmount ? parseFloat(customAmount) : giveAmount;
                          if (isNaN(finalAmt) || finalAmt <= 0) {
                            alert("Please enter a valid amount.");
                            return;
                          }
                          setStep(2);
                        }}
                        className="floens-btn w-full justify-center text-xs tracking-widest uppercase cursor-pointer mt-4"
                      >
                        <span>NEXT</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-md mb-2">
                        <p className="text-xs text-white/70">
                          You are giving <strong className="text-[#38bdf8]">R{customAmount ? parseFloat(customAmount).toFixed(2) : giveAmount.toFixed(2)}</strong> to <strong className="text-white">{giveFund}</strong> ({giveType}).
                        </p>
                      </div>

                      {/* PERSONAL INFO */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                            FIRST NAME *
                          </label>
                          <input
                            type="text"
                            placeholder="John"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                            LAST NAME *
                          </label>
                          <input
                            type="text"
                            placeholder="Doe"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                          EMAIL ADDRESS *
                        </label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Secure Banner */}
                      <div className="bg-white/5 border border-white/10 p-4 flex justify-between items-center mt-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white tracking-widest font-mono">
                          <Lock className="w-4 h-4 text-[#38bdf8]" />
                          <span>SECURE CARD PAYMENT</span>
                        </div>
                        <div className="flex gap-2 text-white/50">
                          <CreditCard className="w-5 h-5" />
                          <Shield className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="border border-white/20 text-white hover:bg-white/10 py-3 px-6 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer"
                        >
                          BACK
                        </button>
                        
                        {/* Submit button */}
                        <button
                          type="submit"
                          className="floens-btn flex-1 justify-center text-xs tracking-widest uppercase cursor-pointer"
                        >
                          <span>GIVE NOW</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-[10px] text-white/50 text-center block mt-3 leading-normal">
                        Faith &amp; Fire Ministries is a registered Non-Profit. All donations are tax-deductible.
                      </span>
                    </motion.div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Other Ways to Give Section */}
          <div className="pt-20">
            <div className="sec-title sec-title--center mb-12">
              <h6 className="sec-title__tagline">ALTERNATIVES</h6>
              <h3 className="sec-title__title">Other Ways to Give</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Card 1: Bank Transfer */}
              <div className="bg-[#0a192f] border border-white/10 p-6 flex flex-col justify-between items-center text-center text-white hover:-translate-y-1 transition-transform group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#0a192f] mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 font-mono">
                    BANK TRANSFER
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed mb-6">
                    Direct EFT using our corporate banking details for monthly commitments.
                  </p>
                </div>

                <div className="w-full bg-white/5 p-4 text-left text-[11px] font-mono text-white/70 space-y-1.5 border border-white/10">
                  <div>BANK: <span className="font-bold text-white">{bankingDetails?.bankName || "First National Bank"}</span></div>
                  <div>ACCOUNT NAME: <span className="font-bold text-white">{bankingDetails?.accountName || "Faith & Fire Ministries"}</span></div>
                  <div>ACC NUMBER: <span className="font-bold text-white">{bankingDetails?.accountNumber || "623 456 789 01"}</span></div>
                  <div>ACCOUNT TYPE: <span className="font-bold text-white">{bankingDetails?.accountType || "Cheque"}</span></div>
                  <div>BRANCH CODE: <span className="font-bold text-white">{bankingDetails?.branchCode || "250655"}</span></div>
                  {bankingDetails?.swiftCode && (
                    <div>SWIFT / BIC: <span className="font-bold text-white">{bankingDetails.swiftCode}</span></div>
                  )}
                  {bankingDetails?.referenceFormat && (
                    <div>REFERENCE: <span className="font-bold text-[#38bdf8]">{bankingDetails.referenceFormat}</span></div>
                  )}
                </div>
              </div>

              {/* Card 2: SnapScan / Zapper */}
              <div className="bg-[#0a192f] border border-white/10 p-6 flex flex-col justify-between items-center text-center text-white hover:-translate-y-1 transition-transform group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#0a192f] mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 font-mono">
                    SNAPSCAN / ZAPPER
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed mb-6">
                    Scan to give instantly from your mobile device during service or at home.
                  </p>
                </div>

                <div className="w-28 h-28 border border-white/10 p-2 flex items-center justify-center bg-white">
                  <QrCode className="text-[#0a192f] w-20 h-20" />
                </div>
              </div>

              {/* Card 3: In Person */}
              <div className="bg-[#0a192f] border border-white/10 p-6 flex flex-col justify-between items-center text-center text-white hover:-translate-y-1 transition-transform group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#0a192f] mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 font-mono">
                    IN PERSON
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed mb-12">
                    Visit our Information Desk at any of our physical campuses during service times.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById("footer-navigation") || document.body;
                    el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="floens-btn floens-btn--border !border-[#38bdf8] !text-[#38bdf8] text-xs cursor-pointer"
                >
                  <span>Find a Campus</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export const ContactScreen: React.FC = () => {
  const { churchInfo, addConnectSubmission } = useChurch();

  // Selected module tab: 'appointment' | 'prayer' | 'counselling' | 'new-members' | 'new-converts'
  const [activeTab, setActiveTab] = useState<string>("appointment");
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Check URL hash/query on load
  useEffect(() => {
    const checkModuleFromHash = () => {
      const hash = window.location.hash;
      if (hash.includes("module=")) {
        const mod = hash.split("module=")[1]?.split("&")[0];
        if (mod && ["appointment", "prayer", "counselling", "new-members", "new-converts", "decision"].includes(mod)) {
          setActiveTab(mod === "decision" ? "new-converts" : mod);
        }
      }
    };

    checkModuleFromHash();
    window.addEventListener("hashchange", checkModuleFromHash);
    return () => window.removeEventListener("hashchange", checkModuleFromHash);
  }, []);

  // Form field states
  const [appttName, setAppttName] = useState("");
  const [appttEmail, setAppttEmail] = useState("");
  const [appttPhone, setAppttPhone] = useState("");
  const [appttMinister, setAppttMinister] = useState("Pastoral Care Office");
  const [appttType, setAppttType] = useState("Pastoral Consultation & Guidance");
  const [appttFormat, setAppttFormat] = useState("In-Person (Rosettenville Sanctuary)");
  const [appttDate, setAppttDate] = useState("");
  const [appttTime, setAppttTime] = useState("10:00 AM");
  const [appttNotes, setAppttNotes] = useState("");

  const [prayerName, setPrayerName] = useState("");
  const [prayerEmail, setPrayerEmail] = useState("");
  const [prayerPhone, setPrayerPhone] = useState("");
  const [prayerConfidentiality, setPrayerConfidentiality] = useState("Pastoral Team Only");
  const [prayerCategory, setPrayerCategory] = useState("Healing & Health");
  const [isEmergency, setIsEmergency] = useState(false);
  const [prayerNotes, setPrayerNotes] = useState("");

  const [counselName, setCounselName] = useState("");
  const [counselEmail, setCounselEmail] = useState("");
  const [counselPhone, setCounselPhone] = useState("");
  const [counselAge, setCounselAge] = useState("26-35");
  const [counselFocus, setCounselFocus] = useState("Individual & Emotional Support");
  const [counselGender, setCounselGender] = useState("No Preference");
  const [priorCounsel, setPriorCounsel] = useState("No");
  const [urgentCrisis, setUrgentCrisis] = useState(false);
  const [counselNotes, setCounselNotes] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberSuburb, setMemberSuburb] = useState("");
  const [howHeard, setHowHeard] = useState("First-Time Visitor");
  const [visitDate, setVisitDate] = useState("");
  const [ministryInterest, setMinistryInterest] = useState("Worship & Choir");
  const [cellGroupInterest, setCellGroupInterest] = useState("Yes, send midweek cell group details");

  const [decName, setDecName] = useState("");
  const [decEmail, setDecEmail] = useState("");
  const [decPhone, setDecPhone] = useState("");
  const [decSuburb, setDecSuburb] = useState("");
  const [decType, setDecType] = useState("Accepted Jesus Christ as Personal Lord & Savior");
  const [decCallReq, setDecCallReq] = useState("Yes, please call to pray with me");
  const [decContactTime, setDecContactTime] = useState("Morning (09:00 - 12:00)");
  const [decNotes, setDecNotes] = useState("");

  const tabList = [
    { id: "appointment", label: "Appointment Forms" },
    { id: "prayer", label: "Prayer Requests" },
    { id: "counselling", label: "Counselling" },
    { id: "new-members", label: "New Members" },
    { id: "new-converts", label: "New Converts" }
  ];

  const currentTabObj = tabList.find(t => t.id === activeTab) || tabList[0];
  const shareableUrl = `${window.location.origin}/#contact?module=${activeTab}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = "REF-" + Math.floor(100000 + Math.random() * 900000);

    let summary = "";
    let name = "";
    let email = "";
    let phone = "";
    let typeTag: "Care" | "Prayer" | "Testimony" | "Salvations" = "Care";

    if (activeTab === "appointment") {
      name = appttName; email = appttEmail; phone = appttPhone;
      typeTag = "Care";
      summary = `APPOINTMENT: Minister=${appttMinister} | Type=${appttType} | Format=${appttFormat} | Date=${appttDate} ${appttTime} | Notes: ${appttNotes}`;
    } else if (activeTab === "prayer") {
      name = prayerName; email = prayerEmail; phone = prayerPhone;
      typeTag = "Prayer";
      summary = `PRAYER REQUEST: Category=${prayerCategory} | Confidentiality=${prayerConfidentiality} | Emergency=${isEmergency ? "YES" : "NO"} | Notes: ${prayerNotes}`;
    } else if (activeTab === "counselling") {
      name = counselName; email = counselEmail; phone = counselPhone;
      typeTag = "Care";
      summary = `COUNSELLING: Focus=${counselFocus} | Age=${counselAge} | GenderPref=${counselGender} | Prior=${priorCounsel} | Crisis=${urgentCrisis ? "YES" : "NO"} | Notes: ${counselNotes}`;
    } else if (activeTab === "new-members") {
      name = memberName; email = memberEmail; phone = memberPhone;
      typeTag = "Care";
      summary = `NEW MEMBER: Suburb=${memberSuburb} | HowHeard=${howHeard} | FirstVisit=${visitDate} | MinistryPref=${ministryInterest} | CellGroup=${cellGroupInterest}`;
    } else if (activeTab === "new-converts") {
      name = decName; email = decEmail; phone = decPhone;
      typeTag = "Salvations";
      summary = `NEW CONVERT DECISION: Decision=${decType} | Suburb=${decSuburb} | PastoralCall=${decCallReq} | PreferredTime=${decContactTime} | Notes: ${decNotes}`;
    }

    addConnectSubmission(typeTag, name, summary, email, phone);
    setSubmittedRef(refCode);
  };

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Home > Contact Us"
        category="DIRECT MINISTRY CONNECT"
        bgImage="/images/Generated image 1 (9).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="section-space bg-[#f8fafc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          <div className="sec-title sec-title--center mb-16">
            <h6 className="sec-title__tagline">PASTORAL CARE & CONNECT</h6>
            <h3 className="sec-title__title">Get In Touch With Our Church Team</h3>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* STATIC SIDEBAR: ADDRESS & CONTACT COORDINATES */}
            <div className="lg:col-span-4 space-y-6">
              <div className="contact-one__info">
                <div>
                  <span className="text-[10px] font-mono text-[#38bdf8] font-bold uppercase tracking-widest block">
                    MAIN CAMPUS HEADQUARTERS
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                    Sanctuary Coordinates
                  </h3>
                </div>

                <div className="space-y-5 pt-4 border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-white block text-sm">Rosettenville Sanctuary</strong>
                      <span className="text-white/70 block text-xs leading-relaxed">{churchInfo.address}, Johannesburg South</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#38bdf8] shrink-0" />
                    <div>
                      <span className="text-white/50 block text-[10px] uppercase font-mono">Pastoral Line</span>
                      <span className="text-white font-bold font-mono">{churchInfo.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#38bdf8] shrink-0" />
                    <div>
                      <span className="text-white/50 block text-[10px] uppercase font-mono">General Email</span>
                      <span className="text-white font-medium font-mono break-all">{churchInfo.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white/50 block text-[10px] uppercase font-mono">Office Operating Hours</span>
                      <span className="text-white/80 block text-xs">Tue - Fri: 08:30 AM - 04:30 PM</span>
                      <span className="text-[#38bdf8] block font-bold text-xs mt-0.5">Sun Service: 09:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="border border-slate-200 overflow-hidden h-56 bg-slate-100 relative shadow-md">
                <iframe
                  className="absolute inset-0 w-full h-full border-0"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3578.11326466904!2d28.051939!3d-26.2415177!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950ec469e3a6c9%3A0xe54e19036c1e550c!2s46%20Turffontein%20St%2C%20Rosettenville%2C%20Johannesburg%20South%2C%202190%2C%20South%20Africa!5e0!3m2!1sen!2sus!4v1684534827101!5m2!1sen!2sus"
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Faith & Fire Sanctuary Map"
                />
              </div>
            </div>

            {/* DYNAMIC SIDE: TAB BUTTONS, QUESTIONNAIRE FORM */}
            <div className="lg:col-span-8 space-y-6">

              {/* MODULE TABS */}
              <div className="bg-[#0a192f] p-2 border border-white/10 shadow-xl overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 min-w-max">
                  {tabList.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSubmittedRef(null);
                          window.location.hash = `contact?module=${tab.id}`;
                        }}
                        className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${isActive
                          ? "bg-[#38bdf8] text-[#0a192f]"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                      >
                        <span className="uppercase tracking-wider font-sans">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QUESTIONNAIRE FORM PANEL */}
              <div className="bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">

                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-mono text-[#38bdf8] font-bold uppercase tracking-widest block">
                    PASTORAL FORM PORTAL
                  </span>
                  <h2 className="text-2xl font-bold text-[#0a192f] tracking-tight uppercase mt-1">
                    {currentTabObj.label} Questionnaire
                  </h2>
                </div>

                {submittedRef ? (
                  <div className="text-center py-10 space-y-4 bg-emerald-50 border border-emerald-200 p-8">
                    <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
                    <h3 className="text-xl font-bold text-[#0a192f] uppercase tracking-tight">Submission Received!</h3>
                    <p className="text-xs text-[#64748b] max-w-md mx-auto leading-relaxed">
                      Your <strong>{currentTabObj.label}</strong> details have been logged in our system.
                    </p>
                    <div className="bg-white p-3 border border-emerald-200 inline-block text-xs font-mono font-bold text-[#0a192f]">
                      REF CODE: <span className="text-[#38bdf8]">{submittedRef}</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSubmittedRef(null)}
                        className="floens-btn cursor-pointer"
                      >
                        <span>Submit Another Entry</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">

                    {/* 1. APPOINTMENT FORMS */}
                    {activeTab === "appointment" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={appttName}
                              onChange={(e) => setAppttName(e.target.value)}
                              placeholder="Samuel Khumalo"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={appttEmail}
                              onChange={(e) => setAppttEmail(e.target.value)}
                              placeholder="samuel@example.com"
                              
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Phone / WhatsApp *</label>
                            <input
                              type="tel"
                              required
                              value={appttPhone}
                              onChange={(e) => setAppttPhone(e.target.value)}
                              placeholder="+27 82 123 4567"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Target Office</label>
                            <select
                              value={appttMinister}
                              onChange={(e) => setAppttMinister(e.target.value)}
                              
                            >
                              <option value="Senior Pastor Office">Senior Pastor Office</option>
                              <option value="Pastoral Care Office">Pastoral Care &amp; Intercession Team</option>
                              <option value="Pre-Marital Counselor">Pre-Marital &amp; Family Minister</option>
                              <option value="Youth & Campus Lead">Youth &amp; Young Adults Director</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#0a192f] font-bold uppercase mb-1">Context Notes *</label>
                          <textarea
                            rows={4}
                            required
                            value={appttNotes}
                            onChange={(e) => setAppttNotes(e.target.value)}
                            placeholder="Describe the purpose of this appointment..."
                            
                          />
                        </div>
                      </>
                    )}

                    {/* 2. PRAYER REQUESTS */}
                    {activeTab === "prayer" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Your Name *</label>
                            <input
                              type="text"
                              required
                              value={prayerName}
                              onChange={(e) => setPrayerName(e.target.value)}
                              placeholder="Nomsa Mbeki"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={prayerEmail}
                              onChange={(e) => setPrayerEmail(e.target.value)}
                              placeholder="nomsa@example.com"
                              
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#0a192f] font-bold uppercase mb-1">Detailed Prayer Request *</label>
                          <textarea
                            rows={4}
                            required
                            value={prayerNotes}
                            onChange={(e) => setPrayerNotes(e.target.value)}
                            placeholder="Describe what you are trusting God for..."
                            
                          />
                        </div>
                      </>
                    )}

                    {/* 3. COUNSELLING */}
                    {activeTab === "counselling" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Your Name *</label>
                            <input
                              type="text"
                              required
                              value={counselName}
                              onChange={(e) => setCounselName(e.target.value)}
                              placeholder="David Ndlovu"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={counselEmail}
                              onChange={(e) => setCounselEmail(e.target.value)}
                              placeholder="david@example.com"
                              
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#0a192f] font-bold uppercase mb-1">Background / Needs *</label>
                          <textarea
                            rows={4}
                            required
                            value={counselNotes}
                            onChange={(e) => setCounselNotes(e.target.value)}
                            placeholder="Describe your situation in confidence..."
                            
                          />
                        </div>
                      </>
                    )}

                    {/* 4. NEW MEMBERS */}
                    {activeTab === "new-members" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={memberName}
                              onChange={(e) => setMemberName(e.target.value)}
                              placeholder="Thabo Molefe"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              placeholder="thabo@example.com"
                              
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Phone / WhatsApp *</label>
                            <input
                              type="tel"
                              required
                              value={memberPhone}
                              onChange={(e) => setMemberPhone(e.target.value)}
                              placeholder="+27 82 888 9999"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Suburb / Area *</label>
                            <input
                              type="text"
                              required
                              value={memberSuburb}
                              onChange={(e) => setMemberSuburb(e.target.value)}
                              placeholder="Rosettenville"
                              
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* 5. NEW CONVERTS */}
                    {activeTab === "new-converts" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Your Name *</label>
                            <input
                              type="text"
                              required
                              value={decName}
                              onChange={(e) => setDecName(e.target.value)}
                              placeholder="Blessing Zungu"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={decEmail}
                              onChange={(e) => setDecEmail(e.target.value)}
                              placeholder="blessing@example.com"
                              
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Phone / WhatsApp *</label>
                            <input
                              type="tel"
                              required
                              value={decPhone}
                              onChange={(e) => setDecPhone(e.target.value)}
                              placeholder="+27 83 555 1234"
                              
                            />
                          </div>
                          <div>
                            <label className="block text-[#0a192f] font-bold uppercase mb-1">Suburb / City *</label>
                            <input
                              type="text"
                              required
                              value={decSuburb}
                              onChange={(e) => setDecSuburb(e.target.value)}
                              placeholder="Johannesburg South"
                              
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#0a192f] font-bold uppercase mb-1">Personal Notes</label>
                          <textarea
                            rows={3}
                            value={decNotes}
                            onChange={(e) => setDecNotes(e.target.value)}
                            placeholder="Share a short note..."
                            
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="floens-btn w-full justify-center text-xs tracking-widest uppercase cursor-pointer mt-4"
                    >
                      <span>Submit Form</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* SHARE CARD */}
              <div className="bg-[#0a192f] text-white p-6 border border-white/10 text-center space-y-4">
                <span className="text-[10px] font-mono text-[#38bdf8] font-bold uppercase tracking-widest block">
                  SHARE FORM
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">
                  Share {currentTabObj.label} Form
                </h3>

                <div className="space-y-3">
                  <div className="bg-white/10 p-2.5 text-[10px] font-mono text-[#38bdf8] truncate">
                    {shareableUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="floens-btn floens-btn--white w-full justify-center text-xs cursor-pointer"
                  >
                    <span>{copiedLink ? "Copied Share Link!" : "Copy Share Link"}</span>
                  </button>
                </div>
              </div>

            </div>

          </section>
        </div>
      </motion.div>
    </>
  );
};

// ==========================================
// 8. MEMBER QR CHECK-IN SCREEN
// ==========================================
export const QRCheckInScreen: React.FC = () => {
  const { checkInMember, members } = useChurch();
  const [selectedService, setSelectedService] = useState("Sunday Glory Service (09:00 AM)");
  const [memberCredential, setMemberCredential] = useState("");
  const [checkInResponse, setCheckInResponse] = useState("");
  const [showQrScan, setShowQrScan] = useState(false);
  const [simulatedScannedMember, setSimulatedScannedMember] = useState<any>(null);

  // Service QR Code data URL state
  const [serviceQrDataUrl, setServiceQrDataUrl] = useState<string>("");
  const [guestQrDataUrl, setGuestQrDataUrl] = useState<string>("");
  const [digitalPass, setDigitalPass] = useState<any | null>(null);
  const [passQrUrl, setPassQrUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code for the selected service
    const servicePayload = JSON.stringify({
      org: "Faith & Fire Ministries",
      service: selectedService,
      code: "FFM_" + selectedService.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase(),
      timestamp: new Date().toISOString()
    });

    QRCode.toDataURL(servicePayload, { margin: 1, width: 260, color: { dark: "#0A192F", light: "#ffffff" } })
      .then((url) => setServiceQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));

    // Generate Guest check-in URL QR code
    const guestUrl = `${window.location.origin}${window.location.pathname}#guest-check-in`;
    QRCode.toDataURL(guestUrl, { margin: 1, width: 260, color: { dark: "#ea580c", light: "#ffffff" } })
      .then((url) => setGuestQrDataUrl(url))
      .catch((err) => console.error("Guest QR Error:", err));
  }, [selectedService]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCredential) return;

    const resp = checkInMember(memberCredential.trim(), selectedService);
    setCheckInResponse(resp);

    if (!resp.startsWith("Error")) {
      // Find or create member pass payload
      const matchedMember = members.find(
        (m) =>
          m.email.toLowerCase() === memberCredential.trim().toLowerCase() ||
          m.phone.replace(/\s+/g, "") === memberCredential.trim().replace(/\s+/g, "") ||
          m.id === memberCredential.trim()
      );

      const passData = {
        passId: "FFM-PASS-" + Math.floor(100000 + Math.random() * 900000),
        memberName: matchedMember ? `${matchedMember.firstName} ${matchedMember.lastName}` : memberCredential,
        service: selectedService,
        date: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
        time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
        campus: "Rosettenville Main Sanctuary"
      };

      setDigitalPass(passData);
      try {
        const qrUrl = await QRCode.toDataURL(JSON.stringify(passData), { width: 220, color: { dark: "#0A192F", light: "#ffffff" } });
        setPassQrUrl(qrUrl);
      } catch (err) {
        console.error("Pass QR Generation Error:", err);
      }
    }

    setTimeout(() => {
      setCheckInResponse("");
      setMemberCredential("");
    }, 6000);
  };

  const handleSimulateQr = async (member: any) => {
    setSimulatedScannedMember(member);
    setShowQrScan(true);
    setCheckInResponse("Scanning member QR card...");

    setTimeout(async () => {
      const resp = checkInMember(member.id, selectedService);
      setCheckInResponse(resp);
      setShowQrScan(false);
      setSimulatedScannedMember(null);

      const passData = {
        passId: "FFM-PASS-" + Math.floor(100000 + Math.random() * 900000),
        memberName: `${member.firstName} ${member.lastName}`,
        service: selectedService,
        date: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
        time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
        campus: "Rosettenville Main Sanctuary"
      };

      setDigitalPass(passData);
      try {
        const qrUrl = await QRCode.toDataURL(JSON.stringify(passData), { width: 220, color: { dark: "#0A192F", light: "#ffffff" } });
        setPassQrUrl(qrUrl);
      } catch (err) {
        console.error("Pass QR Generation Error:", err);
      }
    }, 2000);
  };

  const handleScanServiceQr = () => {
    setShowQrScan(true);
    setCheckInResponse("Scanning Service QR Code...");
    setTimeout(() => {
      setShowQrScan(false);
      setCheckInResponse(`✓ Service QR Verified for: ${selectedService}. Please confirm your member name or ID below.`);
    }, 1800);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-white mx-auto shadow border border-neutral-800">
          <QrCode className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
        <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest block">ATTENDANCE LOG</span>
        <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight font-sans">SERVICE QR CHECK-IN</h1>
        <p className="text-neutral-500 text-xs max-w-lg mx-auto">
          Scan the unique service QR code displayed at the Rosettenville sanctuary door or enter your membership ID below to record your attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Service Selection & Dynamic Service QR Display */}
        <div className="md:col-span-5 bg-white p-6 border border-neutral-200/70 rounded-xl shadow-xs space-y-5 text-center">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-1">
              CAMPUS SERVICE SESSION
            </span>
            <label className="block text-xs font-bold text-[#0A192F] uppercase tracking-wider mb-2">
              Select Active Service:
            </label>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setDigitalPass(null);
              }}
              className="w-full"
            >
              <option>Sunday Glory Service (09:00 AM)</option>
              <option>Wednesday Midweek Bible Study (18:00 PM)</option>
              <option>Friday Night of Fire Revival (19:00 PM)</option>
              <option>Special Altar Consecration Night</option>
            </select>
          </div>

          {/* Service QR Code Display Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-b from-purple-950 to-slate-900 rounded-xl text-white space-y-3 shadow-md border border-[#0F2342]/40">
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 border-b border-white/10 pb-2">
                <span>MEMBER CHECK-IN QR</span>
                <span className="bg-amber-500 text-[#0A192F] font-black px-1.5 py-0.5 rounded uppercase">LIVE</span>
              </div>

              {serviceQrDataUrl ? (
                <div className="p-3 bg-white rounded-lg inline-block shadow-inner mx-auto w-full flex justify-center">
                  <img src={serviceQrDataUrl} alt="Service QR Code" className="w-32 h-32 sm:w-44 sm:h-44 object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 bg-neutral-800 rounded mx-auto flex items-center justify-center animate-pulse">
                  <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Loading...</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gradient-to-b from-orange-600 to-orange-800 rounded-xl text-white space-y-3 shadow-md border border-amber-400/40">
              <div className="flex items-center justify-between text-[10px] font-mono text-white border-b border-white/20 pb-2">
                <span>GUEST CHECK-IN QR</span>
                <span className="bg-white text-orange-800 font-black px-1.5 py-0.5 rounded uppercase">SCAN ME</span>
              </div>

              {guestQrDataUrl ? (
                <div className="p-3 bg-white rounded-lg inline-block shadow-inner mx-auto w-full flex justify-center">
                  <img src={guestQrDataUrl} alt="Guest Check-In QR" className="w-32 h-32 sm:w-44 sm:h-44 object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 bg-orange-900/50 rounded mx-auto flex items-center justify-center animate-pulse">
                  <span className="text-xs text-orange-300 font-bold uppercase tracking-wider">Loading...</span>
                </div>
              )}
            </div>
          </div>


          <div>
            <strong className="block text-xs font-bold text-white tracking-wide">{selectedService}</strong>
            <span className="block text-[10px] text-neutral-300 font-mono mt-0.5">Scan to log attendance</span>
          </div>

          <button
            onClick={handleScanServiceQr}
            className="btn-primary-sm w-full"
          >
            📷 SCAN SERVICE QR WITH CAMERA
          </button>
        </div>

        {/* Right Column: Check-in Form & Scanner Simulator */}
        <div className="md:col-span-7 bg-white p-6 border border-neutral-200/70 rounded-xl shadow-xs space-y-6">
          {showQrScan ? (
            <div className="border border-neutral-200 p-8 rounded-xl bg-neutral-50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-amber-400 rounded-lg relative overflow-hidden flex items-center justify-center shadow">
                <QrCode className="w-32 h-32 text-[#0F2342]" />
                <div className="absolute inset-x-0 h-0.5 bg-amber-500 animate-[bounce_2s_infinite] shadow-[0_0_8px_rgba(249,115,22,1)]" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#0F2342] font-bold block animate-pulse">
                  SIMULATING CAMERA SCAN...
                </span>
                <span className="text-[10px] text-neutral-500">
                  {simulatedScannedMember ? `Scanning card for ${simulatedScannedMember.firstName} ${simulatedScannedMember.lastName}` : "Scanning active service QR payload..."}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#0A192F] uppercase tracking-tight">Member Check-In Form</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Provide your email address, mobile number, or membership ID to log attendance for this service.
                </p>
              </div>

              {/* Manual Form */}
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Member Email or Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. grace.nkosi@gmail.com or +27 82 555 0123"
                    value={memberCredential}
                    onChange={(e) => setMemberCredential(e.target.value)}
                    className="w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary-sm w-full"
                >
                  CONFIRM &amp; LOG ATTENDANCE
                </button>
              </form>

              {/* QR Scan Simulator Buttons */}
              <div className="border-t border-neutral-100 pt-4 space-y-3">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Quick Member Card Simulator:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSimulateQr(m)}
                      className="text-left p-2.5 rounded-lg bg-neutral-50 hover:bg-orange-50 border border-neutral-200/80 transition-colors text-xs flex justify-between items-center group cursor-pointer"
                    >
                      <div>
                        <strong className="block text-[#0A192F] font-semibold text-[11px]">
                          {m.firstName} {m.lastName}
                        </strong>
                        <span className="block text-[9px] text-neutral-500 font-mono">{m.suburb}</span>
                      </div>
                      <QrCode className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status Prompt */}
          {checkInResponse && (
            <div
              className={`p-3 rounded-lg text-xs text-center font-bold tracking-wide shadow-xs ${checkInResponse.startsWith("Error")
                ? "bg-red-50 text-red-800 border border-red-100"
                : checkInResponse.startsWith("Scanning")
                  ? "bg-neutral-100 text-neutral-700 border border-neutral-200 animate-pulse"
                  : "bg-green-50 text-green-800 border border-green-100"
                }`}
            >
              {checkInResponse}
            </div>
          )}

          {/* Digital Attendance Ticket Pass Modal */}
          {digitalPass && passQrUrl && (
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl space-y-3 shadow-xs">
              <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                <span className="text-[10px] font-mono font-bold text-orange-800 uppercase">
                  ATTENDANCE PASS VERIFIED
                </span>
                <span className="text-[10px] font-mono font-bold text-[#0F2342] bg-white px-2 py-0.5 rounded border border-orange-200">
                  {digitalPass.passId}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img src={passQrUrl} alt="Attendance Pass QR" className="w-20 h-20 bg-white p-1 rounded border border-orange-200 shrink-0" />
                <div className="text-xs text-[#0A192F] space-y-1">
                  <h4 className="font-extrabold text-sm text-[#0A192F]">{digitalPass.memberName}</h4>
                  <p className="text-[11px] font-bold text-orange-700">{digitalPass.service}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{digitalPass.date} • {digitalPass.time}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">{digitalPass.campus}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const GuestCheckInScreen: React.FC = () => {
  const { addAuditLog } = useChurch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate check-in
    addAuditLog("GUEST_CHECK_IN", "ATTENDANCE", `${firstName} ${lastName}`, "SUCCESS");
    setSuccess(true);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-amber-500 mx-auto shadow-inner">
          <QrCode className="w-6 h-6" />
        </div>
        <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest block">WELCOME GUEST</span>
        <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight font-sans">GUEST QR CHECK-IN</h1>
        <p className="text-neutral-500 text-xs max-w-lg mx-auto">
          Welcome to Faith & Fire Ministries! Please provide your details below so we can record your attendance and connect with you.
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 p-8 rounded-xl border border-green-100 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-green-900">You're Checked In!</h2>
          <p className="text-sm text-green-800">
            Thank you for joining us today, {firstName}. We're so glad you're here!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-xs border border-neutral-200/70 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">First Name *</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Last Name *</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Mobile Phone *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">WhatsApp Number (Optional)</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Email Address *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            <Check className="w-4 h-4" /> COMPLETE CHECK-IN
          </button>
        </form>
      )}
    </motion.div>
  );
};

export const BecomeMemberScreen: React.FC = () => {
  const { addMember, ministries } = useChurch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [memberId, setMemberId] = useState("");

  const handleToggleMinistry = (minName: string) => {
    setSelectedMinistries((prev) =>
      prev.includes(minName) ? prev.filter((name) => name !== minName) : [...prev, minName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;

    const generatedId = "m_" + Date.now();
    setMemberId(generatedId);

    addMember(firstName, lastName, email, phone, suburb || "Rosettenville, JHB", selectedMinistries);
    setSuccess(true);
  };

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSuburb("");
    setSelectedMinistries([]);
    setSuccess(false);
  };

  return (
    <>
      <PageHero
        title="Become a Member"
        subtitle="Step into the covenant family of Faith & Fire Ministries Johannesburg and discover your lane of active discipleship."
        bgImage="/images/Generated image 1 (10).png"
      />
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest block">JOIN THE FAMILY</span>
          <h2 className="text-3xl font-black text-[#0A192F] leading-tight uppercase tracking-tight">MEMBERSHIP REGISTRY FORM</h2>
          <p className="text-neutral-500 text-xs max-w-lg mx-auto">
            We are dedicated to preparing holy disciples of Christ. Please complete the details below to register as a covenant partner and member of the local sanctuary.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-xl border border-neutral-200/80 shadow-2xl space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 font-black" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0A192F] uppercase">CONGRATULATIONS &amp; WELCOME!</h3>
              <p className="text-xs text-neutral-500">
                You have been registered successfully as a covenant member of Faith &amp; Fire Ministries Johannesburg South.
              </p>
            </div>

            {/* Simulated Membership QR Badge Card */}
            <div className="max-w-xs mx-auto p-4 bg-[#0A192F] text-white rounded-lg border border-[#17325B] shadow-xl space-y-4 text-left font-mono relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start border-b border-[#0F2342] pb-2">
                <div>
                  <span className="block font-sans font-extrabold text-sm uppercase tracking-tight text-amber-400">FAITH &amp; FIRE</span>
                  <span className="block text-[8px] font-sans font-bold text-neutral-400 uppercase tracking-widest">COVENANT DISCIPLE</span>
                </div>
                <Flame className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-sky-200 py-1">
                <div>
                  <span className="block text-[7px] text-neutral-400 uppercase">MEMBER NAME</span>
                  <span className="block font-bold truncate text-white">{firstName} {lastName}</span>
                </div>
                <div>
                  <span className="block text-[7px] text-neutral-400 uppercase">PORT CARD ID</span>
                  <span className="block font-mono font-bold text-white uppercase">{memberId.substring(0, 10)}</span>
                </div>
                <div>
                  <span className="block text-[7px] text-neutral-400 uppercase">SUBURB CAMPUS</span>
                  <span className="block font-bold text-white">{suburb || "Rosettenville, JHB"}</span>
                </div>
                <div>
                  <span className="block text-[7px] text-neutral-400 uppercase">STATUS COVENANT</span>
                  <span className="block font-bold text-amber-400 uppercase">ACTIVE DISCIPLE</span>
                </div>
              </div>
              <div className="border-t border-[#0F2342] pt-2 flex items-center justify-between gap-4">
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center p-1 shrink-0 shadow-inner">
                  <QrCode className="w-full h-full text-[#0A192F]" />
                </div>
                <p className="text-[7px] text-neutral-400 leading-normal font-sans">
                  Show this QR code or mention your ID to the sanctuary check-in coordinators when logging Sunday service attendance.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="btn-primary-sm"
            >
              REGISTER ANOTHER MEMBER
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-100 shadow-sm space-y-6 text-xs">
            {/* Primary Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Molefe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. samuel.molefe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +27 72 999 8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase mb-1">Home Suburb/Location</label>
              <input
                type="text"
                placeholder="e.g. Rosettenville, JHB South"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full"
              />
              <span className="block text-[10px] text-neutral-400 mt-1 leading-normal">
                Let us know where you live so we can recommend the nearest home cell or transport hub.
              </span>
            </div>

            {/* Interest Area Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="block text-neutral-700 font-extrabold uppercase mb-1">
                Area of Service &amp; Ministry Interests
              </label>
              <p className="text-[10px] text-neutral-500 pb-2">
                Select any departments or ministries you feel called to serve inside Faith &amp; Fire:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ministries.map((min) => {
                  const isChecked = selectedMinistries.includes(min.name);
                  return (
                    <label
                      key={min.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${isChecked
                        ? "bg-purple-50 border-sky-200"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMinistry(min.name)}
                        className="w-4 h-4"
                      />
                      <div>
                        <strong className="block text-[#0A192F] font-bold text-[11px] uppercase">
                          {min.name}
                        </strong>
                        <span className="block text-[9px] text-neutral-400 leading-normal">{min.blurb}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
            >
              SUBMIT MEMBERSHIP REGISTRATION
            </button>
          </form>
        )}
      </motion.div>
    </>
  );
};

// ==========================================
// 12. PLAN YOUR VISIT SCREEN
// ==========================================
export const PlanYourVisitScreen: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { addConnectSubmission, churchInfo } = useChurch();
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [numAdults, setNumAdults] = useState("1");
  const [numKids, setNumKids] = useState("0");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorEmail) return;

    const notes = `PLAN YOUR VISIT: Date=${serviceDate} | Adults=${numAdults} | Kids=${numKids} | Notes: ${specialNeeds}`;
    addConnectSubmission("Care", visitorName, notes, visitorEmail, visitorPhone);
    setIsSubmitted(true);
  };

  return (
    <>
      <PageHero
        title="PLAN YOUR VISIT"
        subtitle="We can't wait to welcome you to Faith & Fire! Let us know you're coming so our Hospitality VIP team can give you a warm welcome."
        category="FIRST-TIME EXPERIENCE"
        bgImage="/images/Generated image 1 (11).png"
      />
      
      <section className="py-20 bg-[#f8fafc] relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-16">
            
            {/* Logistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-[#0a192f] p-8 rounded-2xl shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-2xl group-hover:bg-[#38bdf8]/20 transition-all duration-500" />
                <div className="w-14 h-14 bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform">1</div>
                <h3 className="font-black uppercase text-lg text-white mb-3 tracking-tight">VIP Host Welcome</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">Our host team will meet you at the main foyer to give you a quick tour and show you to great seats.</p>
              </div>
              <div className="group bg-[#0a192f] p-8 rounded-2xl shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-2xl group-hover:bg-[#38bdf8]/20 transition-all duration-500" />
                <div className="w-14 h-14 bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform">2</div>
                <h3 className="font-black uppercase text-lg text-white mb-3 tracking-tight">Kids Check-In</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">Safe, energetic, and fun Children's Sanctuary programs for toddlers through pre-teens.</p>
              </div>
              <div className="group bg-[#0a192f] p-8 rounded-2xl shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-2xl group-hover:bg-[#38bdf8]/20 transition-all duration-500" />
                <div className="w-14 h-14 bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform">3</div>
                <h3 className="font-black uppercase text-lg text-white mb-3 tracking-tight">Reserved VIP Parking</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">Secure on-site parking at 46 Turffontein St with friendly parking marshals to assist you.</p>
              </div>
            </div>

            {/* Schedule Form */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-100 max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a192f] to-[#38bdf8]" />
              
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black uppercase tracking-tight text-[#0a192f]">Schedule Your Visit</h2>
                <p className="text-[#64748b] text-sm mt-2 max-w-xl mx-auto">Fill out this quick form and our hospitality team will prepare everything for your arrival.</p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0a192f] uppercase">We look forward to hosting you!</h3>
                  <p className="text-[#64748b] text-sm max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-[#38bdf8]">{visitorName}</strong>. Our Hospitality team has received your visit plan and will reach out shortly with arrival instructions.
                  </p>
                  <div className="mt-6 inline-flex bg-[#f8fafc] border border-slate-200 px-6 py-4 rounded-xl text-center flex-col">
                    <span className="text-[#0a192f] font-black uppercase text-sm mb-1">Service Time</span>
                    <span className="text-[#64748b] text-xs">Sunday Morning • 09:00 AM</span>
                    <span className="text-[#64748b] text-xs">46 Turffontein St, Rosettenville</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="e.g. Lerato Ndlovu"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="e.g. lerato@example.com"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        placeholder="e.g. +27 82 123 4567"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Which Sunday?</label>
                      <input
                        type="date"
                        required
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Adults</label>
                      <select
                        value={numAdults}
                        onChange={(e) => setNumAdults(e.target.value)}
                        className="w-full"
                      >
                        <option value="1">1 Adult</option>
                        <option value="2">2 Adults</option>
                        <option value="3+">3+ Adults</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Children Coming With You?</label>
                    <select
                      value={numKids}
                      onChange={(e) => setNumKids(e.target.value)}
                      className="w-full"
                    >
                      <option value="0">No kids this time</option>
                      <option value="1">1 Child (Ages 2-12)</option>
                      <option value="2">2 Children</option>
                      <option value="3+">3 or more Children</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#0a192f] font-bold text-xs uppercase mb-2">Any Questions or Special Requests?</label>
                    <textarea
                      rows={3}
                      value={specialNeeds}
                      onChange={(e) => setSpecialNeeds(e.target.value)}
                      placeholder="Need wheelchair accessibility, prayer request, or special directions?"
                      className="w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary mt-4 w-full"
                  >
                    Confirm My Visit Plan
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

// ==========================================
// 13. NEXT STEPS SCREEN
// ==========================================
export const NextStepScreen: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { setSelectedMinistryId } = useChurch();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const steps = [
    {
      number: "01",
      title: "Salvation & New Converts",
      subtitle: "SPIRITUAL DECISION",
      scripture: '"Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new." — 2 Cor 5:17',
      desc: "Begin your personal relationship with Jesus Christ. Accept Him as Lord and Savior, receive instant guidance, prayer, and a free New Believer package.",
      timeframe: "Immediate",
      actionText: "Register Decision",
      targetTab: "contact",
      module: "new-converts"
    },
    {
      number: "02",
      title: "Water Baptism by Immersion",
      subtitle: "PUBLIC DECLARATION OF FAITH",
      scripture: '"Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." — Matt 28:19',
      desc: "Declare your new life publicly through full biblical water immersion. Our monthly baptismal service is accompanied by spiritual counseling and certificate presentation.",
      timeframe: "Monthly Service",
      actionText: "Register for Baptism",
      targetTab: "contact",
      module: "new-converts"
    },
    {
      number: "03",
      title: "Foundational Discipleship Track",
      subtitle: "SPIRITUAL GROWTH & BIBLE STUDY",
      scripture: '"As you therefore have received Christ Jesus the Lord, so walk in Him, rooted and built up in Him." — Col 2:6-7',
      desc: "A 4-week Sunday morning masterclass designed to build strong biblical foundations: prayer, Bible study, understanding salvation, and spiritual warfare.",
      timeframe: "4 Weeks (Sundays)",
      actionText: "Join Discipleship Class",
      targetTab: "contact",
      module: "new-members"
    },
    {
      number: "04",
      title: "Connect in Suburb Cell Groups",
      subtitle: "MIDWEEK FELLOWSHIP & BROTHERHOOD",
      scripture: '"Day by day, continuing with one mind in the temple, and breaking bread from house to house..." — Acts 2:46',
      desc: "Faith thrives in community. Join a small home gathering across Johannesburg South for midweek Bible discussion, accountability, and practical care.",
      timeframe: "Weekly Midweek",
      actionText: "Find Local Cell Group",
      targetTab: "contact",
      module: "new-members"
    },
    {
      number: "05",
      title: "Serve & Deploy Your Spiritual Gifts",
      subtitle: "KINGDOM MINISTRY ENGAGEMENT",
      scripture: '"As each one has received a gift, minister it to one another, as good stewards of the manifold grace of God." — 1 Pet 4:10',
      desc: "Discover your place in the house of God. Serve in Ushering, Worship Choir, Technical Media, Youth Ministry, Children\'s Church, or Intercession.",
      timeframe: "Ongoing Service",
      actionText: "Explore Ministry Teams",
      targetTab: "ministries",
      module: ""
    }
  ];

  return (
    <>
      <PageHero
        title="DISCIPLESHIP PATHWAY"
        subtitle="Growth is a continuous spiritual journey. Walk through your step-by-step pathway from salvation to ministry leadership in God's house."
        category="FAITH & FIRE NEXT STEPS"
        bgImage="/images/Generated image 1 (12).png"
      />

      <div className="bg-[#f8fafc] py-20 relative overflow-hidden">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto px-6 space-y-12 relative z-10">
          
          {/* Intro Header Card */}
          <motion.div variants={itemVariants} className="bg-[#0a192f] text-white p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#38bdf8]/10 rounded-full blur-3xl" />
            <div className="space-y-3 max-w-xl relative z-10">
              <span className="text-xs font-mono text-[#38bdf8] font-bold uppercase tracking-widest block">
                SPIRITUAL ROADMAP
              </span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                Where Are You On Your Journey?
              </h2>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                Every believer has a unique next step. Click any phase below to register your decision or join the upcoming cohort in Johannesburg.
              </p>
            </div>
            <button
              onClick={() => {
                if (setCurrentTab) setCurrentTab("contact");
                window.location.hash = "contact?module=new-converts";
              }}
              className="btn-primary"
            >
              I Need Spiritual Guidance
            </button>
          </motion.div>

          {/* Timeline List */}
          <div className="relative border-l-2 border-[#38bdf8]/30 ml-4 md:ml-8 space-y-12 pl-8 md:pl-12">
            {steps.map((step, idx) => (
              <motion.div variants={itemVariants} key={step.number} className="relative group">
                {/* Glowing dot effect behind number */}
                <div className="absolute -left-[45px] md:-left-[61px] top-1 w-6 h-6 bg-[#38bdf8] rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                
                {/* Step Number Circle Badge */}
                <div className="absolute -left-[51px] md:-left-[69px] top-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#0a192f] border-2 border-[#38bdf8] text-[#38bdf8] flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(56,189,248,0.3)] group-hover:scale-110 group-hover:bg-[#38bdf8] group-hover:text-white transition-all duration-300">
                  {step.number}
                </div>

                {/* Step Card Content */}
                <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-xl space-y-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-[#38bdf8]/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0a192f] group-hover:bg-[#38bdf8] transition-colors duration-300" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest block">
                        PHASE {step.number} • {step.subtitle}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#0a192f] mt-1">
                        {step.title}
                      </h3>
                    </div>
                    <span className="bg-[#f8fafc] text-[#64748b] text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {step.timeframe}
                    </span>
                  </div>

                  <blockquote className="text-sm italic text-[#64748b] border-l-4 border-[#38bdf8]/30 pl-4 py-1 font-serif leading-relaxed">
                    {step.scripture}
                  </blockquote>

                  <p className="text-sm text-[#334155] leading-relaxed">
                    {step.desc}
                  </p>

                  <div className="pt-4 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#64748b] bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                      <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                      <span>Free study resources & mentor assigned upon registration.</span>
                    </div>

                    <button
                      onClick={() => {
                        if (setCurrentTab) setCurrentTab(step.targetTab);
                        if (step.module) window.location.hash = `contact?module=${step.module}`;
                      }}
                      className="btn-primary"
                    >
                      <span>{step.actionText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pastoral Connect Banner */}
          <motion.div variants={itemVariants} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#38bdf8]/10 rounded-full blur-3xl" />
            <div className="space-y-3 relative z-10">
              <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest block">
                PASTORAL SUPPORT & CONSULTATION
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-[#0a192f] uppercase tracking-tight">
                Have Questions About Your Next Step?
              </h3>
              <p className="text-sm text-[#64748b] max-w-lg leading-relaxed">
                Reach out to our pastoral team directly at the Rosettenville Sanctuary for a confidential one-on-one consultation.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab && setCurrentTab("contact")}
              className="btn-primary"
            >
              <span>Connect With Pastoral Desk</span>
              <ArrowRight className="w-4 h-4 text-[#38bdf8]" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};


// 14. NEW HERE SCREEN
export const NewHereScreen: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const expectations = [
    {
      icon: BookOpen,
      title: "Biblical Teaching",
      desc: "Practical and faith-building teaching grounded in the Word of God.",
      delay: 0.1
    },
    {
      icon: Music,
      title: "Worship",
      desc: "Opportunities to worship and honour Jesus Christ together with other believers.",
      delay: 0.2
    },
    {
      icon: Heart,
      title: "Prayer",
      desc: "A place where believers can seek God, intercede, and grow in their prayer life.",
      delay: 0.3
    },
    {
      icon: Users,
      title: "Fellowship",
      desc: "Meaningful relationships with other Christians who desire to grow in faith.",
      delay: 0.4
    }
  ];

  return (
    <>
      <PageHero
        title="THERE IS A PLACE FOR YOU HERE"
        subtitle="Find what to expect, plan your first visit, and make Faith & Fire feel like home."
        category="NEW HERE"
        bgImage="/images/Generated image 1 (8).png"
      />

      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#38bdf8] font-bold tracking-widest uppercase text-sm mb-3 block">What You Can Expect</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0a192f] uppercase tracking-tight">When You Visit</h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {expectations.map((item, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="group relative bg-[#f8fafc] p-8 rounded-2xl border border-slate-100 hover:border-[#38bdf8]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#38bdf8]/10 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a192f] to-[#38bdf8] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-[#0a192f] group-hover:text-[#38bdf8] group-hover:scale-110 transition-all duration-300">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0a192f] mb-3">{item.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-[#0a192f] relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-[#38bdf8]/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[1000px] h-[1000px] bg-[#38bdf8]/10 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6">
            You Are Welcome Here
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Whether you have been a Christian for many years, recently surrendered your life to Jesus, are returning to church, or are simply searching for answers about God, there is a place for you at Faith & Fire Ministries.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentTab && setCurrentTab("plan-your-visit")}
              className="btn-primary w-full sm:w-auto"
            >
              Plan Your Visit <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTab && setCurrentTab("contact")}
              className="btn-primary w-full sm:w-auto"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
