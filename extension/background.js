// Minimal background service worker for future use (kept simple now)
self.addEventListener('install', (e)=>{
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  self.clients.claim();
});
