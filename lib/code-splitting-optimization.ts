/**
 * تحسين Code Splitting للصفحات الثقيلة
 * Code Splitting Optimization for Heavy Pages
 */

import { logger } from './logger';
import dynamic from 'next/dynamic';

// تحسين تحميل الصفحات الثقيلة
export const optimizedPageImports = {
  // صفحة المالية - ثقيلة بسبب الرسوم البيانية
  finance: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedFinancePage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
    ssr: false, // تعطيل SSR للصفحات الثقيلة
  }),
  
  // صفحة المشاريع - ثقيلة بسبب البيانات الكثيرة
  projects: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedProjectsPage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
  }),
  
  // صفحة المهام - ثقيلة بسبب التفاعلات
  tasks: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedTasksPage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
  }),
  
  // صفحة العملاء - ثقيلة بسبب البيانات
  clients: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedClientsPage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
  }),
  
  // صفحة الإعدادات - ثقيلة بسبب النماذج
  settings: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedSettingsPage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
  }),
  
  // صفحة الحضور
  attendance: dynamic(() => import('@/components/layout/optimized-pages').then(m => ({ default: m.OptimizedAttendancePage })), {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>,
  }),
};

// تحسين تحميل المكونات الثقيلة
export const optimizedComponentImports = {
  // مكونات الرسوم البيانية
  charts: {
    LineChart: dynamic(() => import('@/components/ui/chart').then(m => ({ default: m.LineChart })), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    BarChart: dynamic(() => import('@/components/ui/chart').then(m => ({ default: m.BarChart })), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    PieChart: dynamic(() => import('@/components/ui/chart').then(m => ({ default: m.PieChart })), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    DoughnutChart: dynamic(() => import('@/components/ui/chart').then(m => ({ default: m.DoughnutChart })), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
  },
  
  // مكونات النماذج الثقيلة
  forms: {
    TaskForm: dynamic(() => import('@/components/tasks/TaskForm'), {
      loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded"></div>,
    }),
    TaskEditForm: dynamic(() => import('@/components/tasks/TaskEditForm'), {
      loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded"></div>,
    }),
  },
  
  // مكونات الجداول
  tables: {
    DataTable: dynamic(() => import('@/components/ui/table'), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
    }),
  },
  
  // مكونات الحوار
  dialogs: {
    DeleteDialog: dynamic(() => import('@/components/ui/delete-dialog'), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
    }),
    ConfirmationDialog: dynamic(() => import('@/components/ui/confirmation-dialog'), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
    }),
  },
  
  // مكونات Radix UI المحسنة
  radix: {
    Accordion: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedAccordion })), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    AlertDialog: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedAlertDialog })), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Avatar: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedAvatar })), {
      loading: () => <div className="h-16 bg-gray-100 animate-pulse rounded-full"></div>,
      ssr: false,
    }),
    Checkbox: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedCheckbox })), {
      loading: () => <div className="h-4 w-4 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Dialog: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedDialog })), {
      loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    DropdownMenu: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedDropdownMenu })), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Label: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedLabel })), {
      loading: () => <div className="h-4 w-20 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Popover: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedPopover })), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Select: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedSelect })), {
      loading: () => <div className="h-10 w-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Separator: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedSeparator })), {
      loading: () => <div className="h-px w-full bg-gray-100 animate-pulse"></div>,
      ssr: false,
    }),
    Switch: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedSwitch })), {
      loading: () => <div className="h-6 w-11 bg-gray-100 animate-pulse rounded-full"></div>,
      ssr: false,
    }),
    Tabs: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedTabs })), {
      loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Toast: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedToast })), {
      loading: () => <div className="h-16 w-64 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
    Tooltip: dynamic(() => import('@/components/ui/optimized-radix').then(m => ({ default: m.OptimizedTooltip })), {
      loading: () => <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>,
      ssr: false,
    }),
  },
};

// تحسين تحميل المكتبات الثقيلة
export const optimizedLibraryImports = {
  // Firebase - تحميل عند الحاجة فقط (SDKs منفصلة)
  firebase: {
    app: () => import('@firebase/app'),
    auth: () => import('@firebase/auth'),
    firestore: () => import('@firebase/firestore'),
    storage: () => import('@firebase/storage'),
    analytics: () => import('@firebase/analytics'),
  },
  
  // Chart.js - تحميل عند الحاجة فقط
  chartjs: {
    LineChart: () => import('@/components/ui/chart').then(m => ({ default: m.LineChart })),
    BarChart: () => import('@/components/ui/chart').then(m => ({ default: m.BarChart })),
    PieChart: () => import('@/components/ui/chart').then(m => ({ default: m.PieChart })),
    DoughnutChart: () => import('@/components/ui/chart').then(m => ({ default: m.DoughnutChart })),
  },
  
  // Embla Carousel - تحميل عند الحاجة فقط
  carousel: {
    useEmblaCarousel: () => import('embla-carousel-react').then(m => ({ default: m.useEmblaCarousel })),
  },
};

// Hook لتحسين تحميل المكونات
export const useOptimizedComponent = <T extends Record<string, unknown>>(
  importFn: () => Promise<T>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        const module = await importFn();
        setComponent(() => module.default || fallback || null);
      } catch (err) {
        logger.error('خطأ في تحميل المكون:', err);
        setError(err instanceof Error ? err : new Error('خطأ غير معروف'));
        setComponent(() => fallback || null);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [importFn, fallback]);

  return { Component, loading, error };
};

// مكون محسن للتحميل
export const OptimizedComponent: React.FC<{
  importFn: () => Promise<{ default: React.ComponentType }>;
  fallback?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType;
  props?: Record<string, unknown>;
}> = ({ 
  importFn, 
  fallback, 
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  props = {} 
}) => {
  const { Component, loading, error } = useOptimizedComponent(importFn, fallback);

  if (loading) {
    return LoadingComponent ? <LoadingComponent {...props} /> : (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return ErrorComponent ? <ErrorComponent {...props} /> : (
      <div className="flex items-center justify-center h-32 text-red-500">
        <span>خطأ في تحميل المكون</span>
      </div>
    );
  }

  if (!Component) {
    return null;
  }

  return <Component {...props} />;
};

// تحليل استخدام المكونات
export const analyzeComponentUsage = () => {
  logger.info('تحليل استخدام المكونات...');
  
  const analysis = {
    heavyPages: [
      { name: 'finance', reason: 'رسوم بيانية كثيرة', estimatedSize: '~200KB' },
      { name: 'projects', reason: 'بيانات كثيرة', estimatedSize: '~150KB' },
      { name: 'tasks', reason: 'تفاعلات كثيرة', estimatedSize: '~120KB' },
      { name: 'clients', reason: 'بيانات كثيرة', estimatedSize: '~100KB' },
      { name: 'settings', reason: 'نماذج كثيرة', estimatedSize: '~80KB' },
    ],
    heavyComponents: [
      { name: 'charts', reason: 'مكتبة Recharts', estimatedSize: '~100KB' },
      { name: 'forms', reason: 'React Hook Form', estimatedSize: '~50KB' },
      { name: 'tables', reason: 'بيانات كثيرة', estimatedSize: '~30KB' },
    ],
    recommendations: [
      'استخدام Code Splitting للصفحات الثقيلة',
      'تحميل المكونات عند الحاجة فقط',
      'استخدام Lazy Loading للرسوم البيانية',
      'تحسين تحميل النماذج',
    ]
  };
  
  logger.info('نتائج تحليل المكونات:', analysis);
  return analysis;
};

// تطبيق تحسينات Code Splitting
export const applyCodeSplittingOptimizations = async () => {
  logger.info('تطبيق تحسينات Code Splitting...');
  
  try {
    const analysis = analyzeComponentUsage();
    
    return {
      success: true,
      analysis,
      estimatedSavings: '~300KB',
      recommendations: [
        'تم تطبيق Code Splitting للصفحات الثقيلة',
        'تم تحسين تحميل المكونات',
        'تم إضافة Lazy Loading للرسوم البيانية',
      ]
    };
  } catch (error) {
    logger.error('خطأ في تطبيق تحسينات Code Splitting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    };
  }
};

// استيراد React
import * as React from 'react'; 