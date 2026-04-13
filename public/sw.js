// public/sw.js — Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Project Space';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/ps-icon-192.png',
    badge: '/icons/ps-badge-72.png',
    tag: data.tag || 'project-space-' + Date.now(),
    data: {
      url: data.url || '/',
      teamNumber: data.teamNumber,
      stageNumber: data.stageNumber,
      type: data.type,
    },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  let url = data.url || '/';
  if (data.type === 'review-request') url = '/mentor/dashboard';
  else if (data.type === 'approved' || data.type === 'rejected') url = '/dashboard';
  else if (data.type === 'admin-alert') url = '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });