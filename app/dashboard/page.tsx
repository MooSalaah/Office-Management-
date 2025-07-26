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

// Project Dialog Component
function ProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { createProjectWithDownPayment, addNotification, createClient } = useAppActions()
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    type: "",
    price: "",
    downPayment: "",
    assignedEngineerId: "",
    importance: "medium" as "low" | "medium" | "high",
    status: "draft" as "draft" | "in-progress" | "completed" | "canceled",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
  })

  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [showNewClientInput, setShowNewClientInput] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newProjectType, setNewProjectType] = useState("")
  const [showNewEngineerInput, setShowNewEngineerInput] = useState(false)
  const [newEngineerName, setNewEngineerName] = useState("")
  const [newClientInputError, setNewClientInputError] = useState("")
  const [newTypeInputError, setNewTypeInputError] = useState("")
  const [newEngineerInputError, setNewEngineerInputError] = useState("")

  const remainingBalance = Number(formData.price) - Number(formData.downPayment)

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      setNewClientInputError("يرجى إدخال اسم العميل الجديد");
      return;
    }
    setNewClientInputError("");
    if (newClientName.trim()) {
      const newClient = {
        id: Date.now().toString(),
        name: newClientName,
        phone: "", // غير إلزامي
        email: "",
        address: "",
        status: "active" as const,
        notes: "",
        projectsCount: 0,
        totalValue: 0,
        lastContact: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
      try {
        // استخدام وظيفة AppContext
        await createClient(newClient);
        setFormData(prev => ({ ...prev, clientId: newClient.id }));
        setShowNewClientInput(false);
        setNewClientName("");
        addNotification({
          userId: "1",
          title: "عميل جديد تم إضافته",
          message: `تم إضافة العميل "${newClientName}" بنجاح`,
          type: "system",
          isRead: false,
          actionUrl: `/clients`,
          triggeredBy: state.currentUser?.id || "",
        });
      } catch (error) {
        setNewClientInputError("حدث خطأ أثناء حفظ العميل في قاعدة البيانات");
      }
    }
  };

  const handleAddNewProjectType = () => {
    if (!newProjectType.trim()) {
      setNewTypeInputError("يرجى إدخال نوع المشروع الجديد");
      return;
    }
    setNewTypeInputError("");
    if (newProjectType.trim()) {
      setFormData(prev => ({ ...prev, type: newProjectType }))
      
      // Save project types to localStorage
      const existingTypes = JSON.parse(localStorage.getItem("projectTypes") || "[]")
      if (!existingTypes.includes(newProjectType.trim())) {
        existingTypes.push(newProjectType.trim())
        localStorage.setItem("projectTypes", JSON.stringify(existingTypes))
      }
      
      setShowNewTypeInput(false)
      setNewProjectType("")
      addNotification({
        userId: "1",
        title: "نوع مشروع جديد",
        message: `تم إضافة نوع مشروع جديد: "${newProjectType}"`,
        type: "project",
        isRead: false,
        actionUrl: `/projects`,
        triggeredBy: state.currentUser?.id || "",
      })
    }
  }

  const handleAddNewEngineer = () => {
    if (!newEngineerName.trim()) {
      setNewEngineerInputError("يرجى إدخال اسم المهندس الجديد");
      return;
    }
    setNewEngineerInputError("");
    // Check if user has permission to add engineers (only engineers and managers can add engineers)
    if (!hasPermission(state.currentUser?.role || "", "create", "users") && state.currentUser?.role !== "engineer") {
      addNotification({
        userId: state.currentUser?.id || "",
        title: "خطأ في الصلاحيات",
        message: "فقط المهندسون والمديرون يمكنهم إضافة مهندسين جدد",
        type: "system",
        isRead: false,
        actionUrl: `/settings`,
        triggeredBy: state.currentUser?.id || "",
      })
      return
    }

    if (newEngineerName.trim()) {
      // Generate email and password based on name
      const nameParts = newEngineerName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''
      
      // Create email: first letter of first name + last name + @newcorner.sa
      const emailPrefix = (firstName.charAt(0) + lastName).toLowerCase().replace(/\s+/g, '')
      let email = `${emailPrefix}@newcorner.sa`
      
      // Check if email already exists and add number if needed
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      let emailCounter = 1
      let finalEmail = email
      while (existingUsers.some((user: any) => user.email === finalEmail)) {
        finalEmail = `${emailPrefix}${emailCounter}@newcorner.sa`
        emailCounter++
      }
      
      // Create default password: first letter of first name + last name + 123
      const defaultPassword = `${firstName.charAt(0)}${lastName}123`.toLowerCase().replace(/\s+/g, '')

      const newEngineer = {
        id: Date.now().toString(),
        name: newEngineerName,
        email: finalEmail,
        password: defaultPassword,
        phone: "",
        role: "engineer" as const,
        isActive: true,
        avatar: "",
        monthlySalary: 5000, // مرتب مبدئي 5000 ريال
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "ADD_USER", payload: newEngineer })
      
      // Save to localStorage
      existingUsers.push(newEngineer)
      localStorage.setItem("users", JSON.stringify(existingUsers))
      
      // إرسال تحديث فوري
      realtimeUpdates.sendUserUpdate({ action: 'create', user: newEngineer })
      
      setFormData(prev => ({ ...prev, assignedEngineerId: newEngineer.id }))
      setShowNewEngineerInput(false)
      setNewEngineerName("")
      addNotification({
        userId: "1",
        title: "مهندس جديد تم إضافته",
        message: `تم إضافة المهندس "${newEngineerName}" بنجاح. الإيميل: ${finalEmail}، كلمة المرور: ${defaultPassword}`,
        type: "system",
        isRead: false,
        actionUrl: `/settings`,
        triggeredBy: state.currentUser?.id || "",
      })
    }
  }

  const handleSubmit = () => {
    if (showNewClientInput || showNewTypeInput || showNewEngineerInput) {
      return;
    }
    if (!hasPermission(state.currentUser?.role || "", "create", "projects")) {
      addNotification({
        userId: state.currentUser?.id || "",
        title: "خطأ في إنشاء المشروع",
        message: "ليس لديك صلاحية لإنشاء المشاريع",
        type: "system",
        isRead: false,
        triggeredBy: state.currentUser?.id || "",
      })
      return;
    }
    const missing: string[] = [];
    if (!formData.name.trim()) missing.push("اسم المشروع");
    if (!formData.clientId) missing.push("العميل");
    if (!formData.type) missing.push("نوع المشروع");
    if (!formData.assignedEngineerId) missing.push("المهندس المسؤول");
    if (!formData.price) missing.push("السعر الإجمالي");
    if (missing.length > 0) {
      setShowValidationErrors(true);
      setMissingFields(missing);
      return;
    }
    setMissingFields([]);

    const client = state.clients.find((c) => c.id === formData.clientId)
    const engineer = state.users.find((u) => u.id === formData.assignedEngineerId)

    if (!client || !engineer) return

    const today = new Date()
    const hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(today)

    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      client: client.name,
      clientId: formData.clientId,
      type: formData.type,
      status: formData.status,
      team: [formData.assignedEngineerId],
      startDate: formData.startDate,
      startDateHijri: hijriDate,
      price: Number.parseFloat(formData.price),
      downPayment: Number.parseFloat(formData.downPayment) || 0,
      remainingBalance: remainingBalance,
      assignedEngineerId: formData.assignedEngineerId,
      assignedEngineerName: engineer.name,
      importance: formData.importance,
      description: formData.description,
      progress: 0,
      createdBy: state.currentUser?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    createProjectWithDownPayment(newProject)
    
    // إرسال تحديث فوري لجميع المستخدمين
    realtimeUpdates.sendProjectUpdate({ action: 'create', project: newProject, userId: state.currentUser?.id, userName: state.currentUser?.name })
    
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      clientId: "",
      type: "",
      price: "",
      downPayment: "",
      assignedEngineerId: "",
      importance: "medium",
      status: "draft",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
    })
    setShowValidationErrors(false)
    setMissingFields([])
    setShowNewClientInput(false)
    setNewClientName("")
    setShowNewTypeInput(false)
    setNewProjectType("")
    setShowNewEngineerInput(false)
    setNewEngineerName("")
    setNewClientInputError("")
    setNewTypeInputError("")
    setNewEngineerInputError("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مشروع جديد</DialogTitle>
          <DialogDescription>قم بإدخال تفاصيل المشروع الجديد</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="flex items-center">
              اسم المشروع
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="اسم المشروع"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={showValidationErrors && !formData.name.trim() ? "border-red-500" : ""}
            />
            {showValidationErrors && !formData.name.trim() && (
              <p className="text-xs text-red-500">اسم المشروع مطلوب</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center">
              العميل
              <span className="text-red-500 mr-1">*</span>
            </Label>
            {!showNewClientInput ? (
              <div className="flex space-x-2 space-x-reverse">
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger className={`flex-1 ${showValidationErrors && !formData.clientId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewClientInput(true)}
                  className="shrink-0"
                  title="إضافة عميل جديد"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    placeholder="اسم العميل الجديد"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newClientName.trim()) {
                        handleAddNewClient()
                      }
                    }}
                    className={newClientInputError ? "border-red-500" : ""}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddNewClient}
                    disabled={!newClientName.trim()}
                    className="shrink-0"
                    title="حفظ العميل"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowNewClientInput(false)
                      setNewClientName("")
                    }}
                    className="shrink-0"
                    title="إلغاء"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {newClientInputError && (
                  <p className="text-xs text-red-500 mt-1">{newClientInputError}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center">
              نوع المشروع
              <span className="text-red-500 mr-1">*</span>
            </Label>
            {!showNewTypeInput ? (
              <div className="flex space-x-2 space-x-reverse">
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className={`flex-1 ${showValidationErrors && !formData.type.trim() ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Default types */}
                    <SelectItem value="سكني">سكني</SelectItem>
                    <SelectItem value="تجاري">تجاري</SelectItem>
                    <SelectItem value="صناعي">صناعي</SelectItem>
                    <SelectItem value="حكومي">حكومي</SelectItem>
                    
                    {/* Custom types from localStorage */}
                    {(() => {
                      const customTypes = JSON.parse(localStorage.getItem("projectTypes") || "[]")
                      return customTypes.map((type: string) => (
                        <div key={type} className="flex items-center justify-between px-2 py-1.5">
                          <SelectItem value={type} className="flex-1">{type}</SelectItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Remove from localStorage
                              const existingTypes = JSON.parse(localStorage.getItem("projectTypes") || "[]")
                              const updatedTypes = existingTypes.filter((t: string) => t !== type)
                              localStorage.setItem("projectTypes", JSON.stringify(updatedTypes))
                            }}
                            title="حذف نوع المشروع"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    })()}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewTypeInput(true)}
                  className="shrink-0"
                  title="إضافة نوع مشروع جديد"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    placeholder="نوع المشروع الجديد"
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newProjectType.trim()) {
                        handleAddNewProjectType()
                      }
                    }}
                    className={newTypeInputError ? "border-red-500" : ""}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddNewProjectType}
                    disabled={!newProjectType.trim()}
                    className="shrink-0"
                    title="حفظ نوع المشروع"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowNewTypeInput(false)
                      setNewProjectType("")
                    }}
                    className="shrink-0"
                    title="إلغاء"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {newTypeInputError && (
                  <p className="text-xs text-red-500 mt-1">{newTypeInputError}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned-engineer" className="flex items-center">
              المهندس المسؤول
              <span className="text-red-500 mr-1">*</span>
            </Label>
            {!showNewEngineerInput ? (
              <div className="flex space-x-2 space-x-reverse">
                <Select
                  value={formData.assignedEngineerId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedEngineerId: value }))}
                >
                  <SelectTrigger className={`flex-1 ${showValidationErrors && !formData.assignedEngineerId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="اختر المهندس" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.users
                      .filter((u) => u.role === "engineer" || u.role === "admin")
                      .map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span>{engineer.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {engineer.role === "admin" ? "مدير" : "مهندس"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {(hasPermission(state.currentUser?.role || "", "create", "users") || state.currentUser?.role === "engineer") && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewEngineerInput(true)}
                    className="shrink-0"
                    title="إضافة مهندس جديد"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    placeholder="اسم المهندس الجديد"
                    value={newEngineerName}
                    onChange={(e) => setNewEngineerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEngineerName.trim()) {
                        handleAddNewEngineer()
                      }
                    }}
                    className={newEngineerInputError ? "border-red-500" : ""}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddNewEngineer}
                    disabled={!newEngineerName.trim()}
                    className="shrink-0"
                    title="حفظ المهندس"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowNewEngineerInput(false)
                      setNewEngineerName("")
                    }}
                    className="shrink-0"
                    title="إلغاء"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {newEngineerInputError && (
                  <p className="text-xs text-red-500 mt-1">{newEngineerInputError}</p>
                )}
              </div>
            )}
          </div>
          {/* استبدل حقلي السعر الإجمالي والدفعة المقدمة ليكونا بمحاذاة علوية (top) بدلاً من bottom في نموذج إضافة مشروع جديد، وذلك بتغيير md:items-end إلى md:items-start في div الذي يحتوي الحقلين. */}
          <div className="md:col-span-2 flex flex-col md:flex-row md:items-start gap-4">
            {/* السعر الإجمالي */}
            <div className="flex-1 flex flex-col justify-stretch">
              <Label htmlFor="price" className="flex items-center mb-2">
                السعر الإجمالي
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <div className="relative flex-1 flex flex-col justify-end">
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || Number.parseFloat(value) >= 0) {
                      setFormData((prev) => ({ ...prev, price: value }))
                    }
                  }}
                  className={`pr-4 pl-16 mt-1 ${showValidationErrors && (!formData.price || Number.parseFloat(formData.price) <= 0) ? "border-red-500" : ""}`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                {showValidationErrors && (!formData.price || Number.parseFloat(formData.price) <= 0) && (
                  <p className="text-xs text-red-500">السعر الإجمالي مطلوب ويجب أن يكون أكبر من صفر</p>
                )}
                <div className="absolute top-0 bottom-0 left-3 flex items-center space-x-1 space-x-reverse pointer-events-none">
                  <span className="text-sm text-muted-foreground">ر.س</span>
                  <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                  <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 hidden dark:block" loading="lazy" />
                </div>
              </div>
            </div>
            {/* الدفعة المقدمة */}
            <div className="flex-1 flex flex-col justify-stretch">
              <div className="flex items-center justify-between">
                <Label htmlFor="down-payment" className="mb-2">الدفعة المقدمة</Label>
                {Number.parseFloat(formData.price) > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    الحد الأقصى: {Number.parseFloat(formData.price).toLocaleString()} ريال
                  </span>
                )}
              </div>
              <div className="relative flex-1 flex flex-col justify-end">
                <Input
                  id="down-payment"
                  type="number"
                  min="0"
                  max={Number.parseFloat(formData.price) || 0}
                  step="0.01"
                  placeholder="0.00"
                  value={formData.downPayment}
                  onChange={(e) => {
                    const value = e.target.value
                    const price = Number.parseFloat(formData.price) || 0
                    const downPayment = Number.parseFloat(value) || 0
                    if (value === "" || (downPayment >= 0 && downPayment <= price)) {
                      setFormData((prev) => ({ ...prev, downPayment: value }))
                    }
                  }}
                  className={`pr-4 pl-16 mt-1 ${Number.parseFloat(formData.downPayment) > Number.parseFloat(formData.price) ? "border-red-500" : ""}`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <div className="absolute top-0 bottom-0 left-3 flex items-center space-x-1 space-x-reverse pointer-events-none">
                  <span className="text-sm text-muted-foreground">ر.س</span>
                  <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                  <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 hidden dark:block" loading="lazy" />
                </div>
              </div>
              {Number.parseFloat(formData.downPayment) > Number.parseFloat(formData.price) && (
                <p className="text-xs text-red-500">الدفعة المقدمة لا يمكن أن تتجاوز السعر الإجمالي</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remaining-balance" className="mb-2">المبلغ المتبقي</Label>
            <div className="relative">
              <Input
                id="remaining-balance"
                type="number"
                value={remainingBalance.toFixed(2)}
                disabled
                className="bg-gray-100 pr-12"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 space-x-reverse">
                <span className="text-sm text-muted-foreground">ر.س</span>
                <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 hidden dark:block" loading="lazy" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="importance">الأهمية</Label>
            <Select
              value={formData.importance}
              onValueChange={(value: "low" | "medium" | "high") =>
                setFormData((prev) => ({ ...prev, importance: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الأهمية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">حالة المشروع</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "draft" | "in-progress" | "completed" | "canceled") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="canceled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-date">تاريخ البداية</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={formData.startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                placeholder="ميلادي"
              />
              <Input
                value={formData.startDate ? new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(formData.startDate)) : new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date())}
                disabled
                className="bg-gray-100"
                placeholder="هجري"
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">وصف المشروع</Label>
            <Textarea
              id="description"
              placeholder="وصف تفصيلي للمشروع"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        {showValidationErrors && missingFields.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">الحقول المطلوبة:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                  {field}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={() => {
            resetForm()
            onClose()
          }}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>
            حفظ المشروع
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const { addNotification } = useAppActions()
  const [formData, setFormData] = useState({
    client: "",
    amount: "",
    type: "income" as "income" | "expense",
    dueDate: "",
    description: "",
  })

  const handleSubmit = () => {
    if (!formData.client || !formData.amount || !formData.dueDate) {
      // إضافة إشعار خطأ
      addNotification({
        userId: state.currentUser?.id || "1",
        title: "خطأ في البيانات",
        message: "يرجى ملء جميع الحقول المطلوبة",
        type: "system",
        actionUrl: `/dashboard`,
        triggeredBy: state.currentUser?.id || "",
        isRead: false,
      })
      return
    }

    if (Number.parseFloat(formData.amount) <= 0) {
      addNotification({
        userId: state.currentUser?.id || "1",
        title: "خطأ في المبلغ",
        message: "يجب أن يكون المبلغ أكبر من صفر",
        type: "system",
        actionUrl: `/dashboard`,
        triggeredBy: state.currentUser?.id || "",
        isRead: false,
      })
      return
    }

    const newPayment = {
      id: Date.now().toString(),
      client: formData.client,
      amount: Number.parseFloat(formData.amount),
      type: formData.type,
      dueDate: formData.dueDate,
      status: "pending" as "pending" | "overdue",
      description: formData.description || `دفعة ${formData.client}`,
    }

    // إضافة الدفعة القادمة إلى state
    dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: newPayment })

    // إضافة إشعار نجاح
    addNotification({
      userId: "1",
      title: "دفعة قادمة جديدة",
      message: `تم إضافة دفعة قادمة لـ ${formData.client} بقيمة ${formData.amount} ريال`,
      type: "finance",
      actionUrl: `/finance`,
      triggeredBy: state.currentUser?.id || "",
      isRead: false,
    })

    // إعادة تعيين النموذج
    setFormData({
      client: "",
      amount: "",
      type: "income",
      dueDate: "",
      description: "",
    })

    onClose()
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
            <Label htmlFor="payment-client">العميل</Label>
            <Input
              id="payment-client"
              placeholder="اسم العميل"
              value={formData.client}
              onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">المبلغ</Label>
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
            <Label htmlFor="payment-type">نوع الدفعة</Label>
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
            <Label htmlFor="payment-due-date">تاريخ الاستحقاق</Label>
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

// Transaction Dialog Component
function TransactionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { addNotification } = useAppActions()
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    projectId: "",
    paymentMethod: "cash" as "cash" | "transfer" | "pos",
    transactionType: "other" as
      | "license"
      | "certificate"
      | "safety"
      | "consultation"
      | "design"
      | "supervision"
      | "other",
    importance: "medium" as "low" | "medium" | "high",
    status: "completed" as "completed" | "pending" | "draft" | "canceled",
  })

  const handleSubmit = () => {
    const project = state.projects.find((p) => p.id === formData.projectId)

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: formData.type,
      amount: Number(formData.amount),
      description: formData.description,
      projectId: formData.projectId || undefined,
      projectName: project?.name,
      clientId: project?.clientId,
      clientName: project?.client,
      category: getTransactionCategory(formData.transactionType),
      transactionType: formData.transactionType,
      importance: formData.importance,
      date: new Date().toISOString().split("T")[0],
      status: formData.status,
      createdBy: state.currentUser?.id || "",
      createdAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_TRANSACTION", payload: newTransaction })
    onClose()
  }

  const getTransactionCategory = (type: string) => {
    switch (type) {
      case "license":
        return "رخص"
      case "certificate":
        return "شهادات"
      case "safety":
        return "سلامة"
      case "consultation":
        return "استشارات"
      case "design":
        return "تصميم"
      case "supervision":
        return "إشراف"
      default:
        return "أخرى"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة معاملة مالية جديدة</DialogTitle>
          <DialogDescription>قم بإدخال تفاصيل المعاملة المالية</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-type">نوع المعاملة</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "income" | "expense") => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">دخل</SelectItem>
                <SelectItem value="expense">مصروف</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-method">طريقة الدفع</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: "cash" | "transfer" | "pos") =>
                setFormData((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="transfer">تحويل</SelectItem>
                <SelectItem value="pos">شبكة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-category">نوع المعاملة</Label>
            <Select
              value={formData.transactionType}
              onValueChange={(value: typeof formData.transactionType) =>
                setFormData((prev) => ({ ...prev, transactionType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">رخصة إنشاء</SelectItem>
                <SelectItem value="certificate">شهادة إشغال</SelectItem>
                <SelectItem value="safety">مخطط سلامة</SelectItem>
                <SelectItem value="consultation">استشارة هندسية</SelectItem>
                <SelectItem value="design">تصميم</SelectItem>
                <SelectItem value="supervision">إشراف</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="transaction-description">الوصف</Label>
            <Input
              id="transaction-description"
              placeholder="وصف المعاملة"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="related-project">المشروع المرتبط</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المشروع (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                {state.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="importance">الأهمية</Label>
            <Select
              value={formData.importance}
              onValueChange={(value: "low" | "medium" | "high") =>
                setFormData((prev) => ({ ...prev, importance: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الأهمية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-status">الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value: typeof formData.status) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="pending">معلقة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="canceled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              // تحويل المعاملة إلى دفعة قادمة
              const project = state.projects.find((p) => p.id === formData.projectId)
              
              const newPayment = {
                id: Date.now().toString(),
                client: project?.client || formData.description,
                amount: Number(formData.amount),
                type: formData.type,
                dueDate: new Date().toISOString().split("T")[0], // تاريخ اليوم كتاريخ استحقاق افتراضي
                status: "pending" as "pending" | "overdue",
                description: formData.description,
              }

              dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: newPayment })
              
              addNotification({
                userId: "1",
                title: "تحويل معاملة إلى دفعة قادمة",
                message: `تم تحويل المعاملة "${formData.description}" إلى دفعة قادمة`,
                type: "finance",
                actionUrl: `/finance`,
                triggeredBy: state.currentUser?.id || "",
                isRead: false,
              })

              onClose()
            }}
          >
            تحويل إلى دفعة قادمة
          </Button>
          <Button onClick={handleSubmit}>حفظ المعاملة</Button>
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
  const { addNotification, createProjectWithDownPayment, markNotificationAsRead, deleteNotification } = useAppActions()
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

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
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

  const quickActions = [
    {
      title: "إضافة مشروع جديد",
      description: "إنشاء مشروع جديد وربطه بعميل",
      icon: Building,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => setIsProjectDialogOpen(true),
    },
    {
      title: "إضافة عميل جديد",
      description: "تسجيل عميل جديد في النظام",
      icon: UserPlus,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => setIsClientDialogOpen(true),
    },
    {
      title: "تسجيل معاملة مالية",
      description: "إضافة دخل أو مصروف جديد",
      icon: Receipt,
      color: "bg-yellow-600 hover:bg-yellow-700",
      onClick: () => setIsTransactionDialogOpen(true),
    },
    {
      title: "إضافة دفعة قادمة",
      description: "تسجيل دفعة قادمة أو مصروف متوقع",
      icon: Calendar,
      color: "bg-orange-600 hover:bg-orange-700",
      onClick: () => setIsUpcomingPaymentDialogOpen(true),
    },
    {
      title: "إضافة مهمة جديدة",
      description: "تعيين مهمة لأحد أعضاء الفريق",
      icon: CheckCircle,
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: () => {
        setDefaultTaskForm({
          assigneeId: currentUser?.id || "",
          dueDate: new Date().toISOString().split("T")[0],
        });
        setIsTaskDialogOpen(true);
      },
    },

    {
      title: "إعدادات النظام",
      description: "إدارة المستخدمين وإعدادات المكتب",
      icon: Settings,
      color: "bg-gray-600 hover:bg-gray-700",
      onClick: () => router.push("/settings"),
    },
  ]

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <ProjectDialog open={isProjectDialogOpen} onClose={() => setIsProjectDialogOpen(false)} />
      <ClientDialog open={isClientDialogOpen} onClose={() => setIsClientDialogOpen(false)} />
      <TransactionDialog open={isTransactionDialogOpen} onClose={() => setIsTransactionDialogOpen(false)} />
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
                        <span className="font-medium">₪ {selectedProject.price.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الدفعة المقدمة:</span>
                        <span className="text-green-600">₪ {selectedProject.downPayment.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
<img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 hidden dark:block" loading="lazy" /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ المتبقي:</span>
                        <span className="text-red-600">₪ {selectedProject.remainingBalance.toLocaleString()}<img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 ml-1 block dark:hidden" loading="lazy" />
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
          <TaskForm onClose={() => setIsTaskDialogOpen(false)} defaultAssigneeId={defaultTaskForm.assigneeId} defaultDueDate={defaultTaskForm.dueDate} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
