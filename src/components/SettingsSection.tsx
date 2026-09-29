import React, { useState, useEffect } from "react";
import {
  User,
  Sun,
  Moon,
  Laptop,
  History,
  Trash2,
  Info,
  Shield,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  LogOut,
  Sparkles,
  Check,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
  RotateCcw,
  BookOpen,
  Smile,
  Zap,
  MessageSquare,
  Volume2,
  VolumeX,
  Download,
  Palette,
  Edit3,
  Mic,
  Smartphone,
  Vibrate,
} from "lucide-react";
import { UserAccount, PersonalityTone, ChatAppearance, ThemeMode, UserFeedback, AccentTheme, VoiceSettings, HapticIntensity } from "../types";
import { StorageService } from "../services/storage";
import { executeRecaptcha } from "../services/recaptcha";
import { triggerHaptic, isHapticsSupported } from "../utils/haptics";

interface SettingsSectionProps {
  currentUser: UserAccount | null;
  personalityTone: PersonalityTone;
  onSelectPersonalityTone: (tone: PersonalityTone) => void;
  chatAppearance: ChatAppearance;
  onSelectChatAppearance: (appearance: ChatAppearance) => void;
  onOpenAccountModal: () => void;
  onLogout: () => void;
  onDataCleared?: () => void;
  onSelectTab?: (tab: "about" | "privacy" | "connect" | "settings" | "feedback_logs") => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentUser,
  personalityTone,
  onSelectPersonalityTone,
  chatAppearance,
  onSelectChatAppearance,
  onOpenAccountModal,
  onLogout,
  onDataCleared,
  onSelectTab,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => StorageService.getThemeMode());
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() => StorageService.getAccentTheme());
  const [assistantName, setAssistantNameState] = useState<string>(() => StorageService.getAssistantName());
  const [nameSaved, setNameSaved] = useState(false);
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(() => StorageService.getVoiceSettings());
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [enterToSend, setEnterToSendState] = useState<boolean>(() => StorageService.getEnterToSend());
  const [hapticIntensity, setHapticIntensityState] = useState<HapticIntensity>(() => StorageService.getHapticIntensity());
  const [testedHaptic, setTestedHaptic] = useState<boolean>(false);
  const [hasVibrateSupport, setHasVibrateSupport] = useState<boolean>(true);
  
  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<"helpful" | "not_helpful" | "problem" | null>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // System status state
  const [securityStatus, setSecurityStatus] = useState<any>(null);

  const userId = currentUser ? currentUser.id : "guest_user";

  useEffect(() => {
    const convs = StorageService.getConversations(userId);
    setConversationsCount(convs.length);
    setHasVibrateSupport(isHapticsSupported());

    // Fetch live security status from backend
    fetch("/api/security/status")
      .then((res) => res.json())
      .then((data) => setSecurityStatus(data))
      .catch(() => {});
  }, [userId]);

  const handleSelectHapticIntensity = (intensity: HapticIntensity) => {
    setHapticIntensityState(intensity);
    StorageService.setHapticIntensity(intensity);
    if (intensity !== "off") {
      triggerHaptic("medium", intensity);
      setTestedHaptic(true);
      setTimeout(() => setTestedHaptic(false), 1500);
    }
  };

  const handleTestHapticPulse = () => {
    if (hapticIntensity === "off") return;
    triggerHaptic("success", hapticIntensity);
    setTestedHaptic(true);
    setTimeout(() => setTestedHaptic(false), 1500);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    StorageService.setThemeMode(mode);
  };

  const handleAccentChange = (accent: AccentTheme) => {
    setAccentThemeState(accent);
    StorageService.setAccentTheme(accent);
  };

  const handleSaveAssistantName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = assistantName.trim() || "VenkateshBhaiya Assistant";
    setAssistantNameState(clean);
    StorageService.setAssistantName(clean);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleUpdateVoice = (partial: Partial<VoiceSettings>) => {
    const updated = { ...voiceSettings, ...partial };
    setVoiceSettingsState(updated);
    StorageService.setVoiceSettings(updated);
  };

  const handleToggleEnterToSend = (enabled: boolean) => {
    setEnterToSendState(enabled);
    StorageService.setEnterToSend(enabled);
  };

  const handleExportConversations = () => {
    setIsExporting(true);
    try {
      const convs = StorageService.getConversations(userId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(convs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `venkateshbhaiya_chat_history_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  const handleClearAllConversations = () => {
    if (!window.confirm("Are you sure you want to clear all conversation history on this device?")) {
      return;
    }

    setIsClearing(true);
    setTimeout(() => {
      const freshConv = StorageService.createDefaultConversation(
        userId,
        currentUser ? currentUser.name : "Guest"
      );
      StorageService.saveConversations(userId, [freshConv]);
      StorageService.setActiveConversationId(userId, freshConv.id);
      setConversationsCount(1);
      setIsClearing(false);
      setClearSuccess(true);
      if (onDataCleared) onDataCleared();

      setTimeout(() => setClearSuccess(false), 3000);
    }, 400);
  };

  const handleSubmitFeedback = async (rating: "helpful" | "not_helpful" | "problem") => {
    setFeedbackRating(rating);
    if (rating !== "problem") {
      const recaptchaToken = await executeRecaptcha("feedback");
      const fb = {
        rating,
        userName: currentUser ? currentUser.name : "Guest Visitor",
        userId,
        recaptchaToken,
      };
      StorageService.saveFeedback(fb);
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fb),
      }).catch(() => {});

      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 3500);
    }
  };

  const handleSubmitProblemReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) return;

    const recaptchaToken = await executeRecaptcha("feedback");
    const fb = {
      rating: "problem" as const,
      comment: problemDescription.trim(),
      userName: currentUser ? currentUser.name : "Guest Visitor",
      userId,
      recaptchaToken,
    };
    StorageService.saveFeedback(fb);
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fb),
    }).catch(() => {});

    setProblemDescription("");
    setFeedbackRating(null);
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-zinc-200">
      {/* 1. Account Section */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-100">
                  {currentUser ? currentUser.name : "Guest Visitor"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                  {currentUser
                    ? currentUser.provider === "google"
                      ? "Google"
                      : currentUser.provider === "microsoft"
                      ? "Microsoft"
                      : currentUser.provider === "email"
                      ? "Email"
                      : currentUser.provider === "apple"
                      ? "Apple ID"
                      : "Account"
                    : "Guest Mode"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentUser
                  ? `@${currentUser.username} • Local storage session`
                  : "Conversations are stored locally in your browser cache."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAccountModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs transition cursor-pointer"
            >
              {currentUser ? "Manage Account" : "Sign In / Register"}
            </button>

            {currentUser && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Personalization: Assistant Name & Identity */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Assistant Name &amp; Identity
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Personalization
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-3">
          Customize how your personal AI assistant identifies itself across conversations.
        </p>

        <form onSubmit={handleSaveAssistantName} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              id="assistant-name-input"
              type="text"
              value={assistantName}
              onChange={(e) => setAssistantNameState(e.target.value)}
              placeholder="e.g. Venkatesh Bhaiya, Bhaiya AI, Mentor Venkatesh"
              className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500/60 transition"
            />
            <button
              id="save-assistant-name-btn"
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs shrink-0"
            >
              Save Name
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 mr-1">Suggestions:</span>
            {[
              "Venkatesh Bhaiya",
              "Bhaiya AI",
              "Mentor Venkatesh",
              "VenkateshBhaiya Assistant",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAssistantNameState(preset);
                  StorageService.setAssistantName(preset);
                  setNameSaved(true);
                  setTimeout(() => setNameSaved(false), 2000);
                }}
                className={`text-[11px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                  assistantName === preset
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {nameSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Assistant name updated successfully!</span>
            </span>
          )}
        </form>
      </section>

      {/* 3. Theme & Accent Style */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base text-zinc-100">
            Appearance &amp; Theme
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Choose your visual preference and liquid glass accent atmosphere.
        </p>

        {/* Light / Dark / System */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { id: "system" as ThemeMode, label: "System Default", icon: Laptop },
            { id: "dark" as ThemeMode, label: "Dark (Recommended)", icon: Moon },
            { id: "light" as ThemeMode, label: "Light Mode", icon: Sun },
          ].map((theme) => {
            const Icon = theme.icon;
            const isSelected = themeMode === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold shadow-xs"
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-zinc-500"}`} />
                <span className="text-xs">{theme.label}</span>
              </button>
            );
          })}
        </div>

        {/* Accent Themes */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Glass Color Atmosphere
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "amber" as AccentTheme, name: "Liquid Amber", color: "bg-amber-500" },
              { id: "emerald" as AccentTheme, name: "Emerald Aura", color: "bg-emerald-500" },
              { id: "violet" as AccentTheme, name: "Deep Violet Glass", color: "bg-violet-500" },
              { id: "cyan" as AccentTheme, name: "Oceanic Cyan", color: "bg-cyan-500" },
            ].map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleAccentChange(acc.id)}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition cursor-pointer ${
                  accentTheme === acc.id
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold shadow-xs"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${acc.color} shrink-0 shadow-xs`} />
                <span className="truncate">{acc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Voice Chat Settings (Voice Input / Output) */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Voice Chat (Speech Input &amp; Audio Responses)
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Voice Engine
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Speak with VenkateshBhaiya Assistant via microphone or listen to replies read aloud with browser speech synthesis.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-zinc-200">Text-to-Speech Output</p>
                <p className="text-[11px] text-zinc-500">Enable speaker audio button on assistant messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={voiceSettings.enabled}
              onChange={(e) => handleUpdateVoice({ enabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-zinc-200">Auto-read Assistant Responses</p>
                <p className="text-[11px] text-zinc-500">Automatically read aloud new assistant replies when generated</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={voiceSettings.autoSpeak}
              onChange={(e) => handleUpdateVoice({ autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Speech Rate Slider */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-300 font-medium">Speech Rate: {voiceSettings.rate}x</span>
              <span className="text-zinc-500 text-[11px]">Normal is 1.0x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => handleUpdateVoice({ rate: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 5. Chat History & Data Export / Clear */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Chat History &amp; Privacy Controls
            </h3>
          </div>
          <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            {conversationsCount} Saved Chat{conversationsCount === 1 ? "" : "s"}
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          All your conversations are saved securely in your browser cache. You can download an export or clear history at any time.
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportConversations}
            disabled={isExporting || conversationsCount === 0}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Download chat history JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{isExporting ? "Exporting..." : "Export Chat History (.json)"}</span>
          </button>

          <button
            onClick={handleClearAllConversations}
            disabled={isClearing}
            className="px-3.5 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? "Clearing..." : "Clear All Conversations"}</span>
          </button>

          {clearSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>All conversations cleared successfully</span>
            </span>
          )}
        </div>
      </section>

      {/* 4. AI Personality Tone (Encouraging, Formal, Casual, Concise) */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base text-zinc-100">
            Assistant Tone &amp; Style
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Choose how the AI assistant frames its polite, helpful responses.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: "encouraging" as PersonalityTone,
              label: "Encouraging & Uplifting",
              desc: "Warm, brotherly motivation and supportive positive reinforcement.",
              icon: Sparkles,
            },
            {
              id: "formal" as PersonalityTone,
              label: "Formal & Professional",
              desc: "Polite, scholarly, structured grammar, and academic decorum.",
              icon: BookOpen,
            },
            {
              id: "casual" as PersonalityTone,
              label: "Casual & Friendly",
              desc: "Approachable, conversational, easygoing, and relatable.",
              icon: Smile,
            },
            {
              id: "concise" as PersonalityTone,
              label: "Concise & Direct",
              desc: "Straight-to-the-point answers with minimal extra phrasing.",
              icon: Zap,
            },
            {
              id: "creative" as PersonalityTone,
              label: "Creative & Expressive",
              desc: "Imaginative phrasing, vivid metaphors, poetic style, and creative ideation.",
              icon: Palette,
            },
          ].map((tone) => {
            const Icon = tone.icon;
            const isSelected = personalityTone === tone.id;
            return (
              <div
                key={tone.id}
                onClick={() => onSelectPersonalityTone(tone.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/40 shadow-xs"
                    : "bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-zinc-500"}`} />
                    <span className={`text-xs font-bold ${isSelected ? "text-amber-300" : "text-zinc-200"}`}>
                      {tone.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">{tone.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chat Behavior & Input Settings */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Chat Controls &amp; Input Behavior
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Preferences
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Configure how your keyboard shortcuts and chat input area respond.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-zinc-200 block">
                Enter Key Sends Message
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                When enabled, pressing <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px] border border-zinc-700">Enter</kbd> immediately sends the message, and <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px] border border-zinc-700">Shift + Enter</kbd> creates a new line. When disabled, pressing Enter creates a new line and you click the Send button to send.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enterToSend}
              onClick={() => handleToggleEnterToSend(!enterToSend)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enterToSend ? "bg-amber-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                  enterToSend ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Haptic Feedback Intensity for Mobile Interactions */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Mobile Haptic Feedback
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Vibrate className="w-3 h-3 text-amber-400" />
            <span>Tactile Response</span>
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Adjust the vibration intensity when tapping buttons, switching tabs, sending messages, or opening modals on mobile devices.
        </p>

        {/* Intensity Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {[
            {
              id: "off" as HapticIntensity,
              label: "Off",
              badge: "Silent",
              desc: "No vibrations on tap or navigation",
            },
            {
              id: "light" as HapticIntensity,
              label: "Subtle",
              badge: "Light",
              desc: "Delicate micro-ticks for gentle taps",
            },
            {
              id: "medium" as HapticIntensity,
              label: "Balanced",
              badge: "Default",
              desc: "Clean, natural tactile confirmation",
            },
            {
              id: "strong" as HapticIntensity,
              label: "Strong",
              badge: "Firm",
              desc: "Pronounced, crisp feedback for every action",
            },
          ].map((item) => {
            const isSelected = hapticIntensity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectHapticIntensity(item.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/50 shadow-xs"
                    : "bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs font-bold ${isSelected ? "text-amber-300" : "text-zinc-200"}`}>
                      {item.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold mb-1.5 ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Interactive Test & Status Area */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full ${hapticIntensity === "off" ? "bg-zinc-600" : "bg-emerald-400 animate-pulse"}`} />
            <span className="text-xs text-zinc-300 font-medium truncate">
              {hapticIntensity === "off"
                ? "Haptics disabled"
                : `Active Level: ${hapticIntensity.charAt(0).toUpperCase() + hapticIntensity.slice(1)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={hapticIntensity === "off"}
              onClick={handleTestHapticPulse}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                testedHaptic
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95"
              }`}
            >
              <Vibrate className="w-3.5 h-3.5 text-amber-400" />
              <span>{testedHaptic ? "Vibrated!" : "Test Vibration Pulse"}</span>
            </button>
          </div>
        </div>

        {!hasVibrateSupport && (
          <p className="text-[11px] text-zinc-500 mt-2.5 italic">
            * Note: If you are currently on desktop or an iOS Safari browser that restricts web vibration, your preference is saved and will automatically apply when accessing the website on mobile devices supporting the Vibration API.
          </p>
        )}
      </section>

      {/* 5. Feedback (👍 Helpful / 👎 Not helpful / Report a problem) */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base text-zinc-100">
            Assistant Feedback
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-3.5">
          How is your experience with VenkateshBhaiya Assistant? Your input directly improves responses.
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleSubmitFeedback("helpful")}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              feedbackRating === "helpful"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>👍 Helpful</span>
          </button>

          <button
            onClick={() => handleSubmitFeedback("not_helpful")}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              feedbackRating === "not_helpful"
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
            <span>👎 Not helpful</span>
          </button>

          <button
            onClick={() => setFeedbackRating(feedbackRating === "problem" ? null : "problem")}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              feedbackRating === "problem"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Report a problem</span>
          </button>
        </div>

        {/* Problem reporting form */}
        {feedbackRating === "problem" && (
          <form onSubmit={handleSubmitProblemReport} className="mt-3.5 pt-3 border-t border-zinc-800 space-y-2.5">
            <label className="block text-xs text-zinc-300 font-medium">
              Please describe what went wrong or how we can improve:
            </label>
            <textarea
              rows={2}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g., The answer in Coding wasn't accurate, or I encountered an error..."
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
            <button
              type="submit"
              disabled={!problemDescription.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Submit Report
            </button>
          </form>
        )}

        {feedbackSubmitted && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thank you for your feedback! It helps improve VenkateshBhaiya Assistant.</span>
          </div>
        )}

        {/* Check Feedback and Chats Button */}
        {onSelectTab && (
          <div className="mt-4 pt-3.5 border-t border-zinc-800 flex items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-400">
              Want to check all submitted feedbacks and human-AI conversations?
            </p>
            <button
              type="button"
              onClick={() => onSelectTab("feedback_logs")}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 font-bold text-xs transition border border-zinc-700 cursor-pointer shrink-0"
            >
              Check Feedbacks &amp; Chats
            </button>
          </div>
        )}
      </section>

      {/* 6. Security & Bot Protection Status */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Security &amp; Bot Defense
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Google reCAPTCHA Active</span>
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          VenkateshBhaiya Assistant is protected by Google reCAPTCHA. Risk scoring executes invisibly in the background so genuine users are never interrupted by tedious image challenges or puzzles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Protection Engine
            </span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Google reCAPTCHA</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Verification Mode
            </span>
            <span className="font-bold text-zinc-200">
              Invisible / Background
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Server Validation
            </span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Google siteverify API</span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Guarded Actions &amp; Security Shielding:</span>
          </div>
          <p className="leading-normal">
            • Login &amp; Account Sign Up • Guest Session Creation • AI Chat Interactions • Feedback &amp; Problem Reports • Rate Limiting &amp; Anti-Spam
          </p>
        </div>
      </section>

      {/* 7. About & Beta Notice */}
      <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              About VenkateshBhaiya Assistant
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
            Assistant
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          VenkateshBhaiya Assistant is a Beta AI assistant created by VenkateshBhaiya. It is designed to help users ask questions, learn, create, and explore with a simple conversational experience.
        </p>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          The website is in active development and continuously being improved. Politeness, honesty, and safety remain the top priorities.
        </p>

        {onSelectTab && (
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => onSelectTab("about")}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full About &amp; Creator Distinction</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelectTab("privacy")}
              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
            >
              <span>Privacy Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* 7. Sign Out / Clear Session */}
      <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800">
        <span>VenkateshBhaiya Assistant • Version 1.0 (Beta)</span>
        {currentUser ? (
          <button
            onClick={onLogout}
            className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out (@{currentUser.username})</span>
          </button>
        ) : (
          <span>Logged in as Guest</span>
        )}
      </div>
    </div>
  );
};
