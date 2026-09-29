/**
 * Service for managing Admin authentication state and tokens.
 */
export const AdminAuthService = {
  getAdminToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      return sessionStorage.getItem("vb_admin_session_token") || localStorage.getItem("vb_admin_session_token");
    } catch {
      return null;
    }
  },

  setAdminToken(token: string, persistInLocal: boolean = false): void {
    try {
      if (typeof window === "undefined") return;
      sessionStorage.setItem("vb_admin_session_token", token);
      if (persistInLocal) {
        localStorage.setItem("vb_admin_session_token", token);
      }
    } catch (err) {
      console.warn("Failed to set admin token in storage:", err);
    }
  },

  clearAdminToken(): void {
    try {
      if (typeof window === "undefined") return;
      sessionStorage.removeItem("vb_admin_session_token");
      localStorage.removeItem("vb_admin_session_token");
    } catch (err) {
      console.warn("Failed to clear admin token:", err);
    }
  },

  isAdminLoggedIn(): boolean {
    return Boolean(this.getAdminToken());
  },
};
