import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Edit3,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserAccount } from "../types";
import { StorageService } from "../services/storage";
import { CrossTabSync } from "../services/crossTabSync";
import {
  signInWithGoogleFirebase,
  signInWithMicrosoftFirebase,
  signInWithEmailFirebase,
  signUpWithEmailFirebase,
  updateUserProfileName,
  signOutFirebase,
  deleteUserAccountFirebase,
} from "../services/firebase";

interface AccountModalProps {
  isOpen: boolean;
  currentUser?: UserAccount | null;
  onSuccess: (user: UserAccount) => void;
  onLogout?: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  currentUser: initialUser,
  onSuccess,
  onLogout,
  onClose,
  canClose = true,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(initialUser || StorageService.getCurrentUser());
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "switch_account">("profile");

  // Switch account state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [signUpName, setSignUpName] = useState("");

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const user = initialUser || StorageService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setNameInput(user.name);
        setActiveTab("profile");
      } else {
        setActiveTab("switch_account");
      }
      setError(null);
      setSuccessNotice(null);

      // Listen for cross-tab auth state changes in real time
      const unsubscribeCrossTab = CrossTabSync.subscribe((syncedUser) => {
        setCurrentUser(syncedUser);
        if (syncedUser) {
          setNameInput(syncedUser.name);
        } else {
          setActiveTab("switch_account");
        }
      });

      return () => {
        unsubscribeCrossTab();
      };
    }
  }, [isOpen, initialUser]);

  if (!isOpen) return null;

  // Save updated profile name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setError("Name cannot be empty.");
      return;
    }

    setIsLoading("saving_name");
    setError(null);
    try {
      await updateUserProfileName(cleanName);
      const updatedUser: UserAccount = {
        ...currentUser,
        name: cleanName,
      };
      StorageService.saveAccount(updatedUser);
      setCurrentUser(updatedUser);
      onSuccess(updatedUser);
      setIsEditingName(false);
      setSuccessNotice("Profile name successfully updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile name.");
    } finally {
      setIsLoading(null);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    setError(null);
    setSuccessNotice(null);
    try {
      const user = await signInWithGoogleFirebase();
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || user.name,
        method: "google",
        status: "success",
      });
      setCurrentUser(user);
      onSuccess(user);
      setSuccessNotice(`Signed in with Google as ${user.name}`);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed.");
      } else {
        setError(err.message || "Google sign-in failed.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  // Microsoft Sign In
  const handleMicrosoftSignIn = async () => {
    setIsLoading("microsoft");
    setError(null);
    setSuccessNotice(null);
    try {
      const user = await signInWithMicrosoftFirebase();
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || user.name,
        method: "microsoft",
        status: "success",
      });
      setCurrentUser(user);
      onSuccess(user);
      setSuccessNotice(`Signed in with Microsoft as ${user.name}`);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Microsoft sign-in popup was closed.");
      } else {
        setError(err.message || "Microsoft sign-in failed.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  // Permanently delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      // 1. Wipe local user data, cache, and conversations
      StorageService.clearAllData();
      // 2. Remove Firebase Auth user and Firestore entry
      await deleteUserAccountFirebase();
      // 3. Clear session and notify cross tab
      StorageService.setCurrentUser(null);
      CrossTabSync.broadcastLogout();
      setCurrentUser(null);
      setConfirmDeleteOpen(false);
      if (onLogout) {
        onLogout();
      }
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to permanently delete account.");
      setIsDeleting(false);
    }
  };

  // Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading("email");
    setError(null);
    setSuccessNotice(null);

    try {
      let user: UserAccount;
      if (emailMode === "signin") {
        user = await signInWithEmailFirebase(email, password);
      } else {
        user = await signUpWithEmailFirebase(email, password, signUpName);
      }
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || email,
        method: "email",
        status: "success",
      });
      setCurrentUser(user);
      onSuccess(user);
      setSuccessNotice(emailMode === "signin" ? `Signed in as ${user.name}` : `Account created for ${user.name}`);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Email authentication failed.");
    } finally {
      setIsLoading(null);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOutFirebase();
    StorageService.setCurrentUser(null);
    CrossTabSync.broadcastLogout();
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="account-modal-container"
        className="w-full max-w-md liquid-glass-panel border border-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100"
      >
        {/* Header */}
        <div className="relative p-5 text-center border-b border-white/10 bg-zinc-950/40">
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 p-0.5 backdrop-blur-xl flex items-center justify-center shadow-inner mb-2 border border-amber-500/30">
            <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-amber-400 font-extrabold text-lg border border-amber-500/30">
              VB
            </div>
          </div>

          <h3 className="text-base font-bold text-white">
            {currentUser ? "User Profile & Account" : "Sign In to VenkateshBhaiya"}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {currentUser
              ? currentUser.isGuest
                ? "Guest Explorer session active"
                : "Authenticated user account"
              : "Access your personalized assistant"}
          </p>

          {/* Navigation Tabs if user is logged in */}
          {currentUser && (
            <div className="flex items-center justify-center gap-2 mt-4 p-1 bg-zinc-900/60 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("switch_account");
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "switch_account"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Switch Account
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-zinc-950/20">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successNotice}</span>
            </div>
          )}

          {/* Profile Details Tab */}
          {activeTab === "profile" && currentUser && (
            <div className="space-y-4">
              {/* Guest Warning Banner */}
              {currentUser.isGuest && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Temporary Guest Mode</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    You are exploring as a temporary guest. Sign in with Google, Apple, or Email to permanently retain your chats and access them on any device.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("switch_account")}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Upgrade to Permanent Account
                  </button>
                </div>
              )}

              {/* Display Name Section */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Display Name
                  </span>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 rounded-xl border border-white/15 bg-zinc-950 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false);
                          setNameInput(currentUser.name);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading === "saving_name"}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-60"
                      >
                        {isLoading === "saving_name" ? "Saving..." : "Save Name"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-sm font-semibold text-white">
                    {currentUser.name}
                  </div>
                )}
              </div>

              {/* Account Meta */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2.5 text-xs">
                {currentUser.email && (
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400 font-medium">Verification Status</span>
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified (Private &amp; Confidential)</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400 font-medium">Auth Provider</span>
                  <span className="capitalize font-semibold text-amber-300">
                    {currentUser.provider || "Standard"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400 font-medium">Verified User ID</span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {currentUser.id.length > 18 ? currentUser.id.slice(0, 18) + "..." : currentUser.id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400 font-medium">Member Since</span>
                  <span className="text-zinc-300">{currentUser.createdAt}</span>
                </div>
              </div>

              {/* Account Actions: Sign Out & Permanent Deletion */}
              <div className="space-y-2 pt-2">
                <button
                  id="sign-out-btn"
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-zinc-400" />
                  <span>Sign Out of Assistant</span>
                </button>

                <button
                  id="delete-account-btn"
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Delete Account &amp; Data</span>
                </button>
              </div>

              {/* Confirmation Dialog for Account Deletion */}
              {confirmDeleteOpen && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5 text-rose-300">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-200 text-sm">Permanent Account Deletion</h4>
                      <p className="text-[11px] text-zinc-300 leading-relaxed mt-1">
                        Are you sure you want to permanently delete your account? This action permanently removes
                        your profile, conversation transcripts, and personalized assistant settings. This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setConfirmDeleteOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteAccount}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Switch / Add Account Tab */}
          {activeTab === "switch_account" && (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!!isLoading}
                className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading === "google" ? "Connecting..." : "Continue with Google"}</span>
              </button>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={handleMicrosoftSignIn}
                disabled={!!isLoading}
                className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                <span>{isLoading === "microsoft" ? "Connecting..." : "Continue with Microsoft"}</span>
              </button>

              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-2 text-[10px] uppercase text-zinc-500 font-bold">
                  Or with Email
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {emailMode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Display name"
                      className="w-full px-3 py-2 rounded-xl border border-white/15 bg-zinc-900/80 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-white/15 bg-zinc-900/80 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full px-3 py-2 pr-9 rounded-xl border border-white/15 bg-zinc-900/80 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!!isLoading}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-60"
                >
                  {isLoading === "email"
                    ? "Authenticating..."
                    : emailMode === "signin"
                    ? "Sign In with Email"
                    : "Create Account with Email"}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setEmailMode(emailMode === "signin" ? "signup" : "signin")}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    {emailMode === "signin"
                      ? "Don't have an account? Create one"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
