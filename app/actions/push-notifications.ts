'use server'

import webpush from 'web-push';


// Configure web-push with our VAPID keys
// This is done inside the function to ensure it's only run on the server
function configureWebPush() {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY as string;
  
  webpush.setVapidDetails(
    'mailto:hello@apna-host.vercel.app', // A contact email for your application
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * Server action to send a push notification to a subscription
 * This function can only be executed on the server
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; message: string; [key: string]: any }
): Promise<boolean> {
  try {
    // Configure web-push with our VAPID keys
    configureWebPush();
    
    // Send the notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}