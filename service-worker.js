// Simple Service Worker to satisfy PWA installation criteria
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple passthrough, allows the app to work online normally
  // In a full PWA, caching strategies would go here
  event.respondWith(fetch(event.request));
});