import React from "react";
import {
  ShieldCheck,
  Bot,
  User,
  Lock,
  Sparkles,
  CheckCircle,
  KeyRound,
  FileText,
} from "lucide-react";
import { UserAccount } from "../types";

interface AboutSectionProps {
  currentUser: UserAccount | null;
  onOpenAccountModal: () => void;
  onLogout: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  currentUser,
  onOpenAccountModal,
  onLogout,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 text-zinc-200">
      {/* Top Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-850 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-zinc-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparency &amp; Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          About VenkateshBhaiya Assistant
        </h1>
        <p className="text-amber-300 text-sm sm:text-base mt-2 font-medium">
          “Ask anything. Get a polite and helpful AI response.”
        </p>
        <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed">
          VenkateshBhaiya Assistant is an AI-powered website designed for conversations and general questions. Visitors can use the assistant to interact with the AI through the website, ask questions, draft messages, and receive helpful responses.
        </p>
      </div>

      {/* Safety & Account Explanation Section */}
      <section
        id="about-safety-credentials-card"
        className="rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 p-5 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-zinc-950 font-bold flex items-center justify-center shrink-0 shadow-md">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950" />
          </div>
          <div className="flex-1">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
              Account Security &amp; Data Safety
            </span>
            <h2 className="text-base sm:text-xl font-bold text-zinc-100 mt-0.5">
              Why We Ask For Your Name &amp; Password
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
              When you first use Venkatesh Bhaiya Assistant, you can create a local account
              with your <strong>Name and Password</strong> (similar to an Instagram profile) for your
              personal privacy and conversation management:
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xs">
                <div className="font-semibold text-zinc-100 text-xs flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Privacy Protection</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Ensures only you can view and access your past conversations on this device.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xs">
                <div className="font-semibold text-zinc-100 text-xs flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Session Security</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Your password locks your personal workspace so other visitors cannot read your chats.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xs">
                <div className="font-semibold text-zinc-100 text-xs flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>History Management</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Allows you to easily organize, search, and manage your past AI interactions.
                </p>
              </div>
            </div>

            {/* Current Active User Status Card */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {currentUser ? currentUser.name.charAt(0).toUpperCase() : "G"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm">
                      {currentUser ? currentUser.name : "Guest Visitor"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                      {currentUser ? `@${currentUser.username}` : "Unregistered"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {currentUser
                      ? `Account created: ${currentUser.createdAt} • Protected`
                      : "Create your free account to lock and preserve your history"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser ? (
                  <button
                    id="about-logout-btn"
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-rose-400 hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Log Out
                  </button>
                ) : (
                  <button
                    id="about-create-account-btn"
                    onClick={onOpenAccountModal}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fundamental Distinction Card */}
      <section className="rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 p-5 sm:p-6 shadow-lg">
        <h2 className="text-base sm:text-lg font-bold text-zinc-100 mb-1">
          The Essential Distinction
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mb-4">
          To maintain absolute honesty and trust, our system operates on clear, immutable boundaries:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/60 backdrop-blur-md border border-zinc-800 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Venkatesh Bhaiya Assistant</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                An artificial intelligence companion programmed to assist you with politeness, respect,
                clarity, and encouraging guidance. It steps in when Venkatesh Bhaiya is offline, busy, or
                unavailable. It will always acknowledge that it is an AI and will never pretend to be the
                human Venkatesh.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] text-amber-400 font-medium">
              Example honesty quote: “I’m Venkatesh Bhaiya Assistant, an AI assistant. Venkatesh Bhaiya may be unavailable right now, but I can still help you.”
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 backdrop-blur-md border border-zinc-800 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm mb-2">
                <User className="w-4 h-4 text-zinc-300" />
                <span>Venkatesh Bhaiya (The Person)</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                The actual individual, creator, educator, and mentor. The AI will never claim that
                Venkatesh personally sent, reviewed, or approved an automated message. For direct
                interaction, visitors should connect through his official verified social handles.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 font-medium">
              Verified Links: YouTube (@officialvenkateshbhaiya) and Instagram (@venkatesh_bhaiya_official).
            </div>
          </div>
        </div>
      </section>

      {/* Behavioral Style & Community Values */}
      <section className="rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 p-5 sm:p-6 shadow-lg">
        <h2 className="text-base sm:text-lg font-bold text-zinc-100 mb-1">
          Assistant Style &amp; Code of Conduct
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mb-4">
          Venkatesh Bhaiya Assistant is engineered with strict behavioral guardrails to ensure every visitor experiences warmth and dignity:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { title: "Polite & Respectful", desc: "Never condescending, always honors the visitor." },
            { title: "Friendly & Warm", desc: "Positive and encouraging tone in every response." },
            { title: "Clear & Simple", desc: "Easy to understand, free of unnecessary complexity." },
            { title: "Helpful & Structured", desc: "Focuses on providing practical guidance and answers." },
            { title: "Zero Abuse Tolerance", desc: "Strictly filters offensive or insulting language." },
            { title: "Completely Transparent", desc: "100% honest that it is an artificial intelligence." },
          ].map((val, idx) => (
            <div key={idx} className="p-3 sm:p-3.5 bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-xs mb-1">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{val.title}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
