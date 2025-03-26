import { nip98, getPublicKey, finalizeEvent, type Event, type EventTemplate } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { isRemoteSignerConnected, signEventWithRemoteSigner } from './nip46'
import { isRemoteSignerProfile } from '@/lib/utils'

/**
 * Client-side utility for generating NIP-98 authentication headers
 * 
 * This module provides functions to create NIP-98 authentication headers
 * for use with the protected API endpoints.
 * 
 * @see https://github.com/nostr-protocol/nips/blob/master/98.md
 */

/**
 * Generate a NIP-98 authentication header for a request
 * 
 * @param nsecOrNpub The nsec or npub to sign with
 * @param url The full URL of the request
 * @param method The HTTP method (GET, POST, etc.)
 * @param body The request body (for POST requests)
 * @returns The Authorization header value
 */
export async function generateNip98AuthHeader(
  nsecOrNpub: string,
  url: string,
  method: string,
  body?: any
): Promise<string> {
  try {
    let token: string

    // Check if the input is an npub (for remote signing)
    if (nsecOrNpub.startsWith('npub')) {
      const decodedNpub = nip19.decode(nsecOrNpub)
      if (decodedNpub.type !== 'npub') {
        throw new Error('Invalid npub')
      }
      const pubkey = decodedNpub.data as string
      
      // Check if this pubkey is connected to a remote signer
      if (isRemoteSignerConnected(pubkey)) {
        // For remote signing, we need to use the remote signer
        // Create a signing function that uses the remote signer
        const remoteSignFunction = async (e: EventTemplate) => {
          // Create a new object with the pubkey added
          const eventWithPubkey = {
            ...e,
            pubkey
          }
          
          // Use the remote signer to sign the event
          return await signEventWithRemoteSigner(pubkey, eventWithPubkey)
        }
        
        // Get the token using nip98.getToken
        token = await nip98.getToken(
          url,
          method,
          remoteSignFunction,
          false, // Don't include "Nostr " prefix, we'll add it later
          body ? JSON.parse(JSON.stringify(body)) : undefined // Convert body to a Record if provided
        )
        
      } else {
        // Check if this is a remote signer profile that's not currently connected
        if (isRemoteSignerProfile(pubkey)) {
          throw new Error('Remote signer is not currently connected. Please reconnect to the remote signer.')
        } else {
          throw new Error('No remote signer connected for this npub')
        }
      }
    } else {
      // Traditional nsec signing
      const decodedNsec = nip19.decode(nsecOrNpub)
      if (decodedNsec.type !== 'nsec') {
        throw new Error('Invalid nsec')
      }
      const sk = decodedNsec.data as Uint8Array
      
      // Create and sign the event using nip98.getToken
      // The function requires a signing function that takes an EventTemplate and returns a signed Event
      const signFunction = (e: EventTemplate) => {
        return finalizeEvent(e, sk)
      }
      
      token = await nip98.getToken(
        url,
        method,
        signFunction,
        false, // Don't include "Nostr " prefix, we'll add it later
        body ? JSON.parse(JSON.stringify(body)) : undefined // Convert body to a Record if provided
      )
      
    }
    
    // Return the Authorization header value
    return `Nostr ${token}`
  } catch (error) {
    console.error('Error generating NIP-98 authentication header:', error)
    throw error
  }
}

/**
 * Add NIP-98 authentication to a fetch request
 * 
 * @param nsecOrNpub The nsec or npub to sign with
 * @param url The full URL of the request
 * @param options The fetch options
 * @returns The fetch options with the Authorization header added
 */
export async function addNip98AuthToFetchOptions(
  nsecOrNpub: string,
  url: string,
  options: RequestInit = {}
): Promise<RequestInit> {
  url = url.replace(/localhost/g, "0.0.0.0")
  const method = options.method || 'GET'
  const body = options.body
  
  const authHeader = await generateNip98AuthHeader(
    nsecOrNpub,
    url,
    method,
    body
  )
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': authHeader
    }
  }
}