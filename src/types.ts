export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  provider?: "credentials" | "google" | "apple" | "microsoft" | "email" | "guest";
  role?: "admin" | "user" | "moderator";
  isGuest?: boolean;
  emailVerified?: boolean;
  passwordMasked?: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userIdentifier: string;
  method: "credentials" | "google" | "apple" | "microsoft" | "email" | "guest";
  timestamp: string;
  deviceInfo: string;
  status: "success" | "failed";
}

export interface ChatMessageAttachment {
  name: string;
  type: string;
  url?: string;
  base64?: string;
  size?: number;
}

export type GeminiModelId = "gemini-3.5-flash" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: GeminiModelId | string;
  isSafetyRefusal?: boolean;
  isStreaming?: boolean;
  attachments?: ChatMessageAttachment[];
  feedback?: "helpful" | "not_helpful";
  replyTo?: {
    id: string;
    content: string;
    role: "user" | "assistant";
    authorName?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  model?: GeminiModelId | string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type PersonalityTone = "encouraging" | "formal" | "casual" | "concise" | "creative";

export type ChatAppearance = "classic" | "minimalist";

export type ThemeMode = "system" | "light" | "dark";

export type AccentTheme = "amber" | "emerald" | "violet" | "cyan";

export type HapticIntensity = "off" | "light" | "medium" | "strong";

export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  rate: number;
  pitch: number;
}

export interface UserPreferences {
  assistantName: string;
  personalityTone: PersonalityTone;
  chatAppearance: ChatAppearance;
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  voiceSettings: VoiceSettings;
}

export interface UserFeedback {
  id: string;
  timestamp: string;
  sentiment?: "helpful" | "unhelpful" | "report";
  rating?: "helpful" | "not_helpful" | "problem";
  comment?: string;
  category?: string;
  userName?: string;
  userId?: string;
  device?: string;
}

export interface ChatSessionRecord {
  sessionId: string;
  conversationId?: string;
  userName: string;
  userId?: string;
  tone: PersonalityTone | string;
  startedAt: string;
  lastActiveAt: string;
  turns: Array<{
    turnId: string;
    timestamp: string;
    userQuery: string;
    aiReply: string;
    tone?: string;
    isSafetyRefusal?: boolean;
    isFallback?: boolean;
  }>;
}

export interface QuickActionCard {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  starterPrompt: string;
  color: string;
}

export interface PersonalityToneOption {
  id: PersonalityTone;
  label: string;
  badge: string;
  tagline: string;
  description: string;
  sampleMessage: string;
  iconType: "sparkles" | "book" | "smile" | "zap";
}

export interface ConversationLogEntry {
  id: string;
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  model: string;
  status: "success" | "error" | "safety_refusal" | "fallback" | "retried";
  errorDetails?: string;
  device?: string;
  latencyMs?: number;
}

export interface AdminAuditLogEntry {
  id: string;
  adminEmail: string;
  adminUid: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface AdminDashboardStats {
  totalLogs: number;
  totalConversations: number;
  successCount: number;
  errorCount: number;
  safetyRefusalCount: number;
  fallbackCount: number;
  modelDistribution: Record<string, number>;
}

export type TabType = "home" | "chat" | "about" | "connect" | "privacy" | "settings" | "admin" | "documents" | "download" | "login";

export interface ApprovedDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  category: string;
  description: string;
  tags: string[];
  isApproved: boolean;
  isPublic: boolean;
  downloadUrl?: string;
  previewText?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DocumentRequestStatus = "PENDING" | "pending" | "approved" | "rejected";

export interface DocumentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  documentName: string;
  documentDescription?: string;
  customNote?: string;
  status: DocumentRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  adminResponse?: string;
  documentId?: string;
  approvedDocumentId?: string;
  approvedDocumentTitle?: string;
  approvedDocumentUrl?: string;
}

export type NotificationType =
  | "new_document_request"
  | "request_approved"
  | "request_rejected"
  | "announcement"
  | "account_notification";

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  requestId?: string;
  documentName?: string;
  documentUrl?: string;
}

export interface AdminNotification {
  id: string;
  type: "new_document_request" | "system_alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  requestId?: string;
  userName?: string;
  documentName?: string;
  status?: DocumentRequestStatus;
  actionUrl?: string;
}

export interface AdminUsageStatsData {
  activeSessionCount: number;
  totalSessions: number;
  totalTurns: number;
  averageInteractionFrequency: number;
  interactionsPerHour: number;
  averageLatencyMs: number;
  memoryMetrics: {
    nodeMemoryMB: number;
    rssMemoryMB: number;
    storedLogsCount: number;
    storedRequestsCount: number;
    uptimeSeconds: number;
  };
  recentSessions: Array<{
    sessionId: string;
    userName: string;
    userId: string;
    turnsCount: number;
    lastActive: string;
    lastUserMessage?: string;
    lastAiResponse?: string;
  }>;
}

export type DirectMessageChannel =
  | "in_app"
  | "whatsapp_cloud_api"
  | "telegram_bot"
  | "twilio_sms";

export interface DirectMessage {
  id: string;
  userId: string;
  sender: "user" | "admin" | "assistant";
  senderName?: string;
  message: string;
  timestamp: string;
  channel: DirectMessageChannel;
  read: boolean;
  deliveryStatus?: "sent" | "delivered" | "read" | "queued";
}

export interface DailyMotivationQuote {
  id: string;
  quote: string;
  author: string;
  category: "Wisdom" | "Patience & Growth" | "Focus & Discipline" | "Confidence & Hope" | "Kindness & Humility" | "Success & Perseverance";
  hindiMeaning?: string;
  sourceNote?: string;
  dateKey?: string;
}

