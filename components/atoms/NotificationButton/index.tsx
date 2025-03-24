'use client';

import React from 'react';
import { sendMessageToServiceWorker } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationButtonProps {
  className?: string;
}

/**
 * A button component that triggers a local notification via the service worker
 */
const NotificationButton: React.FC<NotificationButtonProps> = ({ className }) => {
  const handleClick = async () => {
    try {
      const response = await sendMessageToServiceWorker({
        type: 'SHOW_NOTIFICATION',
        title: 'Button Clicked!',
        options: { 
            body: 'You triggered a local notification.', 
            icon: "/icon-192x192.png",
            badge: '/icon-192x192.png',
        }
      });
      console.log('Service worker response:', response);
    } catch (error) {
      console.error('Failed to send message to service worker:', error);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      className={className}
      variant="default"
    >
      Show Notification
    </Button>
  );
};

export default NotificationButton;