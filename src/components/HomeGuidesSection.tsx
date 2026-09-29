import React, { useState, useMemo } from "react";
import {
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Shield,
  FileText,
  Download,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { InfoModalTab } from "./InfoModals";
import { triggerHaptic } from "../utils/haptics";

export interface InformationalArticle {
  id: string;
  title: string;
  category: "Getting Started" | "Privacy & Safety" | "Study & Docs" | "App Setup" | "Community" | "Support & FAQs";
  summary: string;
  fullContent: string;
  keyPoints: string[];
  actionLabel?: string;
  actionType?: "chat" | "modal" | "url";
  modalTab?: InfoModalTab;
  promptExample?: string;
}

// Calculate estimated reading time helper function
export function calculateReadingTime(text: string): { minutes: number; wordCount: number; label: string } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return {
    minutes,
    wordCount: words,
    label: `${minutes} min read`,
  };
}

const ARTICLES_DATA: InformationalArticle[] = [
  {
    id: "getting-started-guide",
    title: "Getting Started with VenkateshBhaiya Assistant",
    category: "Getting Started",
    summary:
      "A complete introduction to conversing naturally with your AI assistant, picking the ideal personality tone, asking study questions, and drafting professional communications.",
    fullContent: `VenkateshBhaiya Assistant is an AI-powered conversational platform engineered to provide polite, encouraging, and accurate assistance for everyday inquiries, study challenges, and professional writing.

### 1. Starting Your First Conversation
You can start a chat immediately from the Home section or by selecting the Chat tab in the navigation bar. Type any question into the prompt input or select from one of our pre-configured quick suggestion chips such as "Help me revise a topic" or "Daily advice & guidance".

### 2. Selecting Personality Tones
Depending on your preference, you can customize how the assistant responds:
- **Encouraging:** Warm, motivating, and patient, ideal for daily inspiration and self-improvement.
- **Concise:** Direct and brief bullet points, perfect for quick answers and busy schedules.
- **Thoughtful:** In-depth, analytical explanations suited for academic topics and deep comprehension.

### 3. Asking Effective Questions
For the most helpful answers, provide clear context in your prompt. Whether you need step-by-step revision help, interview preparation advice, or polite letter formatting, the assistant adapts to your tone and context.`,
    keyPoints: [
      "Natural conversation with instant response streaming",
      "Switchable personality tones (Encouraging, Concise, Thoughtful)",
      "Zero keyword complexity — ask questions in plain Hindi or English",
    ],
    actionLabel: "Start a Conversation",
    actionType: "chat",
    promptExample: "Namaste! Can you give me a 5-step plan to prepare for upcoming exams?",
  },
  {
    id: "privacy-and-data-protection",
    title: "Privacy-First Architecture & Data Protection",
    category: "Privacy & Safety",
    summary:
      "An in-depth explanation of our zero-exposure public profile policy, transparent session encryption, and visitor privacy protections.",
    fullContent: `At VenkateshBhaiya Assistant, visitor privacy is built directly into our platform architecture rather than added as an afterthought.

### 1. Instant Access Without Gatekeeping
You can explore, ask questions, and chat with VenkateshBhaiya Assistant immediately without mandatory email verification or barriers.

### 2. Strict Zero-Exposure Policy
Your personal data is treated with utmost care:
- **Never Publicly Displayed:** Your personal details or contact information are never shown on the website, public feeds, or community views.
- **No Third-Party Reselling:** We do not market, sell, or disclose your information to any third parties.
- **Local Control:** You can clear your conversation history and device records at any time.

### 3. Transparent Security
All communication with VenkateshBhaiya Assistant uses secure, encrypted transport protocols to keep your conversations private.`,
    keyPoints: [
      "Immediate visitor access without intrusive verification gates",
      "Never displayed in public profiles, chat logs, or website pages",
      "Full local device control to clear data and conversations anytime",
      "Private communication completely separated from public website content",
    ],
    actionLabel: "Review Privacy Controls",
    actionType: "modal",
    modalTab: "privacy",
  },
  {
    id: "study-notes-and-documents",
    title: "Accessing Study Materials & Document Requests",
    category: "Study & Docs",
    summary:
      "A step-by-step walkthrough on how students can request curated educational PDFs, access approved study guides, and receive moderator dispatch notifications.",
    fullContent: `Education and student empowerment are core to the VenkateshBhaiya mission. The platform provides a dedicated Document Request and Dispatch system to help learners obtain verified study materials.

### 1. How to Request Study Materials
If you need specific revision notes, exam syllabus outlines, or interview preparation guides:
1. Navigate to the **Documents** section via the top navigation or Quick Actions on the Home page.
2. Click **Request Document** and enter the topic or subject you need.
3. Submit your request for moderator review.

### 2. Review and Dispatch Workflow
Our moderators review incoming document inquiries. Once an educational document is verified and approved:
- A real-time notification is dispatched to your account.
- The PDF or study document becomes accessible in your **My Documents** dashboard.
- You can preview the document or download it directly to your device for offline studying.

### 3. Academic Integrity & Safety
All requested materials adhere to copyright and educational standards. We focus on curated revision summaries, formula sheets, and study methodologies.`,
    keyPoints: [
      "Request targeted study PDFs and revision notes directly through the portal",
      "Moderator review ensures authentic, helpful educational resources",
      "Instant notification alerts when requested study materials are dispatched",
    ],
    actionLabel: "Open Documents Portal",
    actionType: "modal",
    modalTab: "documents",
  },
  {
    id: "pwa-app-install-guide",
    title: "Installing VenkateshBhaiya Assistant as a PWA",
    category: "App Setup",
    summary:
      "Instructions for installing the assistant as a fast, lightweight Progressive Web App on Android, iOS, Windows, and Mac for one-tap home screen access and offline capabilities.",
    fullContent: `Enjoy a native app experience without downloading heavy files from an app store. VenkateshBhaiya Assistant is fully compliant with modern Progressive Web App (PWA) standards.

### 1. Installing on Android & Mobile Chrome
1. Open https://venkateshbhaiya.ai.studio/ in Google Chrome on your Android device.
2. Tap the **Install App** button on the Home page or tap the three-dots menu in Chrome.
3. Select **Add to Home screen** or **Install App**.
4. The VenkateshBhaiya icon will appear directly in your app drawer and home screen.

### 2. Installing on Apple iOS (Safari)
1. Open the website in Safari on your iPhone or iPad.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right corner.

### 3. Benefits of the Installed App
- **Instant Launch:** Opens full-screen without address bar clutter.
- **Fast Local Caching:** Shell assets and icons are cached locally for rapid startup.
- **Haptic Touch Support:** Responsive tactile feedback on supported mobile devices.`,
    keyPoints: [
      "Lightweight installation with zero storage bloat (< 2MB)",
      "Full-screen native experience on Android and iOS",
      "Instant home screen access with offline shell caching",
    ],
    actionLabel: "View App Install Guide",
    actionType: "modal",
    modalTab: "download",
  },
  {
    id: "community-etiquette-rules",
    title: "Community Etiquette & Respectful Interaction",
    category: "Community",
    summary:
      "Our shared commitment to polite, respectful dialogue, constructive learning, anti-bullying protections, and ethical AI assistance across the platform.",
    fullContent: `The VenkateshBhaiya Assistant platform is dedicated to maintaining a high standard of respect, kindness, and moral encouragement for all visitors.

### 1. Respectful Communication
Every user deserves a supportive, safe environment. We ask all visitors to treat the assistant and fellow community members with the same courtesy they would extend in person:
- Ask questions thoughtfully and avoid vulgar, hateful, or abusive phrasing.
- If an abusive prompt is detected, our safety guardrails will respectfully decline to process it and suggest asking constructively.

### 2. Ethical Learning Support
The assistant is designed to facilitate genuine learning, conceptual clarity, and critical thinking:
- Use the assistant to understand complex topics, explain formulas, or summarize texts.
- Do not attempt to use the platform to violate examination rules or generate harmful materials.

### 3. Official Channels & Identity
Always verify community announcements through our official verified links (YouTube: @officialvenkateshbhaiya, Instagram: @venkatesh_bhaiya_official).`,
    keyPoints: [
      "Zero tolerance for harassment, abuse, or vulgarity",
      "Automated safety guardrails promoting polite, thoughtful dialogue",
      "Encouraging environment centered on student growth and mutual respect",
    ],
    actionLabel: "Read Terms of Service",
    actionType: "modal",
    modalTab: "terms",
  },
  {
    id: "troubleshooting-and-faqs",
    title: "Troubleshooting & Problem Resolution FAQ",
    category: "Support & FAQs",
    summary:
      "Quick solutions for common questions regarding online availability indicators, multi-tab synchronization, browser cache refreshes, and session restoration.",
    fullContent: `Encountering an issue or have questions about how the platform operates? Here are the most common questions and quick troubleshooting steps.

### 1. Why does Venkatesh Bhaiya show as Online or Offline?
The online status indicator reflects current broadcast availability. Even when offline, the AI Assistant remains active 24/7 with full conversational capabilities.

### 2. How does Multi-Tab Synchronization work?
When you log in, verify your email, or log out in one browser tab, our BroadcastChannel API synchronizes your session across all other active tabs in real time without requiring manual page refreshes.

### 3. What should I do if a message fails to send?
If a network hiccup occurs, click the **Retry** button directly next to the failed message. You can also test your connection or continue with a shorter prompt.

### 4. Clearing Local Storage and Resetting
If you ever want to clear your local chat history or temporary cookies, navigate to Settings > Privacy Controls > Clear Local Data. This completely wipes local caches.`,
    keyPoints: [
      "Real-time cross-tab synchronization via BroadcastChannel API",
      "Instant retry button for transient network drops",
      "One-click local cache clearing in Privacy Controls",
    ],
    actionLabel: "Open Help Center",
    actionType: "modal",
    modalTab: "help",
  },
];

interface HomeGuidesSectionProps {
  onNavigateToChat: (prompt?: string) => void;
  onOpenInfoModal?: (type: InfoModalTab) => void;
}

export const HomeGuidesSection: React.FC<HomeGuidesSectionProps> = ({
  onNavigateToChat,
  onOpenInfoModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Compute reading time metrics for all articles
  const articlesWithMetrics = useMemo(() => {
    return ARTICLES_DATA.map((article) => {
      const combinedText = `${article.title} ${article.summary} ${article.fullContent} ${article.keyPoints.join(" ")}`;
      const metrics = calculateReadingTime(combinedText);
      return {
        ...article,
        readingTime: metrics.label,
        wordCount: metrics.wordCount,
      };
    });
  }, []);

  // Filtered articles based on search and category
  const filteredArticles = useMemo(() => {
    return articlesWithMetrics.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articlesWithMetrics, selectedCategory, searchQuery]);

  const categories = [
    "All",
    "Getting Started",
    "Privacy & Safety",
    "Study & Docs",
    "App Setup",
    "Community",
    "Support & FAQs",
  ];

  const handleToggleExpand = (id: string) => {
    triggerHaptic("selection");
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };

  const handleArticleAction = (article: (typeof articlesWithMetrics)[0]) => {
    triggerHaptic("medium");
    if (article.actionType === "chat") {
      onNavigateToChat(article.promptExample);
    } else if (article.actionType === "modal" && article.modalTab && onOpenInfoModal) {
      onOpenInfoModal(article.modalTab);
    }
  };

  return (
    <section
      id="homepage-guides-documentation-section"
      className="space-y-4 pt-2"
      aria-labelledby="guides-section-title"
    >
      {/* Header with Title and Reading Time Indicator badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guides &amp; Documentation</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-semibold text-amber-300">
              <Clock className="w-2.5 h-2.5" />
              <span>Estimated Reading Times</span>
            </span>
          </div>
          <h2
            id="guides-section-title"
            className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight"
          >
            Informational Guides &amp; Support Snippets
          </h2>
          <p className="text-xs text-zinc-400">
            Quick documentation snippets to help you assess content length and master the assistant.
          </p>
        </div>

        {/* Search input for guides */}
        <div className="relative w-full sm:w-64 shrink-0">
          <input
            id="guides-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides & snippets..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 transition"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer touch-manipulation select-none active:scale-95 ${
              selectedCategory === cat
                ? "bg-amber-500 text-zinc-950 shadow-sm font-bold"
                : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5 hover:border-white/15"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticleId === article.id;

          return (
            <article
              key={article.id}
              id={`article-card-${article.id}`}
              className={`liquid-glass-subtle rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                isExpanded
                  ? "border-amber-500/50 bg-zinc-900/90 shadow-xl md:col-span-2"
                  : "border-white/10 hover:border-amber-500/30 bg-zinc-900/60"
              }`}
            >
              <div className="p-4 sm:p-5 space-y-3">
                {/* Meta Header: Category & Estimated Reading Time Indicator */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 uppercase tracking-wide">
                    {article.category}
                  </span>

                  {/* PROMINENT ESTIMATED READING TIME INDICATOR */}
                  <div
                    id={`reading-time-${article.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium"
                    title={`Estimated reading time based on standard reading speed: ${article.readingTime}`}
                  >
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-bold">{article.readingTime}</span>
                    <span className="text-zinc-400 text-[10px]">({article.wordCount} words)</span>
                  </div>
                </div>

                {/* Article Title */}
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                  {article.title}
                </h3>

                {/* Summary Snippet */}
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {article.summary}
                </p>

                {/* Expanded Full Content View */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
                    {/* Key Takeaways */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Key Points &amp; Quick Takeaways</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-zinc-300 pl-1">
                        {article.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Full Documentation Snippet Text */}
                    <div className="prose prose-invert prose-xs text-xs text-zinc-300 space-y-2.5 max-w-none leading-relaxed">
                      {article.fullContent.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("### ")) {
                          return (
                            <h4
                              key={pIdx}
                              className="text-xs font-bold text-amber-300 pt-1.5 border-b border-white/5 pb-1"
                            >
                              {para.replace("### ", "")}
                            </h4>
                          );
                        }
                        return (
                          <p key={pIdx} className="text-zinc-300">
                            {para}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="px-4 sm:px-5 py-2.5 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between gap-2">
                <button
                  id={`toggle-expand-btn-${article.id}`}
                  type="button"
                  onClick={() => handleToggleExpand(article.id)}
                  className="text-xs font-semibold text-zinc-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition select-none"
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? "Collapse Snippet" : "Read Full Snippet"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>

                {article.actionLabel && (
                  <button
                    id={`action-btn-${article.id}`}
                    type="button"
                    onClick={() => handleArticleAction(article)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer select-none"
                  >
                    <span>{article.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="p-8 text-center text-zinc-500 text-xs liquid-glass-subtle rounded-2xl border border-white/5">
          No articles match your search or filter. Try clearing the search query.
        </div>
      )}
    </section>
  );
};
