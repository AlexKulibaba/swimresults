import type { DeviceStorage } from "./storage";

const DATABASE = "swimresults";
const STORE = "device";

/** Device storage in the browser's IndexedDB, which holds a meet file's bytes without size trouble. */
export function indexedDbStorage(): DeviceStorage {
  const database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const store = (await database).transaction(STORE, mode).objectStore(STORE);
    return new Promise((resolve, reject) => {
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    get: (key) => run("readonly", (store) => store.get(key)),
    set: async (key, value) => void (await run("readwrite", (store) => store.put(value, key))),
    delete: async (key) => void (await run("readwrite", (store) => store.delete(key))),
  };
}
