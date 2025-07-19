import { useCallback, useRef } from "react";

// Debounce hook for search inputs
export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): T {
	const timeoutRef = useRef<NodeJS.Timeout>();

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay]
	) as T;
}

// Debounce function for general use
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;

	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			func(...args);
		}
	};
}

// Search debounce hook specifically for search inputs
export function useSearchDebounce(
	callback: (searchTerm: string) => void,
	delay: number = 300
) {
	return useDebounce(callback, delay);
}

// Filter debounce hook for filter changes
export function useFilterDebounce(
	callback: (filterValue: string) => void,
	delay: number = 200
) {
	return useDebounce(callback, delay);
}

// Scroll debounce hook for scroll events
export function useScrollDebounce(
	callback: (scrollTop: number) => void,
	delay: number = 100
) {
	return useDebounce(callback, delay);
}

// Resize debounce hook for window resize events
export function useResizeDebounce(
	callback: (width: number, height: number) => void,
	delay: number = 250
) {
	return useDebounce(callback, delay);
}

// Form input debounce hook
export function useFormDebounce<T>(
	callback: (value: T) => void,
	delay: number = 500
) {
	return useDebounce(callback, delay);
}

// API call debounce hook
export function useApiDebounce<T>(
	callback: (...args: T[]) => void,
	delay: number = 1000
) {
	return useDebounce(callback, delay);
}

// Optimized search function with debouncing
export function createOptimizedSearch<T>(
	items: T[],
	searchTerm: string,
	searchFields: (keyof T)[],
	debounceDelay: number = 300
) {
	const debouncedSearch = debounce((term: string) => {
		if (!term.trim()) return items;

		const searchLower = term.toLowerCase();
		return items.filter((item) => {
			return searchFields.some((field) => {
				const value = item[field];
				if (typeof value === "string") {
					return value.toLowerCase().includes(searchLower);
				}
				return false;
			});
		});
	}, debounceDelay);

	return debouncedSearch(searchTerm);
}

// Optimized filter function with debouncing
export function createOptimizedFilter<T>(
	items: T[],
	filterValue: string,
	filterField: keyof T,
	debounceDelay: number = 200
) {
	const debouncedFilter = debounce((value: string) => {
		if (value === "all") return items;

		return items.filter((item) => {
			const fieldValue = item[filterField];
			return String(fieldValue) === value;
		});
	}, debounceDelay);

	return debouncedFilter(filterValue);
}

// Optimized sort function with debouncing
export function createOptimizedSort<T>(
	items: T[],
	sortBy: keyof T | null,
	sortOrder: "asc" | "desc",
	debounceDelay: number = 100
) {
	const debouncedSort = debounce(
		(by: keyof T | null, order: "asc" | "desc") => {
			if (!by) return items;

			return [...items].sort((a, b) => {
				const aValue = a[by];
				const bValue = b[by];

				if (typeof aValue === "string" && typeof bValue === "string") {
					return order === "asc"
						? aValue.localeCompare(bValue)
						: bValue.localeCompare(aValue);
				}

				if (typeof aValue === "number" && typeof bValue === "number") {
					return order === "asc" ? aValue - bValue : bValue - aValue;
				}

				return 0;
			});
		},
		debounceDelay
	);

	return debouncedSort(sortBy, sortOrder);
}
