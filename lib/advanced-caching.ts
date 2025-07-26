import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { AdvancedCache, apiCache, uiCache, dataCache, cacheUtils } from "./caching";

// Hook for caching expensive computations
export function useCachedComputation<T>(
  key: string,
  computation: () => T,
  dependencies: unknown[],
  ttl?: number
): T {
  return useMemo(() => {
    const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
    return cacheUtils.cachedComputation(cacheKey, computation, ttl);
  }, dependencies);
}

// Hook for caching API calls
export function useCachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  dependencies: unknown[],
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheKey = useMemo(() => `${key}-${JSON.stringify(dependencies)}`, dependencies);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await cacheUtils.cachedApiCall(cacheKey, apiCall, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, apiCall, ttl]);

  const refetch = useCallback(() => {
    apiCache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for caching search results
export function useCachedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  ttl: number = 2 * 60 * 1000
): T[] {
  return useCachedComputation(
    'search',
    () => {
      if (!searchTerm.trim()) return items;

      const searchLower = searchTerm.toLowerCase();
      return items.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    },
    [items, searchTerm, searchFields.join(',')],
    ttl
  );
}

// Hook for caching filtered results
export function useCachedFilter<T>(
  items: T[],
  filterValue: string,
  filterField: keyof T,
  ttl: number = 1 * 60 * 1000
): T[] {
  return useCachedComputation(
    'filter',
    () => {
      if (filterValue === "all") return items;

      return items.filter((item) => {
        const fieldValue = item[filterField];
        return String(fieldValue) === filterValue;
      });
    },
    [items, filterValue, String(filterField)],
    ttl
  );
}

// Hook for caching sorted results
export function useCachedSort<T>(
  items: T[],
  sortBy: keyof T | null,
  sortOrder: "asc" | "desc",
  ttl: number = 1 * 60 * 1000
): T[] {
  return useCachedComputation(
    'sort',
    () => {
      if (!sortBy) return items;

      return [...items].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    },
    [items, String(sortBy), sortOrder],
    ttl
  );
}

// Hook for caching statistics
export function useCachedStats<T, R>(
  items: T[],
  statsCalculator: (items: T[]) => R,
  ttl: number = 5 * 60 * 1000
): R {
  return useCachedComputation(
    'stats',
    () => statsCalculator(items),
    [items.length, items.length > 0 ? 'has-items' : 'empty'],
    ttl
  );
}

// Hook for caching grouped data
export function useCachedGroup<T>(
  items: T[],
  groupBy: keyof T,
  ttl: number = 2 * 60 * 1000
): Record<string, T[]> {
  return useCachedComputation(
    'group',
    () => {
      const groups: Record<string, T[]> = {};

      items.forEach((item) => {
        const key = String(item[groupBy]);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });

      return groups;
    },
    [items, String(groupBy)],
    ttl
  );
}

// Hook for caching paginated data
export function useCachedPagination<T>(
  items: T[],
  page: number,
  pageSize: number,
  ttl: number = 1 * 60 * 1000
): { items: T[]; totalPages: number; totalItems: number } {
  return useCachedComputation(
    'pagination',
    () => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = items.slice(startIndex, endIndex);
      const totalPages = Math.ceil(items.length / pageSize);

      return {
        items: paginatedItems,
        totalPages,
        totalItems: items.length,
      };
    },
    [items, page, pageSize],
    ttl
  );
}

// Hook for caching with automatic invalidation
export function useCachedWithInvalidation<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: unknown[],
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null; invalidate: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheKey = useMemo(() => `${key}-${JSON.stringify(dependencies)}`, dependencies);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await cacheUtils.cachedDataWithRefresh(cacheKey, fetcher, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetcher, ttl]);

  const invalidate = useCallback(() => {
    dataCache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, invalidate };
}

// Hook for caching multiple related data
export function useCachedMultiple<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  fetchers: Record<keyof T, () => Promise<T[keyof T]>>,
  ttl?: number
): { data: Partial<T>; loading: boolean; errors: Partial<Record<keyof T, Error>>; refetch: (key?: keyof T) => void } {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof T, Error>>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const cacheKey = `multiple-${String(key)}`;
        return {
          key,
          data: await cacheUtils.cachedApiCall(cacheKey, fetchers[key], ttl)
        };
      })
    );

    const newData: Partial<T> = {};
    const newErrors: Partial<Record<keyof T, Error>> = {};

    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') {
        newData[key] = result.value.data;
      } else {
        newErrors[key] = result.reason instanceof Error ? result.reason : new Error('Unknown error');
      }
    });

    setData(newData);
    setErrors(newErrors);
    setLoading(false);
  }, [keys, fetchers, ttl]);

  const refetch = useCallback((specificKey?: keyof T) => {
    if (specificKey) {
      const cacheKey = `multiple-${String(specificKey)}`;
      apiCache.delete(cacheKey);
    } else {
      keys.forEach(key => {
        const cacheKey = `multiple-${String(key)}`;
        apiCache.delete(cacheKey);
      });
    }
    fetchAll();
  }, [keys, fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, errors, refetch };
}

// Hook for caching with optimistic updates
export function useCachedOptimistic<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: unknown[],
  ttl?: number
): { 
  data: T | null; 
  loading: boolean; 
  error: Error | null; 
  updateOptimistically: (updater: (current: T) => T) => void;
  commitUpdate: () => void;
  rollbackUpdate: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [originalData, setOriginalData] = useState<T | null>(null);
  const cacheKey = useMemo(() => `${key}-${JSON.stringify(dependencies)}`, dependencies);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await cacheUtils.cachedApiCall(cacheKey, fetcher, ttl);
      setData(result);
      setOriginalData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetcher, ttl]);

  const updateOptimistically = useCallback((updater: (current: T) => T) => {
    if (data) {
      const updated = updater(data);
      setOptimisticData(updated);
      setData(updated);
    }
  }, [data]);

  const commitUpdate = useCallback(() => {
    if (optimisticData) {
      apiCache.set(cacheKey, optimisticData, ttl);
      setOriginalData(optimisticData);
      setOptimisticData(null);
    }
  }, [optimisticData, cacheKey, ttl]);

  const rollbackUpdate = useCallback(() => {
    if (originalData) {
      setData(originalData);
      setOptimisticData(null);
    }
  }, [originalData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    updateOptimistically, 
    commitUpdate, 
    rollbackUpdate 
  };
}

// Cache management utilities
export const cacheManagement = {
  // Invalidate all caches
  clearAll: () => cacheUtils.clearAll(),

  // Invalidate specific cache by pattern
  invalidateByPattern: (pattern: string) => cacheUtils.invalidateByPattern(pattern),

  // Get cache statistics
  getStats: () => cacheUtils.getAllStats(),

  // Preload data into cache
  preload: async <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
    const result = await fetcher();
    apiCache.set(key, result, ttl);
    return result;
  },

  // Warm up cache with multiple items
  warmUp: async <T extends Record<string, unknown>>(
    items: Record<keyof T, { key: string; fetcher: () => Promise<T[keyof T]>; ttl?: number }>
  ) => {
    const promises = Object.entries(items).map(async ([_, item]) => {
      const result = await item.fetcher();
      apiCache.set(item.key, result, item.ttl);
      return result;
    });

    return Promise.all(promises);
  },
};

export default {
  useCachedComputation,
  useCachedApiCall,
  useCachedSearch,
  useCachedFilter,
  useCachedSort,
  useCachedStats,
  useCachedGroup,
  useCachedPagination,
  useCachedWithInvalidation,
  useCachedMultiple,
  useCachedOptimistic,
  cacheManagement,
};
