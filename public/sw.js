const CACHE_PREFIX = "upnext-pwa";
// Stamped with the Next.js build ID by scripts/stamp-sw-version.mjs during
// `pnpm build` (see Dockerfile). Left as the placeholder outside of that
// pipeline (e.g. plain `next build` on a dev machine), which is harmless —
// it just means that one build shares a cache name with the last stamped one.
const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/pwa/") ||
    url.pathname.startsWith("/upnext-logo/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

function staleWhileRevalidate(event) {
  const networkResponse = fetch(event.request)
    .then(async (response) => {
      if (response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        } catch {
          // A storage failure must never hide a successful network response.
        }
      }
      return response;
    })
    .catch(() => undefined);

  event.waitUntil(networkResponse);

  return caches.match(event.request).then((cachedResponse) => {
    if (cachedResponse) return cachedResponse;

    return networkResponse.then(
      (response) => response ?? new Response("", { status: 504, statusText: "Offline" }),
    );
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});

// --- Firebase Cloud Messaging (FCM) Push Notifications ---
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || "UpNext Thông báo";
    const notificationId = data.notificationId || data.targetId || title;
    const options = {
      body: notification.body || data.body || "",
      icon: "/upnext-logo/icon-cropped.png",
      badge: "/upnext-logo/icon-cropped.png",
      tag: notificationId,
      renotify: false,
      data: {
        type: data.type,
        targetId: data.targetId,
        notificationId: data.notificationId,
        clickUrl: data.clickUrl,
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("[SW] Error parsing Push notification data:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetPath = "/candidate/notifications";

  if (data.clickUrl) {
    targetPath = data.clickUrl;
  } else if (data.type === "APPLICATION" && data.targetId) {
    targetPath = `/candidate/applications/${data.targetId}`;
  } else if (data.type === "CHAT" || data.type === "CONVERSATION") {
    targetPath = "/conversations/chat";
  } else if (data.type === "JOB" && data.targetId) {
    targetPath = `/jobs/${data.targetId}`;
  }

  const destinationUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === destinationUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(destinationUrl);
      }
    }),
  );
});

