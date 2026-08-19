import React, { useState } from "react";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { useChurch } from "../context/ChurchContext";
import { LogIn, UserPlus, KeyRound, LogOut, CheckCircle, AlertCircle, Mail, Lock, User, Phone, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onNavigate?: (tab: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser, onNavigate }) => {
  const { addMember, members, userRole } = useChurch();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const checkRoleAndRedirect = async (user: FirebaseUser) => {
    let targetTab = "member-dashboard";
    try {
      const tokenResult = await user.getIdTokenResult(true).catch(() => null);
      const roleFromClaim = tokenResult?.claims?.role as string | undefined;
      const adminRoles = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"];
      
      if (roleFromClaim && adminRoles.includes(roleFromClaim)) {
        targetTab = "admin";
      } else if (userRole && adminRoles.includes(userRole)) {
        targetTab = "admin";
      }
    } catch (err) {
      console.warn("Unable to resolve access role from Firebase claims.", err);
    }

    setSuccess(`Signed in! Directing to ${targetTab === "admin" ? "Admin Portal" : "Member Portal"}...`);
    setTimeout(() => {
      onNavigate?.(targetTab);
      onClose();
    }, 900);
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user is already a member record, if not add them
      const existing = members.find((m) => m.email.toLowerCase() === (user.email || "").toLowerCase());
      let createdPin: string | undefined;
      if (!existing && user.displayName) {
        const parts = user.displayName.split(" ");
        const fName = parts[0] || "Member";
        const lName = parts.slice(1).join(" ") || "User";
        const created = addMember(fName, lName, user.email || "", "", "Johannesburg", ["m1"], {
          photo: user.photoURL || undefined
        });
        createdPin = created.pin;
      }

      if (createdPin) {
        setSuccess(`Signed in! Your member profile Security PIN is ${createdPin}. Keep it safe — you will need it to unlock your dashboard.`);
      }
      await checkRoleAndRedirect(user);
    } catch (err: any) {
      console.error("Google auth error:", err);
      let msg = err.message || "Failed to sign in with Google.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Google sign-in popup was closed before completing.";
      } else if (err.code === "auth/popup-blocked") {
        msg = "Pop-up window was blocked by browser. Please allow popups for authentication.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await checkRoleAndRedirect(user);
    } catch (err: any) {
      console.error("Email sign-in error:", err);
      let msg = "Failed to sign in. Please verify your email and password.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email address or password. Please check your credentials.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-in is not enabled in your Firebase Project Console. Please enable it in Firebase Authentication settings.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access to this account has been temporarily disabled due to many failed login attempts.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password || !firstName || !lastName) {
      setError("Please complete all required fields (First Name, Last Name, Email, and Password).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName: fullName });

      // Create a member application (or member record for staff). The profile
      // PIN is generated server-safe locally and shown once so the user can
      // unlock their dashboard later.
      const created = addMember(firstName, lastName, email, phone, suburb || "Johannesburg", ["m1"]);
      const profilePin = created.pin;

      setSuccess(`Account created successfully! Welcome to Faith & Fire Ministries, ${firstName}. Your profile Security PIN is ${profilePin}. Keep it safe — you need it to unlock your dashboard.`);
      setTimeout(() => {
        onClose();
      }, 5000);
    } catch (err: any) {
      console.error("Email sign-up error:", err);
      let msg = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email address already exists. Please sign in instead.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-up is not enabled in Firebase Console. Please enable it in Firebase Authentication > Sign-in method.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 6 characters with numbers or letters.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Failed to send password reset email. Please ensure the email is correct.");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signOut(auth);
      setSuccess("You have been signed out successfully.");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError("Error signing out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden relative max-w-4xl w-full flex flex-col md:flex-row min-h-[500px]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-neutral-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* LEFT COLUMN: Form side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative bg-white overflow-y-auto">
          {/* Logo area */}
          <div className="mb-8 flex items-center gap-3">
            <img src="/images/Logo.png" alt="Faith & Fire Logo" className="h-10 object-contain" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#0A192F] uppercase tracking-tight">
              {currentUser ? "Welcome Back" : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-neutral-500 text-sm mt-1">
              {currentUser
                ? "Manage your authenticated church session."
                : mode === "signin"
                ? "Please enter your details to sign in."
                : mode === "signup"
                ? "Join our community and create your profile."
                : "Enter your email to receive recovery instructions."}
            </p>
          </div>

          {/* Notifications */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2 mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2 mb-4 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* IF ALREADY LOGGED IN */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#0F2342] text-white flex items-center justify-center font-black text-xl overflow-hidden border-2 border-amber-400 shadow-sm shrink-0">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(currentUser.displayName || currentUser.email || "M").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block">
                    Authenticated Account
                  </span>
                  <h4 className="font-bold text-[#0A192F] text-base truncate">
                    {currentUser.displayName || "Church Member"}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const adminRoles = ["SuperAdmin", "Admin", "Pastor", "Minister", "DepartmentLeader"];
                    const isAdmin = !!userRole && adminRoles.includes(userRole);
                    onNavigate?.(isAdmin ? "admin" : "member-dashboard");
                    onClose();
                  }}
                  className="bg-[#0A192F] hover:bg-[#0F2342] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                >
                  <span>Open Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* GOOGLE SIGN-IN BUTTON */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-4 rounded-xl text-[13px] flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm mb-6"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center mb-6">
                <div className="flex-1 border-t border-neutral-200"></div>
                <span className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Or continue with email
                </span>
                <div className="flex-1 border-t border-neutral-200"></div>
              </div>

              {/* MODE: SIGN IN */}
              {mode === "signin" && (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode("reset"); }}
                      className="text-[11px] font-bold text-[#0A192F] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0A192F] hover:bg-[#0F2342] text-white font-bold py-3.5 px-4 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0A192F]/20"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-neutral-500">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode("signup"); }}
                      className="text-xs font-bold text-[#ea580c] hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              )}

              {/* MODE: SIGN UP */}
              {mode === "signup" && (
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                      Password (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0A192F] hover:bg-[#0F2342] text-white font-bold py-3.5 px-4 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0A192F]/20"
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-neutral-500">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode("signin"); }}
                      className="text-xs font-bold text-[#0A192F] hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* MODE: RESET PASSWORD */}
              {mode === "reset" && (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0A192F] hover:bg-[#0F2342] text-white font-bold py-3.5 px-4 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0A192F]/20"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode("signin"); }}
                      className="text-xs font-bold text-neutral-500 hover:text-[#0A192F] transition-colors cursor-pointer"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Branding side */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#1e1548] to-[#0A192F] relative p-12 flex-col justify-between overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#ea580c] rounded-full mix-blend-screen filter blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#38bdf8] rounded-full mix-blend-screen filter blur-[80px]"></div>
          </div>

          <div className="relative z-10">
             
             <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-[1.1] mb-6">
               A Church Where Faith, Holiness and the Power of the Holy Spirit Meet
             </h3>
             
             <p className="text-sky-100 text-sm leading-relaxed max-w-sm">
               Our vision is to make the world pleasing to God through the Word of Faith, Holiness, and the power of the Holy Spirit. Join our community and experience transformation today.
             </p>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A192F] bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                     <User className="w-4 h-4 text-white/70" />
                   </div>
                 ))}
              </div>
              <div className="text-xs text-sky-200 font-medium">
                Join over <strong className="text-white font-bold">1,000+</strong> active members
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
