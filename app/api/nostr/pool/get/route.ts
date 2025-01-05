import { type NextRequest } from 'next/server'
import { SimplePool } from 'nostr-tools/pool'
// import { useWebSocketImplementation } from 'nostr-tools/pool'
// or import { useWebSocketImplementation } from 'nostr-tools/relay' if you're using the Relay directly

// import WebSocket from 'ws'
// useWebSocketImplementation(WebSocket)
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const noCache = Boolean(searchParams.get('noCache'))
    const filter = searchParams.get('filter')

    if (!filter) {
        return new Response("Bad request",{status:400})
    }

    const decodedQuery = decodeURIComponent(filter);
    const filterObj = JSON.parse(decodedQuery);

    // await new Promise((resolve) => {setTimeout(resolve, 5000)})
    const pool = new SimplePool()

    let relays = ["wss://relay.damus.io/"]

    // let event = await pool.get(relays, {
    //     ids: ['3fa47699cbed04c37f35aeb80e2cdccfb55078ac36d6c3d1aef267c97c086ed4'],
    // })
    let event = await pool.get(relays, filterObj)

    const headers: any = {}
    if (!noCache) {
        headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=60'
    }
    return new Response(JSON.stringify(event), {
        status: 200,
        headers,
    });
}