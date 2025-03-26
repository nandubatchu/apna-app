# Nostr NIP-98 Authentication

This directory contains the implementation of [NIP-98 HTTP Authentication](https://github.com/nostr-protocol/nips/blob/master/98.md) for the Apna App.

## Overview

NIP-98 is a Nostr Implementation Possibility that defines a standard for authenticating HTTP requests using Nostr keys. This allows clients to sign HTTP requests with their Nostr keys, providing a secure way to authenticate API requests without sharing secrets.

## Files

- `nip98Auth.ts`: Server-side middleware for validating NIP-98 authentication in Next.js API routes
- `nip98Client.ts`: Client-side utilities for generating NIP-98 authentication headers

## Protected Endpoints

The following API endpoints are protected with NIP-98 authentication:

- `/api/push/send`: Endpoint for sending push notifications to all subscribers
- `/api/push/test`: Endpoint for sending test push notifications

## How It Works

### Server-Side (API Routes)

1. The `validateNip98Auth` middleware in `nip98Auth.ts` validates the Nostr Authorization header
2. It uses `nip98.validateToken` to verify that the event is properly signed and matches the request URL and method
3. Optionally, it can verify that the pubkey is in a list of authorized pubkeys

```typescript
// Example usage in an API route
export async function POST(request: NextRequest) {
  // Validate NIP-98 authentication
  const authError = await validateNip98Auth(request)
  if (authError) {
    return authError
  }
  
  // Process the authenticated request
  // ...
}
```

### Client-Side

1. The `generateNip98AuthHeader` function in `nip98Client.ts` creates a NIP-98 authentication header using `nip98.getToken`
2. The `addNip98AuthToFetchOptions` function adds the header to fetch options
3. Both functions support traditional nsec signing and remote signing via NIP-46

```typescript
// Example usage in a client component
const sendNotification = async () => {
  const url = `${window.location.origin}/api/push/send`
  const body = { title, message }
  
  // Add NIP-98 authentication to the fetch options
  const options = await addNip98AuthToFetchOptions(nsecOrNpub, url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  // Make the authenticated request
  const response = await fetch(url, options)
  // ...
}
```

## Authorization

The middleware can restrict access to specific pubkeys for each route. The authorized pubkeys are defined in the `nip98Config.ts` file:

```typescript
// lib/nostr/nip98Config.ts
const nip98Config: Nip98Config = {
  authorizedPubkeys: {
    // Pubkeys authorized to send push notifications
    pushSend: [
      "pubkey1",
      "pubkey2"
    ],
    
    // Pubkeys authorized to send test push notifications
    pushTest: [
      "pubkey1",
      "pubkey3"
    ]
  }
};
```

To authorize a pubkey for a specific route, add it to the appropriate array in the config file.

## Components

The `PushNotificationAdmin` component in `components/molecules/PushNotificationAdmin.tsx` demonstrates how to use NIP-98 authentication to access the protected endpoints.