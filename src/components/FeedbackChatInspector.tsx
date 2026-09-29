import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Calendar,
  User,
  Bot,
  Filter,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
  Sliders,
  Laptop,
} from "lucide-react";
import { UserFeedback, ChatSessionRecord, PersonalityTone } from "../types";
import { StorageService } from "../services/storage";

interface FeedbackChatInspectorProps {
  currentUserName?: string;
  onClose?: () => void;
}

export const FeedbackChatInspector: React.FC<FeedbackChatInspectorProps> = ({
  currentUserName = "Admin / User",
}) => {
  const [activeTab, setActiveTab] = useState<"chats" | "feedback">("feedback");
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "not_helpful" | "problem">("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // New feedback quick form state
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [newRating, setNewRating] = useState<"helpful" | "not_helpful" | "problem">("helpful");
  const [newCategory, setNewCategory] = useState("Feature Suggestion");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Feedbacks from server & local storage
      const localFeedbacks = StorageService.getFeedbacks();
      let serverFeedbacks: UserFeedback[] = [];

      try {
        const res = await fetch("/api/feedback");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.feedbacks)) {
            serverFeedbacks = data.feedbacks;
          }
        }
      } catch (err) {
        console.warn("Could not fetch server feedback:", err);
      }

      // Merge unique feedbacks
      const feedbackMap = new Map<string, UserFeedback>();
      [...serverFeedbacks, ...localFeedbacks].forEach((fb) => {
        feedbackMap.set(fb.id || `${fb.timestamp}_${fb.comment?.slice(0, 10)}`, fb);
      });
      setFeedbacks(Array.from(feedbackMap.values()));

      // 2. Fetch Chat Sessions from server & local storage
      let serverChats: ChatSessionRecord[] = [];
      try {
        const res = await fetch("/api/admin/chats");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.chats)) {
            serverChats = data.chats;
          }
        }
      } catch (err) {
        console.warn("Could not fetch server chats:", err);
      }

      // Also gather local user conversations
      const accounts = StorageService.getAccounts();
      const userIds = [
        "guest_user",
        ...accounts.map((a) => a.id),
      ];
      
      const localSessions: ChatSessionRecord[] = [];
      for (const uid of userIds) {
        const convs = StorageService.getConversations(uid);
        for (const conv of convs) {
          if (conv.messages.length > 0) {
            const userName = accounts.find((a) => a.id === uid)?.name || (uid === "guest_user" ? "Guest Visitor" : "Visitor");
            const turns: ChatSessionRecord["turns"] = [];

            for (let i = 0; i < conv.messages.length; i++) {
              const msg = conv.messages[i];
              if (msg.role === "user") {
                const nextAi = conv.messages[i + 1]?.role === "assistant" ? conv.messages[i + 1] : null;
                turns.push({
                  turnId: msg.id,
                  timestamp: msg.timestamp,
                  userQuery: msg.content,
                  aiReply: nextAi ? nextAi.content : "(Processing or no reply yet)",
                  isSafetyRefusal: nextAi?.isSafetyRefusal,
                });
              }
            }

            localSessions.push({
              sessionId: conv.id,
              conversationId: conv.id,
              userName,
              userId: uid,
              tone: "encouraging",
              startedAt: conv.createdAt ? new Date(conv.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent",
              lastActiveAt: conv.updatedAt ? new Date(conv.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent",
              turns: turns.length > 0 ? turns : conv.messages.map((m) => ({
                turnId: m.id,
                timestamp: m.timestamp,
                userQuery: m.role === "user" ? m.content : "(System greeting)",
                aiReply: m.role === "assistant" ? m.content : "",
              })),
            });
          }
        }
      }

      // Merge server + local sessions
      const sessionMap = new Map<string, ChatSessionRecord>();
      [...serverChats, ...localSessions].forEach((sess) => {
        sessionMap.set(sess.sessionId, sess);
      });
      const allSessions = Array.from(sessionMap.values());
      setChatSessions(allSessions);

      if (allSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(allSessions[0].sessionId);
      }
    } catch (err) {
      console.error("Error loading feedback & chat logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (feedbackFilter !== "all" && fb.rating !== feedbackFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = fb.comment?.toLowerCase().includes(q);
      const matchCat = fb.category?.toLowerCase().includes(q);
      const matchUser = fb.userName?.toLowerCase().includes(q);
      return matchComment || matchCat || matchUser;
    }
    return true;
  });

  // Filter chat sessions
  const filteredSessions = chatSessions.filter((sess) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchUser = sess.userName?.toLowerCase().includes(q);
    const matchTurn = sess.turns?.some(
      (t) => t.userQuery.toLowerCase().includes(q) || t.aiReply.toLowerCase().includes(q)
    );
    return matchUser || matchTurn;
  });

  const selectedSession = chatSessions.find((s) => s.sessionId === selectedSessionId);

  // Submit quick feedback
  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const sentiment: "helpful" | "unhelpful" | "report" =
        newRating === "helpful" ? "helpful" : newRating === "not_helpful" ? "unhelpful" : "report";
      const fbData = {
        rating: newRating,
        sentiment,
        comment: newComment.trim(),
        category: newCategory,
        userName: currentUserName,
      };

      StorageService.saveFeedback(fbData);

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fbData,
          device: typeof navigator !== "undefined" ? navigator.userAgent : "Web",
        }),
      }).catch((e) => console.warn(e));

      setNewComment("");
      setShowAddFeedback(false);
      fetchData();
    } catch (err) {
      console.warn("Could not save feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Delete individual feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Remove this feedback item?")) return;
    try {
      await fetch(`/api/feedback/${id}`, { method: "DELETE" }).catch(() => {});
      const next = feedbacks.filter((f) => f.id !== id);
      setFeedbacks(next);
      localStorage.setItem("vb_feedback_list", JSON.stringify(next));
    } catch (e) {
      console.warn("Could not delete feedback:", e);
    }
  };

  // Export data as JSON
  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      feedbacks,
      chatSessions,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `venkateshbhaiya_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy chat transcript
  const handleCopyTranscript = (sess: ChatSessionRecord) => {
    let transcriptText = `--- VENKATESHBHAIYA ASSISTANT CHAT LOG ---\n`;
    transcriptText += `User: ${sess.userName}\nSession ID: ${sess.sessionId}\nStarted: ${sess.startedAt}\nTone: ${sess.tone}\n\n`;

    sess.turns.forEach((t, i) => {
      transcriptText += `[Turn ${i + 1} - ${t.timestamp}]\n`;
      transcriptText += `HUMAN (${sess.userName}): ${t.userQuery}\n`;
      transcriptText += `AI (VenkateshBhaiya Assistant): ${t.aiReply}\n\n`;
    });

    navigator.clipboard.writeText(transcriptText);
    setCopiedSessionId(sess.sessionId);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  return (
    <div className="space-y-5 text-zinc-200">
      {/* Header Bar */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-amber-700/90 p-5 sm:p-6 shadow-xl border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-amber-200 border border-amber-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inspector &amp; Central Logs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              User Feedback &amp; AI Chat Inspector
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Inspect all feedback submitted by visitors and review chat conversations between humans and the AI assistant in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchData}
              disabled={isLoading}
              title="Refresh logs"
              className="px-3 py-2 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportData}
              title="Export all data to JSON"
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Segmented Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "feedback"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>User Feedback</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "feedback" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-300"
            }`}>
              {feedbacks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "chats"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Human &amp; AI Chats</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "chats" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-300"
            }`}>
              {chatSessions.length}
            </span>
          </button>
        </div>

        {activeTab === "feedback" && (
          <button
            onClick={() => setShowAddFeedback(!showAddFeedback)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{showAddFeedback ? "Close Form" : "+ Add Test Feedback"}</span>
          </button>
        )}
      </div>

      {/* Optional: Add Test Feedback Form */}
      {showAddFeedback && activeTab === "feedback" && (
        <form
          onSubmit={handleCreateFeedback}
          className="rounded-2xl bg-zinc-900/90 border border-amber-500/40 p-4 sm:p-5 shadow-lg backdrop-blur-xl animate-in fade-in duration-150 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs sm:text-sm text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Submit In-App Feedback</span>
            </h4>
            <span className="text-[11px] text-zinc-400">Zero personal info required</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNewRating("helpful")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                newRating === "helpful"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setNewRating("not_helpful")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                newRating === "not_helpful"
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Not Helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setNewRating("problem")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                newRating === "problem"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Bug / Problem</span>
            </button>
          </div>

          <div>
            <textarea
              rows={2}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your feedback message here..."
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddFeedback(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingFeedback || !newComment.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "feedback"
                ? "Search feedback comments or user..."
                : "Search chat query, AI response, or user..."
            }
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>

        {activeTab === "feedback" && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto no-scrollbar">
            {(
              [
                { id: "all", label: "All Ratings" },
                { id: "helpful", label: "👍 Helpful" },
                { id: "not_helpful", label: "👎 Not Helpful" },
                { id: "problem", label: "⚠️ Problems" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFeedbackFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  feedbackFilter === filter.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area 1: FEEDBACK INBOX */}
      {activeTab === "feedback" && (
        <div className="space-y-3">
          {filteredFeedbacks.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 text-center">
              <ThumbsUp className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="font-semibold text-zinc-300 text-sm">No feedback found</p>
              <p className="text-zinc-500 text-xs mt-1">
                {searchQuery
                  ? "Try refining your search criteria."
                  : "Submitted feedback from users will show up here automatically."}
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-2xl bg-zinc-900/70 border border-zinc-800/90 p-4 sm:p-5 shadow-sm hover:border-zinc-700 transition space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {fb.rating === "helpful" && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Helpful</span>
                      </span>
                    )}
                    {fb.rating === "not_helpful" && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>Needs Improvement</span>
                      </span>
                    )}
                    {fb.rating === "problem" && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Problem Report</span>
                      </span>
                    )}

                    {fb.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {fb.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{fb.timestamp}</span>
                    </span>

                    <button
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {fb.comment && (
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
                    "{fb.comment}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-400" />
                    <span>Submitted by: <strong className="text-zinc-300">{fb.userName || "Anonymous Visitor"}</strong></span>
                  </span>
                  {fb.device && (
                    <span className="text-zinc-500 hidden sm:inline truncate max-w-xs">
                      {fb.device.slice(0, 32)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content Area 2: HUMAN & AI CHAT SESSIONS */}
      {activeTab === "chats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Session List */}
          <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Recorded Sessions ({filteredSessions.length})
            </p>

            {filteredSessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                No chat sessions found.
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isSelected = sess.sessionId === selectedSessionId;
                const turnCount = sess.turns?.length || 0;
                const latestTurn = sess.turns?.[sess.turns.length - 1];

                return (
                  <div
                    key={sess.sessionId}
                    onClick={() => setSelectedSessionId(sess.sessionId)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/50 shadow-xs"
                        : "bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1.5">
                        <User className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{sess.userName || "Guest Visitor"}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {turnCount} {turnCount === 1 ? "turn" : "turns"}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                      "{latestTurn ? latestTurn.userQuery : "New Conversation"}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-800/60">
                      <span>{sess.lastActiveAt || sess.startedAt}</span>
                      <span className="capitalize text-amber-400/80 font-medium">
                        {sess.tone || "Encouraging"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Dialogue Transcript Viewer */}
          <div className="md:col-span-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 flex flex-col min-h-[500px] max-h-[600px]">
            {selectedSession ? (
              <div className="flex flex-col h-full">
                {/* Session Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-100">
                        Transcript: {selectedSession.userName}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        {selectedSession.tone} tone
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Session ID: <code className="text-zinc-300">{selectedSession.sessionId}</code> • {selectedSession.lastActiveAt}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyTranscript(selectedSession)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer"
                  >
                    {copiedSessionId === selectedSession.sessionId ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Transcript</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Turns List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {selectedSession.turns.map((turn, idx) => (
                    <div key={turn.turnId || idx} className="space-y-2">
                      {/* User Query */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          U
                        </div>
                        <div className="flex-1 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span className="font-bold text-zinc-300">{selectedSession.userName}</span>
                            <span>{turn.timestamp}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {turn.userQuery}
                          </p>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex items-start gap-2.5 pl-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                          VB
                        </div>
                        <div className="flex-1 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                          <div className="flex items-center justify-between text-[10px] text-amber-400/80 mb-1">
                            <span className="font-bold text-amber-300">VenkateshBhaiya Assistant (AI)</span>
                            {turn.isSafetyRefusal && (
                              <span className="text-rose-400 font-semibold">[Safety Refusal]</span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                            {turn.aiReply}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 text-xs">
                <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
                <span>Select a conversation from the left to read the full dialogue.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
