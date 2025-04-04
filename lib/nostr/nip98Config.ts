/**
 * NIP-98 Authentication Configuration
 * 
 * This file contains the configuration for NIP-98 authentication,
 * including authorized pubkeys for different routes.
 */

export interface Nip98Config {
  /**
   * Authorized pubkeys for different routes
   */
  authorizedPubkeys: {
    /**
     * Pubkeys authorized to access the push/send endpoint
     */
    pushSend: string[];
    
    /**
     * Pubkeys authorized to access the push/test endpoint
     */
    pushTest: string[];
    
    /**
     * Add more route-specific pubkey lists as needed
     */
    // otherRoute: string[];
  };
}

/**
 * NIP-98 authentication configuration
 * 
 * Add pubkeys to the appropriate arrays to authorize them for specific routes.
 * For example, to authorize a pubkey for the push/send endpoint, add it to the
 * pushSend array.
 */
const nip98Config: Nip98Config = {
  authorizedPubkeys: {
    // Pubkeys authorized to send push notifications
    pushSend: [
      // Example: "7575b94fa81152fe529a4899d390294af142277154ce44036d50e2ad99d5c267"
      "7575b94fa81152fe529a4899d390294af142277154ce44036d50e2ad99d5c267",
    ],
    
    // Pubkeys authorized to send test push notifications
    pushTest: [
      // Example: "7575b94fa81152fe529a4899d390294af142277154ce44036d50e2ad99d5c267"
      "7575b94fa81152fe529a4899d390294af142277154ce44036d50e2ad99d5c267",
    ],
  }
};

export default nip98Config;