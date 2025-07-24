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
  Wifi,
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
import { ConnectionTest } from "@/components/ui/connection-test"

export default function SettingsPage() {
  return (
    <PermissionGuard requiredPermission="view_settings" requiredAction="view" requiredModule="settings" moduleName="صفحة الإعدادات">
      <SettingsPageContent />
    </PermissionGuard>
  )
}

function SettingsPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, showSuccessToast } = useAppActions()
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
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskNotifications: true,
    projectNotifications: true,
    financeNotifications: false,
    systemNotifications: true,
    browserNotifications: true,
  })

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
  }, [currentUser])

  // استماع للتحديثات الفورية للمستخدمين
  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      if (data.action === 'create') {
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
        // تحديث المستخدم في state
        dispatch({ type: "UPDATE_USER", payload: data.user })
      } else if (data.action === 'delete') {
        // حذف المستخدم من state
        dispatch({ type: "DELETE_USER", payload: data.userId })
      }
    }

    // تسجيل المستمع للتحديثات
    const unsubscribe = realtimeUpdates.subscribe("user", handleUserUpdate)

    // تنظيف المستمع عند إلغاء التحميل
    return unsubscribe
  }, [currentUser, dispatch, addNotification])

  // Remove the toggleDarkMode function and its usages

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

    // Update global user info
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        avatar: profileData.avatar,
        password: profileData.newPassword ? profileData.newPassword : currentUser.password,
      }
      
      try {
        // Save to backend database
        const response = await fetch(`/api/users?id=${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUser),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile in database');
        }

        const result = await response.json();
        console.log('Profile updated in database:', result);

        // Save to localStorage
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const updatedUsers = existingUsers.map((u: any) => u.id === currentUser.id ? updatedUser : u)
        localStorage.setItem("users", JSON.stringify(updatedUsers))
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        console.log("Profile updated and saved to localStorage:", updatedUser)
        
        // Update state
        dispatch({ type: "UPDATE_USER", payload: updatedUser })
        dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        
        // إرسال تحديث فوري لجميع المستخدمين
        realtimeUpdates.sendUserUpdate({ action: 'update', user: updatedUser })
        
        setAlert(null)
        setSuccessDialog("تم تحديث الملف الشخصي بنجاح وتم حفظ البيانات في قاعدة البيانات")
        
        // إرسال إشعار للمدير عند تغيير البريد الإلكتروني أو كلمة المرور
        if (currentUser.role !== "admin" && (profileData.email !== currentUser.email || profileData.newPassword)) {
          addNotification({
            userId: "1", // Admin user ID
            title: "تحديث بيانات المستخدم",
            message: `تم تحديث بيانات المستخدم "${currentUser.name}" - ${profileData.email !== currentUser.email ? 'البريد الإلكتروني' : ''}${profileData.email !== currentUser.email && profileData.newPassword ? ' و' : ''}${profileData.newPassword ? 'كلمة المرور' : ''}`,
            type: "system",
            actionUrl: `/settings`,
            triggeredBy: currentUser?.id || "",
            isRead: false,
          })
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        setAlert({ type: "error", message: "حدث خطأ أثناء تحديث الملف الشخصي في قاعدة البيانات" });
      }
    }
  }

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
        setUserFormData(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // أضف متغير API_BASE_URL إذا لم يكن موجودًا
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // جلب إعدادات المكتب من backend
  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/companySettings`);
        const data = await res.json();
        if (data.success && data.data) {
          setOfficeData(prev => ({ ...prev, ...data.data }));
          dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: data.data });
        }
      } catch (err) {}
    }
    fetchCompanySettings();
  }, [dispatch]);

  // جلب إعدادات المستخدم من backend
  useEffect(() => {
    async function fetchUserSettings() {
      if (!currentUser?.id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/userSettings/${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setNotificationSettings(data.data.notificationSettings || notificationSettings);
          dispatch({ type: "UPDATE_USER_SETTINGS", payload: data.data });
        }
      } catch (err) {}
    }
    fetchUserSettings();
  }, [currentUser, dispatch]);

  // جلب الأدوار من backend
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/roles`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setJobRoles(data.data);
        }
      } catch (err) {}
    }
    fetchRoles();
  }, []);

  // حفظ إعدادات المكتب في backend
  const handleOfficeUpdate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companySettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officeData),
      });
      if (!response.ok) throw new Error('Failed to save company settings to database');
      const result = await response.json();
      dispatch({ type: "UPDATE_COMPANY_INFO", payload: officeData });
      setAlert(null);
      setSuccessDialog("تم تحديث بيانات المكتب بنجاح وتم حفظ البيانات في قاعدة البيانات");
      addNotification({
        userId: "1",
        title: "تحديث بيانات المكتب",
        message: "تم تحديث معلومات المكتب بنجاح",
        type: "system",
        actionUrl: `/settings`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      });
    } catch (error) {
      setAlert({ type: "error", message: "حدث خطأ أثناء حفظ إعدادات المكتب في قاعدة البيانات" });
    }
  };

  // حفظ إعدادات الإشعارات للمستخدم في backend
  const handleNotificationUpdate = async () => {
    try {
      if (notificationSettings.browserNotifications && 'Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission !== 'granted') setNotificationSettings(prev => ({ ...prev, browserNotifications: false }));
        });
      }
      const response = await fetch(`${API_BASE_URL}/api/userSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, notificationSettings }),
      });
      if (!response.ok) throw new Error('Failed to save notification settings to database');
      const result = await response.json();
      dispatch({ type: "UPDATE_NOTIFICATION_SETTINGS", payload: notificationSettings });
      setAlert({ type: "success", message: "تم تحديث إعدادات الإشعارات بنجاح" });
      setSuccessDialog("تم تحديث إعدادات الإشعارات بنجاح وتم حفظ البيانات في قاعدة البيانات");
    } catch (error) {
      setAlert({ type: "error", message: "حدث خطأ أثناء حفظ إعدادات الإشعارات في قاعدة البيانات" });
    }
  };

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

    const newUser: UserType = {
      id: Date.now().toString(),
      name: userFormData.name,
      email: email,
      password: password,
      phone: userFormData.phone,
      role: userFormData.role,
      isActive: userFormData.isActive,
      permissions: userFormData.permissions,
      monthlySalary: userFormData.monthlySalary,
      avatar: userFormData.avatar,
      createdAt: new Date().toISOString(),
    }

    console.log("Creating new user:", newUser)

    try {
      // Save to backend database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Failed to save user to database');
      }

      const result = await response.json();
      console.log('User saved to database:', result);

      // Save to localStorage as backup
      existingUsers.push(newUser)
      localStorage.setItem("users", JSON.stringify(existingUsers))
      console.log("Users saved to localStorage:", existingUsers)
      
      // Update global state
      dispatch({ type: "ADD_USER", payload: newUser })
      
      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendUserUpdate({ action: 'create', user: newUser })
      
      // Show success dialog with confirmation
      showSuccessToast("تم إنشاء المستخدم بنجاح", `تم إنشاء المستخدم "${newUser.name}" بنجاح`)
      
      setIsUserDialogOpen(false)
      resetUserForm()
    } catch (error) {
      console.error('Error creating user:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء حفظ المستخدم في قاعدة البيانات" });
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

    const updatedUser: UserType = {
      ...editingUser,
      name: userFormData.name,
      email: userFormData.email,
      password: userFormData.password || editingUser.password, // الاحتفاظ بكلمة المرور القديمة إذا لم يتم تغييرها
      phone: userFormData.phone,
      role: userFormData.role,
      isActive: userFormData.isActive,
      permissions: userFormData.permissions,
      monthlySalary: userFormData.monthlySalary,
      avatar: userFormData.avatar,
    }

    console.log("Updating user:", updatedUser)

    try {
      // Save to backend database
      const response = await fetch(`/api/users?id=${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error('Failed to update user in database');
      }

      const result = await response.json();
      console.log('User updated in database:', result);

      // Save to localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((u: any) => u.id === editingUser.id ? updatedUser : u)
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      
      if (currentUser && editingUser.id === currentUser.id) {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
      
      console.log("Users saved to localStorage:", updatedUsers)
      
      // Update state
      dispatch({ type: "UPDATE_USER", payload: updatedUser })
      
      // If this is the current user, update currentUser as well
      if (currentUser && editingUser.id === currentUser.id) {
        dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        // Also update localStorage
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        
        // Update user permissions based on current role
        const jobRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
        const userRole = jobRoles.find((role: any) => role.id === updatedUser.role)
        if (userRole) {
          const updatedUserWithPermissions = { ...updatedUser, permissions: userRole.permissions }
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUserWithPermissions })
          localStorage.setItem("currentUser", JSON.stringify(updatedUserWithPermissions))
        }
      }
      
      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendUserUpdate({ action: 'update', user: updatedUser })
      
      // إرسال تحديث فوري للصلاحيات لجميع المستخدمين
      realtimeUpdates.sendUserUpdate({ 
        action: 'permissions_update', 
        user: updatedUser,
        userId: currentUser?.id,
        userName: currentUser?.name
      })
      
      // Show success dialog with confirmation
      showSuccessToast("تم تحديث المستخدم بنجاح", `تم تحديث المستخدم "${updatedUser.name}" بنجاح`)
      
      setIsUserDialogOpen(false)
      setEditingUser(null)
      resetUserForm()
      // إعادة تحميل المستخدمين من التخزين بعد التحديث
      reloadUsersFromStorage()
    } catch (error) {
      console.error('Error updating user:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث المستخدم في قاعدة البيانات" });
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
      dispatch({ type: "DELETE_USER", payload: userToDelete })
      // Remove from localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const filteredUsers = existingUsers.filter((u: any) => u.id !== userToDelete)
      localStorage.setItem("users", JSON.stringify(filteredUsers))
      realtimeUpdates.sendUserUpdate({ action: 'delete', userId: userToDelete })
      showSuccessToast("تم حذف المستخدم بنجاح", `تم حذف المستخدم "${user.name}" بنجاح`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setDeleteError("")
    } catch (error) {
      setDeleteError("حدث خطأ أثناء حذف المستخدم")
    }
  }

  const handleCreateJobRole = () => {
    if (!hasPermission(currentUser?.role || "", "create", "roles")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء أدوار وظيفية" })
      return
    }

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

    setJobRoles((prev: any) => [...prev, newJobRole])
    
    // Update rolePermissions dynamically
    rolePermissions[newJobRole.id as keyof typeof rolePermissions] = {
      name: newJobRole.name,
      description: newJobRole.description,
      permissions: newJobRole.permissions,
      modules: newJobRole.modules
    }
    
    // Save to localStorage
    const existingRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
    existingRoles.push(newJobRole)
    localStorage.setItem("jobRoles", JSON.stringify(existingRoles))
    
    // Save updated rolePermissions
    localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions))
    
    // Update current user if they have this role
    if (currentUser && currentUser.role === newJobRole.id) {
      const updatedUser = { ...currentUser, permissions: newJobRole.permissions }
      dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    }
    
    // Show success dialog with confirmation
    setSuccessDialog("تم إنشاء الدور الوظيفي بنجاح وتم حفظ البيانات في التخزين المحلي")
    
    setAlert({ type: "success", message: "تم إنشاء الدور الوظيفي بنجاح" })
    setIsJobRoleDialogOpen(false)
    resetJobRoleForm()
  }

  const handleUpdateJobRole = () => {
    if (!editingJobRole) return
    
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

    setJobRoles((prev: any) => prev.map((role: any) => (role.id === editingJobRole.id ? updatedRole : role)))
    
    // Update rolePermissions dynamically
    rolePermissions[updatedRole.id as keyof typeof rolePermissions] = {
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: updatedRole.permissions,
      modules: updatedRole.modules
    }
    
    // Update in localStorage
    const existingRoles = JSON.parse(localStorage.getItem("jobRoles") || "[]")
    const updatedRoles = existingRoles.map((role: any) => role.id === editingJobRole.id ? updatedRole : role)
    localStorage.setItem("jobRoles", JSON.stringify(updatedRoles))
    
    // Save updated rolePermissions
    localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions))
    
    // Update users with this role including current user
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
    const updatedUsers = existingUsers.map((user: any) => {
      if (user.role === updatedRole.id) {
        return { ...user, permissions: updatedRole.permissions }
      }
      return user
    })
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    users.filter(user => user.role === updatedRole.id).forEach(user => {
      const updatedUser = { ...user, permissions: updatedRole.permissions }
      dispatch({ type: "UPDATE_USER", payload: updatedUser })
      // If this is the current user, update currentUser as well
      if (currentUser && user.id === currentUser.id) {
        dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    })
    
    // Show success dialog with confirmation
    setSuccessDialog("تم تحديث الدور الوظيفي بنجاح وتم حفظ البيانات في التخزين المحلي")
    
    setEditingJobRole(null)
    setAlert({ type: "success", message: "تم تحديث الدور الوظيفي بنجاح" })
    setIsJobRoleDialogOpen(false)
    resetJobRoleForm()
  }

  const handleDeleteJobRole = (roleId: string) => {
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
    
    // Show success dialog with confirmation
    setSuccessDialog("تم حذف الدور الوظيفي بنجاح وتم حفظ البيانات في التخزين المحلي")
    
    setAlert({ type: "success", message: "تم حذف الدور الوظيفي بنجاح" })
  }

  const resetJobRoleForm = () => {
    setJobRoleFormData({
      name: "",
      description: "",
      permissions: [],
    })
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

  // Show only profile settings for non-admin users
  if (!isAdmin) {
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
            {isAdmin ? "إدارة إعدادات النظام والمستخدمين" : "إدارة الملف الشخصي والإعدادات"}
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
        {isAdmin && (
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground"> <Bell className="w-5 h-5 mr-2" /> إعدادات الإشعارات </CardTitle>
          <CardDescription className="text-muted-foreground">تخصيص إعدادات الإشعارات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
                <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد الإلكتروني</p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="task-notifications">إشعارات المهام</Label>
                <p className="text-sm text-muted-foreground">إشعارات المهام الجديدة والتحديثات</p>
              </div>
              <Switch
                id="task-notifications"
                checked={notificationSettings.taskNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, taskNotifications: checked }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="project-notifications">إشعارات المشاريع</Label>
                <p className="text-sm text-muted-foreground">إشعارات المشاريع والتحديثات</p>
              </div>
              <Switch
                id="project-notifications"
                checked={notificationSettings.projectNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, projectNotifications: checked }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="finance-notifications">إشعارات مالية</Label>
                <p className="text-sm text-muted-foreground">إشعارات المعاملات المالية</p>
              </div>
              <Switch
                id="finance-notifications"
                checked={notificationSettings.financeNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, financeNotifications: checked }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="system-notifications">إشعارات النظام</Label>
                <p className="text-sm text-muted-foreground">إشعارات النظام والتحديثات</p>
              </div>
              <Switch
                id="system-notifications"
                checked={notificationSettings.systemNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, systemNotifications: checked }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
              <div>
                <Label htmlFor="browser-notifications">إشعارات المتصفح</Label>
                <p className="text-sm text-muted-foreground">إشعارات المتصفح عند وجود إشعار جديد</p>
              </div>
              <Switch
                id="browser-notifications"
                checked={notificationSettings.browserNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, browserNotifications: checked }))
                }
              />
            </div>
            <Button onClick={handleNotificationUpdate} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
        )}
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

      {/* Connection Test Section - Only for admin */}
      {isAdmin && (
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Wifi className="w-5 h-5 mr-2" />
              اختبار الاتصال
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              اختبار الاتصال مع الخادم وقاعدة البيانات والتحديثات المباشرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionTest />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
