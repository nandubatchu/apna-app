'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PeriodicSyncButtonProps {
  className?: string;
}

/**
 * A button component that registers a periodicSync task with the service worker
 */
const PeriodicSyncButton: React.FC<PeriodicSyncButtonProps> = ({ className }) => {
  const [status, setStatus] = useState<string>('');

  const handleClick = async () => {
    try {
      // Check if the browser supports Background Sync
      if (!('serviceWorker' in navigator) || !('PeriodicSyncManager' in window)) {
        setStatus('Periodic Sync not supported in this browser');
        return;
      }

      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Check if periodicSync is available
      if ('periodicSync' in registration) {
        // Check for permission
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as any,
        });

        if (status.state === 'granted') {
          // Register periodic sync with tag 'test' and minimum interval of 10000ms
          await (registration as any).periodicSync.register('test', {
            minInterval: 10000, // 10 seconds
          });
          setStatus('Periodic sync registered successfully!');
        } else {
          setStatus('Permission for periodic sync was denied');
        }
      } else {
        setStatus('Periodic Sync not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to register periodic sync:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div>
      <Button 
        onClick={handleClick} 
        className={className}
        variant="outline"
      >
        Register Periodic Sync
      </Button>
      {status && (
        <p className="mt-2 text-sm text-gray-600">{status}</p>
      )}
    </div>
  );
};

export default PeriodicSyncButton;