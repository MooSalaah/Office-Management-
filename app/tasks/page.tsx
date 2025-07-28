"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Plus, Search, Calendar, CheckCircle, Circle, PlayCircle, AlertCircle, Trash2, X, Edit2 } from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { realtimeUpdates, useRealtimeUpdatesByType } from "@/lib/realtime-updates"
import { hasPermission } from "@/lib/auth"
import type { Task } from "@/lib/types"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import TaskCard from "@/components/tasks/TaskCard"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { useTaskSearch, useStatusFilter, usePriorityFilter, useCachedCallback } from "@/lib/performance"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"

type TaskStatus = "todo" | "in-progress" | "completed"

export default function TasksPage() {
  return (
    <PermissionGuard requiredPermission="view_tasks" requiredAction="view" requiredModule="tasks" moduleName="صفحة المهام">
      <TasksPageContent />
    </PermissionGuard>
  )
}

function TasksPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, broadcastTaskUpdate, showSuccessToast } = useAppActions()
  const { currentUser, tasks, projects, users } = state
  const { toast } = useToast()

  // Get highlight parameter from URL for task highlighting
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  
  // Project filter state
  const [projectFilter, setProjectFilter] = useState<string>("all")
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const highlight = urlParams.get('highlight')
      if (highlight) {
        setHighlightedTaskId(highlight)
        // Remove highlight from URL after setting it
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('highlight')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, [])

  // استقبال التحديثات الحية
  const taskUpdates = useRealtimeUpdatesByType('task')
  const userUpdates = useRealtimeUpdatesByType('user')

  const handledTaskUpdateIdsRef = useRef<Set<string>>(new Set());

  // تحديث البيانات عند استقبال تحديثات حية
  useEffect(() => {
    if (taskUpdates.length > 0) {
      const lastUpdate = taskUpdates[taskUpdates.length - 1];
      if (!lastUpdate.task) return;
      const updateId = `${lastUpdate.task.id || ''}_${lastUpdate.action}_${lastUpdate.timestamp || ''}`;
      if (handledTaskUpdateIdsRef.current.has(updateId)) return;
      handledTaskUpdateIdsRef.current.add(updateId);
      
      // Debug logs
      logger.debug('=== TASK UPDATE RECEIVED ===', { lastUpdate, currentUser, tasksCount: state.tasks.length }, 'TASKS');
      
      if (lastUpdate.action === 'create') {
        const exists = state.tasks.some(t => t.id === lastUpdate.task.id);
        logger.debug('Task exists in state', { exists, taskId: lastUpdate.task.id }, 'TASKS');
        if (!exists) {
          logger.debug('Adding task to state', { taskId: lastUpdate.task.id }, 'TASKS');
          dispatch({ type: "ADD_TASK", payload: lastUpdate.task });
          logger.debug('Task added to state successfully', { taskId: lastUpdate.task.id }, 'TASKS');
        }
      } else if (lastUpdate.action === 'update') {
        logger.debug('Updating task in state', { taskId: lastUpdate.task.id }, 'TASKS');
        dispatch({ type: "UPDATE_TASK", payload: lastUpdate.task });
        logger.debug('Task updated in state successfully', { taskId: lastUpdate.task.id }, 'TASKS');
      } else if (lastUpdate.action === 'delete') {
        logger.debug('Deleting task from state', { taskId: lastUpdate.task.id }, 'TASKS');
        dispatch({ type: "DELETE_TASK", payload: lastUpdate.task.id });
        logger.debug('Task deleted from state successfully', { taskId: lastUpdate.task.id }, 'TASKS');
      }
      
      if (lastUpdate.userId && lastUpdate.userId !== currentUser?.id && lastUpdate.userName) {
        showSuccessToast && showSuccessToast(`تمت إضافة/تعديل/حذف مهمة بواسطة ${lastUpdate.userName}`);
      }
    }
  }, [taskUpdates, dispatch, state.tasks, currentUser, showSuccessToast]);

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

  // تحميل المهام من قاعدة البيانات عند بدء الصفحة
  useEffect(() => {
    const loadTasksFromDatabase = async () => {
      try {
        console.log('🔄 Loading tasks from database...');
        const response = await fetch('/api/tasks');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          console.log('✅ Tasks loaded from database:', data.data.length);
          dispatch({ type: "LOAD_TASKS", payload: data.data });
          
          // حفظ المهام في localStorage للتحديثات الفورية
          localStorage.setItem("tasks", JSON.stringify(data.data));
        } else {
          console.log('❌ Failed to load tasks from database:', data);
        }
      } catch (error) {
        console.error('❌ Error loading tasks from database:', error);
      }
    };

    // تحميل المهام من قاعدة البيانات دائماً لضمان الحصول على أحدث البيانات
    loadTasksFromDatabase();
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string>("")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    projectId: "",
    priority: "medium" as "high" | "medium" | "low",
    dueDate: "",
  })

  // إضافة state لتتبع الحقول المطلوبة
  const [requiredFields, setRequiredFields] = useState({
    title: false,
    assigneeId: false,
    dueDate: false,
  })

  // States for inline inputs
  const [showNewAssigneeInput, setShowNewAssigneeInput] = useState(false)
  const [showNewProjectInput, setShowNewProjectInput] = useState(false)
  const [newAssigneeName, setNewAssigneeName] = useState("")
  const [newProjectName, setNewProjectName] = useState("")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "عالية"
      case "medium":
        return "متوسطة"
      case "low":
        return "منخفضة"
      default:
        return priority
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return <Circle className="w-5 h-5 text-gray-400" />
      case "in-progress":
        return <PlayCircle className="w-5 h-5 text-blue-500" />
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getStatusTitle = (status: TaskStatus, tasks: Task[]) => {
    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date() && task.status !== "completed"
    })
    
    switch (status) {
      case "todo":
        const overdueCount = overdueTasks.filter(task => task.status === "todo").length
        return overdueCount > 0 ? `جديدة (${overdueCount} متأخرة)` : "جديدة"
      case "in-progress":
        const overdueInProgressCount = overdueTasks.filter(task => task.status === "in-progress").length
        return overdueInProgressCount > 0 ? `قيد التنفيذ (${overdueInProgressCount} متأخرة)` : "قيد التنفيذ"
      case "completed":
        return "مكتملة"
      default:
        return status
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    const sourceStatus = source.droppableId as TaskStatus
    const destinationStatus = destination.droppableId as TaskStatus

    if (sourceStatus === destinationStatus) return

    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    // Check if user can edit tasks
    if (!hasPermission(currentUser?.role || "", "edit", "tasks")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل المهام" })
      return
    }

    const updatedTask: Task = {
      ...task,
      status: destinationStatus,
      updatedAt: new Date().toISOString(),
    }

    try {
      // Save to backend database
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error('Failed to update task in database');
      }

      const result = await response.json();
      logger.info('Task updated in database', { result }, 'TASKS');

      // Update local state
      dispatch({ type: "UPDATE_TASK", payload: updatedTask })

      // Update in localStorage
      const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]")
      const updatedTasks = existingTasks.map((t: any) => t.id === task.id ? updatedTask : t)
      localStorage.setItem("tasks", JSON.stringify(updatedTasks))

      // Broadcast realtime update
      broadcastTaskUpdate('update', { task: updatedTask, userId: currentUser?.id, userName: currentUser?.name })
      
      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendTaskUpdate({ action: 'update', task: updatedTask, userId: currentUser?.id, userName: currentUser?.name })

      // Add notification to admin when task is completed
      if (destinationStatus === "completed" && currentUser?.role !== "admin") {
        // إرسال إشعار لجميع المديرين
        const adminUsers = users.filter(user => user.role === "admin");
        adminUsers.forEach(admin => {
        addNotification({
            userId: admin.id,
          title: "مهمة مكتملة",
          message: `تم إنجاز مهمة "${task.title}" بواسطة ${currentUser?.name}`,
          type: "task",
            actionUrl: `/tasks?highlight=${task.id}`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
          });
        });
        
        // إشعار إضافي إذا كان المشروع مكتمل
        if (task.projectId) {
          const projectTasks = tasks.filter(t => t.projectId === task.projectId);
          const completedTasks = projectTasks.filter(t => t.status === "completed").length;
          const projectProgress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
          
          if (projectProgress === 100) {
            const project = projects.find(p => p.id === task.projectId);
            adminUsers.forEach(admin => {
              addNotification({
                userId: admin.id,
                title: "مشروع مكتمل",
                message: `تم إكمال جميع مهام مشروع "${project?.name || 'غير محدد'}" بنسبة 100%`,
                type: "project",
                actionUrl: `/projects?highlight=${task.projectId}`,
                triggeredBy: currentUser?.id || "",
                isRead: false,
              });
            });
          }
        }
      }

      // Add notification to assignee when task is assigned
      if (task.assigneeId && task.assigneeId !== currentUser?.id) {
        addNotification({
          userId: task.assigneeId,
          title: "مهمة جديدة مُعيّنة لك",
          message: `تم تعيين مهمة "${task.title}" لك`,
          type: "task",
          actionUrl: `/tasks/${task.id}`,
          triggeredBy: currentUser?.id || "",
          isRead: false,
        })
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث حالة المهمة في قاعدة البيانات" });
    }
  }

  const handleCreateTask = async () => {
    if (!hasPermission(currentUser?.role || "", "create", "tasks")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء المهام" });
      return;
    }
    
    // منع الحفظ المتكرر
    if (state.loadingStates.tasks) {
      return;
    }
    
    const missing: string[] = [];
    if (!formData.title.trim()) missing.push("عنوان المهمة");
    if (!formData.assigneeId) missing.push("المسؤول");
    if (!formData.dueDate) missing.push("تاريخ الاستحقاق");
    
    if (missing.length > 0) {
      setShowValidationErrors(true);
      setMissingFields(missing);
      return;
    }
    setMissingFields([]);

    const assignee = users.find(u => u.id === formData.assigneeId);
    const project = projects.find(p => p.id === formData.projectId);

    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      assigneeName: assignee?.name || "",
      projectId: formData.projectId,
      projectName: project?.name,
      priority: formData.priority,
      status: "todo",
      dueDate: formData.dueDate,
      createdBy: currentUser?.id || "",
      createdByName: currentUser?.name || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      // تعيين حالة التحميل لمنع الحفظ المتكرر
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'tasks', value: true } });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newTask),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: "ADD_TASK", payload: data.data || newTask });
          setAlert({ type: "success", message: "تم إنشاء المهمة بنجاح" });
          resetForm();
          setIsDialogOpen(false);
        } else {
          setAlert({ type: "error", message: data.error || "فشل في إنشاء المهمة" });
        }
      } else {
        setAlert({ type: "error", message: "فشل في إنشاء المهمة" });
      }
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error);
      setAlert({ type: "error", message: "حدث خطأ في إنشاء المهمة" });
    } finally {
      // إزالة حالة التحميل
      dispatch({ type: "SET_LOADING_STATE", payload: { key: 'tasks', value: false } });
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return
    if (!hasPermission(currentUser?.role || "", "edit", "tasks")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل المهام" })
      return
    }
    const assignee = users.find((u) => u.id === formData.assigneeId)
    const project = projects.find((p) => p.id === formData.projectId)
    const updatedTask: Task = {
      ...editingTask,
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      assigneeName: assignee?.name || "",
      projectId: formData.projectId,
      projectName: project?.name || "",
      priority: formData.priority,
      dueDate: formData.dueDate,
      updatedAt: new Date().toISOString(),
    }
    try {
      const response = await fetch(`/api/tasks?id=${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      const data = await response.json();
      if (data.success && data.data) {
        dispatch({ type: "UPDATE_TASK", payload: data.data });
        showSuccessToast("تم تحديث المهمة بنجاح", `تم تحديث المهمة "${data.data.title}" بنجاح`);
        setIsEditDialogOpen(false);
        setEditingTask(null);
        resetForm();
      } else {
        setAlert({ type: "error", message: data.error || "فشل تحديث المهمة في قاعدة البيانات" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "حدث خطأ أثناء تحديث المهمة في قاعدة البيانات" });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!hasPermission(currentUser?.role || "", "delete", "tasks")) {
      setDeleteError("ليس لديك صلاحية لحذف المهام")
      setTaskToDelete(taskId)
      setDeleteDialogOpen(true)
      return
    }

    setTaskToDelete(taskId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!taskToDelete) return

    try {
      const task = tasks.find(t => t.id === taskToDelete)
      if (!task) {
        setDeleteError("المهمة غير موجودة")
        return
      }

      // Delete from backend database
      const response = await fetch(`/api/tasks?id=${taskToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task from database');
      }

      const result = await response.json();
      logger.info('Task deleted from database', { result }, 'TASKS');

      // Update local state
      dispatch({ type: "DELETE_TASK", payload: taskToDelete })

      // Remove from localStorage
      const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]")
      const filteredTasks = existingTasks.filter((t: any) => t.id !== taskToDelete)
      localStorage.setItem("tasks", JSON.stringify(filteredTasks))

      // Broadcast realtime update
      broadcastTaskUpdate('delete', { ...task })
      
      // إرسال تحديث فوري لجميع المستخدمين
      realtimeUpdates.sendTaskUpdate({ action: 'delete', task: task, userId: currentUser?.id, userName: currentUser?.name })

      showSuccessToast("تم حذف المهمة بنجاح", `تم حذف المهمة "${task.title}" بنجاح`)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
      setDeleteError("")
    } catch (error) {
      console.error('Error deleting task:', error);
      setDeleteError("حدث خطأ أثناء حذف المهمة من قاعدة البيانات")
    }
  }

  const openDetailsDialog = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsDialogOpen(true)
  }

  const openEditDialog = (task: Task) => {
    // Check if user can edit tasks
    if (!hasPermission(currentUser?.role || "", "edit", "tasks")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل المهام" })
      return
    }

    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      projectId: task.projectId,
      priority: task.priority,
      dueDate: task.dueDate,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assigneeId: currentUser?.id || "",
      projectId: "",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
    })
    // Reset all inline inputs
    setShowNewAssigneeInput(false)
    setShowNewProjectInput(false)
    setNewAssigneeName("")
    setNewProjectName("")
  }

  // استخدام التحسينات الجديدة للبحث والفلترة
  const searchedTasks = useTaskSearch(tasks, searchTerm)
  
  // Debug: Log tasks for troubleshooting
  console.log('🔍 Tasks Debug:', {
    totalTasks: tasks.length,
    currentUser: currentUser?.name,
    currentUserRole: currentUser?.role,
    currentUserId: currentUser?.id,
    searchedTasks: searchedTasks.length,
    projectFilter,
    tasks: tasks.map(t => ({ id: t.id, title: t.title, assigneeId: t.assigneeId, status: t.status }))
  });
  
  // Filter by user role and project - المدير يرى جميع المهام، المستخدم يرى مهامه المخصصة له فقط
  const filteredTasks = searchedTasks.filter((task) => {
    // Filter by user role
    let userFilter = true
    if (currentUser?.role !== "admin") {
      // البحث عن المستخدم الحالي في قائمة المستخدمين المحدثة من قاعدة البيانات
      const currentUserFromDB = users.find(u => 
        u.email === currentUser?.email || 
        u.name === currentUser?.name ||
        u.id === currentUser?.id
      );
      
      if (currentUserFromDB) {
        userFilter = task.assigneeId === currentUserFromDB._id || task.assigneeId === currentUserFromDB.id;
      } else {
        // Fallback: مقارنة مباشرة مع معرف المستخدم الحالي
        userFilter = task.assigneeId === currentUser?.id;
      }
    }
    
    // Filter by project
    let projectFilterResult = true
    if (projectFilter !== "all") {
      projectFilterResult = task.projectId === projectFilter
    }
    
    const result = userFilter && projectFilterResult;
    
    // Debug: Log filtered task
    if (result) {
      console.log('✅ Task passed filter:', {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        currentUserId: currentUser?.id,
        currentUserEmail: currentUser?.email,
        userFilter,
        projectFilterResult
      });
    }
    
    return result;
  })

  // إضافة فحص للمهام المتأخرة
  const overdueTasks = filteredTasks.filter((task) => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== "completed"
  })



  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === "todo"),
    "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  }

  const canCreateTask = hasPermission(currentUser?.role || "", "create", "tasks")
  const canDeleteTask = hasPermission(currentUser?.role || "", "delete", "tasks")

  // Helper function to check if user can edit a specific task
  const canEditTask = (task: Task) => {
    return hasPermission(currentUser?.role || "", "edit", "tasks")
  }

  // Handle adding new assignee
  const handleAddNewAssignee = async () => {
    // Check if user has permission to add users (only engineers and managers can add engineers)
    if (!hasPermission(currentUser?.role || "", "create", "users") && currentUser?.role !== "engineer") {
      setAlert({ type: "error", message: "فقط المهندسون والمديرون يمكنهم إضافة مهندسين جدد" })
      return
    }

    if (newAssigneeName.trim()) {
      // Generate email and password based on name
      const nameParts = newAssigneeName.trim().split(' ')
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

      const newAssignee = {
        id: Date.now().toString(),
        name: newAssigneeName.trim(),
        email: finalEmail,
        password: defaultPassword,
        role: "engineer", // تعيين دور المهندس
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
          body: JSON.stringify(newAssignee),
        });

        if (!response.ok) {
          throw new Error('Failed to save user to database');
        }

        const result = await response.json();
        logger.info('User saved to database', { result }, 'TASKS');

        // Add to users list
        dispatch({ type: "ADD_USER", payload: newAssignee })
        
        // Save to localStorage
        existingUsers.push(newAssignee)
        localStorage.setItem("users", JSON.stringify(existingUsers))
        
        // إرسال تحديث فوري
        realtimeUpdates.sendUserUpdate({ action: 'create', user: newAssignee })
        
        // Update form data
        setFormData(prev => ({ ...prev, assigneeId: newAssignee.id }))
        
        // Add notification
        addNotification({
          userId: currentUser?.id || "",
          title: "تم إضافة مسؤول جديد",
          message: `تم إضافة المسؤول "${newAssignee.name}" بنجاح. الإيميل: ${finalEmail}، كلمة المرور: ${defaultPassword}`,
          type: "task",
          isRead: false,
          triggeredBy: currentUser?.id || "",
        })
        
        // Reset input
        setShowNewAssigneeInput(false)
        setNewAssigneeName("")
      } catch (error) {
        console.error('Error creating user:', error);
        setAlert({ type: "error", message: "حدث خطأ أثناء حفظ المستخدم في قاعدة البيانات" });
      }
    }
  }

  // Handle adding new project
  const handleAddNewProject = async () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        client: "عميل جديد",
        clientId: "",
        type: "مشروع جديد",
        status: "in-progress" as const,
        team: [],
        startDate: new Date().toISOString().split("T")[0],
        price: 0,
        downPayment: 0,
        remainingBalance: 0,
        assignedEngineerId: currentUser?.id || "",
        assignedEngineerName: currentUser?.name || "",
        importance: "medium" as const,
        description: "",
        progress: 0,
        createdBy: currentUser?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      try {
        // Save to backend database
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProject),
        });

        if (!response.ok) {
          throw new Error('Failed to save project to database');
        }

        const result = await response.json();
        logger.info('Project saved to database', { result }, 'TASKS');

        // Add to projects list
        dispatch({ type: "ADD_PROJECT", payload: newProject })
        
        // Save to localStorage
        const existingProjects = JSON.parse(localStorage.getItem("projects") || "[]")
        existingProjects.push(newProject)
        localStorage.setItem("projects", JSON.stringify(existingProjects))
        
        // إرسال تحديث فوري لجميع المستخدمين
        realtimeUpdates.sendProjectUpdate({ action: 'create', project: newProject, userId: currentUser?.id, userName: currentUser?.name })
        
        // Update form data
        setFormData(prev => ({ ...prev, projectId: newProject.id }))
        
        // Add notification
        addNotification({
          userId: currentUser?.id || "",
          title: "تم إضافة مشروع جديد",
          message: `تم إضافة المشروع "${newProject.name}" بنجاح`,
          type: "project",
          isRead: false,
          triggeredBy: currentUser?.id || "",
        })
        
        // Reset input
        setShowNewProjectInput(false)
        setNewProjectName("")
      } catch (error) {
        console.error('Error creating project:', error);
        setAlert({ type: "error", message: "حدث خطأ أثناء حفظ المشروع في قاعدة البيانات" });
      }
    }
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          {alert.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المهام</h1>
          <p className="text-muted-foreground mt-1">
            تتبع وإدارة مهام الفريق بنظام Kanban
          </p>
        </div>
        {canCreateTask && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="self-end" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                مهمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                <DialogDescription>قم بإدخال تفاصيل المهمة الجديدة</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title" className="flex items-center">
                      عنوان المهمة
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="task-title"
                      placeholder="أدخل عنوان المهمة"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className={requiredFields.title ? "border-red-500" : ""}
                    />
                    {requiredFields.title && (
                      <p className="text-sm text-red-500">هذا الحقل مطلوب</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">الأولوية</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: "high" | "medium" | "low") =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">وصف المهمة</Label>
                  <Textarea
                    id="task-description"
                    placeholder="أدخل وصف المهمة"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-assignee" className="flex items-center">
                      المسؤول
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    {!showNewAssigneeInput ? (
                      <div className="flex space-x-2 space-x-reverse">
                        <Select
                          value={formData.assigneeId}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, assigneeId: value }))}
                        >
                          <SelectTrigger className={`flex-1 ${requiredFields.assigneeId ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="اختر المسؤول" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((user, index, self) => 
                                // إزالة التكرار بناءً على المعرف
                                index === self.findIndex(u => u.id === user.id)
                              )
                              .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <span>{user.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {user.role === "admin" ? "مدير" : 
                                     user.role === "engineer" ? "مهندس" :
                                     user.role === "accountant" ? "محاسب" :
                                     user.role === "hr" ? "موارد بشرية" : user.role}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(hasPermission(currentUser?.role || "", "create", "users") || currentUser?.role === "engineer") && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowNewAssigneeInput(true)}
                            className="shrink-0"
                            title="إضافة مسؤول جديد"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex space-x-2 space-x-reverse">
                          <Input
                            placeholder="اسم المسؤول الجديد"
                            value={newAssigneeName}
                            onChange={(e) => setNewAssigneeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newAssigneeName.trim()) {
                                handleAddNewAssignee()
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddNewAssignee}
                            disabled={!newAssigneeName.trim()}
                            className="shrink-0"
                            title="حفظ المسؤول"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setShowNewAssigneeInput(false)
                              setNewAssigneeName("")
                            }}
                            className="shrink-0"
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {requiredFields.assigneeId && (
                      <p className="text-sm text-red-500">هذا الحقل مطلوب</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-due-date" className="flex items-center">
                      تاريخ التسليم
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className={requiredFields.dueDate ? "border-red-500" : ""}
                    />
                    {requiredFields.dueDate && (
                      <p className="text-sm text-red-500">هذا الحقل مطلوب</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-project">المشروع</Label>
                  {!showNewProjectInput ? (
                    <div className="flex space-x-2 space-x-reverse">
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, projectId: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span>{project.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {project.status === "in-progress" ? "قيد التنفيذ" :
                                   project.status === "completed" ? "مكتمل" :
                                   project.status === "canceled" ? "ملغي" : "مسودة"}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewProjectInput(true)}
                        className="shrink-0"
                        title="إضافة مشروع جديد"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex space-x-2 space-x-reverse">
                        <Input
                          placeholder="اسم المشروع الجديد"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newProjectName.trim()) {
                              handleAddNewProject()
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleAddNewProject}
                          disabled={!newProjectName.trim()}
                          className="shrink-0"
                          title="حفظ المشروع"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setShowNewProjectInput(false)
                            setNewProjectName("")
                          }}
                          className="shrink-0"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                              <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateTask}>حفظ المهمة</Button>
                </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المهام..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {highlightedTaskId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHighlightedTaskId(null)
                  window.location.href = '/tasks'
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <X className="w-4 h-4 mr-1" />
                إزالة التمييز
              </Button>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(["todo", "in-progress", "completed"] as TaskStatus[]).map((status) => (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getStatusIcon(status)}
                    <CardTitle className="text-lg">{getStatusTitle(status, tasks)}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {tasksByStatus[status].length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-blue-50" : ""
                      }`}
                    >
                      {tasksByStatus[status].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <SwipeToDelete
                                key={task.id}
                                onDelete={() => handleDeleteTask(task.id)}
                              >
                                <TaskCard
                                  task={task}
                                  users={users}
                                  canDelete={canDeleteTask}
                                  canEdit={canEditTask(task)}
                                  onDelete={() => handleDeleteTask(task.id)}
                                  onEdit={() => openEditDialog(task)}
                                  onDetails={() => {
                                    setSelectedTask(task)
                                    setIsDetailsDialogOpen(true)
                                  }}
                                  isHighlighted={highlightedTaskId === task.id}
                                />
                              </SwipeToDelete>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty State */}
                      {tasksByStatus[status].length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">لا توجد مهام</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المهمة</DialogTitle>
            <DialogDescription>قم بتعديل معلومات المهمة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="flex items-center">
                  عنوان المهمة
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="edit-title"
                  placeholder="أدخل عنوان المهمة"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as "high" | "medium" | "low" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">وصف المهمة</Label>
              <Textarea
                id="edit-description"
                placeholder="أدخل وصف المهمة"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-assignee" className="flex items-center">
                  المسؤول
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                {!showNewAssigneeInput ? (
                  <div className="flex space-x-2 space-x-reverse">
                    <Select
                      value={formData.assigneeId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, assigneeId: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر المسؤول" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span>{user.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {user.role === "admin" ? "مدير" : 
                                 user.role === "engineer" ? "مهندس" :
                                 user.role === "accountant" ? "محاسب" :
                                 user.role === "hr" ? "موارد بشرية" : user.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(hasPermission(currentUser?.role || "", "create", "users") || currentUser?.role === "engineer") && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewAssigneeInput(true)}
                        className="shrink-0"
                        title="إضافة مسؤول جديد"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2 space-x-reverse">
                      <Input
                        placeholder="اسم المسؤول الجديد"
                        value={newAssigneeName}
                        onChange={(e) => setNewAssigneeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newAssigneeName.trim()) {
                            handleAddNewAssignee()
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddNewAssignee}
                        disabled={!newAssigneeName.trim()}
                        className="shrink-0"
                        title="حفظ المسؤول"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowNewAssigneeInput(false)
                          setNewAssigneeName("")
                        }}
                        className="shrink-0"
                        title="إلغاء"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due-date" className="flex items-center">
                  تاريخ التسليم
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project">المشروع</Label>
              {!showNewProjectInput ? (
                <div className="flex space-x-2 space-x-reverse">
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر المشروع" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span>{project.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {project.status === "in-progress" ? "قيد التنفيذ" :
                               project.status === "completed" ? "مكتمل" :
                               project.status === "canceled" ? "ملغي" : "مسودة"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewProjectInput(true)}
                    className="shrink-0"
                    title="إضافة مشروع جديد"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex space-x-2 space-x-reverse">
                    <Input
                      placeholder="اسم المشروع الجديد"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newProjectName.trim()) {
                          handleAddNewProject()
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAddNewProject}
                      disabled={!newProjectName.trim()}
                      className="shrink-0"
                      title="حفظ المشروع"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setShowNewProjectInput(false)
                        setNewProjectName("")
                      }}
                      className="shrink-0"
                      title="إلغاء"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleUpdateTask}>حفظ التعديلات</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>تفاصيل المهمة</DialogTitle>
                <DialogDescription>معلومات شاملة عن المهمة</DialogDescription>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                {hasPermission(currentUser?.role || "", "edit", "tasks") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      openEditDialog(selectedTask!)
                    }}
                    className="flex items-center space-x-1 space-x-reverse hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    <span>تعديل</span>
                  </Button>
                )}
                {canDeleteTask && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      handleDeleteTask(selectedTask!.id)
                    }}
                    className="flex items-center space-x-1 space-x-reverse text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                  <Badge variant={getPriorityColor(selectedTask.priority)} className="mt-2">
                    {getPriorityText(selectedTask.priority)}
                  </Badge>
                  <Badge 
                    variant={selectedTask.status === "completed" ? "default" : selectedTask.status === "in-progress" ? "secondary" : "outline"}
                    className="mr-2"
                  >
                    {selectedTask.status === "todo" ? "قائمة المهام" : 
                     selectedTask.status === "in-progress" ? "قيد التنفيذ" : "مكتملة"}
                  </Badge>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h3 className="font-medium mb-2">وصف المهمة</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedTask.description}</p>
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">المسؤول</h4>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder.svg" alt={selectedTask.assigneeName} />
                        <AvatarFallback>
                          {selectedTask.assigneeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedTask.assigneeName}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">المشروع</h4>
                    <p className="text-gray-700">{selectedTask.projectName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">تاريخ التسليم</h4>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedTask.dueDate}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">تاريخ الإنشاء</h4>
                    <span>{new Date(selectedTask.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
              </div>

              {/* Task Timeline */}
              <div>
                <h4 className="font-medium mb-2">سجل التحديثات</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>تم إنشاء المهمة في {new Date(selectedTask.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                  {selectedTask.updatedAt !== selectedTask.createdAt && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>تم تحديث المهمة في {new Date(selectedTask.updatedAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="تأكيد حذف المهمة"
        description="هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={tasks.find(t => t.id === taskToDelete)?.title || "المهمة"}
        type="task"
        error={deleteError}
      />
    </div>
  )
}
