import { useMemo, useRef, useEffect, useState } from "react";

// نظام التخزين المؤقت المحسن
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  namespace?: string; // Namespace for cache isolation
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class AdvancedCache<T = unknown> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly namespace: string;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.namespace = options.namespace || 'default';
  }

  set(key: string, value: T, ttl?: number): void {
    const fullKey = `${this.namespace}:${key}`;
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if cache is full and evict least recently used
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(fullKey, item);
  }

  get(key: string): T | null {
    const fullKey = `${this.namespace}:${key}`;
    const item = this.cache.get(fullKey);

    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(fullKey);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.value;
  }

  has(key: string): boolean {
    const fullKey = `${this.namespace}:${key}`;
    const item = this.cache.get(fullKey);
    
    if (!item) return false;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(fullKey);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const fullKey = `${this.namespace}:${key}`;
    return this.cache.delete(fullKey);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys()).map(key => key.replace(`${this.namespace}:`, ''));
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Cleanup expired items
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalAccessCount = 0;
    let expiredCount = 0;

    for (const item of this.cache.values()) {
      totalAccessCount += item.accessCount;
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccessCount,
      expiredCount,
      namespace: this.namespace,
    };
  }
}

// Global cache instances
export const apiCache = new AdvancedCache({ namespace: 'api', ttl: 2 * 60 * 1000, maxSize: 50 });
export const uiCache = new AdvancedCache({ namespace: 'ui', ttl: 10 * 60 * 1000, maxSize: 100 });
export const dataCache = new AdvancedCache({ namespace: 'data', ttl: 5 * 60 * 1000, maxSize: 200 });

// Utility functions for common caching patterns
export const cacheUtils = {
  // Cache API responses
  async cachedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = apiCache.get(key);
    if (cached) return cached as T;

    const result = await apiCall();
    apiCache.set(key, result, ttl);
    return result;
  },

  // Cache expensive computations
  cachedComputation<T>(
    key: string,
    computation: () => T,
    ttl?: number
  ): T {
    const cached = uiCache.get(key);
    if (cached) return cached as T;

    const result = computation();
    uiCache.set(key, result, ttl);
    return result;
  },

  // Cache data with automatic refresh
  async cachedDataWithRefresh<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = dataCache.get(key);
    if (cached) return cached as T;

    const result = await dataFetcher();
    dataCache.set(key, result, ttl);
    return result;
  },

  // Invalidate cache by pattern
  invalidateByPattern(pattern: string): number {
    let invalidatedCount = 0;
    
    [apiCache, uiCache, dataCache].forEach(cache => {
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key);
          invalidatedCount++;
        }
      });
    });

    return invalidatedCount;
  },

  // Clear all caches
  clearAll(): void {
    apiCache.clear();
    uiCache.clear();
    dataCache.clear();
  },

  // Get all cache statistics
  getAllStats() {
    return {
      api: apiCache.getStats(),
      ui: uiCache.getStats(),
      data: dataCache.getStats(),
    };
  },
};

// Auto-cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
    uiCache.cleanup();
    dataCache.cleanup();
  }, 5 * 60 * 1000);
}

export default AdvancedCache;
