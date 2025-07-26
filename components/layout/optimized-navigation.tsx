"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FolderOpen,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Clock,
  Home,
} from 'lucide-react'
import { OptimizedPageWrapper } from './optimized-pages'
import { logger } from '@/lib/logger'

// تعريف الصفحات مع أيقوناتها
const pages = [
  { name: 'dashboard', path: '/dashboard', icon: Home, label: 'لوحة التحكم' },
  { name: 'projects', path: '/projects', icon: FolderOpen, label: 'المشاريع' },
  { name: 'clients', path: '/clients', icon: Users, label: 'العملاء' },
  { name: 'tasks', path: '/tasks', icon: Clock, label: 'المهام' },
  { name: 'finance', path: '/finance', icon: DollarSign, label: 'المالية' },
  { name: 'attendance', path: '/attendance', icon: Calendar, label: 'الحضور' },
  { name: 'settings', path: '/settings', icon: Settings, label: 'الإعدادات' },
]

// مكون التحميل المحسن
const NavigationSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// مكون التنقل المحسن
export const OptimizedNavigation: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [currentPage, setCurrentPage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const page = pages.find(p => p.path === pathname)
    if (page) {
      setCurrentPage(page.name)
      logger.debug(`تم تحميل الصفحة: ${page.name}`)
    }
  }, [pathname])

  const handleNavigation = async (pageName: string, path: string) => {
    try {
      setIsLoading(true)
      logger.info(`جاري الانتقال إلى: ${pageName}`)
      
      // تحميل مسبق للصفحة
      await preloadPage(pageName)
      
      // الانتقال إلى الصفحة
      router.push(path)
      setCurrentPage(pageName)
      
      logger.info(`تم الانتقال بنجاح إلى: ${pageName}`)
    } catch (error) {
      logger.error(`خطأ في الانتقال إلى ${pageName}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // تحميل مسبق للصفحات
  const preloadPage = async (pageName: string) => {
    try {
      switch (pageName) {
        case 'finance':
          await import('@/app/finance/page')
          break
        case 'projects':
          await import('@/app/projects/page')
          break
        case 'tasks':
          await import('@/app/tasks/page')
          break
        case 'clients':
          await import('@/app/clients/page')
          break
        case 'settings':
          await import('@/app/settings/page')
          break
        case 'attendance':
          await import('@/app/attendance/page')
          break
        default:
          break
      }
    } catch (error) {
      logger.warn(`فشل في التحميل المسبق للصفحة ${pageName}:`, error)
    }
  }

  return (
    <div className="space-y-4">
      {/* أزرار التنقل */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {pages.map((page) => {
          const Icon = page.icon
          const isActive = currentPage === page.name
          
          return (
            <Button
              key={page.name}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleNavigation(page.name, page.path)}
              disabled={isLoading}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{page.label}</span>
            </Button>
          )
        })}
      </div>

      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">جاري التحميل...</span>
        </div>
      )}
    </div>
  )
}

// Hook لتحسين التنقل
export const useOptimizedNavigation = () => {
  const [preloadedPages, setPreloadedPages] = useState<Set<string>>(new Set())

  const preloadPage = async (pageName: string) => {
    if (preloadedPages.has(pageName)) return

    try {
      logger.debug(`جاري التحميل المسبق للصفحة: ${pageName}`)
      
      switch (pageName) {
        case 'finance':
          await import('@/app/finance/page')
          break
        case 'projects':
          await import('@/app/projects/page')
          break
        case 'tasks':
          await import('@/app/tasks/page')
          break
        case 'clients':
          await import('@/app/clients/page')
          break
        case 'settings':
          await import('@/app/settings/page')
          break
        case 'attendance':
          await import('@/app/attendance/page')
          break
        default:
          break
      }
      
      setPreloadedPages(prev => new Set(prev).add(pageName))
      logger.debug(`تم التحميل المسبق بنجاح للصفحة: ${pageName}`)
    } catch (error) {
      logger.error(`فشل في التحميل المسبق للصفحة ${pageName}:`, error)
    }
  }

  const preloadAllPages = async () => {
    const pageNames = ['finance', 'projects', 'tasks', 'clients', 'settings', 'attendance']
    
    logger.info('جاري التحميل المسبق لجميع الصفحات...')
    
    await Promise.allSettled(
      pageNames.map(pageName => preloadPage(pageName))
    )
    
    logger.info('تم التحميل المسبق لجميع الصفحات')
  }

  return {
    preloadPage,
    preloadAllPages,
    preloadedPages: Array.from(preloadedPages),
  }
} 