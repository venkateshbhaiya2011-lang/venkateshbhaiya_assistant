import React from "react";
import { Sparkles } from "lucide-react";

interface VBAvatarProps {
  size?: "xs" | "sm" | "md" | "lg";
  isOnline?: boolean;
  showStatusDot?: boolean;
  className?: string;
}

export const VBAvatar: React.FC<VBAvatarProps> = ({
  size = "md",
  isOnline = false,
  showStatusDot = false,
  className = "",
}) => {
  // Dimensions for container
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-7 h-7 sm:w-8 sm:h-8 text-xs",
    md: "w-8 h-8 sm:w-9 sm:h-9 text-xs",
    lg: "w-10 h-10 sm:w-11 sm:h-11 text-sm",
  };

  const sparkSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClasses[size]} ${className}`}
      aria-label="VenkateshBhaiya AI Assistant Logo"
    >
      {/* Outer Premium Aura & Gradient Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-[1.5px] shadow-sm">
        {/* Inner Dark Radial Canvas */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 flex items-center justify-center relative overflow-hidden">
          {/* Subtle warm amber ambient backlight */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/30 rounded-full blur-xs pointer-events-none" />

          {/* Central Logo Graphic: Stylized "VB" Monogram with Golden Micro Spark */}
          <div className="flex items-center tracking-tighter font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 leading-none">
            <span>V</span>
            <span className="-ml-[1px]">B</span>
          </div>

          {/* Golden AI Sparkle Accent */}
          <Sparkles
            className={`absolute top-0.5 right-0.5 text-amber-300/90 pointer-events-none ${sparkSizes[size]} drop-shadow-[0_0_3px_rgba(251,191,36,0.6)]`}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* Optional Online / Offline Availability Indicator Dot */}
      {showStatusDot && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-white ${
              isOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
            title={isOnline ? "VenkateshBhaiya is Online" : "VenkateshBhaiya is Offline"}
          />
        </span>
      )}
    </div>
  );
};
