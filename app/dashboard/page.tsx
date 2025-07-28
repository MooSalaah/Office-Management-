"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FolderOpen,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  Plus,
  Building,
  UserPlus,
  Receipt,
  Settings,
  Eye,
  X,
  Trash2,
} from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { realtimeUpdates, useRealtimeUpdatesByType } from "@/lib/realtime-updates"
import type { Task, Project, Client, Transaction } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { ArabicNumber } from "@/components/ui/ArabicNumber"
import TaskCard from "@/components/tasks/TaskCard"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { hasPermission } from "@/lib/auth"
import { useStatistics, useProjectSearch, useTaskSearch, useCachedCallback } from "@/lib/performance"
import { LoadingStates, DashboardLoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useToast } from "@/components/ui/use-toast"
import TaskForm from "@/components/tasks/TaskForm"
import { useMemoizedFilter, useMemoizedReduce } from "@/lib/memoization"

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{project.name}</h4>
        <Badge variant={project.status === "in-progress" ? "default" : "secondary"}>
          {project.status === "in-progress" ? "قيد التنفيذ" : project.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{project.client}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>التقدم</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {project.startDate}
          </span>
          <span>
            ﷼ {project.price.toLocaleString()}
            <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 block dark:hidden" loading="lazy" />
            <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 hidden dark:block" loading="lazy" />
          </span>
        </div>
      </div>
    </div>
  )
}



// Client Dialog Component
function ClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    status: "active" as "active" | "inactive" | "vip" | "government",
    notes: "",
  })
  const [phoneError, setPhoneError] = useState("");

  const handleSubmit = () => {
    // تحقق من صحة رقم الهاتف
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError("رقم الهاتف يجب أن يكون على الصيغة 05XXXXXXXX");
      return;
    } else {
      setPhoneError("");
    }
    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      status: formData.status,
      notes: formData.notes,
      projectsCount: 0,
      totalValue: 0,
      lastContact: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_CLIENT", payload: newClient })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
          <DialogDescription>قم بإدخال تفاصيل العميل الجديد</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">اسم العميل/الشركة</Label>
            <Input
              id="client-name"
              placeholder="اسم العميل"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">رقم الهاتف</Label>
            <Input
              id="client-phone"
              placeholder="05XXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              maxLength={10}
            />
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">البريد الإلكتروني</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-status">حالة العميل</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive" | "vip" | "government") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="government">حكومي</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="client-address">العنوان</Label>
            <Input
              id="client-address"
              placeholder="العنوان الكامل"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="client-notes">ملاحظات</Label>
            <Textarea
              id="client-notes"
              placeholder="ملاحظات إضافية عن العميل"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>حفظ العميل</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Upcoming Payment Dialog Component
function UpcomingPaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { addNotification, showSuccessToast, showErrorToast } = useAppActions()
  const [formData, setFormData] = useState({
    client: "",
    amount: "",
    type: "income" as "income" | "expense",
    dueDate: "",
    description: "",
  })

  const handleSubmit = async () => {
    const missingFields = [];
    if (!formData.client) missingFields.push("العميل");
    if (!formData.amount) missingFields.push("المبلغ");
    if (!formData.dueDate) missingFields.push("تاريخ الاستحقاق");
    
    if (missingFields.length > 0) {
      // إضافة توست خطأ
      showErrorToast("حقول مطلوبة", `يرجى ملء الحقول التالية: ${missingFields.join("، ")}`);
      return
    }

    if (Number.parseFloat(formData.amount) <= 0) {
      showErrorToast("خطأ في المبلغ", "يجب أن يكون المبلغ أكبر من صفر");
      return
    }

    try {
      const newPayment = {
        id: `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client: formData.client,
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        dueDate: formData.dueDate,
        status: "pending" as "pending" | "overdue",
        description: formData.description || `دفعة ${formData.client}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // حفظ في قاعدة البيانات
      const response = await fetch('/api/upcomingPayments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPayment),
      });

      const result = await response.json();

      if (result.success) {
        // إضافة الدفعة القادمة إلى state
        dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: result.data })

        // حفظ في localStorage
        const existingPayments = JSON.parse(localStorage.getItem("upcomingPayments") || "[]");
        localStorage.setItem("upcomingPayments", JSON.stringify([...existingPayments, result.data]));

        // إضافة توست نجاح
        showSuccessToast("دفعة قادمة جديدة", `تم إضافة دفعة قادمة لـ ${formData.client} بقيمة ${formData.amount} ريال`);

        // إعادة تعيين النموذج
        setFormData({
          client: "",
          amount: "",
          type: "income",
          dueDate: "",
          description: "",
        })

        onClose()
      } else {
        showErrorToast("خطأ في الحفظ", "فشل في حفظ الدفعة القادمة في قاعدة البيانات");
      }
    } catch (error) {
      console.error('Error saving upcoming payment:', error);
      showErrorToast("خطأ في الاتصال", "حدث خطأ أثناء حفظ الدفعة القادمة");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة دفعة قادمة جديدة</DialogTitle>
          <DialogDescription>قم بإدخال تفاصيل الدفعة القادمة أو المصروف المتوقع</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-client" className="flex items-center">
              العميل
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <Input
              id="payment-client"
              placeholder="اسم العميل"
              value={formData.client}
              onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="flex items-center">
              المبلغ
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="payment-amount"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="opacity-60 block dark:hidden" />
                <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="opacity-60 hidden dark:block" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-type" className="flex items-center">
              نوع الدفعة
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: "income" | "expense") => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">دفعة قادمة (دخل)</SelectItem>
                <SelectItem value="expense">مصروف متوقع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-due-date" className="flex items-center">
              تاريخ الاستحقاق
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <Input
              id="payment-due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-description">الوصف</Label>
            <Textarea
              id="payment-description"
              placeholder="وصف تفصيلي للدفعة أو المصروف"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>حفظ الدفعة القادمة</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



export default function DashboardPage() {
  return (
    <PermissionGuard requiredPermission="view_dashboard" requiredAction="view" requiredModule="dashboard" moduleName="لوحة التحكم">
      <DashboardPageContent />
    </PermissionGuard>
  )
}

function DashboardPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, createProjectWithDownPayment, markNotificationAsRead, deleteNotification, showSuccessToast, showErrorToast } = useAppActions()
  const { currentUser, projects, clients, tasks, transactions, notifications, users, isLoading, loadingStates } = state
  const router = useRouter()
  const { toast } = useToast();
  const [undoTimeouts, setUndoTimeouts] = useState<{ [id: string]: NodeJS.Timeout }>({});
  const lastTaskUpdateRef = useRef<string | null>(null);
  const lastProjectUpdateRef = useRef<string | null>(null);
  const handledTaskUpdateIdsRef = useRef<Set<string>>(new Set());
  const handledProjectUpdateIdsRef = useRef<Set<string>>(new Set());
  const [defaultTaskForm, setDefaultTaskForm] = useState<{ assigneeId?: string; dueDate?: string }>({})

  // استقبال التحديثات الحية
  const taskUpdates = useRealtimeUpdatesByType('task')
  const projectUpdates = useRealtimeUpdatesByType('project')
  const notificationUpdates = useRealtimeUpdatesByType('notification')
  const userUpdates = useRealtimeUpdatesByType('user')

  // عرض إشعار عند استقبال تحديث من مستخدم آخر
  useEffect(() => {
    if (taskUpdates.length > 0) {
      const lastUpdate = taskUpdates[taskUpdates.length - 1];
      const updateId = `${lastUpdate.task?.id || ''}_${lastUpdate.action}_${lastUpdate.timestamp || ''}`;
      if (handledTaskUpdateIdsRef.current.has(updateId)) return;
      handledTaskUpdateIdsRef.current.add(updateId);
      
      console.log('=== DASHBOARD TASK UPDATE RECEIVED ===');
      console.log('Task update:', lastUpdate);
      console.log('Current tasks count:', state.tasks.length);
      
      if (lastUpdate.userId && lastUpdate.userId !== currentUser?.id && lastUpdate.userName) {
        toast({
          title: `تحديث مهمة جديد`,
          description: `تمت إضافة/تعديل/حذف مهمة بواسطة ${lastUpdate.userName}`
        });
      }
      if (lastUpdate.action === 'create') {
        const exists = state.tasks.some(t => t.id === lastUpdate.task.id);
        console.log('Task exists in dashboard state:', exists);
        if (!exists) {
          console.log('Adding task to dashboard state...');
          dispatch({ type: "ADD_TASK", payload: lastUpdate.task });
          console.log('Task added to dashboard state successfully');
        }
      } else if (lastUpdate.action === 'update') {
        console.log('Updating task in dashboard state...');
        dispatch({ type: "UPDATE_TASK", payload: lastUpdate.task });
        console.log('Task updated in dashboard state successfully');
      } else if (lastUpdate.action === 'delete') {
        console.log('Deleting task from dashboard state...');
        dispatch({ type: "DELETE_TASK", payload: lastUpdate.task.id });
        console.log('Task deleted from dashboard state successfully');
      }
    }
  }, [taskUpdates, dispatch, state.tasks, currentUser]);

  useEffect(() => {
    if (projectUpdates.length > 0) {
      const lastUpdate = projectUpdates[projectUpdates.length - 1];
      const updateId = `${lastUpdate.project?.id || ''}_${lastUpdate.action}_${lastUpdate.timestamp || ''}`;
      if (handledProjectUpdateIdsRef.current.has(updateId)) return;
      handledProjectUpdateIdsRef.current.add(updateId);
      
      console.log('=== DASHBOARD PROJECT UPDATE RECEIVED ===');
      console.log('Project update:', lastUpdate);
      console.log('Current projects count:', state.projects.length);
      
      if (lastUpdate.userId && lastUpdate.userId !== currentUser?.id && lastUpdate.userName) {
        toast({
          title: `تحديث مشروع جديد`,
          description: `تمت إضافة/تعديل/حذف مشروع بواسطة ${lastUpdate.userName}`
        });
      }
      if (lastUpdate.action === 'create') {
        const exists = state.projects.some(p => p.id === lastUpdate.project.id);
        console.log('Project exists in dashboard state:', exists);
        if (!exists) {
          console.log('Adding project to dashboard state...');
          dispatch({ type: "ADD_PROJECT", payload: lastUpdate.project });
          console.log('Project added to dashboard state successfully');
        }
      } else if (lastUpdate.action === 'update') {
        console.log('Updating project in dashboard state...');
        dispatch({ type: "UPDATE_PROJECT", payload: lastUpdate.project });
        console.log('Project updated in dashboard state successfully');
      } else if (lastUpdate.action === 'delete') {
        console.log('Deleting project from dashboard state...');
        dispatch({ type: "DELETE_PROJECT", payload: lastUpdate.project.id });
        console.log('Project deleted from dashboard state successfully');
      }
    }
  }, [projectUpdates, dispatch, state.projects, currentUser]);

  useEffect(() => {
    if (notificationUpdates.length > 0) {
      const lastUpdate = notificationUpdates[notificationUpdates.length - 1]
      if (lastUpdate.userId === currentUser?.id) {
        dispatch({ type: "ADD_NOTIFICATION", payload: lastUpdate })
      }
    }
  }, [notificationUpdates, dispatch, currentUser])

  useEffect(() => {
    if (userUpdates.length > 0) {
      const lastUpdate = userUpdates[userUpdates.length - 1]
      if (lastUpdate.action === 'create') {
        dispatch({ type: "ADD_USER", payload: lastUpdate.user })
      } else if (lastUpdate.action === 'update') {
        dispatch({ type: "UPDATE_USER", payload: lastUpdate.user })
      } else if (lastUpdate.action === 'delete') {
        dispatch({ type: "DELETE_USER", payload: lastUpdate.user.id })
      }
    }
  }, [userUpdates, dispatch])

  // إزالة التحديث التلقائي للبيانات المالية لتجنب التكرار
  // useEffect(() => {
  //   if (currentUser?.role !== "admin") return;

  //   const interval = setInterval(async () => {
  //     try {
  //       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
  //       const response = await fetch(`${apiUrl}/api/transactions`, {
  //         headers: {
  //           'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  //         }
  //       });
  //       if (response.ok) {
  //         const result = await response.json();
  //         if (result && result.success && Array.isArray(result.data)) {
  //           // تحديث البيانات المالية فقط إذا كان هناك تغيير
  //           const currentTransactions = state.transactions;
  //           const newTransactions = result.data;
  //           
  //           // مقارنة عدد المعاملات
  //           if (currentTransactions.length !== newTransactions.length) {
  //             dispatch({ type: "LOAD_TRANSACTIONS", payload: newTransactions });
  //             console.log('Dashboard: Transactions updated from Backend API', { 
  //               oldCount: currentTransactions.length,
  //               newCount: newTransactions.length
  //             });
  //           } else {
  //             // مقارنة آخر معاملة
  //             const lastCurrentTransaction = currentTransactions[0];
  //             const lastNewTransaction = newTransactions[0];
  //             
  //             if (lastCurrentTransaction?.id !== lastNewTransaction?.id) {
  //               dispatch({ type: "LOAD_TRANSACTIONS", payload: newTransactions });
  //               console.log('Dashboard: New transactions detected, updated from Backend API', { 
  //               count: newTransactions.length
  //             });
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Dashboard: Error updating transactions from Backend API', { error });
  //     }
  //   }, 30000); // 30 ثانية

  //   return () => clearInterval(interval);
  // }, [state.transactions.length, dispatch, currentUser?.role]);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUpcomingPaymentDialogOpen, setIsUpcomingPaymentDialogOpen] = useState(false);

  // Show loading skeleton if data is loading
  if (isLoading || loadingStates.projects || loadingStates.tasks || loadingStates.clients || loadingStates.transactions) {
    return <DashboardLoadingSkeleton />
  }

  // استخدام التحسينات الجديدة لحساب الإحصائيات
  const statistics = useStatistics(projects, tasks, transactions)
  
  // حساب النمو الشهري
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const currentMonthIncome = transactions
    .filter((t) => {
      const transactionDate = new Date(t.date)
      return (
        t.type === "income" &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const lastMonthIncome = transactions
    .filter((t) => {
      const transactionDate = new Date(t.date)
      return (
        t.type === "income" &&
        transactionDate.getMonth() === lastMonth &&
        transactionDate.getFullYear() === lastMonthYear
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const growthPercentage =
    lastMonthIncome > 0 ? (((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1) : "0"
  const isPositiveGrowth = Number(growthPercentage) >= 0

  // حساب المشاريع النشطة للشهر الحالي والشهر الماضي
  const currentMonthActiveProjects = useMemoizedFilter(
    projects,
    (p) => {
      const projectDate = new Date(p.createdAt)
      return (
        p.status === "in-progress" &&
        projectDate.getMonth() === currentMonth &&
        projectDate.getFullYear() === currentYear
      )
    },
    [projects, currentMonth, currentYear]
  ).length;

  const lastMonthActiveProjects = useMemoizedFilter(
    projects,
    (p) => {
      const projectDate = new Date(p.createdAt)
      return (
        p.status === "in-progress" &&
        projectDate.getMonth() === lastMonth &&
        projectDate.getFullYear() === lastMonthYear
      )
    },
    [projects, lastMonth, lastMonthYear]
  ).length;

  const projectsGrowth = lastMonthActiveProjects > 0 
    ? (((currentMonthActiveProjects - lastMonthActiveProjects) / lastMonthActiveProjects) * 100).toFixed(1)
    : currentMonthActiveProjects > 0 ? "100" : "0"

  // حساب العملاء الجدد للشهر الحالي والشهر الماضي
  const currentMonthNewClients = useMemoizedFilter(
    clients,
    (c) => {
      const clientDate = new Date(c.createdAt)
      return (
        clientDate.getMonth() === currentMonth &&
        clientDate.getFullYear() === currentYear
      )
    },
    [clients, currentMonth, currentYear]
  ).length;

  const lastMonthNewClients = useMemoizedFilter(
    clients,
    (c) => {
      const clientDate = new Date(c.createdAt)
      return (
        clientDate.getMonth() === lastMonth &&
        clientDate.getFullYear() === lastMonthYear
      )
    },
    [clients, lastMonth, lastMonthYear]
  ).length;

  const clientsGrowth = lastMonthNewClients > 0 
    ? (((currentMonthNewClients - lastMonthNewClients) / lastMonthNewClients) * 100).toFixed(1)
    : currentMonthNewClients > 0 ? "100" : "0"

  // حساب جميع المهام غير المكتملة (todo + in-progress)
  const incompleteTasks = useMemoizedFilter(
    tasks,
    (t) => t.status !== "completed" && t.assigneeId === currentUser?.id,
    [tasks, currentUser?.id]
  );
  const incompleteTasksCount = incompleteTasks.length;

  // حساب جميع المهام الجديدة وقيد التنفيذ للمستخدم الحالي
  const userTodoTasksCount = useMemoizedFilter(
    tasks,
    (t) => t.status === "todo" && t.assigneeId === currentUser?.id,
    [tasks, currentUser?.id]
  ).length;
  const userInProgressTasksCount = useMemoizedFilter(
    tasks,
    (t) => t.status === "in-progress" && t.assigneeId === currentUser?.id,
    [tasks, currentUser?.id]
  ).length;
  const userActiveTasksCount = userTodoTasksCount + userInProgressTasksCount;

  // حساب جميع المهام غير المكتملة في النظام (للمدير)
  const allIncompleteTasksCount = useMemoizedFilter(
    tasks,
    (t) => t.status !== "completed",
    [tasks]
  ).length;

  // استخدام الإحصائيات المحسنة
  const activeProjectsCount = statistics.activeProjects
  const totalClientsCount = clients.length

  const today = new Date().toISOString().split("T")[0]

  // Filter tasks based on user role
  let delayedTasksCount = 0
  let delayedTasks: any[] = []
  
  // المستخدم يرى جميع مهامه المتأخرة (بغض النظر عن من أنشأها)
  delayedTasks = tasks.filter((t) => {
    // المهمة غير مكتملة
    const isIncomplete = t.status === "todo" || t.status === "in-progress";
    // إذا كان لها تاريخ استحقاق، يجب أن يكون التاريخ أقل من اليوم
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isIncomplete && dueDate < today && t.assigneeId === currentUser?.id;
    }
    // إذا لم يكن لها تاريخ استحقاق، تعتبر متأخرة إذا كانت غير مكتملة
    return isIncomplete && t.assigneeId === currentUser?.id;
  });
  delayedTasksCount = delayedTasks.length;

  // تحسين عرض المهام المتأخرة في البطاقة
  const getDelayedTasksText = () => {
    if (delayedTasksCount === 0) return "لا توجد مهام متأخرة"
    
    const overdueDays = delayedTasks.map(task => {
      const dueDate = new Date(task.dueDate)
      const today = new Date()
      const diffTime = today.getTime() - dueDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    })
    
    const maxOverdue = Math.max(...overdueDays)
    return `${delayedTasksCount} مهمة غير مكتملة بحاجة للإنجاز`;
  }

  // Get today's attendance for current user
  const todayAttendance = state.attendanceRecords.filter((record: any) => 
    record.userId === currentUser?.id && record.date === today
  )

  // 1. استخرج جميع المهام المتأخرة لجميع المستخدمين:
  const allDelayedTasks = tasks.filter((t) => {
    const isIncomplete = t.status === "todo" || t.status === "in-progress";
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isIncomplete && dueDate < today;
    }
    // إذا لم يكن لها تاريخ استحقاق، تعتبر متأخرة إذا كانت غير مكتملة
    return isIncomplete;
  });
  const allDelayedTasksCount = allDelayedTasks.length;

  const stats = currentUser?.role === "admin" ? [
    {
      title: "الدخل الشهري",
      value: (
        <div className="flex items-center gap-1">
          <ArabicNumber value={currentMonthIncome} />
          <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 block dark:hidden" loading="lazy" />
          <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 hidden dark:block" loading="lazy" />
        </div>
      ),
      change: `${isPositiveGrowth ? "+" : ""}${growthPercentage}% من الشهر الماضي`,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      onClick: () => router.push("/finance"),
      trendIcon: isPositiveGrowth ? TrendingUp : TrendingDown,
      trendColor: isPositiveGrowth ? "text-green-600" : "text-red-600",
    },
    {
      title: "المشاريع النشطة",
      value: <ArabicNumber value={activeProjectsCount} />,
      change: `+${projectsGrowth}% هذا الشهر`,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      onClick: () => router.push("/projects?filter=in-progress"),
    },
    {
      title: "إجمالي العملاء",
      value: <ArabicNumber value={totalClientsCount} />,
      change: `+${clientsGrowth}% عملاء جدد`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      onClick: () => router.push("/clients"),
    },
    {
      title: "المهام غير المكتملة",
      value: <ArabicNumber value={allIncompleteTasksCount} />,
      change: `عدد جميع المهام غير المكتملة في النظام`,
      icon: allIncompleteTasksCount === 0 ? CheckCircle : AlertTriangle,
      color: allIncompleteTasksCount === 0 ? "text-green-600" : "text-red-600",
      bgColor: allIncompleteTasksCount === 0 ? "bg-green-100" : "bg-red-100",
      onClick: () => router.push("/tasks?filter=incomplete"),
    },
  ] : [
    {
      title: "المشاريع النشطة",
      value: <ArabicNumber value={activeProjectsCount} />,
      change: `+${projectsGrowth}% هذا الشهر`,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      onClick: () => router.push("/projects?filter=in-progress"),
    },
    {
      title: "إجمالي العملاء",
      value: <ArabicNumber value={totalClientsCount} />,
      change: `+${clientsGrowth}% عملاء جدد`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      onClick: () => router.push("/clients"),
    },
    {
      title: "المهام المتأخرة",
      value: <ArabicNumber value={userActiveTasksCount} />, // عرض مجموع المهام الجديدة وقيد التنفيذ
      change: `جديدة: ${userTodoTasksCount} | قيد التنفيذ: ${userInProgressTasksCount}`,
      icon: userActiveTasksCount === 0 ? CheckCircle : AlertTriangle,
      color: userActiveTasksCount === 0 ? "text-green-600" : "text-red-600",
      bgColor: userActiveTasksCount === 0 ? "bg-green-100" : "bg-red-100",
      onClick: () => router.push("/tasks?filter=active"),
    },
    {
      title: "موعد الحضور والانصراف",
      value: todayAttendance.length > 0 ? (
        <div className="text-sm">
          <div>حضور: {todayAttendance.find(r => r.session === "morning")?.checkIn ? "✓" : "✗"}</div>
          <div>انصراف: {todayAttendance.find(r => r.session === "morning")?.checkOut ? "✓" : "✗"}</div>
        </div>
      ) : "لم يسجل بعد",
      change: "اليوم",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      onClick: () => router.push("/attendance"),
    },
  ]

  // مهام اليوم - المدير يرى جميع المهام غير المكتملة، المستخدم العادي يرى مهامه فقط
  const todayTasks = currentUser?.role === "admin" 
    ? tasks.filter((task) => task.status !== "completed")
        .sort((a, b) => {
          // ترتيب المهام: المتأخرة أولاً، ثم المهام اليوم، ثم المهام قيد التنفيذ
          const aDate = a.dueDate ? new Date(a.dueDate) : new Date()
          const bDate = b.dueDate ? new Date(b.dueDate) : new Date()
          const today = new Date()
          
          const aIsOverdue = aDate < today && a.status !== "completed"
          const bIsOverdue = bDate < today && b.status !== "completed"
          
          if (aIsOverdue && !bIsOverdue) return -1
          if (!aIsOverdue && bIsOverdue) return 1
          
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })
        .slice(0, 4) // المدير يرى 4 مهام
    : tasks.filter((task) => task.assigneeId === currentUser?.id)
        .filter((task) => {
          if (!task.dueDate) return task.status === "in-progress"
          // تشمل المهام المتأخرة أيضاً
          const taskDate = new Date(task.dueDate)
          const today = new Date()
          return task.dueDate === today.toISOString().split("T")[0] || 
                 task.status === "in-progress" ||
                 (taskDate < today && task.status !== "completed")
        })
        .sort((a, b) => {
          // ترتيب المهام: المتأخرة أولاً، ثم المهام اليوم، ثم المهام قيد التنفيذ
          const aDate = a.dueDate ? new Date(a.dueDate) : new Date()
          const bDate = b.dueDate ? new Date(b.dueDate) : new Date()
          const today = new Date()
          
          const aIsOverdue = aDate < today && a.status !== "completed"
          const bIsOverdue = bDate < today && b.status !== "completed"
          
          if (aIsOverdue && !bIsOverdue) return -1
          if (!aIsOverdue && bIsOverdue) return 1
          
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })
        .slice(0, 2) // المستخدم العادي يرى مهمتين

  // إشعارات المستخدم الحالي - عرض 4 إشعارات فقط
  const userNotifications = notifications
    .filter((n) => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  // إضافة إشعار للمهام المتأخرة لجميع المستخدمين
  useEffect(() => {
    if (delayedTasksCount > 0) {
      const hasOverdueNotification = userNotifications.some(n => 
        n.title === "مهام متأخرة" && !n.isRead
      )
      
      if (!hasOverdueNotification) {
        addNotification({
          userId: currentUser?.id || "",
          title: "مهام متأخرة",
          message: `لديك ${delayedTasksCount} مهمة غير مكتملة بحاجة للإنجاز`,
          type: "task",
          actionUrl: "/tasks",
          triggeredBy: currentUser?.id || "",
          isRead: false,
        })
      }
    }
  }, [delayedTasksCount, currentUser])

  // تحديد الإجراءات السريعة حسب دور المستخدم
  const getQuickActions = () => {
    const baseActions = {
      addProject: {
      title: "إضافة مشروع جديد",
      description: "إنشاء مشروع جديد وربطه بعميل",
      icon: Building,
      color: "bg-blue-600 hover:bg-blue-700",
        onClick: () => router.push("/projects?action=create"),
    },
      addClient: {
      title: "إضافة عميل جديد",
      description: "تسجيل عميل جديد في النظام",
      icon: UserPlus,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => setIsClientDialogOpen(true),
    },
      addTask: {
        title: "إضافة مهمة جديدة",
        description: "تعيين مهمة لأحد أعضاء الفريق",
        icon: CheckCircle,
        color: "bg-purple-600 hover:bg-purple-700",
        onClick: () => {
          setDefaultTaskForm({
            assigneeId: currentUser?.id || "",
            dueDate: new Date().toISOString().split("T")[0] || "",
          });
          setIsTaskDialogOpen(true);
        },
      },
      addTransaction: {
      title: "تسجيل معاملة مالية",
      description: "إضافة دخل أو مصروف جديد",
      icon: Receipt,
      color: "bg-yellow-600 hover:bg-yellow-700",
        onClick: () => router.push("/finance?action=create"),
    },
      addUpcomingPayment: {
      title: "إضافة دفعة قادمة",
      description: "تسجيل دفعة قادمة أو مصروف متوقع",
      icon: Calendar,
      color: "bg-orange-600 hover:bg-orange-700",
      onClick: () => setIsUpcomingPaymentDialogOpen(true),
    },
      addUser: {
        title: "إضافة مستخدم جديد",
        description: "إضافة مستخدم جديد للنظام",
        icon: UserPlus,
        color: "bg-indigo-600 hover:bg-indigo-700",
        onClick: () => router.push("/settings?action=add-user"),
      },
      settings: {
      title: "إعدادات النظام",
      description: "إدارة المستخدمين وإعدادات المكتب",
      icon: Settings,
      color: "bg-gray-600 hover:bg-gray-700",
      onClick: () => router.push("/settings"),
    },
    };

    // المدير - جميع الإجراءات
    if (currentUser?.role === "admin") {
      return [
        baseActions.addProject,
        baseActions.addClient,
        baseActions.addTransaction,
        baseActions.addUpcomingPayment,
        baseActions.addTask,
        baseActions.settings,
      ];
    }

    // المهندسين - 4 إجراءات محددة
    if (currentUser?.role === "engineer") {
      return [
        baseActions.addProject,
        baseActions.addClient,
        baseActions.addTask,
        baseActions.settings,
      ];
    }

    // المحاسبين - 4 إجراءات محددة
    if (currentUser?.role === "accountant") {
      return [
        baseActions.addTransaction,
        baseActions.addUpcomingPayment,
        baseActions.addClient,
        baseActions.settings,
      ];
    }

    // الموارد البشرية - 4 إجراءات محددة
    if (currentUser?.role === "hr") {
      return [
        baseActions.addUser,
        baseActions.addClient,
        baseActions.addTask,
        baseActions.settings,
      ];
    }

    // المستخدمين العاديين - إجراءات محدودة
    return [
      baseActions.addTask,
      baseActions.settings,
    ];
  };

  const quickActions = getQuickActions();

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    // إظهار Toast مع زر تراجع
    const t = toast({
      title: "تمت القراءة",
      description: "تم وضع علامة مقروء على الإشعار.",
      action: (
        <button
          className="text-blue-600 font-bold ml-2"
          onClick={() => {
            clearTimeout(undoTimeouts[notificationId]);
            setUndoTimeouts((prev) => {
              const copy = { ...prev };
              delete copy[notificationId];
              return copy;
            });
            const notif = userNotifications.find(n => n.id === notificationId);
            if (notif && typeof notif.id === 'string') {
              dispatch({ type: "UPDATE_NOTIFICATION", payload: { ...notif, isRead: false, id: notif.id as string } });
            }
          }}
        >
          تراجع
        </button>
      ),
      duration: 3000,
    });
    // بعد 3 ثوانٍ، يختفي التوست ولا يمكن التراجع
    const timeout = setTimeout(() => {
      setUndoTimeouts((prev) => {
        const copy = { ...prev };
        delete copy[notificationId];
        return copy;
      });
    }, 3000);
    setUndoTimeouts((prev) => ({ ...prev, [notificationId]: timeout }));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مرحباً، {currentUser?.name?.split(" ")[0] || "المستخدم"}</h1>
          <p className="text-muted-foreground mt-1">إليك نظرة سريعة على أداء المكتب اليوم</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Badge variant="outline" className="text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = 'trendIcon' in stat ? stat.trendIcon : undefined
          const trendColor = 'trendColor' in stat ? stat.trendColor : "text-gray-500"
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={stat.onClick}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {TrendIcon && <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />}
                      <p className={`text-xs ${trendColor}`}>{stat.change}</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-extrabold mb-4">
                  {currentUser?.role === "admin" ? "المهام غير المكتملة" : "مهام اليوم"}
                </CardTitle>
                <CardDescription>
                  {currentUser?.role === "admin" 
                    ? "جميع المهام غير المكتملة في النظام" 
                    : "المهام المطلوبة منك اليوم"
                  }
                </CardDescription>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button variant="outline" size="sm" onClick={() => router.push("/tasks")}>
                  <Eye className="w-4 h-4 mr-2" />
                  عرض جميع المهام
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    canDelete={false}
                    canEdit={false}
                    onDetails={() => {
                      setSelectedTask(task)
                      setIsTaskDetailsOpen(true)
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {currentUser?.role === "admin" 
                      ? "لا توجد مهام غير مكتملة في النظام" 
                      : "لا توجد مهام لهذا اليوم"
                    }
                  </p>
                  <p className="text-sm mt-1">
                    {currentUser?.role === "admin" 
                      ? "جميع المهام مكتملة بنجاح" 
                      : "أحسنت! لقد أنجزت جميع مهامك"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold mb-4">الإشعارات</CardTitle>
            <CardDescription>آخر التحديثات والأنشطة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userNotifications.length > 0 ? (
              userNotifications.map((notification) => (
                <SwipeToDelete
                  key={notification.id}
                  onDelete={() => deleteNotification(notification.id)}
                >
                  <div className="flex items-start space-x-3 space-x-reverse group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {notification.type === "task"
                          ? "📋"
                          : notification.type === "project"
                            ? "🏗️"
                            : notification.type === "finance"
                              ? "💰"
                              : "🔔"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-5 w-5 p-0 ${notification.isRead ? 'text-gray-400 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (!notification.isRead) handleMarkAsRead(notification.id)
                            }}
                            disabled={notification.isRead}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                        {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                    </div>
                  </div>
                </SwipeToDelete>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold mb-4">إجراءات سريعة</CardTitle>
          <CardDescription>الإجراءات الأكثر استخداماً في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.onClick}>
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Projects Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-extrabold mb-4">المشاريع النشطة</CardTitle>
            <CardDescription>نظرة سريعة على المشاريع قيد التنفيذ</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
            عرض جميع المشاريع
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects
              .filter((p) => p.status === "in-progress")
              .slice(0, 4)
              .map((project) => (
                <SwipeToDelete
                  key={project.id}
                  onDelete={() => {
                    dispatch({ type: "DELETE_PROJECT", payload: project.id });
                    addNotification({
                      userId: "1",
                      title: "حذف مشروع",
                      message: `تم حذف المشروع "${project.name}"`,
                      type: "project",
                      actionUrl: `/projects`,
                      triggeredBy: currentUser?.id || "",
                      isRead: false,
                    });
                  }}
                >
                  <div onClick={() => { setSelectedProject(project); setIsProjectDetailsOpen(true); }} className="cursor-pointer">
                    <ProjectCard project={project} />
                  </div>
                </SwipeToDelete>
              ))}
          </div>
          {projects.filter((p) => p.status === "in-progress").length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مشاريع نشطة حالياً</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ClientDialog open={isClientDialogOpen} onClose={() => setIsClientDialogOpen(false)} />
      <UpcomingPaymentDialog open={isUpcomingPaymentDialogOpen} onClose={() => setIsUpcomingPaymentDialogOpen(false)} />
      {selectedTask && (
        <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل المهمة</DialogTitle>
            </DialogHeader>
            <div>
              <h3 className="font-bold mb-2">{selectedTask.title}</h3>
              <p className="mb-2">{selectedTask.description}</p>
              <div className="text-xs text-muted-foreground mb-2">المشروع: {selectedTask.projectName}</div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3" /> {selectedTask.dueDate}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {selectedProject && (
        <Dialog open={isProjectDetailsOpen} onOpenChange={setIsProjectDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل المشروع</DialogTitle>
              <DialogDescription>معلومات شاملة عن المشروع</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.client}</p>
                  <Badge variant={selectedProject.status === "in-progress" ? "default" : "secondary"} className="mt-2">
                    {selectedProject.status === "in-progress" ? "قيد التنفيذ" : selectedProject.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₪ {selectedProject.price.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></p>
                  <p className="text-sm text-gray-600">السعر الإجمالي</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">معلومات المشروع</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">النوع:</span>
                        <span>{selectedProject.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الأهمية:</span>
                        <Badge
                          variant={selectedProject.importance === "high"
                            ? "destructive"
                            : selectedProject.importance === "medium"
                              ? "default"
                              : "secondary"}
                          className="text-xs"
                        >
                          {selectedProject.importance === "high"
                            ? "عالية"
                            : selectedProject.importance === "medium"
                              ? "متوسطة"
                              : "منخفضة"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ البداية:</span>
                        <span>{selectedProject.startDate}</span>
                      </div>
                      {selectedProject.startDateHijri && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">التاريخ الهجري:</span>
                          <span>{selectedProject.startDateHijri}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">المعلومات المالية</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">السعر الإجمالي:</span>
                        <span className="font-medium">{selectedProject.price.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الدفعة المقدمة:</span>
                        <span className="text-green-600">{selectedProject.downPayment.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ المتبقي:</span>
                        <span className="text-red-600">{selectedProject.remainingBalance.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">فريق العمل</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المهندس المسؤول:</span>
                        <span>{selectedProject.assignedEngineerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">عدد أعضاء الفريق:</span>
                        <span>{selectedProject.team.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">تقدم المشروع</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>نسبة الإنجاز</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-sm text-gray-500">{selectedProject.progress}%</span>
                      </div>
                    </div>
                    <Progress value={selectedProject.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">وصف المشروع</h4>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
            <DialogDescription>قم بإدخال تفاصيل المهمة الجديدة</DialogDescription>
          </DialogHeader>
          <TaskForm 
            onClose={() => setIsTaskDialogOpen(false)} 
            defaultAssigneeId={defaultTaskForm.assigneeId} 
            defaultDueDate={defaultTaskForm.dueDate} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
