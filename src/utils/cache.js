// Simple in-memory cache with TTL
// Key: string, Value: { data: any, expires: number }
const store = new Map();

export const getCache = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

export const setCache = (key, data, ttlMs) => {
  store.set(key, { data, expires: Date.now() + ttlMs });
};

export const clearCacheKey = (key) => store.delete(key);
export const clearAllCache = () => store.clear();
