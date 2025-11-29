"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Building,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { realtimeUpdates, useRealtimeUpdatesByType } from "@/lib/realtime-updates"
import { hasPermission } from "@/lib/auth"
import type { Project, TaskType, Transaction } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { ArabicNumber } from "@/components/ui/ArabicNumber"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { DeleteConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { LoadingStates } from "@/components/ui/loading-skeleton"
import { transliterateArabicToEnglish } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { logger } from "@/lib/logger"
import { api } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

export default function ProjectsPage() {
  return (
    <PermissionGuard requiredPermission="view_projects" requiredAction="view" requiredModule="projects" moduleName="صفحة المشاريع">
      <ProjectsPageContent />
    </PermissionGuard>
  )
}

function ProjectsPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, createProjectWithDownPayment, updateProjectWithDownPayment, deleteProject, createClient, showSuccessToast } = useAppActions()
  const { currentUser, projects, clients, users, tasks } = state
  const { toast } = useToast()

  // استقبال التحديثات الحية
  const projectUpdates = useRealtimeUpdatesByType('project')
  const userUpdates = useRealtimeUpdatesByType('user')

  const handledProjectUpdateIdsRef = useRef<Set<string>>(new Set());

  // تحديث البيانات عند استقبال تحديثات حية
  useEffect(() => {
    if (projectUpdates.length > 0) {
      const lastUpdate = projectUpdates[projectUpdates.length - 1];
      if (!lastUpdate || !(lastUpdate as any).project) return;
      const updateId = `${(lastUpdate as any).project.id || ''}_${(lastUpdate as any).action}_${(lastUpdate as any).timestamp || ''}`;
      if (handledProjectUpdateIdsRef.current.has(updateId)) return;
      handledProjectUpdateIdsRef.current.add(updateId);

      logger.debug('=== PROJECT UPDATE RECEIVED ===', { lastUpdate, projectsCount: state.projects.length }, 'PROJECTS');

      if ((lastUpdate as any).action === 'create') {
        const exists = state.projects.some(p => p.id === (lastUpdate as any).project.id);
        logger.debug('Project exists in state', { exists, projectId: (lastUpdate as any).project.id }, 'PROJECTS');
        if (!exists) {
          logger.debug('Adding project to state', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
          dispatch({ type: "ADD_PROJECT", payload: (lastUpdate as any).project });
          logger.debug('Project added to state successfully', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
        }
      } else if ((lastUpdate as any).action === 'update') {
        logger.debug('Updating project in state', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
        dispatch({ type: "UPDATE_PROJECT", payload: (lastUpdate as any).project });
        logger.debug('Project updated in state successfully', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
      } else if ((lastUpdate as any).action === 'delete') {
        logger.debug('Deleting project from state', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
        dispatch({ type: "DELETE_PROJECT", payload: (lastUpdate as any).project.id });
        logger.debug('Project deleted from state successfully', { projectId: (lastUpdate as any).project.id }, 'PROJECTS');
      }

      if ((lastUpdate as any).userId && (lastUpdate as any).userId !== currentUser?.id && (lastUpdate as any).userName) {
        toast({
          title: "تحديث مشروع جديد",
          description: `تمت إضافة/تعديل/حذف مشروع بواسطة ${(lastUpdate as any).userName}`
        });
      }
    }
  }, [projectUpdates, dispatch, state.projects, currentUser, toast]);

  useEffect(() => {
    if (userUpdates.length > 0) {
      const lastUpdate = userUpdates[userUpdates.length - 1]
      if (lastUpdate.action === 'create') {
        // تحقق إذا كان المستخدم موجود مسبقاً بناءً على id أو email
        const exists = state.users.some(u => u.id === lastUpdate.user.id || u.email === lastUpdate.user.email)
        if (!exists) {
          dispatch({ type: "ADD_USER", payload: lastUpdate.user })
        }
      } else if (lastUpdate.action === 'update') {
        dispatch({ type: "UPDATE_USER", payload: lastUpdate.user })
      } else if (lastUpdate.action === 'delete') {
        dispatch({ type: "DELETE_USER", payload: lastUpdate.user.id })
      }
    }
  }, [userUpdates, dispatch, state.users])

  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get("filter")
  const clientParam = searchParams.get("client")
  const clientNameParam = searchParams.get("clientName")
  const actionParam = searchParams.get("action")

  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState(filterParam || "in-progress")
  const [isDialogOpen, setIsDialogOpen] = useState(actionParam === "create")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string>("")
  const [updateSuccessDialogOpen, setUpdateSuccessDialogOpen] = useState(false)

  // States for inline inputs
  const [showNewClientInput, setShowNewClientInput] = useState(false)
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [showNewEngineerInput, setShowNewEngineerInput] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newProjectType, setNewProjectType] = useState("")
  const [newEngineerName, setNewEngineerName] = useState("")
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [newClientInputError, setNewClientInputError] = useState("");
  const [newTypeInputError, setNewTypeInputError] = useState("");
  const [newEngineerInputError, setNewEngineerInputError] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<{ typeId: string; assigneeId: string }[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    type: "",
    price: "",
    downPayment: "0",
    team: [] as string[], // فريق العمل
    importance: "medium" as "low" | "medium" | "high",
    status: "in-progress" as "draft" | "in-progress" | "completed" | "canceled",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
  })

  const memoizedProjects = useMemo(() => {
    let filtered = projects

    // Filter by client if specified in URL
    if (clientParam) {
      filtered = filtered.filter((project) => project.clientId === clientParam)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.client.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((project) => project.status === filterStatus)
    }

    // Filter by user role - جميع المستخدمين يرون جميع المشاريع طالما لديهم صلاحية العرض
    // لا يتم فلترة المشاريع حسب المستخدم، فقط حسب الصلاحيات

    return filtered
  }, [projects, searchTerm, filterStatus, currentUser, clientParam])

  useEffect(() => {
    setFilteredProjects(memoizedProjects)
  }, [memoizedProjects])

  // Show loading skeleton if data is loading
  if (state.isLoading || state.loadingStates.projects) {
    return LoadingStates.projects(9)
  }

  // تحديث getStatusColor لإرجاع variant أو className مخصص
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      case "new":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-progress":
        return "قيد التنفيذ"
      case "completed":
        return "مكتمل"
      case "draft":
        return "مسودة"
      case "canceled":
        return "ملغي"
      default:
        return status
    }
  }

  const handleCreateProject = async () => {
    if (showNewClientInput || showNewTypeInput || showNewEngineerInput) {
      return;
    }
    if (!hasPermission(currentUser?.role || "", "create", "projects")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء المشاريع" });
      return;
    }

    // منع الحفظ المتكرر
    if (state.loadingStates.projects) {
      return;
    }

    const missing: string[] = [];
    if (!formData.name.trim()) missing.push("اسم المشروع");
    if (!formData.clientId) missing.push("العميل");
    if (!formData.type) missing.push("نوع المشروع");
    if (formData.team.length === 0) missing.push("المهندس المسؤول");
    if (!formData.price) missing.push("السعر الإجمالي");
    // تحقق من المهام المختارة فقط إذا كانت موجودة
    if (selectedTasks.length > 0 && selectedTasks.some(t => !t.assigneeId)) {
      missing.push("يجب اختيار مسؤول لكل مهمة مختارة");
    }
    if (missing.length > 0) {
      setShowValidationErrors(true);
      setMissingFields(missing);
      return;
    }
    setMissingFields([]);

    const client = clients.find(c => c.id === formData.clientId)
    // قائد الفريق هو أول مهندس في الفريق
    const assignedEngineerId = formData.team[0] || "";
    const engineer = users.find(u => u.id === assignedEngineerId)

    // Parse numeric values safely
    const price = formData.price ? parseFloat(formData.price.toString()) : 0;
    const downPayment = formData.downPayment ? parseFloat(formData.downPayment.toString()) : 0;
    const remainingBalance = price - downPayment;

    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      client: client?.name || "",
      clientId: formData.clientId,
      type: formData.type,
      status: formData.status,
      team: formData.team,
      startDate: formData.startDate,
      price: price,
      downPayment: downPayment,
      remainingBalance: remainingBalance,
      assignedEngineerId,
      assignedEngineerName: engineer?.name || "",
      importance: formData.importance,
      description: formData.description,
      progress: 0,
      createdBy: currentUser?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Prepare tasks for backend
    const tasks = selectedTasks.map(t => {
      const type = taskTypes.find(tt => tt.id === t.typeId);
      const user = users.find(u => u.id === t.assigneeId);
      return {
        typeId: t.typeId,
        assigneeId: t.assigneeId,
        assigneeName: user?.name || '',
        typeName: type?.name || '',
        typeDescription: type?.description || ''
      };
    });

    try {
      // تعيين حالة التحميل لمنع الحفظ المتكرر
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'projects', value: true } });

      console.log('بيانات المشروع المرسلة للسيرفر:', { project: newProject, tasks, createdByName: currentUser?.name || '' });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          project: newProject,
          tasks,
          createdByName: currentUser?.name || ''
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        dispatch({ type: "ADD_PROJECT", payload: data.data });

        // إنشاء معاملة مالية للدفعة المقدمة إذا كانت موجودة
        if (downPayment > 0) {
          const downPaymentTransaction: Transaction = {
            id: Date.now().toString() + "_dp",
            type: "income",
            amount: downPayment,
            description: `دفعة مقدمة - مشروع ${newProject.name}`,
            clientId: newProject.clientId,
            clientName: newProject.client,
            projectId: newProject.id,
            projectName: newProject.name,
            category: "دفعة مقدمة",
            transactionType: "design",
            importance: newProject.importance,
            paymentMethod: "transfer",
            date: newProject.startDate,
            status: "completed",
            createdBy: currentUser?.id || "",
            createdAt: new Date().toISOString(),
          }

          // حفظ المعاملة المالية في قاعدة البيانات
          try {
            const transactionResponse = await fetch(`${apiUrl}/api/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify(downPaymentTransaction),
            });

            if (transactionResponse.ok) {
              const transactionData = await transactionResponse.json();
              if (transactionData.success) {
                dispatch({ type: "ADD_TRANSACTION", payload: transactionData.data || downPaymentTransaction });
                showSuccessToast("تم إنشاء المشروع والمعاملة المالية بنجاح", `تم إنشاء مشروع "${data.data.name}" مع دفعة مقدمة ${downPayment} ريال`);
              } else {
                showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء المشروع "${data.data.name}" بنجاح`);
              }
            } else {
              showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء المشروع "${data.data.name}" بنجاح`);
            }
          } catch (transactionError) {
            console.error('خطأ في إنشاء المعاملة المالية:', transactionError);
            showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء المشروع "${data.data.name}" بنجاح`);
          }
        } else {
          showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء المشروع "${data.data.name}" بنجاح`);
        }

        setIsDialogOpen(false);
        resetForm();
        setSelectedTasks([]);
      } else {
        console.error('خطأ من السيرفر عند حفظ المشروع:', data.error);
        setAlert({ type: "error", message: data.error || "فشل حفظ المشروع في قاعدة البيانات" });
      }
    } catch (error) {
      console.error('خطأ أثناء حفظ المشروع:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء حفظ المشروع في قاعدة البيانات: " + (error?.message || error) });
    } finally {
      // إزالة حالة التحميل
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'projects', value: false } });
    }
  }

  const handleUpdateProject = async () => {
    if (showNewClientInput || showNewTypeInput || showNewEngineerInput) {
      return;
    }
    if (!editingProject || !hasPermission(currentUser?.role || "", "edit", "projects")) {
      addNotification({
        userId: currentUser?.id || "",
        title: "خطأ في تحديث المشروع",
        message: "ليس لديك صلاحية لتعديل المشاريع",
        type: "system",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
      return
    }

    const client = clients.find(c => c.id === formData.clientId)
    // قائد الفريق هو أول مهندس في الفريق
    const assignedEngineerId = formData.team[0] || "";
    const engineer = users.find(u => u.id === assignedEngineerId)

    // Parse numeric values safely
    const price = formData.price ? parseFloat(formData.price.toString()) : 0;
    const downPayment = formData.downPayment ? parseFloat(formData.downPayment.toString()) : 0;
    const remainingBalance = price - downPayment;

    const updatedProject: Project = {
      ...editingProject,
      name: formData.name,
      client: client?.name || "",
      clientId: formData.clientId,
      type: formData.type,
      status: formData.status,
      team: formData.team,
      startDate: formData.startDate,
      price: price,
      downPayment: downPayment,
      remainingBalance: remainingBalance,
      assignedEngineerId,
      assignedEngineerName: engineer?.name || "",
      importance: formData.importance,
      description: formData.description,
      updatedAt: new Date().toISOString(),
    }

    try {
      // Save to backend database via Backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          ...updatedProject,
          updatedBy: currentUser?.id,
          updatedByName: currentUser?.name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project in database');
      }

      const result = await response.json();
      logger.info('Project updated in database via Backend API', { result }, 'PROJECTS');

      // Update local state
      dispatch({ type: "UPDATE_PROJECT", payload: updatedProject })

      // Update in localStorage
      const existingProjects = JSON.parse(localStorage.getItem("projects") || "[]")
      const updatedProjects = existingProjects.map((p: any) => p.id === editingProject.id ? updatedProject : p)
      localStorage.setItem("projects", JSON.stringify(updatedProjects))

      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendProjectUpdate({ action: 'update', project: updatedProject, userId: currentUser?.id, userName: currentUser?.name })

      setIsDialogOpen(false)
      setEditingProject(null)
      resetForm()

      // Add notification to assigned engineer if changed
      if (engineer && engineer.id !== currentUser?.id && engineer.id !== editingProject.assignedEngineerId) {
        // البحث عن المستخدم المسؤول في قائمة المستخدمين
        const assignee = users.find(u =>
          u._id === engineer.id ||
          u.id === engineer.id ||
          u.email === engineer.email
        );

        if (assignee) {
          addNotification({
            userId: assignee._id || assignee.id,
            title: "تم تعيين مشروع لك",
            message: `تم تعيين مشروع "${formData.name}" لك`,
            type: "project",
            actionUrl: `/projects/${updatedProject.id}`,
            triggeredBy: currentUser?.id || "",
            isRead: false,
          })

          // إرسال تحديث فوري للمهندس الجديد
          try {
            if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
              const realtimeUpdates = (window as any).realtimeUpdates;
              if (realtimeUpdates.sendUpdate && typeof realtimeUpdates.sendUpdate === 'function') {
                realtimeUpdates.sendUpdate('notification', 'create', {
                  userId: assignee._id || assignee.id,
                  title: "تم تعيين مشروع لك",
                  message: `تم تعيين مشروع "${formData.name}" لك`,
                  type: "project",
                  actionUrl: `/projects/${updatedProject.id}`,
                  triggeredBy: currentUser?.id || "",
                  isRead: false,
                });
              }
            }
          } catch (error) {
            console.error('Error broadcasting project notification:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث المشروع في قاعدة البيانات" });
    }

    // داخل handleUpdateProject بعد setEditingProject(null) مباشرة
    notifyProjectTeam({
      team: formData.team,
      currentUser,
      users,
      addNotification,
      projectName: formData.name,
      projectId: editingProject.id,
      action: 'update',
      actorName: currentUser?.name || '',
    });
  }

  const handleDeleteProject = (projectId: string) => {
    if (!hasPermission(currentUser?.role || "", "delete", "projects")) {
      addNotification({
        userId: currentUser?.id || "",
        title: "خطأ في حذف المشروع",
        message: "ليس لديك صلاحية لحذف المشاريع",
        type: "system",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
      return
    }

    setProjectToDelete(projectId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return

    try {
      setDeleteError("")
      const project = projects.find(p => p.id === projectToDelete)

      if (!project) {
        setDeleteError("المشروع غير موجود")
        return
      }

      // منع الحفظ المتكرر
      if (state.loadingStates.projects) {
        return;
      }

      // تعيين حالة التحميل
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'projects', value: true } });

      // Delete from backend database via Backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/projects/${projectToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deletedBy: currentUser?.id,
          deletedByName: currentUser?.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete project from database');
      }

      const result = await response.json();
      logger.info('Project deleted from database via Backend API', { result }, 'PROJECTS');

      // حذف المهام المرتبطة بالمشروع
      const projectTasks = state.tasks.filter(task => task.projectId === projectToDelete);

      if (projectTasks.length > 0) {
        console.log(`حذف ${projectTasks.length} مهمة مرتبطة بالمشروع "${project.name}"`);

        // حذف المهام من قاعدة البيانات
        for (const task of projectTasks) {
          try {
            const taskResponse = await fetch(`${apiUrl}/api/tasks/${task.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                deletedBy: currentUser?.id,
                deletedByName: currentUser?.name,
                reason: `حذف تلقائي بسبب حذف المشروع "${project.name}"`
              })
            });

            if (taskResponse.ok) {
              console.log(`تم حذف المهمة "${task.title}" من قاعدة البيانات`);
            } else {
              console.error(`فشل في حذف المهمة "${task.title}" من قاعدة البيانات`);
            }
          } catch (taskError) {
            console.error(`خطأ في حذف المهمة "${task.title}":`, taskError);
          }
        }

        // حذف المهام من الواجهة الأمامية
        projectTasks.forEach(task => {
          dispatch({ type: "DELETE_TASK", payload: task.id });
        });

        // إرسال تحديث فوري لحذف المهام
        if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
          projectTasks.forEach(task => {
            (window as any).realtimeUpdates.sendTaskUpdate({
              action: 'delete',
              task: task,
              userId: currentUser?.id,
              userName: currentUser?.name
            });
          });
        }

        // إشعار المسؤولين عن المهام المحذوفة
        projectTasks.forEach(task => {
          if (task.assigneeId && task.assigneeId !== currentUser?.id) {
            const assignee = users.find(u => u.id === task.assigneeId);
            if (assignee) {
              addNotification({
                userId: assignee.id,
                title: "تم حذف مهمة كنت مسؤول عنها",
                message: `تم حذف مهمة "${task.title}" تلقائياً بسبب حذف المشروع "${project.name}"`,
                type: "task",
                triggeredBy: currentUser?.id || "",
                isRead: false,
              });
            }
          }
        });
      }

      // Update local state
      dispatch({ type: "DELETE_PROJECT", payload: projectToDelete })

      // Remove from localStorage
      const existingProjects = JSON.parse(localStorage.getItem("projects") || "[]")
      const filteredProjects = existingProjects.filter((p: any) => p.id !== projectToDelete)
      localStorage.setItem("projects", JSON.stringify(filteredProjects))

      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendProjectUpdate({ action: 'delete', project: project, userId: currentUser?.id, userName: currentUser?.name })

      // إشعار أعضاء الفريق بعد نجاح الحذف
      if (project && Array.isArray(project.team)) {
        project.team.forEach((engineerId: string) => {
          if (engineerId !== currentUser?.id) {
            const eng = users.find(u => u.id === engineerId || u._id === engineerId);
            if (eng) {
              addNotification({
                userId: eng._id || eng.id,
                title: "تم حذف مشروع كنت مسؤول عنه",
                message: `تم حذف مشروع \"${project.name}\" بواسطة ${currentUser?.name}`,
                type: "project",
                triggeredBy: currentUser?.id || "",
                isRead: false,
              });
              logger.info(`تم إشعار ${eng.name} بحذف المشروع`, { engineerId, engineerName: eng.name }, 'PROJECTS');
            }
          }
        });
      }

      // إظهار رسالة نجاح مع عدد المهام المحذوفة
      if (projectTasks.length > 0) {
        showSuccessToast(
          "تم حذف المشروع والمهام المرتبطة به بنجاح",
          `تم حذف مشروع "${project.name}" مع ${projectTasks.length} مهمة مرتبطة به`
        );
      } else {
        showSuccessToast(
          "تم حذف المشروع بنجاح",
          `تم حذف مشروع "${project.name}" بنجاح`
        );
      }

      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      setDeleteError("")
    } catch (error) {
      console.error('Error deleting project:', error);
      setDeleteError("حدث خطأ أثناء حذف المشروع من قاعدة البيانات")
    } finally {
      // إزالة حالة التحميل
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'projects', value: false } });
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      clientId: project.clientId,
      type: project.type,
      price: project.price.toString(),
      downPayment: project.downPayment.toString(),
      team: project.team,
      importance: project.importance,
      status: project.status,
      description: project.description,
      startDate: project.startDate,
    })
    setShowValidationErrors(false)
    setIsDialogOpen(true)
  }

  const openDetailsDialog = (project: Project) => {
    setSelectedProject(project)
    setIsDetailsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      clientId: "",
      type: "",
      price: "",
      downPayment: "0",
      team: [],
      importance: "medium",
      status: "in-progress",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
    })

    // Reset all inline inputs
    setShowNewClientInput(false)
    setShowNewTypeInput(false)
    setShowNewEngineerInput(false)
    setNewClientName("")
    setNewProjectType("")
    setNewEngineerName("")
    setShowValidationErrors(false)
    setNewClientPhone("")
  }

  const canCreateProject = hasPermission(currentUser?.role || "", "create", "projects")
  const canEditProject = hasPermission(currentUser?.role || "", "edit", "projects")
  const canDeleteProject = hasPermission(currentUser?.role || "", "delete", "projects")

  const remainingBalance = Number.parseFloat(formData.price) - (Number.parseFloat(formData.downPayment) || 0)

  // Handle adding new client
  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      setNewClientInputError("يرجى إدخال اسم العميل الجديد");
      return;
    }
    setNewClientInputError("");
    const newClient = {
      id: Date.now().toString(),
      name: newClientName.trim(),
      email: "",
      phone: newClientPhone.trim() || "", // غير إلزامي
      address: "",
      projectsCount: 0,
      totalValue: 0,
      lastContact: new Date().toISOString(),
      status: "active" as const,
      createdAt: new Date().toISOString(),
    };
    try {
      // استخدام وظيفة AppContext
      await createClient(newClient);
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
      // Add notification to all users except the creator
      users.forEach(user => {
        if (user.id !== currentUser?.id) {
          addNotification({
            userId: user.id,
            title: "تم إضافة عميل جديد",
            message: `تم إضافة العميل \"${newClient.name}\" بواسطة ${currentUser?.name}`,
            type: "project",
            isRead: false,
            triggeredBy: currentUser?.id || "",
          });
        }
      });
      setShowNewClientInput(false);
      setNewClientName("");
      setNewClientPhone("");
    } catch (error) {
      setNewClientInputError("حدث خطأ أثناء حفظ العميل في قاعدة البيانات");
    }
  };

  // Handle adding new project type
  const handleAddNewProjectType = () => {
    if (!newProjectType.trim()) {
      setNewTypeInputError("يرجى إدخال نوع المشروع الجديد");
      return;
    }
    setNewTypeInputError("");
    // Update form data with new type
    setFormData(prev => ({ ...prev, type: newProjectType.trim() }))

    // Save project types to localStorage
    const existingTypes = JSON.parse(localStorage.getItem("projectTypes") || "[]")
    if (!existingTypes.includes(newProjectType.trim())) {
      existingTypes.push(newProjectType.trim())
      localStorage.setItem("projectTypes", JSON.stringify(existingTypes))
    }

    // Add notification to admin
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1", // Admin user ID
        title: "تم إضافة نوع مشروع جديد",
        message: `تم إضافة نوع المشروع "${newProjectType.trim()}" بواسطة ${currentUser?.name}`,
        type: "project",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
    }

    // Reset input
    setShowNewTypeInput(false)
    setNewProjectType("")
  }

  // Handle deleting project type
  const handleDeleteProjectType = (typeToDelete: string) => {
    // Check if type is being used in any project
    const isTypeInUse = projects.some(project => project.type === typeToDelete)

    if (isTypeInUse) {
      setAlert({ type: "error", message: "لا يمكن حذف هذا النوع لأنه مستخدم في مشاريع حالية" })
      return
    }

    // Remove from localStorage
    const existingTypes = JSON.parse(localStorage.getItem("projectTypes") || "[]")
    const updatedTypes = existingTypes.filter((type: string) => type !== typeToDelete)
    localStorage.setItem("projectTypes", JSON.stringify(updatedTypes))

    setAlert({ type: "success", message: "تم حذف نوع المشروع بنجاح" })
  }

  // Handle adding new engineer
  const handleAddNewEngineer = async () => {
    if (!newEngineerName.trim()) {
      setNewEngineerInputError("يرجى إدخال اسم المهندس الجديد");
      return;
    }
    setNewEngineerInputError("");
    // Check if user has permission to add engineers (only engineers and managers can add engineers)
    if (!hasPermission(currentUser?.role || "", "create", "users") && currentUser?.role !== "engineer") {
      setAlert({ type: "error", message: "فقط المهندسون والمديرون يمكنهم إضافة مهندسين جدد" })
      return
    }

    if (newEngineerName.trim()) {
      // Generate email and password based on name
      const nameParts = newEngineerName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''

      // Create email: first letter of first name + last name + @newcorner.sa
      const emailPrefix = transliterateArabicToEnglish(firstName.charAt(0) + lastName).toLowerCase();
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
      const defaultPassword = transliterateArabicToEnglish(`${firstName.charAt(0)}${lastName}123`).toLowerCase();

      const newEngineer = {
        id: Date.now().toString(),
        name: newEngineerName.trim(),
        email: finalEmail,
        password: defaultPassword,
        role: "engineer" as const,
        avatar: "",
        phone: "",
        isActive: true,
        monthlySalary: 5000, // مرتب مبدئي 5000 ريال
        createdAt: new Date().toISOString(),
      }

      try {
        // Save to backend database
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEngineer),
        });

        if (!response.ok) {
          throw new Error('Failed to save engineer to database');
        }

        const result = await response.json();
        logger.info('Engineer saved to database', { result }, 'PROJECTS');

        // Add to users list
        dispatch({ type: "ADD_USER", payload: newEngineer })

        // Save to localStorage
        existingUsers.push(newEngineer)
        localStorage.setItem("users", JSON.stringify(existingUsers))

        // إرسال تحديث فوري
        realtimeUpdates.sendUserUpdate({ action: 'create', user: newEngineer })
      } catch (error) {
        console.error('Error creating engineer:', error);
        setNewEngineerInputError("حدث خطأ أثناء حفظ المهندس في قاعدة البيانات");
        return;
      }

      // Update form data
      setFormData(prev => ({ ...prev, team: [...prev.team, newEngineer.id] }))

      // Add notification
      addNotification({
        userId: currentUser?.id || "",
        title: "تم إضافة مهندس جديد",
        message: `تم إضافة المهندس "${newEngineer.name}" بنجاح. الإيميل: ${finalEmail}، كلمة المرور: ${defaultPassword}`,
        type: "project",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })

      // Reset input
      setShowNewEngineerInput(false)
      setNewEngineerName("")
    }
  }

  useEffect(() => {
    // Fetch task types from API
    api.taskTypes.getAll().then((res) => {
      if (res.success && Array.isArray(res.data)) setTaskTypes(res.data);
    });
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <style jsx global>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        input[type="number"] {
          -moz-appearance: textfield !important;
        }
        input[type="number"]::-ms-clear,
        input[type="number"]::-ms-expand {
          display: none !important;
        }
      `}</style>
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
            {clientParam && clientNameParam
              ? `مشاريع ${decodeURIComponent(clientNameParam)}`
              : "إدارة المشاريع"
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            {clientParam && clientNameParam
              ? `مشاريع العميل ${decodeURIComponent(clientNameParam)}`
              : "إدارة ومتابعة المشاريع الحالية والسابقة"
            }
          </p>
          {clientParam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/projects")}
              className="mt-2"
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء الفلترة
            </Button>
          )}
        </div>
        {canCreateProject && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="self-end"
                onClick={() => {
                  setEditingProject(null)
                  setShowValidationErrors(false)
                  resetForm()
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "تعديل المشروع" : "إضافة مشروع جديد"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "قم بتعديل تفاصيل المشروع" : "قم بإدخال تفاصيل المشروع الجديد"}
                </DialogDescription>
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
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span>{client.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  عميل
                                </Badge>
                              </div>
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
                            setNewClientPhone("")
                          }}
                          className="shrink-0"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* حقل رقم العميل */}
                      <Input
                        placeholder="رقم العميل (05xxxxxxxx)"
                        value={newClientPhone}
                        onChange={(e) => {
                          // فقط أرقام وتبدأ بـ 05 وطولها 10
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          setNewClientPhone(value);
                        }}
                        type="tel"
                        maxLength={10}
                        pattern="05[0-9]{8}"
                        className="w-full"
                      />
                      {newClientPhone && !/^05[0-9]{8}$/.test(newClientPhone) && (
                        <p className="text-xs text-red-500 mt-1">رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</p>
                      )}
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
                                    handleDeleteProjectType(type)
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
                  <Label htmlFor="team" className="flex items-center">
                    فريق العمل (يمكن اختيار أكثر من مهندس)
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.team.length > 0
                          ? users.filter(u => formData.team.includes(u.id)).map(u => u.name).join("، ")
                          : "اختر المهندسين المشاركين"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-60 overflow-y-auto w-64">
                      {users
                        .filter((u) => u.role === "engineer" || u.role === "admin")
                        .filter((user, index, self) =>
                          // إزالة التكرار بناءً على المعرف
                          index === self.findIndex(u => u.id === user.id)
                        )
                        .map((engineer) => (
                          <DropdownMenuCheckboxItem
                            key={engineer.id}
                            checked={formData.team.includes(engineer.id)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => {
                                let newTeam = prev.team.includes(engineer.id)
                                  ? prev.team.filter((id) => id !== engineer.id)
                                  : [...prev.team, engineer.id];
                                return { ...prev, team: newTeam };
                              });
                            }}
                          >
                            {engineer.name}
                            {formData.team[0] === engineer.id && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 ml-2">قائد المشروع</Badge>
                            )}
                          </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground mt-1">أول مهندس يتم اختياره هو قائد المشروع تلقائيًا.</p>
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
                <div className="space-y-2 md:col-span-2">
                  <Label>المهام الافتراضية للمشروع</Label>
                  <div className="border rounded p-4 bg-muted w-full">
                    <div className="mb-3 text-xs text-muted-foreground">اختر أنواع المهام وحدد المسؤول عن كل مهمة (اختياري)</div>
                    {taskTypes.length === 0 ? (
                      <div className="text-xs text-muted-foreground">لا توجد أنواع مهام متاحة</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {taskTypes.map((type) => {
                          const isSelected = selectedTasks.some((t) => t.typeId === type._id);
                          const selectedTask = selectedTasks.find((t) => t.typeId === type._id);

                          return (
                            <div key={type._id} className="flex items-center gap-3 p-3 border rounded bg-background hover:bg-muted/50 transition-colors w-full">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTasks((prev) => [...prev, { typeId: type._id, assigneeId: '' }]);
                                  } else {
                                    setSelectedTasks((prev) => prev.filter((t) => t.typeId !== type._id));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium flex-1">{type.name}</span>
                              {isSelected && (
                                <Select
                                  value={selectedTask?.assigneeId || ''}
                                  onValueChange={(value) => {
                                    setSelectedTasks((prev) =>
                                      prev.map((t) =>
                                        t.typeId === type._id ? { ...t, assigneeId: value } : t
                                      )
                                    );
                                  }}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue placeholder="اختر المسؤول" />
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={editingProject ? handleUpdateProject : handleCreateProject}>
                  {editingProject ? "تحديث المشروع" : "حفظ المشروع"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المشاريع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="canceled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <SwipeToDelete
            key={project.id}
            onDelete={() => handleDeleteProject(project.id)}
          >
            <Card
              className="hover:shadow-lg transition-shadow bg-card text-card-foreground border border-border relative group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg leading-tight truncate text-foreground">{project.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{project.type}</Badge>
                      <Badge className={`text-xs ${getStatusColor(project.status)}`}>{getStatusText(project.status)}</Badge>
                    </div>
                    <CardDescription className="truncate text-muted-foreground">{project.client}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">التقدم</span>
                  <span className="text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {project.startDate}
                  </span>
                  <span className="flex items-center">
                    <span className="text-xs text-muted-foreground ml-1">ر.س</span>
                    <span>{project.price.toLocaleString()}</span>
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 hidden dark:block" loading="lazy" />
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>المهام: {tasks.filter(t => t.projectId === project.id).length}</span>
                  <span>المهندس: {project.assignedEngineerName}</span>
                </div>
                {/* Click to view details */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => openDetailsDialog(project)}
                  title="عرض التفاصيل"
                />
              </CardContent>
            </Card>
          </SwipeToDelete>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مشاريع</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على مشاريع تطابق معايير البحث</p>
            {canCreateProject && (
              <Button
                onClick={() => {
                  setEditingProject(null)
                  resetForm()
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة مشروع جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>تفاصيل المشروع</DialogTitle>
                <DialogDescription>معلومات شاملة عن المشروع</DialogDescription>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDetailsDialogOpen(false)
                    openEditDialog(selectedProject!)
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
                    setIsDetailsDialogOpen(false)
                    handleDeleteProject(selectedProject!.id)
                  }}
                  className="flex items-center space-x-1 space-x-reverse text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.client}</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedProject.status)}`}>{getStatusText(selectedProject.status)}</Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-muted-foreground ml-1">ر.س</span>
                    <span className="text-2xl font-bold text-green-600">{selectedProject.price.toLocaleString()}</span>
                    <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-5 h-5 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                    <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-5 h-5 opacity-80 mr-1 hidden dark:block" loading="lazy" />
                  </div>
                  <p className="text-sm text-gray-600">السعر الإجمالي</p>
                </div>
              </div>

              {/* Project Details Grid */}
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
                          variant={
                            selectedProject.importance === "high"
                              ? "destructive"
                              : selectedProject.importance === "medium"
                                ? "default"
                                : "secondary"
                          }
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
                      <div className="flex justify-between">
                        <span className="text-gray-600">التاريخ الهجري:</span>
                        <span>{selectedProject.startDateHijri}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">المعلومات المالية</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">السعر الإجمالي:</span>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground ml-1">ر.س</span>
                          <span className="font-medium">{selectedProject.price.toLocaleString()}</span>
                          <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                          <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 hidden dark:block" loading="lazy" />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الدفعة المقدمة:</span>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground ml-1">ر.س</span>
                          <span className="text-green-600">{selectedProject.downPayment.toLocaleString()}</span>
                          <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                          <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 hidden dark:block" loading="lazy" />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ المتبقي:</span>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground ml-1">ر.س</span>
                          <span className="text-red-600">{selectedProject.remainingBalance.toLocaleString()}</span>
                          <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 block dark:hidden" loading="lazy" />
                          <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline w-4 h-4 opacity-80 mr-1 hidden dark:block" loading="lazy" />
                        </div>
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
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-gray-600">أعضاء الفريق:</span>
                        <span>
                          {selectedProject.team.map((id) => {
                            const user = users.find(u => u.id === id);
                            return user ? user.name : id;
                          }).join("، ")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Tasks */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">مهام المشروع</h4>
                    <Badge variant="outline" className="text-xs">
                      {tasks.filter(t => t.projectId === selectedProject.id).length} مهمة
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {tasks.filter(task => task.projectId === selectedProject.id).length > 0 ? (
                      tasks.filter(task => task.projectId === selectedProject.id).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-sm">{task.title}</h5>
                              <Badge
                                variant={
                                  task.status === "completed" ? "default" :
                                    task.status === "in-progress" ? "secondary" : "outline"
                                }
                                className="text-xs"
                              >
                                {task.status === "completed" ? "مكتملة" :
                                  task.status === "in-progress" ? "قيد التنفيذ" : "قيد الانتظار"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>المسؤول: {task.assigneeName}</span>
                              {task.createdByName && <span>المنشئ: {task.createdByName}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to tasks page with this task highlighted
                                window.location.href = `/tasks?highlight=${task.id}`;
                              }}
                            >
                              عرض
                            </Button>
                            {task.status !== "completed" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={async () => {
                                  const updatedTask = { ...task, status: "completed" as const };
                                  try {
                                    const response = await fetch(`/api/tasks?id=${task.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updatedTask),
                                    });
                                    if (response.ok) {
                                      dispatch({ type: "UPDATE_TASK", payload: updatedTask });

                                      // Update project progress
                                      const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
                                      const completedTasks = projectTasks.filter(t => t.status === "completed").length;
                                      const newProgress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
                                      const updatedProject = { ...selectedProject, progress: newProgress };
                                      setSelectedProject(updatedProject);
                                      dispatch({ type: "UPDATE_PROJECT", payload: updatedProject });

                                      // إرسال إشعار للمديرين عند إكمال المهمة من قبل المهندس
                                      if (currentUser?.role !== "admin") {
                                        // إرسال إشعار لجميع المديرين
                                        const adminUsers = users.filter(user => user.role === "admin");
                                        adminUsers.forEach(admin => {
                                          addNotification({
                                            userId: admin.id,
                                            title: "مهمة مكتملة",
                                            message: `تم إنجاز مهمة "${task.title}" في مشروع "${selectedProject.name}" بواسطة ${currentUser?.name}`,
                                            type: "task",
                                            actionUrl: `/projects?highlight=${selectedProject.id}`,
                                            triggeredBy: currentUser?.id || "",
                                            isRead: false,
                                          });
                                        });

                                        // إشعار إضافي إذا اكتمل المشروع بالكامل
                                        if (newProgress === 100) {
                                          adminUsers.forEach(admin => {
                                            addNotification({
                                              userId: admin.id,
                                              title: "مشروع مكتمل",
                                              message: `تم إكمال جميع مهام مشروع "${selectedProject.name}" بنسبة 100%`,
                                              type: "project",
                                              actionUrl: `/projects?highlight=${selectedProject.id}`,
                                              triggeredBy: currentUser?.id || "",
                                              isRead: false,
                                            });
                                          });
                                        }
                                      }

                                      // إظهار رسالة نجاح
                                      showSuccessToast(
                                        "تم إكمال المهمة بنجاح",
                                        `تم إكمال مهمة "${task.title}" وتحديث تقدم المشروع إلى ${newProgress}%`
                                      );
                                    }
                                  } catch (error) {
                                    console.error('Error updating task:', error);
                                    setAlert({ type: "error", message: "حدث خطأ أثناء إكمال المهمة" });
                                  }
                                }}
                              >
                                إكمال
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>لا توجد مهام مرتبطة بهذا المشروع</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">تقدم المشروع</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={(() => {
                            const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
                            const completedTasks = projectTasks.filter(t => t.status === "completed").length;
                            return projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
                          })()}
                          onChange={(e) => {
                            const newProgress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            let newStatus = selectedProject.status
                            if (newProgress === 100 && selectedProject.status !== "completed") {
                              newStatus = "completed"
                            } else if (newProgress < 100 && selectedProject.status === "completed") {
                              newStatus = "in-progress"
                            }
                            const updatedProject = { ...selectedProject, progress: newProgress, status: newStatus }
                            setSelectedProject(updatedProject)
                            dispatch({ type: "UPDATE_PROJECT", payload: updatedProject })
                          }}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(() => {
                          const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
                          const completedTasks = projectTasks.filter(t => t.status === "completed").length;
                          return projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
                        })()}
                        onChange={e => {
                          const newProgress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                          let newStatus = selectedProject.status
                          if (newProgress === 100 && selectedProject.status !== "completed") {
                            newStatus = "completed"
                          } else if (newProgress < 100 && selectedProject.status === "completed") {
                            newStatus = "in-progress"
                          }
                          const updatedProject = { ...selectedProject, progress: newProgress, status: newStatus }
                          setSelectedProject(updatedProject)
                          dispatch({ type: "UPDATE_PROJECT", payload: updatedProject })
                        }}
                        className="w-full md:w-64 accent-blue-600"
                        dir={typeof document !== 'undefined' ? document.dir : 'rtl'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">يمكنك تحريك الشريط لتغيير نسبة الإنجاز أو إكمال المهام أعلاه</p>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="relative h-6 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-200 relative"
                          style={{ width: `${selectedProject.progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs font-medium text-white drop-shadow-sm">
                            {selectedProject.progress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Labels */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">وصف المشروع</h4>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={projects.find(p => p.id === projectToDelete)?.name || "المشروع"}
        itemType="المشروع"
        error={deleteError}
      />

      {/* Update Success Dialog */}
      <Dialog open={updateSuccessDialogOpen} onOpenChange={setUpdateSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تم التحديث بنجاح</DialogTitle>
            <DialogDescription className="text-right">
              تم تحديث المشروع بنجاح
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setUpdateSuccessDialogOpen(false)}
            >
              موافق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
