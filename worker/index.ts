// @ts-nocheck
import { handleFetchFeedPushEvent } from './nostr';
declare let self: ServiceWorkerGlobalScope

self.__WB_MANIFEST

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
self.__WB_DISABLE_DEV_LOGS = true


// service worker event hooks

self.addEventListener('install', () => {
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', () => {
  console.log('Service Worker: Activated');
});

self.addEventListener('push', (event) => {
  const data = JSON.parse(event?.data.text() || '{}')

  if (data.type === "NOSTR_FETCH_FEED") {
    event?.waitUntil(handleFetchFeedPushEvent(data))
    return
  }

  event?.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/notification-badge.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event?.notification.close()
  event?.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0]
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i]
          }
        }
        return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})


self.addEventListener('message', (event) => {
  const data = event.data;
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title, data.options);
    if (event.ports[0]) { // Access the transferred port
      event.ports[0].postMessage({ status: 'Notification queued' }); // Send response
    }
  }
});

