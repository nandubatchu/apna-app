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

// Track pending remote signer authentications
const pendingRemoteSignerAuths: Record<string, {
  authUrl: string;
  timestamp: number;
}> = {};

// Function to normalize pubkeys (convert between raw pubkey and npub)
function normalizePubkey(pubkey: string): { raw: string; npub: string } {
  try {
    if (pubkey.startsWith('npub')) {
      // Convert npub to raw pubkey
      const decoded = nip19.decode(pubkey);
      const rawPubkey = decoded.data as string;
      return { raw: rawPubkey, npub: pubkey };
    } else {
      // Convert raw pubkey to npub
      const npub = nip19.npubEncode(pubkey);
      return { raw: pubkey, npub };
    }
  } catch (error) {
    console.error(`Error normalizing pubkey: ${pubkey}`, error);
    // Return the original as both if we can't convert
    return { raw: pubkey, npub: pubkey };
  }
}

// Function to log the current state of connections
function logConnectionState(label: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    const memoryConnections = Array.from(remoteSignerConnections.entries());
    
    console.log(`📊 CONNECTION STATE [${label}]:`);
    console.log(`   Memory connections (${memoryConnections.length}):`);
    memoryConnections.forEach(([pubkey, conn]) => {
      console.log(`     - ${pubkey.slice(0, 8)}...${pubkey.slice(-8)} (connected: ${conn.connected})`);
    });
    
    console.log(`   LocalStorage connections (${Object.keys(storedConnections).length}):`);
    Object.entries(storedConnections).forEach(([pubkey, info]) => {
      console.log(`     - ${pubkey.slice(0, 8)}...${pubkey.slice(-8)} (URL: ${info.bunkerUrl?.slice(0, 20)}...)`);
    });
  } catch (error) {
    console.error('Error logging connection state:', error);
  }
}

// Function to synchronize in-memory connections with localStorage
async function syncConnectionsWithLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('🔄 Synchronizing in-memory connections with localStorage...');
    
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    const memoryConnections = Array.from(remoteSignerConnections.entries());
    
    // Check for connections in localStorage but not in memory
    for (const [pubkey, info] of Object.entries(storedConnections)) {
      if (!remoteSignerConnections.has(pubkey) && info.bunkerUrl) {
        console.log(`   Found connection in localStorage but not in memory: ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`);
        
        try {
          // Try to reconnect
          const bunkerPointer = await parseRemoteSignerInput(info.bunkerUrl);
          if (bunkerPointer) {
            console.log(`   Attempting to reconnect: ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`);
            
            // Use a separate function to avoid callback issues
            connectToRemoteSigner(bunkerPointer, (url) => {
              console.log(`   Authentication required for reconnection: ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`);
              pendingRemoteSignerAuths[pubkey] = {
                authUrl: url,
                timestamp: Date.now()
              };
            }).catch(error => {
              console.error(`   Failed to reconnect: ${error.message}`);
            });
          }
        } catch (error) {
          console.error(`   Error reconnecting: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Check for connections in memory but not in localStorage
    for (const [pubkey, connection] of memoryConnections) {
      if (!storedConnections[pubkey]) {
        console.log(`   Found connection in memory but not in localStorage: ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`);
        
        // Create a bunker URL from the bunker pointer
        const bunkerPointer = connection.bunkerPointer;
        const relaysParam = bunkerPointer.relays.map(r => `relay=${encodeURIComponent(r)}`).join('&');
        const bunkerUrl = `bunker://${bunkerPointer.pubkey}?${relaysParam}`;
        
        // Save to localStorage
        const connections = getRemoteSignerConnectionsFromLocalStorage();
        connections[pubkey] = {
          bunkerUrl: bunkerUrl,
          timestamp: Date.now()
        };
        localStorage.setItem('remote_signer_connections', JSON.stringify(connections));
        console.log(`   Saved connection to localStorage: ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`);
      }
    }
    
    console.log('✅ Synchronization complete');
  } catch (error) {
    console.error('❌ Error synchronizing connections:', error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to periodically check and sync connections
function setupPeriodicSync() {
  if (typeof window === 'undefined') return;
  
  // Sync connections every 30 seconds
  const intervalId = setInterval(() => {
    console.log('🔄 Running periodic connection sync...');
    syncConnectionsWithLocalStorage();
  }, 30000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });
}

// Initialize remote signer connections from localStorage on module load
if (typeof window !== 'undefined') {
  // We need to defer this to ensure it runs after the module is fully loaded
  setTimeout(() => {
    try {
      console.log('🔄 Initializing remote signer connections from localStorage...');
      logConnectionState('BEFORE INIT');
      
      const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
      const connectionCount = Object.keys(storedConnections).length;
      
      if (connectionCount === 0) {
        console.log('ℹ️ No stored remote signer connections found.');
        return;
      }
      
      console.log(`🔑 Found ${connectionCount} stored remote signer connection(s). Attempting to reconnect...`);
      
      // For each stored connection, attempt to reconnect
      Object.entries(storedConnections).forEach(async ([userPubkey, connectionInfo]) => {
        console.log(`🔄 Attempting to reconnect to remote signer for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
        console.log(`   Using bunker URL: ${connectionInfo.bunkerUrl}`);
        
        try {
          // Parse the bunker URL to get the bunker pointer
          if (!connectionInfo.bunkerUrl) {
            console.error(`❌ Missing bunker URL for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            return;
          }
          
          const bunkerPointer = await parseRemoteSignerInput(connectionInfo.bunkerUrl);
          if (!bunkerPointer) {
            console.error(`❌ Failed to parse bunker URL for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            return;
          }
          
          console.log(`✅ Successfully parsed bunker URL for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
          console.log(`   Bunker pubkey: ${bunkerPointer.pubkey.slice(0, 8)}...${bunkerPointer.pubkey.slice(-8)}`);
          console.log(`   Relays: ${bunkerPointer.relays.join(', ')}`);
          
          // Reconnect to the remote signer
          console.log(`🔄 Connecting to remote signer for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
          
          connectToRemoteSigner(
            bunkerPointer,
            (url) => {
              console.log(`🔐 Authentication required for remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
              console.log(`   Auth URL: ${url}`);
              
              // Store the auth URL for this pubkey
              pendingRemoteSignerAuths[userPubkey] = {
                authUrl: url,
                timestamp: Date.now()
              };
              
              // Open the auth URL in a new tab
              window.open(url, '_blank');
              console.log(`🌐 Opened auth URL in new tab for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            }
          ).then(connection => {
            if (connection) {
              console.log(`✅ Successfully reconnected to remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
              // Remove from pending auths if it was there
              delete pendingRemoteSignerAuths[userPubkey];
            } else {
              console.error(`❌ Failed to reconnect to remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            }
          }).catch(error => {
            console.error(`❌ Error reconnecting to remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            console.error(`   Error details: ${error.message}`);
          });
        } catch (error) {
          console.error(`❌ Exception while reconnecting to remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
          console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
          console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize remote signer connections:', error);
      console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
    } finally {
      // Log the final state after initialization and sync connections
      setTimeout(() => {
        logConnectionState('AFTER INIT');
        syncConnectionsWithLocalStorage();
        setupPeriodicSync(); // Start periodic sync
      }, 1000); // Delay to allow async operations to complete
    }
  }, 0);
}

/**
 * Get pending remote signer authentications
 */
export function getPendingRemoteSignerAuths(): Record<string, {
  authUrl: string;
  timestamp: number;
}> {
  return pendingRemoteSignerAuths;
}

/**
 * Parse a bunker URL or NIP-05 identifier to get bunker connection details
 */
export async function parseRemoteSignerInput(input: string): Promise<BunkerPointer | null> {
  try {
    console.log(`🔄 Parsing remote signer input: ${input}`);
    
    // Check if the input is a valid bunker URL or NIP-05 identifier
    if (!input.startsWith('bunker://') && !input.includes('@')) {
      console.error(`❌ Invalid input format. Expected bunker:// URL or NIP-05 identifier, got: ${input}`);
      return null;
    }
    
    const result = await parseBunkerInput(input);
    
    if (result) {
      console.log(`✅ Successfully parsed remote signer input`);
      console.log(`   Bunker pubkey: ${result.pubkey.slice(0, 8)}...${result.pubkey.slice(-8)}`);
      console.log(`   Relays: ${result.relays.join(', ')}`);
    } else {
      console.error(`❌ Failed to parse remote signer input: null result`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Exception while parsing remote signer input:`, error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
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
    console.log(`🔄 Connecting to remote signer...`);
    logConnectionState('BEFORE CONNECT');
    console.log(`   Bunker pubkey: ${bunkerPointer.pubkey.slice(0, 8)}...${bunkerPointer.pubkey.slice(-8)}`);
    console.log(`   Relays: ${bunkerPointer.relays.join(', ')}`);
    
    // Generate a new client key pair for this connection
    const clientSecretKey = generateSecretKey();
    const clientPubkey = getPublicKey(clientSecretKey);
    console.log(`   Generated client pubkey: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
    
    // Create a new BunkerSigner instance
    console.log(`   Creating BunkerSigner instance...`);
    const signer = new BunkerSigner(
      clientSecretKey,
      bunkerPointer,
      {
        pool,
        onauth: (url: string) => {
          console.log(`🔐 Authentication required for remote signer`);
          console.log(`   Auth URL: ${url}`);
          
          // Open the auth URL in a new tab directly
          if (typeof window !== 'undefined') {
            window.open(url, '_blank');
            console.log(`🌐 Opened auth URL in new tab`);
          }
          
          // Also call the original onAuthUrl callback if provided
          if (onAuthUrl) {
            onAuthUrl(url);
            console.log(`   Called onAuthUrl callback`);
          }
        }
      }
    );
    
    // Connect to the remote signer
    console.log(`   Connecting to remote signer...`);
    await signer.connect();
    console.log(`✅ Successfully connected to remote signer`);
    
    // Get the user's public key from the remote signer
    console.log(`   Getting user's public key...`);
    const userPubkey = await signer.getPublicKey();
    console.log(`   User pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    
    // Create a connection object
    console.log(`   Creating connection object...`);
    const connection: RemoteSignerConnection = {
      clientSecretKey,
      clientPubkey,
      bunkerPointer,
      userPubkey,
      signer,
      connected: true
    };
    
    // Store the connection
    console.log(`   Storing connection in memory...`);
    remoteSignerConnections.set(userPubkey, connection);
    
    // Save the connection details to localStorage for persistence
    if (typeof window !== 'undefined') {
      console.log(`   Saving connection to localStorage for persistence...`);
      const connections = getRemoteSignerConnectionsFromLocalStorage();
      
      // Create a bunker URL from the bunker pointer
      // Format: bunker://<pubkey>?relay=<relay1>&relay=<relay2>...
      const relaysParam = bunkerPointer.relays.map(r => `relay=${encodeURIComponent(r)}`).join('&');
      const bunkerUrl = `bunker://${bunkerPointer.pubkey}?${relaysParam}`;
      console.log(`   Generated bunker URL: ${bunkerUrl}`);
      
      connections[userPubkey] = {
        bunkerUrl: bunkerUrl,
        timestamp: Date.now()
      };
      localStorage.setItem('remote_signer_connections', JSON.stringify(connections));
      console.log(`✅ Successfully saved connection to localStorage`);
    }
    
    console.log(`✅ Remote signer connection complete for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    logConnectionState('AFTER CONNECT');
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to remote signer:', error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
    return null;
  }
}

/**
 * Disconnect from a remote signer
 */
export async function disconnectFromRemoteSigner(userPubkey: string): Promise<boolean> {
  try {
    console.log(`🔄 Disconnecting from remote signer for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    logConnectionState('BEFORE DISCONNECT');
    
    // Normalize the pubkey to handle both raw pubkeys and npubs
    const { raw, npub } = normalizePubkey(userPubkey);
    
    // Try to get the connection using the raw pubkey
    let connection = remoteSignerConnections.get(raw);
    
    // If not found, try with the npub
    if (!connection) {
      connection = remoteSignerConnections.get(npub);
    }
    
    // If still not found, try to find it by iterating through all connections
    let foundKey: string | null = null;
    if (!connection) {
      for (const [key, conn] of Array.from(remoteSignerConnections.entries())) {
        const normalized = normalizePubkey(key);
        if (normalized.raw === raw || normalized.npub === npub) {
          connection = conn;
          foundKey = key;
          break;
        }
      }
    }
    
    if (!connection) {
      console.log(`ℹ️ No active connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.log(`   Tried raw: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
      console.log(`   Tried npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
      return false;
    }
    
    if (connection.signer) {
      console.log(`   Closing signer connection...`);
      await connection.signer.close();
      console.log(`✅ Successfully closed signer connection`);
    }
    
    console.log(`   Removing connection from memory...`);
    // Use the correct key to delete from the Map
    if (foundKey) {
      remoteSignerConnections.delete(foundKey);
      console.log(`   Deleted connection with key: ${foundKey.slice(0, 8)}...${foundKey.slice(-8)}`);
    } else if (connection.userPubkey) {
      remoteSignerConnections.delete(connection.userPubkey);
      console.log(`   Deleted connection with userPubkey: ${connection.userPubkey.slice(0, 8)}...${connection.userPubkey.slice(-8)}`);
    } else {
      // Fallback to the original pubkey
      remoteSignerConnections.delete(userPubkey);
      console.log(`   Deleted connection with original pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    }
    
    // Remove the connection details from localStorage
    console.log(`   Removing connection from localStorage...`);
    // Try to remove using all possible keys
    removeRemoteSignerConnectionFromLocalStorage(userPubkey);
    if (raw !== userPubkey) removeRemoteSignerConnectionFromLocalStorage(raw);
    if (npub !== userPubkey) removeRemoteSignerConnectionFromLocalStorage(npub);
    if (connection.userPubkey && connection.userPubkey !== userPubkey) {
      removeRemoteSignerConnectionFromLocalStorage(connection.userPubkey);
    }
    
    console.log(`✅ Successfully disconnected from remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    logConnectionState('AFTER DISCONNECT');
    return true;
  } catch (error) {
    console.error(`❌ Failed to disconnect from remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
    return false;
  }
}

/**
 * Get a remote signer connection by user pubkey
 */
export function getRemoteSignerConnection(userPubkey: string): RemoteSignerConnection | undefined {
  // Normalize the pubkey to handle both raw pubkeys and npubs
  const { raw, npub } = normalizePubkey(userPubkey);
  
  // Try to get the connection using the raw pubkey
  let connection = remoteSignerConnections.get(raw);
  if (connection) {
    console.log(`   Found connection using raw pubkey: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
    return connection;
  }
  
  // If not found, try with the npub
  connection = remoteSignerConnections.get(npub);
  if (connection) {
    console.log(`   Found connection using npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
    return connection;
  }
  
  // If still not found, try to find it by iterating through all connections
  for (const [key, conn] of Array.from(remoteSignerConnections.entries())) {
    const normalized = normalizePubkey(key);
    if (normalized.raw === raw || normalized.npub === npub) {
      console.log(`   Found connection using key: ${key.slice(0, 8)}...${key.slice(-8)}`);
      return conn;
    }
  }
  
  console.log(`   No connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
  console.log(`   Tried raw: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
  console.log(`   Tried npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
  return undefined;
}

/**
 * Check if a user pubkey is connected to a remote signer
 */
export function isRemoteSignerConnected(userPubkey: string): boolean {
  return getRemoteSignerConnection(userPubkey) !== undefined;
}

/**
 * Sign an event using a remote signer
 */
export async function signEventWithRemoteSigner(
  userPubkey: string,
  event: any
): Promise<any> {
  console.log(`🔄 Attempting to sign event with remote signer for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
  logConnectionState('BEFORE SIGN');
  
  // Use the normalized lookup function to handle both raw pubkeys and npubs
  const connection = getRemoteSignerConnection(userPubkey);
  if (!connection || !connection.signer) {
    console.error(`❌ No active connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    
    // Check if there's a pending authentication for this pubkey
    // Try with original pubkey, raw pubkey, and npub
    const { raw, npub } = normalizePubkey(userPubkey);
    const pendingAuth = pendingRemoteSignerAuths[userPubkey] ||
                        pendingRemoteSignerAuths[raw] ||
                        pendingRemoteSignerAuths[npub];
    
    if (pendingAuth) {
      console.error(`❌ Authentication required for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.error(`   Auth URL: ${pendingAuth.authUrl}`);
      console.error(`   Timestamp: ${new Date(pendingAuth.timestamp).toISOString()}`);
      throw new Error('Remote signer requires authentication. Please complete the authentication process in the opened browser tab.');
    }
    
    // Try to reconnect to the remote signer
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    
    // Check for connection info using all possible keys
    const connectionInfo = storedConnections[userPubkey] ||
                          storedConnections[raw] ||
                          storedConnections[npub];
    
    if (connectionInfo) {
      console.error(`❌ Connection info found in localStorage but not in memory for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.error(`   Bunker URL: ${connectionInfo.bunkerUrl}`);
      console.error(`   Timestamp: ${new Date(connectionInfo.timestamp).toISOString()}`);
      console.error(`   Try reconnecting by going to Settings > Manage Profiles`);
      throw new Error('Remote signer is not currently connected. Please reconnect to the remote signer.');
    } else {
      console.error(`❌ No connection info found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.error(`   Tried original: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.error(`   Tried raw: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
      console.error(`   Tried npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
      throw new Error('No remote signer connection found for this pubkey');
    }
  }
  
  try {
    console.log(`   Signing event with remote signer...`);
    const result = await connection.signer.signEvent(event);
    console.log(`✅ Successfully signed event with remote signer`);
    return result;
  } catch (error) {
    console.error(`❌ Error signing event with remote signer:`, error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    
    // If the error is related to authentication, try to reconnect
    if (error instanceof Error && error.message.includes('auth')) {
      console.error(`❌ Authentication error detected. Reconnection required.`);
      throw new Error('Remote signer requires re-authentication. Please reconnect to the remote signer.');
    }
    
    throw error;
  }
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
  bunkerUrl?: string;
  bunkerPointer?: {
    pubkey: string;
    relays: string[];
    secret: string | null;
  };
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
  
  // Try to normalize the pubkey to handle both raw pubkeys and npubs
  try {
    const { raw, npub } = normalizePubkey(userPubkey);
    
    // Delete using all possible keys
    if (connections[userPubkey]) {
      console.log(`   Removed connection from localStorage using original key: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      delete connections[userPubkey];
    }
    
    if (raw !== userPubkey && connections[raw]) {
      console.log(`   Removed connection from localStorage using raw key: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
      delete connections[raw];
    }
    
    if (npub !== userPubkey && connections[npub]) {
      console.log(`   Removed connection from localStorage using npub key: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
      delete connections[npub];
    }
  } catch (error) {
    // If normalization fails, just delete using the original key
    console.error(`   Error normalizing pubkey for removal: ${error instanceof Error ? error.message : String(error)}`);
    delete connections[userPubkey];
  }
  
  localStorage.setItem('remote_signer_connections', JSON.stringify(connections));
}