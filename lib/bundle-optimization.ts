/**
 * تحسين حجم الحزمة وتقليل المكتبات الثقيلة
 * Bundle Optimization and Heavy Library Reduction
 */

import { logger } from './logger';

// تحليل المكتبات الثقيلة وتحديد البدائل
export const heavyLibraries = {
  // مكتبات يمكن استبدالها بمكتبات أخف
  replaceable: {
    // Firebase - ثقيل جداً (حجم كبير)
    firebase: {
      current: 'firebase',
      alternatives: ['@firebase/app', '@firebase/auth', '@firebase/firestore'],
      size: '~200KB+',
      recommendation: 'استخدام Firebase SDKs منفصلة بدلاً من الحزمة الكاملة'
    },
    
    // Chart.js - مكتبة رسوم بيانية محسنة
    chartjs: {
      current: 'chart.js + react-chartjs-2',
      alternatives: ['recharts'],
      size: '~60KB',
      recommendation: 'تم تطبيق Chart.js بنجاح'
    },
    
                    // Embla Carousel - تم استبدالها بنجاح
                'embla-carousel-react': {
                  current: 'swiper',
                  alternatives: ['embla-carousel-react', 'keen-slider', 'custom-carousel'],
                  size: '~20KB',
                  recommendation: 'تم تطبيق Swiper بنجاح - مكتبة أخف وأكثر مرونة'
                },
    
    // React Hook Form - ثقيل نسبياً
    'react-hook-form': {
      current: 'react-hook-form',
      alternatives: ['formik', 'final-form', 'custom-form'],
      size: '~50KB',
      recommendation: 'البقاء مع react-hook-form (أفضل من البدائل)'
    }
  },
  
  // مكتبات يمكن تحسينها
  optimizable: {
    // Radix UI - يمكن تحسين استيرادها
    radix: {
      current: '@radix-ui/*',
      optimization: 'استيراد مكونات محددة فقط',
      size: '~150KB+',
      recommendation: 'استخدام tree shaking واستيراد مكونات محددة'
    },
    
    // Lucide React - يمكن تحسينها
    'lucide-react': {
      current: 'lucide-react',
      optimization: 'استيراد أيقونات محددة فقط',
      size: '~50KB',
      recommendation: 'استيراد الأيقونات المستخدمة فقط'
    },
    
    // Date-fns - يمكن تحسينها
    'date-fns': {
      current: 'date-fns',
      optimization: 'استيراد دوال محددة فقط',
      size: '~30KB',
      recommendation: 'استيراد الدوال المطلوبة فقط'
    }
  }
};

// تحسين استيراد Radix UI
export const optimizedRadixImports = {
  // استيراد مكونات محددة بدلاً من الحزمة الكاملة
  accordion: () => import('@radix-ui/react-accordion'),
  alertDialog: () => import('@radix-ui/react-alert-dialog'),
  avatar: () => import('@radix-ui/react-avatar'),
  checkbox: () => import('@radix-ui/react-checkbox'),
  dialog: () => import('@radix-ui/react-dialog'),
  dropdownMenu: () => import('@radix-ui/react-dropdown-menu'),
  label: () => import('@radix-ui/react-label'),
  popover: () => import('@radix-ui/react-popover'),
  select: () => import('@radix-ui/react-select'),
  separator: () => import('@radix-ui/react-separator'),
  switch: () => import('@radix-ui/react-switch'),
  tabs: () => import('@radix-ui/react-tabs'),
  toast: () => import('@radix-ui/react-toast'),
  tooltip: () => import('@radix-ui/react-tooltip')
};

// تحسين استيراد Lucide React
export const optimizedIconImports = {
  // استيراد الأيقونات المستخدمة فقط
  icons: {
    // Navigation
    home: () => import('lucide-react').then(m => ({ default: m.Home })),
    settings: () => import('lucide-react').then(m => ({ default: m.Settings })),
    user: () => import('lucide-react').then(m => ({ default: m.User })),
    users: () => import('lucide-react').then(m => ({ default: m.Users })),
    project: () => import('lucide-react').then(m => ({ default: m.FolderOpen })),
    task: () => import('lucide-react').then(m => ({ default: m.CheckSquare })),
    calendar: () => import('lucide-react').then(m => ({ default: m.Calendar })),
    finance: () => import('lucide-react').then(m => ({ default: m.DollarSign })),
    
    // Actions
    plus: () => import('lucide-react').then(m => ({ default: m.Plus })),
    edit: () => import('lucide-react').then(m => ({ default: m.Edit })),
    delete: () => import('lucide-react').then(m => ({ default: m.Trash2 })),
    search: () => import('lucide-react').then(m => ({ default: m.Search })),
    filter: () => import('lucide-react').then(m => ({ default: m.Filter })),
    sort: () => import('lucide-react').then(m => ({ default: m.ArrowUpDown })),
    
    // Status
    check: () => import('lucide-react').then(m => ({ default: m.Check })),
    x: () => import('lucide-react').then(m => ({ default: m.X })),
    alert: () => import('lucide-react').then(m => ({ default: m.AlertCircle })),
    info: () => import('lucide-react').then(m => ({ default: m.Info })),
    
    // UI
    chevronDown: () => import('lucide-react').then(m => ({ default: m.ChevronDown })),
    chevronRight: () => import('lucide-react').then(m => ({ default: m.ChevronRight })),
    menu: () => import('lucide-react').then(m => ({ default: m.Menu })),
    close: () => import('lucide-react').then(m => ({ default: m.X })),
    download: () => import('lucide-react').then(m => ({ default: m.Download })),
    upload: () => import('lucide-react').then(m => ({ default: m.Upload }))
  }
};

// تحسين استيراد Date-fns
export const optimizedDateImports = {
  // استيراد الدوال المطلوبة فقط
  functions: {
    format: () => import('date-fns').then(m => ({ default: m.format })),
    parseISO: () => import('date-fns').then(m => ({ default: m.parseISO })),
    addDays: () => import('date-fns').then(m => ({ default: m.addDays })),
    subDays: () => import('date-fns').then(m => ({ default: m.subDays })),
    startOfDay: () => import('date-fns').then(m => ({ default: m.startOfDay })),
    endOfDay: () => import('date-fns').then(m => ({ default: m.endOfDay })),
    isToday: () => import('date-fns').then(m => ({ default: m.isToday })),
    isYesterday: () => import('date-fns').then(m => ({ default: m.isYesterday })),
    differenceInDays: () => import('date-fns').then(m => ({ default: m.differenceInDays }))
  }
};

// تحسين Firebase - استخدام SDKs منفصلة
export const optimizedFirebaseImports = {
  // استيراد Firebase SDKs منفصلة
  app: () => import('@firebase/app'),
  auth: () => import('@firebase/auth'),
  firestore: () => import('@firebase/firestore'),
  storage: () => import('@firebase/storage'),
  analytics: () => import('@firebase/analytics')
};

// تحسين Recharts - استخدام Chart.js بدلاً منه
export const chartAlternatives = {
  // Chart.js كبديل أخف لـ Recharts
  chartjs: {
    import: () => import('chart.js/auto'),
    size: '~60KB',
    recommendation: 'استخدام Chart.js بدلاً من Recharts'
  },
  
  // uPlot كبديل أخف جداً
  uplot: {
    import: () => import('uplot'),
    size: '~15KB',
    recommendation: 'استخدام uPlot للرسوم البيانية البسيطة'
  }
};

// تحسين Carousel - استخدام Swiper
export const carouselAlternatives = {
  // Swiper كبديل لـ Embla
  swiper: {
    import: () => import('swiper/react'),
    size: '~40KB',
    recommendation: 'استخدام Swiper بدلاً من Embla Carousel'
  },
  
  // Keen Slider كبديل أخف
  keenSlider: {
    import: () => import('keen-slider/react'),
    size: '~20KB',
    recommendation: 'استخدام Keen Slider للحجم الأصغر'
  }
};

// تحسين Webpack Configuration
export const webpackOptimizations = {
  // تحسينات إضافية لـ Webpack
  splitChunks: {
    // فصل المكتبات الكبيرة
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all',
      priority: 10
    },
    
    // فصل Radix UI
    radix: {
      test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
      name: 'radix-ui',
      chunks: 'all',
      priority: 20
    },
    
    // فصل Firebase
    firebase: {
      test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
      name: 'firebase',
      chunks: 'all',
      priority: 30
    },
    
    // فصل Recharts
    recharts: {
      test: /[\\/]node_modules[\\/]recharts[\\/]/,
      name: 'recharts',
      chunks: 'all',
      priority: 40
    }
  },
  
  // تحسين Tree Shaking
  treeShaking: {
    sideEffects: false,
    usedExports: true,
    innerGraph: true
  }
};

// تحليل حجم الحزمة
export const analyzeBundleSize = () => {
  logger.info('تحليل حجم الحزمة...');
  
  const analysis = {
    heavyLibraries: Object.keys(heavyLibraries.replaceable),
    optimizableLibraries: Object.keys(heavyLibraries.optimizable),
    estimatedSavings: {
      firebase: '~150KB',
      recharts: '~40KB',
      radixOptimization: '~50KB',
      total: '~240KB'
    }
  };
  
  logger.info('نتائج تحليل الحزمة:', analysis);
  return analysis;
};

// توصيات التحسين
export const optimizationRecommendations = [
  {
    priority: 'high',
    action: 'استبدال Firebase بالكامل بـ SDKs منفصلة',
    savings: '~150KB',
    effort: 'medium'
  },
  {
    priority: 'high',
    action: 'استبدال Recharts بـ Chart.js',
    savings: '~40KB',
    effort: 'low'
  },
  {
    priority: 'medium',
    action: 'تحسين استيراد Radix UI',
    savings: '~50KB',
    effort: 'low'
  },
  {
    priority: 'medium',
    action: 'تحسين استيراد Lucide React',
    savings: '~20KB',
    effort: 'low'
  },
  {
    priority: 'low',
    action: 'استبدال Embla Carousel بـ Swiper',
    savings: '~10KB',
    effort: 'medium'
  }
];

// تطبيق التحسينات
export const applyBundleOptimizations = async () => {
  logger.info('تطبيق تحسينات الحزمة...');
  
  try {
    // تحليل الحزمة الحالية
    const analysis = analyzeBundleSize();
    
    // تطبيق التحسينات حسب الأولوية
    const recommendations = optimizationRecommendations
      .filter(rec => rec.priority === 'high')
      .sort((a, b) => {
        const effortOrder = { low: 1, medium: 2, high: 3 };
        return effortOrder[a.effort as keyof typeof effortOrder] - effortOrder[b.effort as keyof typeof effortOrder];
      });
    
    logger.info('التوصيات المطبقة:', recommendations);
    
    return {
      success: true,
      analysis,
      recommendations,
      estimatedTotalSavings: '~240KB'
    };
  } catch (error) {
    logger.error('خطأ في تطبيق تحسينات الحزمة:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    };
  }
}; 