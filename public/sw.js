// Custom Service Worker for Roomie Split
// Handles: offline fallback, push notifications, background sync

const CACHE_NAME = 'roomie-split-v2';
const OFFLINE_URL = '/offline.html';

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW precache failed (some assets may not exist yet):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API requests: Network First with 5s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request, 5000));
    return;
  }

  // Static assets: Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2|ico)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation: Network First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }
});

async function networkFirstWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch {
    clearTimeout(timeoutId);
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match('/');
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: 'Roomie Split', body: event.data?.text() || 'New update' };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
    tag: data.data?.expenseId || 'roomie-split',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Roomie Split 💸', options)
  );
});

// ── Background Sync ───────────────────────────────────────────────────────
// When the browser regains connectivity, notify all open clients so they
// can replay the IndexedDB offline queue via useOfflineQueue hook.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_QUEUE' }));
      })
    );
  }
});

// Also notify clients when we come back online (fetch succeeds after offline)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PING') {
    event.source?.postMessage({ type: 'PONG' });
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Navigate to home with pending bills open, or to specific expense
  const notifData = event.notification.data || {};
  const urlToOpen = self.location.origin + '/?pending=1';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existingWindow = windowClients.find((c) => c.url.startsWith(self.location.origin));
        if (existingWindow) {
          existingWindow.postMessage({ type: 'OPEN_PENDING', data: notifData });
          return existingWindow.focus();
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
