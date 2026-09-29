import {
  UserAccount,
  Conversation,
  ChatMessage,
  LoginHistoryEntry,
  PersonalityTone,
  ChatAppearance,
  ThemeMode,
  AccentTheme,
  VoiceSettings,
  UserFeedback,
  HapticIntensity,
} from "../types";
import { CrossTabSync } from "./crossTabSync";

const STORAGE_KEYS = {
  CURRENT_USER: "vb_current_user",
  ACCOUNTS: "vb_user_accounts",
  CONVERSATIONS: "vb_conversations",
  ACTIVE_CONV_ID: "vb_active_conv_id",
  VENKATESH_STATUS: "vb_venkatesh_online_status",
  LOGIN_HISTORY: "vb_login_history",
  PERSONALITY_TONE: "vb_ai_personality_tone",
  CHAT_APPEARANCE: "vb_chat_appearance",
  THEME_MODE: "vb_theme_mode",
  ACCENT_THEME: "vb_accent_theme",
  ASSISTANT_NAME: "vb_assistant_custom_name",
  VOICE_SETTINGS: "vb_voice_settings",
  FEEDBACK_LIST: "vb_feedback_list",
  SESSION_TOKEN: "vb_session_token",
  ENTER_TO_SEND: "vb_enter_to_send",
  HAPTIC_INTENSITY: "vb_haptic_intensity",
};

export const StorageService = {
  getSessionToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    } catch {
      return null;
    }
  },

  setSessionToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      }
    } catch {}
  },

  getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null, shouldBroadcast = true) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      if (shouldBroadcast) {
        CrossTabSync.broadcastLogin(user);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      if (shouldBroadcast) {
        CrossTabSync.broadcastLogout();
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vb_account_synced", { detail: user }));
    }
  },

  getAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  findAccount(identifier: string): UserAccount | null {
    if (!identifier) return null;
    const accounts = this.getAccounts();
    const clean = identifier.trim().toLowerCase();
    const noAt = clean.startsWith("@") ? clean.slice(1) : clean;

    return (
      accounts.find((a) => {
        const u = a.username.toLowerCase();
        const e = a.email ? a.email.toLowerCase() : "";
        const n = a.name.toLowerCase();
        return u === clean || u === noAt || e === clean || n === clean;
      }) || null
    );
  },

  saveAccount(account: UserAccount) {
    const accounts = this.getAccounts();
    const cleanUsername = account.username.toLowerCase().trim();
    const cleanEmail = account.email ? account.email.toLowerCase().trim() : "";

    const existingIndex = accounts.findIndex(
      (a) =>
        a.id === account.id ||
        a.username.toLowerCase().trim() === cleanUsername ||
        (cleanEmail && a.email && a.email.toLowerCase().trim() === cleanEmail)
    );

    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...account };
    } else {
      accounts.push(account);
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.setCurrentUser(account);
  },

  // Login history tracking
  getLoginHistory(): LoginHistoryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  recordLoginHistory(params: {
    userId: string;
    userName: string;
    userIdentifier: string;
    method: LoginHistoryEntry["method"];
    status?: "success" | "failed";
  }) {
    try {
      const history = this.getLoginHistory();
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      let device = "Desktop Browser";
      if (/iPhone|iPad|iPod/i.test(ua)) {
        device = "Apple iOS Device";
      } else if (/Android/i.test(ua)) {
        device = "Android Smartphone";
      } else if (/Macintosh/i.test(ua)) {
        device = "macOS Workstation";
      } else if (/Windows/i.test(ua)) {
        device = "Windows PC";
      }

      const newEntry: LoginHistoryEntry = {
        id: "lh_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        userId: params.userId,
        userName: params.userName,
        userIdentifier: params.userIdentifier,
        method: params.method,
        timestamp: new Date().toLocaleString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        deviceInfo: device,
        status: params.status || "success",
      };

      // Keep latest 25 login logs
      const updated = [newEntry, ...history].slice(0, 25);
      localStorage.setItem(STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(updated));
      return newEntry;
    } catch (err) {
      console.warn("Could not save login history:", err);
      return null;
    }
  },

  clearLoginHistory() {
    localStorage.removeItem(STORAGE_KEYS.LOGIN_HISTORY);
  },

  getVenkateshStatus(): boolean {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.VENKATESH_STATUS);
      return val === "true"; // Default to false (offline) as highlighted in specification
    } catch {
      return false;
    }
  },

  setVenkateshStatus(isOnline: boolean) {
    localStorage.setItem(STORAGE_KEYS.VENKATESH_STATUS, String(isOnline));
  },

  getConversations(userId: string): Conversation[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CONVERSATIONS}_${userId}`);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  },

  saveConversations(userId: string, conversations: Conversation[]) {
    localStorage.setItem(`${STORAGE_KEYS.CONVERSATIONS}_${userId}`, JSON.stringify(conversations));
  },

  getActiveConversationId(userId: string): string | null {
    return localStorage.getItem(`${STORAGE_KEYS.ACTIVE_CONV_ID}_${userId}`);
  },

  setActiveConversationId(userId: string, id: string) {
    localStorage.setItem(`${STORAGE_KEYS.ACTIVE_CONV_ID}_${userId}`, id);
  },

  createDefaultConversation(userId: string, userName: string): Conversation {
    const defaultConv: Conversation = {
      id: "conv_" + Date.now(),
      title: "Welcome Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "msg_welcome",
          role: "assistant",
          content: `Namaste ${userName}! I’m VenkateshBhaiya Assistant, your personal AI assistant. I'm here to chat with you and help answer your personal questions, everyday thoughts, or anything you're curious about. What would you like to ask today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    this.saveConversations(userId, [defaultConv]);
    this.setActiveConversationId(userId, defaultConv.id);
    return defaultConv;
  },

  getPersonalityTone(): PersonalityTone {
    try {
      const tone = localStorage.getItem(STORAGE_KEYS.PERSONALITY_TONE);
      if (
        tone === "formal" ||
        tone === "casual" ||
        tone === "concise" ||
        tone === "encouraging" ||
        tone === "creative"
      ) {
        return tone as PersonalityTone;
      }
      return "encouraging";
    } catch {
      return "encouraging";
    }
  },

  setPersonalityTone(tone: PersonalityTone) {
    try {
      localStorage.setItem(STORAGE_KEYS.PERSONALITY_TONE, tone);
    } catch (e) {
      console.warn("Could not save personality tone:", e);
    }
  },

  getEnterToSend(): boolean {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.ENTER_TO_SEND);
      return val === null ? true : val === "true";
    } catch {
      return true;
    }
  },

  setEnterToSend(enabled: boolean) {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTER_TO_SEND, String(enabled));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vb_enter_to_send_changed", { detail: enabled }));
      }
    } catch (e) {
      console.warn("Could not save enter to send setting:", e);
    }
  },

  getHapticIntensity(): HapticIntensity {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.HAPTIC_INTENSITY) as HapticIntensity | null;
      if (val === "off" || val === "light" || val === "medium" || val === "strong") {
        return val;
      }
      return "medium"; // Standard tactile default
    } catch {
      return "medium";
    }
  },

  setHapticIntensity(intensity: HapticIntensity) {
    try {
      localStorage.setItem(STORAGE_KEYS.HAPTIC_INTENSITY, intensity);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vb_haptic_intensity_changed", { detail: intensity }));
      }
    } catch (e) {
      console.warn("Could not save haptic intensity setting:", e);
    }
  },

  getAssistantName(): string {
    try {
      const name = localStorage.getItem(STORAGE_KEYS.ASSISTANT_NAME);
      return (name && name.trim()) || "VenkateshBhaiya Assistant";
    } catch {
      return "VenkateshBhaiya Assistant";
    }
  },

  setAssistantName(name: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSISTANT_NAME, name.trim() || "VenkateshBhaiya Assistant");
    } catch (e) {
      console.warn("Could not save assistant name:", e);
    }
  },

  getAccentTheme(): AccentTheme {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.ACCENT_THEME) as AccentTheme;
      if (theme === "emerald" || theme === "violet" || theme === "cyan" || theme === "amber") {
        return theme;
      }
      return "amber";
    } catch {
      return "amber";
    }
  },

  setAccentTheme(theme: AccentTheme) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCENT_THEME, theme);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-accent", theme);
      }
    } catch (e) {
      console.warn("Could not save accent theme:", e);
    }
  },

  getVoiceSettings(): VoiceSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(e);
    }
    return {
      enabled: true,
      autoSpeak: false,
      rate: 1.0,
      pitch: 1.0,
    };
  },

  setVoiceSettings(settings: VoiceSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Could not save voice settings:", e);
    }
  },

  deleteAccount(userId: string) {
    try {
      // Remove from accounts
      const accounts = this.getAccounts().filter((a) => a.id !== userId);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

      // Clear user's conversations
      localStorage.removeItem(`${STORAGE_KEYS.CONVERSATIONS}_${userId}`);
      localStorage.removeItem(`${STORAGE_KEYS.ACTIVE_CONV_ID}_${userId}`);

      // Clear current user if matching
      const current = this.getCurrentUser();
      if (current && current.id === userId) {
        this.setCurrentUser(null);
      }
    } catch (e) {
      console.warn("Could not delete account:", e);
    }
  },

  clearAllUserData(userId: string) {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.CONVERSATIONS}_${userId}`);
      localStorage.removeItem(`${STORAGE_KEYS.ACTIVE_CONV_ID}_${userId}`);
    } catch (e) {
      console.warn("Could not clear user data:", e);
    }
  },

  clearAllData(userId?: string) {
    try {
      if (userId) {
        this.deleteAccount(userId);
      } else {
        const cur = this.getCurrentUser();
        if (cur) {
          this.deleteAccount(cur.id);
        }
      }
      this.setSessionToken(null);
    } catch (e) {
      console.warn("Could not clear all data:", e);
    }
  },

  getChatAppearance(): ChatAppearance {
    try {
      const appearance = localStorage.getItem(STORAGE_KEYS.CHAT_APPEARANCE);
      if (appearance === "minimalist" || appearance === "classic") {
        return appearance;
      }
      return "classic";
    } catch {
      return "classic";
    }
  },

  setChatAppearance(appearance: ChatAppearance) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_APPEARANCE, appearance);
    } catch (e) {
      console.warn("Could not save chat appearance:", e);
    }
  },

  getThemeMode(): ThemeMode {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (mode === "light" || mode === "dark" || mode === "system") {
        return mode;
      }
      return "dark"; // Default to modern dark aesthetic
    } catch {
      return "dark";
    }
  },

  setThemeMode(mode: ThemeMode) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      // Apply class on documentElement with smooth transition
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("theme-transition");
        const isDark =
          mode === "dark" ||
          (mode === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (isDark) {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }
        setTimeout(() => {
          document.documentElement.classList.remove("theme-transition");
        }, 400);
      }
    } catch (e) {
      console.warn("Could not save theme mode:", e);
    }
  },

  getFeedbacks(): UserFeedback[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK_LIST);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveFeedback(feedback: Omit<UserFeedback, "id" | "timestamp">): UserFeedback {
    const list = this.getFeedbacks();
    const entry: UserFeedback = {
      id: "fb_" + Date.now(),
      timestamp: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...feedback,
    };
    const updated = [entry, ...list].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK_LIST, JSON.stringify(updated));
    return entry;
  },
};
