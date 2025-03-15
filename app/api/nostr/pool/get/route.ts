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
    const pool = new SimplePool()
    
    let result
    if (isSingleEvent) {
        result = await pool.get(relays, filter)
    } else {
        result = await pool.querySync(relays, filter)
    }
    return result
}

const fetchFromRelayCached = async (relays: string[], filter: any, isSingleEvent: boolean, tags: string[] = [], revalidateInSeconds?: number) => {
    const tag = generateSHA256Digest(`${JSON.stringify(relays)}:${JSON.stringify(filter)}:${isSingleEvent}`)
    const result = unstable_cache(
        async () => fetchFromRelay(relays, filter, isSingleEvent),
        [tag],
        {
            revalidate: revalidateInSeconds || 3600,
            tags: [tag, ...tags]
        }
    )
    return await result()
}
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const noCache = Boolean(searchParams.get('noCache'))
    const tags = searchParams.get('tags')?.split(",")
    const isSingleEvent = Boolean(searchParams.get('isSingleEvent'))
    const query = searchParams.get('query')
    const revalidateInSeconds = searchParams.get('revalidateInSeconds')
        ? parseInt(searchParams.get('revalidateInSeconds')!, 10)
        : undefined
    const publicCache = Boolean(searchParams.get('publicCache'))

    if (!query) {
        return new Response("Bad request", { status: 400 })
    }

    const decodedQuery = decodeURIComponent(query);
    const { relays, filter } = JSON.parse(decodedQuery)

    if (noCache) {
        revalidateTag(generateSHA256Digest(`${JSON.stringify(relays)}:${JSON.stringify(filter)}:${isSingleEvent}`))
    }
    const result = await fetchFromRelayCached(relays, filter, isSingleEvent, tags, revalidateInSeconds)
    console.log(generateSHA256Digest(`${JSON.stringify(relays)}:${JSON.stringify(filter)}:${isSingleEvent}`), filter)

    const headers: any = {}
    if (!noCache && publicCache) {
        const cacheTime = revalidateInSeconds || 3600
        headers['Cache-Control'] = `public, s-maxage=${cacheTime}, stale-while-revalidate=60`
    }
    return new Response(JSON.stringify(result), {
        status: 200,
        headers,
    });
}