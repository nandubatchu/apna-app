import { openDB } from 'idb';

async function ensureStore(storeName: string) {
  const db = await dbPromise;
  // if (!db.objectStoreNames.contains(storeName)) {
  //   const newDbPromise = openDB('apna-db', db.version + 1, {
  //     upgrade(newDb) {
  //       if (!newDb.objectStoreNames.contains(storeName)) {
  //         newDb.createObjectStore(storeName);
  //       }
  //     },
  //   });
  //   await newDbPromise;
  // }
}

const dbPromise = openDB('NostrEventsCacheDB', 1, {
  upgrade(db) {
    // version 1
    db.createObjectStore('replies');
    
    // db.createObjectStore('profiles');
    // db.createObjectStore('notes');
    // db.createObjectStore('contacts');
    // db.createObjectStore('reactions');
  },
});

export async function get(storeName: string, key: string) {
  await ensureStore(storeName);
  return (await dbPromise).get(storeName, key);
}

export async function set(storeName: string, key: string, val: any) {
  await ensureStore(storeName);
  return (await dbPromise).put(storeName, val, key);
}

export async function del(storeName: string, key: string) {
  await ensureStore(storeName);
  return (await dbPromise).delete(storeName, key);
}

export async function clear(storeName: string) {
  await ensureStore(storeName);
  return (await dbPromise).clear(storeName);
}

export async function keys(storeName: string) {
  await ensureStore(storeName);
  return (await dbPromise).getAllKeys(storeName);
}

/**
 * staleWhileRevalidate: Returns a cached value immediately and updates the cache with fresh data.
 * @param {string} storeName - The name of the object store.
 * @param {string} key - The key of the item to retrieve.
 * @param {() => Promise<any>} revalidateMethod - A method to fetch the fresh value.
 * @returns {Promise<any>} - The cached value, or undefined if not available.
 */
export async function staleWhileRevalidate(
  storeName: string,
  key: string,
  revalidateMethod: () => Promise<any>
) {
  // Ensure the store exists
  await ensureStore(storeName);

  // Get the stale (cached) value
  const cachedValue = await get(storeName, key);

  // return fresh value
  if (typeof cachedValue === "undefined") {
    console.log(`cache-miss: ${storeName}:${key}`)
    const freshValue = await revalidateMethod()
    await set(storeName, key, freshValue)
    return freshValue
  }

  // Fetch the fresh value and update the cache asynchronously
  revalidateMethod()
    .then(async (freshValue) => {
      if (freshValue !== undefined) {
        await set(storeName, key, freshValue);
      }
    })
    .catch((error) => {
      console.error("Error during revalidation:", error);
    });

  // Return the stale value immediately
  console.log(`cache-hit: ${storeName}:${key}`)
  return cachedValue;
}
