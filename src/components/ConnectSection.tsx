import React, { useState } from "react";
import {
  Youtube,
  Instagram,
  MessageCircle,
  MessageSquareHeart,
  ExternalLink,
  ShieldCheck,
  Share2,
  CheckCircle2,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";
import { StorageService } from "../services/storage";

interface ConnectSectionProps {
  onOpenFeedbackLogs?: () => void;
  userName?: string;
}

export const ConnectSection: React.FC<ConnectSectionProps> = ({ onOpenFeedbackLogs, userName }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<"helpful" | "not_helpful" | "problem">("helpful");
  const [feedbackCategory, setFeedbackCategory] = useState("Feature Suggestion");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Save to local storage
      StorageService.saveFeedback({
        rating: feedbackRating,
        sentiment: feedbackRating === "helpful" ? "helpful" : feedbackRating === "not_helpful" ? "unhelpful" : "report",
        comment: feedbackComment.trim(),
        category: feedbackCategory,
        userName: userName || "Community Visitor",
      });

      // 2. Dispatch to server endpoint as well
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment.trim(),
          category: feedbackCategory,
          userName: userName || "Community Visitor",
          device: typeof navigator !== "undefined" ? navigator.userAgent : "Web",
        }),
      }).catch((err) => console.warn("Could not sync feedback to server:", err));

      setSubmittedSuccess(true);
      setFeedbackComment("");
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsFeedbackOpen(false);
      }, 2500);
    } catch (err) {
      console.warn("Feedback submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    {
      id: "connect-youtube-card",
      name: "YouTube – VenkateshBhaiya",
      handle: "@officialvenkateshbhaiya",
      description: "Official video lectures, educational insights, coding tutorials, and live streams.",
      url: "https://www.youtube.com/@officialvenkateshbhaiya",
      actionText: "Visit YouTube Channel",
      icon: Youtube,
      color: "from-red-600 to-rose-600",
      badgeColor: "bg-red-500/15 text-red-300 border-red-500/30",
      accentBorder: "hover:border-red-500/50",
      isExternal: true,
    },
    {
      id: "connect-instagram-card",
      name: "Instagram – VenkateshBhaiya",
      handle: "@venkatesh_bhaiya_official",
      description: "Daily motivation, developer life stories, quick tech tips, and direct updates.",
      url: "https://www.instagram.com/venkatesh_bhaiya_official/",
      actionText: "Visit Instagram Profile",
      icon: Instagram,
      color: "from-purple-600 via-pink-600 to-amber-500",
      badgeColor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      accentBorder: "hover:border-pink-500/50",
      isExternal: true,
    },
    {
      id: "connect-feedback-card",
      name: "Direct In-App Feedback",
      handle: "Community Suggestions",
      description: "Submit suggestions, report issues, or rate responses directly inside the app with zero personal info required.",
      actionText: "Open Feedback Form",
      icon: MessageSquareHeart,
      color: "from-amber-500 to-orange-600",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      accentBorder: "hover:border-amber-500/50",
      isExternal: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 text-zinc-200">
      {/* Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 text-xs font-semibold mb-3 backdrop-blur-xs">
            <Share2 className="w-3.5 h-3.5" />
            <span>Official Social Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connect With VenkateshBhaiya
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            While the AI Assistant answers your queries here, explore VenkateshBhaiya's official
            social media platforms to follow the latest content, tutorials, and community broadcasts.
          </p>
        </div>
      </div>

      {/* Official Channel Notice */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-zinc-200 text-xs sm:text-sm">
            Official Channels Only
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
            Each link below leads exclusively to VenkateshBhaiya's official profiles.
          </p>
        </div>
      </div>

      {/* Social Links Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.id}
              id={link.id}
              className={`rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-5 shadow-lg flex flex-col justify-between transition-all duration-200 ${link.accentBorder} hover:bg-zinc-850 hover:shadow-xl group`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${link.color} text-white flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${link.badgeColor}`}
                  >
                    {link.handle}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                  {link.name}
                </h3>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800">
                {link.isExternal ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>{link.actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                    className="w-full py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <MessageSquareHeart className="w-3.5 h-3.5" />
                    <span>{isFeedbackOpen ? "Hide Feedback Form" : link.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Direct Feedback Drawer / Section */}
      {isFeedbackOpen && (
        <div className="rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-amber-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                  Direct In-App Feedback
                </h3>
                <p className="text-[11px] text-zinc-400">
                  No email or personal info needed. Your thoughts help improve the AI assistant.
                </p>
              </div>
            </div>

            {onOpenFeedbackLogs && (
              <button
                type="button"
                onClick={onOpenFeedbackLogs}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View All Feedback &amp; Chats</span>
              </button>
            )}
          </div>

          {submittedSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Feedback received! Thank you for sharing your thoughts and helping make this assistant better.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  How was your experience?
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackRating("helpful")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      feedbackRating === "helpful"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Helpful &amp; Polite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackRating("not_helpful")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      feedbackRating === "not_helpful"
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Needs Improvement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackRating("problem")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      feedbackRating === "problem"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Report a Bug / Issue</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Feature Suggestion", "Response Quality", "Bug Report", "Praise / General"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        feedbackCategory === cat
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Your Feedback / Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share what you like, what should be improved, or questions you have..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-zinc-500">
                  Submitting as: <span className="text-zinc-300 font-semibold">{userName || "Anonymous Visitor"}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedbackComment.trim()}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Submitting..." : "Send Feedback"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quick Check Feedback & Chats Helper Banner */}
      {onOpenFeedbackLogs && (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">
                Check Feedbacks &amp; AI Chat Conversations
              </p>
              <p className="text-zinc-400 text-[11px]">
                Inspect all feedback submitted by users and review chat transcripts between humans and the AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenFeedbackLogs}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 font-bold transition text-xs flex items-center gap-1.5 shrink-0 border border-zinc-700 cursor-pointer active:scale-98"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Feedback &amp; Chat Inspector</span>
          </button>
        </div>
      )}
    </div>
  );
};
