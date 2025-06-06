// Re-export everything from api.ts
export * from './api'

// Re-export the new API extensions
export * from './api-extensions'

// Re-export types and utilities that might be needed by consumers
export type { Filter, Event as NostrEvent } from 'nostr-tools'
export { DEFAULT_RELAYS } from './core'