/**
 * A simple in-memory cache utility to speed up frequent GET requests
 * for static or semi-static data (Modules, Banners, Categories).
 */

const cache = new Map();

/**
 * Set a value in the cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlMinutes (Default 5 minutes)
 */
const setCache = (key, value, ttlMinutes = 5) => {
  const expiry = Date.now() + ttlMinutes * 60 * 1000;
  cache.set(key, { value, expiry });
};

/**
 * Get a value from the cache
 * @param {string} key 
 */
const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.value;
};

/**
 * Clear the entire cache (useful on updates)
 */
const clearCache = () => {
  cache.clear();
};

/**
 * Delete a specific key from the cache
 * @param {string} key 
 */
const deleteCache = (key) => {
  cache.delete(key);
};

module.exports = {
  setCache,
  getCache,
  clearCache,
  deleteCache
};
