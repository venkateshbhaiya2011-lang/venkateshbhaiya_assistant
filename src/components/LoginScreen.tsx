import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { UserAccount } from "../types";
import {
  signInWithGoogleFirebase,
  signInWithAppleFirebase,
  signInWithMicrosoftFirebase,
  signInWithEmailFirebase,
  signUpWithEmailFirebase,
  sendPasswordResetFirebase,
  signInGuestFirebase,
  isEmbeddedBrowser,
  openGoogleAuthInBrowser,
  signInWithGoogleRedirect,
} from "../services/firebase";
import { StorageService } from "../services/storage";
import { CrossTabSync } from "../services/crossTabSync";

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenAdminPortal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenAdminPortal,
}) => {
  const [authMode, setAuthMode] = useState<"options" | "email_signin" | "email_signup" | "forgot_password">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Detect embedded browser & listen for account synthesis on mount
  useEffect(() => {
    setIsEmbedded(isEmbeddedBrowser());

    // Check if user is already synthesized in storage
    const existing = StorageService.getCurrentUser();
    if (existing) {
      onLoginSuccess(existing);
      return;
    }

    // 1. BroadcastChannel API cross-tab synchronization listener
    const unsubscribeCrossTab = CrossTabSync.subscribe((syncedUser) => {
      if (syncedUser && syncedUser.id) {
        onLoginSuccess(syncedUser);
      }
    });

    // 2. Request active auth state from any other open tabs
    CrossTabSync.requestCurrentAuthFromOtherTabs();

    const handleSynced = (e: any) => {
      if (e.detail && e.detail.id) {
        onLoginSuccess(e.detail);
      }
    };
    window.addEventListener("vb_account_synced", handleSynced);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "vb_current_user" && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          if (user && user.id) {
            onLoginSuccess(user);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribeCrossTab();
      window.removeEventListener("vb_account_synced", handleSynced);
      window.removeEventListener("storage", handleStorage);
    };
  }, [onLoginSuccess]);

  // Cooldown countdown timer for password reset resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Clean error formatter to prevent raw technical codes like auth/internal-error or auth/network-request-failed
  const formatErrorMessage = (raw: string | null): { text: string; isPopupOrIframeIssue?: boolean; isCredentialIssue?: boolean; isNetworkIssue?: boolean } => {
    if (!raw) return { text: "" };
    const lower = raw.toLowerCase();

    if (
      lower.includes("network-request-failed") ||
      lower.includes("auth/network-request-failed") ||
      lower.includes("failed to fetch") ||
      lower.includes("network error")
    ) {
      return {
        text: "Unable to reach the authentication service. Please check your internet connection or continue as Guest.",
        isNetworkIssue: true,
      };
    }

    if (
      lower.includes("auth/internal-error") ||
      lower.includes("internal-error") ||
      lower.includes("popup-blocked") ||
      lower.includes("cancelled-popup-request") ||
      lower.includes("unable to complete in this browser window")
    ) {
      return {
        text: "The authentication window could not complete. This commonly happens in mobile browsers or embedded preview windows.",
        isPopupOrIframeIssue: true,
      };
    }

    if (lower.includes("invalid-credential") || lower.includes("wrong-password") || lower.includes("user-not-found")) {
      return {
        text: "Invalid email or password. Please verify your credentials or reset your password.",
        isCredentialIssue: true,
      };
    }

    if (lower.includes("apple")) {
      return {
        text: "Apple Sign-In is not currently enabled for this project. Please sign in with Google, Email, or Guest Mode.",
      };
    }

    return { text: raw };
  };

  const parsedError = formatErrorMessage(errorMessage);

  // 1. Google OAuth (Redirect-based and direct verified authentication flow)
  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (isEmbedded) {
        // In embedded iframe/preview: launch full browser window pre-configured to execute redirect OAuth
        openGoogleAuthInBrowser();
        setSuccessMessage("Opening official Google authentication in a new browser tab. Once authenticated, this window connects automatically.");

        // Poll server session in the background so the user doesn't even have to refresh
        let checkCount = 0;
        const pollInterval = setInterval(async () => {
          checkCount++;
          if (checkCount > 60) {
            clearInterval(pollInterval);
            setIsLoading(null);
            return;
          }
          try {
            const token = StorageService.getSessionToken();
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch("/api/auth/session", {
              headers,
              credentials: "include",
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user) {
                clearInterval(pollInterval);
                setIsLoading(null);
                StorageService.saveAccount(data.user);
                StorageService.recordLoginHistory({
                  userId: data.user.id,
                  userName: data.user.name,
                  userIdentifier: data.user.email || data.user.name,
                  method: "google",
                  status: "success",
                });
                CrossTabSync.broadcastLogin(data.user);
                onLoginSuccess(data.user);
              }
            }
          } catch {}
        }, 2000);
        return;
      }

      // In top-level browser tab: attempt verified popup or redirect flow
      const user = await signInWithGoogleFirebase();
      if (user && user.id) {
        StorageService.saveAccount(user);
        StorageService.recordLoginHistory({
          userId: user.id,
          userName: user.name,
          userIdentifier: user.email || user.name,
          method: "google",
          status: "success",
        });
        CrossTabSync.broadcastLogin(user);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error("Google login initiation error:", err);
      if (err.message && err.message.includes("new tab")) {
        setSuccessMessage(err.message);
      } else {
        setErrorMessage(
          err.message ||
            "Unable to complete Google Sign-In. Please try again or use Email Sign In."
        );
      }
    } finally {
      setIsLoading(null);
    }
  };

  // 2. Apple OAuth
  const handleAppleSignIn = async () => {
    setIsLoading("apple");
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await signInWithAppleFirebase();
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || user.name,
        method: "apple",
        status: "success",
      });
      onLoginSuccess(user);
    } catch (err: any) {
      console.error("Apple login failed:", err);
      setErrorMessage(
        err.message || "Apple Sign-In is not currently configured. Please sign in with Google, Email, or Guest Mode."
      );
    } finally {
      setIsLoading(null);
    }
  };

  // 3. Microsoft Sign In
  const handleMicrosoftSignIn = async () => {
    setIsLoading("microsoft");
    setErrorMessage(null);
    setSuccessMessage(null);

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
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn("Microsoft login issue:", err);
      setErrorMessage(
        err.message || "Microsoft Sign-In encountered an issue. Please try again or use Google or Email."
      );
    } finally {
      setIsLoading(null);
    }
  };

  // 4. Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading("email_signin");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await signInWithEmailFirebase(email, password);
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || email,
        method: "email",
        status: "success",
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not sign in with email. Please verify your credentials.");
    } finally {
      setIsLoading(null);
    }
  };

  // 4. Email & Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please provide an email address and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading("email_signup");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await signUpWithEmailFirebase(email, password, displayName);
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: user.email || email,
        method: "email",
        status: "success",
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not create account. Please check your email address.");
    } finally {
      setIsLoading(null);
    }
  };

  // 5. Password Reset Request (Firebase Auth)
  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter the email address associated with your account.");
      return;
    }

    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    setIsLoading("reset");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetFirebase(cleanEmail);
      setResetSentTo(cleanEmail);
      setResendCooldown(30);
      setSuccessMessage(`A secure password reset link has been dispatched to ${cleanEmail}.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset link. Please check the email address.");
    } finally {
      setIsLoading(null);
    }
  };

  // 6. Guest Mode
  const handleGuestSignIn = async () => {
    setIsLoading("guest");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await signInGuestFirebase();
      StorageService.saveAccount(user);
      StorageService.recordLoginHistory({
        userId: user.id,
        userName: user.name,
        userIdentifier: `@${user.username}`,
        method: "guest",
        status: "success",
      });
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn("Guest sign in issue:", err);
      // Fallback guest creation
      const localGuest: UserAccount = {
        id: "guest_" + Date.now().toString(36),
        name: "Guest Explorer",
        username: "guest_explorer",
        provider: "guest",
        isGuest: true,
        createdAt: new Date().toLocaleDateString(),
      };
      StorageService.saveAccount(localGuest);
      onLoginSuccess(localGuest);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      id="login-screen-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950 text-zinc-100 overflow-y-auto"
    >
      {/* Dynamic Ambient Glow Backdrops */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      <div
        id="login-card-container"
        className="relative w-full max-w-md my-auto liquid-glass-panel border border-white/15 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center z-10 transition-all duration-200"
      >
        {/* Brand Monogram & Title */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 p-1 backdrop-blur-xl flex items-center justify-center shadow-inner mb-4 border border-amber-500/30">
          <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-amber-400 font-black text-xl sm:text-2xl border border-amber-500/40">
            VB
          </div>
        </div>

        <h1
          id="login-app-title"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5"
        >
          VenkateshBhaiya AI Assistant
        </h1>

        <p
          id="login-app-subtitle"
          className="text-xs sm:text-sm text-zinc-400 font-medium mb-6"
        >
          {authMode === "options" && "Sign in to continue"}
          {authMode === "email_signin" && "Sign in with your email account"}
          {authMode === "email_signup" && "Create a new assistant account"}
          {authMode === "forgot_password" && "Reset your account password"}
        </p>

        {/* Enhanced Error Notification Banner */}
        {errorMessage && (
          <div
            id="login-error-banner"
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-left animate-in fade-in duration-150 flex flex-col gap-2"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{parsedError.text}</span>
            </div>

            {/* Quick Action when popup or iframe blocks OAuth */}
            {parsedError.isPopupOrIframeIssue && (
              <div className="mt-1 pt-2 border-t border-rose-500/20 flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Full Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("email_signin");
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>Use Email Instead</span>
                </button>
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Continue as Guest</span>
                </button>
              </div>
            )}

            {/* Quick Action when credentials fail: offer direct Forgot Password */}
            {parsedError.isCredentialIssue && authMode === "email_signin" && (
              <div className="mt-1 pt-1.5 border-t border-rose-500/20 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot your password? Click here to reset it</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notification */}
        {successMessage && !resetSentTo && (
          <div
            id="login-success-banner"
            className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs text-left flex items-start gap-2.5 animate-in fade-in duration-150"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Main Option Buttons View */}
        {authMode === "options" && (
          <div className="space-y-3">
            {/* Embedded Preview Info Tip */}
            {isEmbedded && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 text-left flex items-start gap-2 animate-in fade-in duration-150">
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Preview sandbox detected: Google OAuth will open smoothly in a standard browser tab to prevent blocked popups.
                </span>
              </div>
            )}

            {/* 1. Continue with Google (Redirect Flow) */}
            <button
              id="continue-with-google-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!!isLoading}
              className="w-full py-3 px-4 rounded-2xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.99] text-zinc-100 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>
                {isLoading === "google"
                  ? "Redirecting to Google..."
                  : isEmbedded
                  ? "Continue with Google in Browser"
                  : "Continue with Google"}
              </span>
              {isEmbedded && <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-auto" />}
            </button>

            {/* 2. Continue with Microsoft */}
            <button
              id="continue-with-microsoft-btn"
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={!!isLoading}
              className="w-full py-3 px-4 rounded-2xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.99] text-zinc-100 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                <rect fill="#F25022" x="1" y="1" width="10" height="10" />
                <rect fill="#7FBA00" x="12" y="1" width="10" height="10" />
                <rect fill="#00A4EF" x="1" y="12" width="10" height="10" />
                <rect fill="#FFB900" x="12" y="12" width="10" height="10" />
              </svg>
              <span>{isLoading === "microsoft" ? "Connecting to Microsoft..." : "Continue with Microsoft"}</span>
            </button>

            {/* 3. Continue with Email */}
            <button
              id="continue-with-email-btn"
              type="button"
              onClick={() => {
                setAuthMode("email_signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full py-3 px-4 rounded-2xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.99] text-zinc-100 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-sm cursor-pointer"
            >
              <Mail className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Continue with Email</span>
            </button>

            {/* Divider */}
            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                Or explore first
              </span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            {/* 4. Guest Mode */}
            <button
              id="continue-as-guest-btn"
              type="button"
              onClick={handleGuestSignIn}
              disabled={!!isLoading}
              className="w-full py-3 px-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.99] text-amber-300 font-semibold text-sm flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{isLoading === "guest" ? "Entering as Guest..." : "Continue as Guest"}</span>
            </button>
            <p className="text-[11px] text-zinc-500 italic mt-1">
              Guest Mode provides a temporary session without saving across devices.
            </p>
          </div>
        )}

        {/* Email Sign In Form View */}
        {authMode === "email_signin" && (
          <form onSubmit={handleEmailSignIn} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email-signin-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                {/* Prominent Forgot Password Link */}
                <button
                  id="forgot-password-trigger-btn"
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setResetSentTo(null);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1 cursor-pointer transition"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot password?</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="email-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="email-signin-submit-btn"
              type="submit"
              disabled={!!isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-60"
            >
              <span>{isLoading === "email_signin" ? "Signing In..." : "Sign In with Email"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email_signup");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Don't have an account yet? <span className="text-amber-400 font-semibold underline">Create one now</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("options");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                &larr; Back to all sign-in options
              </button>
            </div>
          </form>
        )}

        {/* Email Sign Up Form View */}
        {authMode === "email_signup" && (
          <form onSubmit={handleEmailSignUp} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Your Full Name (Optional)
              </label>
              <div className="relative">
                <input
                  id="signup-fullname-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Choose Password
              </label>
              <div className="relative">
                <input
                  id="signup-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="email-signup-submit-btn"
              type="submit"
              disabled={!!isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-60"
            >
              <span>{isLoading === "email_signup" ? "Creating Account..." : "Create Account & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email_signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Already have an account? <span className="text-amber-400 font-semibold underline">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("options");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                &larr; Back to all sign-in options
              </button>
            </div>
          </form>
        )}

        {/* Dedicated, Complete Forgot Password Flow View */}
        {authMode === "forgot_password" && (
          <div className="text-left space-y-4">
            {resetSentTo ? (
              /* Success State: Reset Link Dispatched */
              <div
                id="reset-link-sent-card"
                className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-center space-y-3.5 shadow-xl animate-in fade-in duration-200"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">Reset Link Dispatched</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    We've requested Firebase Authentication to send a secure password reset link to:
                  </p>
                  <p className="text-sm font-semibold text-amber-400 mt-1 break-all bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20 inline-block max-w-full">
                    {resetSentTo}
                  </p>
                </div>

                <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-white/10 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Next steps to regain access:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-0.5">
                    <li>Check your inbox (and spam/junk folder).</li>
                    <li>Click the link in the Firebase email to create a new password.</li>
                    <li>Return here to sign in with your updated credentials.</li>
                  </ol>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    id="return-to-signin-btn"
                    type="button"
                    onClick={() => {
                      setAuthMode("email_signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="resend-reset-email-btn"
                    type="button"
                    disabled={resendCooldown > 0 || isLoading === "reset"}
                    onClick={() => handleForgotPassword()}
                    className="w-full py-2 px-4 rounded-xl border border-white/15 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading === "reset" ? "animate-spin text-amber-400" : ""}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend link in ${resendCooldown}s`
                        : isLoading === "reset"
                        ? "Sending..."
                        : "Resend password reset link"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Request Form State */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    Enter your account's email address and we'll dispatch a verified Firebase password reset link to your inbox.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-email-input"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm bg-zinc-900/90"
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    A secure password reset URL will be generated and sent via Firebase Auth.
                  </p>
                </div>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={!!isLoading}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-60"
                >
                  <span>{isLoading === "reset" ? "Sending Reset Link..." : "Send Password Reset Link"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-1 text-center">
                  <button
                    id="back-to-signin-from-forgot-btn"
                    type="button"
                    onClick={() => {
                      setAuthMode("email_signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer inline-flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Email Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Confidential Administrator Passkey Portal Link */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-center">
          <button
            id="open-admin-portal-link"
            type="button"
            onClick={() => {
              if (onOpenAdminPortal) {
                onOpenAdminPortal();
              } else {
                window.location.hash = "admin";
              }
            }}
            className="text-[11px] text-zinc-500 hover:text-amber-400/90 transition flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Administrator Passkey Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
