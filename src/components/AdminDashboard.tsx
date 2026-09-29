import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Clock,
  User,
  MessageSquare,
  Cpu,
  Eye,
  X,
  Copy,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Key,
  Database,
  History,
  Info,
  Sliders,
  Check,
  LogOut,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  Activity,
} from "lucide-react";
import {
  UserAccount,
  ConversationLogEntry,
  AdminAuditLogEntry,
  AdminDashboardStats,
} from "../types";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AdminUsageStats } from "./AdminUsageStats";
import { AdminDocumentRequests } from "./AdminDocumentRequests";
import { DocumentsService } from "../services/documents";

interface AdminDashboardProps {
  currentUser: UserAccount | null;
  initialTab?: "requests" | "usage" | "conversations" | "errors" | "retention" | "audit";
  onNavigateHome: () => void;
  onNavigateChat: () => void;
  onOpenAccountModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  initialTab,
  onNavigateHome,
  onNavigateChat,
  onOpenAccountModal,
}) => {
  // Authentication & Session State (Only Administrator Passkey)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem("vb_admin_session_token"));
  });
  const [adminToken, setAdminToken] = useState<string>(
    () => sessionStorage.getItem("vb_admin_session_token") || ""
  );
  const [hasServerSecretConfigured, setHasServerSecretConfigured] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Admin Sub-tab
  const [activeAdminTab, setActiveAdminTab] = useState<
    "requests" | "usage" | "conversations" | "errors" | "retention" | "audit"
  >(initialTab || "requests");

  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      DocumentsService.getDocumentRequests(undefined, "pending")
        .then((res) => {
          if (res && typeof res.pendingCount === "number") {
            setPendingRequestsCount(res.pendingCount);
          }
        })
        .catch(() => {});
    }
  }, [isAdminAuthenticated, activeAdminTab]);

  // Data State
  const [logs, setLogs] = useState<ConversationLogEntry[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalLogs: 0,
    totalConversations: 0,
    successCount: 0,
    errorCount: 0,
    safetyRefusalCount: 0,
    fallbackCount: 0,
    modelDistribution: {},
  });
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  // Selected Log for Inspection Modal
  const [inspectedLog, setInspectedLog] = useState<ConversationLogEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Headers helper with real Bearer token
  const getAuthHeaders = () => {
    const token = adminToken || sessionStorage.getItem("vb_admin_session_token") || "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch server admin auth status (whether ADMIN_SECRET_KEY is configured)
  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("/api/admin/auth/status");
      if (res.ok) {
        const data = await res.json();
        setHasServerSecretConfigured(Boolean(data.hasServerSecretConfigured));
      }
    } catch (err) {
      console.warn("Failed to check admin auth status:", err);
    }
  };

  // 2. Verify existing session token on mount
  useEffect(() => {
    fetchAuthStatus();

    const existingToken = sessionStorage.getItem("vb_admin_session_token");
    if (existingToken) {
      fetch("/api/admin/auth/verify", {
        headers: { Authorization: `Bearer ${existingToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.authorized) {
            setAdminToken(existingToken);
            setIsAdminAuthenticated(true);
          } else {
            sessionStorage.removeItem("vb_admin_session_token");
            setAdminToken("");
            setIsAdminAuthenticated(false);
          }
        })
        .catch(() => {
          sessionStorage.removeItem("vb_admin_session_token");
          setAdminToken("");
          setIsAdminAuthenticated(false);
        });
    }
  }, []);

  // Fetch conversations and diagnostics
  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const url = new URL("/api/admin/conversations", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (modelFilter !== "all") url.searchParams.set("model", modelFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());
      url.searchParams.set("limit", "150");

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });

      if (res.status === 403) {
        setIsAdminAuthenticated(false);
        sessionStorage.removeItem("vb_admin_session_token");
        setAuthError("Session expired or unauthorized. Please re-authenticate.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          if (data.stats) setStats(data.stats);
          if (typeof data.retentionDays === "number") setRetentionDays(data.retentionDays);
        }
      }
    } catch (err) {
      console.error("Failed to load admin conversations:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingLogs(false);
    }
  };

  // Fetch audit trail
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuditLogs(data.auditLogs || []);
        }
      }
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    }
  };

  // Load on mount and when authentication changes
  useEffect(() => {
    if (isAdminAuthenticated) {
      setIsLoadingLogs(true);
      fetchDashboardData();
      fetchAuditLogs();
    }
  }, [isAdminAuthenticated, statusFilter, modelFilter]);

  // Handle Passkey Login
  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!passkeyInput.trim()) {
      setAuthError("Please enter the administrator secret key.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passkey: passkeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        sessionStorage.setItem("vb_admin_session_token", data.token);
        setIsAdminAuthenticated(true);
        setPasskeyInput("");
        setFeedbackNotice("Authenticated as Administrator successfully.");
        setTimeout(() => setFeedbackNotice(null), 3500);
      } else {
        setAuthError(data.error || "Invalid administrator credentials. Access restricted.");
      }
    } catch (err: any) {
      setAuthError("Network or server error during admin verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Log Out from Admin
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch {
      // ignore
    }
    sessionStorage.removeItem("vb_admin_session_token");
    setAdminToken("");
    setIsAdminAuthenticated(false);
    setLogs([]);
    setAuditLogs([]);
    onNavigateHome();
  };

  // Delete single conversation log
  const handleDeleteLog = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Permanently delete this conversation log from the database?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/conversations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        if (inspectedLog?.id === id) {
          setInspectedLog(null);
        }
        setFeedbackNotice("Log entry deleted successfully.");
        setTimeout(() => setFeedbackNotice(null), 3000);
        fetchAuditLogs();
      }
    } catch (err) {
      alert("Failed to delete log entry.");
    }
  };

  // Clear all conversations
  const handleClearAllLogs = async () => {
    if (
      !window.confirm(
        "CRITICAL ACTION: Are you certain you want to purge ALL recorded conversation logs? This action is recorded in the admin audit trail and cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/conversations/clear", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setLogs([]);
        setInspectedLog(null);
        setFeedbackNotice("All conversation logs purged.");
        setTimeout(() => setFeedbackNotice(null), 3500);
        fetchDashboardData();
        fetchAuditLogs();
      }
    } catch (err) {
      alert("Failed to purge logs.");
    }
  };

  // Update Data Retention Policy
  const handleUpdateRetention = async (days: number) => {
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ retentionDays: days }),
      });

      if (res.ok) {
        setRetentionDays(days);
        setFeedbackNotice(
          `Retention policy updated to ${days === 0 ? "Unlimited" : days + " days"}.`
        );
        setTimeout(() => setFeedbackNotice(null), 3500);
        fetchAuditLogs();
      }
    } catch (err) {
      alert("Failed to update retention policy.");
    }
  };

  // Export logs to JSON
  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `venkateshbhaiya_assistant_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setFeedbackNotice(`Exported ${logs.length} conversation logs to JSON.`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered logs computed for display
  const displayLogs = useMemo(() => {
    if (activeAdminTab === "errors") {
      return logs.filter((l) => l.status === "error" || l.status === "fallback");
    }
    return logs;
  }, [logs, activeAdminTab]);

  // If NOT authenticated as admin, show secure passkey gatekeeper
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="rounded-3xl bg-zinc-900/95 border border-zinc-800 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-zinc-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-5">
            <Lock className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Restricted Area
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Administrator Access
          </h1>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Enter your security passkey to access system monitoring, conversation diagnostics, and admin settings.
          </p>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{authError}</div>
            </div>
          )}

          <form onSubmit={handlePasskeyLogin} className="space-y-4 mb-6">
            <div>
              <label htmlFor="admin-passkey-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Security Passkey
              </label>
              <div className="relative">
                <input
                  id="admin-passkey-input"
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter administrator passkey"
                  disabled={isVerifying}
                  autoFocus
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-hidden focus:border-amber-500 transition"
                />
                <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              id="admin-passkey-submit-btn"
              type="submit"
              disabled={isVerifying || !passkeyInput.trim()}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <button
              onClick={onNavigateHome}
              className="hover:text-zinc-300 transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Assistant Home</span>
            </button>
            <span className="text-[11px] text-zinc-600">Encrypted Passkey Verification</span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD VIEW
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 text-zinc-100">
      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-2xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-4 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 font-black flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Admin Chat Monitoring &amp; Diagnostics
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase">
                Owner Mode
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              VenkateshBhaiya Assistant • Transparent conversation storage &amp; quality control
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            id="admin-refresh-btn"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onNavigateChat}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Test Chat</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
          >
            Exit to Home
          </button>

          <button
            id="admin-logout-btn"
            onClick={handleAdminLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* KPI Metric Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Total Turns</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.totalLogs}</p>
          <span className="text-[10px] text-zinc-500">Stored in database</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Conversations</span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            {stats.totalConversations}
          </p>
          <span className="text-[10px] text-zinc-500">Unique thread IDs</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Success Rate</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {stats.totalLogs > 0
              ? `${Math.round((stats.successCount / stats.totalLogs) * 100)}%`
              : "100%"}
          </p>
          <span className="text-[10px] text-emerald-500">{stats.successCount} successful</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Errors &amp; Retries</span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{stats.errorCount}</p>
          <span className="text-[10px] text-rose-400/80">"Please try again"</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Safety Halts</span>
          <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
            {stats.safetyRefusalCount}
          </p>
          <span className="text-[10px] text-zinc-500">Abuse/profanity filtered</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400">Retention Window</span>
          <p className="text-xl sm:text-2xl font-black text-purple-400 mt-1">
            {retentionDays === 0 ? "Infinite" : `${retentionDays}d`}
          </p>
          <span className="text-[10px] text-zinc-500">Auto-pruning</span>
        </div>
      </section>

      {/* Admin Dashboard Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="admin-tab-doc-requests"
            onClick={() => setActiveAdminTab("requests")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "requests"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Document Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-zinc-950 font-mono font-black animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            id="admin-tab-usage-stats"
            onClick={() => setActiveAdminTab("usage")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "usage"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Usage Analytics</span>
          </button>

          <button
            id="admin-tab-conversations"
            onClick={() => setActiveAdminTab("conversations")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "conversations"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>All Conversations ({logs.length})</span>
          </button>

          <button
            id="admin-tab-errors"
            onClick={() => setActiveAdminTab("errors")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "errors"
                ? "bg-rose-500 text-white shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Errors &amp; Debugging ({stats.errorCount + stats.fallbackCount})</span>
          </button>

          <button
            id="admin-tab-retention"
            onClick={() => setActiveAdminTab("retention")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "retention"
                ? "bg-purple-500 text-white shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Retention &amp; Policies</span>
          </button>

          <button
            id="admin-tab-audit"
            onClick={() => setActiveAdminTab("audit")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeAdminTab === "audit"
                ? "bg-zinc-700 text-white shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Download full JSON dataset"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleClearAllLogs}
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Purge all conversation logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Purge All</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 0: DOCUMENT REQUESTS MANAGEMENT (MODERATOR PORTAL) */}
      {activeAdminTab === "requests" && (
        <AdminDocumentRequests
          onNavigateHome={onNavigateHome}
        />
      )}

      {/* SUB-VIEW 0: LIVE USAGE STATISTICS & METRICS */}
      {activeAdminTab === "usage" && (
        <AdminUsageStats
          adminToken={adminToken}
          onRefreshParent={fetchDashboardData}
        />
      )}

      {/* SUB-VIEW 1 & 2: CONVERSATIONS / ERRORS */}
      {(activeAdminTab === "conversations" || activeAdminTab === "errors") && (
        <div className="space-y-4">
          {/* Search and Filters Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                id="admin-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDashboardData()}
                placeholder="Search queries, replies, user IDs, or error messages..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success Only</option>
                <option value="error">Errors &amp; "Try Again"</option>
                <option value="safety_refusal">Safety Refusals</option>
                <option value="fallback">Fallback Replied</option>
              </select>

              <select
                id="admin-model-filter"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="all">All Models</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="offline-fallback">Offline Fallback</option>
              </select>
            </div>
          </div>

          {/* Conversation Records Table */}
          {isLoadingLogs ? (
            <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Loading conversation logs from database...</span>
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-zinc-300">No conversation records match your filters.</p>
              <p className="text-[11px] text-zinc-500">
                Any chat turn sent by visitors will automatically record here with timestamp, user
                ID, and model diagnostic details.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/60 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Model</th>
                      <th className="py-3 px-3 w-1/3">User Message</th>
                      <th className="py-3 px-3 w-1/3">AI Response</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-normal">
                    {displayLogs.map((log) => {
                      const isErr = log.status === "error";
                      const isRefusal = log.status === "safety_refusal";
                      const isFallback = log.status === "fallback";

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setInspectedLog(log)}
                          className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isErr
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : isRefusal
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : isFallback
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {isErr ? (
                                <>
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Error</span>
                                </>
                              ) : isRefusal ? (
                                <>
                                  <Shield className="w-2.5 h-2.5" />
                                  <span>Refusal</span>
                                </>
                              ) : isFallback ? (
                                <>
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Fallback</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Success</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-zinc-400 text-[11px]">
                            {log.timestamp}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-200 truncate max-w-[110px]">
                                {log.userName || "Guest"}
                              </span>
                              <span className="text-[10px] text-zinc-500 truncate max-w-[110px]">
                                {log.userId}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700/60">
                              {log.model}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <p className="line-clamp-2 text-zinc-200 font-medium text-xs">
                              {log.userMessage}
                            </p>
                          </td>

                          <td className="py-3 px-3">
                            <p className="line-clamp-2 text-zinc-400 text-xs">
                              {log.aiResponse}
                            </p>
                            {log.errorDetails && (
                              <p className="text-[10px] text-rose-400 truncate mt-0.5">
                                Reason: {log.errorDetails}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedLog(log);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                                title="Inspect Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteLog(log.id, e)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 transition"
                                title="Delete Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: DATA RETENTION & PRIVACY SETTINGS */}
      {activeAdminTab === "retention" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>Automated Lifecycle &amp; Privacy Configuration</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Data Retention &amp; Automatic Log Purging
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
              To balance AI quality assurance with visitor privacy, conversation logs can be
              automatically purged after a set duration. All deletions are permanently recorded in
              the admin audit log.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              {[
                { days: 7, label: "7 Days", desc: "Short debugging cycle" },
                { days: 30, label: "30 Days", desc: "Recommended balance" },
                { days: 90, label: "90 Days", desc: "Extended quality review" },
                { days: 0, label: "Unlimited", desc: "No automatic purging" },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => handleUpdateRetention(opt.days)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    retentionDays === opt.days
                      ? "bg-purple-500/20 border-purple-500 text-white font-bold"
                      : "bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold">{opt.label}</span>
                    {retentionDays === opt.days && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Notice In Force:</strong> Users chatting with VenkateshBhaiya
                Assistant see a prominent notice disclosing that conversations are stored and reviewed
                by the authorized system administrator for quality and error diagnostics.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: AUDIT TRAIL */}
      {activeAdminTab === "audit" && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1">
              Administrator Security &amp; Activity Audit Log
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Cryptographic log of all logins, deletions, and policy changes made by the administrator.
            </p>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No audit events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <div>
                        <span className="font-bold text-zinc-200 capitalize">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                        {entry.details && (
                          <p className="text-zinc-400 text-[11px] mt-0.5">{entry.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 shrink-0">
                      <span>{entry.adminEmail}</span>
                      <span>•</span>
                      <span>{entry.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: Full View of a Conversation Turn */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    inspectedLog.status === "error"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : inspectedLog.status === "safety_refusal"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  Status: {inspectedLog.status.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400">{inspectedLog.timestamp}</span>
              </div>

              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Metadata chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">User</span>
                  <p className="font-semibold text-zinc-200 truncate">{inspectedLog.userName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{inspectedLog.userId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Model</span>
                  <p className="font-semibold text-zinc-200 font-mono">{inspectedLog.model}</p>
                  <p className="text-[10px] text-zinc-500">Latency: {inspectedLog.latencyMs || 250}ms</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Conversation ID</span>
                  <p className="font-mono text-[10px] text-amber-400 truncate">
                    {inspectedLog.conversationId}
                  </p>
                </div>
              </div>

              {/* Error Detail Highlight if Error occurred */}
              {inspectedLog.status === "error" && inspectedLog.errorDetails && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Diagnostics: Reason for "Please try again" error</span>
                  </div>
                  <p className="text-xs font-mono break-all">{inspectedLog.errorDetails}</p>
                </div>
              )}

              {/* User Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1 text-zinc-400">
                  <span className="font-semibold text-zinc-300">User Message:</span>
                  <button
                    onClick={() => copyToClipboard(inspectedLog.userMessage, "user_msg")}
                    className="hover:text-zinc-200 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === "user_msg" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 whitespace-pre-wrap leading-relaxed">
                  {inspectedLog.userMessage}
                </div>
              </div>

              {/* AI Response */}
              <div>
                <div className="flex items-center justify-between mb-1 text-zinc-400">
                  <span className="font-semibold text-zinc-300">AI Assistant Response:</span>
                  <button
                    onClick={() => copyToClipboard(inspectedLog.aiResponse, "ai_msg")}
                    className="hover:text-zinc-200 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === "ai_msg" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 leading-relaxed">
                  <AssistantMarkdown content={inspectedLog.aiResponse} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteLog(inspectedLog.id)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log Record</span>
              </button>

              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
