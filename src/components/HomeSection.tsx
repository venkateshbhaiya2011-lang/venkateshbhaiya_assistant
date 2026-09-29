import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Compass,
  MessageSquare,
  Lock,
  Eye,
  Sliders,
  CheckCircle2,
  Heart,
  ChevronRight,
  Send,
  Zap,
  User,
  Smartphone,
  PenTool,
  Bot,
  FileText,
  FileImage,
  Lightbulb,
  Info,
} from "lucide-react";
import { UserAccount, PersonalityTone } from "../types";
import { InfoModalTab } from "./InfoModals";
import { triggerHaptic } from "../utils/haptics";

interface HomeSectionProps {
  currentUser: UserAccount | null;
  isVenkateshOnline: boolean;
  personalityTone?: PersonalityTone;
  onNavigateToChat: (initialPrompt?: string, conversationId?: string) => void;
  onOpenAccountModal: () => void;
  onOpenInfoModal?: (type: InfoModalTab) => void;
  onNavigateToAdmin?: (subTab?: string) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  currentUser,
  isVenkateshOnline,
  personalityTone = "encouraging",
  onNavigateToChat,
  onOpenAccountModal,
  onOpenInfoModal,
  onNavigateToAdmin,
}) => {
  const [interactiveInput, setInteractiveInput] = useState("");

  const handleStartChat = (prompt?: string) => {
    triggerHaptic("medium");
    onNavigateToChat(prompt);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = interactiveInput.trim();
    if (clean) {
      handleStartChat(clean);
    } else {
      handleStartChat();
    }
  };

  const samplePrompts = [
    { label: "Ask me anything", prompt: "Can you help me answer a question I have?" },
    { label: "Help me plan something", prompt: "Could you help me create a simple 5-step daily routine plan?" },
    { label: "Explain something simply", prompt: "Can you explain a complex concept in simple everyday terms?" },
  ];

  return (
    <div
      id="homepage-main-container"
      className="w-full max-w-6xl mx-auto space-y-12 sm:space-y-16 md:space-y-24 pb-20 px-3.5 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-300"
    >
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (2-Column Desktop, Stacked Mobile)                        */}
      {/* ========================================================================= */}
      <section
        id="hero-section"
        aria-label="VenkateshBhaiya Assistant Introduction"
        className="pt-4 sm:pt-10 md:pt-14 relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6">
            {/* Small Rounded Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold tracking-wide shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
              <span>✦ VenkateshBhaiya Assistant</span>
            </div>

            {/* Large Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18] sm:leading-[1.14]">
              Your personal AI assistant. <br className="hidden sm:inline" />
              Simple. Helpful.{" "}
              <span className="text-blue-600 dark:text-blue-400 drop-shadow-xs">
                Always ready.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Ask questions, get help, explore ideas, and use your personal assistant whenever you need it.
            </p>

            {/* Buttons: Primary + Secondary */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <button
                type="button"
                id="hero-primary-start-chat-btn"
                onClick={() => handleStartChat()}
                className="min-h-[48px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30 transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation"
              >
                <span>Start Chatting →</span>
              </button>

              <button
                type="button"
                id="hero-secondary-explore-btn"
                onClick={() => {
                  triggerHaptic("light");
                  const elem = document.getElementById("chat-preview-section");
                  if (elem) {
                    elem.scrollIntoView({ behavior: "smooth" });
                  } else {
                    handleStartChat();
                  }
                }}
                className="min-h-[48px] px-6 py-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation backdrop-blur-md"
              >
                <span>Explore Assistant</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Trust Pill */}
            <div className="pt-1 flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span>Clean, private &amp; responsive • Android mobile optimized</span>
            </div>
          </div>

          {/* Right Column: AI ROBOT VISUAL (Small Futuristic Robot + Soft Blue Circular Glow + Floating Concept Badges) */}
          <div className="lg:col-span-5 w-full flex items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-square flex items-center justify-center select-none">
              {/* Soft Blue Circular Ambient Glow */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-500/20 via-sky-400/20 to-indigo-500/15 blur-3xl pointer-events-none" />

              {/* Outer Glass Ring */}
              <div className="absolute inset-3 sm:inset-4 rounded-full border border-blue-200/40 dark:border-blue-500/20 bg-gradient-to-b from-blue-50/50 to-white/10 dark:from-blue-950/40 dark:to-slate-900/20 backdrop-blur-xl shadow-xl" />

              {/* Center AI Robot Figure (High-definition SVG Vector Illustration) */}
              <div className="relative z-10 flex flex-col items-center">
                <svg
                  className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  viewBox="0 0 240 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Friendly AI Assistant Robot Illustration"
                >
                  <defs>
                    <linearGradient id="bodyGrad" x1="40" y1="40" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="60%" stopColor="#F1F5F9" />
                      <stop offset="100%" stopColor="#E2E8F0" />
                    </linearGradient>
                    <linearGradient id="screenGrad" x1="70" y1="80" x2="170" y2="150" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0B1329" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <linearGradient id="blueGlow" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                    <filter id="eyeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Robot Head Antenna */}
                  <line x1="120" y1="52" x2="120" y2="34" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="120" cy="30" r="7" fill="url(#blueGlow)" className="animate-pulse" />

                  {/* Head Floating Shadow */}
                  <ellipse cx="120" cy="216" rx="48" ry="8" fill="#000000" opacity="0.12" />

                  {/* Robot Floating Body Capsule */}
                  <rect x="76" y="152" width="88" height="52" rx="26" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2.5" />
                  {/* Subtle Chest Emblem (VB monogram mark) */}
                  <circle cx="120" cy="178" r="14" fill="#2563EB" opacity="0.1" />
                  <text x="120" y="182" textAnchor="middle" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="system-ui, sans-serif">VB</text>

                  {/* Robot Rounded Head */}
                  <rect x="64" y="52" width="112" height="96" rx="34" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="3" />

                  {/* Rounded Ear Pods */}
                  <rect x="52" y="84" width="12" height="32" rx="6" fill="#94A3B8" />
                  <rect x="176" y="84" width="12" height="32" rx="6" fill="#94A3B8" />

                  {/* Face Screen Visor */}
                  <rect x="78" y="68" width="84" height="64" rx="20" fill="url(#screenGrad)" stroke="#1E293B" strokeWidth="2" />

                  {/* Glowing Blue Eyes (Friendly Curved Shape) */}
                  <g filter="url(#eyeGlowFilter)">
                    <ellipse cx="102" cy="98" rx="8" ry="10" fill="#38BDF8" />
                    <ellipse cx="138" cy="98" rx="8" ry="10" fill="#38BDF8" />
                    <circle cx="104" cy="95" r="3" fill="#FFFFFF" />
                    <circle cx="140" cy="95" r="3" fill="#FFFFFF" />
                  </g>

                  {/* Gentle Cheerful Smile / Voice Indicator */}
                  <path d="M 112 116 Q 120 123 128 116" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
                </svg>

                {/* Blue Speech / Chat Element */}
                <div className="absolute -top-1 sm:-top-3 right-0 sm:right-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-md flex items-center gap-1.5 text-xs font-bold animate-bounce duration-1000">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <span>Hi! How can I help?</span>
                </div>
              </div>

              {/* Floating Orbiting Concept Badges */}
              {/* 1. Chat */}
              <div
                className="absolute top-2 left-2 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-blue-200/70 dark:border-blue-800/70 shadow-md text-blue-600 dark:text-blue-400 backdrop-blur-md transform -rotate-6 hover:scale-110 transition-transform cursor-default"
                title="Chat"
              >
                <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* 2. Ideas */}
              <div
                className="absolute bottom-6 left-1 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/70 dark:border-amber-800/70 shadow-md text-amber-500 backdrop-blur-md transform rotate-6 hover:scale-110 transition-transform cursor-default"
                title="Ideas"
              >
                <Lightbulb className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* 3. Documents */}
              <div
                className="absolute top-1/2 -right-2 sm:-right-4 -translate-y-1/2 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-200/70 dark:border-indigo-800/70 shadow-md text-indigo-500 backdrop-blur-md transform rotate-3 hover:scale-110 transition-transform cursor-default"
                title="Documents"
              >
                <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* 4. Images & Content */}
              <div
                className="absolute -bottom-2 right-8 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200/70 dark:border-emerald-800/70 shadow-md text-emerald-500 backdrop-blur-md transform -rotate-3 hover:scale-110 transition-transform cursor-default"
                title="Images & Creation"
              >
                <FileImage className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. AI CHAT PREVIEW (Full-Width Soft-Blue Rounded Card)                    */}
      {/* ========================================================================= */}
      <section
        id="chat-preview-section"
        aria-label="Assistant Conversation Preview"
        className="w-full"
      >
        <div className="rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-white/90 via-blue-50/30 to-white/90 dark:from-slate-900/90 dark:via-blue-950/20 dark:to-slate-900/90 border border-blue-200/70 dark:border-blue-900/50 shadow-xl backdrop-blur-xl space-y-6">
          {/* Card Header: VB Logo + Brand Title */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1.5px] shadow-sm shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm tracking-tight">
                  VB
                </div>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>VenkateshBhaiya Assistant</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Interactive Preview Console</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Ready</span>
            </div>
          </div>

          {/* Example UI Conversation */}
          <div className="space-y-3.5 max-w-3xl mx-auto py-1">
            {/* User Message */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-xs max-w-[85%] sm:max-w-md shadow-sm leading-relaxed text-xs sm:text-sm">
                <p className="font-semibold text-[11px] text-blue-200 mb-0.5">You</p>
                <p>Can you help me?</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Assistant Reply */}
            <div className="flex items-start justify-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 mt-0.5 shadow-xs">
                VB
              </div>
              <div className="bg-white dark:bg-slate-950/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-xs max-w-[85%] sm:max-w-lg shadow-sm leading-relaxed text-xs sm:text-sm">
                <p className="font-semibold text-[11px] text-blue-600 dark:text-blue-400 mb-0.5">
                  VenkateshBhaiya Assistant
                </p>
                <p>Of course! What would you like help with?</p>
              </div>
            </div>
          </div>

          {/* Try These Prompts Area */}
          <div className="space-y-2.5 pt-2 max-w-3xl mx-auto">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Try these prompts:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStartChat(item.prompt)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Fast Input Form */}
          <form onSubmit={handleFormSubmit} className="relative max-w-3xl mx-auto pt-1">
            <input
              type="text"
              value={interactiveInput}
              onChange={(e) => setInteractiveInput(e.target.value)}
              placeholder="Ask anything, plan a routine, explore concepts..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              aria-label="Send query"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </form>

          {/* Large Blue Bottom Button: Open Assistant → */}
          <div className="pt-2 max-w-3xl mx-auto">
            <button
              type="button"
              id="preview-card-open-assistant-btn"
              onClick={() => handleStartChat()}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95 touch-manipulation"
            >
              <span>Open Assistant →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHAT CAN I DO? (2x2 on Mobile, 4 in One Row on Desktop)                */}
      {/* ========================================================================= */}
      <section
        id="quick-actions-section"
        aria-label="What can I do?"
        className="space-y-4 sm:space-y-6 pt-2"
      >
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Versatile Assistance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            What can I do?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg">
            Four everyday pillars designed to support your curiosities, productivity, and ideas.
          </p>
        </div>

        {/* 4 Cards: Mobile 2x2 grid, Desktop 4-in-a-row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {/* Card 1: Ask */}
          <button
            type="button"
            onClick={() => handleStartChat("I have a question, can you answer it clearly?")}
            className="rounded-2xl p-4 sm:p-5 text-left bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                <span>Ask</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask questions and get useful answers.
              </p>
            </div>
          </button>

          {/* Card 2: Explore */}
          <button
            type="button"
            onClick={() => handleStartChat("Can you help me explore an interesting topic?")}
            className="rounded-2xl p-4 sm:p-5 text-left bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-sky-400/60 dark:hover:border-sky-600 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200/80 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Explore ideas, topics and information.
              </p>
            </div>
          </button>

          {/* Card 3: Create */}
          <button
            type="button"
            onClick={() => handleStartChat("Could you help me brainstorm and create some content ideas?")}
            className="rounded-2xl p-4 sm:p-5 text-left bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                <span>Create</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Get help creating content and ideas.
              </p>
            </div>
          </button>

          {/* Card 4: Personal */}
          <button
            type="button"
            onClick={() => handleStartChat("I have an everyday personal question, can you assist me?")}
            className="rounded-2xl p-4 sm:p-5 text-left bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                <span>Personal</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Use the assistant for everyday personal questions.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRIVACY SECTION (Large Soft-Blue Rounded Section)                      */}
      {/* ========================================================================= */}
      <section
        id="privacy-section"
        aria-label="Privacy and Responsible Design"
        className="rounded-3xl p-6 sm:p-9 bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200/70 dark:border-blue-900/40 shadow-lg backdrop-blur-md space-y-6"
      >
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Responsible &amp; Transparent</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Designed with privacy in mind
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Your privacy matters. The assistant should only use information necessary to provide its features.
          </p>
        </div>

        {/* 3 Privacy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Privacy */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-blue-100 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privacy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keep personal information handled responsibly.
            </p>
          </div>

          {/* Card 2: Control */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-blue-100 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Control</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You decide what information you provide.
            </p>
          </div>

          {/* Card 3: Transparency */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-blue-100 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transparency</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clearly explain important data and account behavior.
            </p>
          </div>
        </div>

        {/* Small link to existing privacy modal */}
        <div className="pt-1 flex items-center justify-center sm:justify-start">
          <button
            type="button"
            id="read-privacy-info-btn"
            onClick={() => {
              triggerHaptic("light");
              onOpenInfoModal?.("privacy");
            }}
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group touch-manipulation"
          >
            <span>Read Privacy Information →</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BUILT FOR A SIMPLER AI EXPERIENCE (3 Horizontal Benefits)              */}
      {/* ========================================================================= */}
      <section
        id="benefits-section"
        aria-label="Built for a simpler AI experience"
        className="space-y-4 sm:space-y-6"
      >
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Values</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for a simpler AI experience
          </h2>
        </div>

        {/* 3 Horizontal benefits on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Benefit 1: Simple */}
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚡ Simple</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No unnecessary complexity.
            </p>
          </div>

          {/* Benefit 2: Personal */}
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>👤 Personal</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Designed around a personal assistant experience.
            </p>
          </div>

          {/* Benefit 3: Accessible */}
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📱 Accessible</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Designed to work comfortably across phones, tablets and computers.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MOTIVATION SECTION (Subtle Mountain / Sky Background Illustration)     */}
      {/* ========================================================================= */}
      <section
        id="motivation-section"
        aria-label="Keep moving forward"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-9 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shadow-xl border border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        {/* Subtle Mountain / Horizon Landscape SVG Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full object-cover" preserveAspectRatio="none" viewBox="0 0 800 200" fill="none">
            <path d="M0 200 L120 110 L280 160 L460 70 L620 140 L800 50 L800 200 Z" fill="#38BDF8" opacity="0.3" />
            <path d="M0 200 L180 140 L340 180 L520 120 L700 170 L800 110 L800 200 Z" fill="#60A5FA" opacity="0.2" />
          </svg>
        </div>

        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Encouragement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Keep moving forward.
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Small steps, consistent effort, and the right support can make a difference.
          </p>
        </div>

        <button
          type="button"
          id="get-motivation-btn"
          onClick={() => {
            handleStartChat("Bhaiya, could you share a few words of motivation and perspective for today?");
          }}
          className="relative z-10 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 cursor-pointer shrink-0 min-h-[44px] touch-manipulation"
        >
          <span>Get a little motivation →</span>
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL CTA (Dark Navy / Blue Rounded Banner + Wave Effect)              */}
      {/* ========================================================================= */}
      <section
        id="final-cta-section"
        aria-label="Ready to talk"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border border-blue-900/60 shadow-2xl text-white"
      >
        {/* Subtle Wave / Glowing VB Logo Glow Effect on Desktop Right */}
        <div className="hidden lg:block absolute -right-8 -bottom-8 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-blue-400 flex items-center justify-center font-extrabold text-7xl text-blue-300">
            VB
          </div>
        </div>

        <div className="relative z-10 space-y-5 max-w-xl text-center sm:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Ready to talk?
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-blue-200/90 leading-relaxed">
              Open VenkateshBhaiya Assistant and start a conversation.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-sm sm:max-w-none">
            <button
              type="button"
              id="final-cta-start-chatting-btn"
              onClick={() => handleStartChat()}
              className="min-h-[48px] px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95 touch-manipulation"
            >
              <span>Start Chatting →</span>
            </button>

            <button
              type="button"
              id="final-cta-learn-more-btn"
              onClick={() => {
                triggerHaptic("light");
                onOpenInfoModal?.("about");
              }}
              className="min-h-[48px] px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation"
            >
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
