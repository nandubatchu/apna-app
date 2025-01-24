import { NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';

// Generate VAPID keys using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys must be set');
}

webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In-memory storage for subscriptions (replace with database in production)
let pushSubscriptions: PushSubscription[] = [];

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json() as PushSubscription;
    
    // Store subscription
    pushSubscriptions = [...pushSubscriptions, subscription];
    
    return NextResponse.json({ message: 'Subscription added successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving push subscription:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// Endpoint to trigger push notification to all subscribers
export async function PUT(request: Request) {
  try {
    const payload = await request.json() as NotificationPayload;
    
    // Send notification to all subscribers
    const notifications = pushSubscriptions.map(subscription => 
      webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      ).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error sending notification:', errorMessage);
        // Remove failed subscriptions
        pushSubscriptions = pushSubscriptions.filter(
          sub => sub.endpoint !== subscription.endpoint
        );
      })
    );
    
    await Promise.all(notifications);
    
    return NextResponse.json({ 
      message: `Notification sent to ${notifications.length} subscribers` 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending push notifications:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}