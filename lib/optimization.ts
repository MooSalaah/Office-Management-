// Performance optimization utilities

// React optimization utilities
export const ReactOptimizations = {
  // Prevent unnecessary re-renders
  preventReRender: <T extends React.ComponentType<any>>(Component: T): T => {
    return React.memo(Component) as T
  },
  
  // Optimize list rendering
  optimizeList: <T>(items: T[], renderItem: (item: T, index: number) => React.ReactNode) => {
    return items.map((item, index) => (
      <React.Fragment key={index}>
        {renderItem(item, index)}
      </React.Fragment>
    ))
  },
  
  // Optimize conditional rendering
  optimizeConditional: (condition: boolean, component: React.ReactNode) => {
    return condition ? component : null
  },
  
  // Optimize dynamic imports
  optimizeDynamicImport: <T>(importFn: () => Promise<T>) => {
    return React.lazy(importFn)
  }
}

// Bundle optimization utilities
export const BundleOptimizations = {
  // Split large bundles
  splitBundle: (modules: Record<string, any>, maxSize: number = 1000000) => {
    const chunks: Record<string, any>[] = []
    let currentChunk: Record<string, any> = {}
    let currentSize = 0
    
    Object.entries(modules).forEach(([key, module]) => {
      const moduleSize = JSON.stringify(module).length
      
      if (currentSize + moduleSize > maxSize) {
        chunks.push(currentChunk)
        currentChunk = { [key]: module }
        currentSize = moduleSize
      } else {
        currentChunk[key] = module
        currentSize += moduleSize
      }
    })
    
    if (Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk)
    }
    
    return chunks
  },
  
  // Remove unused exports
  removeUnusedExports: (module: any, usedExports: string[]) => {
    const result: any = {}
    usedExports.forEach(exportName => {
      if (module[exportName] !== undefined) {
        result[exportName] = module[exportName]
      }
    })
    return result
  },
  
  // Optimize imports
  optimizeImports: (imports: Record<string, any>, usage: Record<string, boolean>) => {
    const optimized: Record<string, any> = {}
    
    Object.entries(imports).forEach(([key, value]) => {
      if (usage[key]) {
        optimized[key] = value
      }
    })
    
    return optimized
  }
}

// Memory optimization utilities
export const MemoryOptimizations = {
  // Clear unused references
  clearUnusedReferences: () => {
    if (typeof window !== 'undefined') {
      // Clear unused event listeners
      const elements = document.querySelectorAll('*')
      elements.forEach(element => {
        const clone = element.cloneNode(true)
        element.parentNode?.replaceChild(clone, element)
      })
      
      // Clear unused timers
      const highestTimeoutId = setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i)
      }
      
      const highestIntervalId = setInterval(() => {}, 0)
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i)
      }
    }
  },
  
  // Optimize object creation
  optimizeObjectCreation: <T>(factory: () => T, cache: Map<string, T> = new Map()) => {
    return (key: string): T => {
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const instance = factory()
      cache.set(key, instance)
      return instance
    }
  },
  
  // Optimize array operations
  optimizeArrayOperations: {
    // Use Set for unique values
    unique: <T>(array: T[]): T[] => {
      return Array.from(new Set(array))
    },
    
    // Use Map for key-value pairs
    groupBy: <T, K extends string | number>(array: T[], key: (item: T) => K): Record<K, T[]> => {
      const groups = new Map<K, T[]>()
      
      array.forEach(item => {
        const groupKey = key(item)
        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(item)
      })
      
      return Object.fromEntries(groups) as Record<K, T[]>
    },
    
    // Use WeakMap for object keys
    memoize: <T, U>(fn: (arg: T) => U): (arg: T) => U => {
      const cache = new WeakMap<object, U>()
      
      return (arg: T): U => {
        if (typeof arg === 'object' && arg !== null) {
          if (cache.has(arg as object)) {
            return cache.get(arg as object)!
          }
          const result = fn(arg)
          cache.set(arg as object, result)
          return result
        }
        return fn(arg)
      }
    }
  }
}

// Network optimization utilities
export const NetworkOptimizations = {
  // Optimize API calls
  optimizeApiCalls: {
    // Debounce API calls
    debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
      let timeoutId: NodeJS.Timeout
      
      return ((...args: any[]) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
      }) as T
    },
    
    // Throttle API calls
    throttle: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
      let lastCall = 0
      
      return ((...args: any[]) => {
        const now = Date.now()
        if (now - lastCall >= delay) {
          lastCall = now
          fn(...args)
        }
      }) as T
    },
    
    // Cache API responses
    cache: <T>(key: string, ttl: number = 5 * 60 * 1000) => {
      const cache = new Map<string, { value: T; timestamp: number }>()
      
      return {
        get: (): T | null => {
          const item = cache.get(key)
          if (!item) return null
          
          if (Date.now() - item.timestamp > ttl) {
            cache.delete(key)
            return null
          }
          
          return item.value
        },
        set: (value: T): void => {
          cache.set(key, { value, timestamp: Date.now() })
        }
      }
    }
  },
  
  // Optimize image loading
  optimizeImageLoading: {
    // Lazy load images
    lazyLoad: (src: string, placeholder?: string) => {
      const [loaded, setLoaded] = React.useState(false)
      const [error, setError] = React.useState(false)
      
      React.useEffect(() => {
        const img = new Image()
        img.onload = () => setLoaded(true)
        img.onerror = () => setError(true)
        img.src = src
      }, [src])
      
      if (error) return placeholder || 'Error loading image'
      if (!loaded) return placeholder || 'Loading...'
      return src
    },
    
    // Preload images
    preload: (srcs: string[]) => {
      srcs.forEach(src => {
        const img = new Image()
        img.src = src
      })
    },
    
    // Optimize image size
    optimizeSize: (src: string, width: number, height: number) => {
      // Add size parameters to URL if supported
      if (src.includes('?')) {
        return `${src}&w=${width}&h=${height}`
      }
      return `${src}?w=${width}&h=${height}`
    }
  }
}

// Rendering optimization utilities
export const RenderingOptimizations = {
  // Optimize list rendering
  optimizeListRendering: <T>(items: T[], renderItem: (item: T, index: number) => React.ReactNode) => {
    return React.useMemo(() => 
      items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      )), [items]
    )
  },
  
  // Optimize conditional rendering
  optimizeConditionalRendering: (condition: boolean, component: React.ReactNode) => {
    return React.useMemo(() => condition ? component : null, [condition])
  },
  
  // Optimize dynamic content
  optimizeDynamicContent: <T>(content: T, renderFn: (content: T) => React.ReactNode) => {
    return React.useMemo(() => renderFn(content), [content])
  },
  
  // Optimize form rendering
  optimizeFormRendering: (formData: any, renderForm: (data: any) => React.ReactNode) => {
    return React.useMemo(() => renderForm(formData), [formData])
  }
}

// State optimization utilities
export const StateOptimizations = {
  // Optimize state updates
  optimizeStateUpdates: {
    // Batch state updates
    batch: (updates: (() => void)[]) => {
      React.useEffect(() => {
        updates.forEach(update => update())
      }, [])
    },
    
    // Optimize object state
    optimizeObjectState: <T extends object>(initialState: T) => {
      const [state, setState] = React.useState<T>(initialState)
      
      const updateState = React.useCallback((updates: Partial<T>) => {
        setState(prev => ({ ...prev, ...updates }))
      }, [])
      
      return [state, updateState] as const
    },
    
    // Optimize array state
    optimizeArrayState: <T>(initialState: T[]) => {
      const [state, setState] = React.useState<T[]>(initialState)
      
      const addItem = React.useCallback((item: T) => {
        setState(prev => [...prev, item])
      }, [])
      
      const removeItem = React.useCallback((index: number) => {
        setState(prev => prev.filter((_, i) => i !== index))
      }, [])
      
      const updateItem = React.useCallback((index: number, item: T) => {
        setState(prev => prev.map((_, i) => i === index ? item : _))
      }, [])
      
      return [state, { addItem, removeItem, updateItem }] as const
    }
  },
  
  // Optimize context usage
  optimizeContext: <T>(context: React.Context<T>) => {
    return React.useContext(context)
  },
  
  // Optimize reducer usage
  optimizeReducer: <T, A>(reducer: React.Reducer<T, A>, initialState: T) => {
    return React.useReducer(reducer, initialState)
  }
}

// Effect optimization utilities
export const EffectOptimizations = {
  // Optimize useEffect
  optimizeUseEffect: (effect: () => void, deps: any[]) => {
    return React.useEffect(effect, deps)
  },
  
  // Optimize useLayoutEffect
  optimizeUseLayoutEffect: (effect: () => void, deps: any[]) => {
    return React.useLayoutEffect(effect, deps)
  },
  
  // Optimize useCallback
  optimizeUseCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]): T => {
    return React.useCallback(callback, deps)
  },
  
  // Optimize useMemo
  optimizeUseMemo: <T>(factory: () => T, deps: any[]): T => {
    return React.useMemo(factory, deps)
  }
}

// Event optimization utilities
export const EventOptimizations = {
  // Optimize event handlers
  optimizeEventHandler: <T extends Event>(handler: (event: T) => void, deps: any[] = []) => {
    return React.useCallback(handler, deps)
  },
  
  // Optimize form handlers
  optimizeFormHandler: (handler: (event: React.FormEvent) => void, deps: any[] = []) => {
    return React.useCallback(handler, deps)
  },
  
  // Optimize input handlers
  optimizeInputHandler: (handler: (event: React.ChangeEvent<HTMLInputElement>) => void, deps: any[] = []) => {
    return React.useCallback(handler, deps)
  },
  
  // Optimize click handlers
  optimizeClickHandler: (handler: (event: React.MouseEvent) => void, deps: any[] = []) => {
    return React.useCallback(handler, deps)
  }
}

// Component optimization utilities
export const ComponentOptimizations = {
  // Optimize functional components
  optimizeFunctionalComponent: <P extends object>(Component: React.ComponentType<P>) => {
    return React.memo(Component)
  },
  
  // Optimize class components
  optimizeClassComponent: <P extends object>(Component: React.ComponentClass<P>) => {
    return React.memo(Component)
  },
  
  // Optimize component props
  optimizeProps: <P extends object>(props: P) => {
    return React.useMemo(() => props, Object.values(props))
  },
  
  // Optimize component children
  optimizeChildren: (children: React.ReactNode) => {
    return React.useMemo(() => children, [children])
  }
}

// Hook optimization utilities
export const HookOptimizations = {
  // Optimize custom hooks
  optimizeCustomHook: <T>(hook: () => T) => {
    return React.useMemo(hook, [])
  },
  
  // Optimize hook dependencies
  optimizeDependencies: (deps: any[]) => {
    return React.useMemo(() => deps, deps)
  },
  
  // Optimize hook state
  optimizeHookState: <T>(initialState: T) => {
    return React.useState<T>(initialState)
  },
  
  // Optimize hook ref
  optimizeHookRef: <T>(initialValue: T) => {
    return React.useRef<T>(initialValue)
  }
}

// Performance monitoring utilities
export const PerformanceMonitoring = {
  // Monitor component render time
  monitorRenderTime: (componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`Component ${componentName} render time: ${duration.toFixed(2)}ms`)
      
      if (duration > 16) { // 60fps threshold
        console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`)
      }
    }
  },
  
  // Monitor function execution time
  monitorExecutionTime: <T extends (...args: any[]) => any>(fn: T, name: string): T => {
    return ((...args: any[]) => {
      const startTime = performance.now()
      const result = fn(...args)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`Function ${name} execution time: ${duration.toFixed(2)}ms`)
      
      return result
    }) as T
  },
  
  // Monitor memory usage
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('Memory usage:', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      })
    }
  }
} 