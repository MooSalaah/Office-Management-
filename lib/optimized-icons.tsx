/**
 * تحسين استيراد الأيقونات من Lucide React
 * Optimized Icon Imports from Lucide React
 */

import { logger } from './logger';

// استيراد الأيقونات المستخدمة فقط
export const Icons = {
  // Navigation
  Home: () => import('lucide-react').then(m => ({ default: m.Home })),
  Settings: () => import('lucide-react').then(m => ({ default: m.Settings })),
  User: () => import('lucide-react').then(m => ({ default: m.User })),
  Users: () => import('lucide-react').then(m => ({ default: m.Users })),
  Building2: () => import('lucide-react').then(m => ({ default: m.Building2 })),
  
  // Actions
  Plus: () => import('lucide-react').then(m => ({ default: m.Plus })),
  Edit: () => import('lucide-react').then(m => ({ default: m.Edit })),
  Edit2: () => import('lucide-react').then(m => ({ default: m.Edit2 })),
  Trash2: () => import('lucide-react').then(m => ({ default: m.Trash2 })),
  Search: () => import('lucide-react').then(m => ({ default: m.Search })),
  X: () => import('lucide-react').then(m => ({ default: m.X })),
  
  // Status
  Check: () => import('lucide-react').then(m => ({ default: m.Check })),
  CheckCircle: () => import('lucide-react').then(m => ({ default: m.CheckCircle })),
  Circle: () => import('lucide-react').then(m => ({ default: m.Circle })),
  AlertCircle: () => import('lucide-react').then(m => ({ default: m.AlertCircle })),
  AlertTriangle: () => import('lucide-react').then(m => ({ default: m.AlertTriangle })),
  
  // UI
  ChevronDown: () => import('lucide-react').then(m => ({ default: m.ChevronDown })),
  ChevronUp: () => import('lucide-react').then(m => ({ default: m.ChevronUp })),
  ChevronLeft: () => import('lucide-react').then(m => ({ default: m.ChevronLeft })),
  ChevronRight: () => import('lucide-react').then(m => ({ default: m.ChevronRight })),
  MoreHorizontal: () => import('lucide-react').then(m => ({ default: m.MoreHorizontal })),
  Menu: () => import('lucide-react').then(m => ({ default: m.Menu })),
  PanelLeft: () => import('lucide-react').then(m => ({ default: m.PanelLeft })),
  
  // Data
  Calendar: () => import('lucide-react').then(m => ({ default: m.Calendar })),
  Clock: () => import('lucide-react').then(m => ({ default: m.Clock })),
  Eye: () => import('lucide-react').then(m => ({ default: m.Eye })),
  Move: () => import('lucide-react').then(m => ({ default: m.Move })),
  PlayCircle: () => import('lucide-react').then(m => ({ default: m.PlayCircle })),
  
  // Finance
  DollarSign: () => import('lucide-react').then(m => ({ default: m.DollarSign })),
  TrendingUp: () => import('lucide-react').then(m => ({ default: m.TrendingUp })),
  TrendingDown: () => import('lucide-react').then(m => ({ default: m.TrendingDown })),
  
  // Connection
  Wifi: () => import('lucide-react').then(m => ({ default: m.Wifi })),
  WifiOff: () => import('lucide-react').then(m => ({ default: m.WifiOff })),
  RefreshCw: () => import('lucide-react').then(m => ({ default: m.RefreshCw })),
  XCircle: () => import('lucide-react').then(m => ({ default: m.XCircle })),
  
  // Security
  Shield: () => import('lucide-react').then(m => ({ default: m.Shield })),
  Lock: () => import('lucide-react').then(m => ({ default: m.Lock })),
  
  // Carousel
  ArrowLeft: () => import('lucide-react').then(m => ({ default: m.ArrowLeft })),
  ArrowRight: () => import('lucide-react').then(m => ({ default: m.ArrowRight })),
  
  // Other
  Dot: () => import('lucide-react').then(m => ({ default: m.Dot })),
  GripVertical: () => import('lucide-react').then(m => ({ default: m.GripVertical })),
  Home: () => import('lucide-react').then(m => ({ default: m.Home }))
};

// Hook لاستخدام الأيقونات المحسنة
export const useOptimizedIcon = (iconName: keyof typeof Icons) => {
  const [IconComponent, setIconComponent] = React.useState<React.ComponentType | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadIcon = async () => {
      try {
        setLoading(true);
        const iconModule = await Icons[iconName]();
        setIconComponent(() => iconModule.default);
      } catch (error) {
        logger.error(`خطأ في تحميل الأيقونة ${iconName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadIcon();
  }, [iconName]);

  return { IconComponent, loading };
};

// مكون محسن للأيقونات
export const OptimizedIcon: React.FC<{
  name: keyof typeof Icons;
  className?: string;
  size?: number;
}> = ({ name, className, size = 16 }) => {
  const { IconComponent, loading } = useOptimizedIcon(name);

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={{ width: size, height: size }} />;
  }

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={className} size={size} />;
};

// استيراد React
import * as React from 'react'; 