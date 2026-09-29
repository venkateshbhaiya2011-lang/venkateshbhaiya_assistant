import React, { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Mic,
  Volume2,
  Keyboard,
  ShieldAlert,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  Sliders,
} from "lucide-react";
import { executeRecaptcha } from "../services/recaptcha";

interface HelpSectionProps {
  onOpenFeedbackForm?: () => void;
  onOpenSettings?: () => void;
  userName?: string;
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  onOpenFeedbackForm,
  onOpenSettings,
  userName,
}) => {
  const [problemDescription, setProblemDescription] = useState("");
  const [problemCategory, setProblemCategory] = useState("Bug / Technical Issue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleReportProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const recaptchaToken = await executeRecaptcha("submit_problem_report");

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: "problem",
          sentiment: "report",
          category: problemCategory,
          comment: problemDescription.trim(),
          userName: userName || "Visitor",
          device: typeof navigator !== "undefined" ? navigator.userAgent : "Web",
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not send problem report. Please try again.");
      }

      setSubmitSuccess(true);
      setProblemDescription("");
      setTimeout(() => setSubmitSuccess(false), 3500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How do I switch between Light and Dark mode?",
      a: "Open Settings from the user menu or sidebar, navigate to the Appearance section, and choose Light Mode, Dark Mode, or System Default. You'll enjoy a smooth CSS visual transition across all cards and text.",
    },
    {
      q: "Is my chat history saved permanently?",
      a: "Yes, when signed in with Google, Microsoft, or Email, your conversations are securely saved to your verified account ID. In Guest Mode, chats are temporary and stored only on your local browser.",
    },
    {
      q: "Can I use voice to talk to VenkateshBhaiya AI Assistant?",
      a: "Yes! Tap the microphone icon in the chat composer to dictate your message using Web Speech recognition. You can also enable Text-to-Speech in Settings to have the assistant speak responses aloud.",
    },
    {
      q: "How do I change between Enter-to-send or Shift+Enter for new line?",
      a: "In Settings under Chat Preferences, you can toggle the 'Enter to Send' switch. When enabled, hitting Enter sends immediately. When disabled, hitting Enter creates a new line.",
    },
    {
      q: "How do I permanently delete my account or chat data?",
      a: "You can delete individual conversations by clicking the trash icon in the Chat History drawer, or delete your entire account and all conversation records permanently from your Profile settings.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 text-zinc-200">
      {/* Top Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 text-xs font-semibold mb-3 backdrop-blur-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support &amp; Troubleshooting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Help &amp; Problem Center
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Find answers to common questions, view keyboard shortcuts, or report an issue directly
            to our maintainers.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">AI Chat Basics</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Markdown, code copying, streaming replies, and stop generation.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Smooth Themes</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Toggle light, dark, or system modes with silky CSS transitions.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Voice Input &amp; Audio</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Natural voice dictation with hands-free speech output.</p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Card */}
      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
          <Keyboard className="w-4 h-4" />
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-zinc-300">Send Message (Default)</span>
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] border border-zinc-700">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-zinc-300">Insert Newline</span>
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] border border-zinc-700">
              Shift + Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-zinc-300">New Chat</span>
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] border border-zinc-700">
              Ctrl / Cmd + N
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-zinc-300">Toggle Sidebar</span>
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] border border-zinc-700">
              Ctrl / Cmd + B
            </kbd>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-amber-300">{item.q}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Report a Problem Form */}
      <section
        id="report-a-problem-section"
        className="rounded-2xl bg-zinc-900/90 border border-amber-500/30 p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Report a Problem or Bug</span>
        </div>
        <p className="text-xs text-zinc-300">
          Encountered an issue, unexpected response, or bug? Describe what happened below and our
          development team will investigate.
        </p>

        {submitSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thank you! Your problem report has been submitted successfully.</span>
          </div>
        )}

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleReportProblem} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Issue Category
            </label>
            <select
              value={problemCategory}
              onChange={(e) => setProblemCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-zinc-950 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="Bug / Technical Issue">Bug / Technical Issue</option>
              <option value="AI Response Quality">AI Response Quality</option>
              <option value="Authentication or Login Issue">Authentication or Login Issue</option>
              <option value="Theme or Styling Glitch">Theme or Styling Glitch</option>
              <option value="Other Problem">Other Problem</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Description of Problem
            </label>
            <textarea
              required
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="What happened? What were you trying to do?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-zinc-950 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">
              No private credentials or tokens are sent with this report.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !problemDescription.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Send Problem Report"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
