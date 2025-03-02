import { generateSecretKey, getPublicKey } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { BunkerSigner, BunkerPointer, parseBunkerInput } from 'nostr-tools/nip46'
import { pool, DEFAULT_RELAYS } from './core'
import { addRemoteSignerProfileToLocalStorage, isRemoteSignerProfile } from '@/lib/utils'

// Interface for remote signer connection
export interface RemoteSignerConnection {
  clientSecretKey: Uint8Array;
  clientPubkey: string;
  bunkerPointer: BunkerPointer;
  userPubkey?: string;
  signer?: BunkerSigner;
  connected: boolean;
}

// Store active remote signer connections
const remoteSignerConnections: Map<string, RemoteSignerConnection> = new Map();

/**
 * Parse a bunker URL or NIP-05 identifier to get bunker connection details
 */
export async function parseRemoteSignerInput(input: string): Promise<BunkerPointer | null> {
  try {
    return await parseBunkerInput(input);
  } catch (error) {
    console.error('Failed to parse remote signer input:', error);
    return null;
  }
}

/**
 * Connect to a remote signer
 */
export async function connectToRemoteSigner(
  bunkerPointer: BunkerPointer,
  onAuthUrl?: (url: string) => void
): Promise<RemoteSignerConnection | null> {
  try {
    // Generate a new client key pair for this connection
    const clientSecretKey = generateSecretKey();
    const clientPubkey = getPublicKey(clientSecretKey);
    
    // Create a new BunkerSigner instance
    const signer = new BunkerSigner(
      clientSecretKey,
      bunkerPointer,
      {
        pool,
        onauth: onAuthUrl
      }
    );
    
    // Connect to the remote signer
    await signer.connect();
    
    // Get the user's public key from the remote signer
    const userPubkey = await signer.getPublicKey();
    
    // Create a connection object
    const connection: RemoteSignerConnection = {
      clientSecretKey,
      clientPubkey,
      bunkerPointer,
      userPubkey,
      signer,
      connected: true
    };
    
    // Store the connection
    remoteSignerConnections.set(userPubkey, connection);
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to remote signer:', error);
    return null;
  }
}

/**
 * Disconnect from a remote signer
 */
export async function disconnectFromRemoteSigner(userPubkey: string): Promise<boolean> {
  try {
    const connection = remoteSignerConnections.get(userPubkey);
    if (!connection) return false;
    
    if (connection.signer) {
      await connection.signer.close();
    }
    
    remoteSignerConnections.delete(userPubkey);
    return true;
  } catch (error) {
    console.error('Failed to disconnect from remote signer:', error);
    return false;
  }
}

/**
 * Get a remote signer connection by user pubkey
 */
export function getRemoteSignerConnection(userPubkey: string): RemoteSignerConnection | undefined {
  return remoteSignerConnections.get(userPubkey);
}

/**
 * Check if a user pubkey is connected to a remote signer
 */
export function isRemoteSignerConnected(userPubkey: string): boolean {
  return remoteSignerConnections.has(userPubkey);
}

/**
 * Sign an event using a remote signer
 */
export async function signEventWithRemoteSigner(
  userPubkey: string,
  event: any
): Promise<any> {
  const connection = remoteSignerConnections.get(userPubkey);
  if (!connection || !connection.signer) {
    throw new Error('No remote signer connection found for this pubkey');
  }
  
  return connection.signer.signEvent(event);
}

/**
 * Store remote signer connection details in user profiles
 */
export function saveRemoteSignerConnectionToLocalStorage(
  userPubkey: string,
  bunkerUrl: string,
  alias?: string
): void {
  // Add to user profiles system
  addRemoteSignerProfileToLocalStorage(userPubkey, bunkerUrl, true, alias);
}

/**
 * Get all remote signer connections from localStorage
 */
export function getRemoteSignerConnectionsFromLocalStorage(): Record<string, {
  bunkerUrl: string;
  alias?: string;
  timestamp: number;
}> {
  if (typeof window === 'undefined') return {};
  
  const connectionsJson = localStorage.getItem('remote_signer_connections');
  if (!connectionsJson) return {};
  
  try {
    return JSON.parse(connectionsJson);
  } catch (error) {
    console.error('Failed to parse remote signer connections from localStorage:', error);
    return {};
  }
}

/**
 * Remove a remote signer connection from localStorage
 */
export function removeRemoteSignerConnectionFromLocalStorage(userPubkey: string): void {
  if (typeof window === 'undefined') return;
  
  const connections = getRemoteSignerConnectionsFromLocalStorage();
  
  delete connections[userPubkey];
  
  localStorage.setItem('remote_signer_connections', JSON.stringify(connections));
}