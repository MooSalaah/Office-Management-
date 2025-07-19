// Bundling utilities for performance optimization

// Bundle configuration
export const BundleConfig = {
  // Entry points
  entryPoints: {
    main: './app/layout.tsx',
    dashboard: './app/dashboard/page.tsx',
    projects: './app/projects/page.tsx',
    clients: './app/clients/page.tsx',
    tasks: './app/tasks/page.tsx',
    finance: './app/finance/page.tsx',
    attendance: './app/attendance/page.tsx',
    settings: './app/settings/page.tsx'
  },
  
  // Output configuration
  output: {
    path: './dist',
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    assetModuleFilename: '[name].[contenthash].[ext]'
  },
  
  // Optimization settings
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic'
  }
}

// Bundle analysis utilities
export const BundleAnalysis = {
  // Analyze bundle size
  analyzeBundleSize: (bundle: any) => {
    const analysis = {
      totalSize: 0,
      chunkSizes: {} as Record<string, number>,
      moduleSizes: {} as Record<string, number>,
      duplicateModules: [] as string[],
      unusedModules: [] as string[]
    }
    
    // Calculate total size
    Object.values(bundle).forEach((chunk: any) => {
      analysis.totalSize += chunk.size || 0
    })
    
    return analysis
  },
  
  // Find duplicate modules
  findDuplicateModules: (bundle: any) => {
    const moduleCounts = {} as Record<string, number>
    const duplicates = [] as string[]
    
    Object.values(bundle).forEach((chunk: any) => {
      if (chunk.modules) {
        chunk.modules.forEach((module: any) => {
          moduleCounts[module.name] = (moduleCounts[module.name] || 0) + 1
        })
      }
    })
    
    Object.entries(moduleCounts).forEach(([name, count]) => {
      if (count > 1) {
        duplicates.push(name)
      }
    })
    
    return duplicates
  },
  
  // Find unused modules
  findUnusedModules: (bundle: any, usedModules: string[]) => {
    const allModules = new Set<string>()
    const unused = [] as string[]
    
    Object.values(bundle).forEach((chunk: any) => {
      if (chunk.modules) {
        chunk.modules.forEach((module: any) => {
          allModules.add(module.name)
        })
      }
    })
    
    allModules.forEach(module => {
      if (!usedModules.includes(module)) {
        unused.push(module)
      }
    })
    
    return unused
  }
}

// Code splitting utilities
export const CodeSplitting = {
  // Dynamic imports
  dynamicImport: <T>(importFn: () => Promise<T>): React.LazyExoticComponent<T> => {
    return React.lazy(importFn)
  },
  
  // Route-based splitting
  routeBasedSplitting: {
    dashboard: () => import('./app/dashboard/page'),
    projects: () => import('./app/projects/page'),
    clients: () => import('./app/clients/page'),
    tasks: () => import('./app/tasks/page'),
    finance: () => import('./app/finance/page'),
    attendance: () => import('./app/attendance/page'),
    settings: () => import('./app/settings/page')
  },
  
  // Component-based splitting
  componentBasedSplitting: {
    // Dashboard components
    DashboardStats: () => import('./components/dashboard/DashboardStats'),
    DashboardCharts: () => import('./components/dashboard/DashboardCharts'),
    RecentActivities: () => import('./components/dashboard/RecentActivities'),
    
    // Project components
    ProjectList: () => import('./components/projects/ProjectList'),
    ProjectCard: () => import('./components/projects/ProjectCard'),
    ProjectForm: () => import('./components/projects/ProjectForm'),
    
    // Task components
    TaskList: () => import('./components/tasks/TaskList'),
    TaskCard: () => import('./components/tasks/TaskCard'),
    TaskForm: () => import('./components/tasks/TaskForm'),
    
    // Client components
    ClientList: () => import('./components/clients/ClientList'),
    ClientCard: () => import('./components/clients/ClientCard'),
    ClientForm: () => import('./components/clients/ClientForm'),
    
    // Finance components
    FinanceDashboard: () => import('./components/finance/FinanceDashboard'),
    TransactionList: () => import('./components/finance/TransactionList'),
    TransactionForm: () => import('./components/finance/TransactionForm'),
    
    // Settings components
    SettingsPanel: () => import('./components/settings/SettingsPanel'),
    UserManagement: () => import('./components/settings/UserManagement'),
    SystemSettings: () => import('./components/settings/SystemSettings')
  },
  
  // Feature-based splitting
  featureBasedSplitting: {
    // Authentication feature
    auth: {
      LoginForm: () => import('./components/auth/LoginForm'),
      RegisterForm: () => import('./components/auth/RegisterForm'),
      PasswordReset: () => import('./components/auth/PasswordReset')
    },
    
    // Dashboard feature
    dashboard: {
      Stats: () => import('./components/dashboard/Stats'),
      Charts: () => import('./components/dashboard/Charts'),
      Activities: () => import('./components/dashboard/Activities')
    },
    
    // Project management feature
    projects: {
      List: () => import('./components/projects/List'),
      Details: () => import('./components/projects/Details'),
      Form: () => import('./components/projects/Form')
    },
    
    // Task management feature
    tasks: {
      List: () => import('./components/tasks/List'),
      Details: () => import('./components/tasks/Details'),
      Form: () => import('./components/tasks/Form')
    },
    
    // Client management feature
    clients: {
      List: () => import('./components/clients/List'),
      Details: () => import('./components/clients/Details'),
      Form: () => import('./components/clients/Form')
    },
    
    // Finance management feature
    finance: {
      Dashboard: () => import('./components/finance/Dashboard'),
      Transactions: () => import('./components/finance/Transactions'),
      Reports: () => import('./components/finance/Reports')
    },
    
    // Settings feature
    settings: {
      General: () => import('./components/settings/General'),
      Users: () => import('./components/settings/Users'),
      System: () => import('./components/settings/System')
    }
  }
}

// Bundle optimization utilities
export const BundleOptimization = {
  // Tree shaking
  treeShaking: {
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
    
    // Remove unused imports
    removeUnusedImports: (code: string, usedImports: string[]) => {
      // This would require AST parsing in a real implementation
      return code
    }
  },
  
  // Dead code elimination
  deadCodeElimination: {
    // Remove unreachable code
    removeUnreachableCode: (code: string) => {
      // This would require AST parsing in a real implementation
      return code
    },
    
    // Remove unused variables
    removeUnusedVariables: (code: string) => {
      // This would require AST parsing in a real implementation
      return code
    }
  },
  
  // Module concatenation
  moduleConcatenation: {
    // Concatenate modules
    concatenateModules: (modules: any[]) => {
      return modules.reduce((concatenated, module) => {
        return concatenated + '\n' + module
      }, '')
    },
    
    // Split large modules
    splitLargeModules: (module: any, maxSize: number = 1000000) => {
      const chunks = []
      let currentChunk = ''
      let currentSize = 0
      
      const lines = module.split('\n')
      
      lines.forEach(line => {
        const lineSize = line.length
        
        if (currentSize + lineSize > maxSize) {
          chunks.push(currentChunk)
          currentChunk = line
          currentSize = lineSize
        } else {
          currentChunk += '\n' + line
          currentSize += lineSize
        }
      })
      
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      
      return chunks
    }
  }
}

// Bundle loading utilities
export const BundleLoading = {
  // Preload bundles
  preloadBundle: (bundleName: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = `/static/js/${bundleName}.js`
    document.head.appendChild(link)
  },
  
  // Prefetch bundles
  prefetchBundle: (bundleName: string) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'script'
    link.href = `/static/js/${bundleName}.js`
    document.head.appendChild(link)
  },
  
  // Load bundle dynamically
  loadBundle: async (bundleName: string) => {
    try {
      const script = document.createElement('script')
      script.src = `/static/js/${bundleName}.js`
      script.async = true
      
      return new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error(`Failed to load bundle: ${bundleName}`, error)
      throw error
    }
  },
  
  // Load bundle with fallback
  loadBundleWithFallback: async (bundleName: string, fallback: () => void) => {
    try {
      await BundleLoading.loadBundle(bundleName)
    } catch (error) {
      console.warn(`Bundle ${bundleName} failed to load, using fallback`)
      fallback()
    }
  }
}

// Bundle monitoring utilities
export const BundleMonitoring = {
  // Monitor bundle load time
  monitorBundleLoadTime: (bundleName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      console.log(`Bundle ${bundleName} load time: ${loadTime.toFixed(2)}ms`)
      
      if (loadTime > 1000) {
        console.warn(`Slow bundle load: ${bundleName} took ${loadTime.toFixed(2)}ms`)
      }
    }
  },
  
  // Monitor bundle size
  monitorBundleSize: (bundleName: string, size: number) => {
    console.log(`Bundle ${bundleName} size: ${(size / 1024).toFixed(2)}KB`)
    
    if (size > 1024 * 1024) { // 1MB
      console.warn(`Large bundle: ${bundleName} is ${(size / 1024 / 1024).toFixed(2)}MB`)
    }
  },
  
  // Monitor bundle cache hit rate
  monitorBundleCacheHitRate: (bundleName: string, cacheHit: boolean) => {
    if (cacheHit) {
      console.log(`Bundle ${bundleName} served from cache`)
    } else {
      console.log(`Bundle ${bundleName} loaded from network`)
    }
  }
}

// Bundle utilities for React
export const ReactBundleUtilities = {
  // Lazy load component with loading state
  lazyLoadWithLoading: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    LoadingComponent: React.ComponentType = () => <div>Loading...</div>
  ) => {
    const LazyComponent = React.lazy(importFn)
    
    return (props: React.ComponentProps<T>) => (
      <React.Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  },
  
  // Lazy load component with error boundary
  lazyLoadWithErrorBoundary: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    ErrorComponent: React.ComponentType = () => <div>Error loading component</div>
  ) => {
    const LazyComponent = React.lazy(importFn)
    
    return (props: React.ComponentProps<T>) => (
      <ErrorBoundary fallback={<ErrorComponent />}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent {...props} />
        </React.Suspense>
      </ErrorBoundary>
    )
  },
  
  // Preload component
  preloadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    importFn()
  }
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Bundle error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <this.props.fallback />
    }
    
    return this.props.children
  }
} 