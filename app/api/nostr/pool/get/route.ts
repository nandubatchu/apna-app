import { SimplePool } from 'nostr-tools/pool'
// import { useWebSocketImplementation } from 'nostr-tools/pool'
// or import { useWebSocketImplementation } from 'nostr-tools/relay' if you're using the Relay directly

// import WebSocket from 'ws'
// useWebSocketImplementation(WebSocket)

export async function GET() {
    await new Promise((resolve) => {setTimeout(resolve, 5000)})

    return new Response((new Date).toLocaleString(), {
        status: 200,
        headers: {
            'Cache-Control': 'max-age=2, s-max-age=4, stale-while-revalidate=2'
        },
    });
}