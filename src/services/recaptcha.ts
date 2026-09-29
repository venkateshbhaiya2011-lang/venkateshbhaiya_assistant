/**
 * Google reCAPTCHA v3 Client Service
 *
 * Provides invisible, background token execution for sensitive actions (login, signup, guest sessions, chat, feedback)
 * without interrupting genuine users with visual puzzles.
 *
 * The secret key is NEVER stored on the client. Only the public site key is loaded.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

// Google official test site key (always returns score 0.9 in test environments)
const FALLBACK_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

let cachedSiteKey: string | null = null;
let scriptLoadingPromise: Promise<string> | null = null;

/**
 * Fetch public reCAPTCHA site key from backend config or environment
 */
export async function getRecaptchaSiteKey(): Promise<string> {
  if (cachedSiteKey) return cachedSiteKey;

  // Check client-side environment variable if provided
  const envKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim()) {
    cachedSiteKey = envKey.trim();
    return cachedSiteKey;
  }

  try {
    const res = await fetch("/api/config/recaptcha");
    if (res.ok) {
      const data = await res.json();
      if (data.siteKey) {
        cachedSiteKey = data.siteKey;
        return data.siteKey;
      }
    }
  } catch (err) {
    console.warn("Could not fetch reCAPTCHA site key from backend, using fallback:", err);
  }

  cachedSiteKey = FALLBACK_TEST_SITE_KEY;
  return cachedSiteKey;
}

/**
 * Dynamically load Google reCAPTCHA v3 script with the site key
 */
export async function loadRecaptcha(): Promise<string> {
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise(async (resolve) => {
    try {
      const siteKey = await getRecaptchaSiteKey();

      if (window.grecaptcha) {
        resolve(siteKey);
        return;
      }

      const existingScript = document.getElementById("google-recaptcha-script");
      if (existingScript) {
        if (window.grecaptcha) {
          resolve(siteKey);
        } else {
          existingScript.addEventListener("load", () => resolve(siteKey));
          existingScript.addEventListener("error", () => resolve(siteKey));
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "google-recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve(siteKey);
      };

      script.onerror = (e) => {
        console.warn("Google reCAPTCHA script load error (possibly blocked by client extension):", e);
        resolve(siteKey);
      };

      document.head.appendChild(script);
    } catch (err) {
      console.warn("reCAPTCHA loader caught error:", err);
      resolve(cachedSiteKey || FALLBACK_TEST_SITE_KEY);
    }
  });

  return scriptLoadingPromise;
}

/**
 * Execute Google reCAPTCHA v3 in the background for a specific user action
 * e.g., 'login', 'signup', 'guest_session', 'chat', 'feedback'
 *
 * Returns the token string or null if unavailable.
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  try {
    const siteKey = await loadRecaptcha();

    if (!window.grecaptcha) {
      // Wait briefly in case script is still finishing initialization
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!window.grecaptcha || typeof window.grecaptcha.execute !== "function") {
      // Non-blocking fallback for offline or blocked environments
      return `recaptcha_fallback_${action}_${Date.now()}`;
    }

    return await new Promise<string | null>((resolve) => {
      try {
        window.grecaptcha!.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(siteKey, { action });
            resolve(token);
          } catch (execErr) {
            console.warn(`reCAPTCHA execution error for action [${action}]:`, execErr);
            resolve(`recaptcha_fallback_${action}_${Date.now()}`);
          }
        });
      } catch (readyErr) {
        console.warn("reCAPTCHA ready error:", readyErr);
        resolve(`recaptcha_fallback_${action}_${Date.now()}`);
      }
    });
  } catch (err) {
    console.warn(`executeRecaptcha caught error for action [${action}]:`, err);
    return `recaptcha_fallback_${action}_${Date.now()}`;
  }
}
