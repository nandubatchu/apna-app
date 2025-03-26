import { NextResponse } from 'next/server'
import { pushSubscriptionStore, SERVER_NSEC } from '@/lib/pushSubscriptionStore'
import { sendPushNotification } from '@/app/actions/push-notifications'
import { sendPushUnsubscription } from '@/lib/nostr/nip04Utils'

export async function POST(request: Request) {
  try {
    const { title, message } = await request.json()
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const subscriptions = await pushSubscriptionStore.getAllSubscriptions()
    
    console.log('Sending push notification to all subscribers:')
    console.log('Title:', title)
    console.log('Message:', message)
    console.log('Number of subscribers:', subscriptions.length)
    
    // Send notifications to all subscribers
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const success = await sendPushNotification(subscription, { title, message });
          if (!success) {
            // If sending failed, log a warning
            console.warn(
              'Failed to send notification to subscription. ' +
              'This subscription should be removed via Nostr using sendPushUnsubscription.'
            );
            await sendPushUnsubscription(SERVER_NSEC, JSON.stringify(subscription.endpoint))
          }
          return success;
        } catch (error) {
          console.error('Error sending notification:', error);
          // If there was an error with status 410, the subscription is no longer valid
          if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            console.warn(
              'Subscription is no longer valid (410 Gone). ' +
              'This subscription should be removed via Nostr using sendPushUnsubscription.'
            );
            await sendPushUnsubscription(SERVER_NSEC, JSON.stringify(subscription.endpoint))
          }
          return false;
        }
      })
    );
    
    const successCount = results.filter(Boolean).length;
    
    return NextResponse.json(
      {
        success: true,
        message: `Notification sent to ${successCount} out of ${subscriptions.length} subscribers`
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}