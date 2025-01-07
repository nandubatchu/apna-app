import { revalidateTag, unstable_cache } from 'next/cache'
import { type NextRequest } from 'next/server'
import { SimplePool } from 'nostr-tools/pool'
import crypto from "crypto";
// import { useWebSocketImplementation } from 'nostr-tools/pool'
// or import { useWebSocketImplementation } from 'nostr-tools/relay' if you're using the Relay directly

// import WebSocket from 'ws'
// useWebSocketImplementation(WebSocket)
export const dynamic = 'force-dynamic';


function generateSHA256Digest(message: string) {
  // Create a SHA-256 hash of the message
  const hash = crypto.createHash('sha256');
  hash.update(message);
  return hash.digest('hex');
}


const fetchFromRelay = async (relays: string[], filter: any, isSingleEvent: boolean) => {
    return unstable_cache(
        async (relays, filter, isSingleEvent: boolean) => {
            const pool = new SimplePool()
    
            let result
            if (isSingleEvent) {
                result = await pool.get(relays, filter)
            } else {
                result = await pool.querySync(relays, filter)
            }
            return result
        },
        [relays, filter, isSingleEvent],
        {
            tags: [generateSHA256Digest(`${relays}:${filter}:${isSingleEvent}`)]
        }
    )
}
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const noCache = Boolean(searchParams.get('noCache'))
    const isSingleEvent = Boolean(searchParams.get('isSingleEvent'))
    const query = searchParams.get('query')

    if (!query) {
        return new Response("Bad request", { status: 400 })
    }

    const decodedQuery = decodeURIComponent(query);
    const { relays, filter } = JSON.parse(decodedQuery)

    if (noCache) {
        revalidateTag(generateSHA256Digest(`${relays}:${filter}:${isSingleEvent}`))
    }
    const result = await fetchFromRelay(relays, filter, isSingleEvent)

    const headers: any = {}
    if (!noCache) {
        // headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=60'
    }
    return new Response(JSON.stringify(result), {
        status: 200,
        headers,
    });
}