import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, CheckCircle2, ExternalLink, ShieldCheck, Monitor, Apple, FileDown } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadAppLauncher } from '../utils/pwaDownload';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner' | 'pill';
  alwaysShow?: boolean;
  onOpenGuide?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
  alwaysShow = true,
  onOpenGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isWindows, isMac, isInIframe, platform, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // If already installed, show small installed badge or nothing if compact
  if (isInstalled && !alwaysShow) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res === 'accepted') {
        return;
      }
      if (res === 'manual_required' || res === 'dismissed') {
        if (onOpenGuide) {
          onOpenGuide();
        } else {
          setShowGuideModal(true);
        }
      }
    } else {
      if (onOpenGuide) {
        onOpenGuide();
      } else {
        setShowGuideModal(true);
      }
    }
  };

  const handleDirectDownload = () => {
    downloadAppLauncher();
    setDownloadNotice('Official app launcher downloaded successfully!');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <>
      {variant === 'banner' ? (
        <div
          id="pwa-install-banner"
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl liquid-glass-panel border border-amber-500/30 text-zinc-100 text-sm shadow-lg ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-zinc-100 text-sm sm:text-base">Install VB Assistant App</p>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  Official
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fast 1-tap launch • Full-screen view • Works on Android, iPhone &amp; PC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="pwa-banner-install-btn"
              onClick={handleClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? "App Installed" : "Install App"}</span>
            </button>
            <button
              id="pwa-banner-guide-btn"
              onClick={() => {
                if (onOpenGuide) onOpenGuide();
                else setShowGuideModal(true);
              }}
              className="px-3 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
            >
              Guide
            </button>
          </div>
        </div>
      ) : variant === 'pill' ? (
        <button
          id="pwa-install-pill-btn"
          onClick={handleClick}
          title="Install VenkateshBhaiya Assistant as app"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 shadow-sm active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>{isInstalled ? "Installed ✓" : "Download / Install App"}</span>
        </button>
      ) : (
        <button
          id="pwa-install-header-btn"
          onClick={handleClick}
          title="Install VenkateshBhaiya Assistant as app"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:text-white shadow-xs active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>{isInstalled ? "Installed ✓" : "Install App"}</span>
        </button>
      )}

      {/* Interactive Quick Install Walkthrough Modal */}
      {showGuideModal && (
        <div
          id="pwa-quick-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl text-zinc-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm sm:text-base">
                    Install App on {isIOS ? "iPhone / iPad" : isAndroid ? "Android" : isWindows ? "Windows" : isMac ? "Mac" : "Your Device"}
                  </h4>
                  <p className="text-[11px] text-zinc-400">Official Website Download</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Source Warning */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Official Genuine App • No APK or third-party store required</span>
            </div>

            {/* Steps according to platform */}
            {isIOS ? (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400 text-xs">
                  To install on iPhone or iPad Safari:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      Tap the <strong className="text-sky-300">Share</strong> icon (box with upward arrow) in the Safari toolbar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      Scroll down and tap <strong className="text-zinc-100">"Add to Home Screen"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      3
                    </span>
                    <p>
                      Tap <strong className="text-amber-300">Add</strong> in the top-right corner to finish.
                    </p>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400 text-xs">
                  To install on your Android device:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      Tap the browser menu (<strong className="text-amber-300">⋮</strong> in Chrome, Samsung Internet or Edge).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      Select <strong className="text-zinc-100">"Install app"</strong> or <strong className="text-zinc-100">"Add to Home screen"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      3
                    </span>
                    <p>
                      Tap <strong className="text-amber-300">Install</strong> to confirm.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400 text-xs">
                  To install on your desktop / PC / Mac:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      In Chrome or Edge, look at the right side of the address bar for the <strong className="text-amber-300">Install icon</strong> (computer with down arrow).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      Click <strong className="text-zinc-100">Install</strong> to create a dedicated standalone desktop app.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Notice if triggered */}
            {downloadNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{downloadNotice}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80">
              <button
                type="button"
                id="pwa-modal-download-launcher-btn"
                onClick={handleDirectDownload}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Download official offline web app launcher"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Download App File (.html)</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {isInIframe && (
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(window.location.href, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Full Browser</span>
                  </button>
                )}
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
