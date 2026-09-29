import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Menu,
  Plus,
  Share2,
  MoreVertical,
  Send,
  Mic,
  MicOff,
  Paperclip,
  X,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Search,
  Trash2,
  Edit2,
  MessageSquare,
  Home as HomeIcon,
  Sliders,
  User as UserIcon,
  ChevronDown,
  FileText,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Shield,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserAccount,
  Conversation,
  ChatMessage,
  PersonalityTone,
  ChatMessageAttachment,
  ThemeMode,
} from "../types";
import { StorageService } from "../services/storage";
import { executeRecaptcha } from "../services/recaptcha";
import {
  saveConversationToFirestore,
  saveMessageToFirestore,
  deleteConversationFromFirestore,
  loadUserConversationsFromFirestore,
  isFirebaseAuthenticated,
  auth,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { VBAvatar } from "./VBAvatar";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { triggerHaptic } from "../utils/haptics";

/**
 * Generate a short, clean, privacy-conscious conversation title
 * from the first user prompt. Truncates cleanly with ellipsis.
 */
export function generateConversationTitle(prompt: string): string {
  if (!prompt || !prompt.trim()) return "New Conversation";

  // Clean code blocks, urls, markdown, and extra whitespace
  let clean = prompt
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Strip generic intro filler phrases
  const fillers = [
    /^(hi|hello|hey|namaste|greetings)\b[,.!\s]*/i,
    /^(please|can you|could you|would you)\b[,.!\s]*/i,
    /^(tell me about|explain to me|help me with|what is|who is|how to|why is)\b[,.!\s]*/i,
    /^(i want to know|i need help with|can you tell me)\b[,.!\s]*/i,
  ];
  for (const r of fillers) {
    clean = clean.replace(r, "").trim();
  }

  if (!clean || clean.length < 2) {
    clean = prompt.slice(0, 28).trim();
  }

  // Capitalize first letter
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);

  // Truncate to maximum 32 chars
  if (clean.length > 32) {
    const truncated = clean.slice(0, 32);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 16 ? truncated.slice(0, lastSpace) : truncated) + "…";
  }

  return clean || "New Conversation";
}

// Group conversations chronologically
function groupConversations(convs: Conversation[]) {
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const previous7Days: Conversation[] = [];
  const older: Conversation[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  for (const c of convs) {
    const time = new Date(c.updatedAt || c.createdAt).getTime();
    if (time >= startOfToday) {
      today.push(c);
    } else if (time >= startOfYesterday) {
      yesterday.push(c);
    } else if (time >= startOf7Days) {
      previous7Days.push(c);
    } else {
      older.push(c);
    }
  }

  return { today, yesterday, previous7Days, older };
}

interface ChatSectionProps {
  currentUser: UserAccount | null;
  isVenkateshOnline: boolean;
  personalityTone: PersonalityTone;
  onOpenAccountModal: () => void;
  onOpenSettings?: () => void;
  onOpenPrivacy?: () => void;
  pendingInitialPrompt?: string;
  onClearInitialPrompt?: () => void;
  initialConversationId?: string;
  onNavigateHome?: () => void;
  // Optional legacy props maintained for compatibility
  chatAppearance?: string;
  onToggleChatAppearance?: () => void;
  onToggleStatus?: () => void;
  defaultMobileTab?: "chat" | "history";
}

/**
 * Skeleton loading state component displayed while awaiting AI response.
 * Features realistic paragraph lines, structured list preview, and animated shimmer
 * to dramatically improve perceived performance and visual smoothness.
 */
interface ChatResponseSkeletonProps {
  isVenkateshOnline: boolean;
  isStillWorking: boolean;
}

export const ChatResponseSkeleton: React.FC<ChatResponseSkeletonProps> = ({
  isVenkateshOnline,
  isStillWorking,
}) => {
  return (
    <motion.div
      id="chat-response-skeleton"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full flex items-start gap-3 sm:gap-3.5 pt-1 select-none"
      role="status"
      aria-label="Generating AI response"
    >
      {/* VenkateshBhaiya Avatar with subtle status pulse */}
      <div className="mt-1 shrink-0 relative">
        <VBAvatar size="xs" isOnline={isVenkateshOnline} />
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
      </div>

      {/* Skeleton Content Block */}
      <div className="flex-1 min-w-0 pr-1 space-y-3">
        {/* Status indicator pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-300 backdrop-blur-sm shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
            <span>{isStillWorking ? "Still polishing response…" : "Synthesizing response…"}</span>
          </div>
          <div className="flex items-center gap-1 opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        {/* Paragraph 1 Skeleton Lines */}
        <div className="space-y-2 max-w-2xl">
          <div className="h-3.5 rounded-lg bg-zinc-800/80 border border-white/5 animate-skeleton-shimmer w-[92%]" />
          <div className="h-3.5 rounded-lg bg-zinc-800/70 border border-white/5 animate-skeleton-shimmer w-[97%]" style={{ animationDelay: "120ms" }} />
          <div className="h-3.5 rounded-lg bg-zinc-800/60 border border-white/5 animate-skeleton-shimmer w-[76%]" style={{ animationDelay: "240ms" }} />
        </div>

        {/* Structured bullet list preview */}
        <div className="space-y-2 max-w-xl pl-2.5 border-l-2 border-amber-500/25 py-0.5 my-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
            <div className="h-3 rounded-md bg-zinc-800/70 border border-white/5 animate-skeleton-shimmer w-[84%]" style={{ animationDelay: "360ms" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
            <div className="h-3 rounded-md bg-zinc-800/60 border border-white/5 animate-skeleton-shimmer w-[68%]" style={{ animationDelay: "480ms" }} />
          </div>
        </div>

        {/* Highlight quote/code card preview */}
        <div className="rounded-xl p-3 bg-zinc-900/40 border border-zinc-800/80 space-y-2 max-w-lg shadow-inner">
          <div className="h-2.5 rounded bg-zinc-800/80 animate-skeleton-shimmer w-[48%]" style={{ animationDelay: "600ms" }} />
          <div className="h-2.5 rounded bg-zinc-800/60 animate-skeleton-shimmer w-[72%]" style={{ animationDelay: "720ms" }} />
        </div>
      </div>
    </motion.div>
  );
};

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentUser,
  isVenkateshOnline,
  personalityTone,
  onOpenAccountModal,
  onOpenSettings,
  pendingInitialPrompt,
  onClearInitialPrompt,
  initialConversationId,
  onNavigateHome,
  onOpenPrivacy,
}) => {
  // 1. Conversations state (initialized synchronously to eliminate race conditions on first mount)
  const userId = currentUser ? currentUser.id : "guest_user";
  const userName = currentUser ? currentUser.name : "Guest";

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const localList = StorageService.getConversations(userId);
    if (localList.length > 0) return localList;
    const defaultConv = StorageService.createDefaultConversation(userId, userName);
    StorageService.saveConversations(userId, [defaultConv]);
    StorageService.setActiveConversationId(userId, defaultConv.id);
    return [defaultConv];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const localList = StorageService.getConversations(userId);
    const savedActive = initialConversationId || StorageService.getActiveConversationId(userId);
    if (savedActive && localList.some((c) => c.id === savedActive)) {
      return savedActive;
    }
    return localList[0]?.id || "";
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStillWorking, setIsStillWorking] = useState(false);

  // 2. Attachments & Voice
  const [attachments, setAttachments] = useState<ChatMessageAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechActiveId, setSpeechActiveId] = useState<string | null>(null);

  // 3. UI overlays
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // 4. Rename modal
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState("");

  // 5. Theme
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => StorageService.getThemeMode());

  // 6. Keyboard & Viewport handling for Android
  const [viewportBottomOffset, setViewportBottomOffset] = useState<number>(0);

  // 7. Privacy & Storage Disclosure State
  const [isPrivacyNoticeDismissed, setIsPrivacyNoticeDismissed] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const workingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Active conversation memo
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  }, [conversations, activeConvId]);

  // Load conversations on mount & user change
  useEffect(() => {
    const userId = currentUser ? currentUser.id : "guest_user";
    const userName = currentUser ? currentUser.name : "Guest";

    const localList = StorageService.getConversations(userId);
    if (localList.length > 0) {
      setConversations(localList);
      const savedActive = initialConversationId || StorageService.getActiveConversationId(userId);
      if (savedActive && localList.some((c) => c.id === savedActive)) {
        setActiveConvId(savedActive);
      } else {
        setActiveConvId(localList[0].id);
      }
    } else {
      const defaultConv = StorageService.createDefaultConversation(userId, userName);
      setConversations([defaultConv]);
      setActiveConvId(defaultConv.id);
    }

    // Sync from Firestore if authenticated with Firebase Auth
    if (currentUser && !currentUser.isGuest && isFirebaseAuthenticated(currentUser.id)) {
      loadUserConversationsFromFirestore(currentUser.id)
        .then((remoteConvs) => {
          if (remoteConvs && remoteConvs.length > 0) {
            setConversations(remoteConvs);
            StorageService.saveConversations(currentUser.id, remoteConvs);
            if (!activeConvId || !remoteConvs.some((c) => c.id === activeConvId)) {
              setActiveConvId(remoteConvs[0].id);
            }
          }
        })
        .catch(console.warn);
    }
  }, [currentUser?.id, initialConversationId]);

  // Listen for Firebase Auth state resolution to sync remote conversations when ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && currentUser && currentUser.id === firebaseUser.uid && !currentUser.isGuest) {
        loadUserConversationsFromFirestore(firebaseUser.uid)
          .then((remoteConvs) => {
            if (remoteConvs && remoteConvs.length > 0) {
              setConversations(remoteConvs);
              StorageService.saveConversations(firebaseUser.uid, remoteConvs);
              setActiveConvId((prev) => (prev && remoteConvs.some((c) => c.id === prev) ? prev : remoteConvs[0].id));
            }
          })
          .catch(console.warn);
      }
    });
    return unsubscribe;
  }, [currentUser?.id]);

  // Update storage whenever conversations change
  const updateConversationsState = (nextConvs: Conversation[]) => {
    setConversations(nextConvs);
    const userId = currentUser ? currentUser.id : "guest_user";
    StorageService.saveConversations(userId, nextConvs);
  };

  // Switch active conversation
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    const userId = currentUser ? currentUser.id : "guest_user";
    StorageService.setActiveConversationId(userId, id);
    setIsDrawerOpen(false);
    setIsMoreMenuOpen(false);
  };

  // Start a fresh conversation
  const handleStartNewChat = () => {
    const userId = currentUser ? currentUser.id : "guest_user";
    const newConv: Conversation = {
      id: "conv_" + Date.now(),
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    const nextList = [newConv, ...conversations];
    updateConversationsState(nextList);
    setActiveConvId(newConv.id);
    StorageService.setActiveConversationId(userId, newConv.id);
    setIsDrawerOpen(false);
    setIsMoreMenuOpen(false);
    setInputMessage("");
    setAttachments([]);

    if (currentUser && !currentUser.isGuest) {
      saveConversationToFirestore(currentUser.id, newConv).catch(console.warn);
    }

    // Focus input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Safe functional conversation state updater (prevents stale closure issues during streaming)
  const saveOrUpdateConversation = (targetConv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === targetConv.id);
      const nextList = exists
        ? prev.map((c) => (c.id === targetConv.id ? targetConv : c))
        : [targetConv, ...prev];
      const uId = currentUser ? currentUser.id : "guest_user";
      StorageService.saveConversations(uId, nextList);
      return nextList;
    });
  };

  // Scroll to bottom on message change or streaming
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeConvId]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom(true);
    }
  }, [isLoading, activeConversation?.messages]);

  // Android Keyboard & visualViewport listener
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // If keyboard opened, vv.height shrinks relative to innerHeight
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setViewportBottomOffset(offset);
      if (offset > 0) {
        scrollToBottom(true);
      }
    };

    window.visualViewport.addEventListener("resize", handleVisualViewportChange);
    window.visualViewport.addEventListener("scroll", handleVisualViewportChange);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleVisualViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleVisualViewportChange);
    };
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Handle auto-expanding textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${Math.max(nextHeight, 42)}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Toast helper
  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 2400);
  };

  // Thinking State timer: after 4 seconds switch to "Still working…"
  useEffect(() => {
    if (isLoading) {
      setIsStillWorking(false);
      workingTimerRef.current = setTimeout(() => {
        setIsStillWorking(true);
      }, 4000);
    } else {
      setIsStillWorking(false);
      if (workingTimerRef.current) {
        clearTimeout(workingTimerRef.current);
      }
    }
    return () => {
      if (workingTimerRef.current) clearTimeout(workingTimerRef.current);
    };
  }, [isLoading]);

  // File & Image Attachment handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        showToast("File exceeds 10MB limit");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Web Speech API: Speech-to-Text Input
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported in this browser");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-Speech Output
  const handleReadAloud = (msg: ChatMessage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showToast("Speech synthesis not supported");
      return;
    }

    if (speechActiveId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeechActiveId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = msg.content
      .replace(/```[\s\S]*?```/g, "code block")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/https?:\/\/\S+/g, "link")
      .replace(/[#*_~>]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeechActiveId(msg.id);
    };
    utterance.onend = () => {
      setSpeechActiveId(null);
    };
    utterance.onerror = () => {
      setSpeechActiveId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Copy message to clipboard
  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Could not copy text");
    }
  };

  // Message Feedback (Helpful / Not Helpful)
  const handleFeedback = (msgId: string, feedback: "helpful" | "not_helpful") => {
    if (!activeConversation) return;

    const nextMessages = activeConversation.messages.map((m) =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m
    );

    const updatedConv: Conversation = {
      ...activeConversation,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    };

    updateConversationsState(
      conversations.map((c) => (c.id === activeConversation.id ? updatedConv : c))
    );
    showToast(feedback === "helpful" ? "Marked as helpful" : "Feedback recorded");
  };

  // Share conversation
  const handleShareConversation = async () => {
    if (!activeConversation) return;

    const shareTitle = activeConversation.title || "VenkateshBhaiya Assistant Chat";
    const shareText = activeConversation.messages
      .map((m) => `${m.role === "user" ? "You" : "VenkateshBhaiya Assistant"}: ${m.content}`)
      .join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText.slice(0, 4000),
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}`);
      showToast("Conversation copied to clipboard");
    } catch {
      showToast("Could not share conversation");
    }
  };

  // Rename conversation
  const handleOpenRename = (convId: string, currentTitle: string) => {
    setRenamingConvId(convId);
    setRenameTitleInput(currentTitle);
    setIsMoreMenuOpen(false);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingConvId) return;
    const finalTitle = renameTitleInput.trim() || "Conversation";

    const nextList = conversations.map((c) =>
      c.id === renamingConvId ? { ...c, title: finalTitle, updatedAt: new Date().toISOString() } : c
    );
    updateConversationsState(nextList);

    if (currentUser && !currentUser.isGuest) {
      const conv = nextList.find((c) => c.id === renamingConvId);
      if (conv) saveConversationToFirestore(currentUser.id, conv).catch(console.warn);
    }

    setRenamingConvId(null);
    showToast("Conversation renamed");
  };

  // Delete conversation
  const handleDeleteConversation = (convId: string) => {
    const remaining = conversations.filter((c) => c.id !== convId);
    const userId = currentUser ? currentUser.id : "guest_user";
    const userName = currentUser ? currentUser.name : "Guest";

    if (remaining.length === 0) {
      const defaultConv = StorageService.createDefaultConversation(userId, userName);
      setConversations([defaultConv]);
      setActiveConvId(defaultConv.id);
    } else {
      setConversations(remaining);
      if (activeConvId === convId) {
        setActiveConvId(remaining[0].id);
        StorageService.setActiveConversationId(userId, remaining[0].id);
      }
    }

    StorageService.saveConversations(userId, remaining.length > 0 ? remaining : conversations);

    if (currentUser && !currentUser.isGuest) {
      deleteConversationFromFirestore(currentUser.id, convId).catch(console.warn);
    }

    setIsMoreMenuOpen(false);
    showToast("Conversation deleted");
  };

  // Clear conversation messages
  const handleClearConversation = () => {
    if (!activeConversation) return;

    const clearedConv: Conversation = {
      ...activeConversation,
      messages: [],
      updatedAt: new Date().toISOString(),
    };

    const nextList = conversations.map((c) =>
      c.id === activeConversation.id ? clearedConv : c
    );
    updateConversationsState(nextList);

    if (currentUser && !currentUser.isGuest) {
      saveConversationToFirestore(currentUser.id, clearedConv).catch(console.warn);
    }

    setIsMoreMenuOpen(false);
    showToast("Messages cleared");
  };

  // Theme Toggle
  const handleToggleTheme = (mode: ThemeMode) => {
    setCurrentTheme(mode);
    StorageService.setThemeMode(mode);
    setIsMoreMenuOpen(false);
  };

  // Main Send Message Handler
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputMessage).trim();
    if ((!textToSend && attachments.length === 0) || isLoading) return;

    // Reset input
    if (customText === undefined) {
      setInputMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "42px";
      }
    }

    const currentFiles = [...attachments];
    setAttachments([]);

    const now = new Date();
    const userMsgId = "msg_user_" + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: currentFiles.length > 0 ? currentFiles : undefined,
    };

    // Auto-generate a title if conversation is brand new or default
    let updatedTitle = activeConversation?.title || "Conversation";
    const isFirstUserMessage = !activeConversation?.messages || activeConversation.messages.length === 0;

    if (isFirstUserMessage || updatedTitle === "New Conversation" || updatedTitle === "Welcome Chat") {
      updatedTitle = generateConversationTitle(textToSend);
    }

    // Determine target conversation:
    // If coming from homepage (customText) and active conversation already has messages, create a fresh conversation
    let currentConv = activeConversation;
    if (customText !== undefined && activeConversation && activeConversation.messages.length > 0) {
      currentConv = {
        id: "conv_" + Date.now(),
        title: generateConversationTitle(textToSend),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        messages: [],
      };
    } else if (!currentConv) {
      currentConv = {
        id: "conv_" + Date.now(),
        title: updatedTitle,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        messages: [],
      };
    }

    const updatedMessages = [...currentConv.messages, userMsg];
    const updatedConv: Conversation = {
      ...currentConv,
      title: (isFirstUserMessage || currentConv.messages.length === 0) ? generateConversationTitle(textToSend) : currentConv.title,
      updatedAt: now.toISOString(),
      messages: updatedMessages,
    };

    const nextConvs = conversations.map((c) => (c.id === currentConv.id ? updatedConv : c));
    if (!conversations.some((c) => c.id === currentConv.id)) {
      nextConvs.unshift(updatedConv);
    }

    updateConversationsState(nextConvs);
    setActiveConvId(currentConv.id);
    const currentUserId = currentUser ? currentUser.id : "guest_user";
    StorageService.setActiveConversationId(currentUserId, currentConv.id);
    setIsLoading(true);

    if (currentUser && !currentUser.isGuest) {
      saveMessageToFirestore(currentUser.id, currentConv.id, userMsg).catch(console.warn);
      saveConversationToFirestore(currentUser.id, updatedConv).catch(console.warn);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const assistantMsgId = "msg_ai_" + Date.now();
    let accumulatedContent = "";

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Background reCAPTCHA token
      const recaptchaToken = await executeRecaptcha("chat");

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          messages: historyPayload,
          history: historyPayload.slice(0, -1),
          tone: personalityTone,
          role: "mentor",
          model: "gemini-3.5-flash",
          isVenkateshOnline,
          userName: currentUser ? currentUser.name : "Friend",
          userId: currentUser?.id,
          assistantName: StorageService.getAssistantName(),
          attachments: currentFiles,
          recaptchaToken,
        }),
      });

      if (response.ok && response.body && response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamDone = false;

        while (!streamDone) {
          const { value, done: readerDone } = await reader.read();
          if (readerDone) break;

          const rawChunk = decoder.decode(value, { stream: true });
          const lines = rawChunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.error) {
                  if (!accumulatedContent) {
                    accumulatedContent = "Namaste! I am here to help you. Please ask your question.";
                  }
                  streamDone = true;
                  break;
                }
                if (parsed.fullText !== undefined) {
                  accumulatedContent = parsed.fullText;
                } else if (parsed.chunk) {
                  accumulatedContent += parsed.chunk;
                }
                if (parsed.done) {
                  streamDone = true;
                }

                // Progressive stream update
                const streamingMsg: ChatMessage = {
                  id: assistantMsgId,
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  isStreaming: !streamDone,
                };

                const streamingConv: Conversation = {
                  ...updatedConv,
                  messages: [...updatedConv.messages, streamingMsg],
                };

                setConversations((prev) =>
                  prev.map((c) => (c.id === currentConv.id ? streamingConv : c))
                );
              } catch {
                // Incomplete chunk parse
              }
            }
          }
        }

        // Finalize saved message
        const finalizedMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: accumulatedContent || "Namaste! How else can I assist you?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isStreaming: false,
        };

        const finalConv: Conversation = {
          ...updatedConv,
          updatedAt: new Date().toISOString(),
          messages: [...updatedConv.messages, finalizedMsg],
        };

        saveOrUpdateConversation(finalConv);

        if (currentUser && !currentUser.isGuest) {
          saveMessageToFirestore(currentUser.id, currentConv.id, finalizedMsg).catch(console.warn);
        }

        // Voice auto-speak if configured
        const voiceCfg = StorageService.getVoiceSettings();
        if (voiceCfg.enabled && voiceCfg.autoSpeak && accumulatedContent) {
          handleReadAloud(finalizedMsg);
        }
      } else {
        // Fallback for standard non-stream JSON response
        const data = await response.json();
        const replyText = data.reply || data.text || "Namaste! I'm here to assist you.";

        const finalMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isStreaming: false,
        };

        const finalConv: Conversation = {
          ...updatedConv,
          updatedAt: new Date().toISOString(),
          messages: [...updatedConv.messages, finalMsg],
        };

        saveOrUpdateConversation(finalConv);

        if (currentUser && !currentUser.isGuest) {
          saveMessageToFirestore(currentUser.id, currentConv.id, finalMsg).catch(console.warn);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Chat error:", err);

      // Rule: Never replace with error if a valid reply was already received
      if (!accumulatedContent) {
        const errorMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: "I had a temporary connection issue. Please tap 'Try again' below to re-send.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSafetyRefusal: true,
        };

        const errorConv: Conversation = {
          ...updatedConv,
          messages: [...updatedConv.messages, errorMsg],
        };

        saveOrUpdateConversation(errorConv);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle pending initial prompt from external sections (e.g. HomeSection quick ask & Quick Suggestions)
  const handledPromptTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (pendingInitialPrompt && pendingInitialPrompt.trim()) {
      const promptToSend = pendingInitialPrompt.trim();

      // Clear in parent so future triggers can fire cleanly
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }

      const now = Date.now();
      if (now - handledPromptTimestampRef.current < 400) {
        return;
      }
      handledPromptTimestampRef.current = now;

      // Automatically dispatch message
      handleSendMessage(promptToSend);
    }
  }, [pendingInitialPrompt]);

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!activeConversation || isLoading) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    // Find the last user message
    let lastUserMsg: ChatMessage | null = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUserMsg = msgs[i];
        break;
      }
    }

    if (!lastUserMsg) return;

    // Remove the last assistant message if present
    const prunedMessages = msgs[msgs.length - 1].role === "assistant" ? msgs.slice(0, -1) : msgs;
    const prunedConv: Conversation = {
      ...activeConversation,
      messages: prunedMessages,
    };

    updateConversationsState(
      conversations.map((c) => (c.id === activeConversation.id ? prunedConv : c))
    );

    // Re-trigger send with the last query
    handleSendMessage(lastUserMsg.content);
  };

  // Filter conversations for side drawer search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => groupConversations(filteredConversations), [filteredConversations]);

  // Handle Enter key (Shift+Enter for newline, or newline on Enter if enter-to-send is disabled)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const enterToSend = StorageService.getEnterToSend();
      if (enterToSend) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full relative bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-text"
      style={{
        paddingBottom: viewportBottomOffset > 0 ? `${viewportBottomOffset}px` : undefined,
      }}
    >
      {/* ============================================================
          HEADER: Simple, Compact Top Navigation Bar
          Left: Hamburger/menu button
          Center/left: Current conversation title (cleanly truncated)
          Right: New chat, Share, More options buttons
          No overlap guaranteed on small Android screens!
          ============================================================ */}
      <header
        id="chat-top-header"
        className="shrink-0 h-13 sm:h-14 px-2 sm:px-4 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 flex items-center justify-between gap-2 z-20"
      >
        {/* Left: Hamburger button & Conversation title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            id="chat-drawer-toggle-btn"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsDrawerOpen(true);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer touch-manipulation select-none active:scale-95 shrink-0"
            aria-label="Open conversation history"
            title="Conversation History"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Conversation Title (cleanly truncated, prevents overlap) */}
          <div className="min-w-0 flex-1">
            <h1
              id="current-conversation-title"
              className="text-sm sm:text-base font-semibold text-zinc-100 truncate tracking-tight"
              title={activeConversation?.title || "VenkateshBhaiya Assistant"}
            >
              {activeConversation?.title || "VenkateshBhaiya Assistant"}
            </h1>
          </div>
        </div>

        {/* Right: Actions (New Chat, Share, More) with 44px+ touch targets */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="chat-new-button"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              handleStartNewChat();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer touch-manipulation select-none active:scale-95"
            aria-label="Start new conversation"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            id="chat-share-button"
            type="button"
            onClick={() => {
              triggerHaptic("light");
              handleShareConversation();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer touch-manipulation select-none active:scale-95"
            aria-label="Share conversation"
            title="Share Conversation"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>

          <div className="relative" ref={moreMenuRef}>
            <button
              id="chat-more-button"
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer touch-manipulation select-none active:scale-95"
              aria-label="More options"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Desktop More Menu Dropdown (hidden on small mobile; mobile uses bottom sheet) */}
            {isMoreMenuOpen && (
              <div
                id="desktop-more-menu"
                className="hidden sm:block absolute right-0 top-11 w-56 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl p-1.5 z-50 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
              >
                {activeConversation && (
                  <button
                    type="button"
                    onClick={() => handleOpenRename(activeConversation.id, activeConversation.title)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-left transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Rename Conversation</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleShareConversation();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-left transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Share Conversation</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearConversation}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-left transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Clear Conversation</span>
                </button>

                {activeConversation && (
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(activeConversation.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-950/40 text-rose-300 text-left transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Conversation</span>
                  </button>
                )}

                <hr className="my-1.5 border-zinc-800" />

                {/* Theme Selector */}
                <div className="px-3 py-1 text-[11px] text-zinc-400 font-medium">Theme</div>
                <div className="grid grid-cols-3 gap-1 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTheme("dark")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition ${
                      currentTheme === "dark" ? "bg-amber-500/20 text-amber-300 font-bold" : "hover:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTheme("light")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition ${
                      currentTheme === "light" ? "bg-amber-500/20 text-amber-300 font-bold" : "hover:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTheme("system")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition ${
                      currentTheme === "system" ? "bg-amber-500/20 text-amber-300 font-bold" : "hover:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Laptop className="w-3 h-3" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guest Mode Notice */}
      {currentUser?.isGuest && (
        <div id="guest-mode-banner" className="shrink-0 max-w-3xl mx-auto w-full px-3 sm:px-6 pt-2 pb-0">
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">Guest Mode (Temporary Session)</span>
            </div>
            <button
              onClick={onOpenAccountModal}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer ml-2"
            >
              Sign in to retain chats
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          CHAT AREA: Large comfortable reading canvas, centered
          Messages have plenty of breathing room.
          User messages: Rounded modern bubble, right aligned.
          Assistant messages: Clean open layout, NOT a heavy bubble!
          ============================================================ */}
      <div
        id="chat-messages-container"
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 relative min-h-0 overscroll-contain"
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col justify-start min-h-full">
          {/* EMPTY CHAT SCREEN: Clean minimal welcome state
              "How can I help?"
              "Ask anything and start a conversation."
              Zero subject/exam cards! */}
          {!activeConversation || (activeConversation.messages.length === 0 && !isLoading) ? (
            <div className="my-auto flex flex-col items-center justify-center text-center py-12 px-4 space-y-4 select-none">
              <VBAvatar size="lg" isOnline={isVenkateshOnline} />
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                  How can I help?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Ask anything and start a conversation.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-7 pb-4">
              {activeConversation.messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLastAssistant =
                  !isUser &&
                  (index === activeConversation.messages.length - 1 ||
                    index === activeConversation.messages.length - 2);

                return (
                  <div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* User Message: Rounded modern bubble, right-aligned, subtle background */}
                    {isUser ? (
                      <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end space-y-1.5">
                        {/* Attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end mb-1">
                            {msg.attachments.map((att, attIdx) => (
                              <div key={attIdx} className="rounded-xl overflow-hidden max-w-xs shadow-sm">
                                {att.type.startsWith("image/") ? (
                                  <img
                                    src={att.base64 || att.url}
                                    alt={att.name}
                                    className="max-h-48 rounded-xl object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate max-w-[140px]">{att.name}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="rounded-2xl rounded-tr-xs px-4 py-2.5 sm:py-3 bg-amber-500/15 border border-amber-500/25 text-amber-50 text-[14px] sm:text-[15px] leading-relaxed break-words shadow-xs">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message: Clean OPEN layout rather than heavy bubble */
                      <div className="w-full flex items-start gap-3 sm:gap-3.5">
                        {/* Subtle VenkateshBhaiya Avatar icon */}
                        <div className="mt-1 shrink-0">
                          <VBAvatar size="xs" isOnline={isVenkateshOnline} />
                        </div>

                        {/* Open Content Layout (not boxed) */}
                        <div className="flex-1 min-w-0 pr-1 space-y-2">
                          <AssistantMarkdown content={msg.content} />

                          {/* Completed Message Actions: subtle compact controls */}
                          {!msg.isStreaming && !isLoading && (
                            <div className="flex items-center gap-1 sm:gap-1.5 pt-1.5 text-zinc-400">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="p-1.5 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition cursor-pointer"
                                aria-label="Copy message"
                                title="Copy"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isLastAssistant && (
                                <button
                                  type="button"
                                  onClick={handleRegenerate}
                                  className="p-1.5 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition cursor-pointer"
                                  aria-label="Regenerate response"
                                  title="Regenerate"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleFeedback(msg.id, "helpful")}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  msg.feedback === "helpful"
                                    ? "text-amber-400 bg-amber-500/15"
                                    : "hover:bg-zinc-800/60 hover:text-zinc-200"
                                }`}
                                aria-label="Mark helpful"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFeedback(msg.id, "not_helpful")}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  msg.feedback === "not_helpful"
                                    ? "text-rose-400 bg-rose-500/15"
                                    : "hover:bg-zinc-800/60 hover:text-zinc-200"
                                }`}
                                aria-label="Mark not helpful"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReadAloud(msg)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  speechActiveId === msg.id
                                    ? "text-amber-400 bg-amber-500/15 animate-pulse"
                                    : "hover:bg-zinc-800/60 hover:text-zinc-200"
                                }`}
                                aria-label={speechActiveId === msg.id ? "Stop audio" : "Read aloud"}
                                title="Read Aloud"
                              >
                                {speechActiveId === msg.id ? (
                                  <VolumeX className="w-3.5 h-3.5" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Retry button in case of genuine error */}
                          {msg.isSafetyRefusal && (
                            <div className="pt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleRegenerate}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Try again</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* SKELETON LOADING STATE: Shimmering response lines while waiting for AI response */}
              <AnimatePresence>
                {isLoading &&
                  (!activeConversation ||
                    activeConversation.messages.length === 0 ||
                    activeConversation.messages[activeConversation.messages.length - 1].role !== "assistant" ||
                    Boolean(activeConversation.messages[activeConversation.messages.length - 1].content === "")) && (
                    <ChatResponseSkeleton
                      isVenkateshOnline={isVenkateshOnline}
                      isStillWorking={isStillWorking}
                    />
                  )}
              </AnimatePresence>

              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          COMPOSER: Modern Floating Chat Composer at Bottom
          Left: Attachment button
          Center: Multiline auto-expanding textarea
          Placeholder: "Ask VenkateshBhaiya Assistant"
          Right: Microphone & Send button
          Android keyboard handling ensures visibility and accessibility!
          ============================================================ */}
      <div
        id="chat-composer-section"
        className="shrink-0 px-3 sm:px-6 pb-3 pt-1 w-full relative z-20"
      >
        <div className="max-w-3xl mx-auto w-full">
          {/* Attachment Preview Tray */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                >
                  <Paperclip className="w-3 h-3 text-amber-400" />
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                    aria-label="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Transparent Conversation Logging Disclosure Banner */}
          {!isPrivacyNoticeDismissed && (
            <div
              id="chat-privacy-disclosure-banner"
              className="mb-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-amber-500/20 text-[11px] text-zinc-300 flex items-center justify-between gap-2 backdrop-blur-md shadow-xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong className="text-amber-300 font-medium">Privacy Notice:</strong> Conversations may be stored &amp; reviewed by the administrator for safety and AI quality assurance.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenPrivacy && (
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Details
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPrivacyNoticeDismissed(true)}
                  className="p-0.5 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-colors"
                  aria-label="Dismiss notice"
                  title="Dismiss notice"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Liquid Glass Composer Card */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 shadow-xl focus-within:border-amber-500/50 transition-colors p-1.5 sm:p-2">
            <div className="flex items-end gap-1 sm:gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />

              {/* Left: Add / Attachment button */}
              <button
                id="composer-attachment-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer shrink-0"
                aria-label="Attach file or photo"
                title="Attach"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              {/* Center: Multiline text input with requested placeholder */}
              <div className="flex-1 min-w-0 py-1">
                <textarea
                  id="composer-textarea"
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask VenkateshBhaiya Assistant"
                  rows={1}
                  className="w-full bg-transparent border-0 resize-none text-[14px] sm:text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:ring-0 leading-relaxed max-h-[140px] px-1"
                />
              </div>

              {/* Right: Microphone & Send button */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  id="composer-mic-btn"
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  }`}
                  aria-label={isListening ? "Stop voice listening" : "Start voice input"}
                  title={isListening ? "Listening..." : "Voice Input"}
                >
                  {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>

                <button
                  id="composer-send-btn"
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && attachments.length === 0) || isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    (inputMessage.trim() || attachments.length > 0) && !isLoading
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-md hover:bg-amber-400"
                      : "text-zinc-600 bg-zinc-800/40 cursor-not-allowed opacity-50"
                  }`}
                  aria-label="Send message"
                  title="Send"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          CHAT HISTORY: Side Drawer / Menu for Conversations
          Show: New Chat, Recent conversations, Search conversations, Settings
          ============================================================ */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer slide-in panel */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header */}
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VBAvatar size="xs" isOnline={isVenkateshOnline} />
                <span className="font-bold text-sm text-zinc-100 truncate">
                  VenkateshBhaiya Assistant
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Button */}
            <div className="p-3">
              <button
                type="button"
                onClick={handleStartNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Conversations Input */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Recent Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-10 px-4 text-zinc-400 space-y-1">
                  <p className="text-sm font-semibold text-zinc-200">No conversations yet</p>
                  <p className="text-xs text-zinc-500">Start a new conversation with your AI assistant.</p>
                </div>
              ) : (
                <>
                  {/* Today */}
                  {grouped.today.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Today
                      </div>
                      {grouped.today.map((c) => (
                        <div
                          key={c.id}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                            c.id === activeConvId
                              ? "bg-amber-500/15 text-amber-200 font-semibold"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                          onClick={() => handleSelectConversation(c.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRename(c.id, c.title);
                              }}
                              className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(c.id);
                              }}
                              className="p-1 rounded-md hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yesterday */}
                  {grouped.yesterday.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Yesterday
                      </div>
                      {grouped.yesterday.map((c) => (
                        <div
                          key={c.id}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                            c.id === activeConvId
                              ? "bg-amber-500/15 text-amber-200 font-semibold"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                          onClick={() => handleSelectConversation(c.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRename(c.id, c.title);
                              }}
                              className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(c.id);
                              }}
                              className="p-1 rounded-md hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous 7 Days */}
                  {grouped.previous7Days.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Previous 7 Days
                      </div>
                      {grouped.previous7Days.map((c) => (
                        <div
                          key={c.id}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                            c.id === activeConvId
                              ? "bg-amber-500/15 text-amber-200 font-semibold"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                          onClick={() => handleSelectConversation(c.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRename(c.id, c.title);
                              }}
                              className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(c.id);
                              }}
                              className="p-1 rounded-md hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Older */}
                  {grouped.older.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Older
                      </div>
                      {grouped.older.map((c) => (
                        <div
                          key={c.id}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                            c.id === activeConvId
                              ? "bg-amber-500/15 text-amber-200 font-semibold"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                          onClick={() => handleSelectConversation(c.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRename(c.id, c.title);
                              }}
                              className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(c.id);
                              }}
                              className="p-1 rounded-md hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Drawer Navigation Controls with 48px+ touch targets and haptics */}
            <div className="p-3 border-t border-zinc-800 space-y-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {onNavigateHome && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setIsDrawerOpen(false);
                    onNavigateHome();
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer touch-manipulation select-none active:scale-98"
                >
                  <HomeIcon className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                  <span>Home</span>
                </button>
              )}

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsDrawerOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer touch-manipulation select-none active:scale-98"
                >
                  <Sliders className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                  <span>Settings</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsDrawerOpen(false);
                  onOpenAccountModal();
                }}
                className="w-full min-h-[48px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer touch-manipulation select-none active:scale-98"
              >
                <UserIcon className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                <span>{currentUser ? currentUser.name : "Sign In / Profile"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MOBILE MORE MENU: Clean Bottom Sheet on Mobile
          Useful actions: Rename, Share, Delete, Clear, Theme
          ============================================================ */}
      {isMoreMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-4 space-y-3 z-10 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Conversation Options
            </h3>

            <div className="space-y-1">
              {activeConversation && (
                <button
                  type="button"
                  onClick={() => handleOpenRename(activeConversation.id, activeConversation.title)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 text-sm text-zinc-200 transition cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-zinc-400" />
                  <span>Rename Conversation</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleShareConversation();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 text-sm text-zinc-200 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Share Conversation</span>
              </button>

              <button
                type="button"
                onClick={handleClearConversation}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 text-sm text-zinc-200 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                <span>Clear Messages</span>
              </button>

              {activeConversation && (
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(activeConversation.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-950/40 text-sm text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Conversation</span>
                </button>
              )}
            </div>

            <hr className="border-zinc-800" />

            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-zinc-400 font-medium">Appearance</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleTheme("dark")}
                  className={`p-2 rounded-xl transition ${
                    currentTheme === "dark" ? "bg-amber-500/20 text-amber-300" : "text-zinc-400"
                  }`}
                  aria-label="Dark mode"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme("light")}
                  className={`p-2 rounded-xl transition ${
                    currentTheme === "light" ? "bg-amber-500/20 text-amber-300" : "text-zinc-400"
                  }`}
                  aria-label="Light mode"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme("system")}
                  className={`p-2 rounded-xl transition ${
                    currentTheme === "system" ? "bg-amber-500/20 text-amber-300" : "text-zinc-400"
                  }`}
                  aria-label="System mode"
                >
                  <Laptop className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Conversation Dialog Modal */}
      {renamingConvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setRenamingConvId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl z-10 space-y-4">
            <h3 className="font-bold text-sm text-zinc-100">Rename Conversation</h3>
            <form onSubmit={handleSaveRename} className="space-y-3">
              <input
                type="text"
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                maxLength={40}
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-100 focus:outline-hidden focus:border-amber-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingConvId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback & Notification Toast */}
      {notificationToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-zinc-700/80 text-xs text-zinc-200 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          {notificationToast}
        </div>
      )}
    </div>
  );
};
