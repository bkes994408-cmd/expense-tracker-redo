import type { StateStorage } from 'zustand/middleware';

const fallbackMemoryStorage = new Map<string, string>();

function createMapStorage(map: Map<string, string>): StateStorage {
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

export function createSafeStorage(): StateStorage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return createMapStorage(fallbackMemoryStorage);
}

export function createMemoryStorage(seed: Record<string, string> = {}): StateStorage {
  return createMapStorage(new Map(Object.entries(seed)));
}

export const safeStorage = createSafeStorage();
