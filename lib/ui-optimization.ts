// نظام تحسين استجابة الواجهة
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Virtualization utilities for large lists
export interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
}

export interface VirtualizedItem<T> {
  index: number;
  data: T;
  style: React.CSSProperties;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
): {
  virtualizedItems: VirtualizedItem<T>[];
  containerStyle: React.CSSProperties;
  scrollTop: number;
  setScrollTop: (scrollTop: number) => void;
} {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualizedItems = useMemo(() => {
    const visibleItems: VirtualizedItem<T>[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visibleItems.push({
          index: i,
          data: items[i],
          style: {
            position: 'absolute',
            top: i * itemHeight,
            height: itemHeight,
            width: '100%',
          },
        });
      }
    }
    
    return visibleItems;
  }, [items, startIndex, endIndex, itemHeight]);

  const containerStyle: React.CSSProperties = {
    height: containerHeight,
    overflow: 'auto',
    position: 'relative',
  };

  return {
    virtualizedItems,
    containerStyle,
    scrollTop,
    setScrollTop,
  };
}

// Advanced memoization with deep comparison
export function useDeepMemo<T>(value: T, deps: unknown[]): T {
  const ref = useRef<{ value: T; deps: unknown[] }>();

  if (!ref.current || !areDepsEqual(ref.current.deps, deps)) {
    ref.current = { value, deps: [...deps] };
  }

  return ref.current.value;
}

function areDepsEqual(deps1: unknown[], deps2: unknown[]): boolean {
  if (deps1.length !== deps2.length) return false;
  
  return deps1.every((dep, index) => {
    const dep2 = deps2[index];
    if (dep === dep2) return true;
    if (typeof dep !== typeof dep2) return false;
    if (dep === null || dep2 === null) return dep === dep2;
    if (typeof dep === 'object') {
      return JSON.stringify(dep) === JSON.stringify(dep2);
    }
    return false;
  });
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: unknown[] = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    ((...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: unknown[] = []
): T {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        callback(...args);
        lastCallRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastCallRef.current = Date.now();
        }, delay - (now - lastCallRef.current));
      }
    }) as T,
    [callback, delay, ...deps]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): {
  ref: React.RefCallback<Element>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observerRef = useRef<IntersectionObserver>();

  const ref = useCallback(
    (element: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (element) {
        observerRef.current = new IntersectionObserver(([entry]) => {
          setEntry(entry);
          setIsIntersecting(entry.isIntersecting);
        }, options);

        observerRef.current.observe(element);
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, isIntersecting, entry };
}

// Resize Observer hook
export function useResizeObserver(): {
  ref: React.RefCallback<Element>;
  size: { width: number; height: number };
} {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver>();

  const ref = useCallback((element: Element | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (element) {
      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      });

      observerRef.current.observe(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, size };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCountRef.current} (${timeSinceLastRender.toFixed(2)}ms)`);
    }
  });

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender: performance.now() - lastRenderTimeRef.current,
  };
}

// Optimized list rendering with virtualization
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  renderItem: (item: VirtualizedItem<T>) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const { virtualizedItems, containerStyle, scrollTop, setScrollTop } = useVirtualization(
    items,
    { itemHeight, containerHeight, overscan }
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, [setScrollTop]);

  return (
    <div style={containerStyle} onScroll={handleScroll}>
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {virtualizedItems.map((item) => (
          <div key={item.index} style={item.style}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized grid rendering with virtualization
export function VirtualizedGrid<T>({
  items,
  renderItem,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  renderItem: (item: VirtualizedItem<T>) => React.ReactNode;
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const columnsPerRow = Math.floor(containerWidth / itemWidth);
  const rows = Math.ceil(items.length / columnsPerRow);
  const totalHeight = rows * itemHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endRow = Math.min(rows - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

  const virtualizedItems = useMemo(() => {
    const visibleItems: VirtualizedItem<T>[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        if (index < items.length) {
          visibleItems.push({
            index,
            data: items[index],
            style: {
              position: 'absolute',
              top: row * itemHeight,
              left: col * itemWidth,
              width: itemWidth,
              height: itemHeight,
            },
          });
        }
      }
    }
    
    return visibleItems;
  }, [items, startRow, endRow, columnsPerRow, itemWidth, itemHeight]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    setScrollLeft(event.currentTarget.scrollLeft);
  }, []);

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualizedItems.map((item) => (
          <div key={item.index} style={item.style}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized form with debounced validation
export function useOptimizedForm<T extends Record<string, unknown>>(
  initialValues: T,
  validationSchema?: Record<keyof T, (value: unknown) => string | null>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: unknown): string | null => {
      if (!validationSchema || !validationSchema[field]) return null;
      return validationSchema[field](value);
    },
    [validationSchema]
  );

  const debouncedValidate = useDebouncedCallback(
    (field: keyof T, value: unknown) => {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || undefined,
      }));
    },
    300
  );

  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      setValues(prev => ({ ...prev, [field]: value }));
      setTouched(prev => ({ ...prev, [field]: true }));
      debouncedValidate(field, value);
    },
    [debouncedValidate]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched(prev => ({ ...prev, [field]: true }));
      const error = validateField(field, values[field]);
      setErrors(prev => ({
        ...prev,
        [field]: error || undefined,
      }));
    },
    [validateField, values]
  );

  const isValid = useMemo(() => {
    if (!validationSchema) return true;
    return Object.keys(validationSchema).every(field => {
      const error = validateField(field as keyof T, values[field as keyof T]);
      return !error;
    });
  }, [validationSchema, validateField, values]);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    setTouched,
  };
}

// Auto-cleanup utilities
export const uiOptimization = {
  // Cleanup all observers and timeouts
  cleanup: () => {
    // This will be called when component unmounts
    // All hooks handle their own cleanup
  },

  // Performance monitoring
  measurePerformance: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    }
  },

  // Batch DOM updates
  batchUpdates: (updates: (() => void)[]) => {
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
      });
    } else {
      updates.forEach(update => update());
    }
  },
};

export default {
  useVirtualization,
  useDeepMemo,
  useDebouncedCallback,
  useThrottledCallback,
  useIntersectionObserver,
  useResizeObserver,
  usePerformanceMonitor,
  useOptimizedForm,
  VirtualizedList,
  VirtualizedGrid,
  uiOptimization,
}; 