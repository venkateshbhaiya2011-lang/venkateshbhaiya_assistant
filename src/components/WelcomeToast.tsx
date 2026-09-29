import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, CheckCircle2, X, Radio } from "lucide-react";

interface WelcomeToastProps {
  show: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  isVenkateshOnline: boolean;
  durationMs?: number;
}

export const WelcomeToast: React.FC<WelcomeToastProps> = ({
  show,
  onClose,
  userName,
  userEmail,
  isVenkateshOnline,
  durationMs = 4500,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [show, durationMs, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="welcome-connected-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-sm sm:max-w-md pointer-events-auto"
        >
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl liquid-glass-panel border border-white/15 backdrop-blur-2xl shadow-2xl text-zinc-100">
            {/* Status indicator badge */}
            <div className="relative shrink-0 w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            </div>

            {/* Message text */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                  {userName ? `Welcome back, ${userName}!` : "VenkateshBhaiya Assistant"}
                </h4>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Connected</span>
                </span>
              </div>
              {userEmail && (
                <p className="text-[10px] text-zinc-300 truncate font-mono mt-0.5">
                  {userEmail}
                </p>
              )}
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                <span>
                  Venkatesh Bhaiya:{" "}
                  <strong className={isVenkateshOnline ? "text-emerald-400" : "text-amber-400"}>
                    {isVenkateshOnline ? "Available" : "Offline (AI 24/7 Mode)"}
                  </strong>
                </span>
              </p>
            </div>

            {/* Close button */}
            <button
              id="dismiss-welcome-toast-btn"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
