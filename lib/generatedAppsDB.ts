import { openDB } from 'idb';

export interface GeneratedApp {
  id: string;
  name: string;
  htmlContent: string;
  prompt: string;
  createdAt: number;
  updatedAt: number;
  icon?: string;
}

class GeneratedAppsDB {
  private static DB_NAME = 'apna-generated-apps';
  private static STORE_NAME = 'apps';
  private static VERSION = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(GeneratedAppsDB.DB_NAME, GeneratedAppsDB.VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(GeneratedAppsDB.STORE_NAME)) {
          db.createObjectStore(GeneratedAppsDB.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async addApp(app: GeneratedApp): Promise<string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GeneratedAppsDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(GeneratedAppsDB.STORE_NAME);
      
      const request = store.put(app);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(app.id);
    });
  }

  async getApp(id: string): Promise<GeneratedApp | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GeneratedAppsDB.STORE_NAME], 'readonly');
      const store = transaction.objectStore(GeneratedAppsDB.STORE_NAME);
      
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as GeneratedApp | undefined);
    });
  }

  async getAllApps(): Promise<GeneratedApp[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GeneratedAppsDB.STORE_NAME], 'readonly');
      const store = transaction.objectStore(GeneratedAppsDB.STORE_NAME);
      
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Sort by updatedAt in descending order (newest first)
        const apps = request.result as GeneratedApp[];
        apps.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(apps);
      };
    });
  }

  async updateApp(id: string, updates: Partial<Omit<GeneratedApp, 'id' | 'createdAt'>>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GeneratedAppsDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(GeneratedAppsDB.STORE_NAME);
      
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          const app: GeneratedApp = {
            ...request.result,
            ...updates,
            updatedAt: Date.now()
          };
          store.put(app);
          resolve();
        } else {
          reject(new Error(`App with id ${id} not found`));
        }
      };
    });
  }

  async deleteApp(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GeneratedAppsDB.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(GeneratedAppsDB.STORE_NAME);
      
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const generatedAppsDB = new GeneratedAppsDB();