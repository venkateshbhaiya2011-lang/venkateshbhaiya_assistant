import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  MessageSquare,
  Home,
  MoreVertical,
  Radio,
  User,
  LogOut,
  Info,
  Share2,
  Shield,
  Sparkles,
  ExternalLink,
  History,
  CheckCircle2,
  Sliders,
  Youtube,
  Instagram,
  FileText,
  Download,
  Bell,
} from "lucide-react";
import { TabType, UserAccount, PersonalityTone } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { PWAInstallButton } from "./PWAInstallButton";
import { InfoModalTab } from "./InfoModals";

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isVenkateshOnline: boolean;
  onToggleStatus: () => void;
  currentUser: UserAccount | null;
  personalityTone: PersonalityTone;
  onOpenAccountModal: () => void;
  onLogout: () => void;
  onOpenInfoModal: (type: InfoModalTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isVenkateshOnline,
  onToggleStatus,
  currentUser,
  personalityTone,
  onOpenAccountModal,
  onLogout,
  onOpenInfoModal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name: VenkateshBhaiya Assistant (Circular VB logo) */}
          <div
            id="nav-brand-btn"
            onClick={() => {
              triggerHaptic("light");
              onSelectTab("home");
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink min-w-0 touch-manipulation min-h-[44px] py-1"
          >
            {/* Clean Circular VB Logo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-[1.5px] shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xs sm:text-sm tracking-tight">
                VB
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 leading-none">
                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  VenkateshBhaiya
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Assistant
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block leading-none mt-1 truncate">
                Your personal AI assistant.
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5" aria-label="Primary Navigation">
            <button
              id="nav-tab-home"
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onSelectTab("home");
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer touch-manipulation select-none active:scale-95 ${
                activeTab === "home"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
              }`}
              aria-current={activeTab === "home" ? "page" : undefined}
            >
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Home</span>
            </button>

            <button
              id="nav-tab-chat"
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onSelectTab("chat");
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer touch-manipulation select-none active:scale-95 ${
                activeTab === "chat"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
              }`}
              aria-current={activeTab === "chat" ? "page" : undefined}
            >
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Assistant</span>
            </button>

            <button
              id="nav-tab-about"
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onOpenInfoModal("about");
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all cursor-pointer touch-manipulation select-none active:scale-95"
            >
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>About</span>
            </button>

            <button
              id="nav-tab-privacy"
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onOpenInfoModal("privacy");
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all cursor-pointer touch-manipulation select-none active:scale-95"
            >
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Privacy</span>
            </button>

            <button
              id="nav-tab-documents"
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onOpenInfoModal("documents");
              }}
              className="hidden lg:flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all cursor-pointer touch-manipulation select-none active:scale-95"
            >
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Documents</span>
            </button>
          </nav>

          {/* Right Section: Minimal YouTube & Instagram Icon Buttons + Status + Options with 44px+ touch targets */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative" ref={menuRef}>
            {/* YouTube Minimal Icon Button */}
            <a
              id="nav-youtube-btn"
              href="https://www.youtube.com/@officialvenkateshbhaiya"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Official YouTube Channel"
              title="Official YouTube Channel"
              onClick={() => triggerHaptic("light")}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 transition-all flex items-center justify-center shadow-xs cursor-pointer touch-manipulation active:scale-95 group"
            >
              <Youtube className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
            </a>

            {/* Instagram Minimal Icon Button */}
            <a
              id="nav-instagram-btn"
              href="https://www.instagram.com/venkatesh_bhaiya_official/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Official Instagram Profile"
              title="Official Instagram Profile"
              onClick={() => triggerHaptic("light")}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-pink-400 border border-zinc-800 hover:border-pink-500/40 transition-all flex items-center justify-center shadow-xs cursor-pointer touch-manipulation active:scale-95 group"
            >
              <Instagram className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
            </a>

            {/* Live Indicator pill with gentle breathing pulse */}
            <motion.button
              id="venkatesh-status-indicator-btn"
              onClick={() => {
                triggerHaptic("medium");
                onToggleStatus();
              }}
              title="Click to toggle Venkatesh Bhaiya availability status"
              animate={
                isVenkateshOnline
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(16, 185, 129, 0)",
                        "0 0 0 4px rgba(16, 185, 129, 0.2)",
                        "0 0 0 0 rgba(16, 185, 129, 0)",
                      ],
                    }
                  : {
                      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
                    }
              }
              transition={
                isVenkateshOnline
                  ? {
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : { duration: 0.2 }
              }
              className={`hidden xs:flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] rounded-full text-[11px] sm:text-xs font-semibold border shadow-xs transition-colors cursor-pointer backdrop-blur-md touch-manipulation active:scale-95 ${
                isVenkateshOnline
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                  : "bg-zinc-900/80 text-amber-300/90 border-amber-500/30 hover:bg-zinc-800"
              }`}
            >
              <span className="relative flex h-2 w-2 items-center justify-center">
                {isVenkateshOnline ? (
                  <>
                    <motion.span
                      className="absolute rounded-full bg-emerald-400"
                      animate={{
                        scale: [1, 2, 2.4],
                        opacity: [0.8, 0.3, 0],
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                      style={{ width: "100%", height: "100%" }}
                    />
                    <span className="relative rounded-full bg-emerald-400 h-2 w-2 shadow-xs" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                )}
              </span>
              <span>{isVenkateshOnline ? "Available" : "AI Mode"}</span>
            </motion.button>

            {/* In-App PWA Install Button (Accessible inside the website header) */}
            <PWAInstallButton
              className="hidden sm:flex"
              onOpenGuide={() => onOpenInfoModal("download")}
            />

            {/* Desktop Direct Account / Blue Rounded Login Button */}
            <button
              id="nav-desktop-auth-btn"
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onOpenAccountModal();
              }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xs font-bold text-xs transition-all cursor-pointer touch-manipulation active:scale-95"
            >
              <User className="w-4 h-4 text-white" />
              <span>{currentUser ? currentUser.name.split(" ")[0] : "Login"}</span>
            </button>

            {/* Hamburger / Three Dots Options Menu Button with 44px+ touch target */}
            <button
              id="nav-three-dots-btn"
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center ${
                isMenuOpen
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs"
              }`}
              title="More options & settings"
              aria-label="Open menu"
            >
              <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Liquid Glass Dark Mode Dropdown Menu */}
            {isMenuOpen && (
              <div
                id="three-dots-dropdown-menu"
                className="absolute right-0 top-12 sm:top-14 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-800 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-zinc-200"
              >
                {/* Account / User Section */}
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 font-extrabold flex items-center justify-center text-xs shadow-xs">
                        {currentUser ? currentUser.name.charAt(0).toUpperCase() : "G"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-100 text-xs truncate">
                          {currentUser ? currentUser.name : "Guest Visitor"}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {currentUser?.isGuest
                            ? "Guest Mode • Temporary"
                            : currentUser?.emailVerified
                            ? "Verified Account"
                            : currentUser
                            ? `@${currentUser.username}`
                            : "Not signed in"}
                        </p>
                      </div>
                    </div>

                    {currentUser ? (
                      <button
                        id="menu-logout-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        id="menu-signin-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAccountModal();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[11px] font-bold shadow-xs transition cursor-pointer"
                      >
                        Sign In
                      </button>
                    )}
                  </div>

                  {currentUser && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAccountModal();
                      }}
                      className="w-full mt-2 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Manage Profile &amp; Account</span>
                    </button>
                  )}

                  {/* BroadcastChannel Multi-Tab Live State Pill */}
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span>Cross-Tab Sync</span>
                    </span>
                    <span className="font-mono text-zinc-400">BroadcastChannel Active</span>
                  </div>
                </div>

                {/* Live Status Switcher in Menu */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio
                      className={`w-4 h-4 ${
                        isVenkateshOnline ? "text-emerald-400" : "text-amber-400"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        Venkatesh Live Status
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Currently {isVenkateshOnline ? "Available" : "Offline (AI Assisting)"}
                      </p>
                    </div>
                  </div>

                  <button
                    id="menu-toggle-status-btn"
                    onClick={onToggleStatus}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer ${
                      isVenkateshOnline
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                    }`}
                  >
                    Switch
                  </button>
                </div>

                {/* Menu List */}
                <div className="space-y-0.5">
                  <button
                    id="menu-item-download-guide"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("download");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer border border-amber-500/20 bg-amber-500/5 mb-1"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/40">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">
                          Install App &amp; Download Guide
                        </p>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase shrink-0">
                          Official
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Android, iPhone &amp; PC setup • Official website only
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-settings"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("settings");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/30">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 truncate">
                          AI Tone &amp; Settings
                        </p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold capitalize shrink-0">
                          {personalityTone}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Formal, Casual, Encouraging, Concise
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-documents"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("documents");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                        My Documents
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        View approved PDFs &amp; study materials
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-notifications"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("notifications");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-500/30">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300">
                        Notifications
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Recent alerts &amp; announcements
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-about"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("about");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-zinc-700">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100">
                        About Venkatesh Bhaiya
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Code of conduct, safety &amp; creator distinction
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-connect"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("connect");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-red-500/30">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-red-400">
                        Official Social Channels
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        YouTube, Instagram, WhatsApp &amp; Inquiries
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-privacy"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("privacy");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-500/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-purple-400">
                        Privacy &amp; Data Controls
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Local storage, transparency &amp; clear data
                      </p>
                    </div>
                  </button>

                  <button
                    id="menu-item-feedback-logs"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal("feedback_logs");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400">
                        Feedback &amp; Chat Logs
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Check visitor feedback &amp; human-AI chat transcripts
                      </p>
                    </div>
                  </button>

                  {/* Document Requests Management Button (Moderator / Admin) */}
                  <button
                    id="menu-item-document-requests"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSelectTab("admin");
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-500/15 transition flex items-center gap-2.5 text-left group cursor-pointer border border-amber-500/30 bg-amber-500/5 mb-1.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/40">
                      <FileText className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">
                          Document Requests
                        </p>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-extrabold uppercase shrink-0">
                          Moderator
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Approve &amp; dispatch student PDF requests
                      </p>
                    </div>
                  </button>

                  {/* Admin Dashboard: Monitored Conversations & Diagnostics */}
                  <button
                    id="menu-item-admin-dashboard"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSelectTab("admin");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-amber-500/10 transition flex items-center gap-2.5 text-left group cursor-pointer border border-amber-500/20"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/40">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                          Admin Dashboard
                        </p>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-extrabold uppercase">
                          Owner
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Chat monitoring, error diagnostics &amp; retention
                      </p>
                    </div>
                  </button>
                </div>

                {/* Mobile PWA Install App Banner inside Menu */}
                <PWAInstallButton
                  variant="banner"
                  className="mt-2 mb-1"
                  onOpenGuide={() => onOpenInfoModal("download")}
                />

                <div className="mt-2.5 pt-2 border-t border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500">
                    Venkatesh Bhaiya Assistant • Official AI Companion
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

