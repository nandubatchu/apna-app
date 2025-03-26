import { NextResponse } from 'next/server'
import { pushSubscriptionStore, SERVER_NSEC } from '@/lib/pushSubscriptionStore'
import { sendPushNotification } from '@/app/actions/push-notifications'
import { sendPushUnsubscription } from '@/lib/nostr/nip04Utils'

// This is a simple test endpoint to send a test notification
// In a production environment, you would have proper authentication and authorization

export async function GET(request: Request) {
  try {
    const subscriptions = await pushSubscriptionStore.getAllSubscriptions()
    
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found. Please subscribe to push notifications first.' },
        { status: 404 }
      )
    }
    
    const title = 'Test Notification'
    const message = 'This is a test notification from Apna App!'
    
    console.log('Sending test push notification to all subscribers:')
    console.log('Number of subscribers:', subscriptions.length)
    
    // Send notifications to all subscribers
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const success = await sendPushNotification(subscription, { 
            title, 
            message,
            timestamp: new Date().toISOString(),
            test: true
          });

          // // @ts-ignore
          // const success = await sendPushNotification(subscription, {"type":"NOSTR_FETCH_FEED", "relays":["wss://eden.nostr.land/","wss://nostr.wine/","wss://relay.damus.io/","wss://relay.nostr.band/","wss://relay.snort.social"], "pubkey":"7575b94fa81152fe529a4899d390294af142277154ce44036d50e2ad99d5c267", "since": 1742917077});
          
          if (!success) {
            // If sending failed, log a warning
            console.warn(
              'Failed to send test notification to subscription. ' +
              'This subscription should be removed via Nostr using sendPushUnsubscription.'
            );
            await sendPushUnsubscription(SERVER_NSEC, JSON.stringify(subscription.endpoint))
          }
          return success;
        } catch (error) {
          console.error('Error sending test notification:', error);
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
        message: `Test notification sent to ${successCount} out of ${subscriptions.length} subscribers` 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending test push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}