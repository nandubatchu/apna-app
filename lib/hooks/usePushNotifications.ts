import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      // Get service worker registration
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
        // Check existing subscription
        return reg.pushManager.getSubscription();
      }).then(sub => {
        if (sub) {
          setSubscription(sub);
          setIsSubscribed(true);
        }
      }).catch(err => {
        setError(err.message);
        console.error('Error checking push subscription:', err);
      });
    }
  }, []);

  const subscribeToNotifications = async () => {
    try {
      if (!registration) {
        throw new Error('Service Worker not registered');
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      // Convert VAPID key to Uint8Array
      const publicKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushSubscription)
      });

      if (!response.ok) {
        throw new Error('Failed to store subscription on server');
      }

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      console.error('Error subscribing to push notifications:', err);
      return false;
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      if (!subscription) {
        throw new Error('No subscription found');
      }

      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      console.error('Error unsubscribing from push notifications:', err);
      return false;
    }
  };

  return {
    isSubscribed,
    error,
    subscribeToNotifications,
    unsubscribeFromNotifications
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}