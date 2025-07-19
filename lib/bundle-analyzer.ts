// Bundle analyzer utilities for performance optimization

// Analyze bundle size
export function analyzeBundleSize() {
	if (typeof window === "undefined") return null;

	const performance = window.performance;
	if (!performance) return null;

	const navigation = performance.getEntriesByType(
		"navigation"
	)[0] as PerformanceNavigationTiming;
	if (!navigation) return null;

	return {
		// Page load metrics
		pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
		domContentLoaded:
			navigation.domContentLoadedEventEnd -
			navigation.domContentLoadedEventStart,
		firstPaint: getFirstPaint(),
		firstContentfulPaint: getFirstContentfulPaint(),
		largestContentfulPaint: getLargestContentfulPaint(),

		// Resource metrics
		totalResources: performance.getEntriesByType("resource").length,
		totalSize: calculateTotalResourceSize(),

		// Memory usage
		memoryUsage: getMemoryUsage(),

		// Network metrics
		networkInfo: getNetworkInfo(),
	};
}

// Get first paint time
function getFirstPaint(): number | null {
	const paintEntries = performance.getEntriesByType("paint");
	const firstPaint = paintEntries.find((entry) => entry.name === "first-paint");
	return firstPaint ? firstPaint.startTime : null;
}

// Get first contentful paint time
function getFirstContentfulPaint(): number | null {
	const paintEntries = performance.getEntriesByType("paint");
	const fcp = paintEntries.find(
		(entry) => entry.name === "first-contentful-paint"
	);
	return fcp ? fcp.startTime : null;
}

// Get largest contentful paint time
function getLargestContentfulPaint(): number | null {
	const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
	if (lcpEntries.length > 0) {
		return lcpEntries[lcpEntries.length - 1].startTime;
	}
	return null;
}

// Calculate total resource size
function calculateTotalResourceSize(): number {
	const resources = performance.getEntriesByType("resource");
	return resources.reduce((total, resource) => {
		const transferSize =
			(resource as PerformanceResourceTiming).transferSize || 0;
		return total + transferSize;
	}, 0);
}

// Get memory usage
function getMemoryUsage() {
	if ("memory" in performance) {
		const memory = (performance as any).memory;
		return {
			usedJSHeapSize: memory.usedJSHeapSize,
			totalJSHeapSize: memory.totalJSHeapSize,
			jsHeapSizeLimit: memory.jsHeapSizeLimit,
		};
	}
	return null;
}

// Get network information
function getNetworkInfo() {
	if ("connection" in navigator) {
		const connection = (navigator as any).connection;
		return {
			effectiveType: connection.effectiveType,
			downlink: connection.downlink,
			rtt: connection.rtt,
			saveData: connection.saveData,
		};
	}
	return null;
}

// Analyze component performance
export function analyzeComponentPerformance(componentName: string) {
	const startTime = performance.now();

	return {
		start: () => {
			return performance.now();
		},
		end: (startTime: number) => {
			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(
				`Component ${componentName} render time: ${duration.toFixed(2)}ms`
			);

			// Log to analytics if duration is too high
			if (duration > 16) {
				// 60fps threshold
				console.warn(
					`Slow component render: ${componentName} took ${duration.toFixed(
						2
					)}ms`
				);
			}

			return duration;
		},
	};
}

// Analyze render performance
export function analyzeRenderPerformance() {
	const observer = new PerformanceObserver((list) => {
		for (const entry of list.getEntries()) {
			if (entry.entryType === "measure") {
				console.log(
					`Render performance: ${entry.name} took ${entry.duration.toFixed(
						2
					)}ms`
				);
			}
		}
	});

	observer.observe({ entryTypes: ["measure"] });

	return {
		startMeasure: (name: string) => {
			performance.mark(`${name}-start`);
		},
		endMeasure: (name: string) => {
			performance.mark(`${name}-end`);
			performance.measure(name, `${name}-start`, `${name}-end`);
		},
	};
}

// Analyze bundle chunks
export function analyzeBundleChunks() {
	if (typeof window === "undefined") return null;

	const scripts = document.querySelectorAll("script[src]");
	const styles = document.querySelectorAll('link[rel="stylesheet"]');

	const chunks = {
		scripts: Array.from(scripts).map((script) => ({
			src: script.getAttribute("src"),
			size: getResourceSize(script.getAttribute("src")),
		})),
		styles: Array.from(styles).map((style) => ({
			href: style.getAttribute("href"),
			size: getResourceSize(style.getAttribute("href")),
		})),
	};

	return chunks;
}

// Get resource size
async function getResourceSize(url: string | null): Promise<number> {
	if (!url) return 0;

	try {
		const response = await fetch(url);
		const contentLength = response.headers.get("content-length");
		return contentLength ? parseInt(contentLength) : 0;
	} catch {
		return 0;
	}
}

// Analyze unused code
export function analyzeUnusedCode() {
	const coverage = (window as any).__coverage__;
	if (!coverage) {
		console.warn("Code coverage not available. Run with --coverage flag.");
		return null;
	}

	const unusedFiles = [];
	const unusedLines = [];

	for (const [file, data] of Object.entries(coverage)) {
		const fileData = data as any;
		const totalLines = fileData.s.length;
		const coveredLines = Object.values(fileData.s).filter(
			(count: any) => count > 0
		).length;

		if (coveredLines === 0) {
			unusedFiles.push(file);
		} else if (coveredLines < totalLines) {
			unusedLines.push({
				file,
				total: totalLines,
				covered: coveredLines,
				unused: totalLines - coveredLines,
			});
		}
	}

	return {
		unusedFiles,
		unusedLines,
		totalFiles: Object.keys(coverage).length,
		totalUnusedFiles: unusedFiles.length,
	};
}

// Performance monitoring
export class PerformanceMonitor {
	private metrics: Map<string, number[]> = new Map();

	startTimer(name: string): () => void {
		const startTime = performance.now();

		return () => {
			const endTime = performance.now();
			const duration = endTime - startTime;

			if (!this.metrics.has(name)) {
				this.metrics.set(name, []);
			}

			this.metrics.get(name)!.push(duration);
		};
	}

	getMetrics(name: string) {
		const values = this.metrics.get(name) || [];
		if (values.length === 0) return null;

		const sorted = values.sort((a, b) => a - b);
		const sum = values.reduce((a, b) => a + b, 0);

		return {
			count: values.length,
			average: sum / values.length,
			min: sorted[0],
			max: sorted[sorted.length - 1],
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)],
		};
	}

	getAllMetrics() {
		const result: Record<string, any> = {};

		for (const [name] of this.metrics) {
			result[name] = this.getMetrics(name);
		}

		return result;
	}

	clear() {
		this.metrics.clear();
	}
}

// Bundle size optimization suggestions
export function getBundleOptimizationSuggestions(bundleAnalysis: any) {
	const suggestions = [];

	if (bundleAnalysis.totalSize > 1024 * 1024) {
		// 1MB
		suggestions.push(
			"Bundle size is large. Consider code splitting and lazy loading."
		);
	}

	if (bundleAnalysis.pageLoadTime > 3000) {
		// 3 seconds
		suggestions.push(
			"Page load time is slow. Optimize critical rendering path."
		);
	}

	if (bundleAnalysis.firstContentfulPaint > 1500) {
		// 1.5 seconds
		suggestions.push(
			"First contentful paint is slow. Optimize above-the-fold content."
		);
	}

	if (bundleAnalysis.totalResources > 50) {
		suggestions.push("Too many resources. Consider bundling and minification.");
	}

	return suggestions;
}

// Export global performance monitor
export const globalPerformanceMonitor = new PerformanceMonitor();

// Auto-start performance monitoring in development
if (process.env.NODE_ENV === "development") {
	// Monitor React renders
	const originalConsoleLog = console.log;
	console.log = (...args) => {
		if (args[0]?.includes?.("render")) {
			globalPerformanceMonitor.startTimer("react-render");
		}
		originalConsoleLog.apply(console, args);
	};

	// Monitor API calls
	const originalFetch = window.fetch;
	window.fetch = (...args) => {
		const timer = globalPerformanceMonitor.startTimer("api-call");
		return originalFetch.apply(window, args).finally(timer);
	};
}
