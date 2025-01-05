import { SimplePool } from 'nostr-tools/pool'
// import { useWebSocketImplementation } from 'nostr-tools/pool'
// or import { useWebSocketImplementation } from 'nostr-tools/relay' if you're using the Relay directly

// import WebSocket from 'ws'
// useWebSocketImplementation(WebSocket)
export const dynamic = 'force-dynamic';
export async function GET() {
    await new Promise((resolve) => {setTimeout(resolve, 5000)})
    // const pool = new SimplePool()

    // let relays = ["wss://relay.damus.io/"]

    // let event = await pool.get(relays, {
    //     ids: ['3fa47699cbed04c37f35aeb80e2cdccfb55078ac36d6c3d1aef267c97c086ed4'],
    // })
    return new Response((new Date).toLocaleString(), {
        status: 200,
        headers: {
            'Cache-Control': 'max-age=10, s-maxage=20, stale-while-revalidate=10'
        },
    });
}