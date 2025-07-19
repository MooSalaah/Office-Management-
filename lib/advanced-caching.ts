// Advanced caching utilities for performance optimization

// Cache strategies
export const CacheStrategies = {
	// Cache First - Serve from cache, fallback to network
	cacheFirst: async (
		request: Request,
		cacheName: string
	): Promise<Response> => {
		const cache = await caches.open(cacheName);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		try {
			const networkResponse = await fetch(request);
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
			}
			return networkResponse;
		} catch (error) {
			throw new Error("Network request failed");
		}
	},

	// Network First - Try network, fallback to cache
	networkFirst: async (
		request: Request,
		cacheName: string
	): Promise<Response> => {
		const cache = await caches.open(cacheName);

		try {
			const networkResponse = await fetch(request);
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
			}
			return networkResponse;
		} catch (error) {
			const cachedResponse = await cache.match(request);
			if (cachedResponse) {
				return cachedResponse;
			}
			throw new Error("Network request failed and no cache available");
		}
	},

	// Stale While Revalidate - Serve from cache, update in background
	staleWhileRevalidate: async (
		request: Request,
		cacheName: string
	): Promise<Response> => {
		const cache = await caches.open(cacheName);
		const cachedResponse = await cache.match(request);

		const fetchPromise = fetch(request).then(async (networkResponse) => {
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
			}
			return networkResponse;
		});

		if (cachedResponse) {
			return cachedResponse;
		}

		return fetchPromise;
	},

	// Network Only - Always fetch from network
	networkOnly: async (request: Request): Promise<Response> => {
		return fetch(request);
	},

	// Cache Only - Only serve from cache
	cacheOnly: async (request: Request, cacheName: string): Promise<Response> => {
		const cache = await caches.open(cacheName);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		throw new Error("No cached response available");
	},
};

// Cache management utilities
export const CacheManagement = {
	// Cache versioning
	versionCache: async (cacheName: string, version: string) => {
		const versionedCacheName = `${cacheName}-v${version}`;
		const cache = await caches.open(versionedCacheName);

		return {
			cache,
			name: versionedCacheName,
		};
	},

	// Cache cleanup
	cleanupCache: async (
		cacheName: string,
		maxAge: number = 7 * 24 * 60 * 60 * 1000
	) => {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();

		for (const request of keys) {
			const response = await cache.match(request);
			if (response) {
				const date = response.headers.get("date");
				if (date) {
					const responseDate = new Date(date).getTime();
					const now = Date.now();

					if (now - responseDate > maxAge) {
						await cache.delete(request);
					}
				}
			}
		}
	},

	// Cache size monitoring
	getCacheSize: async (cacheName: string): Promise<number> => {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		let totalSize = 0;

		for (const request of keys) {
			const response = await cache.match(request);
			if (response) {
				const contentLength = response.headers.get("content-length");
				if (contentLength) {
					totalSize += parseInt(contentLength);
				}
			}
		}

		return totalSize;
	},

	// Cache statistics
	getCacheStats: async (cacheName: string) => {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();

		const stats = {
			totalEntries: keys.length,
			totalSize: 0,
			oldestEntry: null as Date | null,
			newestEntry: null as Date | null,
		};

		for (const request of keys) {
			const response = await cache.match(request);
			if (response) {
				const contentLength = response.headers.get("content-length");
				if (contentLength) {
					stats.totalSize += parseInt(contentLength);
				}

				const date = response.headers.get("date");
				if (date) {
					const responseDate = new Date(date);
					if (!stats.oldestEntry || responseDate < stats.oldestEntry) {
						stats.oldestEntry = responseDate;
					}
					if (!stats.newestEntry || responseDate > stats.newestEntry) {
						stats.newestEntry = responseDate;
					}
				}
			}
		}

		return stats;
	},
};

// Memory cache utilities
export const MemoryCache = {
	// LRU Cache implementation
	createLRUCache: <K, V>(maxSize: number = 100) => {
		const cache = new Map<K, V>();
		const accessOrder: K[] = [];

		return {
			get: (key: K): V | undefined => {
				if (cache.has(key)) {
					// Move to end of access order
					const index = accessOrder.indexOf(key);
					if (index > -1) {
						accessOrder.splice(index, 1);
					}
					accessOrder.push(key);
					return cache.get(key);
				}
				return undefined;
			},

			set: (key: K, value: V): void => {
				if (cache.has(key)) {
					// Update existing entry
					cache.set(key, value);
					const index = accessOrder.indexOf(key);
					if (index > -1) {
						accessOrder.splice(index, 1);
					}
					accessOrder.push(key);
				} else {
					// Add new entry
					if (cache.size >= maxSize) {
						// Remove least recently used
						const lruKey = accessOrder.shift();
						if (lruKey) {
							cache.delete(lruKey);
						}
					}
					cache.set(key, value);
					accessOrder.push(key);
				}
			},

			has: (key: K): boolean => {
				return cache.has(key);
			},

			delete: (key: K): boolean => {
				const deleted = cache.delete(key);
				if (deleted) {
					const index = accessOrder.indexOf(key);
					if (index > -1) {
						accessOrder.splice(index, 1);
					}
				}
				return deleted;
			},

			clear: (): void => {
				cache.clear();
				accessOrder.length = 0;
			},

			size: (): number => {
				return cache.size;
			},

			keys: (): K[] => {
				return Array.from(cache.keys());
			},

			values: (): V[] => {
				return Array.from(cache.values());
			},
		};
	},

	// TTL Cache implementation
	createTTLCache: <K, V>(defaultTTL: number = 5 * 60 * 1000) => {
		const cache = new Map<K, { value: V; expiry: number }>();

		return {
			get: (key: K): V | undefined => {
				const entry = cache.get(key);
				if (entry && Date.now() < entry.expiry) {
					return entry.value;
				}
				if (entry) {
					cache.delete(key);
				}
				return undefined;
			},

			set: (key: K, value: V, ttl?: number): void => {
				const expiry = Date.now() + (ttl || defaultTTL);
				cache.set(key, { value, expiry });
			},

			has: (key: K): boolean => {
				const entry = cache.get(key);
				if (entry && Date.now() < entry.expiry) {
					return true;
				}
				if (entry) {
					cache.delete(key);
				}
				return false;
			},

			delete: (key: K): boolean => {
				return cache.delete(key);
			},

			clear: (): void => {
				cache.clear();
			},

			size: (): number => {
				// Clean expired entries
				for (const [key, entry] of cache.entries()) {
					if (Date.now() >= entry.expiry) {
						cache.delete(key);
					}
				}
				return cache.size;
			},

			cleanup: (): void => {
				for (const [key, entry] of cache.entries()) {
					if (Date.now() >= entry.expiry) {
						cache.delete(key);
					}
				}
			},
		};
	},
};

// API cache utilities
export const APICache = {
	// Cache API responses
	cacheResponse: async (
		url: string,
		response: Response,
		ttl: number = 5 * 60 * 1000
	) => {
		const cache = await caches.open("api-cache");
		const request = new Request(url);

		// Add cache headers
		const headers = new Headers(response.headers);
		headers.set("cache-control", `max-age=${ttl}`);
		headers.set("date", new Date().toISOString());

		const cachedResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});

		await cache.put(request, cachedResponse);
	},

	// Get cached API response
	getCachedResponse: async (url: string): Promise<Response | null> => {
		const cache = await caches.open("api-cache");
		const request = new Request(url);
		const response = await cache.match(request);

		if (response) {
			const cacheControl = response.headers.get("cache-control");
			if (cacheControl) {
				const maxAge = parseInt(cacheControl.split("=")[1]);
				const date = response.headers.get("date");
				if (date) {
					const responseDate = new Date(date).getTime();
					const now = Date.now();

					if (now - responseDate < maxAge * 1000) {
						return response;
					}
				}
			}
		}

		return null;
	},

	// Cache with TTL
	cacheWithTTL: async (url: string, data: any, ttl: number = 5 * 60 * 1000) => {
		const cache = await caches.open("api-cache");
		const request = new Request(url);

		const response = new Response(JSON.stringify(data), {
			headers: {
				"content-type": "application/json",
				"cache-control": `max-age=${ttl}`,
				date: new Date().toISOString(),
			},
		});

		await cache.put(request, response);
	},
};

// React cache utilities
export const ReactCache = {
	// Cache hook for API calls
	useAPICache: <T>(
		url: string,
		fetcher: () => Promise<T>,
		ttl: number = 5 * 60 * 1000
	) => {
		const [data, setData] = React.useState<T | null>(null);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState<Error | null>(null);

		React.useEffect(() => {
			const fetchData = async () => {
				try {
					// Try to get cached response
					const cachedResponse = await APICache.getCachedResponse(url);

					if (cachedResponse) {
						const cachedData = await cachedResponse.json();
						setData(cachedData);
						setLoading(false);
						return;
					}

					// Fetch from network
					const result = await fetcher();
					setData(result);

					// Cache the response
					await APICache.cacheWithTTL(url, result, ttl);

					setLoading(false);
				} catch (err) {
					setError(err as Error);
					setLoading(false);
				}
			};

			fetchData();
		}, [url, ttl]);

		return { data, loading, error };
	},

	// Cache hook for expensive computations
	useComputationCache: <T>(key: string, computation: () => T, deps: any[]) => {
		return React.useMemo(() => {
			const cache = MemoryCache.createTTLCache<string, T>();
			const cachedResult = cache.get(key);

			if (cachedResult !== undefined) {
				return cachedResult;
			}

			const result = computation();
			cache.set(key, result);
			return result;
		}, deps);
	},

	// Cache hook for search results
	useSearchCache: <T>(
		searchTerm: string,
		items: T[],
		searchFn: (term: string, items: T[]) => T[]
	) => {
		return React.useMemo(() => {
			const cache = MemoryCache.createTTLCache<string, T[]>();
			const cacheKey = `search-${searchTerm}-${items.length}`;

			const cachedResult = cache.get(cacheKey);
			if (cachedResult !== undefined) {
				return cachedResult;
			}

			const result = searchFn(searchTerm, items);
			cache.set(cacheKey, result);
			return result;
		}, [searchTerm, items]);
	},
};

// Cache monitoring utilities
export const CacheMonitoring = {
	// Monitor cache hit rate
	monitorCacheHitRate: (cacheName: string) => {
		let hits = 0;
		let misses = 0;

		return {
			hit: () => {
				hits++;
				console.log(
					`Cache ${cacheName} hit rate: ${(
						(hits / (hits + misses)) *
						100
					).toFixed(2)}%`
				);
			},
			miss: () => {
				misses++;
				console.log(
					`Cache ${cacheName} hit rate: ${(
						(hits / (hits + misses)) *
						100
					).toFixed(2)}%`
				);
			},
			getStats: () => ({
				hits,
				misses,
				hitRate: hits / (hits + misses),
			}),
		};
	},

	// Monitor cache performance
	monitorCachePerformance: (cacheName: string) => {
		return {
			startTimer: () => {
				return performance.now();
			},
			endTimer: (startTime: number, operation: string) => {
				const endTime = performance.now();
				const duration = endTime - startTime;
				console.log(
					`Cache ${cacheName} ${operation} time: ${duration.toFixed(2)}ms`
				);
				return duration;
			},
		};
	},
};
