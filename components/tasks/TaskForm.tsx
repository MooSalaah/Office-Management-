import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plus, X } from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { hasPermission } from "@/lib/auth"

export default function TaskForm({ onClose, defaultAssigneeId, defaultDueDate }: { onClose: () => void; defaultAssigneeId?: string; defaultDueDate?: string }) {
  const { state, dispatch } = useApp()
  const { addNotification, broadcastTaskUpdate, showSuccessToast } = useAppActions()
  const { currentUser, users, projects } = state

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: defaultAssigneeId || "",
    projectId: "",
    priority: "medium" as "high" | "medium" | "low",
    dueDate: defaultDueDate || "",
  })
  const [requiredFields, setRequiredFields] = useState({
    title: false,
    assigneeId: false,
    dueDate: false,
  })
  const [showNewAssigneeInput, setShowNewAssigneeInput] = useState(false)
  const [showNewProjectInput, setShowNewProjectInput] = useState(false)
  const [newAssigneeName, setNewAssigneeName] = useState("")
  const [newProjectName, setNewProjectName] = useState("")

  const handleAddNewAssignee = () => {
    if (!hasPermission(currentUser?.role || "", "create", "users") && currentUser?.role !== "engineer") return
    if (newAssigneeName.trim()) {
      const nameParts = newAssigneeName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''
      const emailPrefix = (firstName.charAt(0) + lastName).toLowerCase().replace(/\s+/g, '')
      let email = `${emailPrefix}@newcorner.sa`
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      let emailCounter = 1
      let finalEmail = email
      while (existingUsers.some((user: any) => user.email === finalEmail)) {
        finalEmail = `${emailPrefix}${emailCounter}@newcorner.sa`
        emailCounter++
      }
      const defaultPassword = `${firstName.charAt(0)}${lastName}123`.toLowerCase().replace(/\s+/g, '')
      const newAssignee = {
        id: Date.now().toString(),
        name: newAssigneeName.trim(),
        email: finalEmail,
        password: defaultPassword,
        role: "engineer" as const,
        avatar: "",
        phone: "",
        isActive: true,
        monthlySalary: 5000,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "ADD_USER", payload: newAssignee })
      existingUsers.push(newAssignee)
      localStorage.setItem("users", JSON.stringify(existingUsers))
      setFormData(prev => ({ ...prev, assigneeId: newAssignee.id }))
      addNotification({
        userId: currentUser?.id || "",
        title: "تم إضافة مسؤول جديد",
        message: `تم إضافة المسؤول "${newAssignee.name}" بنجاح. الإيميل: ${finalEmail}، كلمة المرور: ${defaultPassword}`,
        type: "task",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
      setShowNewAssigneeInput(false)
      setNewAssigneeName("")
    }
  }

  const handleAddNewProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        client: "عميل جديد",
        clientId: "",
        type: "مشروع جديد",
        status: "draft" as const,
        team: [],
        startDate: new Date().toISOString().split("T")[0],
        price: 0,
        downPayment: 0,
        remainingBalance: 0,
        assignedEngineerId: "",
        assignedEngineerName: "",
        importance: "medium" as const,
        description: "",
        progress: 0,
        createdBy: currentUser?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: "ADD_PROJECT", payload: newProject })
      setFormData(prev => ({ ...prev, projectId: newProject.id }))
      addNotification({
        userId: currentUser?.id || "",
        title: "تم إضافة مشروع جديد",
        message: `تم إضافة المشروع "${newProject.name}" بنجاح`,
        type: "project",
        isRead: false,
        triggeredBy: currentUser?.id || "",
      })
      setShowNewProjectInput(false)
      setNewProjectName("")
    }
  }

  const handleCreateTask = () => {
    if (!hasPermission(currentUser?.role || "", "create", "tasks")) return
    const missingFields = {
      title: !formData.title.trim(),
      assigneeId: !formData.assigneeId,
      dueDate: !formData.dueDate,
    }
    setRequiredFields(missingFields)
    if (missingFields.title || missingFields.assigneeId || missingFields.dueDate) return
    const assignee = users.find((u) => u.id === formData.assigneeId)
    const project = projects.find((p) => p.id === formData.projectId)
    const newTask = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      assigneeName: assignee?.name || "",
      projectId: formData.projectId,
      projectName: project?.name || "",
      priority: formData.priority,
      status: "todo",
      dueDate: formData.dueDate,
      createdBy: currentUser?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_TASK", payload: newTask })
    const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]")
    existingTasks.push(newTask)
    localStorage.setItem("tasks", JSON.stringify(existingTasks))
    broadcastTaskUpdate('create', newTask)
    showSuccessToast("تم إنشاء المهمة بنجاح", `تم إنشاء المهمة "${newTask.title}" بنجاح`)
    onClose()
    if (assignee && assignee.id !== currentUser?.id) {
      addNotification({
        userId: assignee.id,
        title: "مهمة جديدة مُعيّنة لك",
        message: `تم تعيين مهمة "${formData.title}" لك بواسطة ${currentUser?.name}`,
        type: "task",
        actionUrl: `/tasks/${newTask.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1",
        title: "مهمة جديدة تم إنشاؤها",
        message: `تم إنشاء مهمة جديدة "${formData.title}" بواسطة ${currentUser?.name}`,
        type: "task",
        actionUrl: `/tasks/${newTask.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  return (
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
      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button onClick={handleCreateTask}>حفظ المهمة</Button>
      </div>
    </div>
  )
} 