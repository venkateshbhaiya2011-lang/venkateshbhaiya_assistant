import React from "react";
import { X, Radio, ArrowRight } from "lucide-react";

interface StatusToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVenkateshOnline: boolean;
  onToggle: () => void;
}

export const StatusToggleModal: React.FC<StatusToggleModalProps> = ({
  isOpen,
  onClose,
  isVenkateshOnline,
  onToggle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="status-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="status-modal-container"
        className="w-full max-w-md bg-zinc-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden text-zinc-200"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
              Venkatesh Bhaiya Availability
            </h3>
          </div>
          <button
            id="close-status-modal-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isVenkateshOnline
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/40 border-amber-500/40 text-amber-200"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                isVenkateshOnline ? "bg-emerald-400 animate-ping" : "bg-amber-500"
              }`}
            />
            <div>
              <p className="font-bold text-sm">
                Current Status: {isVenkateshOnline ? "Available (Online)" : "AI Mode (Offline)"}
              </p>
              <p className="text-xs mt-1 leading-relaxed opacity-90 text-zinc-300">
                {isVenkateshOnline
                  ? "Venkatesh Bhaiya is marked as available. The AI Assistant continues to handle instant inquiries 24/7."
                  : "Venkatesh Bhaiya is marked as offline. Visitors will be politely informed that Venkatesh is currently away while the AI assists them immediately."}
              </p>
            </div>
          </div>

          {/* Demonstration Preview of Assistant Response */}
          <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800 text-xs">
            <p className="font-semibold text-zinc-300 mb-1">
              Live AI Behavior Demo:
            </p>
            <p className="text-zinc-400 italic mb-2">
              If a visitor asks: “Can I talk to Venkatesh Bhaiya?”
            </p>
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-zinc-200 leading-relaxed font-mono text-[11px]">
              {isVenkateshOnline
                ? "“Namaste! Venkatesh Bhaiya is currently indicated as available! I am his official AI assistant here to assist you right away, or you can connect with him via his official social channels.”"
                : "“Namaste! Venkatesh Bhaiya is currently unavailable. I’m his AI assistant, and I can help you with your questions while you wait.”"}
            </div>
          </div>

          <div className="pt-2">
            <button
              id="modal-toggle-status-btn"
              onClick={() => {
                onToggle();
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                isVenkateshOnline
                  ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <span>
                Switch Status to {isVenkateshOnline ? "Offline" : "Online"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
