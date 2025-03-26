import { nip98 } from 'nostr-tools'
import { NextRequest, NextResponse } from 'next/server'

/**
 * NIP-98: HTTP Auth middleware for Next.js API routes
 *
 * This middleware validates NIP-98 authentication for HTTP requests.
 * NIP-98 allows clients to sign HTTP requests with their Nostr keys.
 *
 * @see https://github.com/nostr-protocol/nips/blob/master/98.md
 */

/**
 * Middleware to validate NIP-98 authentication
 *
 * @param request The Next.js request object
 * @param authorizedPubkeys Optional array of pubkeys that are authorized to access this route
 * @returns A NextResponse if authentication fails, or null if authentication succeeds
 */
export async function validateNip98Auth(
  request: NextRequest,
  authorizedPubkeys?: string[]
): Promise<NextResponse | null> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Nostr ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Nostr Authorization header' },
        { status: 401 }
      )
    }
    
    // Extract the event JSON from the Authorization header
    const token = authHeader.slice(6) // Remove 'Nostr ' prefix
    
    // Validate the NIP-98 event
    const url = new URL(request.url)
    const method = request.method
    
    // Validate the token
    const validationResult = await nip98.validateToken(
      token,
      url.toString(),
      method
    )
    
    if (!validationResult) {
      return NextResponse.json(
        { error: 'NIP-98 validation failed' },
        { status: 401 }
      )
    }
    
    // Check if the pubkey is authorized (if authorizedPubkeys is provided)
    if (authorizedPubkeys && authorizedPubkeys.length > 0) {
      const eventObj = await nip98.unpackEventFromToken(token)
      const pubkey = eventObj.pubkey
      
      if (!authorizedPubkeys.includes(pubkey)) {
        return NextResponse.json(
          { error: 'Unauthorized pubkey' },
          { status: 403 }
        )
      }
    }
    
    // Authentication successful
    return null
    
  } catch (error) {
    console.error('Error validating NIP-98 authentication:', error)
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    )
  }
}