import { UserNotification, AdminNotification } from "../types";
import { AdminAuthService } from "./adminAuth";

export interface NotificationsResponse {
  success: boolean;
  notifications: UserNotification[];
  adminNotifications?: AdminNotification[];
  unreadCount: number;
  unreadUserCount: number;
  unreadAdminCount?: number;
}

type NotificationListener = (data: NotificationsResponse) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private lastData: NotificationsResponse = {
    success: true,
    notifications: [],
    adminNotifications: [],
    unreadCount: 0,
    unreadUserCount: 0,
    unreadAdminCount: 0,
  };

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    listener(this.lastData);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(data: NotificationsResponse) {
    this.lastData = data;
    this.listeners.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.warn("Notification listener error:", err);
      }
    });
  }

  async fetchNotifications(userId?: string): Promise<NotificationsResponse> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);

      const headers: Record<string, string> = {};
      const token = AdminAuthService.getAdminToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/notifications?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: NotificationsResponse = await res.json();
      this.notify(data);
      return data;
    } catch (err: any) {
      console.warn("NotificationManager.fetchNotifications error:", err?.message);
      return this.lastData;
    }
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
      });
      if (res.ok) {
        // Optimistically update
        const updatedUserNotifs = this.lastData.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const updatedAdminNotifs = (this.lastData.adminNotifications || []).map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadUserCount = updatedUserNotifs.filter((n) => !n.read).length;
        const unreadAdminCount = updatedAdminNotifs.filter((n) => !n.read).length;

        this.notify({
          ...this.lastData,
          notifications: updatedUserNotifs,
          adminNotifications: updatedAdminNotifs,
          unreadCount: unreadUserCount + unreadAdminCount,
          unreadUserCount,
          unreadAdminCount,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async markAllAsRead(userId?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = AdminAuthService.getAdminToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const updatedUserNotifs = this.lastData.notifications.map((n) => ({ ...n, read: true }));
        const updatedAdminNotifs = (this.lastData.adminNotifications || []).map((n) => ({
          ...n,
          read: true,
        }));

        this.notify({
          ...this.lastData,
          notifications: updatedUserNotifs,
          adminNotifications: updatedAdminNotifs,
          unreadCount: 0,
          unreadUserCount: 0,
          unreadAdminCount: 0,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedUserNotifs = this.lastData.notifications.filter((n) => n.id !== id);
        const updatedAdminNotifs = (this.lastData.adminNotifications || []).filter((n) => n.id !== id);
        const unreadUserCount = updatedUserNotifs.filter((n) => !n.read).length;
        const unreadAdminCount = updatedAdminNotifs.filter((n) => !n.read).length;

        this.notify({
          ...this.lastData,
          notifications: updatedUserNotifs,
          adminNotifications: updatedAdminNotifs,
          unreadCount: unreadUserCount + unreadAdminCount,
          unreadUserCount,
          unreadAdminCount,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async broadcastAnnouncement(title: string, message: string, actionUrl?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = AdminAuthService.getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers,
      body: JSON.stringify({ title, message, actionUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to broadcast announcement");
    }

    return await res.json();
  }
}

export const NotificationsService = new NotificationManager();
