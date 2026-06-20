const CACHE_VERSION = "family-finance-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_VERSION)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((response) => response),
      ),
    );
    return;
  }

  if (
    ["style", "script", "font", "image"].includes(request.destination)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkResponse = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              void caches
                .open(CACHE_VERSION)
                .then((cache) => cache.put(request, responseClone));
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse ?? networkResponse;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Семейный бюджет", {
      body: payload.body ?? "Новое сообщение",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: {
        url: payload.url ?? "/chat",
      },
      tag: "family-chat",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url ?? "/chat",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );

        if (existingClient) {
          return existingClient.focus().then(() => existingClient.navigate(targetUrl));
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
