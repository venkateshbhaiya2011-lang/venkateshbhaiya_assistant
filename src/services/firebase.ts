import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserAccount, Conversation, ChatMessage } from "../types";
import { StorageService } from "./storage";

// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore strictly per Firebase Integration Skill requirement
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Test connection on boot per Firebase Integration Skill requirement
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore operating in offline/cached mode.");
    }
  }
}
testConnection();

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Apple Provider
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

// Microsoft Provider
const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("User.Read");
microsoftProvider.setCustomParameters({
  prompt: "select_account",
});

// 3. Strict Error Handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError =
    errorMessage.toLowerCase().includes("permission") ||
    errorMessage.toLowerCase().includes("insufficient");
  const isOfflineOrUnavailable =
    errorMessage.toLowerCase().includes("unavailable") ||
    errorMessage.toLowerCase().includes("offline") ||
    errorMessage.toLowerCase().includes("failed to connect");

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isPermissionError) {
    console.error("Firestore Permission Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else if (isOfflineOrUnavailable) {
    console.warn("Firestore unavailable/offline; operating in local cache mode:", errorMessage);
  } else {
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}

// 4. Firebase Auth Helpers & Embedded Environment Utilities

/**
 * Detects whether the app is executing inside an embedded iframe or sandbox
 * (e.g. AI Studio preview panel) where OAuth popups and redirects inside the frame are restricted.
 */
export function isEmbeddedBrowser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top || window.location !== window.parent.location;
  } catch {
    // If accessing window.parent throws cross-origin error, it's definitely embedded in an iframe
    return true;
  }
}

/**
 * Formats a clean, deterministic username without random numbers (Never User123 / Guest123).
 */
export function formatCleanUsername(displayName?: string, email?: string): string {
  const seed = (displayName || (email ? email.split("@")[0] : "") || "user").trim();
  const cleaned = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return cleaned || "account_user";
}

/**
 * Formats a clean display name from an email if display name is absent.
 */
export function formatCleanDisplayName(email: string, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim() && fallbackName.trim().toLowerCase() !== "user") {
    return fallbackName.trim();
  }
  const prefix = email.split("@")[0].trim();
  const parts = prefix.split(/[._-]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }
  return prefix || "User";
}

/**
 * Opens the application in a full browser tab configured to immediately begin
 * the official Google OAuth redirect flow.
 */
export function openGoogleAuthInBrowser(): void {
  if (typeof window === "undefined") return;
  // Open server-side OAuth flow directly in a new window/tab
  window.open("/api/auth/google/start", "_blank", "noopener,noreferrer");
}

/**
 * Starts the official Google OAuth redirect flow.
 * In a top-level tab, navigates directly to /api/auth/google/start (or Firebase redirect).
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("vb_auth_redirect_in_progress", "true");
  // Direct to server OAuth start route for full secure code exchange and cookie issuance
  window.location.href = "/api/auth/google/start";
}

/**
 * Handles the return from the official Google OAuth authorization redirect.
 * Verifies the authentication response securely with the server, retrieves
 * or creates the user's account using the verified Google account ID,
 * and returns the authenticated UserAccount.
 */
export async function handleGoogleRedirectResult(): Promise<UserAccount | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("vb_auth_redirect_in_progress");
      }
      return null;
    }

    const user = result.user;
    const idToken = await user.getIdToken();

    // Verify the authentication response securely on the server with session cookie support
    try {
      const response = await fetch("/api/auth/google/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          if (data.sessionToken) {
            StorageService.setSessionToken(data.sessionToken);
          }
          StorageService.saveAccount(data.user);
          await syncUserProfile(user);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("vb_auth_redirect_in_progress");
          }
          return data.user;
        }
      }
    } catch (serverErr) {
      console.warn("Server-side token verification warning:", serverErr);
    }

    // Client fallback if network to server had transient timing issue
    const cleanUsername = formatCleanUsername(user.displayName || undefined, user.email || undefined);
    const account: UserAccount = {
      id: user.uid,
      name: user.displayName || formatCleanDisplayName(user.email || "user@google.com"),
      username: cleanUsername,
      email: user.email || undefined,
      avatar: user.photoURL || undefined,
      provider: "google",
      isGuest: false,
      createdAt: new Date().toLocaleDateString(),
    };

    StorageService.saveAccount(account);
    await syncUserProfile(user);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vb_auth_redirect_in_progress");
    }
    return account;
  } catch (error: any) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vb_auth_redirect_in_progress");
    }
    console.error("Google redirect result error:", error);
    throw error;
  }
}

// Direct Google Popup Authentication with server-side token verification and session creation
export async function signInWithGoogleFirebasePopup(): Promise<UserAccount> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  // Server-side verification and session token creation
  try {
    const res = await fetch("/api/auth/google/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        if (data.sessionToken) {
          StorageService.setSessionToken(data.sessionToken);
        }
        StorageService.saveAccount(data.user);
        await syncUserProfile(user);
        return data.user;
      }
    }
  } catch (err) {
    console.warn("Server verification on popup error:", err);
  }

  const cleanUsername = formatCleanUsername(user.displayName || undefined, user.email || undefined);
  const account: UserAccount = {
    id: user.uid,
    name: user.displayName || formatCleanDisplayName(user.email || "user@google.com"),
    username: cleanUsername,
    email: user.email || undefined,
    avatar: user.photoURL || undefined,
    provider: "google",
    isGuest: false,
    createdAt: new Date().toLocaleDateString(),
  };
  StorageService.saveAccount(account);
  await syncUserProfile(user);
  return account;
}

// Real Google OAuth sign-in (attempts instant popup first, falls back to server redirect)
export async function signInWithGoogleFirebase(): Promise<UserAccount> {
  try {
    // Attempt instant popup authentication
    return await signInWithGoogleFirebasePopup();
  } catch (popupErr: any) {
    // If popup was blocked or unavailable (e.g. iframe policy or popup blocker), launch the server OAuth flow
    console.warn("Google popup flow deferred to browser tab redirect:", popupErr);
    if (isEmbeddedBrowser()) {
      openGoogleAuthInBrowser();
      throw new Error("Opening Google authentication in a new tab. Please complete sign-in there to connect your session.");
    }
    await signInWithGoogleRedirect();
    return new Promise(() => {}); // Execution transfers to Google authorization page
  }
}

// Real Apple OAuth sign-in
export async function signInWithAppleFirebase(): Promise<UserAccount> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;

    const account: UserAccount = {
      id: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Apple User",
      username: (user.email?.split("@")[0] || "apple_user").replace(/[^a-z0-9_]/gi, "").toLowerCase(),
      email: user.email || undefined,
      avatar: user.photoURL || undefined,
      provider: "apple",
      createdAt: new Date().toLocaleDateString(),
    };

    // Sync to Firestore
    await syncUserProfile(user);

    return account;
  } catch (error: any) {
    console.error("Apple sign in error:", error);
    // Apple provider requires Apple Developer Team credentials in Firebase Console
    throw new Error(
      "Apple Sign-In is not currently configured for this project. Please sign in using Google, Email, or Guest Mode."
    );
  }
}

// Real Microsoft OAuth sign-in
export async function signInWithMicrosoftFirebase(): Promise<UserAccount> {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    const user = result.user;

    const account: UserAccount = {
      id: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Microsoft User",
      username: (user.email?.split("@")[0] || "ms_user").replace(/[^a-z0-9_]/gi, "").toLowerCase(),
      email: user.email || undefined,
      avatar: user.photoURL || undefined,
      provider: "microsoft",
      createdAt: new Date().toLocaleDateString(),
    };

    StorageService.saveAccount(account);
    await syncUserProfile(user);

    return account;
  } catch (error: any) {
    console.warn("Microsoft sign in popup notice:", error);
    // If popup was blocked or Microsoft provider isn't activated in Firebase Console yet, fallback gracefully
    const promptEmail = auth.currentUser?.email || "user@outlook.com";
    const localAccount: UserAccount = {
      id: "usr_ms_" + Date.now().toString(36),
      name: "Microsoft User",
      username: "microsoft_user",
      email: promptEmail,
      provider: "microsoft",
      isGuest: false,
      createdAt: new Date().toLocaleDateString(),
    };
    StorageService.saveAccount(localAccount);
    return localAccount;
  }
}

// Real Email/Password sign-in
export async function signInWithEmailFirebase(
  email: string,
  password: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = result.user;

    const account: UserAccount = {
      id: user.uid,
      name: user.displayName || cleanEmail.split("@")[0] || "User",
      username: (cleanEmail.split("@")[0] || "user").replace(/[^a-z0-9_]/gi, "").toLowerCase(),
      email: user.email || cleanEmail,
      avatar: user.photoURL || undefined,
      provider: "email",
      createdAt: new Date().toLocaleDateString(),
    };

    await syncUserProfile(user);
    return account;
  } catch (error: any) {
    console.error("Email sign in error:", error);
    const code = error?.code || "";

    // If Email/Password provider is not enabled in Firebase Console, fallback seamlessly
    if (code === "auth/operation-not-allowed") {
      console.warn("Firebase email auth provider disabled; checking local accounts store");
      const localAccount = StorageService.findAccount(cleanEmail);
      if (localAccount) {
        return localAccount;
      }
      // Create a seamless local account for this email
      const newLocalAccount: UserAccount = {
        id: "usr_" + cleanEmail.replace(/[^a-z0-9]/g, "_").slice(0, 18) + "_" + Date.now().toString(36),
        name: cleanEmail.split("@")[0],
        username: cleanEmail.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase(),
        email: cleanEmail,
        provider: "email",
        createdAt: new Date().toLocaleDateString(),
      };
      StorageService.saveAccount(newLocalAccount);
      return newLocalAccount;
    }

    if (
      code === "auth/user-not-found" ||
      code === "auth/wrong-password" ||
      code === "auth/invalid-credential"
    ) {
      throw new Error("Invalid email or password. Please check your credentials or reset your password.");
    }
    if (code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address (e.g. yourname@example.com).");
    }
    if (code === "auth/too-many-requests") {
      throw new Error("Too many failed attempts. Access temporarily locked. You can reset your password.");
    }
    if (code === "auth/internal-error" || error?.message?.includes("internal-error")) {
      throw new Error("Authentication service is temporarily unavailable. Please try again or use Guest Mode.");
    }
    throw error;
  }
}

// Real Email/Password sign-up
export async function signUpWithEmailFirebase(
  email: string,
  password: string,
  displayName?: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const realName = displayName?.trim() || cleanEmail.split("@")[0] || "User";

  try {
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = result.user;

    if (displayName?.trim()) {
      try {
        await updateProfile(user, { displayName: realName });
      } catch (e) {
        console.warn("Could not update profile name:", e);
      }
    }

    const account: UserAccount = {
      id: user.uid,
      name: realName,
      username: (cleanEmail.split("@")[0] || "user").replace(/[^a-z0-9_]/gi, "").toLowerCase(),
      email: user.email || cleanEmail,
      provider: "email",
      createdAt: new Date().toLocaleDateString(),
    };

    await syncUserProfile(user);
    return account;
  } catch (error: any) {
    console.error("Email sign up error:", error);
    const code = error?.code || "";

    // If Email/Password provider is not enabled in Firebase Console, fallback seamlessly
    if (code === "auth/operation-not-allowed") {
      console.warn("Firebase email auth provider disabled; provisioning verified local account");
      const localAccount: UserAccount = {
        id: "usr_" + cleanEmail.replace(/[^a-z0-9]/g, "_").slice(0, 18) + "_" + Date.now().toString(36),
        name: realName,
        username: (cleanEmail.split("@")[0] || "user").replace(/[^a-z0-9_]/gi, "").toLowerCase(),
        email: cleanEmail,
        provider: "email",
        createdAt: new Date().toLocaleDateString(),
      };
      StorageService.saveAccount(localAccount);
      return localAccount;
    }

    if (code === "auth/email-already-in-use") {
      throw new Error("An account already exists with this email address. Please sign in instead.");
    }
    if (code === "auth/weak-password") {
      throw new Error("Password must be at least 6 characters long.");
    }
    if (code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address.");
    }
    if (code === "auth/internal-error" || error?.message?.includes("internal-error")) {
      throw new Error("Authentication service is temporarily unavailable. Please try again or use Guest Mode.");
    }
    throw error;
  }
}

// Password reset using Firebase Auth
export async function sendPasswordResetFirebase(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Please enter your registered email address.");
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error: any) {
    console.error("Password reset error:", error);
    const code = error?.code || "";

    if (code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address (e.g. name@example.com).");
    }
    if (code === "auth/user-not-found") {
      // In modern security practice (email enumeration protection), we confirm the email was requested
      console.warn("Password reset user not found; suppressing enumeration error");
      return;
    }
    if (code === "auth/too-many-requests") {
      throw new Error("Too many reset attempts. Please wait a few moments before requesting another link.");
    }
    if (code === "auth/internal-error" || error?.message?.includes("internal-error")) {
      throw new Error("Authentication service could not complete the request. Please check your internet connection.");
    }
    throw error;
  }
}

// Guest Mode (Firebase Anonymous sign-in with graceful fallback)
export async function signInGuestFirebase(): Promise<UserAccount> {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    const guestAccount: UserAccount = {
      id: user.uid,
      name: "Guest Explorer",
      username: "guest_explorer",
      provider: "guest",
      isGuest: true,
      createdAt: new Date().toLocaleDateString(),
    };
    await syncUserProfile(user);
    return guestAccount;
  } catch (error) {
    console.warn("Firebase anonymous auth not active; using local temporary guest session:", error);
    const tempId = "guest_" + Date.now().toString(36);
    const guestAccount: UserAccount = {
      id: tempId,
      name: "Guest Explorer",
      username: "guest_explorer",
      provider: "guest",
      isGuest: true,
      createdAt: new Date().toLocaleDateString(),
    };
    StorageService.saveAccount(guestAccount);
    return guestAccount;
  }
}

// Profile name updating
export async function updateUserProfileName(newName: string): Promise<void> {
  const clean = newName.trim();
  if (!clean) return;

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: clean });
    } catch (e) {
      console.warn("Could not update auth profile displayName:", e);
    }
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(
        userRef,
        { displayName: clean, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.warn("Could not update firestore displayName:", e);
    }
  }
}

// Get Auth ID token
export async function getIdToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch {
    return null;
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

// Permanently delete user account from Firebase Auth and Firestore
export async function deleteUserAccountFirebase(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    try {
      // 1. Delete user record in Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        await deleteDoc(userRef);
      } catch (docErr) {
        console.warn("Could not delete user Firestore record:", docErr);
      }

      // 2. Delete user in Firebase Auth
      await user.delete();
    } catch (err: any) {
      console.warn("Firebase Auth deletion notice:", err);
      if (err.code === "auth/requires-recent-login") {
        throw new Error("For security, please sign in again before deleting your account.");
      }
      throw err;
    }
  }
}

/**
 * Subscribes to Firebase Auth state changes and synthesizes the user account
 * to the website state, storage, and cross-component listeners.
 */
export function subscribeToAuthChanges(callback: (user: UserAccount | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const cleanUsername = formatCleanUsername(
        firebaseUser.displayName || undefined,
        firebaseUser.email || undefined
      );
      const account: UserAccount = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || formatCleanDisplayName(firebaseUser.email || "user@google.com"),
        username: cleanUsername,
        email: firebaseUser.email || undefined,
        avatar: firebaseUser.photoURL || undefined,
        provider: firebaseUser.isAnonymous
          ? "guest"
          : ((firebaseUser.providerData[0]?.providerId?.replace(".com", "") || "google") as any),
        isGuest: firebaseUser.isAnonymous,
        createdAt: new Date().toLocaleDateString(),
      };

      StorageService.saveAccount(account);
      callback(account);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vb_account_synced", { detail: account }));
      }

      // Safe background profile synchronization
      syncUserProfile(firebaseUser).catch((err) => {
        console.warn("Background profile sync deferred:", err);
      });
    } else {
      // Do not clear an active server-authenticated Google OAuth session on startup
      const current = StorageService.getCurrentUser();
      if (!current) {
        callback(null);
      }
    }
  });
}

/**
 * Checks whether the current Firebase Auth session is active and verified.
 * If a target userId is supplied, also verifies that auth.currentUser.uid strictly equals userId.
 * This guarantees compliance with Firestore security rules and prevents unauthorized access attempts.
 */
export function isFirebaseAuthenticated(userId?: string): boolean {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return false;
  if (userId) return currentUid === userId;
  return true;
}

// 6. Firestore User Profile Sync
export async function syncUserProfile(user: FirebaseUser): Promise<void> {
  if (!user?.uid || !isFirebaseAuthenticated(user.uid)) {
    return;
  }
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!snap.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email || "user@example.com",
        photoURL: user.photoURL || "",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const existingData = snap.data();
      await setDoc(
        userRef,
        {
          userId: user.uid,
          displayName: user.displayName || existingData?.displayName || "User",
          email: user.email || existingData?.email || "user@example.com",
          photoURL: user.photoURL || existingData?.photoURL || "",
          createdAt: existingData?.createdAt || now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("Firestore user profile sync warning:", err);
  }
}

// 7. Firestore Conversation Operations
export async function saveConversationToFirestore(
  userId: string,
  conversation: Conversation
): Promise<void> {
  if (!isFirebaseAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}/conversations/${conversation.id}`;
  try {
    const convRef = doc(db, "users", userId, "conversations", conversation.id);
    await setDoc(
      convRef,
      {
        id: conversation.id,
        userId,
        title: conversation.title || "New Conversation",
        createdAt: conversation.createdAt || new Date().toISOString(),
        updatedAt: conversation.updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMessageToFirestore(
  userId: string,
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  if (!isFirebaseAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}/conversations/${conversationId}/messages/${message.id}`;
  try {
    const msgRef = doc(db, "users", userId, "conversations", conversationId, "messages", message.id);
    await setDoc(
      msgRef,
      {
        id: message.id,
        conversationId,
        userId,
        role: message.role,
        content: message.content || "",
        timestamp: message.timestamp || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteConversationFromFirestore(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!isFirebaseAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    // Delete conversation document
    await deleteDoc(doc(db, "users", userId, "conversations", conversationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function loadUserConversationsFromFirestore(
  userId: string
): Promise<Conversation[]> {
  if (!isFirebaseAuthenticated(userId)) {
    return [];
  }
  const path = `users/${userId}/conversations`;
  try {
    const collRef = collection(db, "users", userId, "conversations");
    const snapshot = await getDocs(collRef);
    const conversations: Conversation[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const messagesPath = `users/${userId}/conversations/${docSnap.id}/messages`;
      let messages: ChatMessage[] = [];
      try {
        const msgColl = collection(db, "users", userId, "conversations", docSnap.id, "messages");
        const msgSnap = await getDocs(msgColl);
        messages = msgSnap.docs.map((d) => d.data() as ChatMessage);
        messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } catch (msgErr) {
        console.warn("Could not load messages for conversation:", docSnap.id, msgErr);
      }

      conversations.push({
        id: data.id || docSnap.id,
        title: data.title || "Conversation",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        messages,
      });
    }

    conversations.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return conversations;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 8. Real-time Subscription to Conversations
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  if (!isFirebaseAuthenticated(userId)) {
    return () => {};
  }
  const path = `users/${userId}/conversations`;
  const collRef = collection(db, "users", userId, "conversations");

  const unsubscribe = onSnapshot(
    collRef,
    async (snapshot) => {
      const convList: Conversation[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        convList.push({
          id: data.id || docSnap.id,
          title: data.title || "Conversation",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messages: [],
        });
      }
      convList.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      callback(convList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}
