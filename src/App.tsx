import React, { useState, useEffect } from "react";
import { TabType, UserAccount, PersonalityTone, ChatAppearance } from "./types";
import { StorageService } from "./services/storage";
import { CrossTabSync } from "./services/crossTabSync";
import {
  signOutFirebase,
  handleGoogleRedirectResult,
  signInWithGoogleRedirect,
  subscribeToAuthChanges,
} from "./services/firebase";
import { Navbar } from "./components/Navbar";
import { HomeSection } from "./components/HomeSection";
import { ChatSection } from "./components/ChatSection";
import { InfoModal, InfoModalTab } from "./components/InfoModals";
import { DownloadSection } from "./components/DownloadSection";
import { AccountModal } from "./components/AccountModal";
import { LoginScreen } from "./components/LoginScreen";
import { StatusToggleModal } from "./components/StatusToggleModal";
import { WelcomeToast } from "./components/WelcomeToast";
import { AdminDashboard } from "./components/AdminDashboard";
import { Youtube, Instagram, Shield, Sliders, Home, MessageSquare, History, Lock, Loader2, Sparkles, CheckCircle2, RefreshCw, User, Download, Bell, FileText, Info } from "lucide-react";
import { triggerHaptic } from "./utils/haptics";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      // Strip obsolete #chat hash so reloading or opening always lands on Home
      if (hash === "#chat") {
        try {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          );
        } catch {}
      }
      if (hash === "#admin") return "admin";
      if (hash === "#download" || hash === "#install") return "download";
    }
    return "home";
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return StorageService.getCurrentUser();
  });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isVenkateshOnline, setIsVenkateshOnline] = useState(false);
  const [personalityTone, setPersonalityTone] = useState<PersonalityTone>("encouraging");
  const [chatAppearance, setChatAppearance] = useState<ChatAppearance>("classic");
  const [pendingInitialPrompt, setPendingInitialPrompt] = useState<string | undefined>(undefined);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [chatMobileTab, setChatMobileTab] = useState<"chat" | "history">("chat");
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalTab | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<
    "requests" | "usage" | "conversations" | "errors" | "retention" | "audit"
  >("requests");
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [authErrorNotice, setAuthErrorNotice] = useState<string | null>(null);
  const [crossTabNotice, setCrossTabNotice] = useState<{
    message: string;
    type: "login" | "logout" | "info";
  } | null>(null);
  const [isVerifyingGoogleAuth, setIsVerifyingGoogleAuth] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        sessionStorage.getItem("vb_auth_redirect_in_progress") === "true" ||
        searchParams.get("auth_flow") === "google_redirect" ||
        searchParams.get("auth_success") === "1" ||
        searchParams.has("session_token")
      );
    }
    return false;
  });

  // Initialize data and handle OAuth redirects on load
  useEffect(() => {
    let isMounted = true;
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsVenkateshOnline(StorageService.getVenkateshStatus());
    setPersonalityTone(StorageService.getPersonalityTone());
    setChatAppearance(StorageService.getChatAppearance());
    
    // Apply theme and accent variables
    const theme = StorageService.getThemeMode();
    StorageService.setThemeMode(theme);
    const accent = StorageService.getAccentTheme();
    StorageService.setAccentTheme(accent);

    // 0. Continuous real-time Firebase Auth session synchronization
    const unsubscribeAuth = subscribeToAuthChanges((syncedUser) => {
      if (syncedUser && isMounted) {
        setCurrentUser(syncedUser);
        setIsVerifyingGoogleAuth(false);
      }
    });

    // 1. Process server OAuth callback query parameters (?auth_success=1, ?session_token=..., ?auth_error=...)
    const searchParams = new URLSearchParams(window.location.search);
    const authSuccess = searchParams.get("auth_success") === "1";
    const sessionTokenParam = searchParams.get("session_token");
    const authErrorParam = searchParams.get("auth_error");

    if (authErrorParam) {
      setAuthErrorNotice(decodeURIComponent(authErrorParam));
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      setIsVerifyingGoogleAuth(false);
    }

    if (sessionTokenParam) {
      StorageService.setSessionToken(sessionTokenParam);
    }

    if (authSuccess || sessionTokenParam) {
      // Clean query parameters from address bar without reloading
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // 2. Immediate server session validation with credentials: "include" (cookies + bearer token)
    async function verifyServerSession() {
      try {
        const token = sessionTokenParam || StorageService.getSessionToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/auth/session", {
          headers,
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            // Restore user session silently without forcing chat navigation
            setCurrentUser(data.user);
            StorageService.saveAccount(data.user);
            setIsVerifyingGoogleAuth(false);
            return true;
          }
        }
      } catch (err) {
        console.warn("Session check request warning:", err);
      }
      return false;
    }

    // Check server session first
    verifyServerSession().then((sessionFound) => {
      if (!sessionFound && isMounted) {
        // Also check if Firebase client redirect returned a result
        processRedirect();
      }
    });

    // 3. Fallback client-side Google OAuth redirect processor
    async function processRedirect() {
      try {
        const verifiedUser = await handleGoogleRedirectResult();
        if (verifiedUser && isMounted) {
          setCurrentUser(verifiedUser);
          StorageService.saveAccount(verifiedUser);
          CrossTabSync.broadcastLogin(verifiedUser);
          setShowWelcomeToast(true);
        }
      } catch (err) {
        console.warn("Google OAuth redirect processing result:", err);
      } finally {
        if (isMounted) {
          setIsVerifyingGoogleAuth(false);
        }
      }
    }

    // Safety timeout: ensure loading state never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsVerifyingGoogleAuth(false);
      }
    }, 4000);

    // 4. Robust multi-tab BroadcastChannel and storage synchronization
    const unsubscribeCrossTab = CrossTabSync.subscribe((syncedUser, eventType) => {
      if (!isMounted) return;
      if (syncedUser && syncedUser.id) {
        setCurrentUser(syncedUser);
        setIsVerifyingGoogleAuth(false);
        if (eventType === "AUTH_LOGIN" || eventType === "AUTH_STATE_RESPONSE") {
          setCrossTabNotice({
            message: `Account synchronized across tabs: ${syncedUser.name}`,
            type: "login",
          });
          setTimeout(() => {
            if (isMounted) setCrossTabNotice(null);
          }, 4000);
        }
      } else if (eventType === "AUTH_LOGOUT") {
        setCurrentUser(null);
        setCrossTabNotice({
          message: "Signed out in another browser tab",
          type: "logout",
        });
        setTimeout(() => {
          if (isMounted) setCrossTabNotice(null);
        }, 4000);
      }
    });

    // Request active auth state from any other existing browser tabs on mount
    CrossTabSync.requestCurrentAuthFromOtherTabs();

    const handleCustomAccountSync = (e: any) => {
      if (e.detail && isMounted) {
        setCurrentUser(e.detail);
        setIsVerifyingGoogleAuth(false);
      }
    };
    window.addEventListener("vb_account_synced", handleCustomAccountSync);

    // 4. Check if URL hash is #admin, #download, or #install
    const handleHash = () => {
      if (window.location.hash === "#admin") {
        setActiveTab("admin");
      } else if (window.location.hash === "#download" || window.location.hash === "#install") {
        setActiveInfoModal("download");
      } else if (window.location.hash === "#chat") {
        try {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          );
        } catch {}
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);

    return () => {
      isMounted = false;
      unsubscribeAuth();
      unsubscribeCrossTab();
      window.removeEventListener("vb_account_synced", handleCustomAccountSync);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const handleToggleStatus = () => {
    const nextStatus = !isVenkateshOnline;
    setIsVenkateshOnline(nextStatus);
    StorageService.setVenkateshStatus(nextStatus);
  };

  const handleNavigateToChat = (prompt?: string, conversationId?: string) => {
    if (prompt) {
      setPendingInitialPrompt(prompt);
    }
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
    setActiveTab("chat");
  };

  const handleLogout = async () => {
    await signOutFirebase();
    StorageService.setCurrentUser(null);
    CrossTabSync.broadcastLogout();
    setCurrentUser(null);
    setIsAccountModalOpen(false);
    setActiveTab("home");
  };

  const handleSelectPersonalityTone = (tone: PersonalityTone) => {
    setPersonalityTone(tone);
    StorageService.setPersonalityTone(tone);
  };

  const handleSelectChatAppearance = (appearance: ChatAppearance) => {
    setChatAppearance(appearance);
    StorageService.setChatAppearance(appearance);
  };

  // When visitor successfully signs in, synthesize to the entire website
  const handleAccountSuccess = (account: UserAccount) => {
    setCurrentUser(account);
    StorageService.saveAccount(account);
    CrossTabSync.broadcastLogin(account);
    setIsAccountModalOpen(false);
    setShowWelcomeToast(true);
    setIsVerifyingGoogleAuth(false);
  };

  // If Google OAuth redirect verification is actively in progress, show security verification state
  if (isVerifyingGoogleAuth && !currentUser) {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen w-full flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-16 h-16 rounded-3xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24">
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
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
            </span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100">Verifying Google Account</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Securing session tokens and preparing your assistant chat environment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If explicitly navigating to login tab, display the dedicated Login Screen
  if (activeTab === "login") {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen w-full font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <LoginScreen
          onLoginSuccess={handleAccountSuccess}
          onOpenAdminPortal={() => setActiveTab("admin")}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 w-full max-w-[100vw] overflow-x-hidden relative ${
        activeTab === "chat" ? "h-[100dvh] max-h-[100dvh] overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Ambient Dynamic Lighting Orbs */}
      <div className="liquid-ambient-canvas pointer-events-none" aria-hidden="true">
        <div className="liquid-ambient-orb liquid-orb-primary" />
        <div className="liquid-ambient-orb liquid-orb-secondary" />
        <div className="liquid-ambient-orb liquid-orb-tertiary" />
      </div>

      {/* Instant Cross-Tab Synchronization Notice */}
      {crossTabNotice && (
        <aside
          id="cross-tab-sync-banner"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/95 backdrop-blur-2xl border border-amber-500/40 shadow-2xl text-xs font-medium text-zinc-100 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{crossTabNotice.message}</span>
        </aside>
      )}

      {/* Top Navigation: Visible on Home page */}
      {activeTab !== "chat" && (
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isVenkateshOnline={isVenkateshOnline}
          onToggleStatus={() => setIsStatusModalOpen(true)}
          currentUser={currentUser}
          personalityTone={personalityTone}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onLogout={handleLogout}
          onOpenInfoModal={(type) => setActiveInfoModal(type)}
        />
      )}

      {/* Main Content View (Home Single-Page Hub and Full Chat Console) */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeTab === "chat"
            ? "p-0 flex flex-col min-h-0 h-full overflow-hidden"
            : "max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8 sm:pb-12"
        }`}
      >
        {activeTab === "home" ? (
          <HomeSection
            currentUser={currentUser}
            isVenkateshOnline={isVenkateshOnline}
            personalityTone={personalityTone}
            onNavigateToChat={handleNavigateToChat}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
            onOpenInfoModal={(type) => setActiveInfoModal(type)}
            onNavigateToAdmin={(subTab) => {
              setAdminInitialTab((subTab as any) || "requests");
              setActiveTab("admin");
            }}
          />
        ) : activeTab === "admin" ? (
          <AdminDashboard
            currentUser={currentUser}
            initialTab={adminInitialTab}
            onNavigateHome={() => setActiveTab("home")}
            onNavigateChat={() => setActiveTab("chat")}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
          />
        ) : activeTab === "download" ? (
          <div className="py-2 sm:py-4">
            <DownloadSection />
          </div>
        ) : (
          <ChatSection
            currentUser={currentUser}
            isVenkateshOnline={isVenkateshOnline}
            personalityTone={personalityTone}
            chatAppearance={chatAppearance}
            onToggleChatAppearance={() =>
              handleSelectChatAppearance(
                chatAppearance === "classic" ? "minimalist" : "classic"
              )
            }
            onOpenSettings={() => setActiveInfoModal("settings")}
            onOpenPrivacy={() => setActiveInfoModal("privacy")}
            onToggleStatus={() => setIsStatusModalOpen(true)}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
            pendingInitialPrompt={pendingInitialPrompt}
            onClearInitialPrompt={() => setPendingInitialPrompt(undefined)}
            initialConversationId={selectedConversationId}
            onNavigateHome={() => setActiveTab("home")}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar: White/glass background, rounded top corners, soft top border, min-h-[64px] */}
      {activeTab !== "chat" && (
        <nav
          id="mobile-bottom-nav"
          className="md:hidden sticky bottom-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pt-2 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-around gap-1 shrink-0 shadow-lg min-h-[64px] rounded-t-2xl"
          aria-label="Mobile Navigation"
        >
          {/* 1. Home */}
          <button
            id="mobile-nav-home-btn"
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("home");
            }}
            className={`flex-1 min-h-[48px] py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer touch-manipulation select-none active:scale-95 ${
              activeTab === "home"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 font-bold shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
            }`}
            aria-current={activeTab === "home" ? "page" : undefined}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium leading-none tracking-tight">Home</span>
          </button>

          {/* 2. Assistant */}
          <button
            id="mobile-nav-chat-btn"
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setChatMobileTab("chat");
              setActiveTab("chat");
            }}
            className="flex-1 min-h-[48px] py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all duration-150 cursor-pointer touch-manipulation select-none active:scale-95"
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium leading-none tracking-tight">Assistant</span>
          </button>

          {/* 3. About */}
          <button
            id="mobile-nav-about-btn"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setActiveInfoModal("about");
            }}
            className={`flex-1 min-h-[48px] py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer touch-manipulation select-none active:scale-95 ${
              activeInfoModal === "about"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 font-bold shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
            }`}
            aria-label="About VenkateshBhaiya Assistant"
          >
            <Info className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium leading-none tracking-tight">About</span>
          </button>

          {/* 4. Account */}
          <button
            id="mobile-nav-profile-btn"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsAccountModalOpen(true);
            }}
            className="flex-1 min-h-[48px] py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all duration-150 cursor-pointer touch-manipulation select-none active:scale-95"
            aria-label="Manage Account"
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium leading-none tracking-tight">
              {currentUser ? "Account" : "Login"}
            </span>
          </button>
        </nav>
      )}

      {/* Footer: Premium Dark / Navy Footer */}
      <footer
        className={`${
          activeTab === "chat" ? "hidden" : "block"
        } bg-slate-950 text-slate-300 border-t border-slate-800/80 mt-auto py-8 sm:py-12 mb-16 md:mb-0`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1.5px] shadow-sm">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-blue-400 font-extrabold text-xs">
                    VB
                  </div>
                </div>
                <span className="font-extrabold text-white text-base">
                  VenkateshBhaiya Assistant
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                A personal AI assistant designed for a simple, helpful experience.
              </p>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab("chat");
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Assistant
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveInfoModal("about");
                }}
                className="hover:text-white transition cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveInfoModal("privacy");
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveInfoModal("terms");
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setActiveInfoModal("connect");
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Contact
              </button>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <a
                href="https://www.youtube.com/@officialvenkateshbhaiya"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-400 transition flex items-center gap-1.5"
                aria-label="YouTube Channel"
              >
                <Youtube className="w-3.5 h-3.5 text-red-400" />
                <span>YouTube</span>
              </a>
              <a
                href="https://www.instagram.com/venkatesh_bhaiya_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-400 transition flex items-center gap-1.5"
                aria-label="Instagram Profile"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveInfoModal("settings")}
                className="hover:text-blue-400 transition flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Settings</span>
              </button>
            </div>

            <p>© 2026 VenkateshBhaiya Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Info Modals (Settings, About, Connect, Privacy triggered from the 3 dots menu, header, or footer) */}
      <InfoModal
        isOpen={activeInfoModal !== null}
        onClose={() => setActiveInfoModal(null)}
        type={activeInfoModal}
        currentUser={currentUser}
        personalityTone={personalityTone}
        onSelectPersonalityTone={handleSelectPersonalityTone}
        chatAppearance={chatAppearance}
        onSelectChatAppearance={handleSelectChatAppearance}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onLogout={handleLogout}
        onNavigateToAdmin={(subTab) => {
          setAdminInitialTab((subTab as any) || "requests");
          setActiveTab("admin");
        }}
        onDataCleared={() => {
          if (currentUser) {
            StorageService.createDefaultConversation(currentUser.id, currentUser.name);
          }
        }}
      />

      {/* Account Modal (Profile management, edit name, switch account, sign out) */}
      <AccountModal
        isOpen={isAccountModalOpen}
        currentUser={currentUser}
        onSuccess={handleAccountSuccess}
        onLogout={handleLogout}
        onClose={() => setIsAccountModalOpen(false)}
        canClose={true}
      />

      {/* Status Toggle Modal */}
      <StatusToggleModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        isVenkateshOnline={isVenkateshOnline}
        onToggle={handleToggleStatus}
      />

      {/* Gentle Welcome Back / Connected Notification */}
      <WelcomeToast
        show={showWelcomeToast}
        onClose={() => setShowWelcomeToast(false)}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        isVenkateshOnline={isVenkateshOnline}
      />
    </div>
  );
}
