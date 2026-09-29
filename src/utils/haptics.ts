/**
 * Tactile Haptic Feedback Utility for Mobile Browsers
 * Utilizes the standard W3C navigator.vibrate Web API with intensity scaling and safe fallbacks.
 */

import { HapticIntensity } from "../types";
import { StorageService } from "../services/storage";

export type HapticStyle = "light" | "medium" | "heavy" | "selection" | "success" | "warning";

/**
 * Checks if the current client platform supports the Vibration API
 */
export function isHapticsSupported(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function";
}

/**
 * Triggers a tactile vibration on mobile devices that support navigator.vibrate.
 * Scales the vibration timing or cancels it based on the user's chosen HapticIntensity setting.
 * Safe to call in any environment (safely ignores desktop, unsupported browsers, or permission blocks).
 *
 * @param style Type of tactile vibration pulse
 * @param overrideIntensity Optional specific intensity setting to test/preview in settings
 */
export function triggerHaptic(style: HapticStyle = "light", overrideIntensity?: HapticIntensity): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return;
  }

  // Check for Vibration API support
  if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") {
    return;
  }

  const intensity: HapticIntensity = overrideIntensity !== undefined ? overrideIntensity : StorageService.getHapticIntensity();

  // If haptics are turned off by the user, immediately exit
  if (intensity === "off") {
    return;
  }

  // Multiplier scale for vibration durations
  // light: 0.6x (subtle, delicate feedback)
  // medium: 1.0x (balanced default feedback)
  // strong: 1.6x (distinct, pronounced buzz)
  const multiplier = intensity === "light" ? 0.6 : intensity === "strong" ? 1.6 : 1.0;

  try {
    switch (style) {
      case "light": {
        // Crisp tick for button taps and tab switches (approx 7ms - 19ms)
        const dur = Math.max(6, Math.round(12 * multiplier));
        navigator.vibrate(dur);
        break;
      }
      case "medium": {
        // Substantial tap for modal toggles and action triggers (approx 13ms - 35ms)
        const dur = Math.max(10, Math.round(22 * multiplier));
        navigator.vibrate(dur);
        break;
      }
      case "heavy": {
        // Firm pulse for prominent actions (approx 21ms - 56ms)
        const dur = Math.max(15, Math.round(35 * multiplier));
        navigator.vibrate(dur);
        break;
      }
      case "selection": {
        // Dual micro-pulse for navigation tab changes
        const pulse = Math.max(6, Math.round(10 * multiplier));
        const pause = 25;
        navigator.vibrate([pulse, pause, pulse]);
        break;
      }
      case "success": {
        // Upbeat rhythm for successful actions
        const p1 = Math.max(6, Math.round(12 * multiplier));
        const p2 = Math.max(10, Math.round(18 * multiplier));
        navigator.vibrate([p1, 40, p2]);
        break;
      }
      case "warning": {
        // Double alert pulse
        const pulse = Math.max(15, Math.round(25 * multiplier));
        navigator.vibrate([pulse, 50, pulse]);
        break;
      }
      default: {
        const dur = Math.max(6, Math.round(12 * multiplier));
        navigator.vibrate(dur);
      }
    }
  } catch {
    // Gracefully ignore any browser security or execution errors
  }
}
