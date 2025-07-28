"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Plus,
  LogIn,
  LogOut,
  Timer,
  Search,
  MapPin,
  User,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { getCurrentUser, hasPermission, canAccessModule } from "@/lib/auth"
import { mockUsers } from "@/lib/data"
import type { User as UserType, AttendanceRecord } from "@/lib/types"
import { ArabicNumber } from "@/components/ui/ArabicNumber"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { realtimeUpdates } from "@/lib/realtime-updates"

export default function AttendancePage() {
  return (
    <PermissionGuard requiredPermission="view_attendance" requiredAction="view" requiredModule="attendance" moduleName="صفحة الحضور">
      <AttendancePageContent />
    </PermissionGuard>
  )
}

function AttendancePageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, showSuccessToast } = useAppActions()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertDialogData, setAlertDialogData] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showMonthlyReportDialog, setShowMonthlyReportDialog] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])

  // Manual check-in/out form data
  const [manualFormData, setManualFormData] = useState({
    employeeId: "",
    action: "checkin" as "checkin" | "checkout",
    time: new Date().toISOString().slice(0, 16),
    notes: "",
  })

  // Employee tracker data
  const [employeeTracker, setEmployeeTracker] = useState<{
    [key: string]: {
      status: "present" | "absent" | "late" | "on_break" | "offline"
      lastSeen: string
      location?: string
      currentTask?: string
    }
  }>({})

  // تحديد الوقت الحالي
  const now = new Date()
  const hour = now.getHours()
  // تحديد الفترات
  const isMorning = hour >= 8 && hour < 12
  const isEvening = hour >= 16 && hour < 21

  // أضف متغير API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // جلب سجلات الحضور من قاعدة البيانات
  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch('/api/attendance', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        const data = await res.json();
        if (data.success) {
          dispatch({ type: "LOAD_ATTENDANCE", payload: data.data });
          setAttendanceRecords(data.data);
        } else {
          console.error('خطأ في جلب سجلات الحضور:', data.error);
        }
      } catch (err) {
        console.error('خطأ في جلب سجلات الحضور:', err);
      }
    }
    fetchAttendance();
  }, [dispatch]);

  // إضافة سجل حضور
  async function handleCreateAttendance(newRecord: AttendanceRecord) {
    try {
      const attendanceData = {
        ...newRecord,
        id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdBy: currentUser?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isManualEntry: false,
        device: navigator.userAgent,
        ipAddress: "client-side"
      };

      console.log('🔄 Sending attendance data to backend:', attendanceData);

      const res = await fetch('/api/attendance', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(attendanceData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Backend response:', data);
      
      if (data.success && data.data) {
        dispatch({ type: "ADD_ATTENDANCE", payload: data.data });
        setAttendanceRecords((prev) => [...prev, data.data]);
        setAlert({ type: "success", message: "تم حفظ الحضور في قاعدة البيانات بنجاح" });
        
        // بث تحديث فوري لجميع المستخدمين - مع فحص الأمان
        try {
          if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
            const realtimeUpdates = (window as any).realtimeUpdates;
            if (typeof realtimeUpdates.sendAttendanceUpdate === 'function') {
              realtimeUpdates.sendAttendanceUpdate({ 
            attendance: data.data, 
                userId: data.data.userId || "", 
                userName: data.data.userName || "" 
          });
              console.log('✅ Realtime update sent successfully');
            } else {
              console.warn('⚠️ sendAttendanceUpdate function not found');
            }
          } else {
            console.warn('⚠️ realtimeUpdates not available');
          }
        } catch (realtimeError) {
          console.error('❌ Realtime update error:', realtimeError);
          // لا نريد أن يفشل الحفظ بسبب مشكلة التحديث الفوري
        }
      } else {
        setAlert({ type: "error", message: data.error || "فشل حفظ الحضور في قاعدة البيانات" });
      }
    } catch (err) {
      console.error('❌ Error saving attendance:', err);
      setAlert({ type: "error", message: `حدث خطأ أثناء حفظ الحضور في قاعدة البيانات: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` });
    }
  }

  // تحديث سجل حضور
  async function handleUpdateAttendance(id: string, updatedRecord: AttendanceRecord) {
    try {
      const attendanceData = {
        ...updatedRecord,
        updatedAt: new Date().toISOString(),
        isManualEntry: updatedRecord.isManualEntry || false,
        manualEntryBy: updatedRecord.isManualEntry ? currentUser?.id || "" : undefined
      };

      const res = await fetch(`/api/attendance/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(attendanceData),
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        dispatch({ type: "UPDATE_ATTENDANCE", payload: data.data });
        setAttendanceRecords((prev) => prev.map((r) => r.id === id ? data.data : r));
        setAlert({ type: "success", message: "تم تحديث الحضور في قاعدة البيانات بنجاح" });
        
        // بث تحديث فوري لجميع المستخدمين - مع فحص الأمان
        try {
          if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
            const realtimeUpdates = (window as any).realtimeUpdates;
            if (typeof realtimeUpdates.sendAttendanceUpdate === 'function') {
              realtimeUpdates.sendAttendanceUpdate({ 
            attendance: data.data, 
                userId: data.data.userId || "", 
                userName: data.data.userName || "" 
          });
            }
          }
        } catch (realtimeError) {
          console.error('❌ Realtime update error:', realtimeError);
        }
      } else {
        setAlert({ type: "error", message: data.error || "فشل تحديث الحضور في قاعدة البيانات" });
      }
    } catch (err) {
      console.error('خطأ في تحديث الحضور:', err);
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث الحضور في قاعدة البيانات" });
    }
  }

  // حذف سجل حضور
  async function handleDeleteAttendance(id: string) {
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      const data = await res.json();
      if (data.success) {
        // إزالة السجل من القائمة بدلاً من dispatch
        setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
        setAlert({ type: "success", message: "تم حذف السجل بنجاح" });
        
        // بث تحديث فوري لجميع المستخدمين - مع فحص الأمان
        try {
          if (typeof window !== 'undefined' && (window as any).realtimeUpdates && data.data) {
            const realtimeUpdates = (window as any).realtimeUpdates;
            if (typeof realtimeUpdates.sendAttendanceUpdate === 'function') {
              realtimeUpdates.sendAttendanceUpdate({ 
            attendance: data.data, 
                userId: data.data.userId || "", 
                userName: data.data.userName || "" 
          });
            }
          }
        } catch (realtimeError) {
          console.error('❌ Realtime update error:', realtimeError);
        }
      } else {
        setAlert({ type: "error", message: data.error || "فشل حذف سجل الحضور من قاعدة البيانات" });
      }
    } catch (err) {
      console.error('خطأ في حذف سجل الحضور:', err);
      setAlert({ type: "error", message: "حدث خطأ أثناء حذف سجل الحضور من قاعدة البيانات" });
    }
  }

  // تحميل المستخدمين من localStorage
  useEffect(() => {
    // تحميل المستخدمين من localStorage
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]")
    setUsers(storedUsers)
    
    // تحميل سجلات الحضور من localStorage - المدير يرى جميع السجلات
    const stored = localStorage.getItem("attendanceRecords")
    if (stored) {
      const allRecords = JSON.parse(stored)
      setAttendanceRecords(allRecords)
    }
    
    // تحميل المستخدم الحالي
    const user = getCurrentUser()
    setCurrentUser(user)

    // إضافة مراقب لتغييرات المستخدمين وسجلات الحضور في localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "users") {
        const updatedUsers = JSON.parse(event.newValue || "[]")
        setUsers(updatedUsers)
      }
      if (event.key === "attendanceRecords") {
        const updatedRecords = JSON.parse(event.newValue || "[]")
        setAttendanceRecords(updatedRecords)
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Save attendance to localStorage on change
  useEffect(() => {
    // تحديث attendanceRecords في localStorage عند أي تغيير
    localStorage.setItem("attendanceRecords", JSON.stringify(attendanceRecords))
    // تحديث سجلات اليوم
    if (currentUser) {
      const today = new Date().toISOString().split("T")[0]
      setTodayRecords(attendanceRecords.filter(r => r.userId === currentUser.id && r.date === today))
    }
  }, [attendanceRecords, currentUser])

  // تحديد الفترة تلقائياً
  const getCurrentSession = () => {
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 8 && hour < 12) return "morning"
    if (hour >= 16 && hour < 21) return "evening"
    return null
  }

  // الحصول على سجلات اليوم للمستخدم الحالي
  const getTodayRecords = () => {
    if (!currentUser) return []
    const today = new Date().toISOString().split("T")[0]
    return attendanceRecords.filter(r => r.userId === currentUser.id && r.date === today)
  }

  // الحصول على سجلات الشهر للمستخدم الحالي (للمدير: جميع المستخدمين)
  const getMonthlyRecords = () => {
    if (!currentUser) return []
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    if (currentUser.role === "admin") {
      return attendanceRecords.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      })
    } else {
      return attendanceRecords.filter(r => {
        const recordDate = new Date(r.date)
        return r.userId === currentUser.id && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear
      })
    }
  }

  // التحقق من إمكانية تسجيل الحضور للفترة الحالية
  const canCheckInForSession = (session: "morning" | "evening") => {
    if (!currentUser) return false
    const today = new Date().toISOString().split("T")[0]
    return !attendanceRecords.some(r => r.userId === currentUser.id && r.date === today && r.session === session)
  }

  // التحقق من إمكانية تسجيل الانصراف للفترة
  const canCheckOutForSession = (session: "morning" | "evening") => {
    if (!currentUser) return false
    const today = new Date().toISOString().split("T")[0]
    return attendanceRecords.some(r => r.userId === currentUser.id && r.date === today && r.session === session && !r.checkOut)
  }

  // دالة لعرض التنبيهات في مربع حواري
  const showAlertDialogMessage = (type: "success" | "error", message: string) => {
    setAlertDialogData({ type, message })
    setShowAlertDialog(true)
    
    // إخفاء التنبيه تلقائياً بعد 5 ثواني
    setTimeout(() => {
      setShowAlertDialog(false)
      setAlertDialogData(null)
    }, 5000)
  }

  // إضافة دالة لحساب إحصائيات الموظف الشهرية - التاريخ الميلادي
  const getEmployeeMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = monthEnd.getDate();
    
    // سجلات الحضور للموظف الحالي في الشهر الحالي (التاريخ الميلادي)
    const employeeMonthlyRecords = attendanceRecords.filter(r => {
      const recordDate = new Date(r.date);
      return r.userId === currentUser?.id && 
             recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear;
    });

    // أيام الحضور (بناءً على التاريخ الميلادي)
    const presentDays = employeeMonthlyRecords.reduce((acc, r) => acc.add(r.date), new Set()).size;
    
    // أيام الغياب (بناءً على التاريخ الميلادي)
    const absentDays = totalDays - presentDays;
    
    // إجمالي الساعات الشهرية (من بداية الشهر الميلادي حتى اليوم الحالي)
    const totalMonthlyHours = Math.ceil(employeeMonthlyRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0));
    
    // ساعات إضافية (بناءً على التاريخ الميلادي)
    const overtimeHours = Math.round(employeeMonthlyRecords.reduce((sum, r) => sum + Math.max(0, (r.totalHours || 0) - 9), 0));

    return {
      presentDays,
      absentDays,
      totalMonthlyHours,
      overtimeHours
    };
  };

  // إضافة دالة لإرسال إشعار للمدير عند تسجيل حضور/انصراف
  const notifyManager = async (action: 'checkin' | 'checkout', session: string) => {
    if (currentUser?.role === 'admin') return; // المدير لا يرسل إشعار لنفسه
    
    try {
      const sessionText = session === 'morning' ? 'صباحية' : 'مسائية';
      const actionText = action === 'checkin' ? 'حضور' : 'انصراف';
      
      // إرسال إشعار لجميع المديرين
      const adminUsers = users.filter(user => user.role === 'admin');
      
      for (const adminUser of adminUsers) {
        await addNotification({
          userId: adminUser.id,
          title: `تسجيل ${actionText}`,
          message: `${currentUser?.name} قام بتسجيل ${actionText} في الفترة ${sessionText}`,
          type: "attendance",
          actionUrl: `/attendance`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
        } as any);
      }
      
      console.log(`تم إرسال إشعار ${actionText} للمديرين:`, adminUsers.map(u => u.name));
    } catch (error) {
      console.error('Error sending notification to manager:', error);
    }
  };

  // تعديل الكروت الإحصائية بناءً على دور المستخدم
  const renderStatsCards = () => {
    // للمدير والموارد البشرية: عرض إحصائيات جميع الموظفين
    if (currentUser?.role === 'admin' || currentUser?.role === 'hr') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الحاضرون</p>
                  <p className="text-2xl font-bold text-green-600"><ArabicNumber value={todayStats.present} /></p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المتأخرون</p>
                  <p className="text-2xl font-bold text-yellow-600"><ArabicNumber value={todayStats.late} /></p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الغائبون</p>
                  <p className="text-2xl font-bold text-red-600"><ArabicNumber value={todayStats.absent} /></p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الساعات</p>
                  <p className="text-2xl font-bold text-blue-600"><ArabicNumber value={todayStats.totalHours} /></p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ساعات إضافية</p>
                  <p className="text-2xl font-bold text-orange-600">
                    <ArabicNumber value={todayStats.overtimeHours} />
                  </p>
                </div>
                <Timer className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // للموظفين العاديين: عرض إحصائياتهم الشخصية الشهرية
    const employeeStats = getEmployeeMonthlyStats();
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">أيام الحضور</p>
                <p className="text-2xl font-bold text-green-600"><ArabicNumber value={employeeStats.presentDays} /></p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">أيام الغياب</p>
                <p className="text-2xl font-bold text-red-600"><ArabicNumber value={employeeStats.absentDays} /></p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الساعات</p>
                <p className="text-2xl font-bold text-blue-600"><ArabicNumber value={employeeStats.totalMonthlyHours} /></p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ساعات إضافية</p>
                <p className="text-2xl font-bold text-orange-600">
                  <ArabicNumber value={employeeStats.overtimeHours} />
                </p>
              </div>
              <Timer className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleCheckIn = (session: "morning" | "evening") => {
    if (!currentUser) return;

    const now = new Date();
    const currentTime = now.toISOString();
    const today = now.toISOString().split("T")[0];
    
    // التحقق من عدم وجود تسجيل حضور سابق لنفس الفترة
    const existingRecord = attendanceRecords.find(
      (r) => r.userId === currentUser.id && r.date === today && r.session === session
    );

    if (existingRecord) {
      setAlert({ type: "error", message: "تم تسجيل الحضور مسبقاً لهذه الفترة" });
      return;
    }

    // التحقق من الوقت المسموح لتسجيل الحضور
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (session === "morning") {
      // الفترة الصباحية: يمكن تسجيل الحضور حتى الساعة 12:00 ظهراً
      if (hour >= 12) {
        setAlert({ type: "error", message: "لا يمكن تسجيل الحضور للفترة الصباحية بعد الساعة 12:00 ظهراً" });
        return;
      }
    } else {
      // الفترة المسائية: يمكن تسجيل الحضور حتى الساعة 9:00 مساءً
      if (hour >= 21) {
        setAlert({ type: "error", message: "لا يمكن تسجيل الحضور للفترة المسائية بعد الساعة 9:00 مساءً" });
        return;
      }
    }

    // تحديد حالة الحضور بناءً على الوقت
    let status = "present";
    
    if (session === "morning") {
      // الفترة الصباحية: 8:00 - 12:00
      if (hour > 8 || (hour === 8 && minute > 15)) {
        status = "late";
      }
    } else {
      // الفترة المسائية: 16:00 - 21:00
      if (hour > 16 || (hour === 16 && minute > 15)) {
        status = "late";
      }
    }

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name || "",
      date: today,
      session: session,
      checkIn: currentTime,
      checkOut: "",
      totalHours: 0,
      overtimeHours: 0,
      status: status as "present" | "absent" | "late" | "overtime",
      notes: "",
      location: "",
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    handleCreateAttendance(newRecord);
    
    // إرسال إشعار للمدير
    notifyManager('checkin', session);
    
    // رسالة نجاح
    setAlert({ type: "success", message: `تم تسجيل الحضور بنجاح للفترة ${session === 'morning' ? 'الصباحية' : 'المسائية'}` });
    showSuccessToast("تم تسجيل الحضور بنجاح", `تم تسجيل الحضور للفترة ${session === 'morning' ? 'الصباحية' : 'المسائية'} بنجاح`);
  };

  const handleCheckOut = (session: "morning" | "evening") => {
    if (!currentUser) return;

    const now = new Date();
    const currentTime = now.toISOString();
    const today = now.toISOString().split("T")[0];

    // البحث عن سجل الحضور الموجود
    const existingRecord = attendanceRecords.find(
      (r) => r.userId === currentUser.id && r.date === today && r.session === session
    );

    if (!existingRecord) {
      setAlert({ type: "error", message: "لم يتم العثور على سجل حضور لهذه الفترة" });
      return;
    }

    if (existingRecord.checkOut) {
      setAlert({ type: "error", message: "تم تسجيل الانصراف مسبقاً لهذه الفترة" });
      return;
    }

    // التحقق من أن الوقت مناسب لتسجيل الانصراف
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (session === "morning") {
      // الفترة الصباحية: يمكن تسجيل الانصراف من 12:00 فصاعداً
      if (hour < 12) {
        setAlert({ type: "error", message: "لا يمكن تسجيل الانصراف قبل الساعة 12:00 للفترة الصباحية" });
        return;
      }
    } else {
      // الفترة المسائية: يمكن تسجيل الانصراف من 21:00 فصاعداً
      if (hour < 21) {
        setAlert({ type: "error", message: "لا يمكن تسجيل الانصراف قبل الساعة 21:00 للفترة المسائية" });
        return;
      }
    }

    // حساب الساعات
    const checkInTime = new Date(existingRecord.checkIn || "");
    const checkOutTime = now;
    const totalHours = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) * 100) / 100;
    
    // حساب الساعات الإضافية (أكثر من 9 ساعات)
    const overtimeHours = Math.max(0, totalHours - 9);

    // إنشاء سجل انصراف جديد بدلاً من تحديث السجل الموجود
    const checkoutRecord: AttendanceRecord = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name || "",
      date: today,
      session: session,
      checkIn: existingRecord.checkIn || "",
      checkOut: currentTime,
      totalHours: totalHours,
      overtimeHours: overtimeHours,
      status: existingRecord.status,
      notes: "",
      location: "",
      createdAt: existingRecord.createdAt || currentTime,
      updatedAt: currentTime,
    };

    // استخدام handleCreateAttendance بدلاً من handleUpdateAttendance
    handleCreateAttendance(checkoutRecord);
    
    // إرسال إشعار للمدير
    notifyManager('checkout', session);
    
    // رسالة نجاح
    setAlert({ type: "success", message: `تم تسجيل الانصراف بنجاح للفترة ${session === 'morning' ? 'الصباحية' : 'المسائية'}` });
    showSuccessToast("تم تسجيل الانصراف بنجاح", `تم تسجيل الانصراف للفترة ${session === 'morning' ? 'الصباحية' : 'المسائية'} بنجاح`);
  };

  const handleManualCheckInOut = async () => {
    if (!manualFormData.employeeId) {
      setAlert({ type: "error", message: "يرجى اختيار الموظف" })
      return
    }

    const employee = users.find(u => u.id === manualFormData.employeeId)
    if (!employee) {
      setAlert({ type: "error", message: "لم يتم العثور على الموظف" })
      return
    }

    const actionTime = new Date(manualFormData.time)
    const today = actionTime.toISOString().split("T")[0]

    if (manualFormData.action === "checkin") {
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        userId: employee.id,
        userName: employee.name || "",
        checkIn: actionTime.toISOString(),
        date: today,
        status: actionTime.getHours() > 8 ? "late" : "present",
        session: "morning",
        regularHours: 0,
        lateHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        checkOut: "",
        notes: "",
        location: "",
        createdAt: actionTime.toISOString(),
        updatedAt: actionTime.toISOString(),
      }

      // حفظ في قاعدة البيانات
      try {
        await handleCreateAttendance(newRecord);
      } catch (error) {
        console.error('Error saving manual attendance to database:', error);
      }
      
      setAttendanceRecords((prev) => [...prev, newRecord])
      
      // بث تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendAttendanceUpdate({ attendance: newRecord, userId: employee.id, userName: employee.name || "" })
    } else {
      // Find existing record for checkout
      const existingRecord = attendanceRecords.find(r => r.userId === employee.id && r.date === today)
      if (!existingRecord) {
        setAlert({ type: "error", message: "لا يوجد تسجيل حضور لهذا الموظف اليوم" })
        return
      }

      const checkInTime = new Date(existingRecord.checkIn || "")
      const totalHours = (actionTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        checkOut: actionTime.toISOString(),
        totalHours: Math.round(totalHours * 100) / 100,
      }

      // حفظ في قاعدة البيانات
      try {
        await handleUpdateAttendance(existingRecord.id, updatedRecord);
      } catch (error) {
        console.error('Error updating manual checkout in database:', error);
      }
      
      setAttendanceRecords((prev) => prev.map((record) => (record.id === existingRecord.id ? updatedRecord : record)))
      
      // بث تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendAttendanceUpdate({ attendance: updatedRecord, userId: employee.id, userName: employee.name || "" })
    }

    // إرسال إشعار للمدير إذا كان المستخدم الحالي هو الموارد البشرية
    if (currentUser?.role === 'hr') {
      const adminUsers = users.filter(user => user.role === 'admin');
      for (const adminUser of adminUsers) {
        addNotification({
          userId: adminUser.id,
          title: "تسجيل يدوي للحضور",
          message: `تم تسجيل ${manualFormData.action === "checkin" ? "الحضور" : "الانصراف"} يدوياً للموظف "${employee.name}" بواسطة الموارد البشرية`,
          type: "attendance",
          actionUrl: `/attendance`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
        } as any);
      }
    }

    setAlert({ type: "success", message: `تم تسجيل ${manualFormData.action === "checkin" ? "الحضور" : "الانصراف"} بنجاح` })
    showSuccessToast(`تم تسجيل ${manualFormData.action === "checkin" ? "الحضور" : "الانصراف"} بنجاح`, `تم تسجيل ${manualFormData.action === "checkin" ? "الحضور" : "الانصراف"} يدوياً بنجاح`)
    setIsManualDialogOpen(false)
    setManualFormData({
      employeeId: "",
      action: "checkin",
      time: new Date().toISOString().slice(0, 16),
      notes: "",
    })
  }

  const exportAttendancePDF = () => {
    const fileName = `attendance_report_${selectedDate}.pdf`
    
    // Simulate PDF export
    console.log(`Exporting attendance report to ${fileName}`)
    
    addNotification({
      userId: "1",
      title: "تصدير تقرير الحضور",
      message: `تم تصدير تقرير الحضور للتاريخ ${selectedDate} بنجاح`,
      type: "attendance",
      actionUrl: `/attendance`,
      triggeredBy: currentUser?.id || "",
      isRead: false,
    } as any)

    setAlert({ type: "success", message: "تم تصدير التقرير بنجاح" })
    showSuccessToast("تم تصدير التقرير بنجاح", "تم تصدير تقرير الحضور بنجاح")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "default"
      case "late":
        return "destructive"
      case "absent":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "حاضر"
      case "late":
        return "متأخر"
      case "absent":
        return "غائب"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "late":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrackerStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "on_break":
        return "bg-blue-100 text-blue-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrackerStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "حاضر"
      case "absent":
        return "غائب"
      case "late":
        return "متأخر"
      case "on_break":
        return "في استراحة"
      case "offline":
        return "غير متصل"
      default:
        return status
    }
  }

  // Calculate overtime for each record
  const calculateOvertime = (totalHours: number) => {
    const regularHours = 9 // Standard work hours
    return Math.max(0, totalHours - regularHours)
  }

  const calculateOvertimePay = (overtimeHours: number, monthlySalary: number = 5000) => {
    const hourlyRate = monthlySalary / 26 / 9 // Monthly salary / 26 days / 9 hours
    return overtimeHours * hourlyRate * 1.5 // 1.5x for overtime
  }

  const filteredRecords = attendanceRecords
    .filter((record) => record.date === selectedDate)
    .filter((record) => 
      // للمدير والموارد البشرية: عرض جميع السجلات، للموظفين: عرض سجلاتهم فقط
      (currentUser?.role === 'admin' || currentUser?.role === 'hr') ? 
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) :
        record.userId === currentUser?.id
    )

  // حساب الإحصائيات بناءً على الأشخاص الفعليين وليس السجلات
  const today = new Date().toISOString().split("T")[0];
  
  // الحصول على الأشخاص الذين حضروا اليوم (فريدة)
  const presentUserIds = new Set(
    filteredRecords
      .filter((r) => r.status === "present" && r.date === today)
      .map((r) => r.userId)
  );
  
  // الحصول على الأشخاص الذين تأخروا اليوم (فريدة)
  const lateUserIds = new Set(
    filteredRecords
      .filter((r) => r.status === "late" && r.date === today)
      .map((r) => r.userId)
  );
  
  // الحصول على جميع الأشخاص الذين حضروا اليوم (فريدة)
  const allPresentUserIds = new Set(
    filteredRecords
      .filter((r) => r.date === today)
      .map((r) => r.userId)
  );
  
  // الأشخاص الغائبون = إجمالي المستخدمين - الحاضرون
  const absentCount = users.length - allPresentUserIds.size;
  
  const todayStats = {
    present: presentUserIds.size,
    late: lateUserIds.size,
    absent: absentCount,
    totalHours: filteredRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
    overtimeHours: filteredRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
  }

  const canManageAttendance = hasPermission(currentUser?.role || "", "edit", "attendance")
  const canViewAttendance = hasPermission(currentUser?.role || "", "view", "attendance")
  const canCheckInOut = hasPermission(currentUser?.role || "", "checkin", "attendance") || 
                       hasPermission(currentUser?.role || "", "checkout", "attendance")

  // Check if user is logged in
  if (!currentUser) {
    return (
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">يرجى تسجيل الدخول</h1>
          <p className="text-muted-foreground">يجب تسجيل الدخول للوصول إلى صفحة الحضور</p>
        </div>
      </div>
    )
  }

  let monthlyReportDialogContent = null;
  if (selectedEmployeeForReport) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = monthEnd.getDate();
    const employee = users.find(u => u.id === selectedEmployeeForReport);
    const monthlyRecords = attendanceRecords.filter(r => {
      const recordDate = new Date(r.date);
      return r.userId === selectedEmployeeForReport && recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    const presentDays = monthlyRecords.reduce((acc, r) => acc.add(r.date), new Set()).size;
    const absentDays = totalDays - presentDays;
    const totalHours = Math.ceil(monthlyRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0));
    const overtimeHours = Math.round(monthlyRecords.reduce((sum, r) => sum + Math.max(0, (r.totalHours || 0) - 9), 0));
    const monthlySalary = employee?.monthlySalary || 5000;
    const hourlyRate = Math.round((monthlySalary / 26 / 9) * 1.5);
    const overtimePay = Math.round(overtimeHours * hourlyRate);
    const roundedHourlyRate = hourlyRate;
    const exportEmployeeMonthlyPDF = () => {
      const companyLogo = state.companySettings?.logo || "";
      const companyName = state.companySettings?.name || "اسم الشركة";
      const companyPhones = "0557917094 - 0533560878";
      let tableRows = "";
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        // بناء dateStr بشكل يدوي yyyy-mm-dd
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const record = monthlyRecords.find(r => r.date === dateStr);
        tableRows += `<tr${day === Math.ceil(totalDays / 2) + 1 ? ' class=\"page-break\"' : ''}>
          <td>${day}</td>
          <td>${date.toLocaleDateString("ar-SA", { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
          <td>${record ? (record.checkIn ? new Date(record.checkIn).toLocaleTimeString("ar-SA") : "-") : "-"}</td>
          <td>${record ? (record.checkOut ? new Date(record.checkOut).toLocaleTimeString("ar-SA") : "-") : "-"}</td>
          <td>${record ? (record.totalHours || 0) : "-"}</td>
          <td>${record ? (record.overtimeHours || 0) : "-"}</td>
          <td>${record ? getStatusText(record.status) : "غائب"}</td>
        </tr>`;
      }
      const pdfContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير الحضور الشهري</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
            .main-box { background: #fff; margin: 24px auto; border-radius: 12px; box-shadow: 0 2px 12px #0001; max-width: 900px; padding: 32px; }
            .header-flex { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #eee; padding-bottom: 16px; margin-bottom: 16px; }
            .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; background: #fff; }
            .title { font-size: 2rem; font-weight: bold; color: #1a237e; }
            .company-name { font-size: 1.2rem; color: #333; margin-top: 4px; }
            .summary-cards { display: flex; gap: 16px; margin: 24px 0; }
            .summary-card { flex: 1; background: #f1f8e9; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 4px #0001; }
            .summary-card.absent { background: #ffebee; }
            .summary-card.overtime { background: #fffde7; }
            .summary-card.salary { background: #e3f2fd; }
            .summary-title { font-size: 1.1rem; color: #666; margin-bottom: 8px; }
            .summary-value { font-size: 1.7rem; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; background: #fafafa; }
            th, td { border: 1px solid #e0e0e0; padding: 8px 4px; text-align: center; }
            th { background: #1976d2; color: #fff; font-weight: bold; }
            tr:nth-child(even) { background: #f5f5f5; }
            tr:nth-child(odd) { background: #fff; }
            .footer { margin-top: 32px; border-top: 2px solid #eee; padding-top: 16px; display: flex; align-items: center; justify-content: space-between; color: #888; font-size: 1rem; }
            .footer-logo { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; background: #fff; }
            @media print {
              table, tr, td, th { page-break-inside: avoid !important; }
              tbody { display: table-row-group; }
              /* تقسيم الجدول إلى صفحتين فقط */
              tr.page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="main-box">
            <div class="header-flex">
              ${(companyLogo && companyLogo !== "undefined") ? `<img src="${companyLogo}" alt="شعار الشركة" class="logo" />` : ""}
              <div>
                <div class="title">تقرير الحضور الشهري</div>
                <div class="company-name">${companyName}</div>
                <div style="font-size:1rem;color:#888;margin-top:4px;">${employee?.name || "-"}</div>
              </div>
            </div>
            <div class="summary-cards">
              <div class="summary-card"><div class="summary-title">أيام الحضور</div><div class="summary-value">${presentDays}</div></div>
              <div class="summary-card absent"><div class="summary-title">أيام الغياب</div><div class="summary-value">${absentDays}</div></div>
              <div class="summary-card"><div class="summary-title">إجمالي الساعات</div><div class="summary-value">${totalHours}</div></div>
              <div class="summary-card overtime"><div class="summary-title">ساعات إضافية</div><div class="summary-value">${overtimeHours}</div></div>
              <div class="summary-card salary"><div class="summary-title">سعر الساعة الإضافية</div><div class="summary-value">${roundedHourlyRate}</div></div>
              <div class="summary-card salary"><div class="summary-title">إجمالي الراتب الإضافي</div><div class="summary-value">${overtimePay}</div></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>اليوم</th>
                  <th>التاريخ</th>
                  <th>الحضور</th>
                  <th>الانصراف</th>
                  <th>الساعات</th>
                  <th>إضافية</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="footer">
              <div>أرقام التواصل: ${companyPhones}</div>
              ${(companyLogo && companyLogo !== "undefined") ? `<img src="${companyLogo}" alt="شعار الشركة" class="footer-logo" />` : ""}
            </div>
          </div>
        </body>
        </html>
      `
      const win = window.open("", "_blank");
      win?.document.write(pdfContent);
      win?.document.close();
      win?.print();
    };
    monthlyReportDialogContent = (
      <div>
        <div className="flex justify-end mb-4">
          <Button variant="default" onClick={exportEmployeeMonthlyPDF}>
            <Download className="w-4 h-4 mr-2" />
            تصدير PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">نظام الحضور والانصراف</h1>
          <p className="text-muted-foreground mt-1">تتبع حضور الموظفين وساعات العمل</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          {(canManageAttendance || currentUser?.role === 'hr') && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedEmployeeForReport}
                onValueChange={setSelectedEmployeeForReport}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر الموظف للتقرير الشهري" />
                </SelectTrigger>
                <SelectContent>
                        {users
                          .filter((user, index, self) => 
                            // إزالة التكرار بناءً على المعرف
                            index === self.findIndex(u => u.id === user.id)
                          )
                          .map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={!selectedEmployeeForReport}
                onClick={() => setShowMonthlyReportDialog(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                تصدير التقرير الشهري
              </Button>
            </div>
          )}
          {/* Manual Check-in/out Section - للمدير والموارد البشرية */}
          {(currentUser?.role === "admin" || currentUser?.role === "hr") && (
            <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  تسجيل يدوي
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تسجيل حضور يدوي</DialogTitle>
                  <DialogDescription>تسجيل حضور أو انصراف لموظف</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">الموظف</Label>
                    <Select
                      value={manualFormData.employeeId}
                      onValueChange={(value) => setManualFormData(prev => ({ ...prev, employeeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">الإجراء</Label>
                    <Select
                      value={manualFormData.action}
                      onValueChange={(value: "checkin" | "checkout") => 
                        setManualFormData(prev => ({ ...prev, action: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الإجراء" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkin">تسجيل حضور</SelectItem>
                        <SelectItem value="checkout">تسجيل انصراف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">الوقت</Label>
                    <Input 
                      id="time" 
                      type="datetime-local" 
                      value={manualFormData.time}
                      onChange={(e) => setManualFormData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Input 
                      id="notes" 
                      placeholder="ملاحظات إضافية (اختياري)"
                      value={manualFormData.notes}
                      onChange={(e) => setManualFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleManualCheckInOut}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {(canManageAttendance || currentUser?.role === 'hr') && (
            <Button variant="outline" onClick={exportAttendancePDF}>
              <Download className="w-4 h-4 mr-2" />
              تصدير التقرير
            </Button>
          )}
        </div>
      </div>

      {/* Check In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            تسجيل الحضور والانصراف
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {currentUser?.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{currentUser?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {getTodayRecords().length > 0 ? (
                    <>
                      سجلات اليوم: {getTodayRecords().length} فترة
                    </>
                  ) : (
                    "لم يتم تسجيل حضور اليوم"
                  )}
                </p>
              </div>
            </div>

            {/* Session Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Morning Session */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    الفترة الصباحية
                  </CardTitle>
                  <CardDescription>8:00 صباحاً - 12:00 ظهراً</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const morningRecord = getTodayRecords().find(r => r.session === "morning")
                    return (
                      <>
                        {morningRecord ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">الحضور:</span>
                              <span className="font-medium">
                                {morningRecord.checkIn ? new Date(morningRecord.checkIn).toLocaleTimeString("ar-SA") : "--"}
                              </span>
                            </div>
                            {morningRecord.checkOut && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">الانصراف:</span>
                                <span className="font-medium">
                                  {new Date(morningRecord.checkOut).toLocaleTimeString("ar-SA")}
                                </span>
                              </div>
                            )}
                            {morningRecord.totalHours > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">الساعات:</span>
                                <span className="font-medium">{morningRecord.totalHours} ساعة</span>
                              </div>
                            )}
                            {morningRecord.overtimeHours > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">إضافية:</span>
                                <span className="font-medium text-orange-600">{morningRecord.overtimeHours} ساعة</span>
                              </div>
                            )}
                            <Badge className={`w-full justify-center ${getStatusColor(morningRecord.status)}`}>
                              {getStatusText(morningRecord.status)}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground mb-3">لم يتم تسجيل الحضور</p>
                            {canCheckInForSession("morning") ? (
                              <Button onClick={() => handleCheckIn("morning")} className="w-full">
                                <LogIn className="w-4 h-4 mr-2" />
                                تسجيل حضور
                              </Button>
                            ) : canCheckOutForSession("morning") ? (
                              <Button onClick={() => handleCheckOut("morning")} className="w-full" variant="outline">
                                <LogOut className="w-4 h-4 mr-2" />
                                تسجيل انصراف
                              </Button>
                            ) : (
                              <Badge variant="outline" className="w-full justify-center">
                                تم التسجيل
                              </Badge>
                            )}
                          </div>
                        )}
                        {morningRecord && !morningRecord.checkOut && canCheckOutForSession("morning") && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleCheckOut("morning")}
                            className="w-full"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            تسجيل انصراف
                          </Button>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Evening Session */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    الفترة المسائية
                  </CardTitle>
                  <CardDescription>4:00 مساءً - 9:00 مساءً</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const eveningRecord = getTodayRecords().find(r => r.session === "evening")
                    return (
                      <>
                        {eveningRecord ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">الحضور:</span>
                              <span className="font-medium">
                                {eveningRecord.checkIn ? new Date(eveningRecord.checkIn).toLocaleTimeString("ar-SA") : "--"}
                              </span>
                            </div>
                            {eveningRecord.checkOut && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">الانصراف:</span>
                                <span className="font-medium">
                                  {new Date(eveningRecord.checkOut).toLocaleTimeString("ar-SA")}
                                </span>
                              </div>
                            )}
                            {eveningRecord.totalHours > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">الساعات:</span>
                                <span className="font-medium">{eveningRecord.totalHours} ساعة</span>
                              </div>
                            )}
                            {eveningRecord.overtimeHours > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">إضافية:</span>
                                <span className="font-medium text-orange-600">{eveningRecord.overtimeHours} ساعة</span>
                              </div>
                            )}
                            <Badge className={`w-full justify-center ${getStatusColor(eveningRecord.status)}`}>
                              {getStatusText(eveningRecord.status)}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground mb-3">لم يتم تسجيل الحضور</p>
                            {canCheckInForSession("evening") ? (
                              <Button onClick={() => handleCheckIn("evening")} className="w-full">
                                <LogIn className="w-4 h-4 mr-2" />
                                تسجيل حضور
                              </Button>
                            ) : canCheckOutForSession("evening") ? (
                              <Button onClick={() => handleCheckOut("evening")} className="w-full" variant="outline">
                                <LogOut className="w-4 h-4 mr-2" />
                                تسجيل انصراف
                              </Button>
                            ) : (
                              <Badge variant="outline" className="w-full justify-center">
                                تم التسجيل
                              </Badge>
                            )}
                          </div>
                        )}
                        {eveningRecord && !eveningRecord.checkOut && canCheckOutForSession("evening") && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleCheckOut("evening")}
                            className="w-full"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            تسجيل انصراف
                          </Button>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter - Only for admin and users with view permission */}
      {(canManageAttendance || canViewAttendance) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="البحث في الموظفين..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Label htmlFor="date">التاريخ:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Only for admin and users with view permission */}
      {(canManageAttendance || canViewAttendance) && renderStatsCards()}

      {/* Attendance Records - Only for admin and users with view permission */}
      {(canManageAttendance || canViewAttendance) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {(currentUser?.role === 'admin' || currentUser?.role === 'hr') ? 'سجل الحضور' : 'سجل الحضور الشخصي'}
              </CardTitle>
              <CardDescription>
                {(currentUser?.role === 'admin' || currentUser?.role === 'hr') ? 'تفاصيل حضور الموظفين' : 'تفاصيل حضورك الشخصي'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                canManageAttendance ? (
                  <SwipeToDelete
                    key={record.id}
                    onDelete={() => {
                      setAttendanceRecords(prev => prev.filter(r => r.id !== record.id))
                      setAlert({ type: "success", message: "تم حذف السجل بنجاح" })
                    }}
                  >
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {record.userName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{record.userName}</h4>
                              <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {record.session === "morning" ? "صباحية" : "مسائية"}
                                </Badge>
                                <span>{record.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="text-right">
                              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                <span className="text-muted-foreground">الحضور:</span>
                                <span className="font-medium">
                                  {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("ar-SA") : "--"}
                                </span>
                              </div>
                              {record.checkOut && (
                                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                  <span className="text-muted-foreground">الانصراف:</span>
                                  <span className="font-medium">
                                    {new Date(record.checkOut).toLocaleTimeString("ar-SA")}
                                  </span>
                                </div>
                              )}
                              {record.totalHours > 0 && (
                                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                  <span className="text-muted-foreground">الساعات:</span>
                                  <span className="font-medium">{record.totalHours} ساعة</span>
                                </div>
                              )}
                              {record.overtimeHours > 0 && (
                                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                  <span className="text-muted-foreground">إضافية:</span>
                                  <span className="font-medium text-orange-600">{record.overtimeHours} ساعة</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge className={`${getStatusColor(record.status)}`}>
                                {getStatusIcon(record.status)}
                                {getStatusText(record.status)}
                              </Badge>
                              {canManageAttendance && (
                                <div className="flex items-center space-x-1 space-x-reverse">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Handle edit
                                    }}
                                    className="h-6 w-6 p-0"
                                    title="تعديل"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeToDelete>
                ) : (
                  <Card key={record.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {record.userName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{record.userName}</h4>
                            <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {record.session === "morning" ? "صباحية" : "مسائية"}
                              </Badge>
                              <span>{record.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="text-right">
                            <div className="flex items-center space-x-2 space-x-reverse text-sm">
                              <span className="text-muted-foreground">الحضور:</span>
                              <span className="font-medium">
                                {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("ar-SA") : "--"}
                              </span>
                            </div>
                            {record.checkOut && (
                              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                <span className="text-muted-foreground">الانصراف:</span>
                                <span className="font-medium">
                                  {new Date(record.checkOut).toLocaleTimeString("ar-SA")}
                                </span>
                              </div>
                            )}
                            {record.totalHours > 0 && (
                              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                <span className="text-muted-foreground">الساعات:</span>
                                <span className="font-medium">{record.totalHours} ساعة</span>
                              </div>
                            )}
                            {record.overtimeHours > 0 && (
                              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                                <span className="text-muted-foreground">إضافية:</span>
                                <span className="font-medium text-orange-600">{record.overtimeHours} ساعة</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={`${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {getStatusText(record.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد سجلات حضور لهذا التاريخ</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {alertDialogData?.type === "error" ? "تحذير" : "نجح"}
            </DialogTitle>
            <DialogDescription className="text-right">
              {alertDialogData?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                setShowAlertDialog(false)
                setAlertDialogData(null)
              }}
            >
              موافق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Dialog */}
      <Dialog open={showMonthlyReportDialog} onOpenChange={setShowMonthlyReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right">التقرير الشهري</DialogTitle>
            <DialogDescription className="text-right">
              تقرير الحضور الشهري للموظف المختار
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {monthlyReportDialogContent}
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={() => setShowMonthlyReportDialog(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}