// public/sw.js — Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Project Space';
  
  // Choose icon based on notification type
  const typeIcons = {
    'review-request': '📋',
    'approved': '✅',
    'rejected': '🔄',
    'admin-alert': '🔔',
    'test': '🧪'
  };
  const emoji = typeIcons[data.type] || '🚀';

  // Build rich body
  let body = data.body || 'You have a new notification';
  if (data.teamNumber && data.stageNumber) {
    body = `${body}`;
  }

  const options = {
    body: body,
    icon: '/ps-logo.png',
    badge: '/ps-badge.png',
    tag: data.tag || 'ps-' + Date.now(),
    data: {
      url: data.url || '/',
      teamNumber: data.teamNumber,
      stageNumber: data.stageNumber,
      type: data.type,
    },
    vibrate: [100, 50, 100, 50, 200],
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: data.type === 'review-request',
    silent: false,
    renotify: true,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let url = data.url || '/';
  
  if (data.type === 'review-request') url = '/mentor/dashboard';
  else if (data.type === 'approved' || data.type === 'rejected') url = '/dashboard';
  else if (data.type === 'admin-alert') url = '/admin';

  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it and navigate
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(fullUrl));
        }
      }
      // Otherwise open a new window
      return clients.openWindow(fullUrl);
    })
  );
});

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });