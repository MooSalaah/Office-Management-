import React, { useMemo, useCallback, memo } from "react";

// Memoization utilities for performance optimization

// Memoized hooks
export const useMemoizedValue = <T>(value: T, deps: unknown[]): T => {
	return useMemo(() => value, deps);
};

export const useMemoizedCallback = <T extends (...args: unknown[]) => unknown>(
	callback: T,
	deps: unknown[]
): T => {
	return useCallback(callback, deps);
};

// Memoized calculations
export const useMemoizedCalculation = <T>(
	calculation: () => T,
	deps: unknown[]
): T => {
	return useMemo(calculation, deps);
};

// Memoized filters
export const useMemoizedFilter = <T>(
	items: T[],
	filterFn: (item: T) => boolean,
	deps: unknown[]
): T[] => {
	return useMemo(() => items.filter(filterFn), [items, ...deps]);
};

// Memoized sorts
export const useMemoizedSort = <T>(
	items: T[],
	sortFn: (a: T, b: T) => number,
	deps: unknown[]
): T[] => {
	return useMemo(() => [...items].sort(sortFn), [items, ...deps]);
};

// Memoized maps
export const useMemoizedMap = <T, U>(
	items: T[],
	mapFn: (item: T) => U,
	deps: unknown[]
): U[] => {
	return useMemo(() => items.map(mapFn), [items, ...deps]);
};

// Memoized reduces
export const useMemoizedReduce = <T, U>(
	items: T[],
	reduceFn: (acc: U, item: T) => U,
	initialValue: U,
	deps: unknown[]
): U => {
	return useMemo(() => items.reduce(reduceFn, initialValue), [items, ...deps]);
};

// Memoized groups
export const useMemoizedGroup = <T>(
	items: T[],
	groupBy: (item: T) => string,
	deps: unknown[]
): Record<string, T[]> => {
	return useMemo(() => {
		const groups: Record<string, T[]> = {};
		items.forEach((item) => {
			const key = groupBy(item);
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		});
		return groups;
	}, [items, ...deps]);
};

// Memoized statistics
export const useMemoizedStats = <T, R>(
	items: T[],
	statsFn: (items: T[]) => R,
	deps: unknown[]
): R => {
	return useMemo(() => statsFn(items), [items, ...deps]);
};

// Memoized search
export const useMemoizedSearch = <T>(
	items: T[],
	searchTerm: string,
	searchFields: (keyof T)[],
	deps: unknown[]
): T[] => {
	return useMemo(() => {
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
	}, [items, searchTerm, searchFields, ...deps]);
};

// Memoized pagination
export const useMemoizedPagination = <T>(
	items: T[],
	page: number,
	pageSize: number,
	deps: unknown[]
): { items: T[]; totalPages: number; totalItems: number } => {
	return useMemo(() => {
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const paginatedItems = items.slice(startIndex, endIndex);
		const totalPages = Math.ceil(items.length / pageSize);

		return {
			items: paginatedItems,
			totalPages,
			totalItems: items.length,
		};
	}, [items, page, pageSize, ...deps]);
};

// Memoized formatters
export const useMemoizedFormatter = <T>(
	formatter: (value: T) => string,
	deps: unknown[]
): ((value: T) => string) => {
	return useCallback(formatter, deps);
};

// Memoized validators
export const useMemoizedValidator = <T>(
	validator: (value: T) => boolean | string,
	deps: unknown[]
): ((value: T) => boolean | string) => {
	return useCallback(validator, deps);
};

// Memoized event handlers
export const useMemoizedEventHandler = <T extends Event>(
	handler: (event: T) => void,
	deps: unknown[]
): ((event: T) => void) => {
	return useCallback(handler, deps);
};

// Memoized API calls
export const useMemoizedApiCall = <T>(
	apiCall: () => Promise<T>,
	deps: unknown[]
): (() => Promise<T>) => {
	return useCallback(apiCall, deps);
};

// Memoized selectors
export const useMemoizedSelector = <T, U>(
	selector: (state: T) => U,
	state: T,
	deps: unknown[]
): U => {
	return useMemo(() => selector(state), [state, ...deps]);
};

// Memoized transformers
export const useMemoizedTransformer = <T, U>(
	transformer: (value: T) => U,
	value: T,
	deps: unknown[]
): U => {
	return useMemo(() => transformer(value), [value, ...deps]);
};

// Memoized cache
export class MemoizedCache<T> {
	private cache = new Map<
		string,
		{ value: T; timestamp: number; ttl: number }
	>();

	get(key: string): T | null {
		const item = this.cache.get(key);
		if (!item) return null;

		if (Date.now() - item.timestamp > item.ttl) {
			this.cache.delete(key);
			return null;
		}

		return item.value;
	}

	set(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
		this.cache.set(key, {
			value,
			timestamp: Date.now(),
			ttl,
		});
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

// Memoized cache hook
export function useMemoizedCache<T>(
	key: string,
	fetcher: () => T,
	ttl: number = 5 * 60 * 1000
): T {
	const cache = useMemo(() => new MemoizedCache<T>(), []);

	const cachedValue = cache.get(key);
	if (cachedValue !== null) {
		return cachedValue;
	}

	const value = fetcher();
	cache.set(key, value, ttl);
	return value;
}

// Memoized cache with dependencies
export function useMemoizedCacheWithDeps<T>(
	key: string,
	fetcher: () => T,
	deps: unknown[],
	ttl: number = 5 * 60 * 1000
): T {
	const cacheKey = `${key}-${JSON.stringify(deps)}`;

	return useMemo(() => {
		const cache = new MemoizedCache<T>();
		const cachedValue = cache.get(cacheKey);

		if (cachedValue !== null) {
			return cachedValue;
		}

		const value = fetcher();
		cache.set(cacheKey, value, ttl);
		return value;
	}, deps);
}

// Memoized expensive operations
export function useMemoizedExpensiveOperation<T>(
	operation: () => T,
	deps: unknown[],
	ttl: number = 10 * 60 * 1000 // 10 minutes for expensive operations
): T {
	return useMemoizedCacheWithDeps("expensive-operation", operation, deps, ttl);
}

// Memoized API responses
export function useMemoizedApiResponse<T>(
	key: string,
	apiCall: () => Promise<T>,
	ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null } {
	const [data, setData] = React.useState<T | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<Error | null>(null);

	const cache = useMemo(() => new MemoizedCache<T>(), []);

	React.useEffect(() => {
		const cachedData = cache.get(key);

		if (cachedData !== null) {
			setData(cachedData);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		apiCall()
			.then((result) => {
				cache.set(key, result, ttl);
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

// Memoized search results
export function useMemoizedSearchResults<T>(
	searchTerm: string,
	items: T[],
	searchFields: (keyof T)[],
	ttl: number = 2 * 60 * 1000 // 2 minutes for search results
): T[] {
	const cacheKey = `search-${searchTerm}-${items.length}-${searchFields.join(
		","
	)}`;

	return useMemoizedCacheWithDeps(
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

// Memoized filter results
export function useMemoizedFilterResults<T>(
	filterValue: string,
	items: T[],
	filterField: keyof T,
	ttl: number = 1 * 60 * 1000 // 1 minute for filter results
): T[] {
	const cacheKey = `filter-${filterValue}-${items.length}-${String(
		filterField
	)}`;

	return useMemoizedCacheWithDeps(
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

// Memoized sort results
export function useMemoizedSortResults<T>(
	sortBy: keyof T | null,
	sortOrder: "asc" | "desc",
	items: T[],
	ttl: number = 1 * 60 * 1000 // 1 minute for sort results
): T[] {
	const cacheKey = `sort-${String(sortBy)}-${sortOrder}-${items.length}`;

	return useMemoizedCacheWithDeps(
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

// Memoized statistics
export function useMemoizedStatistics<T, R>(
	items: T[],
	statsCalculator: (items: T[]) => R,
	ttl: number = 5 * 60 * 1000 // 5 minutes for statistics
): R {
	const cacheKey = `stats-${items.length}-${
		items.length > 0 ? "items" : "empty"
	}`;

	return useMemoizedCacheWithDeps(
		cacheKey,
		() => statsCalculator(items),
		[items],
		ttl
	);
}

// Memoized grouped data
export function useMemoizedGroupedData<T>(
	items: T[],
	groupBy: keyof T,
	ttl: number = 2 * 60 * 1000 // 2 minutes for grouped data
): Record<string, T[]> {
	const cacheKey = `group-${String(groupBy)}-${items.length}`;

	return useMemoizedCacheWithDeps(
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

// Memoized paginated data
export function useMemoizedPaginatedData<T>(
	items: T[],
	page: number,
	pageSize: number,
	ttl: number = 1 * 60 * 1000 // 1 minute for paginated data
): { items: T[]; totalPages: number; totalItems: number } {
	const cacheKey = `page-${page}-${pageSize}-${items.length}`;

	return useMemoizedCacheWithDeps(
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
