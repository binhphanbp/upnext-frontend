import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

import { ApiError } from "@/shared/api/http";

import { registerFcmToken, unregisterFcmToken } from "../api/notifications";

const LOCAL_STORAGE_FCM_KEY = "upnext_fcm_token";

function getFirebaseOptions(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    ...(authDomain ? { authDomain } : {}),
    projectId,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
    appId,
  };
}

function getVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || null;
}

function isFirebaseConfigured(): boolean {
  return Boolean(getFirebaseOptions() && getVapidKey());
}

let messagingInstance: Messaging | null = null;

async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported().catch(() => false);
  const config = getFirebaseOptions();
  if (!supported || !config) {
    return null;
  }

  if (!messagingInstance) {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

/**
 * Requests Notification permission and registers FCM token with the backend.
 */
export async function requestAndRegisterFcmToken(userAccessToken: string): Promise<string | null> {
  console.log("[FCM] requestAndRegisterFcmToken called");

  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("[FCM] Window or Notification API not available");
    return null;
  }

  const vapidKey = getVapidKey();
  const isConfigured = isFirebaseConfigured();

  console.log("[FCM] Firebase configured:", isConfigured);
  console.log("[FCM] VAPID key available:", !!vapidKey);

  if (!isConfigured || !vapidKey) {
    console.warn("[FCM] Firebase env configuration is missing. FCM Web Push skipped.");
    return null;
  }

  try {
    console.log("[FCM] Step 1: Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("[FCM] Step 1 done: permission =", permission);

    if (permission !== "granted") {
      console.warn("[FCM] Notification permission was not granted:", permission);
      return null;
    }

    console.log("[FCM] Step 2: Getting Firebase messaging instance...");
    const messaging = await getFirebaseMessaging();
    console.log("[FCM] Step 2 done: messaging =", !!messaging);
    if (!messaging) return null;

    console.log("[FCM] Step 3: Attempting to get active service worker registration...");
    // Try to get the active PWA service worker, but don't block on it
    let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

    try {
      // Try to get existing registration with timeout
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2000),
      );
      serviceWorkerRegistration = await Promise.race([swReadyPromise, timeoutPromise]);
      console.log("[FCM] Step 3 done: Active SW found");
    } catch {
      console.log("[FCM] Step 3: No active SW (ok), proceeding without registration");
    }

    console.log("[FCM] Step 4: Getting FCM token...");
    // Try with registration if available, otherwise without
    let fcmToken;
    if (serviceWorkerRegistration) {
      fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
      });
    } else {
      // Firebase can handle getting token without explicit SW registration
      fcmToken = await getToken(messaging, {
        vapidKey,
      } as any);
    }
    console.log(
      "[FCM] Step 4 done: fcmToken =",
      fcmToken ? fcmToken.substring(0, 10) + "..." : "null",
    );

    if (fcmToken) {
      console.log("[FCM] Step 5: Registering token with backend...");
      await registerFcmToken(userAccessToken, fcmToken, "web");
      console.log("[FCM] Step 5 done: token registered");

      window.localStorage.setItem(LOCAL_STORAGE_FCM_KEY, fcmToken);
      console.info("[FCM] Registered Web FCM Token successfully.");
      return fcmToken;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      console.warn("[FCM] Session expired or unauthorized (401). Skipped FCM token registration.");
    } else {
      console.error("[FCM] Error registering FCM token:", error);
    }
  }

  return null;
}

/**
 * Unregisters the saved FCM token from the backend upon logout.
 */
export async function unregisterCurrentFcmToken(userAccessToken: string): Promise<void> {
  if (typeof window === "undefined") return;

  const storedToken = window.localStorage.getItem(LOCAL_STORAGE_FCM_KEY);
  if (!storedToken) return;

  try {
    await unregisterFcmToken(userAccessToken, storedToken);
    console.info("[FCM] Unregistered Web FCM Token successfully.");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Ignore 401 during unregister since session is already gone/invalidated
    } else {
      console.error("[FCM] Error unregistering FCM token:", error);
    }
  } finally {
    window.localStorage.removeItem(LOCAL_STORAGE_FCM_KEY);
  }
}

/**
 * Sync FCM token if Notification permission is already granted.
 */
let isSyncingFcm = false;
export async function syncFcmTokenIfPermitted(userAccessToken: string): Promise<void> {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    !isSyncingFcm
  ) {
    try {
      isSyncingFcm = true;
      await requestAndRegisterFcmToken(userAccessToken);
    } finally {
      isSyncingFcm = false;
    }
  }
}

/**
 * Listen for foreground messages when the web app is open.
 */
export async function listenForegroundMessages(
  onMessageReceived: (payload: any) => void,
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    onMessageReceived(payload);
  });
}
