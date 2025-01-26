'use client'

import { useEffect, useState } from 'react'
import { getKeyPairFromLocalStorage } from '@/lib/utils'
import { favoritesDB } from '@/lib/favoritesDB'
import type { FavoriteApp } from '@/lib/favoritesDB'

export function ManifestHandler() {
  const [manifestUrl, setManifestUrl] = useState<string>('/api/manifest')

  const updateManifestUrl = async () => {
    const keyPair = getKeyPairFromLocalStorage()
    const favorites = await favoritesDB.getFavorites()
    
    const params = new URLSearchParams()
    
    if (keyPair?.npub) {
      params.set('pubkey', keyPair.npub)
    }
    
    if (favorites.length > 0) {
      const favoritesList = favorites
        .filter(fav => fav.appData) // Only include favorites with appData
        .map(fav => ({
          name: fav.appData!.appName,
          appUrl: fav.appData!.appURL,
          appId: fav.id
        }))
      params.set('favorites', JSON.stringify(favoritesList))
    }
    
    const newUrl = params.toString() ? `/api/manifest?${params.toString()}` : '/api/manifest'
    setManifestUrl(newUrl)

    // Update manifest link
    const existingLink = document.querySelector('link[rel="manifest"]')
    if (existingLink) {
      existingLink.remove()
    }
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = newUrl
    document.head.appendChild(link)
  }

  useEffect(() => {
    // Initial update
    updateManifestUrl()

    // Set up IndexedDB change monitoring
    const dbName = 'apna-favorites'
    const request = indexedDB.open(dbName)
    
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        updateManifestUrl()
      }
    }

    // Poll for changes every 5 seconds as IndexedDB doesn't have native change events
    const interval = setInterval(updateManifestUrl, 5000)

    return () => {
      clearInterval(interval)
      const existingLink = document.querySelector('link[rel="manifest"]')
      if (existingLink) {
        existingLink.remove()
      }
    }
  }, [])

  return null
}