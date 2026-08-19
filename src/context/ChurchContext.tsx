import React, { createContext, useContext, useState, useEffect } from "react";
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
  BankingDetails,
  YoutubeChannel,
  UserRole,
  CareCase,
  CareVisit,
  EditablePage,
  ChurchUser,
  AuditLogEntry,
  Visitor,
  CampaignRecord
} from "../types";
import {
  initialChurchInfo,
  initialWebsiteSettings,
  initialHomepageHero,
  initialMinistries,
  initialEvents,
  initialVideos,
  initialDonations,
  initialMembers,
  initialAttendance,
  initialMessages,
  initialConnectSubmissions,
  initialGoogleReviews,
  initialPagesData,
  initialBankingDetails,
  initialYoutubeChannels
} from "../data";
import { db, auth } from "../lib/firebase";
import { addDoc, collection, doc, setDoc, getDoc, getDocs, increment, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const STAFF_ROLES: UserRole[] = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"];

const isValidRole = (role: string | undefined): role is UserRole =>
  !!role && ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader", "Volunteer", "Member", "Guest"].includes(role);

export const generateMemberPin = (): string => String(Math.floor(1000 + Math.random() * 9000));

interface ChurchContextProps {
  currentUser: FirebaseUser | null;
  userRole: UserRole | null;
  authLoading: boolean;
  churchInfo: ChurchInfo;
  setChurchInfo: (info: ChurchInfo) => void;
  websiteSettings: WebsiteSettings;
  setWebsiteSettings: (settings: WebsiteSettings) => void;
  homepageHero: HomepageHero;
  setHomepageHero: (hero: HomepageHero) => void;
  bankingDetails: BankingDetails;
  setBankingDetails: (details: BankingDetails) => void;
  youtubeChannels: YoutubeChannel[];
  setYoutubeChannels: (channels: YoutubeChannel[]) => void;
  addYoutubeChannel: (url: string, channelName: string) => void;
  deleteYoutubeChannel: (id: string) => void;
  ministries: Ministry[];
  setMinistries: (ministries: Ministry[]) => void;
  events: ChurchEvent[];
  setEvents: (events: ChurchEvent[]) => void;
  videos: SermonVideo[];
  setVideos: (videos: SermonVideo[]) => void;
  donations: DonationRecord[];
  setDonations: (donations: DonationRecord[]) => void;
  members: Member[];
  setMembers: (members: Member[]) => void;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  messages: ContactMessage[];
  setMessages: (messages: ContactMessage[]) => void;
  connectSubmissions: ConnectFormSubmission[];
  setConnectSubmissions: (subs: ConnectFormSubmission[]) => void;

  // Mutator helpers
  addMessage: (name: string, email: string, subject: string, message: string, phone?: string) => void;
  addConnectSubmission: (type: ConnectFormSubmission["type"], name: string, details: string, email?: string, phone?: string) => void;
  addDonation: (amount: number, fund: string, firstName: string, lastName: string, email: string, type: "One-off" | "Recurring") => void;
  addMember: (firstName: string, lastName: string, email: string, phone: string, suburb: string, chosenMinistries: string[], extra?: Partial<Member>) => Member;
  updateMember: (member: Member) => void;
  updateMemberProfile: (member: Member) => void;
  deleteMember: (id: string) => void;
  checkInMember: (credential: string, serviceName: string, pin?: string) => Promise<string>; // returns status message
  checkInGuest: (name: string, phone: string, whatsapp: string, email: string) => Promise<string>;
  verifyMemberPin: (identifier: string, pin: string) => Promise<{ success: boolean; memberId: string }>;
  setMemberPin: (memberId: string, pin: string) => Promise<void>;
  rsvpEvent: (eventId: string, name?: string, email?: string) => { status: string; ticketId: string; };
  addEvent: (event: ChurchEvent) => void;
  updateEvent: (event: ChurchEvent) => void;
  deleteEvent: (eventId: string) => void;
  addMinistry: (ministry: Ministry) => void;
  updateMinistry: (ministry: Ministry) => void;
  deleteMinistry: (id: string) => void;
  addSermon: (sermon: SermonVideo) => void;
  deleteSermon: (id: string) => void;
  careCases: CareCase[];
  setCareCases: (cases: CareCase[]) => void;
  addCareCase: (memberId: string, memberName: string, type: string, pastor: string, notes: string) => void;
  updateCareCaseStatus: (id: string, status: string) => void;
  updateCareCaseNotes: (id: string, notes: string) => void;
  addCareVisit: (id: string, visit: CareVisit) => void;
  bulkAddMembers: (members: Partial<Member>[]) => Promise<boolean>;
  selectedMinistryId: string | null;
  setSelectedMinistryId: (id: string | null) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  googleReviews: GoogleReview[];
  setGoogleReviews: (reviews: GoogleReview[]) => void;
  googleReviewsCached: boolean;
  syncGoogleReviews: () => Promise<boolean>;
  addAuditLog: (action: string, category: string, detail: string, status?: string) => void;
  pagesData: EditablePage[];
  setPagesData: (pages: EditablePage[]) => void;
  users: ChurchUser[];
  auditLogs: AuditLogEntry[];
  visitors: Visitor[];
  campaigns: CampaignRecord[];
}

const ChurchContext = createContext<ChurchContextProps | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Firebase Auth & User Role Sync Listener
  // Roles are resolved EXCLUSIVELY from custom claims (set server-side by Cloud
  // Functions). Admin invites are redeemed via the redeemAdminInvite callable.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true).catch(() => null);
          const roleFromClaim = tokenResult?.claims?.role as UserRole | undefined;

          let resolvedRole: UserRole = "Member";

          if (isValidRole(roleFromClaim)) {
            resolvedRole = roleFromClaim;
          } else {
            try {
              const redeemInvite = httpsCallable(getFunctions(), "redeemAdminInvite");
              const result = await redeemInvite();
              const data = result.data as { role?: UserRole } | undefined;
              if (data?.role && isValidRole(data.role)) {
                const freshToken = await user.getIdTokenResult(true).catch(() => null);
                const freshRole = freshToken?.claims?.role as UserRole | undefined;
                if (isValidRole(freshRole)) resolvedRole = freshRole;
              }
            } catch {
              // No pending invite — resolve to Member below.
            }
          }

          setUserRole(resolvedRole);

          // Provision a bare Member profile if it does not exist yet. The
          // Firestore rules force role: "Member" on client creation, so this
          // can never escalate privileges.
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists() && user.email) {
            await setDoc(userRef, {
              role: "Member",
              email: user.email,
              createdAt: serverTimestamp()
            }).catch((err) => console.warn("Doc creation fallback:", err));
          }
        } catch (e) {
          console.warn("User role resolution error:", e);
          setUserRole("Member");
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Banking & Youtube Channels State.
  // Server-managed church configuration is NEVER initialized from
  // localStorage — Firestore settings documents are the single source of
  // truth. The initial constants are only a pre-hydration fallback.
  const [bankingDetails, setBankingDetailsState] = useState<BankingDetails>(initialBankingDetails);

  const [youtubeChannels, setYoutubeChannelsState] = useState<YoutubeChannel[]>(initialYoutubeChannels);

  const [churchInfo, setChurchInfoState] = useState<ChurchInfo>(initialChurchInfo);

  const [websiteSettings, setWebsiteSettingsState] = useState<WebsiteSettings>(initialWebsiteSettings);

  const [homepageHero, setHomepageHeroState] = useState<HomepageHero>(initialHomepageHero);

  const [ministries, setMinistriesState] = useState<Ministry[]>(initialMinistries);

  const [events, setEventsState] = useState<ChurchEvent[]>(initialEvents);

  const [videos, setVideosState] = useState<SermonVideo[]>(initialVideos);

  const [donations, setDonationsState] = useState<DonationRecord[]>(initialDonations);

  const [members, setMembersState] = useState<Member[]>(initialMembers);

  const [attendance, setAttendanceState] = useState<AttendanceRecord[]>(initialAttendance);

  const [messages, setMessagesState] = useState<ContactMessage[]>(initialMessages);

  const [connectSubmissions, setConnectSubmissionsState] = useState<ConnectFormSubmission[]>(initialConnectSubmissions);

  const [googleReviews, setGoogleReviewsState] = useState<GoogleReview[]>(initialGoogleReviews);

  // True when the displayed reviews came from the last server-synced snapshot
  // (settings/google_reviews) rather than a live Google API fetch.
  const [googleReviewsCached, setGoogleReviewsCachedState] = useState(false);

  const [pagesData, setPagesDataState] = useState<EditablePage[]>(initialPagesData);

  const [careCases, setCareCasesState] = useState<CareCase[]>([]);

  const [users, setUsers] = useState<ChurchUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

  // Helper function to sanitize objects before Firestore persistence to avoid undefined crashes
  const cleanData = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

  // Firestore Real-Time Subscriptions for Global Settings & Collections.
  // Server-managed data is hydrated exclusively from Firestore — there is no
  // client-side seeding (server-owned settings are seeded by the privileged
  // seedInitialData callable) and no localStorage mirror.
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(doc(db, "settings", "youtube_channels"), (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.channels)) {
          setYoutubeChannelsState(snap.data()?.channels);
        }
      }, (e) => console.warn("Firestore listener warning:", e))
    );
      unsubs.push(
        onSnapshot(doc(db, "settings", "church_info"), (snap) => {
          if (snap.exists() && snap.data()) {
            setChurchInfoState(snap.data() as ChurchInfo);
          }
        }, (e) => console.warn("Firestore listener warning:", e))
      );
      unsubs.push(
        onSnapshot(doc(db, "settings", "website_settings"), (snap) => {
          if (snap.exists() && snap.data()) {
            setWebsiteSettingsState(snap.data() as WebsiteSettings);
          }
        }, (e) => console.warn("Firestore listener warning:", e))
      );
      unsubs.push(
        onSnapshot(doc(db, "settings", "homepage_hero"), (snap) => {
          if (snap.exists() && snap.data()) {
            setHomepageHeroState(snap.data() as HomepageHero);
          }
        }, (e) => console.warn("Firestore listener warning:", e))
      );
      unsubs.push(
        onSnapshot(doc(db, "settings", "banking_details"), (snap) => {
          if (snap.exists() && snap.data()) {
            setBankingDetailsState(snap.data() as BankingDetails);
          }
        }, (e) => console.warn("Firestore listener warning:", e))
      );
      unsubs.push(
        onSnapshot(collection(db, "events"), (snap) => {
          if (!snap.empty) {
            const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as ChurchEvent));
            fetched.sort((a: any, b: any) => {
              const tA = a.createdAt?.toMillis?.() || (a.id.startsWith('evt_') ? parseInt(a.id.split('_')[1]) || Date.now() : 0);
              const tB = b.createdAt?.toMillis?.() || (b.id.startsWith('evt_') ? parseInt(b.id.split('_')[1]) || Date.now() : 0);
              return tB - tA;
            });
            setEventsState((prev) => {
              const fetchedIds = new Set(fetched.map((f) => f.id));
              const localUnsynced = prev.filter((p) => !fetchedIds.has(p.id));
              return [...fetched, ...localUnsynced];
            });
          }
        }, (e) => console.warn("Events listener warning:", e))
      );
      unsubs.push(
        onSnapshot(collection(db, "ministries"), (snap) => {
          if (!snap.empty) {
            const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as Ministry));
            setMinistriesState((prev) => {
              const fetchedIds = new Set(fetched.map((f) => f.id));
              const localUnsynced = prev.filter((p) => !fetchedIds.has(p.id));
              return [...fetched, ...localUnsynced];
            });
          }
        }, (e) => console.warn("Ministries listener warning:", e))
      );

      unsubs.push(
        onSnapshot(collection(db, "sermons"), (snap) => {
          if (!snap.empty) {
            const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as SermonVideo));
            fetched.sort((a: any, b: any) => {
              const tA = a.createdAt?.toMillis?.() || 0;
              const tB = b.createdAt?.toMillis?.() || 0;
              return tB - tA;
            });
            setVideosState(fetched);
          }
        }, (e) => console.warn("Sermons listener warning:", e))
      );

      unsubs.push(
        onSnapshot(doc(db, "settings", "pages_data"), (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.list)) {
            setPagesDataState(snap.data()?.list);
          }
        }, (e) => console.warn("Pages data listener warning:", e))
      );

      unsubs.push(
        onSnapshot(doc(db, "settings", "google_reviews"), (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.reviews)) {
            setGoogleReviewsState(snap.data()?.reviews);
            setGoogleReviewsCachedState(snap.data()?.isCached === true);
          }
        }, (e) => console.warn("Google reviews listener warning:", e))
      );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Staff-only real-time subscriptions (sensitive data is never pulled by
  // non-staff clients). Subscribed whenever the signed-in user holds a staff
  // role claim.
  const isStaffUser = !!userRole && STAFF_ROLES.includes(userRole);

  useEffect(() => {
    if (!isStaffUser) return;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(collection(db, "pastoral_care"), (snap) => {
        const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as CareCase));
        fetched.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setCareCasesState(fetched);
      }, (e) => console.warn("Pastoral care listener warning:", e))
    );

    unsubs.push(
      onSnapshot(collection(db, "contactMessages"), (snap) => {
        if (snap.empty) return;
        const fetched = snap.docs.map((record) => ({ ...record.data(), id: record.data()?.id || record.id } as ContactMessage));
        setMessagesState(fetched);
      }, (e) => console.warn("Messages listener warning:", e))
    );

    unsubs.push(
      onSnapshot(collection(db, "users"), (snap) => {
        const fetched = snap.docs.map((record) => ({ uid: record.id, ...record.data() } as ChurchUser));
        setUsers(fetched);
      }, (e) => console.warn("Users listener warning:", e))
    );

    unsubs.push(
      onSnapshot(collection(db, "visitors"), (snap) => {
        if (snap.empty) return;
        const fetched = snap.docs.map((record) => ({ ...record.data(), id: record.data()?.id || record.id } as Visitor));
        setVisitors(fetched);
      }, (e) => console.warn("Visitors listener warning:", e))
    );

    unsubs.push(
      onSnapshot(collection(db, "campaigns"), (snap) => {
        const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as CampaignRecord));
        setCampaigns(fetched);
      }, (e) => console.warn("Campaigns listener warning:", e))
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [isStaffUser]);

  // Personal subscriptions for signed-in members (non-staff). Staff read
  // the full collections via the staff effect above; members only see
  // records they own (ownerId == uid), matching the rules-level isolation.
  // Note: staff also pass through here briefly while role claims load, then
  // the staff effect takes over with unfiltered queries.
  useEffect(() => {
    if (!currentUser || isStaffUser) return;
    const unsubs: (() => void)[] = [];
    const myConnectSubmissions = query(collection(db, "connectSubmissions"), where("ownerId", "==", currentUser.uid));
    const myDonations = query(collection(db, "donations"), where("ownerId", "==", currentUser.uid));
    const myAttendance = query(collection(db, "attendance"), where("ownerId", "==", currentUser.uid));

    unsubs.push(
      onSnapshot(myConnectSubmissions, (snap) => {
        if (snap.empty) return;
        const fetched = snap.docs.map((record) => ({ ...record.data(), id: record.data()?.id || record.id } as ConnectFormSubmission));
        setConnectSubmissionsState(fetched);
      }, (e) => console.warn("Connect submissions listener warning:", e))
    );

    unsubs.push(
      onSnapshot(myDonations, (snap) => {
        const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as DonationRecord));
        setDonationsState(fetched);
      }, (e) => console.warn("Donations listener warning:", e))
    );

    unsubs.push(
      onSnapshot(myAttendance, (snap) => {
        const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as AttendanceRecord));
        setAttendanceState(fetched);
      }, (e) => console.warn("Attendance listener warning:", e))
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [currentUser, isStaffUser]);

  // Admin-only real-time subscription to the append-only audit log.
  const isAdminUser = !!userRole && (userRole === "Admin" || userRole === "SuperAdmin");

  useEffect(() => {
    if (!isAdminUser) return;
    const unsub = onSnapshot(collection(db, "auditLogs"), (snap) => {
      const fetched = snap.docs.map((record) => ({ id: record.id, ...record.data() } as AuditLogEntry));
      fetched.sort((a, b) => {
        const tA = a.timestamp?.toMillis?.() || 0;
        const tB = b.timestamp?.toMillis?.() || 0;
        return tB - tA;
      });
      setAuditLogs(fetched);
    }, (e) => console.warn("Audit log listener warning:", e));
    return () => unsub();
  }, [isAdminUser]);

  // Setters with Firestore persistence & audit logging
  const setChurchInfo = (info: ChurchInfo) => {
    setChurchInfoState(info);
    // Payment credentials are excluded from church_info (public doc) by the
    // rules schema — they are managed via settings/payfast_credentials.
    const { payfast: _payfast, ...publicInfo } = info;
    setDoc(doc(db, "settings", "church_info"), { ...publicInfo, updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setWebsiteSettings = (settings: WebsiteSettings) => {
    setWebsiteSettingsState(settings);
    setDoc(doc(db, "settings", "website_settings"), { ...settings, updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setHomepageHero = (hero: HomepageHero) => {
    setHomepageHeroState(hero);
    setDoc(doc(db, "settings", "homepage_hero"), { ...hero, updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setMinistries = (minList: Ministry[]) => setMinistriesState(minList);
  const setEvents = (evtList: ChurchEvent[]) => setEventsState(evtList);
  const setVideos = (vidList: SermonVideo[]) => setVideosState(vidList);
  const setDonations = (donList: DonationRecord[]) => setDonationsState(donList);
  const setMembers = (memList: Member[]) => setMembersState(memList);
  const setAttendance = (attList: AttendanceRecord[]) => setAttendanceState(attList);
  const setMessages = (msgList: ContactMessage[]) => {
    setMessagesState(msgList);
  };
  const setConnectSubmissions = (subs: ConnectFormSubmission[]) => {
    setConnectSubmissionsState(subs);
  };
  const setGoogleReviews = (reviews: GoogleReview[]) => setGoogleReviewsState(reviews);
  const setPagesData = (pages: EditablePage[]) => {
    setPagesDataState(pages);
    setDoc(doc(db, "settings", "pages_data"), { list: cleanData(pages), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  // Helper action generators
  const addMessage = (name: string, email: string, subject: string, message: string, phone?: string) => {
    const newMessage: ContactMessage = {
      id: "msg_" + Date.now(),
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString(),
      status: "Unread"
    };
    setMessagesState((prev) => {
      const next = [cleanData(newMessage), ...prev];
      return next;
    });
    addDoc(collection(db, "contactMessages"), {
      ...cleanData(newMessage),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: "public-website"
    }).catch((e) => console.warn("Contact message delivery failed:", e));
  };

  const addConnectSubmission = (
    type: ConnectFormSubmission["type"],
    name: string,
    details: string,
    email?: string,
    phone?: string
  ) => {
    const newSubmission: ConnectFormSubmission = {
      id: "sub_" + Date.now(),
      type,
      name,
      email,
      phone,
      details,
      timestamp: new Date().toISOString(),
      status: "Pending"
    };
    setConnectSubmissionsState((prev) => {
      const next = [cleanData(newSubmission), ...prev];
      return next;
    });
    const collectionName = type === "Prayer"
      ? "prayerRequests"
      : type === "NewMember" && !!email
        ? "memberApplications"
        : "visitors";
    // Each collection has a strict rules schema: only allowlisted fields are
    // accepted, so the payloads below are deliberately minimal.
    if (collectionName === "prayerRequests") {
      addDoc(collection(db, "prayerRequests"), {
        requestText: details,
        requesterName: name,
        isAnonymous: false,
        isPrivate: true,
        permissionToContact: !!email || !!phone,
        ownerId: currentUser?.uid || null,
        status: "New",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((e) => console.warn("Prayer request delivery failed:", e));
    } else if (collectionName === "memberApplications") {
      const nameParts = name.split(" ").filter(Boolean);
      addDoc(collection(db, "memberApplications"), {
        id: "app_" + Date.now(),
        firstName: nameParts[0] || name,
        lastName: nameParts.slice(1).join(" ") || nameParts[0] || name,
        email: email || "",
        phone: phone || "",
        suburb: "",
        joinedDate: new Date().toISOString().split("T")[0],
        ministries: [],
        status: "Pending",
        createdBy: currentUser?.uid || null,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((e) => console.warn("Membership application delivery failed:", e));
    } else {
      addDoc(collection(db, "visitors"), {
        name,
        email: email || "",
        phone: phone || "",
        details,
        type,
        status: "New",
        source: "public-website",
        ownerId: currentUser?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((e) => console.warn("Connection form delivery failed:", e));
    }
  };

  const addDonation = (
    amount: number,
    fund: string,
    firstName: string,
    lastName: string,
    email: string,
    type: "One-off" | "Recurring"
  ) => {
    const newDonation: DonationRecord = {
      id: "d_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      amount,
      fund,
      firstName: firstName || "Anonymous",
      lastName,
      email,
      type
    };
    setDonationsState((prev) => {
      const next = [cleanData(newDonation), ...prev];
      return next;
    });
    // Donation records are server-written only (rules deny all client writes).
    // The callable verifies the caller is linked to the donation email and
    // stamps the record with status PENDING.
    httpsCallable(getFunctions(), "recordOfflineDonation")({
      amount,
      fund,
      firstName,
      lastName,
      email
    }).catch((e) => console.warn("Donation record delivery failed:", e));
  };

  const setBankingDetails = (details: BankingDetails) => {
    setBankingDetailsState(details);
    setDoc(doc(db, "settings", "banking_details"), { ...details, updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setYoutubeChannels = (channels: YoutubeChannel[]) => {
    setYoutubeChannelsState(channels);
    setDoc(doc(db, "settings", "youtube_channels"), { channels: cleanData(channels), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const addYoutubeChannel = (url: string, channelName?: string) => {
    const trimmedUrl = url.trim();
    const handleMatch = trimmedUrl.match(/@([a-zA-Z0-9_-]+)/);
    const ucMatch = trimmedUrl.match(/(UC[A-Za-z0-9_-]{22})/);
    const newChan: YoutubeChannel = {
      id: "yt_" + Date.now(),
      url: trimmedUrl,
      channelName: channelName?.trim() || (handleMatch ? `@${handleMatch[1]}` : (ucMatch ? ucMatch[1] : "YouTube Channel")),
      channelHandle: handleMatch ? `@${handleMatch[1]}` : undefined,
      addedAt: new Date().toISOString().split("T")[0]
    };
    setYoutubeChannelsState((prev) => {
      const next = [newChan, ...prev];
      setDoc(doc(db, "settings", "youtube_channels"), { channels: cleanData(next), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const deleteYoutubeChannel = (id: string) => {
    setYoutubeChannelsState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setDoc(doc(db, "settings", "youtube_channels"), { channels: next, updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const addMember = (
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    suburb: string,
    chosenMinistries: string[],
    extra?: Partial<Member>
  ) => {
    const newMember: Member = {
      id: "m_u" + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      suburb,
      joinedDate: new Date().toISOString().split("T")[0],
      ministries: chosenMinistries,
      status: "Active",
      ownerId: currentUser?.uid || null,
      pin: extra?.pin || generateMemberPin(),
      ...extra
    };
    setMembersState((prev) => {
      const next = [...prev, cleanData(newMember)];
      return next;
    });
    // PINs are never written to the member document. They are stored
    // hashed server-side via the setMemberPin callable.
    const { pin: memberPin, ...memberWithoutPin } = newMember;
    // Only staff can write directly to /members. Everyone else creates a
    // membership application that staff review and approve. The PIN is
    // registered server-side (hashed) for BOTH paths so the member can
    // immediately unlock their dashboard with the PIN shown at signup.
    if (STAFF_ROLES.includes(userRole as UserRole)) {
      setDoc(doc(db, "members", newMember.id), {
        ...cleanData(memberWithoutPin),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || null,
        updatedBy: currentUser?.uid || null,
        ownerId: currentUser?.uid || null,
        archived: false
      }).catch((e) => console.warn("Member record delivery failed:", e));
      setMemberPin(newMember.id, memberPin).catch((e) => console.warn("Member PIN setup failed:", e));
    } else {
      // Applications carry no PIN and are always Pending (rules schema).
      // ownerId links the application to the signed-in user so their PIN can
      // be registered and the application can be matched back to them.
      setDoc(doc(db, "memberApplications", newMember.id), {
        ...cleanData(memberWithoutPin),
        status: "Pending",
        createdBy: currentUser?.uid || null,
        ownerId: currentUser?.uid || null,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((e) => console.warn("Membership application delivery failed:", e));
      setMemberPin(newMember.id, memberPin).catch((e) => console.warn("Member PIN setup failed:", e));
    }
    return newMember;
  };

  const updateMember = (updatedMember: Member) => {
    setMembersState((prev) => {
      const next = prev.map((m) => (m.id === updatedMember.id ? cleanData(updatedMember) : m));
      // PIN changes are applied via the setMemberPin callable — the member
      // document itself never carries a PIN.
      const { pin: _pin, ...memberWithoutPin } = updatedMember;
      setDoc(doc(db, "members", updatedMember.id), { ...cleanData(memberWithoutPin), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  // Self-service profile edit (member dashboard). Only profile fields are
  // sent so the write passes the members self-edit rules branch, which never
  // permits status/archived/identity changes from a member.
  const updateMemberProfile = (updatedMember: Member) => {
    const allowed: Partial<Member> = {
      firstName: updatedMember.firstName,
      lastName: updatedMember.lastName,
      phone: updatedMember.phone,
      email: updatedMember.email,
      suburb: updatedMember.suburb,
      dob: updatedMember.dob,
      baptismStatus: updatedMember.baptismStatus,
      emergencyContact: updatedMember.emergencyContact,
      ministries: updatedMember.ministries,
      photo: updatedMember.photo
    };
    setMembersState((prev) => {
      const next = prev.map((m) => (m.id === updatedMember.id ? { ...m, ...allowed, id: m.id } : m));
      setDoc(doc(db, "members", updatedMember.id), {
        ...cleanData(allowed),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      }, { merge: true }).catch((e) => console.warn("Profile sync:", e));
      return next;
    });
  };

  const deleteMember = (id: string) => {
    setMembersState((prev) => {
      const next = prev.filter((m) => m.id !== id);
      import("firebase/firestore").then(({ deleteDoc }) => {
        deleteDoc(doc(db, "members", id)).catch((e) => console.warn("Firestore sync:", e));
      });
      return next;
    });
  };

  const bulkAddMembers = (newMembers: Partial<Member>[]): Promise<boolean> => {
    if (newMembers.length === 0) return Promise.resolve(false);
    const batch = writeBatch(db);
    const addedMembers: Member[] = [];
    
    newMembers.forEach((memberData) => {
      const newId = "m_u" + Math.random().toString(36).substr(2, 9);
      const newMember: Member = {
        id: newId,
        firstName: memberData.firstName || "",
        lastName: memberData.lastName || "",
        email: memberData.email || "",
        phone: memberData.phone || "",
        suburb: memberData.suburb || "Unknown",
        joinedDate: memberData.joinedDate || new Date().toISOString().split("T")[0],
        ministries: memberData.ministries || [],
        status: memberData.status === "Inactive" ? "Inactive" : "Active",
        pin: memberData.pin || generateMemberPin(),
        ...memberData
      };
      addedMembers.push(newMember);
      const { pin: memberPin, ...memberWithoutPin } = newMember;
      batch.set(doc(collection(db, "members"), newId), {
        ...cleanData(memberWithoutPin),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || null,
        updatedBy: currentUser?.uid || null,
        archived: false
      });
      // PINs are hashed and stored server-side via the callable.
      setMemberPin(newId, memberPin).catch((e) => console.warn("Member PIN setup failed:", e));
    });

    return batch.commit().then(() => {
      setMembersState((prev) => [...prev, ...addedMembers]);
      return true;
    }).catch((e) => {
      console.warn("Bulk add members failed", e);
      return false;
    });
  };

  const checkInMember = async (credential: string, serviceName: string, pin?: string): Promise<string> => {
    const foundMember = members.find((m) => m.id === credential || m.email.toLowerCase() === credential.toLowerCase() || m.phone.replace(/\s+/g, "") === credential.replace(/\s+/g, ""));

    // Optimistic local record when resolvable (display only — the
    // authoritative record is stamped server-side by recordAttendance).
    if (foundMember) {
      const record: AttendanceRecord = {
        id: "att_" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        serviceName,
        memberId: foundMember.id,
        memberName: `${foundMember.firstName} ${foundMember.lastName}`,
        memberEmail: foundMember.email,
        timestamp: new Date().toLocaleTimeString()
      };
      setAttendanceState((prev) => {
        const next = [cleanData(record), ...prev];
        return next;
      });
    }

    // The callable resolves the credential (member id / email / phone)
    // server-side and verifies the PIN there — client data is never trusted.
    try {
      await httpsCallable(getFunctions(), "recordAttendance")({
        identifier: credential,
        serviceName,
        pin: pin || ""
      });
      return foundMember
        ? `Success: ${foundMember.firstName} ${foundMember.lastName} checked in successfully for ${serviceName}.`
        : `Success: Checked in successfully for ${serviceName}.`;
    } catch (err) {
      console.warn("Attendance sync:", err);
      return `Error: Check-in was not recorded (${err instanceof Error ? err.message : "permission denied"}).`;
    }
  };

  const checkInGuest = async (name: string, phone: string, whatsapp: string, email: string): Promise<string> => {
    // The guestCheckIn callable creates the visitor record AND the attendance
    // record server-side with rate limiting — clients cannot spoof them.
    try {
      await httpsCallable(getFunctions(), "guestCheckIn")({
        name,
        phone,
        whatsapp,
        email,
        serviceName: "Guest Check-in"
      });
      return `Success: Welcome ${name}! You have checked in successfully.`;
    } catch (err) {
      console.warn("Guest check-in failed:", err);
      return `Error: Check-in was not recorded (${err instanceof Error ? err.message : "permission denied"}).`;
    }
  };

  const verifyMemberPin = async (identifier: string, pin: string): Promise<{ success: boolean; memberId: string }> => {
    const result = await httpsCallable<{ identifier: string; pin: string }, { success: boolean; memberId: string }>(getFunctions(), "verifyMemberPin")({ identifier, pin });
    return result.data;
  };

  const setMemberPin = async (memberId: string, pin: string): Promise<void> => {
    await httpsCallable<{ memberId: string; pin: string }, { success: boolean }>(getFunctions(), "setMemberPin")({ memberId, pin });
  };


  const rsvpEvent = (eventId: string, name?: string, email?: string) => {
    let status = "Registered";
    let ticketId = `FFM-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    setEventsState((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          // Demo capacity limit of 50 for Waitlist logic
          const isFull = e.rsvpCount >= 50;
          if (isFull) {
            status = "Waitlisted";
          }
          return { ...e, rsvpCount: e.rsvpCount + 1 };
        }
        return e;
      })
    );

    // Persist the RSVP: a registration record plus an atomic rsvpCount bump.
    // Rules let any signed-in user change only the rsvpCount field.
    const registrationId = `rsvp_${eventId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setDoc(doc(db, "eventRegistrations", registrationId), {
      id: registrationId,
      eventId,
      name: name?.trim() || "",
      email: email?.trim() || "",
      status,
      ticketId,
      ownerId: currentUser?.uid || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch((e) => console.warn("RSVP persistence failed:", e));
    updateDoc(doc(db, "events", eventId), { rsvpCount: increment(1) })
      .catch((e) => console.warn("RSVP count update failed:", e));

    return { status, ticketId };
  };

  const addEvent = (event: ChurchEvent) => {
    setEventsState((prev) => {
      const next = [event, ...prev];
      return next;
    });
    setDoc(doc(db, "events", event.id), { ...cleanData(event), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: currentUser?.uid || null, updatedBy: currentUser?.uid || null, archived: false }).catch((e) => console.warn("Event delivery failed:", e));
  };

  const updateEvent = (event: ChurchEvent) => {
    setEventsState((prev) => {
      const next = prev.map((e) => (e.id === event.id ? event : e));
      return next;
    });
    setDoc(doc(db, "events", event.id), { ...cleanData(event), updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Event update failed:", e));
  };

  const deleteEvent = (id: string) => {
    setEventsState((prev) => {
      return prev.filter((e) => e.id !== id);
    });
    import("firebase/firestore").then(({ deleteDoc }) => {
      deleteDoc(doc(db, "events", id)).catch((e) => console.warn("Event delete failed:", e));
    });
  };

  const addMinistry = (ministry: Ministry) => {
    setMinistriesState((prev) => {
      const next = [ministry, ...prev];
      return next;
    });
    setDoc(doc(db, "ministries", ministry.id), { ...cleanData(ministry), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: currentUser?.uid || null, updatedBy: currentUser?.uid || null, archived: false }).catch((e) => console.warn("Ministry delivery failed:", e));
  };

  const updateMinistry = (ministry: Ministry) => {
    setMinistriesState((prev) => {
      const next = prev.map((m) => (m.id === ministry.id ? ministry : m));
      return next;
    });
    setDoc(doc(db, "ministries", ministry.id), { ...cleanData(ministry), updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Ministry update failed:", e));
  };

  const deleteMinistry = (id: string) => {
    setMinistriesState((prev) => {
      return prev.filter((m) => m.id !== id);
    });
    setDoc(doc(db, "ministries", id), { archived: true, active: false, updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Ministry archive failed:", e));
  };

  const addSermon = (sermon: SermonVideo) => {
    setVideosState((prev) => {
      const next = [sermon, ...prev];
      return next;
    });
    setDoc(doc(db, "sermons", sermon.id), { ...cleanData(sermon), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: currentUser?.uid || null, updatedBy: currentUser?.uid || null, archived: false }).catch((e) => console.warn("Sermon delivery failed:", e));
  };

  const deleteSermon = (id: string) => {
    setVideosState((prev) => {
      return prev.filter((v) => v.id !== id);
    });
    setDoc(doc(db, "sermons", id), { archived: true, status: "Archived", updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null }, { merge: true }).catch((e) => console.warn("Sermon archive failed:", e));
  };
  const syncGoogleReviews = async (): Promise<boolean> => {
    try {
      const metaEnv = (import.meta as any).env;
      const apiKey = (metaEnv?.VITE_GOOGLE_MAPS_API_KEY as string) || (typeof process !== "undefined" ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : "");
      if (!apiKey) {
        console.warn("Google Reviews sync unavailable: VITE_GOOGLE_MAPS_API_KEY is not configured.");
        return false;
      }
      const placeId = "ChIJN1t_rB02L4gR6O_5x8P1w3Y";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
      );
      if (!response.ok) {
        console.warn("Google Reviews API returned an error:", response.status);
        return false;
      }
      const data = await response.json();
      if (data.error_message) {
        console.warn("Google Reviews API error:", data.error_message);
        return false;
      }
      if (!Array.isArray(data.result?.reviews) || data.result.reviews.length === 0) {
        setGoogleReviewsState([]);
        setGoogleReviewsCachedState(false);
        return true;
      }
      const fetched: GoogleReview[] = data.result.reviews.map((r: any, i: number) => ({
        id: `gr_live_${i}_${Date.now()}`,
        author_name: r.author_name || "Google Reviewer",
        rating: r.rating || 5,
        text: r.text || "",
        profile_photo_url: r.profile_photo_url,
        relative_time_description: r.relative_time_description || "Recently",
        initials: r.author_name ? r.author_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "GR"
      }));
      setGoogleReviewsState(fetched);
      setGoogleReviewsCachedState(false);
      // Persist the live snapshot so other visitors see the same reviews.
      // The snapshot is stored as a cache (isCached: true) — only the
      // session that just fetched marks it as live.
      setDoc(doc(db, "settings", "google_reviews"), {
        reviews: cleanData(fetched),
        syncedAt: serverTimestamp(),
        isCached: true,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      }).catch((e) => console.warn("Google reviews persistence failed:", e));
      return true;
    } catch (err) {
      console.warn("Google Reviews API fetch failed:", err);
      return false;
    }
  };

  const addCareCase = (memberId: string, memberName: string, type: string, pastor: string, notes: string) => {
    const newCase: CareCase = {
      id: "CASE-" + Math.floor(Math.random() * 10000),
      type,
      member: memberName,
      pastor,
      status: "Active",
      date: "Just now",
      fullDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      confidentialNotes: notes,
      visits: []
    };
    
    setCareCasesState((prev) => [cleanData(newCase), ...prev]);
    // The case id doubles as the Firestore document id so later updates can
    // target the exact document inside a transaction.
    setDoc(doc(db, "pastoral_care", newCase.id), {
      ...cleanData(newCase),
      memberId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(e => console.warn("Failed to add care case", e));
  };

  // Transactional update helper for care-case documents. Falls back to a
  // best-effort scan for legacy records written with a random doc id.
  const updateCareCaseDoc = (id: string, patch: Record<string, unknown>, readAppend: (existing: Record<string, unknown>) => Record<string, unknown>) => {
    runTransaction(db, async (tx) => {
      const snap = await tx.get(doc(db, "pastoral_care", id));
      if (!snap.exists()) throw new Error("case-missing");
      tx.update(snap.ref, { ...readAppend(snap.data()), ...patch, updatedAt: serverTimestamp() });
    }).catch((e) => {
      if ((e as Error)?.message !== "case-missing") {
        console.warn("Failed to update care case", e);
        return;
      }
      getDocs(collection(db, "pastoral_care")).then(snap => {
        const target = snap.docs.find(d => d.data().id === id);
        if (target) {
          setDoc(target.ref, { ...readAppend(target.data()), ...patch, updatedAt: serverTimestamp() }, { merge: true })
            .catch((err) => console.warn("Failed to update care case (legacy)", err));
        }
      });
    });
  };

  const updateCareCaseStatus = (id: string, status: string) => {
    setCareCasesState((prev) => prev.map(c => c.id === id ? { ...c, status } : c));
    updateCareCaseDoc(id, { status }, () => ({}));
  };

  const updateCareCaseNotes = (id: string, newNote: string) => {
    const time = new Date().toLocaleDateString();
    const noteText = `\n\n[${time}] ${newNote}`;
    setCareCasesState((prev) => prev.map(c => c.id === id ? { ...c, confidentialNotes: c.confidentialNotes + noteText } : c));
    updateCareCaseDoc(id, {}, (existing) => ({
      confidentialNotes: (existing.confidentialNotes as string) + noteText
    }));
  };

  const addCareVisit = (id: string, visit: CareVisit) => {
    setCareCasesState((prev) => prev.map(c => c.id === id ? { ...c, visits: [visit, ...c.visits] } : c));
    updateCareCaseDoc(id, {}, (existing) => ({
      visits: [visit, ...((existing.visits as CareVisit[]) || [])]
    }));
  };

  const addAuditLog = (action: string, category: string, detail: string, status = "SUCCESS") => {
    // Audit logs are server-written only; the callable verifies the caller
    // holds a staff claim and stamps the record server-side.
    httpsCallable(getFunctions(), "logAuditAction")({
      action,
      resource: category,
      detail: `${detail} | status=${status}`
    }).catch((e) => console.warn("Audit log creation failed:", e));
  };

  const contextValue = {
    currentUser,
    userRole,
    authLoading,
    churchInfo,
    setChurchInfo,
    websiteSettings,
    setWebsiteSettings,
    homepageHero,
    setHomepageHero,
    bankingDetails,
    setBankingDetails,
    youtubeChannels,
    setYoutubeChannels,
    addYoutubeChannel,
    deleteYoutubeChannel,
    ministries,
    setMinistries,
    events,
    setEvents,
    videos,
    setVideos,
    donations,
    setDonations,
    members,
    setMembers,
    attendance,
    setAttendance,
    messages,
    setMessages,
    connectSubmissions,
    setConnectSubmissions,
    addMessage,
    addConnectSubmission,
    addDonation,
    addMember,
    updateMember,
    updateMemberProfile,
    deleteMember,
    checkInMember,
    checkInGuest,
    verifyMemberPin,
    setMemberPin,
    rsvpEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    addMinistry,
    updateMinistry,
    deleteMinistry,
    addSermon,
    deleteSermon,
    careCases,
    setCareCases: setCareCasesState,
    addCareCase,
    updateCareCaseStatus,
    updateCareCaseNotes,
    addCareVisit,
    bulkAddMembers,
    selectedMinistryId,
    setSelectedMinistryId,
    selectedEventId,
    setSelectedEventId,
    googleReviews,
    setGoogleReviews,
    googleReviewsCached,
    syncGoogleReviews,
    addAuditLog,
    pagesData,
    setPagesData,
    users,
    auditLogs,
    visitors,
    campaigns
  };

  return (
    <ChurchContext.Provider value={contextValue}>
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error("useChurch must be used within a ChurchProvider");
  }
  return context;
};
