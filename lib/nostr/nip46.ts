import { generateSecretKey, getPublicKey } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { BunkerSigner, BunkerPointer, parseBunkerInput } from 'nostr-tools/nip46'
import { pool, DEFAULT_RELAYS } from './core'
import {
  addRemoteSignerProfileToLocalStorage,
  isRemoteSignerProfile,
  getKeyPairFromLocalStorage
} from '@/lib/utils'

// Interface for remote signer connection
export interface RemoteSignerConnection {
  clientSecretKey: Uint8Array;
  clientPubkey: string;
  bunkerPointer: BunkerPointer;
  userPubkey?: string;
  signer?: BunkerSigner;
  connected: boolean;
}

// Store the active remote signer connection
let activeConnection: RemoteSignerConnection | null = null;
let activeUserPubkey: string | null = null;

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

// Function to log the current connection state
function logConnectionState(label: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    
    console.log(`📊 CONNECTION STATE [${label}]:`);
    console.log(`   Active connection: ${activeConnection ? 'Yes' : 'No'}`);
    
    if (activeConnection && activeUserPubkey) {
      console.log(`   Active user pubkey: ${activeUserPubkey.slice(0, 8)}...${activeUserPubkey.slice(-8)}`);
      console.log(`   Connected: ${activeConnection.connected}`);
    }
    
    console.log(`   LocalStorage connections (${Object.keys(storedConnections).length}):`);
    Object.entries(storedConnections).forEach(([pubkey, info]) => {
      const isActive = activeUserPubkey === pubkey;
      console.log(`     - ${pubkey.slice(0, 8)}...${pubkey.slice(-8)} ${isActive ? '(ACTIVE)' : ''} (URL: ${info.bunkerUrl?.slice(0, 20)}...)`);
    });
  } catch (error) {
    console.error('Error logging connection state:', error);
  }
}

// Initialize remote signer connection for the active profile
async function initializeActiveProfileConnection(retryCount = 0): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    console.log('🔄 Initializing remote signer connection for active profile...');
    
    // Get the active profile
    const activeProfile = getKeyPairFromLocalStorage();
    if (!activeProfile || !activeProfile.npub) {
      console.log('ℹ️ No active profile found.');
      return false;
    }
    
    // Check if the active profile is a remote signer
    if (!isRemoteSignerProfile(activeProfile.npub)) {
      console.log('ℹ️ Active profile is not a remote signer.');
      return false;
    }
    
    // Get the connection info for the active profile
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    
    // Normalize the pubkey to handle both raw pubkeys and npubs
    const { raw, npub } = normalizePubkey(activeProfile.npub);
    
    // Try to find connection info using both raw pubkey and npub
    const connectionInfo = storedConnections[activeProfile.npub] ||
                         storedConnections[raw] ||
                         storedConnections[npub];
    
    if (!connectionInfo || !connectionInfo.bunkerUrl) {
      console.error(`❌ No connection info found for active profile: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
      console.error(`   Tried original: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
      console.error(`   Tried raw: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
      console.error(`   Tried npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
      
      // Log all stored connections for debugging
      console.error(`   Available connections: ${Object.keys(storedConnections).map(k => k.slice(0, 8) + '...' + k.slice(-8)).join(', ')}`);
      return false;
    }
    
    console.log(`🔄 Connecting to remote signer for active profile: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
    console.log(`   Using bunker URL: ${connectionInfo.bunkerUrl}`);
    
    // Parse the bunker URL to get the bunker pointer
    const bunkerPointer = await parseRemoteSignerInput(connectionInfo.bunkerUrl);
    if (!bunkerPointer) {
      console.error(`❌ Failed to parse bunker URL for active profile: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
      return false;
    }
    
    // Check if we have stored client keys for this connection
    let clientSecretKey: Uint8Array | undefined;
    let clientPubkey: string | undefined;
    
    if (connectionInfo.clientSecretKeyHex && connectionInfo.clientPubkey) {
      try {
        // Convert hex string back to Uint8Array
        if (connectionInfo.clientSecretKeyHex) {
          const hexString = connectionInfo.clientSecretKeyHex; // Assign to a local variable to help TypeScript
          const bytes = new Uint8Array(hexString.length / 2);
          for (let i = 0; i < hexString.length; i += 2) {
            bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
          }
          clientSecretKey = bytes;
        } else {
          console.error(`   Client secret key hex is undefined`);
        }
        clientPubkey = connectionInfo.clientPubkey;
        console.log(`   Found stored client keys: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
      } catch (error) {
        console.error(`   Error parsing stored client keys: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Get the alias from the connection info if available
    const alias = connectionInfo.alias;
    
    // Connect to the remote signer with stored client keys if available
    const connection = await connectToRemoteSigner(
      bunkerPointer,
      (url) => {
        console.log(`🔐 Authentication required for remote signer: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
        console.log(`   Auth URL: ${url}`);
        
        // Store the auth URL for this pubkey
        pendingRemoteSignerAuths[activeProfile.npub] = {
          authUrl: url,
          timestamp: Date.now()
        };
        
        // Open the auth URL in a new tab
        if (typeof window !== 'undefined') {
          window.open(url, '_blank');
          console.log(`🌐 Opened auth URL in new tab for pubkey: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
        }
      },
      clientSecretKey,
      clientPubkey,
      alias // Pass the stored alias if available
    );
    
    if (connection) {
      console.log(`✅ Successfully connected to remote signer for active profile: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
      
      // Set as the active connection
      activeConnection = connection;
      activeUserPubkey = activeProfile.npub;
      
      // Remove from pending auths if it was there
      delete pendingRemoteSignerAuths[activeProfile.npub];
      
      // Log the final connection state
      logConnectionState('AFTER INIT');
      return true;
    } else {
      console.error(`❌ Failed to connect to remote signer for active profile: ${activeProfile.npub.slice(0, 8)}...${activeProfile.npub.slice(-8)}`);
      
      // Retry logic - if we haven't exceeded max retries
      if (retryCount < 2) {
        console.log(`🔄 Retrying connection (attempt ${retryCount + 1}/2)...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return initializeActiveProfileConnection(retryCount + 1);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize remote signer connection for active profile:', error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
    
    // Retry logic - if we haven't exceeded max retries
    if (retryCount < 2) {
      console.log(`🔄 Retrying connection after error (attempt ${retryCount + 1}/2)...`);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return initializeActiveProfileConnection(retryCount + 1);
    }
    
    return false;
  }
}

// Listen for profile changes
if (typeof window !== 'undefined') {
  // Initialize connection for active profile on module load
  setTimeout(async () => {
    const success = await initializeActiveProfileConnection();
    if (!success) {
      console.log('⚠️ Initial remote signer connection failed or not applicable');
    }
  }, 0);
  
  // Listen for storage events to detect profile changes
  window.addEventListener('storage', async (event) => {
    if (event.key === 'active_profile_npub') {
      console.log('🔄 Active profile changed, updating remote signer connection...');
      
      // Close the existing connection if there is one
      if (activeConnection && activeConnection.signer) {
        console.log(`🔄 Closing existing connection for: ${activeUserPubkey?.slice(0, 8)}...${activeUserPubkey?.slice(-8)}`);
        try {
          await activeConnection.signer.close();
        } catch (error) {
          console.error(`❌ Error closing existing connection: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Reset the active connection
      activeConnection = null;
      activeUserPubkey = null;
      
      // Initialize connection for the new active profile
      const success = await initializeActiveProfileConnection();
      if (!success) {
        console.log('⚠️ Remote signer connection failed or not applicable after profile change');
      }
    }
  });
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
  onAuthUrl?: (url: string) => void,
  existingClientSecretKey?: Uint8Array,
  existingClientPubkey?: string,
  alias?: string
): Promise<RemoteSignerConnection | null> {
  try {
    console.log(`🔄 Connecting to remote signer...`);
    logConnectionState('BEFORE CONNECT');
    console.log(`   Bunker pubkey: ${bunkerPointer.pubkey.slice(0, 8)}...${bunkerPointer.pubkey.slice(-8)}`);
    console.log(`   Relays: ${bunkerPointer.relays.join(', ')}`);
    
    // Check if we have stored client keys for this bunker
    const storedConnections = getRemoteSignerConnectionsFromLocalStorage();
    
    // Use provided client keys if available, otherwise generate new ones
    let clientSecretKey: Uint8Array;
    let clientPubkey: string;
    
    if (existingClientSecretKey && existingClientPubkey) {
      clientSecretKey = existingClientSecretKey;
      clientPubkey = existingClientPubkey;
      console.log(`   Using provided client keys: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
    } else {
      clientSecretKey = generateSecretKey();
      clientPubkey = getPublicKey(clientSecretKey);
      console.log(`   Generated new client pubkey: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
    }
    
    // Try to find existing client keys for this bunker
    let existingClientKeys = false;
    for (const [_, info] of Object.entries(storedConnections)) {
      if (info.bunkerUrl && info.bunkerUrl.includes(bunkerPointer.pubkey) &&
          info.clientSecretKeyHex && info.clientPubkey) {
        try {
          // Convert hex string back to Uint8Array
          if (info.clientSecretKeyHex) {
            const hexString = info.clientSecretKeyHex; // Assign to a local variable to help TypeScript
            const bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
              bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
            }
            clientSecretKey = bytes;
          } else {
            throw new Error('Client secret key hex is undefined');
          }
          clientPubkey = info.clientPubkey;
          existingClientKeys = true;
          console.log(`   Reusing existing client keys: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
          break;
        } catch (error) {
          console.error(`   Error reusing client keys: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // If existing keys were found, we've already set them above
    // If not, we're using the default new keys generated above
    if (existingClientKeys) {
      console.log(`   Using existing client keys for better persistence`);
    } else {
      console.log(`   No existing client keys found, using newly generated keys`);
    }
    
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
    
    // Connect to the remote signer with a timeout
    console.log(`   Connecting to remote signer with a 30-second timeout...`);
    try {
      await Promise.race([
        signer.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
        )
      ]);
      console.log(`✅ Successfully connected to remote signer`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error(`❌ Connection to remote signer timed out after 30 seconds`);
        throw new Error('Connection to remote signer timed out. Please try again later.');
      }
      throw error;
    }
    
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
    
    // Create a bunker URL from the bunker pointer
    // Format: bunker://<pubkey>?relay=<relay1>&relay=<relay2>&secret=<secret>
    const params = [];
    
    // Add relays
    for (const relay of bunkerPointer.relays) {
      params.push(`relay=${encodeURIComponent(relay)}`);
    }
    
    // // Add secret if present
    // if (bunkerPointer.secret) {
    //   console.log(`   Including secret parameter in bunker URL for authentication`);
    //   params.push(`secret=${encodeURIComponent(bunkerPointer.secret)}`);
    // }
    
    const paramsString = params.join('&');
    const bunkerUrl = `bunker://${bunkerPointer.pubkey}?${paramsString}`;
    
    // Log the final connection string
    console.log(`   Final connection string: ${bunkerUrl}`);
    
    // Save the connection details to localStorage for persistence
    if (typeof window !== 'undefined') {
      console.log(`   Saving connection to localStorage for persistence...`);
      const connections = getRemoteSignerConnectionsFromLocalStorage();
      
      // Normalize the pubkey to handle both raw pubkeys and npubs
      const { raw, npub } = normalizePubkey(userPubkey);
      
      // Store with both formats to ensure we can find it later
      // Convert Uint8Array to hex string for storage
      const bytesToHex = (bytes: Uint8Array) => {
        return Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };
      
      const connectionInfo = {
        bunkerUrl: bunkerUrl,
        timestamp: Date.now(),
        clientSecretKeyHex: bytesToHex(clientSecretKey),
        clientPubkey: clientPubkey
      };
      
      // Use the saveRemoteSignerConnectionToLocalStorage function to store the connection info
      // This will handle storing with multiple keys and also store the client keys
      saveRemoteSignerConnectionToLocalStorage(
        userPubkey,
        bunkerUrl,
        alias, // Pass the alias parameter
        clientSecretKey,
        clientPubkey
      );
      
      console.log(`✅ Successfully saved connection to localStorage with client keys for persistence`);
      console.log(`   User pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.log(`   Client pubkey: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
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
    
    // Check if this is the active connection
    if (activeUserPubkey === userPubkey || activeUserPubkey === raw || activeUserPubkey === npub) {
      if (activeConnection && activeConnection.signer) {
        console.log(`   Closing active signer connection...`);
        await activeConnection.signer.close();
        console.log(`✅ Successfully closed active signer connection`);
      }
      
      // Reset the active connection
      activeConnection = null;
      activeUserPubkey = null;
    } else {
      console.log(`ℹ️ No active connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.log(`   Active pubkey: ${activeUserPubkey?.slice(0, 8)}...${activeUserPubkey?.slice(-8)}`);
    }
    
    // Remove the connection details from localStorage
    console.log(`   Removing connection from localStorage...`);
    // Try to remove using all possible keys
    removeRemoteSignerConnectionFromLocalStorage(userPubkey);
    if (raw !== userPubkey) removeRemoteSignerConnectionFromLocalStorage(raw);
    if (npub !== userPubkey) removeRemoteSignerConnectionFromLocalStorage(npub);
    
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
  
  // Check if this is the active connection
  if (activeConnection && activeUserPubkey) {
    if (activeUserPubkey === userPubkey || activeUserPubkey === raw || activeUserPubkey === npub) {
      console.log(`   Found active connection for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      return activeConnection;
    }
  }
  
  console.log(`   No connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
  console.log(`   Active pubkey: ${activeUserPubkey?.slice(0, 8)}...${activeUserPubkey?.slice(-8)}`);
  return undefined;
}

/**
 * Check if a user pubkey is connected to a remote signer
 */
export function isRemoteSignerConnected(userPubkey: string): boolean {
  // Normalize the pubkey to handle both raw pubkeys and npubs
  const { raw, npub } = normalizePubkey(userPubkey);
  
  // Check if this is the active connection
  if (activeConnection && activeUserPubkey) {
    if (activeUserPubkey === userPubkey || activeUserPubkey === raw || activeUserPubkey === npub) {
      return activeConnection.connected;
    }
  }
  
  return false;
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
  
  // Normalize the pubkey to handle both raw pubkeys and npubs
  const { raw, npub } = normalizePubkey(userPubkey);
  
  // Check if this is the active connection
  if (!activeConnection || !activeConnection.signer ||
      (activeUserPubkey !== userPubkey && activeUserPubkey !== raw && activeUserPubkey !== npub)) {
    console.error(`❌ No active connection found for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    
    // Check if there's a pending authentication for this pubkey
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
      console.error(`❌ Connection info found in localStorage but not active for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      console.error(`   Bunker URL: ${connectionInfo.bunkerUrl}`);
      console.error(`   Timestamp: ${new Date(connectionInfo.timestamp).toISOString()}`);
      
      // Try to automatically reconnect instead of throwing an error
      console.log(`🔄 Attempting to automatically reconnect to remote signer...`);
      
      try {
        // Parse the bunker URL to get the bunker pointer
        if (!connectionInfo.bunkerUrl) {
          throw new Error('Bunker URL is undefined');
        }
        
        const bunkerPointer = await parseRemoteSignerInput(connectionInfo.bunkerUrl);
        if (!bunkerPointer) {
          throw new Error(`Failed to parse bunker URL: ${connectionInfo.bunkerUrl}`);
        }
        
        // Check if we have stored client keys for this connection
        let clientSecretKey: Uint8Array | undefined;
        let clientPubkey: string | undefined;
        
        if (connectionInfo.clientSecretKeyHex && connectionInfo.clientPubkey) {
          try {
            // Convert hex string back to Uint8Array
            if (connectionInfo.clientSecretKeyHex) {
              const hexString = connectionInfo.clientSecretKeyHex; // Assign to a local variable to help TypeScript
              const bytes = new Uint8Array(hexString.length / 2);
              for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
              }
              clientSecretKey = bytes;
            } else {
              throw new Error('Client secret key hex is undefined');
            }
            clientPubkey = connectionInfo.clientPubkey;
            console.log(`   Found stored client keys: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
          } catch (error) {
            console.error(`   Error parsing stored client keys: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        
        // Get the alias from the connection info if available
        const alias = connectionInfo.alias;
        
        // Connect to the remote signer
        const connection = await connectToRemoteSigner(
          bunkerPointer,
          (url) => {
            console.log(`🔐 Authentication required for remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            console.log(`   Auth URL: ${url}`);
            
            // Store the auth URL for this pubkey (we know userPubkey is defined here)
            pendingRemoteSignerAuths[userPubkey as string] = {
              authUrl: url,
              timestamp: Date.now()
            };
            
            // Open the auth URL in a new tab
            if (typeof window !== 'undefined') {
              window.open(url, '_blank');
              console.log(`🌐 Opened auth URL in new tab for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
            }
          },
          clientSecretKey,
          clientPubkey,
          alias // Pass the stored alias if available
        );
        
        if (connection) {
          console.log(`✅ Successfully reconnected to remote signer for pubkey: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
          
          // Set as the active connection
          activeConnection = connection;
          activeUserPubkey = userPubkey;
          
          // Now try to sign the event again
          if (activeConnection.signer) {
            return await activeConnection.signer.signEvent(event);
          } else {
            throw new Error('Remote signer connection is not properly initialized');
          }
        } else {
          throw new Error('Failed to reconnect to remote signer');
        }
      } catch (reconnectError) {
        console.error(`❌ Failed to automatically reconnect: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`);
        console.error(`   Try reconnecting manually by going to Settings > Manage Profiles`);
        
        // Check if there's a pending authentication for this pubkey
        const pendingAuth = pendingRemoteSignerAuths[userPubkey] ||
                          pendingRemoteSignerAuths[raw] ||
                          pendingRemoteSignerAuths[npub];
        
        if (pendingAuth) {
          throw new Error(`Remote signer requires authentication. Please complete the authentication process in the opened browser tab.`);
        } else {
          // Try to initialize the connection again
          try {
            await initializeActiveProfileConnection();
            
            // Check if connection was successful
            if (activeConnection && activeConnection.signer &&
                (activeUserPubkey === userPubkey || activeUserPubkey === raw || activeUserPubkey === npub)) {
              console.log(`✅ Successfully reconnected to remote signer after initialization`);
              return await activeConnection.signer.signEvent(event);
            }
          } catch (initError) {
            console.error(`❌ Failed to initialize connection: ${initError instanceof Error ? initError.message : String(initError)}`);
          }
          
          throw new Error('Remote signer is not currently connected. Please reconnect to the remote signer.');
        }
      }
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
    const result = await activeConnection.signer.signEvent(event);
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
  alias?: string,
  clientSecretKey?: Uint8Array,
  clientPubkey?: string
): void {
  // Add to user profiles system
  addRemoteSignerProfileToLocalStorage(userPubkey, bunkerUrl, true, alias);
  
  // Also store the connection info in localStorage with both raw pubkey and npub
  if (typeof window !== 'undefined') {
    const { raw, npub } = normalizePubkey(userPubkey);
    const connections = getRemoteSignerConnectionsFromLocalStorage();
    
    // Store with both formats to ensure we can find it later
    const connectionInfo: any = {
      bunkerUrl: bunkerUrl,
      timestamp: Date.now(),
      alias: alias
    };
    
    // If client keys are provided, store them too
    if (clientSecretKey && clientPubkey) {
      // Convert Uint8Array to hex string for storage
      const bytesToHex = (bytes: Uint8Array) => {
        return Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };
      
      connectionInfo.clientSecretKeyHex = bytesToHex(clientSecretKey);
      connectionInfo.clientPubkey = clientPubkey;
      console.log(`   Storing client keys for persistence: ${clientPubkey.slice(0, 8)}...${clientPubkey.slice(-8)}`);
    }
    
    // Store with original format
    connections[userPubkey] = connectionInfo;
    
    // Store with raw pubkey if different
    if (raw !== userPubkey) {
      connections[raw] = connectionInfo;
    }
    
    // Store with npub if different
    if (npub !== userPubkey && npub !== raw) {
      connections[npub] = connectionInfo;
    }
    
    localStorage.setItem('remote_signer_connections', JSON.stringify(connections));
    console.log(`✅ Stored remote signer connection with multiple keys for easier lookup`);
    console.log(`   Original: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    console.log(`   Raw: ${raw.slice(0, 8)}...${raw.slice(-8)}`);
    console.log(`   Npub: ${npub.slice(0, 8)}...${npub.slice(-8)}`);
  }
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
  clientSecretKeyHex?: string; // Hex-encoded secret key
  clientPubkey?: string;
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

/**
 * Manually switch the active remote signer connection
 * This function should be called when the active profile changes
 */
export async function switchActiveRemoteSignerConnection(userPubkey: string): Promise<boolean> {
  try {
    console.log(`🔄 Manually switching active remote signer connection to: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
    
    // Close the existing connection if there is one
    if (activeConnection && activeConnection.signer) {
      console.log(`   Closing existing connection for: ${activeUserPubkey?.slice(0, 8)}...${activeUserPubkey?.slice(-8)}`);
      await activeConnection.signer.close();
    }
    
    // Reset the active connection
    activeConnection = null;
    activeUserPubkey = null;
    
    // Check if the new profile is a remote signer
    if (!isRemoteSignerProfile(userPubkey)) {
      console.log(`ℹ️ New profile is not a remote signer: ${userPubkey.slice(0, 8)}...${userPubkey.slice(-8)}`);
      return false;
    }
    
    // Initialize connection for the new active profile
    const success = await initializeActiveProfileConnection();
    return success;
  } catch (error) {
    console.error(`❌ Failed to switch active remote signer connection: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}