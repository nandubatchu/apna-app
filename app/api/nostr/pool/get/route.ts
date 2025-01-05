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
    const isSingleEvent = Boolean(searchParams.get('isSingleEvent'))
    const query = searchParams.get('query')

    if (!query) {
        return new Response("Bad request",{status:400})
    }

    const decodedQuery = decodeURIComponent(query);
    const { relays, filter } = JSON.parse(decodedQuery)

    const pool = new SimplePool()

    let result
    if (isSingleEvent) {
        result = await pool.get(relays, filter)
    } else {
        result = await pool.querySync(relays, filter)
    }

    const headers: any = {}
    if (!noCache) {
        headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=60'
    }
    return new Response(JSON.stringify(result), {
        status: 200,
        headers,
    });
}