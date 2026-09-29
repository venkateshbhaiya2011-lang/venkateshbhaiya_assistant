import React, { useState } from "react";
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Check,
  Lock,
  Globe,
  Radio,
  FileDown,
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { downloadAppLauncher, downloadInternetShortcut } from "../utils/pwaDownload";

interface DownloadSectionProps {
  onCloseModal?: () => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ onCloseModal }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isWindows,
    isMac,
    isInIframe,
    platform,
    install,
  } = usePWAInstall();

  // Default active tab to detected platform
  const [selectedTab, setSelectedTab] = useState<"android" | "ios" | "windows" | "mac">(() => {
    if (isIOS) return "ios";
    if (isWindows) return "windows";
    if (isMac) return "mac";
    return "android"; // default to Android or other mobile
  });

  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get current verified domain
  const currentDomain =
    typeof window !== "undefined" ? window.location.hostname : "official-portal";
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "https://official-portal";

  const handleInstallClick = async () => {
    if (isInstalled) {
      setInstallStatus("The app is already installed and running on this device.");
      return;
    }

    if (isInstallable) {
      const res = await install();
      if (res === "accepted") {
        setInstallStatus("Installation confirmed! VenkateshBhaiya Assistant has been added to your device.");
      } else if (res === "dismissed") {
        setInstallStatus("Installation was dismissed. You can try again anytime.");
      }
    } else {
      // If direct prompt is not dispatched (e.g. inside an iframe or iOS)
      if (isIOS) {
        setSelectedTab("ios");
        setInstallStatus("On iOS Safari, tap the Share icon and select 'Add to Home Screen'. Follow the steps below!");
      } else if (isInIframe) {
        setInstallStatus("To install directly, open this official website in a new tab or follow the browser menu steps below.");
      } else {
        setInstallStatus("Check your browser's address bar or menu (⋮) for the 'Install' option, or follow the guide below.");
      }
    }
  };

  const handleCopyOfficialLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(currentUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-zinc-200">
      {/* Official Website Security Advisory Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-zinc-100 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-amber-300">
                Official Website Download Only
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Verified Genuine Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              VenkateshBhaiya Assistant is an authentic, certified Progressive Web App.{" "}
              <strong className="text-amber-200 font-semibold">
                Only install or download directly from this official website.
              </strong>{" "}
              Do not download untrusted APK files, third-party mirrors, or unofficial modified apps from unknown sources.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400">
              <Globe className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Official Host: </span>
              <code className="text-amber-300/90 font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800 break-all">
                {currentDomain}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Main Installation Action Box */}
      <div className="p-5 sm:p-6 rounded-2xl liquid-glass-panel border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                  Install VenkateshBhaiya Assistant
                </h3>
                {isInstalled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                    Installed
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Full-screen standalone experience • Zero app store download needed • Fast instant launch
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            <button
              id="download-section-install-btn"
              onClick={handleInstallClick}
              className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 w-full sm:w-auto ${
                isInstalled
                  ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
              }`}
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Already Installed</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Install App Directly</span>
                </>
              )}
            </button>

            {/* Direct Official File Download button */}
            <button
              id="download-section-download-file-btn"
              onClick={() => {
                downloadAppLauncher();
                setInstallStatus("Official App Launcher downloaded successfully!");
              }}
              className="px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
              title="Download official offline web app launcher"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Download App File (.html)</span>
            </button>

            {isInIframe && (
              <button
                id="download-section-open-tab-btn"
                onClick={handleOpenNewTab}
                className="px-4 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
                title="Open in new window for direct browser install prompt"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Open in Full Browser</span>
              </button>
            )}

            <button
              id="download-section-copy-link-btn"
              onClick={handleCopyOfficialLink}
              className="px-3.5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
              title="Copy official installation URL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Official Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Feedback Alert if prompt is triggered */}
        {installStatus && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{installStatus}</span>
            </div>
            <button
              onClick={() => setInstallStatus(null)}
              className="text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Platform Download & Installation Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              Step-by-Step Installation Guides by Device
            </h3>
          </div>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Detected: <strong className="capitalize text-amber-300">{platform}</strong>
          </span>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            id="guide-tab-android"
            onClick={() => setSelectedTab("android")}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition cursor-pointer ${
              selectedTab === "android"
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android</span>
          </button>

          <button
            id="guide-tab-ios"
            onClick={() => setSelectedTab("ios")}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition cursor-pointer ${
              selectedTab === "ios"
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Apple className="w-4 h-4 text-zinc-200" />
            <span>iPhone / iPad</span>
          </button>

          <button
            id="guide-tab-windows"
            onClick={() => setSelectedTab("windows")}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition cursor-pointer ${
              selectedTab === "windows"
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Windows PC</span>
          </button>

          <button
            id="guide-tab-mac"
            onClick={() => setSelectedTab("mac")}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition cursor-pointer ${
              selectedTab === "mac"
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Apple className="w-4 h-4 text-purple-400" />
            <span>macOS</span>
          </button>
        </div>

        {/* Tab Content: Android */}
        {selectedTab === "android" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Android Guide (Chrome, Samsung Internet, Edge, Brave)</span>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  1
                </span>
                <div>
                  <strong className="text-zinc-100">Open in Chrome or Edge:</strong> Ensure you are visiting this official URL (
                  <span className="font-mono text-amber-300/90">{currentDomain}</span>).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  2
                </span>
                <div>
                  <strong className="text-zinc-100">Tap the Install Button:</strong> Click the{" "}
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1 font-semibold text-amber-300 underline cursor-pointer"
                  >
                    "Install App Directly"
                  </button>{" "}
                  button above, or tap the browser menu (<strong>⋮</strong> in top-right corner).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  3
                </span>
                <div>
                  <strong className="text-zinc-100">Select "Install app" or "Add to Home screen":</strong> Tap{" "}
                  <strong>Install</strong> when the system confirmation pop-up appears.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  4
                </span>
                <div>
                  <strong className="text-zinc-100">Enjoy Full-Screen Access:</strong> The VenkateshBhaiya icon will now be on your home screen and app drawer, launching instantly with offline support!
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab Content: iOS */}
        {selectedTab === "ios" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
              <Apple className="w-4 h-4" />
              <span>Apple iPhone &amp; iPad Guide (Safari)</span>
            </div>

            <p className="text-xs text-zinc-400">
              Apple iOS requires adding Progressive Web Apps via Safari's native Share menu:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  1
                </span>
                <div>
                  <strong className="text-zinc-100">Open in Safari:</strong> Open this official link in your iPhone/iPad's default <strong>Safari browser</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  2
                </span>
                <div className="flex-1">
                  <strong className="text-zinc-100">Tap the Share Icon:</strong> Tap the{" "}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-sky-300 font-semibold text-xs">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </span>{" "}
                  button located at the bottom toolbar of Safari (or top right on iPad).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  3
                </span>
                <div>
                  <strong className="text-zinc-100">Select "Add to Home Screen":</strong> Scroll down in the share sheet options and tap{" "}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs">
                    <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                  </span>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  4
                </span>
                <div>
                  <strong className="text-zinc-100">Tap "Add" in Top-Right:</strong> Confirm the name and tap <strong>Add</strong>. VenkateshBhaiya Assistant will appear on your iPhone home screen!
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab Content: Windows PC */}
        {selectedTab === "windows" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Monitor className="w-4 h-4" />
              <span>Windows PC &amp; Laptop Guide (Chrome or Edge)</span>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  1
                </span>
                <div>
                  <strong className="text-zinc-100">Look at the Address Bar:</strong> In Google Chrome or Microsoft Edge, look at the right side of the URL/address bar.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  2
                </span>
                <div>
                  <strong className="text-zinc-100">Click the Install Icon:</strong> Click the small computer/down-arrow icon labeled <strong>"Install VenkateshBhaiya Assistant"</strong>, or click the{" "}
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1 font-semibold text-amber-300 underline cursor-pointer"
                  >
                    "Install App Directly"
                  </button>{" "}
                  button above.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  3
                </span>
                <div>
                  <strong className="text-zinc-100">Confirm Installation:</strong> Click <strong>Install</strong>. The app will launch in its own clean, dedicated desktop window with a start menu and desktop shortcut!
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab Content: macOS */}
        {selectedTab === "mac" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Apple className="w-4 h-4" />
              <span>Apple macOS Guide (Safari 17+ or Chrome)</span>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  1
                </span>
                <div>
                  <strong className="text-zinc-100">In Safari:</strong> In the top Mac menu bar, click <strong>File</strong> &rarr; select <strong>"Add to Dock..."</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  2
                </span>
                <div>
                  <strong className="text-zinc-100">In Google Chrome:</strong> Click the Install icon in the address bar or tap the{" "}
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1 font-semibold text-amber-300 underline cursor-pointer"
                  >
                    "Install App Directly"
                  </button>{" "}
                  button above.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/30">
                  3
                </span>
                <div>
                  <strong className="text-zinc-100">Launch from Dock / Launchpad:</strong> The app will open directly as a native Mac app with custom windowing and keyboard shortcuts.
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Why Install from Official Website - Benefits Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <h5 className="font-bold text-xs text-zinc-200">Zero Risky Permissions</h5>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Runs securely within your device's browser sandbox. No invasive root or file permissions required.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <h5 className="font-bold text-xs text-zinc-200">Always Auto-Updated</h5>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Every update made on the official server updates your installed app instantly without manual downloading.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="w-4 h-4" />
            <h5 className="font-bold text-xs text-zinc-200">Lightweight &amp; Fast</h5>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Uses minimal device storage (&lt;5 MB) while providing instant launch speed and caching.
          </p>
        </div>
      </div>
    </div>
  );
};
