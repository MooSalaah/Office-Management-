"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// مكونات التحميل المحسنة
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

const PageSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
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

// تحميل الصفحات الثقيلة بشكل ديناميكي
export const OptimizedFinancePage = dynamic(() => import('@/app/finance/page'), {
  loading: () => <PageSkeleton />,
  ssr: false, // تعطيل SSR للصفحات الثقيلة
})

export const OptimizedProjectsPage = dynamic(() => import('@/app/projects/page'), {
  loading: () => <PageSkeleton />,
})

export const OptimizedTasksPage = dynamic(() => import('@/app/tasks/page'), {
  loading: () => <PageSkeleton />,
})

export const OptimizedClientsPage = dynamic(() => import('@/app/clients/page'), {
  loading: () => <PageSkeleton />,
})

export const OptimizedSettingsPage = dynamic(() => import('@/app/settings/page'), {
  loading: () => <PageSkeleton />,
})

export const OptimizedAttendancePage = dynamic(() => import('@/app/attendance/page'), {
  loading: () => <PageSkeleton />,
})

// مكون محسن للصفحات مع Suspense
export const OptimizedPageWrapper: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback = <PageSkeleton /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Hook لتحسين تحميل الصفحات
export const useOptimizedPage = (pageName: string) => {
  const getPageComponent = () => {
    switch (pageName) {
      case 'finance':
        return OptimizedFinancePage
      case 'projects':
        return OptimizedProjectsPage
      case 'tasks':
        return OptimizedTasksPage
      case 'clients':
        return OptimizedClientsPage
      case 'settings':
        return OptimizedSettingsPage
      case 'attendance':
        return OptimizedAttendancePage
      default:
        return null
    }
  }

  return {
    Component: getPageComponent(),
    isLoading: false,
  }
} 