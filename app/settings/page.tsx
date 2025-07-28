"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Building,
  Bell,
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Palette,
  Settings,
  // تم إزالة Wifi من الاستيرادات
} from "lucide-react"
import { getCurrentUser, hasPermission, rolePermissions, getAllRoles, getRolePermissions } from "@/lib/auth"
import { mockUsers } from "@/lib/data"
import type { User as UserType } from "@/lib/types"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { realtimeUpdates } from "@/lib/realtime-updates"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { transliterateArabicToEnglish } from "@/lib/utils"
// تم إزالة اختبار الاتصال من صفحة الإعدادات
import { logger } from "@/lib/logger"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SettingsErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Settings page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                حدث خطأ في صفحة الإعدادات
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                يرجى تحديث الصفحة أو العودة للصفحة الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                تحديث الصفحة
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full"
              >
                العودة للصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SettingsPage() {
  return (
    <SettingsErrorBoundary>
      <PermissionGuard requiredPermission="view_settings" requiredAction="view" requiredModule="settings" moduleName="صفحة الإعدادات">
        <SettingsPageContent />
      </PermissionGuard>
    </SettingsErrorBoundary>
  )
}

function SettingsPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, showSuccessToast, showErrorToast } = useAppActions()
  const { currentUser, users, companySettings } = state

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Remove all code related to isDarkMode, setIsDarkMode, localStorage darkMode, and document.documentElement.classList.add/remove
  // Remove the toggleDarkMode function and its usages

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    avatar: "",
  })

  // Office settings
  const [officeData, setOfficeData] = useState({
    name: "الركن الجديد للاستشارات الهندسية",
    address: "الرياض، المملكة العربية السعودية",
    phone: "+966 11 123 4567",
    email: "info@newcorner.sa",
    website: "www.newcorner.sa",
    description: "مكتب استشارات هندسية متخصص في التصميم والإشراف",
    logo: "",
    stamp: "", // إضافة حقل ختم الشركة
    signature: "", // إضافة حقل توقيع المكتب
  })

  // Notification settings
  // تم إزالة إعدادات الإشعارات من صفحة المديرين

  // User form data
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "", // string فقط
    isActive: true,
    permissions: [] as string[],
    monthlySalary: 5000,
    avatar: "",
  })

  // Job roles data - now using dynamic system
  const [jobRoles, setJobRoles] = useState(() => {
    // Load from localStorage first, then fallback to default roles
    const savedRoles = localStorage.getItem("jobRoles")
    if (savedRoles) {
      return JSON.parse(savedRoles)
    }
    return getAllRoles()
  })

  // Load rolePermissions from localStorage
  useEffect(() => {
    const savedRolePermissions = localStorage.getItem("rolePermissions")
    if (savedRolePermissions) {
      const parsedPermissions = JSON.parse(savedRolePermissions)
      Object.assign(rolePermissions, parsedPermissions)
    }
  }, [])

  const [isJobRoleDialogOpen, setIsJobRoleDialogOpen] = useState(false)
  const [jobRoleFormData, setJobRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [editingJobRole, setEditingJobRole] = useState<any | null>(null)
  const [jobRoleToDelete, setJobRoleToDelete] = useState<string | null>(null)
  
  // Task Types Management
  const [taskTypes, setTaskTypes] = useState<any[]>([])
  const [isTaskTypeDialogOpen, setIsTaskTypeDialogOpen] = useState(false)
  const [editingTaskType, setEditingTaskType] = useState<any | null>(null)
  const [taskTypeToDelete, setTaskTypeToDelete] = useState<string | null>(null)
  const [taskTypeFormData, setTaskTypeFormData] = useState({
    name: "",
    description: "",
    isDefault: false
  })

  // Available permissions for selection
  const availablePermissions = [
    // Dashboard permissions
    { id: "view_dashboard", name: "عرض لوحة التحكم", description: "إمكانية عرض لوحة التحكم" },
    
    // Projects permissions
    { id: "view_projects", name: "عرض المشاريع", description: "إمكانية عرض المشاريع" },
    { id: "create_projects", name: "إنشاء مشاريع", description: "إمكانية إنشاء مشاريع جديدة" },
    { id: "edit_projects", name: "تعديل المشاريع", description: "إمكانية تعديل المشاريع" },
    { id: "delete_projects", name: "حذف المشاريع", description: "إمكانية حذف المشاريع" },
    
    // Tasks permissions
    { id: "view_tasks", name: "عرض المهام", description: "إمكانية عرض المهام" },
    { id: "create_tasks", name: "إنشاء مهام", description: "إمكانية إنشاء مهام جديدة" },
    { id: "edit_tasks", name: "تعديل المهام", description: "إمكانية تعديل المهام" },
    { id: "delete_tasks", name: "حذف المهام", description: "إمكانية حذف المهام" },
    
    // Finance permissions
    { id: "view_finance", name: "عرض المالية", description: "إمكانية عرض المعاملات المالية" },
    { id: "create_finance", name: "إنشاء معاملات مالية", description: "إمكانية إنشاء معاملات مالية جديدة" },
    { id: "edit_finance", name: "تعديل المالية", description: "إمكانية تعديل المعاملات المالية" },
    { id: "delete_finance", name: "حذف المعاملات المالية", description: "إمكانية حذف المعاملات المالية" },
    
    // Users permissions
    { id: "view_users", name: "عرض المستخدمين", description: "إمكانية عرض المستخدمين" },
    { id: "create_users", name: "إنشاء مستخدمين", description: "إمكانية إنشاء مستخدمين جدد" },
    { id: "edit_users", name: "تعديل المستخدمين", description: "إمكانية تعديل المستخدمين" },
    { id: "delete_users", name: "حذف المستخدمين", description: "إمكانية حذف المستخدمين" },
    
    // Attendance permissions
    { id: "view_attendance", name: "عرض الحضور", description: "إمكانية عرض سجلات الحضور" },
    { id: "create_attendance", name: "إنشاء سجلات حضور", description: "إمكانية إنشاء سجلات حضور جديدة" },
    { id: "edit_attendance", name: "تعديل الحضور", description: "إمكانية تعديل سجلات الحضور" },
    { id: "delete_attendance", name: "حذف سجلات الحضور", description: "إمكانية حذف سجلات الحضور" },
    { id: "checkin_attendance", name: "تسجيل حضور", description: "إمكانية تسجيل الحضور" },
    { id: "checkout_attendance", name: "تسجيل انصراف", description: "إمكانية تسجيل الانصراف" },
    
    // Clients permissions
    { id: "view_clients", name: "عرض العملاء", description: "إمكانية عرض العملاء" },
    { id: "create_clients", name: "إنشاء عملاء", description: "إمكانية إنشاء عملاء جدد" },
    { id: "edit_clients", name: "تعديل العملاء", description: "إمكانية تعديل العملاء" },
    { id: "delete_clients", name: "حذف العملاء", description: "إمكانية حذف العملاء" },
    
    // Settings permissions
    { id: "view_settings", name: "عرض الإعدادات", description: "إمكانية عرض الإعدادات" },
    { id: "edit_settings", name: "تعديل الإعدادات", description: "إمكانية تعديل الإعدادات" },
    
    // Roles permissions
    { id: "view_roles", name: "عرض الأدوار", description: "إمكانية عرض الأدوار الوظيفية" },
    { id: "create_roles", name: "إنشاء أدوار", description: "إمكانية إنشاء أدوار وظيفية جديدة" },
    { id: "edit_roles", name: "تعديل الأدوار", description: "إمكانية تعديل الأدوار الوظيفية" },
    { id: "delete_roles", name: "حذف الأدوار", description: "إمكانية حذف الأدوار الوظيفية" },
  ]

  // Available modules for selection
  const availableModules = [
    { id: "dashboard", name: "لوحة التحكم" },
    { id: "projects", name: "المشاريع" },
    { id: "tasks", name: "المهام" },
    { id: "finance", name: "المالية" },
    { id: "users", name: "المستخدمين" },
    { id: "attendance", name: "الحضور" },
    { id: "clients", name: "العملاء" },
    { id: "settings", name: "الإعدادات" },
  ]

  const [successDialog, setSuccessDialog] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        avatar: currentUser.avatar || "",
      })
    }
    
    // تحميل بيانات المكتب من localStorage
    const savedCompanySettings = localStorage.getItem("companySettings")
    if (savedCompanySettings) {
      const parsedSettings = JSON.parse(savedCompanySettings)
      setOfficeData(prev => ({ ...prev, ...parsedSettings }))
    }
    
    // إضافة listener للتحديثات من الأجهزة الأخرى
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (currentUser && updatedUser.id === currentUser.id) {
            // تحديث البيانات المحلية
            dispatch({ type: "SET_CURRENT_USER", payload: updatedUser });
            setProfileData({
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
              avatar: updatedUser.avatar || "",
            });
            logger.info("تم تحديث بيانات الملف الشخصي من جهاز آخر", { user: updatedUser }, 'SETTINGS');
          }
        } catch (error) {
          logger.error("خطأ في تحديث بيانات الملف الشخصي", { error }, 'SETTINGS');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, dispatch])

  // استماع للتحديثات الفورية للمستخدمين
  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      try {
        // التحقق من وجود البيانات
        if (!data) {
          console.warn("Received empty user update data");
          return;
        }

        if (data.action === 'create') {
          // التحقق من وجود بيانات المستخدم
          if (!data.user || !data.user.id) {
            console.warn("Invalid user data in create action");
            return;
          }

          // إضافة المستخدم الجديد إلى state
          dispatch({ type: "ADD_USER", payload: data.user })
          
          // إضافة إشعار للمدير
          if (currentUser?.role === "admin" && data.user.id !== currentUser.id) {
            addNotification({
              userId: currentUser.id,
              title: "مستخدم جديد",
              message: `تم إنشاء المستخدم "${data.user.name}" بواسطة ${currentUser.name}`,
              type: "system",
              isRead: false,
              triggeredBy: data.user.id,
            })
          }
        } else if (data.action === 'update') {
          // التحقق من وجود بيانات المستخدم
          if (!data.user || !data.user.id) {
            console.warn("Invalid user data in update action");
            return;
          }

          // تحديث المستخدم في state
          dispatch({ type: "UPDATE_USER", payload: data.user })
          
          // إذا كان المستخدم المحدث هو المستخدم الحالي، تحديث currentUser أيضاً
          if (currentUser && data.user.id === currentUser.id) {
            dispatch({ type: "SET_CURRENT_USER", payload: data.user })
            localStorage.setItem("currentUser", JSON.stringify(data.user))
            
            // تحديث بيانات الملف الشخصي في النموذج
            setProfileData({
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
              avatar: data.user.avatar || "",
            });
            
            logger.info("تم تحديث بيانات الملف الشخصي من realtime update", { user: data.user }, 'SETTINGS');
          }
        } else if (data.action === 'delete') {
          // التحقق من وجود معرف المستخدم
          if (!data.userId) {
            console.warn("Missing userId in delete action");
            return;
          }

          // حذف المستخدم من state
          dispatch({ type: "DELETE_USER", payload: data.userId })
        }
      } catch (error) {
        console.error("Error in handleUserUpdate:", error);
      }
    }

    // استماع لتحديثات الأدوار
    const handleRoleUpdate = (data: any) => {
      if (data.action === 'create') {
        setJobRoles((prev: any) => [...prev, data.role])
      } else if (data.action === 'update') {
        setJobRoles((prev: any) => prev.map((role: any) => 
          role._id === data.role._id ? data.role : role
        ))
      } else if (data.action === 'delete') {
        setJobRoles((prev: any) => prev.filter((role: any) => role._id !== data.roleId))
      }
    }

    // استماع لتحديثات أنواع المهام
    const handleTaskTypeUpdate = (data: any) => {
      if (data.action === 'create') {
        setTaskTypes((prev: any) => [...prev, data.taskType])
      } else if (data.action === 'update') {
        setTaskTypes((prev: any) => prev.map((tt: any) => 
          tt._id === data.taskType._id ? data.taskType : tt
        ))
      } else if (data.action === 'delete') {
        setTaskTypes((prev: any) => prev.filter((tt: any) => tt._id !== data.taskTypeId))
      }
    }

    // استماع لتحديثات إعدادات المكتب
    const handleCompanySettingsUpdate = (data: any) => {
      if (data.action === 'update') {
        setOfficeData(prev => ({ ...prev, ...data.settings }))
        dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: data.settings })
      }
    }

    // تسجيل المستمعين للتحديثات
    const unsubscribeUser = realtimeUpdates.subscribe("user", handleUserUpdate)
    const unsubscribeRole = realtimeUpdates.subscribe("role", handleRoleUpdate)
    const unsubscribeTaskType = realtimeUpdates.subscribe("taskType", handleTaskTypeUpdate)
    const unsubscribeCompanySettings = realtimeUpdates.subscribe("companySettings", handleCompanySettingsUpdate)

    // تنظيف المستمعين عند إلغاء التحميل
    return () => {
      unsubscribeUser()
      unsubscribeRole()
      unsubscribeTaskType()
      unsubscribeCompanySettings()
    }
  }, [currentUser, dispatch, addNotification])

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileData(prev => ({ ...prev, avatar: result }))
        
        // Update global user avatar immediately
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: result }
          dispatch({ type: "UPDATE_USER", payload: updatedUser })
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompanyLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setOfficeData((prev) => ({ ...prev, logo: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompanyStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setOfficeData((prev) => ({ ...prev, stamp: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompanySignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setOfficeData((prev) => ({ ...prev, signature: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUserAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileData(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // دالة لتنسيق رقم الهاتف
  const formatPhoneNumber = (phone: string): string => {
    // إزالة جميع الأحرف غير الرقمية
    const cleaned = phone.replace(/\D/g, '');
    
    // إذا كان الرقم يبدأ بـ 966 أو 00966، تحويله إلى 05
    if (cleaned.startsWith('966')) {
      return '05' + cleaned.substring(3);
    } else if (cleaned.startsWith('00966')) {
      return '05' + cleaned.substring(5);
    }
    
    // إذا كان الرقم يبدأ بـ 5، إضافة 0
    if (cleaned.startsWith('5') && cleaned.length === 9) {
      return '0' + cleaned;
    }
    
    // إذا كان الرقم 10 أرقام ويبدأ بـ 0، تركه كما هو
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return cleaned;
    }
    
    // إذا كان الرقم 9 أرقام، إضافة 0
    if (cleaned.length === 9) {
      return '0' + cleaned;
    }
    
    // إذا كان الرقم 10 أرقام، تركه كما هو
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // في الحالات الأخرى، إرجاع الرقم كما هو
    return phone;
  };

  const handleProfileUpdate = async () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setAlert({ type: "error", message: "كلمات المرور الجديدة غير متطابقة" })
      return
    }

    // تحقق من كلمة المرور الحالية إذا كان المستخدم يريد تغيير كلمة المرور
    if (profileData.newPassword) {
      if (currentUser?.password && profileData.currentPassword !== currentUser.password) {
        setAlert({ type: "error", message: "كلمة المرور الحالية غير صحيحة" })
        return
      }
    }

    // تنسيق رقم الهاتف
    const formattedPhone = formatPhoneNumber(profileData.phone);

    // Update global user info
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: profileData.name,
        email: profileData.email,
        phone: formattedPhone,
        avatar: profileData.avatar,
        password: profileData.newPassword || currentUser.password || "",
      }
      
      try {
        // Save to backend database
        // تحضير البيانات للإرسال - تأكد من إرسال جميع البيانات
        const userDataToSend = {
          id: currentUser.id,
          name: profileData.name,
          email: profileData.email,
          phone: formattedPhone || "", // تأكد من إرسال رقم الهاتف المنسق
          avatar: profileData.avatar || "", // تأكد من إرسال الصورة
          password: profileData.newPassword || currentUser.password || "",
          role: currentUser.role,
          isActive: currentUser.isActive,
          permissions: currentUser.permissions,
          monthlySalary: currentUser.monthlySalary,
          createdAt: currentUser.createdAt,
          workingHours: currentUser.workingHours
        };

        console.log('Sending profile data to backend:', userDataToSend);

        const response = await fetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userDataToSend),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to update profile in database');
        }

        const result = await response.json();
        console.log('Profile update result:', result);
        logger.info('Profile updated in database', { result }, 'SETTINGS');

        // تحديث البيانات المحلية
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const updatedUsers = existingUsers.map((u: any) => u.id === currentUser.id ? updatedUser : u)
        localStorage.setItem("users", JSON.stringify(updatedUsers))
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        logger.debug("Profile updated and saved to localStorage", { updatedUser }, 'SETTINGS')
        
        // Update state
        dispatch({ type: "UPDATE_USER", payload: updatedUser })
        dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        
        // إرسال إشعار لجميع الأجهزة المفتوحة
        if (typeof window !== 'undefined') {
          // إرسال حدث storage لتحديث الأجهزة الأخرى
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'users',
            newValue: JSON.stringify(updatedUsers),
            oldValue: JSON.stringify(existingUsers)
          }));
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'currentUser',
            newValue: JSON.stringify(updatedUser),
            oldValue: JSON.stringify(currentUser)
          }));
        }
        
        // إرسال تحديث فوري لجميع المستخدمين
        realtimeUpdates.broadcastUpdate('user', { 
          action: 'update', 
          data: updatedUser,
          userId: currentUser.id,
          userName: currentUser.name,
          id: currentUser.id // إضافة id للتأكد من وجوده
        })
        
        // إظهار رسالة نجاح
        setAlert(null)
        showSuccessToast("تم تحديث الملف الشخصي بنجاح", "تم حفظ البيانات في قاعدة البيانات")
        
        // إرسال إشعار للمدير عند تغيير البريد الإلكتروني أو كلمة المرور
        if (currentUser.role !== "admin" && (profileData.email !== currentUser.email || profileData.newPassword)) {
          const adminUsers = users.filter(user => user.role === 'admin');
          for (const adminUser of adminUsers) {
            addNotification({
              userId: adminUser.id,
              title: "تحديث بيانات المستخدم",
              message: `تم تحديث بيانات المستخدم "${currentUser.name}" - ${profileData.email !== currentUser.email ? 'البريد الإلكتروني' : ''}${profileData.email !== currentUser.email && profileData.newPassword ? ' و' : ''}${profileData.newPassword ? 'كلمة المرور' : ''}`,
              type: "system",
              actionUrl: `/settings`,
              triggeredBy: currentUser?.id || "",
              isRead: false,
            })
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        setAlert({ type: "error", message: `حدث خطأ أثناء تحديث الملف الشخصي: ${errorMessage}` });
        showErrorToast("خطأ في تحديث الملف الشخصي", errorMessage);
      }
    }
  }

  // جلب إعدادات المكتب من backend مع تحديث فوري
  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/companySettings`);
        const data = await res.json();
        if (data.success && data.data) {
          setOfficeData(prev => ({ ...prev, ...data.data }));
          dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: data.data });
          
          // حفظ في localStorage للتحديثات الفورية
          localStorage.setItem("companySettings", JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Error fetching company settings:', err);
      }
    }
    fetchCompanySettings();
  }, [dispatch]);

  // تم إزالة إعدادات الإشعارات من صفحة المديرين

  // جلب الأدوار من backend مع تحديث فوري
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/roles`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setJobRoles(data.data);
          
          // حفظ في localStorage للتحديثات الفورية
          localStorage.setItem("jobRoles", JSON.stringify(data.data));
          
          // تحديث rolePermissions
          data.data.forEach((role: any) => {
            rolePermissions[role.id as keyof typeof rolePermissions] = {
              name: role.name,
              description: role.description,
              permissions: role.permissions,
              modules: role.modules
            }
          });
          localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    }
    fetchRoles();
  }, []);

  // جلب أنواع المهام من backend مع تحديث فوري
  useEffect(() => {
    async function fetchTaskTypes() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/taskTypes`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTaskTypes(data.data);
          
          // حفظ في localStorage للتحديثات الفورية
          localStorage.setItem("taskTypes", JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Error fetching task types:', err);
      }
    }
    fetchTaskTypes();
  }, []);

  // أضف متغير API_BASE_URL إذا لم يكن موجودًا
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // حفظ إعدادات المكتب في backend مع تحديث فوري
  const handleOfficeUpdate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`/api/companySettings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(officeData),
      });
      if (!response.ok) throw new Error('Failed to save company settings to database');
      const result = await response.json();
      
      // تحديث state
      dispatch({ type: "UPDATE_COMPANY_INFO", payload: officeData });
      dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: officeData });
      
      // حفظ في localStorage
      localStorage.setItem("companySettings", JSON.stringify(officeData));
      
      // إرسال تحديث فوري لجميع المستخدمين
      try {
        if (typeof window !== 'undefined') {
          const realtimeUpdates = (window as any).realtimeUpdates;
          if (realtimeUpdates && realtimeUpdates.sendCompanySettingsUpdate && typeof realtimeUpdates.sendCompanySettingsUpdate === 'function') {
            realtimeUpdates.sendCompanySettingsUpdate(officeData);
          } else {
            // استخدام الدالة المباشرة إذا لم تكن متاحة على window
            const { realtimeUpdates: directRealtimeUpdates } = await import('@/lib/realtime-updates');
            if (directRealtimeUpdates && directRealtimeUpdates.sendCompanySettingsUpdate) {
              directRealtimeUpdates.sendCompanySettingsUpdate(officeData);
            }
          }
        }
      } catch (error) {
        console.warn('Could not send realtime update for company settings:', error);
        // لا نريد أن نوقف العملية إذا فشل البث الفوري
      }
      
      setAlert(null);
      showSuccessToast("تم تحديث بيانات المكتب بنجاح", "تم حفظ البيانات في قاعدة البيانات");
      
      // إرسال إشعار لجميع المديرين
      const adminUsers = users.filter(user => user.role === 'admin');
      for (const adminUser of adminUsers) {
        addNotification({
          userId: adminUser.id,
          title: "تحديث بيانات المكتب",
          message: "تم تحديث معلومات المكتب بنجاح",
          type: "system",
          actionUrl: `/settings`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
        });
      }
    } catch (error) {
      console.error('Error saving company settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setAlert({ type: "error", message: `حدث خطأ أثناء حفظ إعدادات المكتب في قاعدة البيانات: ${errorMessage}` });
      showErrorToast("خطأ في حفظ بيانات المكتب", errorMessage);
    }
  };

  // تم إزالة إعدادات الإشعارات من صفحة المديرين

  const [userFormErrors, setUserFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  })

  const handleCreateUser = async () => {
    let errors = { name: "", email: "", password: "", role: "" }
    let hasError = false
    if (!userFormData.name.trim()) {
      errors.name = "الاسم مطلوب"
      hasError = true
    }
    // توليد الإيميل وكلمة السر تلقائياً إذا لم يتم إدخالهما
    let email = userFormData.email
    let password = userFormData.password
    if (!email || !password) {
      const nameParts = userFormData.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''
      // تحويل الاسم إلى إنجليزي
      const firstNameEn = transliterateArabicToEnglish(firstName)
      const lastNameEn = transliterateArabicToEnglish(lastName)
      const emailPrefix = (firstNameEn.charAt(0) + lastNameEn).toLowerCase()
      email = `${emailPrefix}@newcorner.sa`
      // التأكد من عدم تكرار الإيميل
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      let emailCounter = 1
      let finalEmail = email
      while (existingUsers.some((user: any) => user.email === finalEmail)) {
        finalEmail = `${emailPrefix}${emailCounter}@newcorner.sa`
        emailCounter++
      }
      email = finalEmail
      password = `${firstNameEn.charAt(0)}${lastNameEn}123`.toLowerCase()
    }
    if (!email) {
      errors.email = "البريد الإلكتروني مطلوب"
      hasError = true
    }
    if (!password) {
      errors.password = "كلمة المرور مطلوبة"
      hasError = true
    }
    if (!userFormData.role) {
      errors.role = "الدور مطلوب"
      hasError = true
    }
    // التحقق من عدم تكرار البريد الإلكتروني
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
    const emailExists = existingUsers.some((user: any) => user.email === email)
    if (emailExists) {
      errors.email = "البريد الإلكتروني مستخدم بالفعل"
      hasError = true
    }
    setUserFormErrors(errors)
    if (hasError) return

    // تنسيق رقم الهاتف
    const formattedPhone = formatPhoneNumber(userFormData.phone);
    
    const newUser: UserType = {
      id: Date.now().toString(),
      name: userFormData.name,
      email: email,
      password: password,
      phone: formattedPhone,
      role: userFormData.role,
      isActive: userFormData.isActive,
      permissions: userFormData.permissions,
      monthlySalary: userFormData.monthlySalary,
      avatar: userFormData.avatar,
      createdAt: new Date().toISOString(),
    }

    try {
      // Save to backend database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const result = await response.json();
      if (result.success && result.data) {
        // تحديث state
        dispatch({ type: "ADD_USER", payload: result.data });
        
        // حفظ في localStorage
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
        existingUsers.push(result.data)
        localStorage.setItem("users", JSON.stringify(existingUsers))
        
        // إرسال تحديث فوري
        realtimeUpdates.broadcastUpdate('user', result.data)
        
        showSuccessToast("تم إنشاء المستخدم بنجاح", `تم إنشاء المستخدم "${result.data.name}" بنجاح`)
        setIsUserDialogOpen(false)
        resetUserForm()
      } else {
        const errorMessage = result.error || "فشل حفظ المستخدم في قاعدة البيانات";
        setAlert({ type: "error", message: errorMessage });
        showErrorToast("خطأ في إنشاء المستخدم", errorMessage);
      }
    } catch (error) {
      const errorMessage = "حدث خطأ أثناء حفظ المستخدم في قاعدة البيانات";
      setAlert({ type: "error", message: errorMessage });
      showErrorToast("خطأ في إنشاء المستخدم", errorMessage);
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !hasPermission(currentUser?.role || "", "edit", "users")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل المستخدمين" })
      return
    }
    // التحقق من وجود البريد الإلكتروني
    if (!userFormData.email) {
      setAlert({ type: "error", message: "البريد الإلكتروني مطلوب" })
      return
    }
    // التحقق من عدم تكرار البريد الإلكتروني (إذا تم تغييره)
    if (userFormData.email !== editingUser.email) {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const emailExists = existingUsers.some((user: any) => user.email === userFormData.email)
      if (emailExists) {
        setAlert({ type: "error", message: "البريد الإلكتروني مستخدم بالفعل" })
        return
      }
    }
    // تنسيق رقم الهاتف
    const formattedPhone = formatPhoneNumber(userFormData.phone);
    
    const updatedUser: UserType = {
      ...editingUser,
      name: userFormData.name,
      email: userFormData.email,
      password: userFormData.password || editingUser.password || "",
      phone: formattedPhone,
      role: userFormData.role,
      isActive: userFormData.isActive,
      permissions: userFormData.permissions,
      monthlySalary: userFormData.monthlySalary,
      avatar: userFormData.avatar,
    }
    try {
      // Save to backend database
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      
      // تحضير البيانات للإرسال
      const userDataToSend = {
        id: editingUser.id,
        name: userFormData.name,
        email: userFormData.email,
        password: userFormData.password || editingUser.password || "",
        phone: formattedPhone,
        role: userFormData.role,
        isActive: userFormData.isActive,
        permissions: userFormData.permissions,
        monthlySalary: userFormData.monthlySalary,
        avatar: userFormData.avatar,
        createdAt: editingUser.createdAt,
        workingHours: editingUser.workingHours
      };

      const response = await fetch(`${apiUrl}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(userDataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to update user in database');
      }

      const result = await response.json();
      console.log('User update result:', result);
      
      if (result.success && result.data) {
        // تحديث state
        dispatch({ type: "UPDATE_USER", payload: result.data });
        
        // حفظ في localStorage
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const updatedUsers = existingUsers.map((u: any) => u.id === editingUser.id ? result.data : u)
        localStorage.setItem("users", JSON.stringify(updatedUsers))
        
        // إرسال تحديث فوري
        realtimeUpdates.broadcastUpdate('user', result.data)
        
        showSuccessToast("تم تحديث المستخدم بنجاح", `تم تحديث المستخدم "${result.data.name}" بنجاح`)
        setIsUserDialogOpen(false)
        setEditingUser(null)
        resetUserForm()
        reloadUsersFromStorage()
      } else {
        const errorMessage = result.error || "فشل تحديث المستخدم في قاعدة البيانات";
        setAlert({ type: "error", message: errorMessage });
        showErrorToast("خطأ في تحديث المستخدم", errorMessage);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setAlert({ type: "error", message: `حدث خطأ أثناء تحديث المستخدم: ${errorMessage}` });
      showErrorToast("خطأ في تحديث المستخدم", errorMessage);
    }
  }

  const reloadUsersFromStorage = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    dispatch({ type: "SET_USERS", payload: users })
  }

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    try {
      const user = users.find(u => u.id === userToDelete)
      if (!user) {
        setDeleteError("المستخدم غير موجود")
        return
      }
      
      // حذف من قاعدة البيانات
      const response = await fetch(`/api/users?id=${userToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // تحديث state
        dispatch({ type: "DELETE_USER", payload: userToDelete })
        
        // Remove from localStorage
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const filteredUsers = existingUsers.filter((u: any) => u.id !== userToDelete)
        localStorage.setItem("users", JSON.stringify(filteredUsers))
        
        // إرسال تحديث فوري
        realtimeUpdates.broadcastUpdate('user', { action: 'delete', userId: userToDelete })
        
        showSuccessToast("تم حذف المستخدم بنجاح", `تم حذف المستخدم "${user.name}" بنجاح`)
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        setDeleteError("")
      } else {
        setDeleteError("فشل حذف المستخدم من قاعدة البيانات")
      }
    } catch (error) {
      setDeleteError("حدث خطأ أثناء حذف المستخدم")
    }
  }

  const handleCreateJobRole = async () => {
    if (!hasPermission(currentUser?.role || "", "create", "roles")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء أدوار وظيفية" })
      return
    }

    try {
      const newJobRole = {
        id: jobRoleFormData.name.toLowerCase().replace(/\s+/g, '_'),
        name: jobRoleFormData.name,
        description: jobRoleFormData.description,
        permissions: jobRoleFormData.permissions,
        modules: availableModules.filter(module => 
          jobRoleFormData.permissions.some(permission => 
            permission.startsWith('view_') || permission.startsWith('edit_') || permission.startsWith('checkin_') || permission.startsWith('checkout_')
          )
        ).map(module => module.id)
      }

      // حفظ في قاعدة البيانات
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/roles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newJobRole),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل حفظ الدور في قاعدة البيانات');
      }

      const result = await response.json();
      const savedRole = result.data;

      // تحديث state المحلي
      setJobRoles((prev: any) => [...prev, savedRole])
      
      // Update rolePermissions dynamically
      rolePermissions[savedRole.id as keyof typeof rolePermissions] = {
        name: savedRole.name,
        description: savedRole.description,
        permissions: savedRole.permissions,
        modules: savedRole.modules
      }
      
      // Save to localStorage
      const existingRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
      existingRoles.push(savedRole)
      localStorage.setItem("jobRoles", JSON.stringify(existingRoles))
      
      // Save updated rolePermissions
      localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions))
      
      // Update current user if they have this role
      if (currentUser && currentUser.role === savedRole.id) {
        const updatedUser = { ...currentUser, permissions: savedRole.permissions }
        dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('role', { action: 'create', role: savedRole })
      
      // Show success dialog with confirmation
              showSuccessToast("تم إنشاء الدور الوظيفي بنجاح", "تم حفظ البيانات في قاعدة البيانات")
      
      setAlert({ type: "success", message: "تم إنشاء الدور الوظيفي بنجاح" })
      setIsJobRoleDialogOpen(false)
      resetJobRoleForm()
    } catch (error) {
      console.error('Error creating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setAlert({ type: "error", message: `خطأ في إنشاء الدور: ${errorMessage}` });
      showErrorToast("خطأ في إنشاء الدور الوظيفي", errorMessage);
    }
  }

  const handleUpdateJobRole = async () => {
    if (!editingJobRole) return
    
    try {
      const updatedRole = {
        ...editingJobRole,
        name: jobRoleFormData.name,
        description: jobRoleFormData.description,
        permissions: jobRoleFormData.permissions,
        modules: availableModules.filter(module => 
          jobRoleFormData.permissions.some(permission => 
            permission.startsWith('view_') || permission.startsWith('edit_') || permission.startsWith('checkin_') || permission.startsWith('checkout_')
          )
        ).map(module => module.id)
      }

      // تحديث في قاعدة البيانات
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/roles/${editingJobRole._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(updatedRole),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل تحديث الدور في قاعدة البيانات');
      }

      const result = await response.json();
      const savedRole = result.data;

      // تحديث state المحلي
      setJobRoles((prev: any) => prev.map((role: any) => (role.id === editingJobRole.id ? savedRole : role)))
      
      // Update rolePermissions dynamically
      rolePermissions[savedRole.id as keyof typeof rolePermissions] = {
        name: savedRole.name,
        description: savedRole.description,
        permissions: savedRole.permissions,
        modules: savedRole.modules
      }
      
      // Update in localStorage
      const existingRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
      const updatedRoles = existingRoles.map((role: any) => role.id === editingJobRole.id ? savedRole : role)
      localStorage.setItem("jobRoles", JSON.stringify(updatedRoles))
      
      // Save updated rolePermissions
      localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions))
      
      // Update users with this role including current user
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: any) => {
        if (user.role === savedRole.id) {
          return { ...user, permissions: savedRole.permissions }
        }
        return user
      })
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      users.filter(user => user.role === savedRole.id).forEach(user => {
        const updatedUser = { ...user, permissions: savedRole.permissions }
        dispatch({ type: "UPDATE_USER", payload: updatedUser })
        // If this is the current user, update currentUser as well
        if (currentUser && user.id === currentUser.id) {
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        }
      })
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('role', { action: 'update', role: savedRole })
      
      // Show success dialog with confirmation
      setSuccessDialog("تم تحديث الدور الوظيفي بنجاح وتم حفظ البيانات في قاعدة البيانات")
      
      setEditingJobRole(null)
      showSuccessToast("تم تحديث الدور الوظيفي بنجاح", "تم حفظ البيانات في قاعدة البيانات")
      setIsJobRoleDialogOpen(false)
      resetJobRoleForm()
    } catch (error) {
      console.error('Error updating role:', error);
      showErrorToast("خطأ في تحديث الدور", error instanceof Error ? error.message : 'خطأ غير معروف')
    }
  }

  const handleDeleteJobRole = async (roleId: string) => {
    try {
      // حذف من قاعدة البيانات
      const roleToDelete = jobRoles.find((role: any) => role.id === roleId);
      if (!roleToDelete || !roleToDelete._id) {
        throw new Error('الدور غير موجود');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/roles/${roleToDelete._id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل حذف الدور من قاعدة البيانات');
      }

      // تحديث state المحلي
      setJobRoles((prev: any) => prev.filter((role: any) => role.id !== roleId))
      
      // Remove from localStorage
      const existingRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
      const filteredRoles = existingRoles.filter((role: any) => role.id !== roleId)
      localStorage.setItem("jobRoles", JSON.stringify(filteredRoles))
      
      // Remove from rolePermissions
      delete rolePermissions[roleId as keyof typeof rolePermissions]
      localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions))
      
      // Update users with this role (set to admin)
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: any) => {
        if (user.role === roleId) {
          return { ...user, role: "admin", permissions: ["*"] }
        }
        return user
      })
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      users.filter(user => user.role === roleId).forEach(user => {
        const updatedUser = { ...user, role: "admin", permissions: ["*"] }
        dispatch({ type: "UPDATE_USER", payload: updatedUser })
        if (currentUser && user.id === currentUser.id) {
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        }
      })
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('role', { action: 'delete', roleId: roleToDelete._id })
      
      // Show success dialog with confirmation
      setSuccessDialog("تم حذف الدور الوظيفي بنجاح وتم حفظ البيانات في قاعدة البيانات")
      
      showSuccessToast("تم حذف الدور الوظيفي بنجاح", "تم حفظ البيانات في قاعدة البيانات")
    } catch (error) {
      console.error('Error deleting role:', error);
      showErrorToast("خطأ في حذف الدور", error instanceof Error ? error.message : 'خطأ غير معروف')
    }
  }

  const resetJobRoleForm = () => {
    setJobRoleFormData({
      name: "",
      description: "",
      permissions: [],
    })
  }

  // Task Types Management Functions
  const handleCreateTaskType = async () => {
    if (!hasPermission(currentUser?.role || "", "create", "taskTypes")) {
      showErrorToast("خطأ في الصلاحيات", "ليس لديك صلاحية لإنشاء أنواع المهام")
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/taskTypes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(taskTypeFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل حفظ نوع المهمة في قاعدة البيانات');
      }

      const result = await response.json();
      const savedTaskType = result.data;

      // تحديث state
      setTaskTypes((prev: any) => [...prev, savedTaskType])
      
      // حفظ في localStorage
      const existingTaskTypes = JSON.parse(localStorage.getItem("taskTypes") || "[]")
      existingTaskTypes.push(savedTaskType)
      localStorage.setItem("taskTypes", JSON.stringify(existingTaskTypes))
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('taskType', { action: 'create', taskType: savedTaskType })
      
      showSuccessToast("تم إنشاء نوع المهمة بنجاح", "تم حفظ البيانات في قاعدة البيانات")
      setIsTaskTypeDialogOpen(false)
      resetTaskTypeForm()
    } catch (error) {
      console.error('Error creating task type:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setAlert({ type: "error", message: `خطأ في إنشاء نوع المهمة: ${errorMessage}` });
      showErrorToast("خطأ في إنشاء نوع المهمة", errorMessage);
    }
  }

  const handleUpdateTaskType = async () => {
    if (!editingTaskType || !hasPermission(currentUser?.role || "", "edit", "taskTypes")) {
      showErrorToast("خطأ في الصلاحيات", "ليس لديك صلاحية لتعديل أنواع المهام")
      return
    }

    try {
      const response = await fetch(`/api/taskTypes/${editingTaskType._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskTypeFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل تحديث نوع المهمة في قاعدة البيانات');
      }

      const result = await response.json();
      const updatedTaskType = result.data;

      // تحديث state
      setTaskTypes((prev: any) => prev.map((tt: any) => 
        tt._id === editingTaskType._id ? updatedTaskType : tt
      ))

      // حفظ في localStorage
      const existingTaskTypes = JSON.parse(localStorage.getItem("taskTypes") || "[]")
      const updatedTaskTypes = existingTaskTypes.map((tt: any) => 
        tt._id === editingTaskType._id ? updatedTaskType : tt
      )
      localStorage.setItem("taskTypes", JSON.stringify(updatedTaskTypes))
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('taskType', { action: 'update', taskType: updatedTaskType })

      showSuccessToast("تم تحديث نوع المهمة بنجاح", "تم حفظ البيانات في قاعدة البيانات")
      setIsTaskTypeDialogOpen(false)
      resetTaskTypeForm()
    } catch (error) {
      console.error('Error updating task type:', error);
      showErrorToast("خطأ في تحديث نوع المهمة", error instanceof Error ? error.message : 'خطأ غير معروف')
    }
  }

  const handleDeleteTaskType = async (taskTypeId: string) => {
    if (!hasPermission(currentUser?.role || "", "delete", "taskTypes")) {
      showErrorToast("خطأ في الصلاحيات", "ليس لديك صلاحية لحذف أنواع المهام")
      return
    }

    try {
      const response = await fetch(`/api/taskTypes/${taskTypeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل حذف نوع المهمة من قاعدة البيانات');
      }

      // تحديث state
      setTaskTypes((prev: any) => prev.filter((tt: any) => tt._id !== taskTypeId))
      
      // حفظ في localStorage
      const existingTaskTypes = JSON.parse(localStorage.getItem("taskTypes") || "[]")
      const filteredTaskTypes = existingTaskTypes.filter((tt: any) => tt._id !== taskTypeId)
      localStorage.setItem("taskTypes", JSON.stringify(filteredTaskTypes))
      
      // إرسال تحديث فوري
      realtimeUpdates.broadcastUpdate('taskType', { action: 'delete', taskTypeId })
      
      showSuccessToast("تم حذف نوع المهمة بنجاح", "تم حفظ البيانات في قاعدة البيانات")
      setTaskTypeToDelete(null)
    } catch (error) {
      console.error('Error deleting task type:', error);
      showErrorToast("خطأ في حذف نوع المهمة", error instanceof Error ? error.message : 'خطأ غير معروف')
    }
  }

  const handleSeedTaskTypes = async () => {
    if (!hasPermission(currentUser?.role || "", "create", "taskTypes")) {
      showErrorToast("خطأ في الصلاحيات", "ليس لديك صلاحية لإضافة أنواع المهام الافتراضية")
      return
    }

    try {
      const response = await fetch('/api/taskTypes/seed', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل إضافة أنواع المهام الافتراضية');
      }

      const result = await response.json();
      
      // تحديث state
      setTaskTypes(result.data)
      
      // حفظ في localStorage
      localStorage.setItem("taskTypes", JSON.stringify(result.data))
      
      showSuccessToast("تم إضافة أنواع المهام الافتراضية بنجاح", "تم حفظ البيانات في قاعدة البيانات")
    } catch (error) {
      console.error('Error seeding task types:', error);
      showErrorToast("خطأ في إضافة أنواع المهام الافتراضية", error instanceof Error ? error.message : 'خطأ غير معروف')
    }
  }

  const resetTaskTypeForm = () => {
    setTaskTypeFormData({
      name: "",
      description: "",
      isDefault: false
    })
    setEditingTaskType(null)
  }

  const openEditTaskTypeDialog = (taskType: any) => {
    setEditingTaskType(taskType)
    setTaskTypeFormData({
      name: taskType.name,
      description: taskType.description,
      isDefault: taskType.isDefault
    })
    setIsTaskTypeDialogOpen(true)
  }

  const openEditUserDialog = (user: UserType) => {
    setEditingUser(user)
    setUserFormData({
      name: user.name,
      email: user.email,
      password: user.password || "",
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions || [],
      monthlySalary: user.monthlySalary || 5000,
      avatar: user.avatar || "",
    })
    setIsUserDialogOpen(true)
  }

  const openEditJobRoleDialog = (role: any) => {
    setEditingJobRole(role)
    setJobRoleFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setIsJobRoleDialogOpen(true)
  }

  const resetUserForm = () => {
    setUserFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "",
      isActive: true,
      permissions: [],
      monthlySalary: 5000,
      avatar: "",
    })
  }

  const getRoleText = (role: string) => {
    // First check custom job roles from localStorage
    const jobRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
    const customRole = jobRoles.find((r: any) => r.id === role)
    if (customRole) {
      return customRole.name
    }
    
    // Fallback to default roles
    switch (role) {
      case "admin":
        return "مدير"
      case "engineer":
        return "مهندس"
      case "accountant":
        return "محاسب"
      case "hr":
        return "موارد بشرية"
      default:
        return role
    }
  }

  const canManageUsers = hasPermission(currentUser?.role || "", "edit", "users")
  const canManageRoles = hasPermission(currentUser?.role || "", "edit", "roles")
  const isAdmin = currentUser?.role === "admin"
  const isHR = currentUser?.role === "hr"

  // Show only profile settings for non-admin and non-HR users
  if (!isAdmin && !isHR) {
    return (
      <div className="max-w-screen-xl mx-auto space-y-6">
        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">الإعدادات</h1>
            <p className="text-muted-foreground mt-1">إدارة الملف الشخصي والإعدادات</p>
          </div>
        </div>

        {/* Profile Settings - Available for all users */}
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"> <User className="w-5 h-5 mr-2" /> الملف الشخصي </CardTitle>
            <CardDescription className="text-muted-foreground">تحديث معلومات الملف الشخصي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback>
                  {profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Upload className="w-4 h-4" />
                    <span>تغيير الصورة</span>
                  </div>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleProfileUpdate} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          {alert.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">
            {(isAdmin || isHR) ? "إدارة إعدادات النظام والمستخدمين" : "إدارة الملف الشخصي والإعدادات"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings - Available for all users */}
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"> <User className="w-5 h-5 mr-2" /> الملف الشخصي </CardTitle>
            <CardDescription className="text-muted-foreground">تحديث معلومات الملف الشخصي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback>
                  {profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Upload className="w-4 h-4" />
                    <span>تغيير الصورة</span>
                  </div>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleProfileUpdate} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* Office Settings - Only for admin */}
        {isAdmin && (
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"> <Building className="w-5 h-5 mr-2" /> إعدادات المكتب </CardTitle>
            <CardDescription className="text-muted-foreground">تحديث معلومات المكتب والشعار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-20 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                {officeData.logo ? (
                  <img src={officeData.logo} alt="شعار المكتب" className="w-16 h-16 object-contain" />
                ) : (
                  <Building className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Upload className="w-4 h-4" />
                    <span>تغيير الشعار</span>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCompanyLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* ختم الشركة */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-20 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                {officeData.stamp ? (
                  <img src={officeData.stamp} alt="ختم الشركة" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">ختم</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="stamp-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Upload className="w-4 h-4" />
                    <span>تغيير ختم الشركة</span>
                  </div>
                </Label>
                <Input
                  id="stamp-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCompanyStampUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* توقيع المكتب */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-20 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                {officeData.signature ? (
                  <img src={officeData.signature} alt="توقيع المكتب" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">توقيع</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="signature-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Upload className="w-4 h-4" />
                    <span>تغيير توقيع المكتب</span>
                  </div>
                </Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCompanySignatureUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="office-name">اسم المكتب</Label>
                <Input
                  id="office-name"
                  value={officeData.name}
                  onChange={(e) => setOfficeData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-address">العنوان</Label>
                <Input
                  id="office-address"
                  value={officeData.address}
                  onChange={(e) => setOfficeData((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="office-phone">رقم الهاتف</Label>
                  <Input
                    id="office-phone"
                    value={officeData.phone}
                    onChange={(e) => setOfficeData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office-email">البريد الإلكتروني</Label>
                  <Input
                    id="office-email"
                    type="email"
                    value={officeData.email}
                    onChange={(e) => setOfficeData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-website">الموقع الإلكتروني</Label>
                <Input
                  id="office-website"
                  value={officeData.website}
                  onChange={(e) => setOfficeData((prev) => ({ ...prev, website: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-description">الوصف</Label>
                <Textarea
                  id="office-description"
                  value={officeData.description}
                  onChange={(e) => setOfficeData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleOfficeUpdate} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Notification Settings - Only for admin */}
        {/* تم إزالة إعدادات الإشعارات من صفحة المديرين */}
      </div>

      {/* Admin-only sections */}
      {isAdmin && (
        <>
      {/* Job Roles Management */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-foreground"> <Shield className="w-5 h-5 mr-2" /> الأدوار الوظيفية </CardTitle>
            <CardDescription className="text-muted-foreground">إدارة الأدوار والصلاحيات</CardDescription>
          </div>
          {canManageRoles && (
            <Dialog open={isJobRoleDialogOpen} onOpenChange={setIsJobRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة دور جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة دور وظيفي جديد</DialogTitle>
                  <DialogDescription>إنشاء دور وظيفي جديد مع الصلاحيات المطلوبة</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">اسم الدور</Label>
                    <Input
                      id="role-name"
                      value={jobRoleFormData.name}
                      onChange={(e) => setJobRoleFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="مثال: مهندس تصميم"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">الوصف</Label>
                    <Textarea
                      id="role-description"
                      value={jobRoleFormData.description}
                      onChange={(e) => setJobRoleFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف مختصر للدور والمسؤوليات"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الصلاحيات</Label>
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setJobRoleFormData((prev) => ({
                            ...prev,
                            permissions: availablePermissions.map(p => p.id)
                          }))
                        }}
                        className="text-xs"
                      >
                        تحديد الكل
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setJobRoleFormData((prev) => ({
                            ...prev,
                            permissions: []
                          }))
                        }}
                        className="text-xs"
                      >
                        إلغاء التحديد
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                            id={permission.id}
                            checked={jobRoleFormData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setJobRoleFormData((prev) => ({
                              ...prev,
                                  permissions: [...prev.permissions, permission.id],
                            }))
                          } else {
                            setJobRoleFormData((prev) => ({
                              ...prev,
                                  permissions: prev.permissions.filter((p) => p !== permission.id),
                            }))
                          }
                        }}
                        className="rounded"
                      />
                          <Label htmlFor={permission.id} className="text-sm">
                            {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setIsJobRoleDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={editingJobRole ? handleUpdateJobRole : handleCreateJobRole}>
                    {editingJobRole ? "تحديث" : "حفظ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobRoles.map((role: any) => (
              <Card key={role.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{role.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                          {role.permissions.map((permission: any) => {
                            const permInfo = availablePermissions.find(p => p.id === permission)
                            return (
                        <Badge key={permission} variant="secondary" className="text-xs">
                                {permInfo ? permInfo.name : permission}
                        </Badge>
                            )
                          })}
                    </div>
                  </div>
                  {canManageRoles && (
                    <div className="flex space-x-1 space-x-reverse">
                      <Button variant="ghost" size="sm" onClick={() => openEditJobRoleDialog(role)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setJobRoleToDelete(role.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-foreground"> <Users className="w-5 h-5 mr-2" /> إدارة المستخدمين </CardTitle>
            <CardDescription className="text-muted-foreground">إدارة المستخدمين والصلاحيات</CardDescription>
          </div>
          {canManageUsers && (
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetUserForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "تعديل معلومات المستخدم" : "إضافة مستخدم جديد للنظام"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* User Avatar Upload */}
                  <div className="space-y-2">
                    <Label>صورة المستخدم</Label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-20 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {userFormData.avatar ? (
                          <img src={userFormData.avatar} alt="صورة المستخدم" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="user-avatar-upload" className="cursor-pointer">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Upload className="w-4 h-4" />
                            <span>رفع صورة</span>
                          </div>
                        </Label>
                        <Input
                          id="user-avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleUserAvatarUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-1">اضغط لرفع صورة المستخدم</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-name">الاسم</Label>
                    <Input
                      id="user-name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    {userFormErrors.name && <p className="text-xs text-red-500 mt-1">{userFormErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email" className="flex items-center">
                      البريد الإلكتروني
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="example@email.com"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    {userFormErrors.email && <p className="text-xs text-red-500 mt-1">{userFormErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password" className="flex items-center">
                      كلمة المرور
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder={editingUser ? "اترك فارغاً للاحتفاظ بكلمة المرور الحالية" : "كلمة المرور"}
                    />
                    {userFormErrors.password && <p className="text-xs text-red-500 mt-1">{userFormErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-phone">رقم الهاتف</Label>
                    <Input
                      id="user-phone"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">الدور</Label>
                    <Select
                      value={userFormData.role}
                      onValueChange={(value: string) => {
                        setUserFormData((prev) => {
                          const selectedRole = jobRoles.find((r: any) => r.id === value)
                          const updatedData = {
                            ...prev,
                            role: value,
                            permissions: selectedRole ? selectedRole.permissions : [],
                          }
                          if (currentUser && editingUser && editingUser.id === currentUser.id) {
                            const updatedUser = { ...currentUser, role: value, permissions: selectedRole ? selectedRole.permissions : [] }
                            dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
                            localStorage.setItem("currentUser", JSON.stringify(updatedUser))
                          }
                          return updatedData
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {userFormErrors.role && <p className="text-xs text-red-500 mt-1">{userFormErrors.role}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-salary">الراتب الشهري</Label>
                    <div className="relative">
                      <Input
                        id="user-salary"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={userFormData.monthlySalary}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setUserFormData((prev) => ({ ...prev, monthlySalary: Number(val) }))
                        }}
                        placeholder="5000"
                        className="pr-10 text-left ltr:text-left rtl:text-right"
                        style={{ direction: 'ltr' }}
                      />
                      {/* رمز الريال السعودي الجديد */}
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 block dark:hidden" />
                        <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 hidden dark:block" />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="user-active"
                      checked={userFormData.isActive}
                      onCheckedChange={(checked) => setUserFormData((prev) => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="user-active">نشط</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                    {editingUser ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
                             <SwipeToDelete
                 key={user.id}
                 onDelete={() => handleDeleteUser(user.id)}
               >
                <div
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Avatar className="w-10 h-10">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : (
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant="outline">{getRoleText(user.role)}</Badge>
                        {user.monthlySalary && (
                          <Badge variant="outline" className="text-green-600 flex items-center gap-1">
                            {user.monthlySalary.toLocaleString()} 
                            <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 block dark:hidden" />
                            <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 hidden dark:block" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManageUsers && (
                    <div className="flex space-x-1 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditUserDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </SwipeToDelete>
            ))}
          </div>
        </CardContent>
      </Card>
        </>
      )}
      {jobRoleToDelete && (
        <Dialog open={!!jobRoleToDelete} onOpenChange={() => setJobRoleToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
              <DialogDescription>هل أنت متأكد أنك تريد حذف هذا الدور الوظيفي؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setJobRoleToDelete(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={() => { handleDeleteJobRole(jobRoleToDelete!); setJobRoleToDelete(null); }}>حذف</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Success Dialog */}
      {successDialog && (
        <Dialog open={!!successDialog} onOpenChange={() => setSuccessDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تم بنجاح</DialogTitle>
              <DialogDescription>{successDialog}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setSuccessDialog(null)}>إغلاق</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="تأكيد حذف المستخدم"
        description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={users.find(u => u.id === userToDelete)?.name || "المستخدم"}
        type="client"
        error={deleteError}
      />

      {/* Task Types Management */}
      {isAdmin && (
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-foreground">
                <Settings className="w-5 h-5 mr-2" />
                إدارة أنواع المهام
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                إدارة أنواع المهام الافتراضية والمخصصة للمشاريع
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSeedTaskTypes}>
                إضافة المهام الافتراضية
              </Button>
              <Dialog open={isTaskTypeDialogOpen} onOpenChange={setIsTaskTypeDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetTaskTypeForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة نوع مهمة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTaskType ? "تعديل نوع المهمة" : "إضافة نوع مهمة جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTaskType ? "تعديل معلومات نوع المهمة" : "إضافة نوع مهمة جديد للمشاريع"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-type-name">اسم نوع المهمة</Label>
                      <Input
                        id="task-type-name"
                        value={taskTypeFormData.name}
                        onChange={(e) => setTaskTypeFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: رسم مخططات معمارية"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-type-description">الوصف</Label>
                      <Textarea
                        id="task-type-description"
                        value={taskTypeFormData.description}
                        onChange={(e) => setTaskTypeFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر لنوع المهمة"
                      />
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="task-type-default"
                        checked={taskTypeFormData.isDefault}
                        onCheckedChange={(checked) => 
                          setTaskTypeFormData((prev) => ({ ...prev, isDefault: checked as boolean }))
                        }
                      />
                      <Label htmlFor="task-type-default">نوع مهمة افتراضي</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button variant="outline" onClick={() => setIsTaskTypeDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={editingTaskType ? handleUpdateTaskType : handleCreateTaskType}>
                      {editingTaskType ? "تحديث" : "حفظ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskTypes.map((taskType: any) => (
                <Card key={taskType._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{taskType.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{taskType.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {taskType.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            افتراضي
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 space-x-reverse">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditTaskTypeDialog(taskType)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600" 
                        onClick={() => setTaskTypeToDelete(taskType._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {taskTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد أنواع مهام مضافة</p>
                <p className="text-sm mt-1">اضغط على "إضافة المهام الافتراضية" لإضافة الأنواع الأساسية</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Type Delete Confirmation Dialog */}
      {taskTypeToDelete && (
        <Dialog open={!!taskTypeToDelete} onOpenChange={() => setTaskTypeToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
              <DialogDescription>
                هل أنت متأكد أنك تريد حذف هذا النوع من المهام؟ لا يمكن التراجع عن هذا الإجراء.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTaskTypeToDelete(null)}>
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => { 
                  handleDeleteTaskType(taskTypeToDelete!); 
                  setTaskTypeToDelete(null); 
                }}
              >
                حذف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* تم إزالة كرت اختبار الاتصال من صفحة الإعدادات */}
    </div>
  )
}
