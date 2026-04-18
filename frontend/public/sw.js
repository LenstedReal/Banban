// banbansports Service Worker - arka plan bildirimleri
const SITE_URL = 'https://banbansports978.vercel.app';

self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({type: 'window'}).then(function(clients) {
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].url.includes('banbansports') && 'focus' in clients[i]) {
                    return clients[i].focus();
                }
            }
            return self.clients.openWindow(SITE_URL);
        })
    );
});

self.addEventListener('push', function(e) {
    if (!e.data) return;
    var data = e.data.json();
    e.waitUntil(
        self.registration.showNotification(data.title || 'banbansports', {
            body: data.body || '',
            icon: '/tsl_logo.png',
            badge: '/tsl_logo.png',
            tag: data.tag || 'banban',
            renotify: true,
            requireInteraction: true
        })
    );
});
