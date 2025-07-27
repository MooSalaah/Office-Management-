"use client"

import { useState } from "react"
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
  Home,
  Sun,
  Moon,
  CheckCircle,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { logout, getUserModules, canAccessModule } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"

const navigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "المشاريع", href: "/projects", icon: FolderOpen, module: "projects" },
  { name: "العملاء", href: "/clients", icon: Users, module: "clients" },
  { name: "المهام", href: "/tasks", icon: CheckSquare, module: "tasks" },
  { name: "المالية", href: "/finance", icon: DollarSign, module: "finance" },
  { name: "الحضور", href: "/attendance", icon: Clock, module: "attendance" },
  { name: "الإعدادات", href: "/settings", icon: Settings, module: "settings" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { state, dispatch } = useApp()
  const { currentUser, companySettings, notifications } = state
  const { theme, setTheme } = useTheme()
  const { markNotificationAsRead, deleteNotification } = useAppActions()

  // Get user's allowed modules
  const userModules = currentUser ? getUserModules(currentUser.role) : []
  
  // Filter navigation items based on user permissions
  const allowedNavigation = navigation.filter(item => {
    // Admin can access all modules
    if (currentUser?.role === "admin") return true
    
    // Check if user has access to this module
    return userModules.includes(item.module)
  })

  // Count unread notifications for current user
  const unreadCount = notifications.filter((n) => n.userId === currentUser?.id && !n.isRead).length

  const handleLogout = () => {
    // Clear user data
    logout()
    
    // Clear any additional state
    dispatch({ type: "SET_CURRENT_USER", payload: null })
    
    // Redirect to home page
    router.push("/")
    
    // Force page reload to clear all state
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <nav className="bg-background dark:bg-background border-b border-border sticky top-0 z-50 shadow w-full">
      <div className="container-fluid px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 space-x-reverse">
              <div className="flex items-center justify-center w-20 h-20">
                <img 
                  src={companySettings.logo || "/logo.png"} 
                  alt={companySettings.name || "الركن الجديد للاستشارات الهندسية"} 
                  className="w-20 h-20 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center w-8 h-8">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground leading-tight">
                  {companySettings.name || "الركن الجديد للاستشارات الهندسية"}
                </span>
                <span className="text-xs text-muted-foreground">نظام إدارة المكتب الهندسي</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            {allowedNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
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
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center"
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
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
                {notifications
                  .filter((n) => n.userId === currentUser?.id)
                  .slice(0, 5)
                  .map((notification) => (
                    <SwipeToDelete key={notification.id} onDelete={() => {
                      if (notification.id) {
                        deleteNotification(notification.id)
                      }
                    }}>
                      <DropdownMenuItem className="flex flex-col items-start p-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{notification.title}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="p-1"
                              title="تحديد كمقروء"
                              disabled={notification.isRead}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (notification.id) {
                                  markNotificationAsRead(notification.id)
                                }
                              }}
                            >
                              <CheckCircle className={`w-4 h-4 ${notification.isRead ? 'text-gray-400' : 'text-blue-600'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="p-1"
                              title="حذف الإشعار"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (notification.id) {
                                  deleteNotification(notification.id)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">{notification.message}</span>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </DropdownMenuItem>
                    </SwipeToDelete>
                  ))}
                {notifications.filter((n) => n.userId === currentUser?.id).length === 0 && (
                  <DropdownMenuItem disabled>
                    <span className="text-gray-500">لا توجد إشعارات</span>
                  </DropdownMenuItem>
                )}
                {/* زر حذف الكل */}
                {notifications.filter((n) => n.userId === currentUser?.id).length > 0 && (
                  <div className="flex justify-center mt-2 mb-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-11/12 flex items-center gap-2 rounded-md"
                      onClick={() => {
                        notifications.filter((n) => n.userId === currentUser?.id).forEach(n => {
                          if (n.id) {
                            deleteNotification(n.id)
                          }
                        })
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
                    <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=32&width=32"} alt={currentUser?.name} />
                    <AvatarFallback>
                      {currentUser?.name
                        ?.split(" ")
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
                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.role === "admin"
                        ? "مدير النظام"
                        : currentUser?.role === "engineer"
                          ? "مهندس"
                          : currentUser?.role === "accountant"
                            ? "محاسب"
                            : "موارد بشرية"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
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
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-md text-base font-medium",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
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
    </nav>
  )
}
