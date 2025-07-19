"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  LayoutDashboard,
  FolderOpen,
  Users,
  CheckSquare,
  DollarSign,
  Clock,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Eye,
  Trash2,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { updateUserPermissionsByRole } from "@/lib/auth"
import { hasPermission } from "@/lib/auth"

const navigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "المشاريع", href: "/projects", icon: FolderOpen, permission: "projects" },
  { name: "العملاء", href: "/clients", icon: Users, permission: "clients" },
  { name: "المهام", href: "/tasks", icon: CheckSquare, permission: "tasks" },
  { name: "المالية", href: "/finance", icon: DollarSign, permission: "finance" },
  { name: "الحضور", href: "/attendance", icon: Clock, permission: "attendance" },
  { name: "الإعدادات", href: "/settings", icon: Settings, permission: "settings" },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lastClick, setLastClick] = useState<{ id: string; time: number } | null>(null)
  const { state } = useApp()
  const { markNotificationAsRead, deleteNotification, logout: logoutAction } = useAppActions()
  const { currentUser, notifications, companySettings } = state

  // Force re-render when currentUser changes
  const [, forceUpdate] = useState({})

  useEffect(() => {
    // Force re-render when currentUser changes to update role display
    forceUpdate({})
    
    // Update current user permissions if exists
    if (currentUser) {
      const updatedUser = updateUserPermissionsByRole(currentUser)
      if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        // Update currentUser in localStorage and state
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    }
  }, [currentUser])

  const handleLogout = () => {
    logoutAction()
    // Force redirect to login page
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  const handleNotificationClick = (notificationId: string) => {
    const now = Date.now()
    
    if (lastClick && lastClick.id === notificationId && (now - lastClick.time) < 300) {
      // Double click - delete notification
      deleteNotification(notificationId)
      setLastClick(null)
    } else {
      // Single click - mark as read
      markNotificationAsRead(notificationId)
      setLastClick({ id: notificationId, time: now })
    }
  }

  const userNotifications = notifications.filter((n) => n.userId === currentUser?.id)
  const unreadCount = userNotifications.filter((n) => !n.isRead).length

  const filteredNavigation = navigation.filter((item) =>
    currentUser ? hasPermission(currentUser.role, "view", item.permission) : false,
  )

  if (!currentUser) return null

  return (
    <header className="bg-background dark:bg-background border-b border-border sticky top-0 z-50 shadow w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground">{companySettings.name}</span>
                <span className="text-xs text-muted-foreground">نظام الإدارة المتكامل</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNotifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="relative">
                    <DropdownMenuItem
                      className={cn(
                        "flex items-center p-3 cursor-pointer",
                        !notification.isRead && "bg-blue-50"
                      )}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    {/* Action buttons - positioned absolutely */}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          notification.isRead ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!notification.isRead) markNotificationAsRead(notification.id)
                        }}
                        disabled={notification.isRead}
                        title="تحديد كمقروء"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-gray-100 transition-colors text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        title="حذف الإشعار"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {userNotifications.length === 0 && <DropdownMenuItem disabled>لا توجد إشعارات جديدة</DropdownMenuItem>}
                {/* زر حذف كل الإشعارات */}
                {userNotifications.length > 0 && (
                  <div className="flex justify-center mt-2 mb-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-11/12 flex items-center gap-2 rounded-md"
                      onClick={() => {
                        userNotifications.forEach(n => deleteNotification(n.id))
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف كل الإشعارات
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.avatar || "/placeholder.svg?height=32&width=32"}
                      alt={currentUser.name}
                    />
                    <AvatarFallback>
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                      {(() => {
                        // Get role name from jobRoles if exists
                        const jobRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
                        const userRole = jobRoles.find((role: any) => role.id === currentUser.role)
                        
                        if (userRole) {
                          return userRole.name
                        }
                        
                        // Fallback to default roles
                        switch (currentUser.role) {
                          case "admin":
                            return "مدير"
                          case "engineer":
                            return "مهندس"
                          case "accountant":
                            return "محاسب"
                          case "hr":
                            return "موارد بشرية"
                          default:
                            return currentUser.role
                        }
                      })()}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>الإعدادات الشخصية</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-md text-base font-medium",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
