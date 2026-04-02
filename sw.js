const CACHE_NAME = 'workout-tracker-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================
// Rest Timer Notifications
// Schedule a notification from the SW so it fires even when the page is
// suspended. The page posts SCHEDULE_TIMER when the countdown starts and
// CANCEL_TIMER when it is stopped manually.
// ==========================================

let timerTimeout = null;

self.addEventListener('message', event => {
  const { type, endTime } = event.data || {};

  if (type === 'SCHEDULE_TIMER') {
    if (timerTimeout) clearTimeout(timerTimeout);
    const delay = Math.max(0, endTime - Date.now());
    timerTimeout = setTimeout(async () => {
      timerTimeout = null;
      // Only show notification if no app window is currently visible
      const clients = await self.clients.matchAll({ type: 'window' });
      const appVisible = clients.some(c => c.visibilityState === 'visible');
      if (!appVisible) {
        self.registration.showNotification('Rest Timer Done', {
          body: 'Time to get back to it!',
          icon: '/icons/icon-192.svg',
          vibrate: [200, 100, 200, 100, 200],
          tag: 'rest-timer',
          renotify: true
        });
      }
    }, delay);
  }

  if (type === 'CANCEL_TIMER') {
    if (timerTimeout) {
      clearTimeout(timerTimeout);
      timerTimeout = null;
    }
  }
});

// Tapping the notification brings the app to the foreground
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

// Fetch strategy: cache first, then network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and external resources
  if (event.request.method !== 'GET') return;

  // For Chart.js CDN, use network first
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
  );
});
