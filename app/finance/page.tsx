"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  X,
} from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { hasPermission } from "@/lib/auth"
import { realtimeUpdates } from "@/lib/realtime-updates"
import type { Transaction, UpcomingPayment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { ArabicNumber } from "@/components/ui/ArabicNumber"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { useMemo } from "react"
import { InvoiceGenerator } from "@/lib/invoice-generator"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { useSearchParams } from "next/navigation"

// أضف متغير API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://office-management-fsy7.onrender.com";

export default function FinancePage() {
  return (
    <PermissionGuard requiredPermission="view_finance" requiredAction="view" requiredModule="finance" moduleName="صفحة المالية">
      <FinancePageContent />
    </PermissionGuard>
  )
}

function FinancePageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, broadcastTransactionUpdate, broadcastNotificationUpdate, showSuccessToast } = useAppActions()
  const { currentUser, transactions, projects, clients, users } = state

  const searchParams = useSearchParams()
  const actionParam = searchParams?.get("action")

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(actionParam === "create")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionLocks, setTransactionLocks] = useState<{ [key: string]: { userId: string, userName: string, timestamp: number } }>({})
  const [isMonthlyGrowthDialogOpen, setIsMonthlyGrowthDialogOpen] = useState(false)
  const [isPaymentDetailsDialogOpen, setIsPaymentDetailsDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false)
  const [isPaymentConfirmDialogOpen, setIsPaymentConfirmDialogOpen] = useState(false)
  const [paymentActionToConfirm, setPaymentActionToConfirm] = useState<{ action: 'complete' | 'delete', payment: any } | null>(null)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // متغيرات لإضافة أنواع جديدة
  const [showNewTransactionTypeInput, setShowNewTransactionTypeInput] = useState(false)
  const [newTransactionType, setNewTransactionType] = useState("")
  const [newTransactionTypeError, setNewTransactionTypeError] = useState("")
  const [showNewPaymentMethodInput, setShowNewPaymentMethodInput] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  const [newPaymentMethodError, setNewPaymentMethodError] = useState("")

  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    projectId: "",
    transactionType: "other" as "license" | "certificate" | "safety" | "consultation" | "design" | "supervision" | "maintenance" | "renovation" | "inspection" | "other",
    paymentMethod: "cash" as "cash" | "transfer" | "pos" | "check" | "credit",
    importance: "medium" as "high" | "medium" | "low",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    remainingAmount: "",
    payerName: currentUser?.name || "",
    recipientName: currentUser?.name || "",
  })

  const [paymentFormData, setPaymentFormData] = useState({
    client: "",
    clientId: "",
    amount: "",
    type: "income" as "income" | "expense",
    dueDate: "",
    description: "",
    payerName: currentUser?.name || "",
    projectId: "",
    projectName: "",
    category: "general",
    paymentMethod: "cash" as "cash" | "transfer" | "pos" | "check" | "credit",
    importance: "medium" as "low" | "medium" | "high",
    notes: "",
  })

  // Calculate financial summary
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const monthlyTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
  })

  const lastMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === lastMonth && transactionDate.getFullYear() === lastMonthYear
  })

  const currentMonthIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const currentMonthExpenses = monthlyTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const lastMonthIncome = lastMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const lastMonthExpenses = lastMonthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const incomeGrowth = lastMonthIncome > 0
    ? (((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1)
    : currentMonthIncome > 0 ? "100" : "0"

  const expensesGrowth = lastMonthExpenses > 0
    ? (((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(1)
    : currentMonthExpenses > 0 ? "100" : "0"

  const currentMonthProfit = currentMonthIncome - currentMonthExpenses
  const lastMonthProfit = lastMonthIncome - lastMonthExpenses

  const profitGrowth = lastMonthProfit > 0
    ? (((currentMonthProfit - lastMonthProfit) / lastMonthProfit) * 100).toFixed(1)
    : currentMonthProfit > 0 ? "100" : "0"

  const financialSummary = {
    totalIncome: currentMonthIncome,
    totalExpenses: currentMonthExpenses,
    netProfit: currentMonthProfit,
    monthlyGrowth: `${Number(incomeGrowth) >= 0 ? "+" : ""}${incomeGrowth}%`,
  }

  // استخدام upcomingPayments من state
  const upcomingPaymentsList = state.upcomingPayments || []

  // استخدام التحسينات الجديدة للبحث والفلترة
  // استخدام التحسينات الجديدة للبحث والفلترة
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(lowerTerm) ||
        t.amount.toString().includes(lowerTerm) ||
        (t.clientName && t.clientName.toLowerCase().includes(lowerTerm)) ||
        (t.projectName && t.projectName.toLowerCase().includes(lowerTerm))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    return result;
  }, [transactions, searchTerm, filterType]);

  const [requiredFieldsTransaction, setRequiredFieldsTransaction] = useState({
    description: false,
    amount: false,
    date: false,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  // جلب المدفوعات القادمة من backend
  useEffect(() => {
    async function fetchUpcomingPayments() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/upcomingPayments`);
        const data = await res.json();
        if (data.success) {
          dispatch({ type: "LOAD_UPCOMING_PAYMENTS", payload: data.data });
        }
      } catch (err) { }
    }
    fetchUpcomingPayments();
  }, [dispatch]);

  // استبدل إضافة معاملة مالية
  const handleCreateTransaction = async () => {
    // منع الحفظ المتكرر
    if (state.loadingStates.transactions) {
      return;
    }

    const missingFields = {
      description: !formData.description,
      amount: !formData.amount,
      date: !formData.date,
    }
    setRequiredFieldsTransaction(missingFields)
    if (missingFields.description || missingFields.amount || missingFields.date) {
      return
    }

    if (!formData.description || !formData.amount || !formData.date) {
      setAlert({
        type: "error",
        message: "يرجى ملء جميع الحقول المطلوبة",
      })
      return
    }

    const project = projects.find(p => p.id === formData.projectId)
    const client = clients.find(c => c.id === project?.clientId)

    const newTransaction: Transaction = {
      id: `transaction_${Date.now()}`,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      category: formData.transactionType,
      transactionType: formData.transactionType,
      status: "completed",
      importance: formData.importance || "medium",
      paymentMethod: formData.paymentMethod,
      projectId: formData.projectId,
      clientId: project?.clientId || "",
      clientName: project?.client || "",
      projectName: project?.name || "",
      createdBy: currentUser?.id || "",
      createdAt: new Date().toISOString(),
      remainingAmount: formData.remainingAmount ? parseFloat(formData.remainingAmount) : 0,
      payerName: formData.payerName,
    }

    try {
      // تعيين حالة التحميل لمنع الحفظ المتكرر
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'transactions', value: true } });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newTransaction),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: "ADD_TRANSACTION", payload: data.data || newTransaction });

          // إضافة المعاملة تلقائياً للدفعات القادمة إذا كانت من نوع "income"
          if (formData.type === "income" && formData.amount) {
            const newUpcomingPayment = {
              id: `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              client: project?.client || "عميل عام",
              clientId: project?.clientId || "",
              amount: parseFloat(formData.amount),
              type: "income" as "income" | "expense",
              dueDate: formData.date,
              description: formData.description,
              payerName: formData.payerName || currentUser?.name || "",
              projectId: formData.projectId || "",
              projectName: project?.name || "",
              category: "general",
              paymentMethod: formData.paymentMethod || "cash",
              importance: formData.importance || "medium",
              notes: formData.notes || "",
              status: "pending" as "pending" | "overdue",
              createdAt: new Date().toISOString(),
            };

            // إضافة للدفعات القادمة
            dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: newUpcomingPayment });

            // حفظ في localStorage
            const existingPayments = JSON.parse(localStorage.getItem("upcomingPayments") || "[]");
            existingPayments.push(newUpcomingPayment);
            localStorage.setItem("upcomingPayments", JSON.stringify(existingPayments));
          }

          setAlert({ type: "success", message: "تم إضافة المعاملة المالية بنجاح" });
          resetForm();
        } else {
          setAlert({ type: "error", message: data.error || "فشل في إضافة المعاملة المالية" });
        }
      } else {
        setAlert({ type: "error", message: "فشل في إضافة المعاملة المالية" });
      }
    } catch (error) {
      console.error('خطأ في إضافة المعاملة المالية:', error);
      setAlert({ type: "error", message: "حدث خطأ في إضافة المعاملة المالية" });
    } finally {
      // إزالة حالة التحميل
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'transactions', value: false } });
    }
  }

  // استبدل تحديث معاملة مالية
  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !hasPermission(currentUser?.role || "", "edit", "finance")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل المعاملات المالية" })
      return
    }

    // Release the lock after successful update
    releaseTransactionLock(editingTransaction.id)

    if (Number.parseFloat(formData.amount) <= 0) {
      setAlert({ type: "error", message: "لا يمكن إدخال قيمة سالبة أو صفرية" })
      return
    }

    const project = projects.find((p) => p.id === formData.projectId)

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      type: formData.type,
      amount: Number.parseFloat(formData.amount),
      description: formData.description,
      projectId: formData.projectId || "",
      projectName: project?.name || "",
      clientId: project?.clientId || "",
      clientName: project?.client || "",
      category: getTransactionCategory(formData.transactionType),
      transactionType: formData.transactionType,
      paymentMethod: formData.paymentMethod,
      importance: formData.importance,
      status: "completed",
      remainingAmount: formData.remainingAmount ? parseFloat(formData.remainingAmount) : 0,
      payerName: formData.payerName,
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "UPDATE_TRANSACTION", payload: data.data });
        setIsDialogOpen(false);
        setEditingTransaction(null);
        resetForm();
        showSuccessToast("تم تحديث المعاملة بنجاح", `تم تحديث معاملة بقيمة ${updatedTransaction.amount} ريال بنجاح`);
      } else {
        setAlert({ type: "error", message: "فشل تحديث المعاملة في قاعدة البيانات" });
      }
    } catch (err) {
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث المعاملة في قاعدة البيانات" });
    }
  }

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId)
    setDeleteDialogOpen(true)
  }

  const openDetailsDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsDialogOpen(true)
  }

  const acquireTransactionLock = (transactionId: string): boolean => {
    const now = Date.now()
    const lockTimeout = 5 * 60 * 1000 // 5 minutes

    // Check if transaction is already locked
    const existingLock = transactionLocks[transactionId]
    if (existingLock) {
      // Check if lock has expired
      if (now - existingLock.timestamp < lockTimeout) {
        // Lock is still valid
        if (existingLock.userId === currentUser?.id) {
          // User already has the lock, refresh it
          setTransactionLocks(prev => ({
            ...prev,
            [transactionId]: { userId: currentUser.id, userName: currentUser.name || "", timestamp: now }
          }))
          return true
        } else {
          // Lock is held by another user
          return false
        }
      } else {
        // Lock has expired, remove it
        setTransactionLocks(prev => {
          const newLocks = { ...prev }
          delete newLocks[transactionId]
          return newLocks
        })
      }
    }

    // Acquire new lock
    setTransactionLocks(prev => ({
      ...prev,
      [transactionId]: { userId: currentUser?.id || "", userName: currentUser?.name || "", timestamp: now }
    }))

    // Broadcast lock to other users
    if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
      (window as any).realtimeUpdates.sendUpdate('transaction', 'lock', {
        transactionId,
        userId: currentUser?.id,
        userName: currentUser?.name
      })
    }

    return true
  }

  const releaseTransactionLock = (transactionId: string) => {
    setTransactionLocks(prev => {
      const newLocks = { ...prev }
      delete newLocks[transactionId]
      return newLocks
    })

    // Broadcast lock release to other users
    if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
      (window as any).realtimeUpdates.sendUpdate('transaction', 'unlock', {
        transactionId,
        userId: currentUser?.id,
        userName: currentUser?.name
      })
    }
  }

  const openEditDialog = (transaction: Transaction) => {
    // Try to acquire lock
    if (!acquireTransactionLock(transaction.id)) {
      const lock = transactionLocks[transaction.id]
      setAlert({
        type: "error",
        message: `هذه المعاملة محجوزة للتعديل بواسطة ${lock?.userName || "مستخدم آخر"}. يرجى المحاولة لاحقاً.`
      })
      return
    }

    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      projectId: transaction.projectId || "",
      transactionType: transaction.transactionType,
      paymentMethod: transaction.paymentMethod || "cash",
      importance: transaction.importance,
      date: transaction.date,
      notes: "",
      remainingAmount: transaction.remainingAmount ? transaction.remainingAmount.toString() : "",
      payerName: transaction.payerName || "",
      recipientName: transaction.recipientName || currentUser?.name || "",
    })
    setIsDialogOpen(true)
  }

  const openMonthlyGrowthDialog = () => {
    setIsMonthlyGrowthDialogOpen(true)
  }

  const openPaymentDetailsDialog = (payment: any) => {
    setSelectedPayment(payment)
    setIsPaymentDetailsDialogOpen(true)
  }

  const handlePaymentAction = (payment: any, action: 'complete' | 'edit' | 'delete') => {
    switch (action) {
      case 'complete':
        setPaymentActionToConfirm({ action: 'complete', payment })
        setIsPaymentConfirmDialogOpen(true)
        break
      case 'edit':
        setSelectedPayment(payment)
        setPaymentFormData({
          client: payment.client,
          clientId: payment.clientId || "",
          amount: payment.amount.toString(),
          type: payment.type,
          dueDate: payment.dueDate,
          description: payment.description || "",
          payerName: payment.payerName || currentUser?.name || "",
          projectId: payment.projectId || "",
          projectName: payment.projectName || "",
          category: payment.category || "general",
          paymentMethod: payment.paymentMethod || "cash",
          importance: payment.importance || "medium",
          notes: payment.notes || "",
        })
        setIsAddPaymentDialogOpen(true)
        break
      case 'delete':
        setPaymentActionToConfirm({ action: 'delete', payment })
        setIsPaymentConfirmDialogOpen(true)
        break
    }
    setIsPaymentDetailsDialogOpen(false)
  }

  const confirmPaymentAction = () => {
    if (!paymentActionToConfirm) return

    const { action, payment } = paymentActionToConfirm

    switch (action) {
      case 'complete':
        // إكمال الدفعة وإنشاء معاملة مالية
        const completePayment = async () => {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';

            // استدعاء API لإكمال الدفعة وإنشاء المعاملة
            const response = await fetch(`/api/upcomingPayments/${payment.id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                completedBy: currentUser?.id || ""
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                // إضافة المعاملة المالية
                dispatch({ type: "ADD_TRANSACTION", payload: data.data.transaction });

                // حذف الدفعة القادمة من القائمة
                dispatch({ type: "DELETE_UPCOMING_PAYMENT", payload: payment.id });

                // حفظ في localStorage
                const existingTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
                const updatedTransactions = [...existingTransactions, data.data.transaction];
                localStorage.setItem("transactions", JSON.stringify(updatedTransactions));

                // حذف الدفعة من localStorage
                const existingPayments = JSON.parse(localStorage.getItem("upcomingPayments") || "[]");
                const filteredPayments = existingPayments.filter((p: any) => p.id !== payment.id);
                localStorage.setItem("upcomingPayments", JSON.stringify(filteredPayments));

                setSuccessMessage("تم إكمال الدفعة وإنشاء المعاملة المالية بنجاح");
                setIsSuccessDialogOpen(true);
              } else {
                setAlert({ type: "error", message: data.error || "فشل في إكمال الدفعة" });
              }
            } else {
              const errorData = await response.json();
              setAlert({ type: "error", message: errorData.error || "فشل في إكمال الدفعة" });
            }
          } catch (error) {
            console.error('خطأ في إكمال الدفعة:', error);
            setAlert({ type: "error", message: "حدث خطأ في إكمال الدفعة" });
          }
        };

        // تنفيذ إكمال الدفعة
        completePayment();
        break

      case 'delete':
        dispatch({ type: "DELETE_UPCOMING_PAYMENT", payload: payment.id })

        // Remove from localStorage
        const existingPaymentsForDelete = JSON.parse(localStorage.getItem("upcomingPayments") || "[]")
        const filteredPaymentsForDelete = existingPaymentsForDelete.filter((p: any) => p.id !== payment.id)
        localStorage.setItem("upcomingPayments", JSON.stringify(filteredPaymentsForDelete))

        setSuccessMessage("تم حذف الدفعة بنجاح")
        setIsSuccessDialogOpen(true)
        break
    }

    setIsPaymentConfirmDialogOpen(false)
    setPaymentActionToConfirm(null)
  }

  // إضافة دفعة قادمة
  const handleAddPayment = async () => {
    if (!hasPermission(currentUser?.role || "", "create", "finance")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء دفعات قادمة" })
      return
    }

    // التحقق من البيانات المطلوبة
    if (!paymentFormData.client || !paymentFormData.amount || !paymentFormData.dueDate) {
      setAlert({ type: "error", message: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }

    // تحديد اسم الدافع والمستلم بناءً على نوع الدفعة
    let payerName = paymentFormData.payerName || "";
    let recipientName = currentUser?.name || "";

    // إذا كانت دفعة مقدمة لمشروع، اسم الدافع هو العميل واسم المستلم هو منشئ المشروع
    if (paymentFormData.projectId) {
      const project = projects.find(p => p.id === paymentFormData.projectId);
      if (project) {
        payerName = project.client; // اسم الدافع = العميل
        recipientName = currentUser?.name || ""; // اسم المستلم = منشئ المشروع
      }
    }

    const newPayment = {
      id: `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client: paymentFormData.client,
      clientId: paymentFormData.clientId,
      amount: Number(paymentFormData.amount),
      type: paymentFormData.type,
      dueDate: paymentFormData.dueDate,
      status: "pending",
      payerName: payerName,
      recipientName: recipientName,
      description: paymentFormData.description || `دفعة ${paymentFormData.client}`,
      projectId: paymentFormData.projectId,
      projectName: paymentFormData.projectName,
      category: paymentFormData.category || "general",
      paymentMethod: paymentFormData.paymentMethod || "cash",
      importance: paymentFormData.importance || "medium",
      createdBy: currentUser?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: paymentFormData.notes || ""
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/upcomingPayments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newPayment),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: data.data });
        setIsAddPaymentDialogOpen(false);
        setSuccessMessage("تمت إضافة الدفعة القادمة بنجاح!");
        setIsSuccessDialogOpen(true);

        // إعادة تعيين النموذج
        setPaymentFormData({
          client: "",
          clientId: "",
          amount: "",
          type: "income",
          dueDate: "",
          description: "",
          payerName: currentUser?.name || "",
          projectId: "",
          projectName: "",
          category: "general",
          paymentMethod: "cash",
          importance: "medium",
          notes: ""
        });
      } else {
        setAlert({ type: "error", message: data.error || "حدث خطأ أثناء إضافة الدفعة" });
      }
    } catch (error) {
      console.error('خطأ في إضافة الدفعة القادمة:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء إضافة الدفعة" });
    }
  };

  // تحديث دفعة قادمة
  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;
    const updatedPayment = {
      ...selectedPayment,
      client: paymentFormData.client,
      amount: Number(paymentFormData.amount),
      type: paymentFormData.type,
      dueDate: paymentFormData.dueDate || "",
      payerName: paymentFormData.payerName || "",
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/upcomingPayments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayment),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "UPDATE_UPCOMING_PAYMENT", payload: data.data });
        setAlert({ type: "success", message: "تم تحديث الدفعة القادمة بنجاح" });
        setIsAddPaymentDialogOpen(false);
        setSelectedPayment(null);
        setPaymentFormData({
          client: "",
          clientId: "",
          amount: "",
          type: "income",
          dueDate: "",
          description: "",
          payerName: currentUser?.name || "",
          projectId: "",
          projectName: "",
          category: "general",
          paymentMethod: "cash",
          importance: "medium",
          notes: "",
        });
      }
    } catch (err) { }
  };

  // حذف دفعة قادمة
  const handleDeletePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/upcomingPayments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "DELETE_UPCOMING_PAYMENT", payload: id });

        // حذف من localStorage
        const existingPayments = JSON.parse(localStorage.getItem("upcomingPayments") || "[]");
        const filteredPayments = existingPayments.filter((p: any) => p.id !== id);
        localStorage.setItem("upcomingPayments", JSON.stringify(filteredPayments));

        setSuccessMessage("تم حذف الدفعة بنجاح");
        setIsSuccessDialogOpen(true);
      } else {
        setAlert({ type: "error", message: data.error || "فشل في حذف الدفعة" });
      }
    } catch (err) {
      console.error('خطأ في حذف الدفعة:', err);
      setAlert({ type: "error", message: "حدث خطأ في حذف الدفعة" });
    }
  };

  const exportPDF = (type: "income" | "expense" | "all") => {
    // Create PDF content
    const currentDate = new Date().toLocaleDateString("ar-SA")
    const reportTitle = type === "income" ? "تقرير الدخل" : type === "expense" ? "تقرير المصروفات" : "التقرير المالي الشامل"
    const companyLogo = String(state.companySettings?.logo || "")
    const companyName = state.companySettings?.name || "اسم الشركة"
    const companyPhones = "0557917094 - 0533560878"

    // Filter transactions based on type
    let filteredTransactions = transactions
    if (type === "income") {
      filteredTransactions = transactions.filter(t => t.type === "income")
    } else if (type === "expense") {
      filteredTransactions = transactions.filter(t => t.type === "expense")
    }

    // Calculate totals
    const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const netProfit = totalIncome - totalExpenses

    // Create PDF content
    const pdfContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', Arial, sans-serif; margin: 0; background: #f6f7fb; direction: rtl; }
          .report-container { max-width: 900px; margin: 32px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 32px #0001; padding: 32px 24px 16px 24px; border: 1px solid #e5e7eb; }
          .header { text-align: center; margin-bottom: 30px; }
          .header-flex { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 10px; }
          .logo { max-width: 90px; max-height: 90px; border-radius: 10px; border: 1px solid #eee; background: #fff; box-shadow: 0 2px 8px #0001; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 6px; color: #2d3748; }
          .company-name { font-size: 20px; color: #444; margin-bottom: 4px; font-weight: 700; }
          .date { font-size: 15px; color: #666; margin-bottom: 8px; }
          .summary { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin-bottom: 32px; }
          .summary-card { background: linear-gradient(135deg, #f0f4f8 60%, #e0e7ef 100%); border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 18px 28px; min-width: 180px; text-align: center; }
          .summary-label { font-size: 16px; color: #888; margin-bottom: 6px; }
          .summary-value { font-size: 22px; font-weight: bold; }
          .income { color: #22c55e; }
          .expense { color: #ef4444; }
          .profit-card { background: linear-gradient(135deg, #e0ffe0 60%, #f0fff0 100%); border: 2px solid #22c55e33; }
          .divider { border: none; border-top: 2px solid #e5e7eb; margin: 32px 0 24px 0; }
          .table-container { overflow-x: auto; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fafbfc; border-radius: 10px; overflow: hidden; }
          .table th, .table td { border: 1px solid #e5e7eb; padding: 10px 8px; text-align: right; font-size: 15px; }
          .table th { background-color: #f1f5f9; font-weight: bold; color: #333; }
          .table tr:nth-child(even) { background: #f9fafb; }
          .table tr:nth-child(odd) { background: #fff; }
          .footer { margin-top: 40px; padding-top: 18px; border-top: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; gap: 18px; color: #666; font-size: 16px; }
          .footer-logo { max-width: 60px; max-height: 60px; border-radius: 8px; border: 1px solid #eee; background: #fff; }
          .footer-phones { font-size: 17px; font-weight: 700; color: #2d3748; letter-spacing: 1px; }
          @media (max-width: 600px) {
            .report-container { padding: 10px 2px; }
            .summary { flex-direction: column; gap: 10px; }
            .footer { flex-direction: column; gap: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="header-flex">
              ${(companyLogo && companyLogo !== "undefined") ? `<img src="${companyLogo}" alt="شعار الشركة" class="logo" />` : ""}
              <div>
                <div class="title">${reportTitle}</div>
                <div class="company-name">${companyName}</div>
              </div>
            </div>
            <div class="date">تاريخ التقرير: ${currentDate}</div>
          </div>
          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">إجمالي الدخل</div>
              <div class="summary-value income">${totalIncome.toLocaleString()} ريال</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">إجمالي المصروفات</div>
              <div class="summary-value expense">${totalExpenses.toLocaleString()} ريال</div>
            </div>
            <div class="summary-card profit-card">
              <div class="summary-label">صافي الربح</div>
              <div class="summary-value ${netProfit >= 0 ? 'income' : 'expense'}">${netProfit.toLocaleString()} ريال</div>
            </div>
          </div>
          <hr class="divider" />
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>النوع</th>
                  <th>الفئة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions.map(transaction => `
                  <tr>
                    <td>${transaction.date}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.type === "income" ? "دخل" : "مصروف"}</td>
                    <td>${transaction.category}</td>
                    <td class="${transaction.type === "income" ? "income" : "expense"}">
                      ${transaction.amount.toLocaleString()} ريال
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div class="footer-phones">${companyPhones}</div>
            ${(companyLogo && companyLogo !== "undefined") ? `<img src="${companyLogo}" alt="شعار الشركة" class="footer-logo" />` : ""}
          </div>
        </div>
      </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportTitle}_${currentDate.replace(/\//g, '-')}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addNotification({
      userId: "1",
      title: "تصدير التقرير",
      message: `تم تصدير ${reportTitle} بنجاح`,
      type: "finance",
      actionUrl: `/finance`,
      triggeredBy: currentUser?.id || "",
      isRead: false,
    })
  }

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      description: "",
      projectId: "",
      transactionType: "other",
      paymentMethod: "cash",
      importance: "medium",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      remainingAmount: "",
      payerName: currentUser?.name || "",
      recipientName: currentUser?.name || "",
    })
  }

  // دالة إضافة نوع معاملة جديد
  const handleAddNewTransactionType = () => {
    if (!newTransactionType.trim()) {
      setNewTransactionTypeError("يرجى إدخال نوع المعاملة الجديد");
      return;
    }
    setNewTransactionTypeError("");

    // تحديث بيانات النموذج بالنوع الجديد
    setFormData(prev => ({ ...prev, transactionType: newTransactionType.trim() as "license" | "certificate" | "safety" | "consultation" | "design" | "supervision" | "maintenance" | "renovation" | "inspection" | "other" }))

    // حفظ أنواع المعاملات في localStorage
    const existingTypes = JSON.parse(localStorage.getItem("transactionTypes") || "[]")
    if (!existingTypes.includes(newTransactionType.trim())) {
      existingTypes.push(newTransactionType.trim())
      localStorage.setItem("transactionTypes", JSON.stringify(existingTypes))
    }

    // إرسال إشعار للمدير
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1", // معرف المدير
        title: "تم إضافة نوع معاملة جديد",
        message: `تم إضافة نوع المعاملة "${newTransactionType.trim()}" بواسطة ${currentUser?.name}`,
        type: "finance",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
    }

    // إعادة تعيين الحقول
    setShowNewTransactionTypeInput(false)
    setNewTransactionType("")
  }

  // دالة إضافة طريقة دفع جديدة
  const handleAddNewPaymentMethod = () => {
    if (!newPaymentMethod.trim()) {
      setNewPaymentMethodError("يرجى إدخال طريقة الدفع الجديدة");
      return;
    }
    setNewPaymentMethodError("");

    // تحديث بيانات النموذج بالطريقة الجديدة
    setFormData(prev => ({ ...prev, paymentMethod: newPaymentMethod.trim() as "cash" | "transfer" | "pos" | "check" | "credit" }))

    // حفظ طرق الدفع في localStorage
    const existingMethods = JSON.parse(localStorage.getItem("paymentMethods") || "[]")
    if (!existingMethods.includes(newPaymentMethod.trim())) {
      existingMethods.push(newPaymentMethod.trim())
      localStorage.setItem("paymentMethods", JSON.stringify(existingMethods))
    }

    // إرسال إشعار للمدير
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1", // معرف المدير
        title: "تم إضافة طريقة دفع جديدة",
        message: `تم إضافة طريقة الدفع "${newPaymentMethod.trim()}" بواسطة ${currentUser?.name}`,
        type: "finance",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
    }

    // إعادة تعيين الحقول
    setShowNewPaymentMethodInput(false)
    setNewPaymentMethod("")
  }

  const getTransactionCategory = (type: string) => {
    switch (type) {
      case "license":
        return "رخصة إنشاء"
      case "certificate":
        return "شهادة إشغال"
      case "safety":
        return "مخطط سلامة"
      case "consultation":
        return "استشارة هندسية"
      case "design":
        return "تصميم"
      case "supervision":
        return "إشراف"
      case "maintenance":
        return "صيانة"
      case "renovation":
        return "ترميم"
      case "inspection":
        return "فحص"
      default:
        return "أخرى"
    }
  }

  // إضافة أنواع المعاملات الجديدة
  const transactionTypes = [
    { value: "license", label: "رخصة إنشاء" },
    { value: "certificate", label: "شهادة إشغال" },
    { value: "safety", label: "مخطط سلامة" },
    { value: "consultation", label: "استشارة هندسية" },
    { value: "design", label: "تصميم" },
    { value: "supervision", label: "إشراف" },
    { value: "maintenance", label: "صيانة" },
    { value: "renovation", label: "ترميم" },
    { value: "inspection", label: "فحص" },
    { value: "other", label: "أخرى" },
  ]

  // إضافة طرق الدفع الجديدة
  const paymentMethods = [
    { value: "cash", label: "نقداً" },
    { value: "transfer", label: "تحويل بنكي" },
    { value: "pos", label: "شبكة" },
    { value: "check", label: "شيك" },
    { value: "credit", label: "بطاقة ائتمان" },
  ]

  // دالة لحساب حالة الدفعة وألوانها
  const getPaymentStatus = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        status: "overdue",
        color: "border-red-500 bg-red-50 dark:bg-red-950/20",
        textColor: "text-red-600 dark:text-red-400",
        badgeColor: "bg-red-500",
        daysText: `${Math.abs(diffDays)} يوم متأخر`
      }
    } else if (diffDays === 0) {
      return {
        status: "due-today",
        color: "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
        textColor: "text-orange-600 dark:text-orange-400",
        badgeColor: "bg-orange-500",
        daysText: "اليوم"
      }
    } else if (diffDays <= 3) {
      return {
        status: "due-soon",
        color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
        textColor: "text-yellow-600 dark:text-yellow-400",
        badgeColor: "bg-yellow-500",
        daysText: `${diffDays} يوم متبقي`
      }
    } else {
      return {
        status: "pending",
        color: "border-green-500 bg-green-50 dark:bg-green-950/20",
        textColor: "text-green-600 dark:text-green-400",
        badgeColor: "bg-green-500",
        daysText: `${diffDays} يوم متبقي`
      }
    }
  }

  // دالة لإرسال إشعارات للدفعات المتأخرة والقادمة
  const checkOverduePayments = () => {
    const today = new Date()

    // فحص الدفعات المتأخرة
    const overduePayments = upcomingPaymentsList.filter(payment => {
      const dueDate = new Date(payment.dueDate)
      return dueDate < today
    })

    overduePayments.forEach(payment => {
      const daysOverdue = Math.ceil((today.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))

      // إرسال إشعار فقط إذا كانت الدفعة متأخرة ولم يتم إرسال إشعار لها من قبل
      if (payment.status !== "overdue") {
        addNotification({
          userId: "1",
          title: "دفعة متأخرة",
          message: `دفعة ${payment.client} متأخرة ${daysOverdue} يوم - المبلغ: ${payment.amount.toLocaleString()} ريال`,
          type: "finance",
          actionUrl: `/finance`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
        })
      }
    })

    // فحص الدفعات المستحقة اليوم (مرة واحدة فقط)
    const dueTodayPayments = upcomingPaymentsList.filter(payment => {
      const dueDate = new Date(payment.dueDate)
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      return dueDateStart.getTime() === todayStart.getTime()
    })

    // إرسال إشعار واحد فقط للدفعات المستحقة اليوم
    if (dueTodayPayments.length > 0) {
      const totalAmount = dueTodayPayments.reduce((sum, payment) => sum + payment.amount, 0)
      addNotification({
        userId: "1",
        title: "دفعات مستحقة اليوم",
        message: `يوجد ${dueTodayPayments.length} دفعة مستحقة اليوم - إجمالي المبلغ: ${totalAmount.toLocaleString()} ريال`,
        type: "finance",
        actionUrl: `/finance`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }

    // فحص الدفعات المستحقة خلال 3 أيام (مرة واحدة فقط)
    const dueSoonPayments = upcomingPaymentsList.filter(payment => {
      const dueDate = new Date(payment.dueDate)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 3
    })

    // إرسال إشعار واحد فقط للدفعات القادمة
    if (dueSoonPayments.length > 0) {
      const totalAmount = dueSoonPayments.reduce((sum, payment) => sum + payment.amount, 0)
      addNotification({
        userId: "1",
        title: "دفعات قادمة قريباً",
        message: `يوجد ${dueSoonPayments.length} دفعة مستحقة خلال 3 أيام - إجمالي المبلغ: ${totalAmount.toLocaleString()} ريال`,
        type: "finance",
        actionUrl: `/finance`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  // تشغيل فحص الدفعات المتأخرة عند تحميل الصفحة
  useEffect(() => {
    checkOverduePayments()

    // تحديث حالة الدفعات كل دقيقة
    const interval = setInterval(() => {
      const updatedPayments = upcomingPaymentsList.map(payment => {
        const paymentStatus = getPaymentStatus(payment.dueDate)
        return {
          ...payment,
          status: paymentStatus.status as "pending" | "overdue"
        }
      })
      // تحديث الدفعات القادمة في state
      updatedPayments.forEach(payment => {
        dispatch({ type: "UPDATE_UPCOMING_PAYMENT", payload: payment })
      })
    }, 60000) // كل دقيقة

    return () => clearInterval(interval)
  }, [upcomingPaymentsList])

  const canCreateTransaction = hasPermission(currentUser?.role || "", "create", "finance")
  const canEditTransaction = hasPermission(currentUser?.role || "", "edit", "finance")
  const canDeleteTransaction = hasPermission(currentUser?.role || "", "delete", "finance")

  const handleCreateInvoice = async (transaction: Transaction) => {
    const project = projects.find(p => p.id === transaction.projectId)
    const client = clients.find(c => c.id === transaction.clientId || c.id === project?.clientId)

    if (project && client) {
      try {
        // تحميل أحدث بيانات المكتب من قاعدة البيانات
        const response = await fetch('/api/companySettings');
        const data = await response.json();

        let companySettings = state.companySettings;
        if (data.success && data.data) {
          companySettings = data.data;
          // تحديث localStorage
          localStorage.setItem("companySettings", JSON.stringify(companySettings));
        }

        const htmlContent = InvoiceGenerator.generateInvoiceFromTransaction(
          transaction,
          project,
          client,
          companySettings
        )

        InvoiceGenerator.openInvoiceInNewTab(htmlContent)
      } catch (error) {
        console.error('Error loading company settings:', error);
        // استخدام البيانات المحلية إذا فشل التحميل
        const htmlContent = InvoiceGenerator.generateInvoiceFromTransaction(
          transaction,
          project,
          client,
          state.companySettings
        )

        InvoiceGenerator.openInvoiceInNewTab(htmlContent)
      }
    } else {
      setAlert({ type: "error", message: "لا يمكن إنشاء الفاتورة: المشروع أو العميل غير موجود" })
    }
  }

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      // البحث عن المعاملة في state للحصول على _id
      const transaction = transactions.find(t => t.id === transactionToDelete);
      if (!transaction) {
        setDeleteError("لم يتم العثور على المعاملة");
        return;
      }

      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "DELETE_TRANSACTION", payload: transactionToDelete });
        showSuccessToast("تم حذف المعاملة بنجاح", "تم حذف المعاملة بنجاح");
      } else {
        setDeleteError("فشل حذف المعاملة من قاعدة البيانات");
      }
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setDeleteError("حدث خطأ أثناء حذف المعاملة من قاعدة البيانات");
    }
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
          <h1 className="text-3xl font-bold text-foreground mb-1">
            النظام المالي
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الدخل والمصروفات والتقارير المالية</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          {/* إظهار زر تصدير التقرير للمديرين والمحاسبين فقط */}
          {(currentUser?.role === "admin" || currentUser?.role === "accountant") && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  تصدير التقرير
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تصدير التقرير المالي</DialogTitle>
                  <DialogDescription>اختر نوع التقرير المراد تصديره</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportPDF("income")}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    تقرير الدخل
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportPDF("expense")}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    تقرير المصروفات
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportPDF("all")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    التقرير المالي الشامل
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canCreateTransaction && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  معاملة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "تعديل المعاملة" : "إضافة معاملة مالية جديدة"}</DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? "قم بتعديل تفاصيل المعاملة" : "قم بإدخال تفاصيل المعاملة المالية"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-category" className="flex items-center">
                      نوع المعاملة
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "income" | "expense") => setFormData((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المعاملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">دخل</SelectItem>
                        <SelectItem value="expense">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center">
                      المبلغ
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
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
                    {requiredFieldsTransaction.amount && (
                      <p className="text-xs text-red-500 mt-1">هذا الحقل مطلوب</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remaining-amount">
                      المبلغ المتبقي (اختياري)
                    </Label>
                    <div className="relative">
                      <Input
                        id="remaining-amount"
                        type="number"
                        placeholder="0"
                        value={formData.remainingAmount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, remainingAmount: e.target.value }))}
                        className="pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="opacity-60 block dark:hidden" />
                        <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="opacity-60 hidden dark:block" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description" className="flex items-center">
                      الوصف
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="description"
                      placeholder="وصف المعاملة"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    {requiredFieldsTransaction.description && (
                      <p className="text-xs text-red-500 mt-1">هذا الحقل مطلوب</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-category" className="flex items-center">
                      نوع المعاملة
                    </Label>
                    {!showNewTransactionTypeInput ? (
                      <div className="flex space-x-2 space-x-reverse">
                        <Select
                          value={formData.transactionType}
                          onValueChange={(value: string) =>
                            setFormData((prev) => ({ ...prev, transactionType: value as "license" | "certificate" | "safety" | "consultation" | "design" | "supervision" | "maintenance" | "renovation" | "inspection" | "other" }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            {transactionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewTransactionTypeInput(true)}
                          className="shrink-0"
                          title="إضافة نوع معاملة جديد"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex space-x-2 space-x-reverse">
                          <Input
                            placeholder="نوع المعاملة الجديد"
                            value={newTransactionType}
                            onChange={(e) => setNewTransactionType(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTransactionType.trim()) {
                                handleAddNewTransactionType()
                              }
                            }}
                            className={newTransactionTypeError ? "border-red-500" : ""}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddNewTransactionType}
                            disabled={!newTransactionType.trim()}
                            className="shrink-0"
                            title="حفظ نوع المعاملة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setShowNewTransactionTypeInput(false)
                              setNewTransactionType("")
                            }}
                            className="shrink-0"
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {newTransactionTypeError && (
                          <p className="text-xs text-red-500 mt-1">{newTransactionTypeError}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="importance">الأهمية</Label>
                    <Select
                      value={formData.importance || "medium"}
                      onValueChange={(value: "high" | "medium" | "low") =>
                        setFormData((prev) => ({ ...prev, importance: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأهمية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-method" className="flex items-center">
                      طريقة الدفع
                    </Label>
                    {!showNewPaymentMethodInput ? (
                      <div className="flex space-x-2 space-x-reverse">
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value: string) =>
                            setFormData((prev) => ({ ...prev, paymentMethod: value as "cash" | "transfer" | "pos" | "check" | "credit" }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر طريقة الدفع" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewPaymentMethodInput(true)}
                          className="shrink-0"
                          title="إضافة طريقة دفع جديدة"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex space-x-2 space-x-reverse">
                          <Input
                            placeholder="طريقة الدفع الجديدة"
                            value={newPaymentMethod}
                            onChange={(e) => setNewPaymentMethod(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newPaymentMethod.trim()) {
                                handleAddNewPaymentMethod()
                              }
                            }}
                            className={newPaymentMethodError ? "border-red-500" : ""}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddNewPaymentMethod}
                            disabled={!newPaymentMethod.trim()}
                            className="shrink-0"
                            title="حفظ طريقة الدفع"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setShowNewPaymentMethodInput(false)
                              setNewPaymentMethod("")
                            }}
                            className="shrink-0"
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {newPaymentMethodError && (
                          <p className="text-xs text-red-500 mt-1">{newPaymentMethodError}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="related-project">المشروع المرتبط</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => {
                        const project = projects.find(p => p.id === value);
                        setFormData((prev) => ({
                          ...prev,
                          projectId: value,
                          payerName: project ? project.client : prev.payerName
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المشروع (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center">
                      التاريخ الميلادي
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                    {requiredFieldsTransaction.date && (
                      <p className="text-xs text-red-500 mt-1">هذا الحقل مطلوب</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hijri-date">التاريخ الهجري</Label>
                    <Input
                      id="hijri-date"
                      type="text"
                      placeholder="سيتم التحويل تلقائياً"
                      value={(() => {
                        // تحويل التاريخ الميلادي إلى هجري
                        if (formData.date) {
                          const date = new Date(formData.date);
                          // هنا يمكن إضافة مكتبة تحويل التاريخ أو حساب بسيط
                          const hijriYear = date.getFullYear() - 622;
                          const hijriMonth = date.getMonth() + 1;
                          const hijriDay = date.getDate();
                          return `${hijriDay}/${hijriMonth}/${hijriYear}`;
                        }
                        return "";
                      })()}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      placeholder="ملاحظات إضافية"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName" className="flex items-center">
                      اسم المستلم
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Select
                      value={formData.recipientName}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, recipientName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستلم" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payerName" className="flex items-center">
                      اسم الدافع
                    </Label>
                    <Input
                      id="payerName"
                      placeholder={(() => {
                        // إذا كان هناك مشروع محدد، عرض اسم العميل تلقائياً
                        if (formData.projectId) {
                          const project = projects.find(p => p.id === formData.projectId);
                          if (project) {
                            return project.client;
                          }
                        }
                        return "اسم الدافع (اختياري)";
                      })()}
                      value={formData.payerName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, payerName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => {
                    if (editingTransaction) {
                      releaseTransactionLock(editingTransaction.id)
                    }
                    setIsDialogOpen(false)
                  }}>
                    إلغاء
                  </Button>
                  <Button onClick={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}>
                    {editingTransaction ? "تحديث المعاملة" : "حفظ المعاملة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Financial Summary - إظهار للمديرين والمحاسبين فقط */}
      {(currentUser?.role === "admin" || currentUser?.role === "accountant") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground"
            onClick={() => setFilterType("income")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الدخل</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-green-400">
                      <ArabicNumber value={financialSummary.totalIncome} />
                    </span>
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-900">
                  <ArrowUpCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground"
            onClick={() => setFilterType("expense")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-red-400">
                      <ArabicNumber value={financialSummary.totalExpenses} />
                    </span>
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                  </div>
                </div>
                <div className="p-3 rounded-full bg-red-900">
                  <ArrowDownCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground"
            onClick={() => setFilterType("all")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">صافي الربح</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <ArabicNumber value={financialSummary.netProfit} />
                    </span>
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                  </div>
                </div>
                <div className={`p-3 rounded-full ${financialSummary.netProfit >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
                  <DollarSign className={`w-6 h-6 ${financialSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground"
            onClick={openMonthlyGrowthDialog}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    النمو الشهري - {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-blue-400">
                      {financialSummary.monthlyGrowth}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    مقارنة بـ {new Date(lastMonthYear, lastMonth).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-900">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-foreground mb-1">المعاملات المالية</CardTitle>
                  <CardDescription className="text-muted-foreground">سجل جميع المعاملات المالية</CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="البحث في المعاملات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 bg-muted text-card-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48 bg-muted text-card-foreground">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="فلترة حسب النوع" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted text-card-foreground">
                    <SelectItem value="all">جميع المعاملات</SelectItem>
                    <SelectItem value="income">الدخل فقط</SelectItem>
                    <SelectItem value="expense">المصروفات فقط</SelectItem>
                    <SelectItem value="license">رخصة إنشاء</SelectItem>
                    <SelectItem value="certificate">شهادة إشغال</SelectItem>
                    <SelectItem value="safety">مخطط سلامة</SelectItem>
                    <SelectItem value="consultation">استشارة هندسية</SelectItem>
                    <SelectItem value="design">تصميم</SelectItem>
                    <SelectItem value="supervision">إشراف</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="renovation">ترميم</SelectItem>
                    <SelectItem value="inspection">فحص</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredTransactions.map((transaction, idx) => (
                <SwipeToDelete
                  key={transaction.id}
                  onDelete={() => handleDeleteTransaction(transaction.id)}
                >
                  <div
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-muted' : ''} hover:bg-muted`}
                    onClick={() => openDetailsDialog(transaction)}
                  >
                    {/* Main content right-aligned (RTL) */}
                    <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-900" : "bg-red-900"}`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">{transaction.description}</p>
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          {transaction.clientName && <p className="text-sm text-muted-foreground truncate">{transaction.clientName}</p>}
                          <Badge variant="outline" className="text-xs">
                            {getTransactionCategory(transaction.transactionType)}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {transaction.date}
                        </div>
                        <div className="flex space-x-1 space-x-reverse mt-2">
                          {transaction.type === "income" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateInvoice(transaction)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="إنشاء فاتورة"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetailsDialog(transaction)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEditTransaction && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(transaction)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteTransaction && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTransaction(transaction.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Price left-aligned */}
                    <div className="flex flex-col items-end min-w-[110px] ml-2">
                      <div className={`flex items-center gap-1 ${transaction.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        <span className="text-lg font-bold whitespace-nowrap">
                          <ArabicNumber value={transaction.amount} />
                        </span>
                        <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                        <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                      </div>
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs mt-1">
                        {transaction.status === "completed"
                          ? "مكتملة"
                          : transaction.status === "pending"
                            ? "معلقة"
                            : transaction.status === "draft"
                              ? "مسودة"
                              : "ملغاة"}
                      </Badge>
                    </div>
                  </div>
                </SwipeToDelete>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Payments */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground mb-1">الدفعات القادمة</CardTitle>
                <CardDescription className="text-muted-foreground">الدفعات المتوقعة والمستحقة</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPayment(null)
                  setPaymentFormData({
                    client: "",
                    clientId: "",
                    amount: "",
                    type: "income",
                    dueDate: "",
                    description: "",
                    payerName: currentUser?.name || "",
                    projectId: "",
                    projectName: "",
                    category: "general",
                    paymentMethod: "cash",
                    importance: "medium",
                    notes: "",
                  })
                  setIsAddPaymentDialogOpen(true)
                }}
                className="flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>دفعة جديدة</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPaymentsList.map((payment, index) => {
              const paymentStatus = getPaymentStatus(payment.dueDate)
              return (
                <div
                  key={payment.id}
                  className={`p-4 border-2 rounded-lg hover:bg-muted transition-colors cursor-pointer ${paymentStatus.color}`}
                  onClick={() => openPaymentDetailsDialog(payment)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{payment.client}</p>
                      {paymentStatus.status === "overdue" && (
                        <div title="دفعة متأخرة">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className={`p-1 rounded-full ${payment.type === "income" ? "bg-green-900" : "bg-red-900"}`}>
                        {payment.type === "income" ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <Badge
                        className={`text-xs ${paymentStatus.badgeColor} text-white`}
                      >
                        {paymentStatus.daysText}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <div className={`flex items-center gap-1 ${payment.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      <span className="text-lg font-bold">
                        <ArabicNumber value={payment.amount} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      موعد الاستحقاق: {payment.dueDate}
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePaymentAction(payment, 'complete')
                        }}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="إكمال الدفعة"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePaymentAction(payment, 'edit')
                        }}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="تعديل الدفعة"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePaymentAction(payment, 'delete')
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="حذف الدفعة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل المعاملة المالية</DialogTitle>
            <DialogDescription>معلومات شاملة عن المعاملة</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedTransaction.description}</h3>
                  <p className="text-muted-foreground mt-1">{selectedTransaction.clientName}</p>
                  <Badge variant={selectedTransaction.type === "income" ? "default" : "destructive"} className="mt-2">
                    {selectedTransaction.type === "income" ? "دخل" : "مصروف"}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 space-x-reverse">
                    <p
                      className={`text-2xl font-bold ${selectedTransaction.type === "income" ? "text-green-400" : "text-red-400"}`}
                    >
                      <ArabicNumber value={selectedTransaction.amount} />
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" />
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">المبلغ</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع المعاملة:</span>
                    <span>{getTransactionCategory(selectedTransaction.transactionType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأهمية:</span>
                    <Badge
                      variant={
                        selectedTransaction.importance === "high"
                          ? "destructive"
                          : selectedTransaction.importance === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {selectedTransaction.importance === "high"
                        ? "عالية"
                        : selectedTransaction.importance === "medium"
                          ? "متوسطة"
                          : "منخفضة"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التاريخ:</span>
                    <span>{selectedTransaction.date}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة:</span>
                    <Badge variant={selectedTransaction.status === "completed" ? "default" : "secondary"}>
                      {selectedTransaction.status === "completed"
                        ? "مكتملة"
                        : selectedTransaction.status === "pending"
                          ? "معلقة"
                          : selectedTransaction.status === "draft"
                            ? "مسودة"
                            : "ملغاة"}
                    </Badge>
                  </div>
                  {selectedTransaction.projectName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المشروع:</span>
                      <span>{selectedTransaction.projectName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التصنيف:</span>
                    <span>{selectedTransaction.category}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
                {selectedTransaction.type === "income" && (
                  <Button
                    variant="outline"
                    onClick={() => handleCreateInvoice(selectedTransaction)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    إنشاء فاتورة
                  </Button>
                )}
                {canEditTransaction && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      openEditDialog(selectedTransaction)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                )}
                {canDeleteTransaction && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      handleDeleteTransaction(selectedTransaction.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monthly Growth Comparison Dialog */}
      <Dialog open={isMonthlyGrowthDialogOpen} onOpenChange={setIsMonthlyGrowthDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>مقارنة النمو الشهري</DialogTitle>
            <DialogDescription>مقارنة الأداء المالي بين الشهر الحالي والشهر السابق</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Current Month vs Previous Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">الشهر الحالي</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {(() => {
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth();
                      const currentYear = currentDate.getFullYear();
                      const arabicMonths = [
                        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
                      ];
                      return `${arabicMonths[currentMonth]} ${currentYear}`;
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">إجمالي الدخل:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-400">
                        <ArabicNumber value={financialSummary.totalIncome} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">إجمالي المصروفات:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-red-400">
                        <ArabicNumber value={financialSummary.totalExpenses} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-muted-foreground">صافي الربح:</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${financialSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <ArabicNumber value={financialSummary.netProfit} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">الشهر السابق</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {lastMonth === 11 ? "ديسمبر" : lastMonth === 10 ? "نوفمبر" : lastMonth === 9 ? "أكتوبر" :
                      lastMonth === 8 ? "سبتمبر" : lastMonth === 7 ? "أغسطس" : lastMonth === 6 ? "يوليو" :
                        lastMonth === 5 ? "يونيو" : lastMonth === 4 ? "مايو" : lastMonth === 3 ? "أبريل" :
                          lastMonth === 2 ? "مارس" : lastMonth === 1 ? "فبراير" : "يناير"} {lastMonthYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">إجمالي الدخل:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-400">
                        <ArabicNumber value={lastMonthIncome} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">إجمالي المصروفات:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-red-400">
                        <ArabicNumber value={lastMonthExpenses} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-muted-foreground">صافي الربح:</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${lastMonthProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <ArabicNumber value={lastMonthProfit} />
                      </span>
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Analysis */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">تحليل النمو</CardTitle>
                <CardDescription className="text-muted-foreground">مقارنة الأداء بين الشهرين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-900 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {Number(incomeGrowth) >= 0 ? "+" : ""}{incomeGrowth}%
                    </div>
                    <div className="text-sm text-muted-foreground">نمو الدخل</div>
                  </div>
                  <div className="text-center p-4 bg-red-900 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {Number(expensesGrowth) >= 0 ? "+" : ""}{expensesGrowth}%
                    </div>
                    <div className="text-sm text-muted-foreground">نمو المصروفات</div>
                  </div>
                  <div className="text-center p-4 bg-blue-900 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {Number(profitGrowth) >= 0 ? "+" : ""}{profitGrowth}%
                    </div>
                    <div className="text-sm text-muted-foreground">نمو صافي الربح</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={isPaymentDetailsDialogOpen} onOpenChange={setIsPaymentDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>تفاصيل الدفعة</DialogTitle>
                <DialogDescription>معلومات شاملة عن الدفعة</DialogDescription>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPaymentDetailsDialogOpen(false)
                    handlePaymentAction(selectedPayment!, 'complete')
                  }}
                  className="flex items-center space-x-1 space-x-reverse text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>إكمال الدفعة</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPaymentDetailsDialogOpen(false)
                    handlePaymentAction(selectedPayment!, 'edit')
                  }}
                  className="flex items-center space-x-1 space-x-reverse hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span>تعديل</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPaymentDetailsDialogOpen(false)
                    handlePaymentAction(selectedPayment!, 'delete')
                  }}
                  className="flex items-center space-x-1 space-x-reverse text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedPayment.client}</h3>
                  <Badge
                    variant={selectedPayment.status === "overdue" ? "destructive" : "secondary"}
                    className="mt-2"
                  >
                    {selectedPayment.status === "overdue" ? "متأخر" : "قادم"}
                  </Badge>
                  <Badge
                    variant={selectedPayment.type === "income" ? "default" : "destructive"}
                    className="mr-2"
                  >
                    {selectedPayment.type === "income" ? "دخل" : "مصروف"}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 space-x-reverse">
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                    <p className={`text-2xl font-bold ${selectedPayment.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      <ArabicNumber value={selectedPayment.amount} />
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">المبلغ</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع الدفعة:</span>
                    <span>{selectedPayment.type === "income" ? "دخل" : "مصروف"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة:</span>
                    <Badge variant={selectedPayment.status === "overdue" ? "destructive" : "secondary"}>
                      {selectedPayment.status === "overdue" ? "متأخر" : "قادم"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">موعد الاستحقاق:</span>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedPayment.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأيام المتبقية:</span>
                    <span className="text-sm">
                      {(() => {
                        const today = new Date()
                        const dueDate = new Date(selectedPayment.dueDate)
                        const diffTime = dueDate.getTime() - today.getTime()
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        return diffDays > 0 ? `${diffDays} يوم` : diffDays < 0 ? `${Math.abs(diffDays)} يوم متأخر` : "اليوم"
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Timeline */}
              <div>
                <h4 className="font-medium mb-2">سجل الدفعة</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>تم إنشاء الدفعة في {selectedPayment.dueDate}</span>
                  </div>
                  {selectedPayment.status === "overdue" && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>الدفعة متأخرة</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? "تعديل الدفعة" : "إضافة دفعة قادمة جديدة"}</DialogTitle>
            <DialogDescription>
              {selectedPayment ? "قم بتعديل تفاصيل الدفعة" : "قم بإدخال تفاصيل الدفعة القادمة"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-client" className="flex items-center">
                  العميل
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="payment-client"
                  placeholder="اسم العميل"
                  value={paymentFormData.client}
                  onChange={(e) => setPaymentFormData((prev) => ({ ...prev, client: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-type" className="flex items-center">
                  نوع الدفعة
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Select
                  value={paymentFormData.type}
                  onValueChange={(value: "income" | "expense") => setPaymentFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الدفعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">دخل</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="opacity-60 block dark:hidden" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="opacity-60 hidden dark:block" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-due-date" className="flex items-center">
                  موعد الاستحقاق
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="payment-due-date"
                  type="date"
                  value={paymentFormData.dueDate}
                  onChange={(e) => setPaymentFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-description">الوصف</Label>
              <Textarea
                id="payment-description"
                placeholder="وصف الدفعة (اختياري)"
                value={paymentFormData.description}
                onChange={(e) => setPaymentFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="payerName" className="flex items-center">
                اسم الدافع
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <Input
                id="payerName"
                placeholder="اسم الدافع"
                value={paymentFormData.payerName}
                onChange={(e) => setPaymentFormData((prev) => ({ ...prev, payerName: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={selectedPayment ? handleUpdatePayment : handleAddPayment}>
                {selectedPayment ? "تحديث الدفعة" : "إضافة الدفعة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={isPaymentConfirmDialogOpen} onOpenChange={setIsPaymentConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الإجراء</DialogTitle>
            <DialogDescription>
              {paymentActionToConfirm?.action === 'complete'
                ? "هل أنت متأكد من إكمال هذه الدفعة؟ سيتم إضافتها للمعاملات المالية."
                : "هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء."
              }
            </DialogDescription>
          </DialogHeader>
          {paymentActionToConfirm && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{paymentActionToConfirm.payment.client}</p>
                  <Badge
                    variant={paymentActionToConfirm.payment.type === "income" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {paymentActionToConfirm.payment.type === "income" ? "دخل" : "مصروف"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">
                    <ArabicNumber value={paymentActionToConfirm.payment.amount} />
                  </span>
                  <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="w-5 h-5 opacity-80 block dark:hidden" />
                  <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="w-5 h-5 opacity-80 hidden dark:block" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  موعد الاستحقاق: {paymentActionToConfirm.payment.dueDate}
                </p>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPaymentConfirmDialogOpen(false)
                    setPaymentActionToConfirm(null)
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant={paymentActionToConfirm.action === 'delete' ? "destructive" : "default"}
                  onClick={confirmPaymentAction}
                >
                  {paymentActionToConfirm.action === 'complete' ? 'إكمال الدفعة' : 'حذف الدفعة'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              تم بنجاح
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">{successMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSuccessDialogOpen(false)}>
              حسناً
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="تأكيد حذف المعاملة المالية"
        description="هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={transactions.find(t => t.id === transactionToDelete)?.description || "المعاملة"}
        type="task"
        error={deleteError}
      />
    </div>
  )
}
