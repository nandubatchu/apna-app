'use client';

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { BellIcon, BellOffIcon } from "lucide-react";

export function NotificationToggle() {
  const {
    isSubscribed,
    error,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = usePushNotifications();

  const handleToggle = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support push notifications');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('You have blocked notifications. Please enable them in your browser settings.');
      return;
    }

    if (isSubscribed) {
      await unsubscribeFromNotifications();
    } else {
      // Request permission if not already granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Permission for notifications was denied');
          return;
        }
      }
      await subscribeToNotifications();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isSubscribed ? "default" : "outline"}
        onClick={handleToggle}
        className="w-full"
      >
        {isSubscribed ? (
          <>
            <BellIcon className="mr-2 h-4 w-4" />
            Notifications Enabled
          </>
        ) : (
          <>
            <BellOffIcon className="mr-2 h-4 w-4" />
            Enable Notifications
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500">
          Error: {error}
        </p>
      )}
    </div>
  );
}