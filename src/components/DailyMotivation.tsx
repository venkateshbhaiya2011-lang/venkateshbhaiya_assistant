import React, { useState, useEffect, useCallback } from "react";
import {
  Quote,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Volume2,
  VolumeX,
  Calendar,
  Heart,
  Share2,
  ArrowRight,
  Sun,
  Compass,
  History,
  X,
} from "lucide-react";
import { DailyMotivationQuote } from "../types";
import {
  getDailyQuote,
  getRandomQuote,
  formatQuoteDate,
} from "../data/quotes";

interface DailyMotivationProps {
  onNavigateToChat: (initialMessage?: string) => void;
  className?: string;
}

export const DailyMotivation: React.FC<DailyMotivationProps> = ({
  onNavigateToChat,
  className = "",
}) => {
  // Initialize with deterministic daily quote immediately (zero layout shift & instant render)
  const [quote, setQuote] = useState<DailyMotivationQuote>(() => getDailyQuote());
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [formattedDate, setFormattedDate] = useState(() => formatQuoteDate());
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Recent Quotes state: last 5 quotes seen
  const [recentQuotes, setRecentQuotes] = useState<DailyMotivationQuote[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vb_recent_quotes_seen");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5);
          }
        }
      } catch (e) {
        console.warn("Could not load recent quotes from storage:", e);
      }
    }
    return [getDailyQuote()];
  });
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  // Sync current quote to recent quotes list
  useEffect(() => {
    if (!quote || !quote.quote) return;
    setRecentQuotes((prev) => {
      const filtered = prev.filter((q) => q.id !== quote.id && q.quote !== quote.quote);
      const updated = [quote, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("vb_recent_quotes_seen", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not persist recent quotes:", e);
      }
      return updated;
    });
  }, [quote]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isRecentModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsRecentModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecentModalOpen]);

  // Fetch from server API with graceful offline fallback
  const fetchMotivation = useCallback(async (isRefresh = false) => {
    setIsLoading(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const cacheBuster = Date.now();
      const url = isRefresh
        ? `/api/daily-motivation?refresh=true&exclude=${encodeURIComponent(quote.id)}&_t=${cacheBuster}`
        : `/api/daily-motivation?_t=${cacheBuster}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.quote) {
          setQuote({
            id: data.id || `quote-${Date.now()}`,
            quote: data.quote,
            author: data.author || "VenkateshBhaiya",
            category: data.category || "Wisdom",
            hindiMeaning: data.hindiMeaning,
            sourceNote: data.sourceNote,
            dateKey: data.dateKey,
          });
          if (data.dateFormatted) {
            setFormattedDate(data.dateFormatted);
          }
          if (isRefresh) {
            setRefreshNotice("New inspiring quote loaded!");
            setTimeout(() => setRefreshNotice(null), 2500);
          }
          return;
        }
      }
      // Fallback if API response wasn't OK
      if (isRefresh) {
        setQuote(getRandomQuote(quote.id));
        setRefreshNotice("New inspiring quote loaded!");
        setTimeout(() => setRefreshNotice(null), 2500);
      } else {
        setQuote(getDailyQuote());
      }
    } catch {
      // Offline fallback: Use deterministic or random from local quotes library
      if (isRefresh) {
        setQuote(getRandomQuote(quote.id));
        setRefreshNotice("New inspiring quote loaded!");
        setTimeout(() => setRefreshNotice(null), 2500);
      } else {
        setQuote(getDailyQuote());
      }
    } finally {
      setIsLoading(false);
    }
  }, [quote.id]);

  useEffect(() => {
    // Initial silent sync with server
    fetchMotivation(false);
  }, []);

  // Stop speech if unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Copy quote to clipboard
  const handleCopy = async () => {
    const textToCopy = `"${quote.quote}"\n— ${quote.author} (${quote.category})`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy quote:", err);
    }
  };

  // Text-to-Speech playback
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(quote.quote);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    
    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(
      (v) => v.lang.startsWith("en-IN") || v.lang.startsWith("en-US") || v.lang.startsWith("en")
    );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Discuss in chat handler
  const handleDiscussInChat = () => {
    if (isSpeaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const starterMessage = `Namaste Bhaiya! I was reading today's motivation: "${quote.quote}". Could you share some personal advice on how I can apply this wisdom to stay focused, calm, and consistent?`;
    onNavigateToChat(starterMessage);
  };

  return (
    <section
      id="daily-motivation-section"
      aria-label="Daily Motivation from VenkateshBhaiya"
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 liquid-glass-panel border border-white/10 shadow-xl backdrop-blur-2xl transition-all ${className}`}
    >
      {/* Specular top sheen */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 sm:space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              id="daily-motivation-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs tracking-wide shadow-xs"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Motivation</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formattedDate}</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-semibold text-amber-200/90">
              {quote.category}
            </span>
          </div>

          {/* Quick Action Controls: Shuffle / Audio / Copy */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Listen Button */}
            {typeof window !== "undefined" && "speechSynthesis" in window && (
              <button
                id="daily-motivation-listen-btn"
                type="button"
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center gap-1 ${
                  isSpeaking
                    ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md animate-pulse"
                    : "liquid-glass-subtle border-white/10 text-zinc-300 hover:text-amber-300 hover:border-amber-500/30"
                }`}
                title={isSpeaking ? "Stop reading quote" : "Listen to quote"}
                aria-label={isSpeaking ? "Stop audio" : "Play audio"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Playing</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Listen</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Button */}
            <button
              id="daily-motivation-copy-btn"
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl liquid-glass-subtle border border-white/10 text-zinc-300 hover:text-amber-300 hover:border-amber-500/30 text-xs transition cursor-pointer flex items-center gap-1"
              title="Copy quote to clipboard"
              aria-label="Copy quote"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-semibold hidden md:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden md:inline">Copy</span>
                </>
              )}
            </button>

            {/* Recent Quotes Button: Opens last 5 quotes modal */}
            <button
              id="daily-motivation-recent-btn"
              type="button"
              onClick={() => setIsRecentModalOpen(true)}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl liquid-glass-subtle border border-white/10 text-zinc-300 hover:text-amber-300 hover:border-amber-500/30 text-xs transition cursor-pointer flex items-center gap-1.5"
              title="View the last 5 quotes you've seen"
              aria-label="View recent quotes"
            >
              <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium hidden sm:inline">Recent</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono font-bold leading-none">
                {recentQuotes.length}
              </span>
            </button>

            {/* Dedicated Refresh Icon Button: Fetches new inspiring quote on-demand */}
            <button
              id="daily-motivation-refresh-btn"
              type="button"
              onClick={() => fetchMotivation(true)}
              disabled={isLoading}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-xs"
              title="Refresh quote: Fetch a new inspiring thought on-demand without waiting for tomorrow"
              aria-label="Refresh quote on-demand"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-amber-400 shrink-0 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="text-[11px] sm:text-xs">Refresh</span>
            </button>
          </div>
        </div>

        {/* On-demand refresh success badge */}
        {refreshNotice && (
          <div
            id="daily-motivation-refresh-notice"
            className="py-1 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-200 w-fit"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{refreshNotice}</span>
          </div>
        )}

        {/* Main Quote Content Card */}
        <div className="relative p-4 sm:p-6 rounded-2xl liquid-glass-subtle border border-white/10 shadow-inner">
          <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/20 absolute -top-2 -left-1 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <blockquote className="text-base sm:text-lg md:text-xl font-medium text-zinc-100 italic leading-relaxed tracking-tight">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>

            {/* Hindi translation / meaning if available */}
            {quote.hindiMeaning && (
              <p className="text-xs sm:text-sm text-amber-200/80 font-normal leading-relaxed border-l-2 border-amber-500/40 pl-3 italic">
                {quote.hindiMeaning}
              </p>
            )}

            {/* Author & Source Footnote */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-zinc-950 font-black text-[10px] shadow-sm">
                  VB
                </div>
                <span className="text-xs sm:text-sm font-bold text-zinc-200">
                  {quote.author}
                </span>
                {quote.sourceNote && (
                  <span className="hidden sm:inline text-[11px] text-zinc-400">
                    • {quote.sourceNote}
                  </span>
                )}
              </div>

              {/* Mobile date display */}
              <div className="sm:hidden text-[11px] text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-600" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row: Discuss in Chat */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="line-clamp-1">
              Reflect on this quote or ask Bhaiya for personal guidance on this topic.
            </span>
          </div>

          <button
            id="daily-motivation-discuss-btn"
            type="button"
            onClick={handleDiscussInChat}
            className="liquid-glass-button text-zinc-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md cursor-pointer shrink-0 active:scale-95 transition-all min-h-[42px]"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Discuss with Bhaiya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Quotes Slide-out / Modal */}
      {isRecentModalOpen && (
        <div
          id="recent-quotes-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recent-quotes-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRecentModalOpen(false);
          }}
        >
          <div
            id="recent-quotes-modal-content"
            className="w-full max-w-xl liquid-glass-panel border border-white/15 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-200 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-zinc-950/60 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="recent-quotes-modal-title" className="font-bold text-zinc-100 text-sm sm:text-base">
                    Recent Quotes
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Last {recentQuotes.length} quotes you&apos;ve seen
                  </p>
                </div>
              </div>

              <button
                id="recent-quotes-close-btn"
                type="button"
                onClick={() => setIsRecentModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition cursor-pointer"
                aria-label="Close recent quotes modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Quote List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {recentQuotes.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No recent quotes yet.
                </div>
              ) : (
                recentQuotes.map((item, idx) => {
                  const isCurrent = item.id === quote.id;
                  const isItemCopied = copiedQuoteId === item.id;
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-amber-500/10 border-amber-500/35 shadow-xs"
                          : "liquid-glass-subtle border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {item.category || "Wisdom"}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Active Now
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          #{idx + 1}
                        </span>
                      </div>

                      <blockquote className="text-xs sm:text-sm text-zinc-100 italic leading-relaxed mb-2">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>

                      {item.hindiMeaning && (
                        <p className="text-[11px] text-amber-200/80 italic mb-2 border-l-2 border-amber-500/30 pl-2">
                          {item.hindiMeaning}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-zinc-400 font-medium">
                          — {item.author || "VenkateshBhaiya"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Copy button */}
                          <button
                            type="button"
                            onClick={async () => {
                              const text = `"${item.quote}" — ${item.author}`;
                              try {
                                if (navigator?.clipboard?.writeText) {
                                  await navigator.clipboard.writeText(text);
                                }
                                setCopiedQuoteId(item.id);
                                setTimeout(() => setCopiedQuoteId(null), 2000);
                              } catch {
                                // clipboard fallback
                              }
                            }}
                            className="px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-[10px] transition cursor-pointer flex items-center gap-1"
                            title="Copy this quote"
                          >
                            {isItemCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Set as active if not current */}
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuote(item);
                                setIsRecentModalOpen(false);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[10px] font-semibold transition cursor-pointer"
                            >
                              Show in Main Card
                            </button>
                          ) : null}

                          {/* Discuss in Chat */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsRecentModalOpen(false);
                              onNavigateToChat(
                                `Bhaiya, please guide me on this quote: "${item.quote}"`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] transition cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Discuss</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
              <span>Automatically updates as you discover new quotes</span>
              <button
                type="button"
                onClick={() => setIsRecentModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
