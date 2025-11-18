import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * PageCacheContext - Production-ready page caching system
 * 
 * Features:
 * - In-memory caching with configurable TTL (Time To Live)
 * - Intelligent cache invalidation based on data changes
 * - Selective revalidation triggers
 * - Memory-efficient storage
 * - Cache hit/miss tracking for debugging
 */

const PageCacheContext = createContext(null);

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL (Time To Live) in milliseconds
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Page-specific TTL overrides
  PAGE_TTL: {
    home: 3 * 60 * 1000,        // 3 minutes - frequently updated
    training: 5 * 60 * 1000,    // 5 minutes
    mealplan: 5 * 60 * 1000,    // 5 minutes
    calendar: 10 * 60 * 1000,   // 10 minutes - less frequently updated
    profile: 10 * 60 * 1000,    // 10 minutes
  },
  
  // Maximum cache entries per page (prevent memory bloat)
  MAX_ENTRIES_PER_PAGE: 10,
  
  // Enable cache debugging
  DEBUG: __DEV__,
};

export function PageCacheProvider({ children }) {
  // Cache storage: { pageName: { key: { data, timestamp, ttl } } }
  const cacheRef = useRef({});
  
  // Cache statistics for debugging
  const statsRef = useRef({
    hits: 0,
    misses: 0,
    invalidations: 0,
  });

  /**
   * Get cached data for a page
   * @param {string} pageName - Name of the page (e.g., 'mealplan', 'training')
   * @param {string} key - Cache key (e.g., 'mealPlanData', 'workoutData')
   * @returns {object|null} - Cached data or null if expired/missing
   */
  const getCachedData = useCallback((pageName, key = 'default') => {
    const pageCache = cacheRef.current[pageName];
    if (!pageCache || !pageCache[key]) {
      statsRef.current.misses++;
      logDebug(`Cache MISS: ${pageName}/${key}`);
      return null;
    }

    const cached = pageCache[key];
    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is still valid
    if (age > cached.ttl) {
      // Cache expired
      delete pageCache[key];
      statsRef.current.misses++;
      logDebug(`Cache EXPIRED: ${pageName}/${key} (age: ${Math.round(age / 1000)}s)`);
      return null;
    }

    statsRef.current.hits++;
    logDebug(`Cache HIT: ${pageName}/${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.data;
  }, []);

  /**
   * Set cached data for a page
   * @param {string} pageName - Name of the page
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Optional custom TTL in milliseconds
   */
  const setCachedData = useCallback((pageName, key = 'default', data, ttl) => {
    if (!cacheRef.current[pageName]) {
      cacheRef.current[pageName] = {};
    }

    const pageCache = cacheRef.current[pageName];
    const cacheKeys = Object.keys(pageCache);

    // Enforce max entries limit (LRU - remove oldest)
    if (cacheKeys.length >= CACHE_CONFIG.MAX_ENTRIES_PER_PAGE) {
      const oldestKey = cacheKeys.reduce((oldest, current) => {
        return pageCache[current].timestamp < pageCache[oldest].timestamp ? current : oldest;
      }, cacheKeys[0]);
      delete pageCache[oldestKey];
      logDebug(`Cache evicted oldest entry: ${pageName}/${oldestKey}`);
    }

    const effectiveTTL = ttl || CACHE_CONFIG.PAGE_TTL[pageName] || CACHE_CONFIG.DEFAULT_TTL;

    pageCache[key] = {
      data,
      timestamp: Date.now(),
      ttl: effectiveTTL,
    };

    logDebug(`Cache SET: ${pageName}/${key} (TTL: ${Math.round(effectiveTTL / 1000)}s)`);
  }, []);

  /**
   * Invalidate cache for a specific page or key
   * @param {string} pageName - Name of the page
   * @param {string} key - Optional specific key to invalidate (null = all keys)
   */
  const invalidateCache = useCallback((pageName, key = null) => {
    if (!cacheRef.current[pageName]) {
      return;
    }

    if (key) {
      // Invalidate specific key
      delete cacheRef.current[pageName][key];
      logDebug(`Cache INVALIDATED: ${pageName}/${key}`);
    } else {
      // Invalidate entire page cache
      delete cacheRef.current[pageName];
      logDebug(`Cache INVALIDATED: ${pageName}/* (all keys)`);
    }

    statsRef.current.invalidations++;
  }, []);

  /**
   * Invalidate multiple pages at once (useful for cross-page updates)
   * @param {string[]} pageNames - Array of page names to invalidate
   */
  const invalidateMultiple = useCallback((pageNames) => {
    pageNames.forEach(pageName => invalidateCache(pageName));
    logDebug(`Cache INVALIDATED multiple: ${pageNames.join(', ')}`);
  }, [invalidateCache]);

  /**
   * Clear all cached data (nuclear option)
   */
  const clearAllCache = useCallback(() => {
    cacheRef.current = {};
    statsRef.current = { hits: 0, misses: 0, invalidations: 0 };
    logDebug('Cache CLEARED (all data)');
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    const total = statsRef.current.hits + statsRef.current.misses;
    const hitRate = total > 0 ? ((statsRef.current.hits / total) * 100).toFixed(2) : 0;
    
    return {
      ...statsRef.current,
      hitRate: `${hitRate}%`,
      cacheSize: Object.keys(cacheRef.current).length,
    };
  }, []);

  /**
   * Check if data is cached and valid
   */
  const isCached = useCallback((pageName, key = 'default') => {
    return getCachedData(pageName, key) !== null;
  }, [getCachedData]);

  // Debug logging helper
  const logDebug = (message) => {
    if (CACHE_CONFIG.DEBUG) {
      console.log(`[PageCache] ${message}`);
    }
  };

  const value = {
    getCachedData,
    setCachedData,
    invalidateCache,
    invalidateMultiple,
    clearAllCache,
    getCacheStats,
    isCached,
  };

  return (
    <PageCacheContext.Provider value={value}>
      {children}
    </PageCacheContext.Provider>
  );
}

/**
 * Hook to use page caching
 */
export function usePageCache() {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within PageCacheProvider');
  }
  return context;
}

/**
 * Higher-order hook for pages with automatic caching
 * @param {string} pageName - Name of the page
 * @param {function} loadDataFn - Async function to load data
 * @param {string} cacheKey - Cache key (default: 'default')
 * @returns {object} - { data, isLoading, error, refresh, isCached }
 */
export function useCachedPageData(pageName, loadDataFn, cacheKey = 'default') {
  const { getCachedData, setCachedData, invalidateCache } = usePageCache();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCachedData, setIsCachedData] = useState(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      // Try to get cached data first
      if (!forceRefresh) {
        const cached = getCachedData(pageName, cacheKey);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          setIsCachedData(true);
          return;
        }
      }

      // No cache or forced refresh - load fresh data
      setIsLoading(true);
      setIsCachedData(false);
      const freshData = await loadDataFn();
      
      // Cache the fresh data
      setCachedData(pageName, cacheKey, freshData);
      setData(freshData);
      setError(null);
    } catch (err) {
      console.error(`Error loading ${pageName} data:`, err);
      setError(err);
      
      // On error, try to use stale cache as fallback
      const staleCache = getCachedData(pageName, cacheKey);
      if (staleCache) {
        setData(staleCache);
        setIsCachedData(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageName, cacheKey, loadDataFn, getCachedData, setCachedData]);

  const refresh = useCallback(() => {
    invalidateCache(pageName, cacheKey);
    return loadData(true);
  }, [pageName, cacheKey, invalidateCache, loadData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    isCached: isCachedData,
    loadData,
  };
}
