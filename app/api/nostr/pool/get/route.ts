import { SimplePool } from 'nostr-tools/pool'
// import { useWebSocketImplementation } from 'nostr-tools/pool'
// or import { useWebSocketImplementation } from 'nostr-tools/relay' if you're using the Relay directly

// import WebSocket from 'ws'
// useWebSocketImplementation(WebSocket)

export async function GET() {
    await new Promise((resolve) => {setTimeout(resolve, 5000)})
    const pool = new SimplePool()

    let relays = ["wss://relay.damus.io/"]

    let event = await pool.get(relays, {
        ids: ['3fa47699cbed04c37f35aeb80e2cdccfb55078ac36d6c3d1aef267c97c086ed4'],
    })
    return new Response(JSON.stringify(event), {
        status: 200,
        headers: {
            'Cache-Control': 'max-age=10',
            'CDN-Cache-Control': 'max-age=60',
            'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=120',
        },
    });
}