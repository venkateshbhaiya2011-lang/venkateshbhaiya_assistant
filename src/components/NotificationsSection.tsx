import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, RefreshCw, Sparkles, Clock, AlertCircle } from "lucide-react";
import { UserNotification } from "../types";
import { NotificationsService } from "../services/notifications";

interface NotificationsSectionProps {
  onClose?: () => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await NotificationsService.fetchNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = NotificationsService.subscribe((data) => {
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleMarkAllRead = async () => {
    await NotificationsService.markAllAsRead();
  };

  const handleMarkRead = async (id: string) => {
    await NotificationsService.markAsRead(id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 text-zinc-200">
      {/* Header action row */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">
            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadNotifications}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse space-y-2.5"
            >
              <div className="h-4 bg-zinc-800 rounded-md w-1/2" />
              <div className="h-3 bg-zinc-800/60 rounded-md w-full" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          id="notifications-empty-state"
          className="text-center py-14 px-4 space-y-2 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">No notifications yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            See important updates and document notifications here when they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) handleMarkRead(notif.id);
              }}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                !notif.read
                  ? "bg-amber-500/10 border-amber-500/30 text-zinc-100 shadow-xs"
                  : "liquid-glass-subtle border-white/5 text-zinc-300 hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    !notif.read ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 shrink-0">
                  {notif.timestamp
                    ? new Date(notif.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Recent"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
