// Placeholder for Workbox imports (Next-PWA will inject these)
self.__WB_MANIFEST; // Required for precaching injection


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
