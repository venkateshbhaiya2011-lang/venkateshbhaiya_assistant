import React, { useState, useEffect } from "react";
import { X, Shield, Share2, Info, Sliders, MessageSquareHeart, FileText, HelpCircle, Scale, Download, Bell } from "lucide-react";
import { AboutSection } from "./AboutSection";
import { ConnectSection } from "./ConnectSection";
import { PrivacySection } from "./PrivacySection";
import { SettingsSection } from "./SettingsSection";
import { HelpSection } from "./HelpSection";
import { TermsSection } from "./TermsSection";
import { FeedbackChatInspector } from "./FeedbackChatInspector";
import { DownloadSection } from "./DownloadSection";
import { DocumentsSection } from "./DocumentsSection";
import { NotificationsSection } from "./NotificationsSection";
import { UserAccount, PersonalityTone, ChatAppearance } from "../types";

export type InfoModalTab = "settings" | "about" | "help" | "privacy" | "terms" | "connect" | "feedback_logs" | "download" | "documents" | "notifications";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InfoModalTab | null;
  currentUser: UserAccount | null;
  personalityTone: PersonalityTone;
  onSelectPersonalityTone: (tone: PersonalityTone) => void;
  chatAppearance: ChatAppearance;
  onSelectChatAppearance: (appearance: ChatAppearance) => void;
  onOpenAccountModal: () => void;
  onLogout: () => void;
  onDataCleared: () => void;
  onNavigateToAdmin?: (subTab?: string) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  type,
  currentUser,
  personalityTone,
  onSelectPersonalityTone,
  chatAppearance,
  onSelectChatAppearance,
  onOpenAccountModal,
  onLogout,
  onDataCleared,
  onNavigateToAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>("settings");

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  if (!isOpen || !type) return null;

  return (
    <div
      id="info-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="info-modal-container"
        className="w-full max-w-3xl liquid-glass-panel border border-white/15 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] transition-all text-zinc-200"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-zinc-950/40 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              {activeTab === "settings" && <Sliders className="w-4 h-4 text-amber-400" />}
              {activeTab === "about" && <Info className="w-4 h-4 text-amber-400" />}
              {activeTab === "help" && <HelpCircle className="w-4 h-4 text-amber-400" />}
              {activeTab === "connect" && <Share2 className="w-4 h-4 text-red-400" />}
              {activeTab === "privacy" && <Shield className="w-4 h-4 text-purple-400" />}
              {activeTab === "terms" && <Scale className="w-4 h-4 text-amber-400" />}
              {activeTab === "feedback_logs" && <FileText className="w-4 h-4 text-emerald-400" />}
              {activeTab === "download" && <Download className="w-4 h-4 text-amber-400" />}
              {activeTab === "documents" && <FileText className="w-4 h-4 text-amber-400" />}
              {activeTab === "notifications" && <Bell className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100 text-sm sm:text-base capitalize">
                  {activeTab === "settings" && "AI Settings & Appearance"}
                  {activeTab === "about" && "About VenkateshBhaiya"}
                  {activeTab === "help" && "Help & Problem Center"}
                  {activeTab === "connect" && "Official Social Channels"}
                  {activeTab === "privacy" && "Privacy Policy & Safety Controls"}
                  {activeTab === "terms" && "Terms of Service"}
                  {activeTab === "feedback_logs" && "User Feedback & AI Chat Logs"}
                  {activeTab === "download" && "Download & Install App Guide"}
                  {activeTab === "documents" && "My Documents"}
                  {activeTab === "notifications" && "Notifications & Updates"}
                </h3>
                {activeTab === "settings" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-lg bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 capitalize">
                    {personalityTone}
                  </span>
                )}
                {activeTab === "download" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                    Official PWA
                  </span>
                )}
                {activeTab === "feedback_logs" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                    Inspector
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                {activeTab === "settings" && "Adjust AI tone, theme appearance, mobile haptics, and chat response behavior"}
                {activeTab === "about" && "Ethical guidelines, safety rules, and creator distinction"}
                {activeTab === "help" && "Frequently asked questions, shortcuts, and problem reports"}
                {activeTab === "connect" && "Authentic verified links to connect with Venkatesh Bhaiya"}
                {activeTab === "privacy" && "Transparent local storage and data controls"}
                {activeTab === "terms" && "Usage boundaries, user rights, and service conditions"}
                {activeTab === "feedback_logs" && "Check all visitor feedback and inspect human-to-AI chat transcripts"}
                {activeTab === "download" && "Install directly from this official website on Android, iPhone, Windows, or Mac"}
                {activeTab === "documents" && "Access official study materials, revision guides, and sent PDFs"}
                {activeTab === "notifications" && "Review official alerts, new documents, and system announcements"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-header Segmented Tab Navigation */}
        <div className="px-3 sm:px-6 py-2 bg-zinc-950/30 border-b border-white/10 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-scroll backdrop-blur-md">
          <button
            id="modal-tab-btn-documents"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "documents"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Documents</span>
          </button>

          <button
            id="modal-tab-btn-notifications"
            onClick={() => setActiveTab("notifications")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "notifications"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Notifications</span>
          </button>

          <button
            id="modal-tab-btn-download"
            onClick={() => setActiveTab("download")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "download"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download &amp; Install</span>
          </button>

          <button
            id="modal-tab-btn-settings"
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "settings"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings</span>
          </button>

          <button
            id="modal-tab-btn-help"
            onClick={() => setActiveTab("help")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "help"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Help &amp; FAQ</span>
          </button>

          <button
            id="modal-tab-btn-about"
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "about"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>About</span>
          </button>

          <button
            id="modal-tab-btn-privacy"
            onClick={() => setActiveTab("privacy")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "privacy"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Privacy</span>
          </button>

          <button
            id="modal-tab-btn-terms"
            onClick={() => setActiveTab("terms")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "terms"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Terms</span>
          </button>

          <button
            id="modal-tab-btn-connect"
            onClick={() => setActiveTab("connect")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "connect"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-red-400" />
            <span>Connect</span>
          </button>

          <button
            id="modal-tab-btn-feedback-logs"
            onClick={() => setActiveTab("feedback_logs")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === "feedback_logs"
                ? "liquid-glass-subtle text-amber-300 shadow-xs border border-amber-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feedback Logs</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-zinc-950/20 backdrop-blur-md">
          {activeTab === "settings" && (
            <SettingsSection
              currentUser={currentUser}
              personalityTone={personalityTone}
              onSelectPersonalityTone={onSelectPersonalityTone}
              chatAppearance={chatAppearance}
              onSelectChatAppearance={onSelectChatAppearance}
              onOpenAccountModal={() => {
                onClose();
                onOpenAccountModal();
              }}
              onLogout={onLogout}
              onDataCleared={onDataCleared}
              onSelectTab={(tab) => setActiveTab(tab as InfoModalTab)}
            />
          )}

          {activeTab === "help" && (
            <HelpSection
              userName={currentUser?.name}
              onOpenFeedbackForm={() => setActiveTab("connect")}
              onOpenSettings={() => setActiveTab("settings")}
            />
          )}

          {activeTab === "about" && (
            <AboutSection
              currentUser={currentUser}
              onOpenAccountModal={() => {
                onClose();
                onOpenAccountModal();
              }}
              onLogout={onLogout}
            />
          )}

          {activeTab === "privacy" && (
            <PrivacySection
              currentUser={currentUser}
              onDataCleared={onDataCleared}
            />
          )}

          {activeTab === "terms" && (
            <TermsSection />
          )}

          {activeTab === "connect" && (
            <ConnectSection
              onOpenFeedbackLogs={() => setActiveTab("feedback_logs")}
              userName={currentUser?.name}
            />
          )}

          {activeTab === "feedback_logs" && (
            <FeedbackChatInspector
              currentUserName={currentUser?.name || "Guest Visitor"}
              onClose={onClose}
            />
          )}

          {activeTab === "download" && (
            <DownloadSection onCloseModal={onClose} />
          )}

          {activeTab === "documents" && (
            <DocumentsSection
              currentUser={currentUser}
              onClose={onClose}
              onNavigateToAdmin={(subTab) => {
                onClose();
                if (onNavigateToAdmin) onNavigateToAdmin(subTab);
              }}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsSection onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};
