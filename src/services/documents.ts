import { ApprovedDocument, DocumentRequest } from "../types";
import { AdminAuthService } from "./adminAuth";

export interface GetDocumentsResponse {
  success: boolean;
  documents: ApprovedDocument[];
  total: number;
  isAdminView?: boolean;
}

export interface DocumentSearchResponse {
  success: boolean;
  query: string;
  results: ApprovedDocument[];
  total: number;
}

export interface DocumentRequestResponse {
  success: boolean;
  request: DocumentRequest;
  message: string;
}

export interface GetRequestsResponse {
  success: boolean;
  requests: DocumentRequest[];
  total: number;
  pendingCount: number;
}

export const DocumentsService = {
  /**
   * Fetch approved documents list (Filtered by category or search query)
   * Only approved and public documents are returned for public visitors.
   */
  async getDocuments(category?: string, search?: string): Promise<GetDocumentsResponse> {
    try {
      const params = new URLSearchParams();
      if (category && category !== "all") params.append("category", category);
      if (search && search.trim()) params.append("search", search.trim());

      const headers: Record<string, string> = {};
      const token = AdminAuthService.getAdminToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/documents?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn("DocumentsService.getDocuments failed:", err?.message);
      return { success: false, documents: [], total: 0 };
    }
  },

  /**
   * Search approved document library strictly.
   */
  async searchApprovedLibrary(query: string): Promise<DocumentSearchResponse> {
    try {
      if (!query || !query.trim()) {
        return { success: true, query: "", results: [], total: 0 };
      }
      const res = await fetch(`/api/documents/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn("DocumentsService.searchApprovedLibrary failed:", err?.message);
      return { success: false, query, results: [], total: 0 };
    }
  },

  /**
   * Fetch single document by ID
   */
  async getDocumentById(id: string): Promise<{ success: boolean; document?: ApprovedDocument; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      const token = AdminAuthService.getAdminToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/documents/${encodeURIComponent(id)}`, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || "Document not found" };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to load document" };
    }
  },

  /**
   * User submits a request for a document/PDF.
   * Dispatches admin notification & confirmation alert automatically.
   */
  async submitDocumentRequest(opts: {
    userId: string;
    userName: string;
    userEmail?: string;
    documentName: string;
    customNote?: string;
  }): Promise<DocumentRequestResponse> {
    const res = await fetch("/api/documents/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to submit document request");
    }

    return await res.json();
  },

  /**
   * Fetch user requests (or all requests for admin)
   */
  async getDocumentRequests(userId?: string, status?: string): Promise<GetRequestsResponse> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (status && status !== "all") params.append("status", status);

      const headers: Record<string, string> = {};
      const token = AdminAuthService.getAdminToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/documents/requests?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn("DocumentsService.getDocumentRequests failed:", err?.message);
      return { success: false, requests: [], total: 0, pendingCount: 0 };
    }
  },

  /**
   * Admin approves or rejects a user request
   */
  async adminActionOnRequest(
    requestId: string,
    action: "approve" | "reject",
    adminNotes?: string,
    approvedDocumentId?: string
  ): Promise<{ success: boolean; request: DocumentRequest; message: string }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = AdminAuthService.getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/documents/requests/${encodeURIComponent(requestId)}/action`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, adminNotes, approvedDocumentId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update request");
    }

    return await res.json();
  },

  /**
   * Admin: Add new approved document
   */
  async adminCreateDocument(docData: Partial<ApprovedDocument>): Promise<{ success: boolean; document: ApprovedDocument }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = AdminAuthService.getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/admin/documents", {
      method: "POST",
      headers,
      body: JSON.stringify(docData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create document");
    }

    return await res.json();
  },

  /**
   * Admin: Update approved document
   */
  async adminUpdateDocument(
    id: string,
    docData: Partial<ApprovedDocument>
  ): Promise<{ success: boolean; document: ApprovedDocument }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = AdminAuthService.getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/documents/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(docData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update document");
    }

    return await res.json();
  },

  /**
   * Admin: Delete approved document
   */
  async adminDeleteDocument(id: string): Promise<{ success: boolean; remaining: number }> {
    const headers: Record<string, string> = {};
    const token = AdminAuthService.getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete document");
    }

    return await res.json();
  },
};
