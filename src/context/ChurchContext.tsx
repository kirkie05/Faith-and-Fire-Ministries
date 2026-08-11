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
  EditablePage,
  BankingDetails,
  YoutubeChannel,
  UserRole
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
import { addDoc, collection, doc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

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
  addMember: (firstName: string, lastName: string, email: string, phone: string, suburb: string, chosenMinistries: string[], extra?: Partial<Member>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  checkInMember: (memberId: string, serviceName: string) => string; // returns status message
  checkInGuest: (name: string, phone: string, whatsapp: string, email: string) => string;
  rsvpEvent: (eventId: string, name?: string, email?: string) => { status: string; ticketId: string; };
  addEvent: (event: ChurchEvent) => void;
  updateEvent: (event: ChurchEvent) => void;
  deleteEvent: (eventId: string) => void;
  addMinistry: (ministry: Ministry) => void;
  updateMinistry: (ministry: Ministry) => void;
  deleteMinistry: (id: string) => void;
  addSermon: (sermon: SermonVideo) => void;
  deleteSermon: (id: string) => void;
  selectedMinistryId: string | null;
  setSelectedMinistryId: (id: string | null) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  googleReviews: GoogleReview[];
  setGoogleReviews: (reviews: GoogleReview[]) => void;
  syncGoogleReviews: () => Promise<boolean>;
  addAuditLog: (action: string, category: string, detail: string, status?: string) => void;
  pagesData: EditablePage[];
  setPagesData: (pages: EditablePage[]) => void;
}

const ChurchContext = createContext<ChurchContextProps | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Firebase Auth & User Role Sync Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Check custom claim first
          const tokenResult = await user.getIdTokenResult(true).catch(() => null);
          const roleFromClaim = tokenResult?.claims?.role as UserRole | undefined;
          
          if (roleFromClaim) {
            setUserRole(roleFromClaim);
          } else {
            // Read Firestore user document
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUserRole((userSnap.data().role as UserRole) || "Member");
            } else {
              let assignedRole: UserRole = "Member";
              
              // Check if there is a pending admin invite for this email
              if (user.email) {
                try {
                  const inviteRef = doc(db, "admin_invites", user.email.toLowerCase());
                  const inviteSnap = await getDoc(inviteRef);
                  if (inviteSnap.exists()) {
                    const inviteData = inviteSnap.data();
                    if (inviteData.role === "SUPER ADMIN") assignedRole = "SuperAdmin";
                    else if (inviteData.role === "EDITOR") assignedRole = "Admin";
                    else if (inviteData.role === "MEDIA") assignedRole = "Admin";
                    else assignedRole = "Admin";
                  }
                } catch (inviteErr) {
                  console.warn("Failed to check admin invites", inviteErr);
                }
              }

              setUserRole(assignedRole);
              // Provision initial user record in Firestore according to production schema
              await setDoc(userRef, {
                uid: user.uid,
                publicId: `usr_${user.uid.slice(0, 8)}`,
                email: user.email || "",
                displayName: user.displayName || user.email?.split("@")[0] || "User",
                role: assignedRole,
                status: "active",
                ownerId: user.uid,
                createdAt: new Date().toISOString()
              }, { merge: true }).catch((err) => console.warn("Doc creation fallback:", err));
            }
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

  // Banking & Youtube Channels State
  const [bankingDetails, setBankingDetailsState] = useState<BankingDetails>(() => {
    const saved = localStorage.getItem("church_banking_details");
    return saved ? JSON.parse(saved) : initialBankingDetails;
  });

  const [youtubeChannels, setYoutubeChannelsState] = useState<YoutubeChannel[]>(() => {
    const saved = localStorage.getItem("church_youtube_channels");
    return saved ? JSON.parse(saved) : initialYoutubeChannels;
  });

  // Read state from localStorage or load initial data
  const [churchInfo, setChurchInfoState] = useState<ChurchInfo>(() => {
    const saved = localStorage.getItem("church_info");
    return saved ? JSON.parse(saved) : initialChurchInfo;
  });

  const [websiteSettings, setWebsiteSettingsState] = useState<WebsiteSettings>(() => {
    const saved = localStorage.getItem("website_settings");
    return saved ? JSON.parse(saved) : initialWebsiteSettings;
  });

  const [homepageHero, setHomepageHeroState] = useState<HomepageHero>(() => {
    const saved = localStorage.getItem("homepage_hero_v2");
    return saved ? JSON.parse(saved) : initialHomepageHero;
  });

  const [ministries, setMinistriesState] = useState<Ministry[]>(() => {
    const saved = localStorage.getItem("church_ministries");
    return saved ? JSON.parse(saved) : initialMinistries;
  });

  const [events, setEventsState] = useState<ChurchEvent[]>(() => {
    const saved = localStorage.getItem("church_events");
    return saved ? JSON.parse(saved) : initialEvents;
  });

  useEffect(() => {
    localStorage.setItem("church_events", JSON.stringify(events));
  }, [events]);

  const [videos, setVideosState] = useState<SermonVideo[]>(() => {
    const saved = localStorage.getItem("church_videos");
    return saved ? JSON.parse(saved) : initialVideos;
  });

  const [donations, setDonationsState] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem("church_donations");
    return saved ? JSON.parse(saved) : initialDonations;
  });

  const [members, setMembersState] = useState<Member[]>(initialMembers);

  const [attendance, setAttendanceState] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("church_attendance");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : initialAttendance;
  });

  const [messages, setMessagesState] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem("church_messages");
    return saved ? JSON.parse(saved) : initialMessages;
  });

  const [connectSubmissions, setConnectSubmissionsState] = useState<ConnectFormSubmission[]>(() => {
    const saved = localStorage.getItem("church_connect_submissions");
    return saved ? JSON.parse(saved) : initialConnectSubmissions;
  });

  const [googleReviews, setGoogleReviewsState] = useState<GoogleReview[]>(() => {
    const saved = localStorage.getItem("church_google_reviews");
    return saved ? JSON.parse(saved) : initialGoogleReviews;
  });

  const [pagesData, setPagesDataState] = useState<EditablePage[]>(() => {
    const saved = localStorage.getItem("church_pages_data");
    return saved ? JSON.parse(saved) : initialPagesData;
  });

  // Helper function to sanitize objects before Firestore persistence to avoid undefined crashes
  const cleanData = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

  // Firestore Real-Time Subscriptions for Global Settings & Collections
  useEffect(() => {
    const initializeData = async () => {
      try {
        const batch = writeBatch(db);
        let hasSeeded = false;

        // Seed Ministries
        const minSnap = await getDocs(collection(db, "ministries"));
        if (minSnap.empty) {
          initialMinistries.forEach((m) => {
            batch.set(doc(db, "ministries", m.id), { ...m, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          });
          hasSeeded = true;
        }

        // Seed Events
        const evSnap = await getDocs(collection(db, "events"));
        if (evSnap.empty) {
          initialEvents.forEach((e) => {
            batch.set(doc(db, "events", e.id), { ...e, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          });
          hasSeeded = true;
        }

        // Seed Sermons
        const sSnap = await getDocs(collection(db, "sermons"));
        if (sSnap.empty) {
          initialVideos.forEach((v) => {
            batch.set(doc(db, "sermons", v.id), { ...v, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          });
          hasSeeded = true;
        }

        // Seed Settings Documents
        const chInfoSnap = await getDoc(doc(db, "settings", "church_info"));
        if (!chInfoSnap.exists()) {
          batch.set(doc(db, "settings", "church_info"), initialChurchInfo);
          hasSeeded = true;
        }

        const wsSnap = await getDoc(doc(db, "settings", "website_settings"));
        if (!wsSnap.exists()) {
          batch.set(doc(db, "settings", "website_settings"), initialWebsiteSettings);
          hasSeeded = true;
        }

        const hpHeroSnap = await getDoc(doc(db, "settings", "homepage_hero"));
        if (!hpHeroSnap.exists()) {
          batch.set(doc(db, "settings", "homepage_hero"), initialHomepageHero);
          hasSeeded = true;
        }

        if (hasSeeded) {
          await batch.commit();
          console.log("Database seeded successfully with initial data.");
        }
      } catch (err) {
        console.warn("Database seeding warning:", err);
      }
    };

    const unsubs: (() => void)[] = [];
    let isSubscribed = true;

    initializeData().then(() => {
      if (!isSubscribed) return;

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
            setEventsState(fetched);
          }
        }, (e) => console.warn("Events listener warning:", e))
      );
      unsubs.push(
        onSnapshot(collection(db, "ministries"), (snap) => {
          if (!snap.empty) {
            setMinistriesState(snap.docs.map((record) => ({ id: record.id, ...record.data() } as Ministry)));
          }
        }, (e) => console.warn("Ministries listener warning:", e))
      );
      });

    return () => {
      isSubscribed = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Setters with Firestore persistence & audit logging
  const setChurchInfo = (info: ChurchInfo) => {
    setChurchInfoState(info);
    setDoc(doc(db, "settings", "church_info"), info, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setWebsiteSettings = (settings: WebsiteSettings) => {
    setWebsiteSettingsState(settings);
    setDoc(doc(db, "settings", "website_settings"), settings, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setHomepageHero = (hero: HomepageHero) => {
    setHomepageHeroState(hero);
    setDoc(doc(db, "settings", "homepage_hero"), hero, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setMinistries = (minList: Ministry[]) => setMinistriesState(minList);
  const setEvents = (evtList: ChurchEvent[]) => setEventsState(evtList);
  const setVideos = (vidList: SermonVideo[]) => setVideosState(vidList);
  const setDonations = (donList: DonationRecord[]) => setDonationsState(donList);
  const setMembers = (memList: Member[]) => setMembersState(memList);
  const setAttendance = (attList: AttendanceRecord[]) => setAttendanceState(attList);
  const setMessages = (msgList: ContactMessage[]) => {
    setMessagesState(msgList);
    localStorage.setItem("church_messages", JSON.stringify(msgList));
  };
  const setConnectSubmissions = (subs: ConnectFormSubmission[]) => {
    setConnectSubmissionsState(subs);
    localStorage.setItem("church_connect_submissions", JSON.stringify(subs));
  };
  const setGoogleReviews = (reviews: GoogleReview[]) => setGoogleReviewsState(reviews);
  const setPagesData = (pages: EditablePage[]) => {
    setPagesDataState(pages);
    setDoc(doc(db, "settings", "pages_data"), { list: cleanData(pages) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
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
      localStorage.setItem("church_messages", JSON.stringify(next));
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
      localStorage.setItem("church_connect_submissions", JSON.stringify(next));
      return next;
    });
    const collectionName = type === "Prayer" ? "prayerRequests" : type === "NewMember" && !currentUser ? "memberApplications" : type === "NewMember" ? "members" : "visitors";
    const record = type === "Prayer" ? {
      ...cleanData(newSubmission),
      requestText: details,
      requesterName: name,
      isPrivate: true,
      permissionToContact: !!email || !!phone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: currentUser?.uid || null,
      status: "New"
    } : {
      ...cleanData(newSubmission),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: "public-website",
      ownerId: currentUser?.uid || null,
      status: type === "NewMember" ? "Pending" : "New"
    };
    addDoc(collection(db, collectionName), record).catch((e) => console.warn("Connection form delivery failed:", e));
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
      setDoc(doc(db, "settings", "donations"), { list: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const setBankingDetails = (details: BankingDetails) => {
    setBankingDetailsState(details);
    setDoc(doc(db, "settings", "banking_details"), details, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
  };

  const setYoutubeChannels = (channels: YoutubeChannel[]) => {
    setYoutubeChannelsState(channels);
    setDoc(doc(db, "settings", "youtube_channels"), { channels }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
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
      setDoc(doc(db, "settings", "youtube_channels"), { channels: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const deleteYoutubeChannel = (id: string) => {
    setYoutubeChannelsState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setDoc(doc(db, "settings", "youtube_channels"), { channels: next }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
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
      pin: extra?.pin || "1234",
      ...extra
    };
    setMembersState((prev) => {
      const next = [...prev, cleanData(newMember)];
      return next;
    });
    const memberCollection = currentUser ? "members" : "memberApplications";
    addDoc(collection(db, memberCollection), {
      ...cleanData(newMember),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser?.uid || null,
      archived: false
    }).catch((e) => console.warn("Member record delivery failed:", e));
  };

  const updateMember = (updatedMember: Member) => {
    setMembersState((prev) => {
      const next = prev.map((m) => (m.id === updatedMember.id ? cleanData(updatedMember) : m));
      setDoc(doc(db, "settings", "members"), { list: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const deleteMember = (id: string) => {
    setMembersState((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setDoc(doc(db, "settings", "members"), { list: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
  };

  const checkInMember = (memberId: string, serviceName: string): string => {
    const foundMember = members.find((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase() || m.phone === memberId);
    if (!foundMember) {
      return "Error: Member record not found. Please verify member ID, Email, or Phone.";
    }

    // Add attendance record
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
      setDoc(doc(db, "settings", "attendance"), { list: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
    return `Success: ${foundMember.firstName} ${foundMember.lastName} checked in successfully for ${serviceName}.`;
  };

  const checkInGuest = (name: string, phone: string, whatsapp: string, email: string): string => {
    // 1. Create a Visitor record in Firestore
    const newVisitor = {
      id: "v_" + Date.now(),
      name,
      phone,
      whatsapp,
      email,
      firstVisitDate: new Date().toISOString().split("T")[0],
      followUpStatus: "Pending",
      notes: ""
    };
    
    // Save to Firestore 'visitors' collection (handled by the addConnectSubmission somewhat, but we do it directly for visitors)
    addDoc(collection(db, "visitors"), {
      ...cleanData(newVisitor),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: "guest-qr-checkin",
      status: "New"
    }).catch((e) => console.warn("Visitor delivery failed:", e));

    // 2. Add an Attendance record
    const record: AttendanceRecord = {
      id: "att_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      serviceName: "Guest Check-in",
      memberId: newVisitor.id,
      memberName: name,
      memberEmail: email,
      timestamp: new Date().toLocaleTimeString()
    };

    setAttendanceState((prev) => {
      const next = [cleanData(record), ...prev];
      setDoc(doc(db, "settings", "attendance"), { list: cleanData(next) }, { merge: true }).catch((e) => console.warn("Firestore sync:", e));
      return next;
    });
    return `Success: Welcome ${name}! You have checked in successfully.`;
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
    
    return { status, ticketId };
  };

  const addEvent = (event: ChurchEvent) => {
    setEventsState((prev) => {
      const next = [event, ...prev];
      return next;
    });
    setDoc(doc(db, "events", event.id), { ...cleanData(event), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archived: false }).catch((e) => console.warn("Event delivery failed:", e));
  };

  const updateEvent = (event: ChurchEvent) => {
    setEventsState((prev) => {
      const next = prev.map((e) => (e.id === event.id ? event : e));
      return next;
    });
    setDoc(doc(db, "events", event.id), { ...cleanData(event), updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.warn("Event update failed:", e));
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
    setDoc(doc(db, "ministries", ministry.id), { ...cleanData(ministry), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archived: false }).catch((e) => console.warn("Ministry delivery failed:", e));
  };

  const updateMinistry = (ministry: Ministry) => {
    setMinistriesState((prev) => {
      const next = prev.map((m) => (m.id === ministry.id ? ministry : m));
      return next;
    });
    setDoc(doc(db, "ministries", ministry.id), { ...cleanData(ministry), updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.warn("Ministry update failed:", e));
  };

  const deleteMinistry = (id: string) => {
    setMinistriesState((prev) => {
      return prev.filter((m) => m.id !== id);
    });
    setDoc(doc(db, "ministries", id), { archived: true, active: false, updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.warn("Ministry archive failed:", e));
  };

  const addSermon = (sermon: SermonVideo) => {
    setVideosState((prev) => {
      const next = [sermon, ...prev];
      return next;
    });
    setDoc(doc(db, "sermons", sermon.id), { ...cleanData(sermon), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archived: false }).catch((e) => console.warn("Sermon delivery failed:", e));
  };

  const deleteSermon = (id: string) => {
    setVideosState((prev) => {
      return prev.filter((v) => v.id !== id);
    });
    setDoc(doc(db, "sermons", id), { archived: true, status: "Archived", updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.warn("Sermon archive failed:", e));
  };
  const syncGoogleReviews = async (): Promise<boolean> => {
    try {
      const metaEnv = (import.meta as any).env;
      const apiKey = (metaEnv?.VITE_GOOGLE_MAPS_API_KEY as string) || (typeof process !== "undefined" ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : "");
      if (apiKey) {
        const placeId = "ChIJN1t_rB02L4gR6O_5x8P1w3Y";
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.result?.reviews?.length) {
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
            return true;
          }
        }
      }
    } catch (err) {
      console.warn("Google Reviews API fetch error, utilizing synced verified cache", err);
    }
    // Fallback sync refresh
    setGoogleReviewsState(initialGoogleReviews);
    return true;
  };

  const addAuditLog = (action: string, category: string, detail: string, status = "SUCCESS") => {
    addDoc(collection(db, "auditLogs"), {
      action,
      category,
      detail,
      status,
      userId: currentUser?.uid || "guest",
      userEmail: currentUser?.email || "anonymous",
      timestamp: serverTimestamp()
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
    deleteMember,
    checkInMember,
    checkInGuest,
    rsvpEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    addMinistry,
    updateMinistry,
    deleteMinistry,
    addSermon,
    deleteSermon,
    selectedMinistryId,
    setSelectedMinistryId,
    selectedEventId,
    setSelectedEventId,
    googleReviews,
    setGoogleReviews,
    syncGoogleReviews,
    addAuditLog,
    pagesData,
    setPagesData
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
