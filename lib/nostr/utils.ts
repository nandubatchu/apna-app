import * as nip19 from 'nostr-tools/nip19'

/**
 * Normalizes a note ID to its raw hexadecimal format
 * @param noteId - Note ID in any supported format (raw hex, note1, or nevent)
 * @returns Raw hexadecimal note ID
 */
export const normalizeNoteId = (noteId: string): string => {
  // Already in raw format
  if (/^[0-9a-f]{64}$/.test(noteId)) {
    return noteId
  }
  
  try {
    // Handle note1 format
    if (noteId.startsWith('note1')) {
      const decoded = nip19.decode(noteId)
      return decoded.data as string
    }
    
    // Handle nevent format
    if (noteId.startsWith('nevent')) {
      const decoded = nip19.decode(noteId)
      return (decoded.data as any).id as string
    }
    
    throw new Error(`Unsupported note ID format: ${noteId}`)
  } catch (error) {
    throw new Error(`Failed to decode note ID: ${noteId}. ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Normalizes a public key to its raw hexadecimal format
 * @param npub - Public key in any supported format (raw hex or npub)
 * @returns Raw hexadecimal public key
 */
export const normalizePublicKey = (npub: string): string => {
  // Already in raw format
  if (/^[0-9a-f]{64}$/.test(npub)) {
    return npub
  }
  
  try {
    // Handle npub format
    if (npub.startsWith('npub')) {
      const decoded = nip19.decode(npub)
      if (decoded.type !== 'npub') {
        throw new Error(`Invalid npub format: ${npub}`)
      }
      return decoded.data as string
    }
    
    throw new Error(`Unsupported public key format: ${npub}`)
  } catch (error) {
    throw new Error(`Failed to decode public key: ${npub}. ${error instanceof Error ? error.message : String(error)}`)
  }
}