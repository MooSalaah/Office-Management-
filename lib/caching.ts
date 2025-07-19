import { useMemo, useRef, useEffect, useState } from "react";

// Simple in-memory cache
class MemoryCache {
	private cache = new Map<
		string,
		{ value: any; timestamp: number; ttl: number }
	>();

	set(key: string, value: any, ttl: number = 5 * 60 * 1000) {
		// 5 minutes default
		this.cache.set(key, {
			value,
			timestamp: Date.now(),
			ttl,
		});
	}

	get(key: string): any | null {
		const item = this.cache.get(key);
		if (!item) return null;

		if (Date.now() - item.timestamp > item.ttl) {
			this.cache.delete(key);
			return null;
		}

		return item.value;
	}

	has(key: string): boolean {
		return this.get(key) !== null;
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	size(): number {
		return this.cache.size;
	}
}

// Global cache instance
export const globalCache = new MemoryCache();

// Cache hook for React components
export function useCache<T>(
	key: string,
	fetcher: () => T,
	ttl: number = 5 * 60 * 1000
): T {
	const cachedValue = globalCache.get(key);

	if (cachedValue !== null) {
		return cachedValue;
	}

	const value = fetcher();
	globalCache.set(key, value, ttl);
	return value;
}

// Cache hook with dependencies
export function useCacheWithDeps<T>(
	key: string,
	fetcher: () => T,
	deps: any[],
	ttl: number = 5 * 60 * 1000
): T {
	const cacheKey = `${key}-${JSON.stringify(deps)}`;

	return useMemo(() => {
		const cachedValue = globalCache.get(cacheKey);

		if (cachedValue !== null) {
			return cachedValue;
		}

		const value = fetcher();
		globalCache.set(cacheKey, value, ttl);
		return value;
	}, deps);
}

// Cache hook for expensive computations
export function useExpensiveCache<T>(
	key: string,
	fetcher: () => T,
	deps: any[],
	ttl: number = 10 * 60 * 1000 // 10 minutes for expensive operations
): T {
	return useCacheWithDeps(key, fetcher, deps, ttl);
}

// Cache hook for API responses
export function useApiCache<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null } {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const cachedData = globalCache.get(key);

		if (cachedData !== null) {
			setData(cachedData);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		fetcher()
			.then((result) => {
				globalCache.set(key, result, ttl);
				setData(result);
				setLoading(false);
			})
			.catch((err) => {
				setError(err);
				setLoading(false);
			});
	}, [key, ttl]);

	return { data, loading, error };
}

// Cache hook for search results
export function useSearchCache<T>(
	searchTerm: string,
	items: T[],
	searchFields: (keyof T)[],
	ttl: number = 2 * 60 * 1000 // 2 minutes for search results
): T[] {
	const cacheKey = `search-${searchTerm}-${items.length}-${searchFields.join(
		","
	)}`;

	return useCacheWithDeps(
		cacheKey,
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
		[searchTerm, items, searchFields],
		ttl
	);
}

// Cache hook for filtered results
export function useFilterCache<T>(
	filterValue: string,
	items: T[],
	filterField: keyof T,
	ttl: number = 1 * 60 * 1000 // 1 minute for filter results
): T[] {
	const cacheKey = `filter-${filterValue}-${items.length}-${String(
		filterField
	)}`;

	return useCacheWithDeps(
		cacheKey,
		() => {
			if (filterValue === "all") return items;

			return items.filter((item) => {
				const fieldValue = item[filterField];
				return String(fieldValue) === filterValue;
			});
		},
		[filterValue, items, filterField],
		ttl
	);
}

// Cache hook for sorted results
export function useSortCache<T>(
	sortBy: keyof T | null,
	sortOrder: "asc" | "desc",
	items: T[],
	ttl: number = 1 * 60 * 1000 // 1 minute for sort results
): T[] {
	const cacheKey = `sort-${String(sortBy)}-${sortOrder}-${items.length}`;

	return useCacheWithDeps(
		cacheKey,
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
		[sortBy, sortOrder, items],
		ttl
	);
}

// Cache hook for statistics
export function useStatsCache<T>(
	items: T[],
	statsCalculator: (items: T[]) => any,
	ttl: number = 5 * 60 * 1000 // 5 minutes for statistics
): any {
	const cacheKey = `stats-${items.length}-${
		items.length > 0 ? "items" : "empty"
	}`;

	return useCacheWithDeps(cacheKey, () => statsCalculator(items), [items], ttl);
}

// Cache hook for grouped data
export function useGroupCache<T>(
	items: T[],
	groupBy: keyof T,
	ttl: number = 2 * 60 * 1000 // 2 minutes for grouped data
): Record<string, T[]> {
	const cacheKey = `group-${String(groupBy)}-${items.length}`;

	return useCacheWithDeps(
		cacheKey,
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
		[items, groupBy],
		ttl
	);
}

// Cache hook for paginated data
export function usePaginationCache<T>(
	items: T[],
	page: number,
	pageSize: number,
	ttl: number = 1 * 60 * 1000 // 1 minute for paginated data
): { items: T[]; totalPages: number; totalItems: number } {
	const cacheKey = `page-${page}-${pageSize}-${items.length}`;

	return useCacheWithDeps(
		cacheKey,
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

// Cache invalidation utilities
export function invalidateCache(pattern: string): void {
	const keys = Array.from(globalCache["cache"].keys());
	keys.forEach((key) => {
		if (key.includes(pattern)) {
			globalCache.delete(key);
		}
	});
}

export function invalidateSearchCache(): void {
	invalidateCache("search-");
}

export function invalidateFilterCache(): void {
	invalidateCache("filter-");
}

export function invalidateSortCache(): void {
	invalidateCache("sort-");
}

export function invalidateStatsCache(): void {
	invalidateCache("stats-");
}

export function invalidateGroupCache(): void {
	invalidateCache("group-");
}

export function invalidatePaginationCache(): void {
	invalidateCache("page-");
}

// Cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
	return {
		size: globalCache.size(),
		keys: Array.from(globalCache["cache"].keys()),
	};
}

// Cache cleanup
export function cleanupExpiredCache(): void {
	const keys = Array.from(globalCache["cache"].keys());
	keys.forEach((key) => {
		globalCache.get(key); // This will automatically remove expired items
	});
}
