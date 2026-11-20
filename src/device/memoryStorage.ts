import type { DeviceStorage } from "./storage";

/** Device storage that lives only as long as the page; for tests. */
export function memoryStorage(): DeviceStorage {
  const values = new Map<string, unknown>();
  return {
    get: async (key) => values.get(key),
    set: async (key, value) => void values.set(key, value),
    delete: async (key) => void values.delete(key),
  };
}
