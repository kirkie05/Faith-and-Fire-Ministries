import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";

interface CustomMediaPlayerProps {
  youtubeUrlOrId: string;
}

export const CustomMediaPlayer: React.FC<CustomMediaPlayerProps> = ({ youtubeUrlOrId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Parse YouTube video or channel details
  const parseYoutubeUrl = (urlOrId: string) => {
    const cleaned = (urlOrId || "").trim();
    
    // 1. Check if it's already a clean 11-char video ID
    if (cleaned.length === 11 && !cleaned.includes("/") && !cleaned.includes("?") && !cleaned.includes("&")) {
      return {
        type: "video" as const,
        id: cleaned,
        embedUrl: `https://www.youtube.com/embed/${cleaned}`,
        thumbnailUrl: `https://img.youtube.com/vi/${cleaned}/maxresdefault.jpg`,
        fallbackThumbnailUrl: `https://img.youtube.com/vi/${cleaned}/hqdefault.jpg`
      };
    }

    // 2. Standard video URL formats
    const videoRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const videoMatch = cleaned.match(videoRegExp);
    if (videoMatch && videoMatch[2].length === 11) {
      const videoId = videoMatch[2];
      return {
        type: "video" as const,
        id: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        fallbackThumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }

    // 3. Channel URL format
    let channelId = "UC4kimR0MvBFVEro4RryplOQ"; // fallback channel ID
    if (cleaned.includes("channel/")) {
      channelId = cleaned.split("channel/")[1]?.split("/")[0]?.split("?")[0] || channelId;
    } else if (cleaned.includes("youtube.com/c/")) {
      const username = cleaned.split("youtube.com/c/")[1]?.split("/")[0]?.split("?")[0];
      if (username) {
        return {
          type: "playlist" as const,
          id: username,
          embedUrl: `https://www.youtube.com/embed?listType=user_uploads&list=${username}`,
          thumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800",
          fallbackThumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800"
        };
      }
    } else if (cleaned.includes("youtube.com/@")) {
      const handle = cleaned.split("youtube.com/@")[1]?.split("/")[0]?.split("?")[0];
      if (handle) {
        return {
          type: "playlist" as const,
          id: handle,
          embedUrl: `https://www.youtube.com/embed?listType=user_uploads&list=${handle}`,
          thumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800",
          fallbackThumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800"
        };
      }
    } else if (!cleaned.includes("/") && cleaned.length > 10) {
      channelId = cleaned;
    }

    // Convert channel ID (UC...) to upload playlist ID (UU...)
    let playlistId = channelId;
    if (channelId.startsWith("UC")) {
      playlistId = "UU" + channelId.substring(2);
    }

    return {
      type: "playlist" as const,
      id: playlistId,
      embedUrl: `https://www.youtube.com/embed?listType=playlist&list=${playlistId}`,
      thumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800",
      fallbackThumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800"
    };
  };

  const videoData = parseYoutubeUrl(youtubeUrlOrId);
  const [thumb, setThumb] = useState(videoData.thumbnailUrl);

  // Sync state whenever url changes
  useEffect(() => {
    const data = parseYoutubeUrl(youtubeUrlOrId);
    setThumb(data.thumbnailUrl);
    setIsPlaying(false);
  }, [youtubeUrlOrId]);

  const handleThumbnailError = () => {
    if (thumb !== videoData.fallbackThumbnailUrl) {
      setThumb(videoData.fallbackThumbnailUrl);
    }
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  // Build the embed src for the iframe. Enable controls natively so the user has fully transparent, native-disappearing controls.
  const getEmbedSrc = () => {
    const divider = videoData.embedUrl.includes("?") ? "&" : "?";
    // We add autoplay=1 so it starts immediately after click, and enable JS API
    return `${videoData.embedUrl}${divider}autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full h-full bg-neutral-950 rounded-lg overflow-hidden border relative flex flex-col aspect-video shadow-2xl transition-all duration-300 ${
        isHovered ? "border-amber-400/40 shadow-orange-500/5" : "border-[#0F2342]/40"
      }`}
    >
      {isPlaying ? (
        <iframe
          src={getEmbedSrc()}
          title="YouTube Video Broadcast"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div
          onClick={handlePlayClick}
          className="absolute inset-0 cursor-pointer bg-neutral-900 group flex items-center justify-center overflow-hidden"
        >
          {thumb && (
            <img
              src={thumb}
              alt="Sermon Broadcast Thumbnail"
              onError={handleThumbnailError}
              className="w-full h-full object-cover opacity-65 group-hover:scale-102 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          )}
          {/* Centered Golden Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-500 group-hover:bg-amber-500 text-[#0A192F] flex items-center justify-center shadow-3xl transition-all transform scale-100 group-hover:scale-108 duration-300">
              <Play className="w-8 h-8 fill-purple-950 ml-1 text-[#0A192F]" />
            </div>
            <span className="mt-4 text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-amber-400/30 backdrop-blur-xs">
              Click to Play Sermon
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
