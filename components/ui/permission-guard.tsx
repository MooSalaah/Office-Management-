"use client"

import { ReactNode, useEffect, useContext } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle } from "lucide-react"
import { hasPermission, canAccessModule } from "@/lib/auth"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { AppContext } from "@/lib/context/AppContext"
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton"

interface PermissionGuardProps {
  children: ReactNode
  requiredPermission?: string
  requiredAction?: string
  requiredModule?: string
  moduleName?: string
  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  requiredPermission,
  requiredAction = "view",
  requiredModule,
  moduleName,
  fallback
}: PermissionGuardProps) {
  const appContext = useContext(AppContext)
  if (!appContext) {
    // Context not available, show loading or fallback
    return <PageLoadingSkeleton />
  }
  const { state, isAuthLoading } = appContext
  const { refreshCurrentUser } = useAppActions()
  const { currentUser } = state

  useEffect(() => {
    if (!currentUser && !isAuthLoading) {
      refreshCurrentUser()
    }
  }, [currentUser, refreshCurrentUser, isAuthLoading])

  if (isAuthLoading) {
    return <PageLoadingSkeleton />
  }

  if (!currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return null
  }

  // Check specific permission if provided
  if (requiredPermission) {
    const hasSpecificPermission = hasPermission(currentUser.role, requiredAction, requiredModule || "", currentUser.permissions)
    if (!hasSpecificPermission) {
      return fallback || (
        <div className="max-w-screen-xl mx-auto space-y-6">
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Shield className="w-5 h-5 mr-2" />
                غير مصرح لك بالدخول
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  عذراً، غير مصرح لك بالدخول إلى {moduleName || "هذه الصفحة"}.
                  يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Check view permission for the module if no specific permission is provided
  if (requiredModule && !requiredPermission) {
    const hasViewPermission = hasPermission(currentUser.role, "view", requiredModule, currentUser.permissions)
    if (!hasViewPermission) {
      return fallback || (
        <div className="max-w-screen-xl mx-auto space-y-6">
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Shield className="w-5 h-5 mr-2" />
                غير مصرح لك بالدخول
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  عذراً، غير مصرح لك بالدخول إلى {moduleName || "هذه الصفحة"}.
                  يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Check module access if provided
  if (requiredModule) {
    const canAccess = canAccessModule(currentUser.role, requiredModule)
    if (!canAccess) {
      return fallback || (
        <div className="max-w-screen-xl mx-auto space-y-6">
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Shield className="w-5 h-5 mr-2" />
                غير مصرح لك بالدخول
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  عذراً، غير مصرح لك بالدخول إلى {moduleName || "هذه الصفحة"}.
                  يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}