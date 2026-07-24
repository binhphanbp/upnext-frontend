const CACHE_PREFIX = "upnext-pwa";
const CACHE_NAME = `${CACHE_PREFIX}-v1`;
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
