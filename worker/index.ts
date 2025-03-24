// @ts-nocheck
declare let self: ServiceWorkerGlobalScope

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true

self.addEventListener('install', () => {
    console.log('Service Worker: Installed');
  });
  
  self.addEventListener('activate', () => {
    console.log('Service Worker: Activated');
  });

self.addEventListener('push',  (event) => {
  const data = JSON.parse(event?.data.text() || '{}')
  event?.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/icons/android-chrome-192x192.png'
    })
  )
})

self.addEventListener('notificationclick',  (event) => {
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

// Handle periodic sync events
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'test') {
        event.waitUntil(
            (async () => {
                // Show a notification when periodic sync occurs
                await self.registration.showNotification('Periodic Sync', {
                    body: 'This notification was triggered by periodic sync',
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png'
                });

                // You could also fetch data, update caches, etc.
                console.log('Periodic sync event fired:', event.tag);
            })()
        );
    }
});
