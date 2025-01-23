import type { AppDetails } from '@/lib/hooks/useApps';

type FavoriteApp = {
  id: string;
  timestamp: number;
  appData?: AppDetails;
};

class FavoritesDB {
  private static DB_NAME = 'apna-favorites';
  private static STORE_NAME = 'favorites';
  private static VERSION = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(FavoritesDB.DB_NAME, FavoritesDB.VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(FavoritesDB.STORE_NAME)) {
          db.createObjectStore(FavoritesDB.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async addFavorite(appId: string, appData?: AppDetails): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FavoritesDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FavoritesDB.STORE_NAME);
      
      const favorite: FavoriteApp = {
        id: appId,
        timestamp: Date.now(),
        appData
      };

      const request = store.put(favorite);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeFavorite(appId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FavoritesDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FavoritesDB.STORE_NAME);
      
      const request = store.delete(appId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFavorites(): Promise<FavoriteApp[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FavoritesDB.STORE_NAME], 'readonly');
      const store = transaction.objectStore(FavoritesDB.STORE_NAME);
      
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as FavoriteApp[]);
      };
    });
  }

  async isFavorite(appId: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FavoritesDB.STORE_NAME], 'readonly');
      const store = transaction.objectStore(FavoritesDB.STORE_NAME);
      
      const request = store.get(appId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(!!request.result);
    });
  }

  async updateAppData(appId: string, appData: AppDetails): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FavoritesDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FavoritesDB.STORE_NAME);
      
      const request = store.get(appId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          const favorite: FavoriteApp = {
            ...request.result,
            appData
          };
          store.put(favorite);
          resolve();
        }
      };
    });
  }
}

export const favoritesDB = new FavoritesDB();
export type { FavoriteApp };