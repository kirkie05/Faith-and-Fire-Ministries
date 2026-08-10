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

export const initialMinistries: Ministry[] = [
  {
    id: "m1",
    name: "Men of Fire",
    slug: "men-of-fire",
    category: "Men",
    description: "The 'Men of Fire' ministry at Faith and Fire Ministries is a dedicated space where men are equipped to fulfill their divine purpose as spiritual heads of their homes, leaders in the workplace, and pillars in the community. Our vision is rooted in the biblical principle that 'as iron sharpens iron, so one man sharpens another.' Every week, we gather to confront the unique challenges facing modern men. Through rigorous study of the Scriptures, intensive prayer sessions, and open-hearted mentorship, we burn away the impurities of the world to reveal the character of Christ.",
    schedule: "Saturdays at 08:00 AM",
    meetingTime: "Every Saturday, 08:00 AM - 10:00 AM",
    location: "Main Sanctuary, Faith and Fire Headquarters",
    leaderName: "Eric Malaba",
    leaderTitle: "Apostle & Senior Pastor",
    leaderPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"Men of Fire is not just a meeting; it's an encounter with the transformational power of the Holy Spirit. We are raising an army that cannot be stopped.\"",
    image: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=800",
    active: true
  },
  {
    id: "m2",
    name: "Radiant Women",
    slug: "radiant-women",
    category: "Women",
    description: "Radiant Women is the thriving women's sisterhood at Faith and Fire Ministries. We are a community where grace meets fire, and women are encouraged to flourish in their divine calling. Through regular prayer networks, discipleship groups, annual retreats, and local outreaches, we support one another in spiritual growth, family life, and career impact. We believe that a woman anchored in Christ has the power to transform her family, neighborhood, and city.",
    schedule: "Fridays at 06:30 PM",
    meetingTime: "Alternating Fridays, 06:30 PM",
    location: "Heritage Hall, Johannesburg Campus",
    leaderName: "Sarah Johnson",
    leaderTitle: "Executive Director",
    leaderPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"We believe every woman is uniquely crowned with glory and honor to shine the light of holiness in her generation.\"",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800",
    active: true
  },
  {
    id: "m3",
    name: "Ignite Youth",
    slug: "ignite-youth",
    category: "Youth",
    description: "Ignite Youth is the energetic, high-impact youth department at Faith and Fire Ministries for teens and young adults. We are passionate about raising a generation of fire-starters who will not compromise their faith. Through modern worship, relevant teaching, creative arts, and life-changing small groups, we create an environment where young people can encounter God rawly and build friendships that last a lifetime.",
    schedule: "Wednesdays at 07:00 PM",
    meetingTime: "Every Wednesday, 07:00 PM - 09:00 PM",
    location: "Youth Arena, Ground Floor",
    leaderName: "David Mbeki",
    leaderTitle: "Ministries Coordinator",
    leaderPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"We aren't waiting to be the church of tomorrow; we are bringing the fire of God's Kingdom to our high schools and campuses today!\"",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800",
    active: true
  },
  {
    id: "m4",
    name: "Fire Kids",
    slug: "fire-kids",
    category: "Kids",
    description: "Fire Kids is our vibrant, safe, and engaging children's ministry. From toddlers to pre-teens, we teach the Word of God through creative lessons, interactive games, worship, and hands-on activities. Our goal is to partner with parents to see children grow up with deep biblical conviction and a real, personal walk with Jesus Christ.",
    schedule: "Sundays at 10:00 AM",
    meetingTime: "Every Sunday during Morning Service",
    location: "Kids Zone, First Floor Classroom Suite",
    leaderName: "Jane Doe",
    leaderTitle: "Children's Pastor",
    leaderPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"No child is too young to know the love of Jesus and have the fire of His Spirit within their hearts.\"",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
    active: true
  },
  {
    id: "m5",
    name: "Fire-Bridge Outreach",
    slug: "fire-bridge-outreach",
    category: "Missions",
    description: "Fire-Bridge Outreach is our local and global missions arm, bridging the gap between spiritual devotion and social responsibility. We actively serve marginalized communities in Rosettenville and broader Johannesburg South through weekly food drives, clothes distribution, homeless shelters partnerships, and evangelical crusades. We believe in being the hands and feet of Jesus Christ.",
    schedule: "Monthly | Saturdays",
    meetingTime: "First and Third Saturday of every month",
    location: "Rosettenville & Surrounding Suburbs",
    leaderName: "Pastor John Doe",
    leaderTitle: "Missions Director",
    leaderPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"To reach the heart, we must sometimes serve the physical need first. Out in the streets is where the Gospel becomes visible.\"",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    active: true
  },
  {
    id: "m6",
    name: "Worship & Arts",
    slug: "worship-and-arts",
    category: "Creative",
    description: "Worship & Arts at Faith and Fire is a vibrant gathering of musicians, vocalists, songwriters, and technical production staff who combine creative excellence with spiritual depth. We lead our weekly congregations into deep personal worship, striving for sound biblical theology in our songs and clean, professional presentation in our media.",
    schedule: "Thursdays at 07:00 PM",
    meetingTime: "Thursday Rehearsals, 07:00 PM - 09:30 PM",
    location: "Main Sanctuary Choir Suite",
    leaderName: "Sarah Evans",
    leaderTitle: "Worship Director",
    leaderPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    leaderQuote: "\"Worship is not a performance, it's a sacrifice of praise that unlocks heaven. We strive for excellence because our God deserves the absolute best.\"",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    active: true
  }
];

export const initialEvents: ChurchEvent[] = [
  {
    id: "e1",
    title: "The Fire and the Promise",
    slug: "the-fire-and-the-promise",
    category: "Sunday",
    date: "12 Oct",
    fullDate: "October 12, 2026",
    time: "09:00 AM - 11:30 AM",
    venue: "Main Sanctuary, Johannesburg Campus",
    description: "Join us for a powerful morning service as we press into the promise of the Holy Spirit. Come expectant for deep worship, communion, and a transformative word from Apostle Eric Malaba on the fire that keeps burning. Laying a solid foundation for the week ahead.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
    featured: true,
    capacity: "95% Full",
    rsvpCount: 412
  },
  {
    id: "e2",
    title: "Ignite 2026: Spiritual Awakening",
    slug: "ignite-2026-spiritual-awakening",
    category: "Revival",
    date: "15 Oct",
    fullDate: "October 15, 2026",
    time: "06:30 PM - 09:30 PM",
    venue: "Civic Centre, Braamfontein",
    description: "An intensive night dedicated to intercession, corporate worship, and a manifestation of the gifts of the Spirit. Guest speaker Dr. Sarah Thompson from Dallas will join our leadership in a divine move of deliverance and spiritual empowerment. Seating is limited, RSVP recommended.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    featured: true,
    capacity: "85% Full",
    rsvpCount: 520
  },
  {
    id: "e3",
    title: "Foundations of the Apostolic Faith",
    slug: "foundations-of-the-apostolic-faith",
    category: "Midweek",
    date: "18 Oct",
    fullDate: "October 18, 2026",
    time: "06:00 PM - 08:00 PM",
    venue: "Youth Hall, Ground Floor",
    description: "Our weekly deep-dive Bible study series. This week, we explore the undiluted truth of Holiness and Righteousness as depicted in the teachings of Christ and the early apostles. Ideal for new believers and mature disciples alike wanting to fortify their scriptural understanding.",
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=800",
    featured: false,
    capacity: "60% Full",
    rsvpCount: 154
  },
  {
    id: "e4",
    title: "Sunday Fire Encounter",
    slug: "sunday-fire-encounter",
    category: "Sunday",
    date: "26 Jul",
    fullDate: "July 26, 2026",
    time: "06:00 PM - 08:30 PM",
    venue: "Main Sanctuary, Rosettenville",
    description: "A special Sunday evening service focusing on praise, corporate healing prayer, and ministering to those struggling. Bring a friend who needs an encounter with the light of God in Johannesburg.",
    image: "https://images.unsplash.com/photo-1459305272254-33a7d593a851?auto=format&fit=crop&q=80&w=800",
    featured: false,
    capacity: "45% Full",
    rsvpCount: 220
  }
];

export const initialVideos: SermonVideo[] = [];

export const initialDonations: DonationRecord[] = [
  { id: "d1", date: "2026-07-16", amount: 15000, fund: "Building Fund", firstName: "Anonymous", lastName: "", email: "giver@test.com", type: "One-off" },
  { id: "d2", date: "2026-07-15", amount: 500, fund: "Tithes & Offerings", firstName: "Grace", lastName: "Nkosi", email: "grace.nkosi@gmail.com", type: "One-off" },
  { id: "d3", date: "2026-07-12", amount: 2500, fund: "Missions & Outreach", firstName: "Samuel", lastName: "Molefe", email: "samuel.molefe@yahoo.com", type: "Recurring" },
  { id: "d4", date: "2026-07-10", amount: 1000, fund: "Tithes & Offerings", firstName: "Thabo", lastName: "Mokoena", email: "thabo.mokoena@gmail.com", type: "Recurring" }
];

export const initialMembers: Member[] = [
  { id: "m_u1", firstName: "Thabo", lastName: "Mokoena", phone: "+27 82 555 0123", email: "thabo.m@fireministries.com", suburb: "Sandton, Johannesburg", joinedDate: "2024-02-14", ministries: ["m1", "m6"], status: "Active", pin: "1234", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
  { id: "m_u2", firstName: "Thembeka", lastName: "Mkhize", phone: "+27 83 444 9876", email: "thembeka.mkhize@gmail.com", suburb: "Johannesburg North", joinedDate: "2024-05-18", ministries: ["m2"], status: "Active", pin: "1234", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" },
  { id: "m_u3", firstName: "Grace", lastName: "Nkosi", phone: "+27 81 520 9764", email: "grace.nkosi@gmail.com", suburb: "Rosettenville", joinedDate: "2023-11-05", ministries: ["m2", "m6"], status: "Active", pin: "1234", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
  { id: "m_u4", firstName: "Samuel", lastName: "Molefe", phone: "+27 72 999 8888", email: "samuel.molefe@yahoo.com", suburb: "Johannesburg South", joinedDate: "2025-01-20", ministries: ["m1", "m5"], status: "Active", pin: "1234", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" }
];

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

export const initialMessages: ContactMessage[] = [
  {
    id: "msg_1",
    name: "Samuel Molefe",
    email: "samuel.molefe@yahoo.com",
    phone: "+27 72 999 8888",
    subject: "Prayer Request: Family Guidance",
    message: "Dear Pastor, I am writing to request urgent prayer for my family's current situation regarding our relocation and finding a spiritual anchor here in Rosettenville. Please pray that doors open safely for us.",
    timestamp: "2 minutes ago",
    status: "Unread"
  },
  {
    id: "msg_2",
    name: "Grace Nkosi",
    email: "grace.nkosi@gmail.com",
    phone: "+27 81 520 9764",
    subject: "Volunteer Inquiry: Worship Team",
    message: "I would like to audition for the worship team as a vocalist. I have 5 years of experience in choir leadership and feel called to serve in Faith and Fire's music ministry.",
    timestamp: "15 minutes ago",
    status: "Read"
  },
  {
    id: "msg_3",
    name: "David van der Merwe",
    email: "david.vdm@outlook.com",
    subject: "Booking Request: Hall Rental",
    message: "We are looking to rent the community hall for a charity seminar on the 15th of next month. Please provide your rates, guidelines, and terms. Thank you.",
    timestamp: "1 hour ago",
    status: "Archived"
  },
  {
    id: "msg_4",
    name: "Pastor Sipho",
    email: "sipho@faithandfire.org.za",
    subject: "Staff Meeting Minutes",
    message: "Please review the minutes from today's elders meeting regarding the industrial renovation project. Ready for your comments and approval before Friday.",
    timestamp: "Yesterday",
    status: "Resolved"
  }
];

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
