import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Send,
  User,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { ApprovedDocument, DocumentRequest, UserAccount } from "../types";
import { DocumentsService } from "../services/documents";
import { AdminAuthService } from "../services/adminAuth";

interface DocumentsSectionProps {
  onClose?: () => void;
  currentUser?: UserAccount | null;
  onNavigateToAdmin?: (subTab?: string) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  onClose,
  currentUser,
  onNavigateToAdmin,
}) => {
  // Main view tab: "library" vs "requests"
  const [activeSubTab, setActiveSubTab] = useState<"library" | "requests">("library");

  // Documents state
  const [documents, setDocuments] = useState<ApprovedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Document requests state
  const [userRequests, setUserRequests] = useState<DocumentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqDocName, setReqDocName] = useState("");
  const [reqCustomNote, setReqCustomNote] = useState("");
  const [reqStudentName, setReqStudentName] = useState(currentUser?.name || "");
  const [reqStudentEmail, setReqStudentEmail] = useState(currentUser?.email || "");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isModerator =
    currentUser?.email === "venkateshbhaiya2011@gmail.com" ||
    currentUser?.role === "admin" ||
    AdminAuthService.isAdminLoggedIn();

  // Load Library Documents
  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await DocumentsService.getDocuments(
        selectedCategory !== "all" ? selectedCategory : undefined,
        searchQuery.trim() || undefined
      );
      if (res.success && Array.isArray(res.documents)) {
        setDocuments(res.documents);
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Load Document Requests
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      // If moderator, get all requests; otherwise get user-specific or current session requests
      const res = await DocumentsService.getDocumentRequests(
        isModerator ? undefined : currentUser?.id || currentUser?.email || "anonymous_user"
      );
      if (res.success && Array.isArray(res.requests)) {
        setUserRequests(res.requests);
        setPendingCount(res.pendingCount || 0);
      }
    } catch {
      setUserRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadRequests();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleDownload = (doc: ApprovedDocument) => {
    if (doc.downloadUrl && !doc.downloadUrl.startsWith("data:application/pdf;base64,JVBERi0xLjQK...")) {
      window.open(doc.downloadUrl, "_blank");
    } else {
      const content = `${doc.title}\n${"-".repeat(doc.title.length)}\n\nCategory: ${doc.category}\nFile Name: ${doc.fileName}\n\nSummary:\n${doc.description}\n\nContent:\n${doc.previewText || "Official approved study resource by Venkatesh Bhaiya."}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName ? doc.fileName.replace(/\.pdf$/, ".txt") : `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDocName.trim()) {
      setSubmitFeedback({ message: "Please specify the document or topic name.", type: "error" });
      return;
    }

    setIsSubmittingReq(true);
    try {
      const res = await DocumentsService.submitDocumentRequest({
        userId: currentUser?.id || currentUser?.email || `user_${Date.now()}`,
        userName: reqStudentName.trim() || currentUser?.name || "Student Visitor",
        userEmail: reqStudentEmail.trim() || currentUser?.email || undefined,
        documentName: reqDocName.trim(),
        customNote: reqCustomNote.trim() || undefined,
      });

      if (res && res.success) {
        setSubmitFeedback({
          message: `Your request for "${reqDocName}" has been submitted to Venkatesh Bhaiya & moderators!`,
          type: "success",
        });
        setReqDocName("");
        setReqCustomNote("");
        setIsRequestModalOpen(false);
        setActiveSubTab("requests");
        await loadRequests();
      } else {
        throw new Error(res.message || "Failed to submit request.");
      }
    } catch (err: any) {
      setSubmitFeedback({
        message: err?.message || "Failed to submit request. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  return (
    <div id="documents-section-container" className="p-3 sm:p-6 space-y-5 text-zinc-200">
      {/* Toast Notification */}
      {submitFeedback && (
        <div
          id="doc-req-submit-feedback"
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border shadow-lg animate-in fade-in duration-200 ${
            submitFeedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {submitFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{submitFeedback.message}</span>
          </div>
          <button onClick={() => setSubmitFeedback(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Moderator Control Alert Banner (Prominent for Moderators) */}
      {isModerator && (
        <div
          id="moderator-doc-request-banner"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                  Moderator Document Control
                </h4>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 text-[10px] font-mono font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                You have {pendingCount} pending document request{pendingCount === 1 ? "" : "s"} waiting for review &amp; approval.
              </p>
            </div>
          </div>

          <button
            id="moderator-open-console-btn"
            type="button"
            onClick={() => {
              if (onClose) onClose();
              if (onNavigateToAdmin) {
                onNavigateToAdmin("requests");
              } else {
                window.location.hash = "#admin";
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <span>Open Moderator Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls Strip: Segmented Tab Switch + Request Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1 border-b border-white/5">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/80 border border-white/10 shrink-0">
          <button
            id="docs-tab-library-btn"
            type="button"
            onClick={() => setActiveSubTab("library")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "library"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Verified Library ({documents.length})</span>
          </button>

          <button
            id="docs-tab-requests-btn"
            type="button"
            onClick={() => {
              setActiveSubTab("requests");
              loadRequests();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "requests"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Document Requests</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-zinc-950 font-mono font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Action: Request a Document Button */}
        <div className="flex items-center gap-2">
          <button
            id="open-request-doc-modal-btn"
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Request a Document</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: VERIFIED LIBRARY */}
      {activeSubTab === "library" && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-documents-library-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verified formulas, notes, study guides..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-900/80 border border-white/10 focus:border-amber-500/50 focus:outline-hidden text-zinc-100 placeholder-zinc-500"
              />
            </form>

            <button
              id="refresh-documents-library-btn"
              type="button"
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
              title="Refresh documents list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin text-amber-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Documents Content */}
          {isLoadingDocs ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse space-y-2.5"
                >
                  <div className="h-4 bg-zinc-800 rounded-md w-2/3" />
                  <div className="h-3 bg-zinc-800/60 rounded-md w-full" />
                  <div className="h-3 bg-zinc-800/40 rounded-md w-1/3" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div
              id="documents-empty-state"
              className="text-center py-14 px-4 space-y-3 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">No documents found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No study materials matched "${searchQuery}".`
                  : "Click 'Request a Document' above to request specific study notes from Venkatesh Bhaiya."}
              </p>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
              >
                + Request Study Material Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  className="p-4 sm:p-5 rounded-2xl liquid-glass-subtle border border-white/10 hover:border-amber-500/30 transition-all space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                          {doc.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-300 font-medium">
                            {doc.category || "General Reference"}
                          </span>
                          <span>•</span>
                          <span>{doc.fileSize || "PDF"}</span>
                          {doc.fileName && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-zinc-400">{doc.fileName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      id={`download-doc-${doc.id}-btn`}
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-zinc-300 leading-relaxed pl-1 sm:pl-11">
                      {doc.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DOCUMENT REQUESTS */}
      {activeSubTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200">
              {isModerator ? "All Document Requests (Moderator View)" : "My Document Requests & Status"}
            </h3>
            <button
              id="refresh-requests-btn"
              type="button"
              onClick={loadRequests}
              disabled={isLoadingRequests}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>

          {isLoadingRequests ? (
            <div className="space-y-3 py-4">
              {[1, 2].map((n) => (
                <div key={n} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse space-y-2">
                  <div className="h-4 bg-zinc-800 rounded-md w-1/3" />
                  <div className="h-3 bg-zinc-800/60 rounded-md w-2/3" />
                </div>
              ))}
            </div>
          ) : userRequests.length === 0 ? (
            <div
              id="user-requests-empty-state"
              className="text-center py-12 px-4 space-y-3 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-200">No Document Requests Yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Need a specific PDF, formulas book, or handwritten notes? Click the button below to submit a request directly.
              </p>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer shadow-md"
              >
                + Request a Document Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userRequests.map((req) => {
                const isPending = req.status.toLowerCase() === "pending";
                const isApproved = req.status.toLowerCase() === "approved";
                const isRejected = req.status.toLowerCase() === "rejected";

                return (
                  <div
                    key={req.id}
                    id={`doc-req-card-${req.id}`}
                    className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5 shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-100">{req.documentName}</h4>
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Requested by {req.userName} • {req.requestedAt}
                        </p>
                      </div>

                      {/* If approved, show download link */}
                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            if (req.approvedDocumentUrl) {
                              window.open(req.approvedDocumentUrl, "_blank");
                            } else {
                              const dummy = new Blob(
                                [`Approved Document: ${req.documentName}\nDispatched to student.`],
                                { type: "text/plain" }
                              );
                              const u = URL.createObjectURL(dummy);
                              const a = document.createElement("a");
                              a.href = u;
                              a.download = `${req.documentName}.txt`;
                              a.click();
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Sent Material</span>
                        </button>
                      )}
                    </div>

                    {req.customNote && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60">
                        &ldquo;{req.customNote}&rdquo;
                      </p>
                    )}

                    {req.adminNotes && (
                      <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <strong className="text-amber-400">Moderator Response: </strong>
                        <span>{req.adminNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL: REQUEST A DOCUMENT */}
      {isRequestModalOpen && (
        <div
          id="submit-document-request-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingReq) setIsRequestModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Request Study Document</h3>
                  <p className="text-[11px] text-zinc-400">Direct query to Venkatesh Bhaiya &amp; Moderators</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                disabled={isSubmittingReq}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Document / Topic Title <span className="text-amber-400">*</span>
                </label>
                <input
                  id="user-req-doc-name-input"
                  type="text"
                  value={reqDocName}
                  onChange={(e) => setReqDocName(e.target.value)}
                  placeholder="e.g. Class 12 Electrostatics Formula Sheet (PDF)"
                  required
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Your Name</label>
                <input
                  id="user-req-student-name-input"
                  type="text"
                  value={reqStudentName}
                  onChange={(e) => setReqStudentName(e.target.value)}
                  placeholder="Your Name / Student ID"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Email (Optional)</label>
                <input
                  id="user-req-student-email-input"
                  type="email"
                  value={reqStudentEmail}
                  onChange={(e) => setReqStudentEmail(e.target.value)}
                  placeholder="For email notifications"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Notes / Specific Chapters</label>
                <textarea
                  id="user-req-custom-notes-textarea"
                  rows={3}
                  value={reqCustomNote}
                  onChange={(e) => setReqCustomNote(e.target.value)}
                  placeholder="Mention key chapters, syllabus (CBSE/State Board), or exam target..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={isSubmittingReq}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-doc-req-btn"
                  type="submit"
                  disabled={isSubmittingReq}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingReq ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
