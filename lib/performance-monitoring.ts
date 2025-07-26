// نظام مراقبة الأداء
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  
  // Custom metrics
  pageLoadTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
  memoryUsage?: number;
  
  // User interactions
  clickResponseTime?: number;
  scrollPerformance?: number;
  
  // Errors
  errorCount?: number;
  errorRate?: number;
}

export interface PerformanceConfig {
  enableWebVitals?: boolean;
  enableCustomMetrics?: boolean;
  enableErrorTracking?: boolean;
  enableMemoryMonitoring?: boolean;
  sampleRate?: number; // 0-1, percentage of users to track
  endpoint?: string; // Where to send metrics
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableWebVitals: true,
      enableCustomMetrics: true,
      enableErrorTracking: true,
      enableMemoryMonitoring: true,
      sampleRate: 1.0,
      endpoint: '/api/performance',
      ...config,
    };
  }

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Random sampling
    if (Math.random() > this.config.sampleRate!) {
      return;
    }

    this.isInitialized = true;

    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    if (this.config.enableCustomMetrics) {
      this.initCustomMetrics();
    }

    if (this.config.enableErrorTracking) {
      this.initErrorTracking();
    }

    if (this.config.enableMemoryMonitoring) {
      this.initMemoryMonitoring();
    }

    // Send initial metrics
    this.sendMetrics();
  }

  private initWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      this.metrics.lcp = lastEntry.startTime;
      this.sendMetrics();
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.sendMetrics();
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
      this.sendMetrics();
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.initiatorType === 'navigation') {
          this.metrics.ttfb = entry.responseStart - entry.requestStart;
          this.sendMetrics();
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('ttfb', observer);
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      this.metrics.fcp = firstEntry.startTime;
      this.sendMetrics();
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('fcp', observer);
  }

  private initCustomMetrics(): void {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.pageLoadTime = loadTime;
      this.sendMetrics();
    });

    // API response time tracking
    this.interceptFetch();
    this.interceptXMLHttpRequest();

    // Render time tracking
    this.trackRenderTime();
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.metrics.apiResponseTime = endTime - startTime;
        this.sendMetrics();
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.metrics.apiResponseTime = endTime - startTime;
        this.sendMetrics();
        throw error;
      }
    };
  }

  private interceptXMLHttpRequest(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(...args) {
      this._startTime = performance.now();
      return originalOpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      const originalOnReadyStateChange = xhr.onreadystatechange;

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          const endTime = performance.now();
          const responseTime = endTime - xhr._startTime;
          
          // Update metrics
          if (window.performanceMonitor) {
            window.performanceMonitor.metrics.apiResponseTime = responseTime;
            window.performanceMonitor.sendMetrics();
          }
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(xhr, args);
        }
      };

      return originalSend.apply(this, args);
    };
  }

  private trackRenderTime(): void {
    let renderStartTime: number;

    // Track React render time
    const originalCreateElement = document.createElement;
    document.createElement = function(...args) {
      if (!renderStartTime) {
        renderStartTime = performance.now();
      }
      return originalCreateElement.apply(this, args);
    };

    // Measure render time after DOM is ready
    const measureRenderTime = () => {
      if (renderStartTime) {
        const renderTime = performance.now() - renderStartTime;
        this.metrics.renderTime = renderTime;
        this.sendMetrics();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', measureRenderTime);
    } else {
      measureRenderTime();
    }
  }

  private initErrorTracking(): void {
    let errorCount = 0;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      errorCount++;
      this.metrics.errorCount = errorCount;
      this.metrics.errorRate = errorCount / (performance.now() / 1000); // errors per second
      this.sendMetrics();
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorCount++;
      this.metrics.errorCount = errorCount;
      this.metrics.errorRate = errorCount / (performance.now() / 1000);
      this.sendMetrics();
    });
  }

  private initMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      this.sendMetrics();
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  // Custom metric tracking
  trackCustomMetric(name: string, value: number): void {
    (this.metrics as any)[name] = value;
    this.sendMetrics();
  }

  // User interaction tracking
  trackClickResponseTime(): void {
    let clickStartTime: number;

    document.addEventListener('mousedown', () => {
      clickStartTime = performance.now();
    });

    document.addEventListener('mouseup', () => {
      if (clickStartTime) {
        const responseTime = performance.now() - clickStartTime;
        this.metrics.clickResponseTime = responseTime;
        this.sendMetrics();
      }
    });
  }

  trackScrollPerformance(): void {
    let lastScrollTime = 0;
    let scrollCount = 0;

    document.addEventListener('scroll', () => {
      const now = performance.now();
      if (now - lastScrollTime > 16) { // 60fps threshold
        scrollCount++;
      }
      lastScrollTime = now;

      this.metrics.scrollPerformance = scrollCount;
      this.sendMetrics();
    });
  }

  // Send metrics to server
  private async sendMetrics(): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      const payload = {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metrics: this.metrics,
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Silently fail in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send performance metrics:', error);
      }
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {};
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const trackRender = useCallback(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackCustomMetric(`${componentName}RenderTime`, renderTime);
    };
  }, [componentName]);

  return {
    metrics,
    trackRender,
    trackCustomMetric: performanceMonitor.trackCustomMetric.bind(performanceMonitor),
  };
}

// Performance utilities
export const performanceUtils = {
  // Measure function execution time
  measureTime<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    performanceMonitor.trackCustomMetric(name, executionTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${executionTime.toFixed(2)}ms`);
    }
    
    return result;
  },

  // Measure async function execution time
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    performanceMonitor.trackCustomMetric(name, executionTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${executionTime.toFixed(2)}ms`);
    }
    
    return result;
  },

  // Check if performance is good
  isPerformanceGood(metrics: PerformanceMetrics): boolean {
    const thresholds = {
      lcp: 2500, // 2.5 seconds
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      ttfb: 800, // 800ms
      fcp: 1800, // 1.8 seconds
    };

    return (
      (!metrics.lcp || metrics.lcp <= thresholds.lcp) &&
      (!metrics.fid || metrics.fid <= thresholds.fid) &&
      (!metrics.cls || metrics.cls <= thresholds.cls) &&
      (!metrics.ttfb || metrics.ttfb <= thresholds.ttfb) &&
      (!metrics.fcp || metrics.fcp <= thresholds.fcp)
    );
  },

  // Get performance score (0-100)
  getPerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    const weights = {
      lcp: 0.25,
      fid: 0.25,
      cls: 0.25,
      ttfb: 0.15,
      fcp: 0.10,
    };

    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
      fcp: { good: 1800, poor: 3000 },
    };

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = (metrics as any)[metric];
      if (value !== undefined) {
        const threshold = (thresholds as any)[metric];
        if (value > threshold.poor) {
          score -= weight * 100;
        } else if (value > threshold.good) {
          score -= weight * 50;
        }
      }
    });

    return Math.max(0, Math.round(score));
  },
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.init();
  
  // Make it globally available
  (window as any).performanceMonitor = performanceMonitor;
}

export default {
  PerformanceMonitor,
  performanceMonitor,
  usePerformanceMonitoring,
  performanceUtils,
}; 