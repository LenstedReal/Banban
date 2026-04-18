// banbansports Service Worker - arka plan bildirimleri
const SITE_URL = 'https://banbansports978.vercel.app';

function iconFor(type) {
    var map = {
        goal: '/icons/goal.png',
        redcard: '/icons/redcard.png',
        yellowcard: '/icons/yellowcard.png',
        penalty: '/icons/penalty.png',
        kickoff: '/icons/kickoff.png',
        halftime: '/icons/halftime.png',
        fulltime: '/icons/fulltime.png',
        info: '/icons/info.png',
        match: '/icons/info.png'
    };
    return map[type] || '/icons/info.png';
}

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
    var data = {};
    try { data = e.data.json(); } catch(err) { data = { title: 'banbansports', body: e.data.text() }; }
    var type = data.type || 'info';
    var icon = iconFor(type);
    e.waitUntil(
        self.registration.showNotification(data.title || 'banbansports', {
            body: data.body || '',
            icon: icon,
            badge: icon,
            tag: data.tag || ('banban-' + type),
            renotify: true,
            requireInteraction: true
        })
    );
});
