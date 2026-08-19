export type UserRole = "SuperAdmin" | "Admin" | "Pastor" | "Minister" | "DepartmentLeader" | "Volunteer" | "Member" | "Guest";

export interface ChurchUser {
  uid: string;
  role: UserRole;
  email: string;
  createdAt?: any;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  userId?: string;
  roleAssigned?: string;
  status: string;
  timestamp?: any;
}


export interface Pastor {
  id: string;
  name: string;
  title: string;
  photo: string;
  bio: string;
  quote?: string;
}

export interface HeroSlide {
  headline: string;
  subhead: string;
  cta1Text: string;
  cta1Tab: string;
  cta2Text: string;
  cta2Tab: string;
  videoUrl: string;
  imageUrl?: string;
  overlayClass: string;
  slideType?: "video" | "text";
}

export interface ChurchInfo {
  name: string;
  shortName: string;
  slogan: string;
  logo: string;
  logoDark: string;
  favicon: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  pastorName: string;
  pastorTitle: string;
  pastorPhoto: string;
  pastorBio: string;
  pastors?: Pastor[];
  logoType?: "text" | "image";
  logoImage?: string;
  footerLogoImage?: string;
  faviconUrl?: string;
  logoSubtitle?: string;
  socials: {
    facebook: string;
    youtube: string;
    instagram: string;
    linkedin?: string;
    spotify: string;
  };
  payfast?: {
    merchantId: string;
    merchantKey: string;
    passphrase?: string;
    sandbox: boolean;
  };
}

export interface VisualSettings {
  primaryColor: string;
  secondaryColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: "none" | "sm" | "md" | "lg";
}

export interface ModuleToggles {
  ministries: boolean;
  events: boolean;
  media: boolean;
  giving: boolean;
  membership: boolean;
  decisions: boolean;
  prayers: boolean;
  testimonies: boolean;
}

export interface WebsiteSettings {
  churchName: string;
  logoUrl: string;
  faviconUrl: string;
  moduleToggles: ModuleToggles;
  visualTokens: VisualSettings;
}

export interface HomepageHero {
  announcementActive: boolean;
  announcementText: string;
  announcementLink: string;
  heroHeadline: string;
  heroSubhead: string;
  heroImage: string;
  slides?: HeroSlide[];
  secondaryPageHeader?: {
    type: "video" | "image";
    url: string;
    titleOverlay?: string;
    subheadOverlay?: string;
  };
  featuredCard: {
    tag: string;
    title: string;
    link: string;
  };
}

export interface Ministry {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  schedule: string;
  meetingTime: string;
  location: string;
  leaderName: string;
  leaderTitle: string;
  leaderPhoto: string;
  leaderQuote: string;
  image: string;
  active: boolean;
  blurb?: string;
  archived?: boolean;
}

export interface ChurchEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string; // e.g. "12 Oct" or "2026-10-12"
  fullDate: string; // e.g. "Oct 12, 2026"
  time: string; // e.g. "09:00 AM - 11:30 AM"
  venue: string;
  description: string;
  image: string;
  featured: boolean;
  capacity?: string; // e.g. "85% Full"
  rsvpCount: number;
  guestMinisters?: string; // Legacy string
  dates?: string[]; // Array of YYYY-MM-DD dates for recurring
  isDateRange?: boolean; // Whether event is a date range
  endDate?: string; // e.g. YYYY-MM-DD for date range end
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  ministers?: { name: string; image?: string }[];
  archived?: boolean;
}

export interface SermonVideo {
  id: string;
  title: string;
  speaker: string;
  date: string;
  category: "Sermon" | "Worship" | "Testimony";
  youtubeId: string;
  description: string;
  series?: string;
  thumbnail: string;
  duration?: string;
  archived?: boolean;
  preacher?: string;
  thumbnailUrl?: string;
}

export interface DonationRecord {
  id: string;
  date: string;
  amount: number;
  fund: string;
  firstName: string;
  lastName: string;
  email: string;
  type: "One-off" | "Recurring";
}

export interface CampaignRecord {
  id: string;
  title: string;
  name?: string;
  description?: string;
  status?: string;
  createdAt?: any;
}

export interface BankingDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  referenceFormat: string;
  swiftCode?: string;
  payfastEnabled?: boolean;
}

export interface YoutubeChannel {
  id: string;
  url: string;
  channelName: string;
  channelHandle?: string;
  addedAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  suburb: string;
  joinedDate: string;
  ministries: string[];
  status: "Active" | "Inactive";
  ownerId?: string | null;
  userUid?: string | null;
  dob?: string;
  baptismStatus?: "Baptized" | "Not Baptized" | "Pending";
  emergencyContact?: string;
  notes?: string;
  pin?: string;
  photo?: string;
  anniversary?: string;
}

export interface CareVisit {
  id: string;
  date: string;
  notes: string;
  pastor: string;
}

export interface CareCase {
  id: string;
  type: string;
  member: string;
  pastor: string;
  status: string;
  date: string;
  fullDate: string;
  confidentialNotes: string;
  visits: CareVisit[];
  createdAt?: string | any;
  updatedAt?: string | any;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  serviceName: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  timestamp: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp: string;
  status: "Unread" | "Read" | "Resolved" | "Archived" | "Important";
}

export interface ConnectFormSubmission {
  id: string;
  type: "Decision" | "Prayer" | "Testimony" | "FirstTimer" | "NewMember" | "Care" | "Salvations";
  name: string;
  phone?: string;
  email?: string;
  details: string; // JSON or free text
  timestamp: string;
  status: "Pending" | "Prayed" | "Followed-up" | "Approved" | "Rejected";
}

export interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  profile_photo_url?: string;
  relative_time_description: string;
  initials?: string;
}

export interface PageSection {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  video?: string;
  extraText?: string;
}

export interface EditablePage {
  id: string;
  title: string;
  sections: PageSection[];
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  firstVisitDate: string;
  followUpStatus: "Pending" | "In Progress" | "Completed";
  notes?: string;
}
