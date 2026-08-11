import {
  ChurchInfo,
  WebsiteSettings,
  HomepageHero,
  Ministry,
  ChurchEvent,
  SermonVideo,
  DonationRecord,
  Member,
  AttendanceRecord,
  ContactMessage,
  ConnectFormSubmission,
  GoogleReview,
  EditablePage,
  BankingDetails,
  YoutubeChannel
} from "./types";

export const initialBankingDetails: BankingDetails = {
  bankName: "First National Bank (FNB)",
  accountName: "Faith and Fire Ministries NPC",
  accountNumber: "62891045231",
  branchCode: "250655",
  accountType: "Cheque Account",
  referenceFormat: "Name + Purpose (e.g. E.Nkosi Tithe)",
  swiftCode: "FIRNZAJJ"
};

export const initialYoutubeChannels: YoutubeChannel[] = [];

export const initialChurchInfo: ChurchInfo = {
  name: "Faith & Fire Ministries",
  shortName: "Faith & Fire",
  slogan: "ministering the Word so the world may be pleasing to God.",
  logo: "Faith & Fire",
  logoDark: "Faith & Fire",
  favicon: "🔥",
  address: "46 Turffontein St, Rosettenville",
  city: "Johannesburg South, 2190",
  country: "South Africa",
  phone: "+27 11 681 0246",
  whatsapp: "+27 81 520 9764",
  email: "ermalaba@yahoo.fr",
  pastorName: "Eric Malaba",
  pastorTitle: "Apostle",
  pastorPhoto: "/images/Pastor 1.png",
  pastorBio: "Apostle Eric Malaba is the founder and Senior Pastor of Faith and Fire Ministries. He has been ministering the Word of God for over 20 years, focusing on Holiness, Righteousness, and unleashing the power of the Holy Spirit to build solid faith in souls around Johannesburg and across nations.",
  logoType: "text",
  logoImage: "",
  footerLogoImage: "",
  faviconUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=192",
  logoSubtitle: "JOHANNESBURG SOUTH",
  pastors: [
    {
      id: "p1",
      name: "Eric Malaba",
      title: "Apostle & Senior Leader",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      bio: "Apostle Eric Malaba is the founder and Senior Pastor of Faith and Fire Ministries. He has been ministering the Word of God for over 20 years, focusing on Holiness, Righteousness, and unleashing the power of the Holy Spirit to build solid faith in souls in Johannesburg and across nations.",
      quote: "Our prayer is that you step into the fire of God's sanctuary and leave changed. Here, we preach Christ crucified, risen, and returning soon."
    },
    {
      id: "p2",
      name: "Sarah Johnson",
      title: "Executive Pastor & Director",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      bio: "Pastor Sarah leads our administration and strategic oversight, ensuring that every operational structure of our campuses runs in divine alignment and excellence. She is dedicated to organizational precision.",
      quote: "Excellence in administration is a reflection of God's order. We strive to create structures that help souls find their lane of service seamlessly."
    },
    {
      id: "p3",
      name: "David Mbeki",
      title: "Ministries Coordinator",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      bio: "Pastor David coordinates our localized home cells and specialized departments. He serves with a passion for integrating new members into the vibrant spiritual life of our sanctuary.",
      quote: "No believer should walk alone. My mission is to ensure every person who walks through our doors is integrated into a fire-filled community."
    }
  ],
  socials: {
    facebook: "https://www.facebook.com/faithandfireministries/",
    youtube: "https://www.youtube.com/channel/UC4kimR0MvBFVEro4RryplOQ",
    instagram: "https://instagram.com/faithandfire",
    linkedin: "https://linkedin.com/in/apostle-eric-malaba",
    spotify: "https://spotify.com/faithandfire"
  },
  payfast: {
    merchantId: "",
    merchantKey: "",
    passphrase: "",
    sandbox: true
  }
};

export const initialWebsiteSettings: WebsiteSettings = {
  churchName: "Faith and Fire Ministries",
  logoUrl: "",
  faviconUrl: "",
  moduleToggles: {
    ministries: true,
    events: true,
    media: true,
    giving: true,
    membership: true,
    decisions: true,
    prayers: true,
    testimonies: true
  },
  visualTokens: {
    primaryColor: "#2E0854", // Darker Purple 900
    secondaryColor: "#F59E0B", // Deep Yellow 500
    headingFont: "Sora",
    bodyFont: "Inter",
    borderRadius: "md"
  }
};

export const initialHomepageHero: HomepageHero = {
  announcementActive: true,
  announcementText: "Join us for the Night of Fire this Friday at 7 PM. Register online now!",
  announcementLink: "/events/night-of-fire",
  heroHeadline: "WHERE FAITH MEETS THE FIRE OF REVIVAL",
  heroSubhead: "Experience the presence of God in our Johannesburg campus. We are a ministry committed to the unadulterated word of God and the movement of the Holy Spirit.",
  heroImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1200",
  secondaryPageHeader: {
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-warm-light-refraction-41822-large.mp4",
    titleOverlay: "FAITH & FIRE MINISTRIES",
    subheadOverlay: "Rosettenville • Johannesburg South"
  },
  slides: [
    {
      slideType: "text",
      headline: "HIS PRESENCE|TRANSFORMS",
      subhead: "Step into an atmosphere where heartfelt worship, fervent prayer, and the life-changing power of the Holy Spirit draw people closer to Jesus Christ and transform lives forever.",
      cta1Text: "VISIT SUNDAY",
      cta1Tab: "about",
      cta2Text: "WATCH LIVE",
      cta2Tab: "media",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-warm-light-refraction-41822-large.mp4",
      imageUrl: "/images/Generated image 1.png",
      overlayClass: "from-purple-950/45 via-purple-950/70 to-purple-950/90"
    },
    {
      slideType: "text",
      headline: "FAITH IGNITES|REVIVAL",
      subhead: "Join a Bible-based church committed to proclaiming the Gospel of Jesus Christ through sound biblical teaching, passionate worship, and authentic encounters with God's presence.",
      cta1Text: "EXPLORE MINISTRIES",
      cta1Tab: "ministries",
      cta2Text: "PLAN YOUR VISIT",
      cta2Tab: "about",
      videoUrl: "",
      imageUrl: "/images/Generated image 1 (4).png",
      overlayClass: "from-amber-950/40 via-purple-950/70 to-purple-950/90"
    },
    {
      slideType: "text",
      headline: "WALK IN|HOLY FIRE",
      subhead: "Grow in faith, holiness, and righteousness as you are equipped through God's Word and empowered by the Holy Spirit to live a victorious Christian life.",
      cta1Text: "SUBMIT PRAYER",
      cta1Tab: "contact",
      cta2Text: "GIVE ONLINE",
      cta2Tab: "give",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-church-candles-in-a-dark-room-41821-large.mp4",
      imageUrl: "/images/Generated image 1 (5).png",
      overlayClass: "from-neutral-950/45 via-purple-950/70 to-purple-950/90"
    }
  ],
  featuredCard: {
    tag: "NEW SERIES",
    title: "The Power of Prayer",
    link: "/watch"
  }
};

export const initialMinistries: Ministry[] = [];

export const initialEvents: ChurchEvent[] = [];

export const initialVideos: SermonVideo[] = [];

export const initialDonations: DonationRecord[] = [];

export const initialMembers: Member[] = [];

export const initialAttendance: AttendanceRecord[] = [
  { id: "att_1", date: "2026-07-26", serviceName: "Sunday Fire Encounter", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "09:12 AM" },
  { id: "att_2", date: "2026-07-24", serviceName: "Friday Night of Fire Altar", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "07:05 PM" },
  { id: "att_3", date: "2026-07-19", serviceName: "Sunday Glory & Deliverance Service", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "08:58 AM" },
  { id: "att_4", date: "2026-07-12", serviceName: "Sunday Glory & Deliverance Service", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "09:02 AM" },
  { id: "att_5", date: "2026-07-05", serviceName: "Sunday Anointing & Holy Communion", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "09:15 AM" },
  { id: "att_6", date: "2026-06-28", serviceName: "Sunday Apostolic Celebration", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "08:50 AM" },
  { id: "att_7", date: "2026-06-21", serviceName: "Sunday Worship & Word Service", memberId: "m_u1", memberName: "Thabo Mokoena", memberEmail: "thabo.m@fireministries.com", timestamp: "09:00 AM" },
  { id: "att_8", date: "2026-07-26", serviceName: "Sunday Fire Encounter", memberId: "m_u3", memberName: "Grace Nkosi", memberEmail: "grace.nkosi@gmail.com", timestamp: "09:05 AM" },
  { id: "att_9", date: "2026-07-19", serviceName: "Sunday Glory & Deliverance Service", memberId: "m_u3", memberName: "Grace Nkosi", memberEmail: "grace.nkosi@gmail.com", timestamp: "09:10 AM" },
  { id: "att_10", date: "2026-07-26", serviceName: "Sunday Fire Encounter", memberId: "m_u2", memberName: "Thembeka Mkhize", memberEmail: "thembeka.mkhize@gmail.com", timestamp: "09:20 AM" }
];



export const initialGoogleReviews: GoogleReview[] = [
  {
    id: "gr_1",
    author_name: "Thabo Mokoena",
    rating: 5,
    text: "Finding Faith & Fire was a turning point for my family. The teaching is solid, and the presence of God is undeniable every Sunday. It's a place where you truly experience spiritual growth and the power of the Holy Spirit inside Johannesburg.",
    relative_time_description: "1 week ago",
    initials: "TM"
  },
  {
    id: "gr_2",
    author_name: "Sarah Naidoo",
    rating: 5,
    text: "The Fire Youth ministry has changed my son's life. He found a sense of purpose and a community that supports his faith journey. I am forever grateful to Apostle Eric and the entire leadership team for their guidance.",
    relative_time_description: "2 weeks ago",
    initials: "SN"
  },
  {
    id: "gr_3",
    author_name: "David Ndlovu",
    rating: 5,
    text: "An incredible apostolic house! If you are looking for uncompromised biblical truth, intense corporate worship, and genuine fellowship, Faith & Fire is the home to be in. The weekly altar prayers are powerful.",
    relative_time_description: "1 month ago",
    initials: "DN"
  },
  {
    id: "gr_4",
    author_name: "Lerato Molefe",
    rating: 5,
    text: "The community outreach here is so inspiring. Apostle Eric does not just preach inside the building, the church is actively serving the poor in Rosettenville with weekly food kitchens. True love in action!",
    relative_time_description: "2 months ago",
    initials: "LM"
  }
];

export const initialMessages: ContactMessage[] = [];

export const initialConnectSubmissions: ConnectFormSubmission[] = [
  { id: "sub_1", type: "Prayer", name: "Samuel Molefe", phone: "+27 72 999 8888", email: "samuel.molefe@yahoo.com", details: "Relocation guidance and spiritual strength.", timestamp: "2026-07-16T11:45:00", status: "Pending" },
  { id: "sub_2", type: "Decision", name: "John Doe", phone: "+27 83 000 0000", email: "john@example.com", details: "I gave my life to Jesus today at the Sunday Morning glory service.", timestamp: "2026-07-12T10:30:00", status: "Followed-up" },
  { id: "sub_3", type: "Testimony", name: "Thembeka Mkhize", email: "thembeka@test.com", details: "Healing from respiratory complications during the special revival night.", timestamp: "2026-07-10T21:15:00", status: "Approved" }
];


export const initialPagesData: EditablePage[] = [
  {
    id: "about",
    title: "About Us Page",
    sections: [
      {
        id: "legacy",
        title: "Building a Kingdom Foundation with Fire and Faith",
        subtitle: "Our Legacy",
        content: "Faith & Fire Ministries was established in 2004 under the apostolic leadership of Apostle Eric Malaba in Rosettenville, Johannesburg South. Founded on an unwavering dedication to biblical holiness and pentecostal fire, our ministry has served for over two decades as a spiritual sanctuary. We are devoted to reclaiming souls, mending broken families, and training burning disciples who carry the uncompromised truth of Jesus Christ into the marketplace, community, and nations.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
        extraText: "20+"
      },
      {
        id: "quote",
        title: "Scripture Banner",
        content: '"That I should be the minister of Jesus Christ to the Gentiles, ministering the gospel of God, that the offering up of the Gentiles might be acceptable, being sanctified by the Holy Ghost."',
        extraText: "— Romans 15:16"
      },
      {
        id: "vision_mission",
        title: "Our Vision",
        subtitle: "Our Mission",
        content: "To establish a global network of believers who are spiritually equipped, mentally renewed, and actively engaged in the apostolic work of the Kingdom. We see communities in Johannesburg South and across the globe transformed by the raw power of God's presence and the unadulterated truth of His Word.",
        extraText: "We exist to preach the gospel of Jesus Christ with apostolic authority, demonstrate the healing and delivering power of the Holy Ghost, and build strong spiritual foundations for families, leaders, and communities through intense prayer, deep discipleship, and holy living."
      }
    ]
  },
  {
    id: "give",
    title: "Giving & Altar Sacrifices",
    sections: [
      {
        id: "intro",
        title: "STRENGTHEN THE ALTAR OF GOD",
        subtitle: "PRODUCE COVENANT OUTCOME",
        content: "Your sacrificial seed goes directly to maintaining the daily altar, driving continuous community care, and expanding the apostolic fire of revival from Rosettenville to other key cities.",
        image: "https://images.unsplash.com/photo-1519751151740-41acfd70d760?auto=format&fit=crop&q=80&w=1200"
      },
      {
        id: "payfast_terms",
        title: "SACRIFICIAL ALTAR terms & PayFast Secured gateways",
        content: "All contributions are received with absolute accountability and spiritual alignment. Partner with us today as we minister the fire of revival."
      }
    ]
  },
  {
    id: "contact",
    title: "Contact Offices & Configs",
    sections: [
      {
        id: "intro",
        title: "CONNECT WITH THE SANCTUARY OFFICES",
        subtitle: "GET IN TOUCH",
        content: "Reach out for counseling, prayer, or information on weekly services. Our administrative offices are ready to serve you.",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200"
      },
      {
        id: "location",
        title: "VISIT OUR JOHANNESBURG SANCTUARY",
        subtitle: "46 Turffontein St, Rosettenville",
        content: "Sundays at 09:00 AM | Fridays (Night of Fire) at 07:00 PM | Tuesdays (Altar Prayer) at 06:00 PM"
      }
    ]
  },
  {
    id: "media",
    title: "Media Archive & Sermons",
    sections: [
      {
        id: "intro",
        title: "Apostolic Preaching Archives",
        subtitle: "Listen and be Ignited",
        content: "Dive into years of uncompromised biblical preaching on holiness, prayer, and local revival. Our media segment houses full sermon recordings, worship encounters, and testimonies.",
        image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200"
      }
    ]
  },
  {
    id: "ministries",
    title: "Church Departments & Ministries",
    sections: [
      {
        id: "intro",
        title: "DEPARTMENTS & LOCAL MINISTRIES",
        subtitle: "Find your lane of active service",
        content: "The church is a body with many members. Discover specialized directories designed to forge spiritual heads, ignite mothers in prayer, and prepare youth as burning torches.",
        image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=1200"
      }
    ]
  }
];
