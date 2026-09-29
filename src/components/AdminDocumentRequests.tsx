import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  Send,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  User,
  Shield,
  FileCheck,
  Tag,
  X,
  Upload,
} from "lucide-react";
import { DocumentRequest, ApprovedDocument } from "../types";
import { DocumentsService } from "../services/documents";
import { AdminAuthService } from "./../services/adminAuth";

interface AdminDocumentRequestsProps {
  onNavigateHome?: () => void;
  className?: string;
}

export const AdminDocumentRequests: React.FC<AdminDocumentRequestsProps> = ({
  className = "",
}) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<ApprovedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Approve Modal State
  const [approvingRequest, setApprovingRequest] = useState<DocumentRequest | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [customApprovalNotes, setCustomApprovalNotes] = useState<string>("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Reject Modal State
  const [rejectingRequest, setRejectingRequest] = useState<DocumentRequest | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>("");

  // Add Document Modal State
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocFileName, setNewDocFileName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Academic & Study Material");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [newDocPreviewText, setNewDocPreviewText] = useState("");
  const [newDocFileSize, setNewDocFileSize] = useState("2.5 MB");
  const [newDocTags, setNewDocTags] = useState("revision, notes, cbse");
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Load requests and library documents
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [reqRes, docsRes] = await Promise.all([
        DocumentsService.getDocumentRequests(undefined, statusFilter === "all" ? undefined : statusFilter),
        DocumentsService.getDocuments(),
      ]);

      if (reqRes && Array.isArray(reqRes.requests)) {
        setRequests(reqRes.requests);
      }
      if (docsRes && Array.isArray(docsRes.documents)) {
        setLibraryDocs(docsRes.documents);
      }
    } catch (err: any) {
      console.error("Failed to load document requests:", err);
      setFeedbackNotice({
        message: "Failed to load requests from server. Please check your admin session.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Notice auto-clear
  useEffect(() => {
    if (feedbackNotice) {
      const timer = setTimeout(() => setFeedbackNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackNotice]);

  // Filtered requests based on search query
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        r.documentName?.toLowerCase().includes(query) ||
        r.userName?.toLowerCase().includes(query) ||
        r.userEmail?.toLowerCase().includes(query) ||
        r.customNote?.toLowerCase().includes(query) ||
        r.id?.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status.toLowerCase() === "pending").length;
    const approved = requests.filter((r) => r.status.toLowerCase() === "approved").length;
    const rejected = requests.filter((r) => r.status.toLowerCase() === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Action: Handle Approve Request
  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    setIsSubmittingAction(true);
    try {
      const res = await DocumentsService.adminActionOnRequest(
        approvingRequest.id,
        "approve",
        customApprovalNotes.trim() || undefined,
        selectedDocId || undefined
      );

      if (res && res.success) {
        setFeedbackNotice({
          message: `Request for "${approvingRequest.documentName}" successfully APPROVED and dispatched to student!`,
          type: "success",
        });
        setApprovingRequest(null);
        setSelectedDocId("");
        setCustomApprovalNotes("");
        await loadData();
      } else {
        throw new Error(res.message || "Failed to approve request");
      }
    } catch (err: any) {
      setFeedbackNotice({
        message: err?.message || "Failed to approve request. Please check permissions.",
        type: "error",
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Action: Handle Reject Request
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setIsSubmittingAction(true);
    try {
      const res = await DocumentsService.adminActionOnRequest(
        rejectingRequest.id,
        "reject",
        rejectionNotes.trim() || "Document is not currently available in verified syllabus."
      );

      if (res && res.success) {
        setFeedbackNotice({
          message: `Request for "${rejectingRequest.documentName}" marked as REJECTED with feedback sent.`,
          type: "success",
        });
        setRejectingRequest(null);
        setRejectionNotes("");
        await loadData();
      } else {
        throw new Error(res.message || "Failed to reject request");
      }
    } catch (err: any) {
      setFeedbackNotice({
        message: err?.message || "Failed to reject request.",
        type: "error",
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Action: Handle Add New Approved Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocFileName.trim()) {
      setFeedbackNotice({ message: "Title and File Name are required.", type: "error" });
      return;
    }

    setIsAddingDoc(true);
    try {
      const tagsArray = newDocTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await DocumentsService.adminCreateDocument({
        title: newDocTitle.trim(),
        fileName: newDocFileName.trim(),
        category: newDocCategory,
        description: newDocDescription.trim() || "Official verified study material curated by Venkatesh Bhaiya.",
        previewText: newDocPreviewText.trim() || "Document content and core revision notes verified by moderator.",
        fileSize: newDocFileSize.trim() || "2.1 MB",
        tags: tagsArray.length > 0 ? tagsArray : ["notes", "study"],
        isApproved: true,
        isPublic: true,
      });

      if (res && res.success) {
        setFeedbackNotice({
          message: `"${newDocTitle}" added to official library successfully!`,
          type: "success",
        });
        setIsAddDocModalOpen(false);
        setNewDocTitle("");
        setNewDocFileName("");
        setNewDocDescription("");
        setNewDocPreviewText("");
        await loadData();
      } else {
        throw new Error("Failed to create document.");
      }
    } catch (err: any) {
      setFeedbackNotice({
        message: err?.message || "Error adding document to library.",
        type: "error",
      });
    } finally {
      setIsAddingDoc(false);
    }
  };

  return (
    <div id="admin-document-requests-container" className={`space-y-6 ${className}`}>
      {/* Feedback Toast */}
      {feedbackNotice && (
        <div
          id="admin-doc-feedback-toast"
          className={`p-4 rounded-2xl text-xs sm:text-sm font-medium border flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xl ${
            feedbackNotice.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card: Moderator Document Request Center */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Moderator &amp; Administrator Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-amber-400" />
              <span>Document Requests Management</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Review and approve incoming student document requests, upload new verified PDFs, and dispatch study materials directly to requester notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="admin-add-document-btn"
              type="button"
              onClick={() => setIsAddDocModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload / Add PDF</span>
            </button>

            <button
              id="admin-doc-requests-refresh-btn"
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Refresh requests list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Stat KPI Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400">Total Requests</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.total}</p>
            <span className="text-[10px] text-zinc-500">All submitted queries</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] font-bold text-amber-400">Pending Review</span>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">{stats.pending}</p>
            <span className="text-[10px] text-amber-500/80">Awaiting moderator action</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] font-bold text-emerald-400">Approved &amp; Sent</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">{stats.approved}</p>
            <span className="text-[10px] text-emerald-500/80">Delivered to users</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400">Rejected / Closed</span>
            <p className="text-xl sm:text-2xl font-black text-zinc-300 mt-0.5">{stats.rejected}</p>
            <span className="text-[10px] text-zinc-500">Unavailable / Completed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((st) => {
            const count =
              st === "all"
                ? stats.total
                : st === "pending"
                ? stats.pending
                : st === "approved"
                ? stats.approved
                : stats.rejected;
            return (
              <button
                key={st}
                id={`filter-doc-req-${st}-btn`}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  statusFilter === st
                    ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <span>{st}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusFilter === st ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-search-requests-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, email, or requested title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Requests Content Section */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse space-y-3">
              <div className="h-5 bg-zinc-800 rounded-md w-1/3" />
              <div className="h-4 bg-zinc-800/70 rounded-md w-2/3" />
              <div className="h-4 bg-zinc-800/40 rounded-md w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div
          id="admin-doc-requests-empty-state"
          className="text-center py-16 px-4 rounded-3xl bg-zinc-900/50 border border-dashed border-zinc-800 space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto text-amber-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">No Document Requests Found</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No requests match "${searchQuery}". Try a different keyword.`
              : statusFilter === "pending"
              ? "There are currently no pending requests awaiting moderator action. All caught up!"
              : "When students or visitors request study notes or PDFs, their requests will appear here for review."}
          </p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
            >
              View All Requests
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => {
            const isPending = req.status.toLowerCase() === "pending";
            const isApproved = req.status.toLowerCase() === "approved";
            const isRejected = req.status.toLowerCase() === "rejected";

            return (
              <div
                key={req.id}
                id={`request-card-${req.id}`}
                className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/30 transition-all shadow-md space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                        ID: {req.id}
                      </span>
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved &amp; Delivered</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                      <span className="text-zinc-500 text-xs">• {req.requestedAt}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 pt-1">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{req.documentName}</span>
                    </h3>
                  </div>

                  {/* Requester Profile Badge */}
                  <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-zinc-950/60 border border-zinc-800 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center text-xs">
                      {req.userName ? req.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-zinc-200">{req.userName || "Student / Visitor"}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {req.userEmail || req.userId || "anonymous_user"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student Note / Request Context */}
                {req.customNote && (
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-zinc-400">Student Note: </span>
                    <span>&ldquo;{req.customNote}&rdquo;</span>
                  </div>
                )}

                {/* Review details if already processed */}
                {isApproved && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <FileCheck className="w-4 h-4" />
                        <span>Matched Document: {req.approvedDocumentTitle || "Verified Library PDF"}</span>
                      </div>
                      {req.reviewedAt && <span className="text-[10px] text-emerald-400/70">{req.reviewedAt}</span>}
                    </div>
                    {req.adminNotes && (
                      <p className="text-zinc-300 text-[11px]">
                        <strong className="text-emerald-400">Moderator note:</strong> {req.adminNotes}
                      </p>
                    )}
                    {req.approvedDocumentUrl && (
                      <a
                        href={req.approvedDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium underline mt-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Sent PDF</span>
                      </a>
                    )}
                  </div>
                )}

                {isRejected && (
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300">
                      Rejection Reason: {req.adminNotes || "Not currently available in verified syllabus."}
                    </p>
                    {req.reviewedAt && <p className="text-[10px] text-zinc-500">Reviewed on {req.reviewedAt}</p>}
                  </div>
                )}

                {/* Action Buttons for Pending Requests */}
                {isPending && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                    <button
                      id={`reject-request-${req.id}-btn`}
                      type="button"
                      onClick={() => {
                        setRejectingRequest(req);
                        setRejectionNotes("");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>

                    <button
                      id={`approve-request-${req.id}-btn`}
                      type="button"
                      onClick={() => {
                        setApprovingRequest(req);
                        // Default to first matching library doc if any
                        const match = libraryDocs.find((d) =>
                          d.title.toLowerCase().includes(req.documentName.toLowerCase()) ||
                          req.documentName.toLowerCase().includes(d.title.toLowerCase())
                        );
                        setSelectedDocId(match ? match.id : libraryDocs[0]?.id || "");
                        setCustomApprovalNotes(
                          `Here are your requested revision notes for ${req.documentName}. Happy learning!`
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve &amp; Send Document</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE REQUEST MODAL */}
      {approvingRequest && (
        <div
          id="approve-request-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingAction) setApprovingRequest(null);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-5 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Approve Document Request</h3>
                  <p className="text-xs text-zinc-400">Dispatch verified PDF to {approvingRequest.userName}</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                disabled={isSubmittingAction}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-semibold">Requested Title</span>
                <p className="text-sm font-bold text-amber-400">{approvingRequest.documentName}</p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Select Approved Document from Library
                </label>
                <select
                  id="approve-doc-select"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-amber-500 text-xs"
                >
                  {libraryDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.fileName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Moderator Note to Student (Optional)
                </label>
                <textarea
                  id="approve-doc-notes-textarea"
                  rows={3}
                  value={customApprovalNotes}
                  onChange={(e) => setCustomApprovalNotes(e.target.value)}
                  placeholder="e.g. Here are your revision notes for this chapter. Stay focused and disciplined!"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="approve-doc-confirm-btn"
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmittingAction}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Confirm &amp; Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REQUEST MODAL */}
      {rejectingRequest && (
        <div
          id="reject-request-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingAction) setRejectingRequest(null);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Reject Request</h3>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Rejecting request for <strong className="text-zinc-200">&ldquo;{rejectingRequest.documentName}&rdquo;</strong> from {rejectingRequest.userName}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Reason / Explanation for Student
              </label>
              <textarea
                id="reject-doc-notes-textarea"
                rows={3}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="e.g. This specific material is not part of the standard syllabus, or please specify which chapter."
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                disabled={isSubmittingAction}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="reject-doc-confirm-btn"
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {isSubmittingAction ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD / ADD DOCUMENT MODAL */}
      {isAddDocModalOpen && (
        <div
          id="add-document-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isAddingDoc) setIsAddDocModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 sticky top-0 bg-zinc-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Verified PDF / Document</h3>
                  <p className="text-xs text-zinc-400">Save to official library for instant student approvals</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                disabled={isAddingDoc}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Document Title <span className="text-amber-400">*</span>
                </label>
                <input
                  id="new-doc-title-input"
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Class 10 Physics Mechanics Formula Book (PDF)"
                  required
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    File Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="new-doc-filename-input"
                    type="text"
                    value={newDocFileName}
                    onChange={(e) => setNewDocFileName(e.target.value)}
                    placeholder="e.g. VB_Physics_Formulas.pdf"
                    required
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Category</label>
                  <select
                    id="new-doc-category-select"
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Academic & Science">Academic &amp; Science</option>
                    <option value="Academic & Mathematics">Academic &amp; Mathematics</option>
                    <option value="Productivity & Mindset">Productivity &amp; Mindset</option>
                    <option value="Exam Strategy & Tips">Exam Strategy &amp; Tips</option>
                    <option value="General Reference">General Reference</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Estimated File Size</label>
                  <input
                    id="new-doc-filesize-input"
                    type="text"
                    value={newDocFileSize}
                    onChange={(e) => setNewDocFileSize(e.target.value)}
                    placeholder="e.g. 3.4 MB"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tags (Comma-separated)</label>
                  <input
                    id="new-doc-tags-input"
                    type="text"
                    value={newDocTags}
                    onChange={(e) => setNewDocTags(e.target.value)}
                    placeholder="physics, formulas, cbse, class 10"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Description</label>
                <textarea
                  id="new-doc-description-textarea"
                  rows={2}
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Short description highlighting what this document covers..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Preview Text / Key Pointers</label>
                <textarea
                  id="new-doc-preview-textarea"
                  rows={3}
                  value={newDocPreviewText}
                  onChange={(e) => setNewDocPreviewText(e.target.value)}
                  placeholder="Key concepts or formula bullet points visible in preview..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  disabled={isAddingDoc}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="new-doc-submit-btn"
                  type="submit"
                  disabled={isAddingDoc}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {isAddingDoc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save to Library</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
