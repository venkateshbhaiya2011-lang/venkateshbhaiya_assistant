import React, { useState } from "react";
import {
  Shield,
  Lock,
  Database,
  Trash2,
  CheckCircle,
  EyeOff,
  Server,
  AlertTriangle,
} from "lucide-react";
import { UserAccount } from "../types";
import { StorageService } from "../services/storage";

interface PrivacySectionProps {
  currentUser: UserAccount | null;
  onDataCleared: () => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  currentUser,
  onDataCleared,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear your local chat history on this device?")) {
      const userId = currentUser ? currentUser.id : "guest_user";
      StorageService.saveConversations(userId, []);
      setClearedNotice(true);
      onDataCleared();
      setTimeout(() => setClearedNotice(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Privacy Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 sm:p-10 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Security &amp; Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Privacy Policy &amp; Safety Controls
        </h1>
        <p className="text-stone-300 text-sm sm:text-base mt-2 leading-relaxed">
          We believe in simple, straightforward privacy protections. Here is an honest explanation
          of how your data is handled when communicating with VenkateshBhaiya Assistant.
        </p>
      </div>

      {/* Main Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300/60 flex items-center justify-center mb-3.5">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
            Secure Backend Architecture
          </h3>
          <p className="text-stone-600 text-xs leading-relaxed">
            All AI model queries are handled through our isolated server backend. No secret API
            keys or sensitive parameters are ever exposed in your web browser. System instructions
            are strictly locked on the server to prevent malicious modification.
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-900 border border-emerald-300/60 flex items-center justify-center mb-3.5">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
            Local Chat History &amp; Privacy Protection
          </h3>
          <p className="text-stone-600 text-xs leading-relaxed">
            Your conversations and local settings are saved securely in your browser's local storage.
            No private email addresses or confidential contact information are collected, published, or shared with third-party advertising networks.
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-900 border border-purple-300/60 flex items-center justify-center mb-3.5">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
            No Private Data Exposure
          </h3>
          <p className="text-stone-600 text-xs leading-relaxed">
            The assistant is instructed never to solicit sensitive financial credentials, government
            IDs, or confidential information. Messages are processed solely to formulate polite and
            constructive replies.
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-900 border border-rose-300/60 flex items-center justify-center mb-3.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
            Automated Content Safety Guard
          </h3>
          <p className="text-stone-600 text-xs leading-relaxed">
            Our multi-layer safety check automatically halts abusive, insulting, or profane messages.
            Unsafe or harassing prompts receive an immediate polite refusal to maintain a respectful
            space.
          </p>
        </div>
      </div>

      {/* Explicit Conversation Storage & Administrator Review Disclosure */}
      <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs sm:text-sm uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4" />
          <span>Full Disclosure &amp; Transparency Notice</span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-zinc-100 mb-2">
          Conversation Storage &amp; Administrator Review
        </h2>
        <p className="text-stone-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
          To maintain high conversational standards, debug system anomalies (such as intermittent &quot;Please try again&quot; messages), and protect our community, conversations with VenkateshBhaiya Assistant may be stored in our database and reviewed by the verified system administrator. We do not secretly monitor chats; this policy is openly disclosed to all visitors.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-amber-500/20">
            <p className="font-semibold text-stone-900 dark:text-zinc-200 mb-1">What We Record per Conversation:</p>
            <ul className="list-disc list-inside text-stone-600 dark:text-zinc-400 space-y-0.5">
              <li>Anonymous or Registered User ID</li>
              <li>Conversation &amp; Session Identifiers</li>
              <li>Date, time, and response latency</li>
              <li>User message &amp; AI assistant response</li>
              <li>AI model used (e.g. Gemini 3.5 Flash)</li>
              <li>Request &amp; error diagnostic status</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-amber-500/20">
            <p className="font-semibold text-stone-900 dark:text-zinc-200 mb-1">How Your Data is Protected:</p>
            <ul className="list-disc list-inside text-stone-600 dark:text-zinc-400 space-y-0.5">
              <li>Role-Based Access Control (RBAC) enforced on server</li>
              <li>Encrypted database storage in Google Firestore</li>
              <li>Zero sharing or selling to advertising brokers</li>
              <li>Configurable 30–90 day data retention &amp; purging</li>
              <li>Ability to clear local device cache at any time</li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-stone-500 dark:text-zinc-400 italic">
          If you have privacy inquiries or wish to request removal of a specific conversation record, you may reach out directly via the official connect channels.
        </p>
      </section>

      {/* User Data Management & Clear Action */}
      <section className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-1.5">
          Manage Your Local Chat Data
        </h2>
        <p className="text-stone-600 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed">
          You have full control over your conversation history. If you are on a shared device or
          simply wish to start fresh, you can erase your conversation logs at any time.
        </p>

        {clearedNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>All local conversation history has been cleared successfully.</span>
          </div>
        )}

        <button
          id="clear-chat-history-btn"
          onClick={handleClearAllData}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-2 transition cursor-pointer active:scale-98"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Clear Local Chat History On This Device</span>
        </button>
      </section>
    </div>
  );
};
