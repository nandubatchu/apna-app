'use client'

import { useEffect } from 'react'
import { getKeyPairFromLocalStorage } from '@/lib/utils'

export function ManifestHandler() {
  useEffect(() => {
    // Remove any existing manifest link
    const existingLink = document.querySelector('link[rel="manifest"]')
    if (existingLink) {
      existingLink.remove()
    }

    // Get pubkey from localStorage
    const keyPair = getKeyPairFromLocalStorage()
    
    // Create and append new manifest link
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = keyPair?.npub 
      ? `/api/manifest?pubkey=${encodeURIComponent(keyPair.npub)}`
      : '/api/manifest'
    
    document.head.appendChild(link)

    // Cleanup on unmount
    return () => {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        manifestLink.remove()
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  return null
}