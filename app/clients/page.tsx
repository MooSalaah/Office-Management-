"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useApp, useAppActions } from "@/lib/context/AppContext"
import { hasPermission } from "@/lib/auth"
import type { Client } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { ArabicNumber } from "@/components/ui/ArabicNumber"
import { SwipeToDelete } from "@/components/ui/swipe-to-delete"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { useRealtimeUpdatesByType } from "@/lib/realtime-updates"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function ClientsPage() {
  return (
    <PermissionGuard requiredPermission="view_clients" requiredAction="view" requiredModule="clients" moduleName="صفحة العملاء">
      <ClientsPageContent />
    </PermissionGuard>
  )
}

function ClientsPageContent() {
  const { state, dispatch } = useApp()
  const { addNotification, broadcastClientUpdate, showSuccessToast, acquireEditingLock, releaseEditingLock, canEditItem, getEditingLockInfo } = useAppActions()
  const { currentUser, clients, projects } = state
  const router = useRouter()

  const [filteredClients, setFilteredClients] = useState<Client[]>(clients)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string>("")
  const [updateSuccessDialogOpen, setUpdateSuccessDialogOpen] = useState(false)
  const clientUpdates = useRealtimeUpdatesByType('client')
  const handledClientUpdateIdsRef = useRef<Set<string>>(new Set())

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    status: "active" | "inactive" | "vip" | "government";
    notes: string;
    avatar: string;
  }>({
    name: "",
    phone: "",
    email: "",
    address: "",
    status: "active",
    notes: "",
    avatar: "",
  })

  const [requiredFieldsClient, setRequiredFieldsClient] = useState({
    name: false,
    email: false,
    phone: false,
  })

  const [showNewClientStatus, setShowNewClientStatus] = useState("");

  const [phoneError, setPhoneError] = useState("");

  const memoizedClients = useMemo(() => {
    // تصفية العملاء حسب الصلاحيات
    let filteredClients = clients;
    
    // إذا كان المستخدم ليس مدير، تحقق من الصلاحيات
    if (currentUser?.role !== "admin") {
      // تحقق من صلاحية عرض العملاء
      if (!hasPermission(currentUser?.role || "", "view", "clients")) {
        filteredClients = [];
      }
    }
    
    // تطبيق البحث
    return filteredClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm),
    )
  }, [clients, searchTerm, currentUser])

  useEffect(() => {
    if (clientUpdates.length > 0) {
      const lastUpdate = clientUpdates[clientUpdates.length - 1];
      if (!lastUpdate.client) return;
      const updateId = `${lastUpdate.client.id || ''}_${lastUpdate.action}_${lastUpdate.timestamp || ''}`;
      if (handledClientUpdateIdsRef.current.has(updateId)) return;
      handledClientUpdateIdsRef.current.add(updateId);
      
      console.log('=== CLIENT UPDATE RECEIVED ===');
      console.log('Client update:', lastUpdate);
      console.log('Current clients count:', state.clients.length);
      
      if (lastUpdate.action === 'create') {
        const exists = state.clients.some(c => c.id === lastUpdate.client.id);
        console.log('Client exists in state:', exists);
        if (!exists) {
          console.log('Adding client to state...');
          dispatch({ type: "ADD_CLIENT", payload: lastUpdate.client });
          console.log('Client added to state successfully');
        }
      } else if (lastUpdate.action === 'update') {
        console.log('Updating client in state...');
        dispatch({ type: "UPDATE_CLIENT", payload: lastUpdate.client });
        console.log('Client updated in state successfully');
        // تحديث جميع المشاريع المرتبطة بهذا العميل
        const updatedProjects = state.projects.map((p) =>
          p.clientId === lastUpdate.client.id ? { ...p, client: lastUpdate.client.name } : p
        );
        updatedProjects.forEach((project) => {
          dispatch({ type: "UPDATE_PROJECT", payload: project });
        });
        console.log('Updated all related projects with new client name');
      } else if (lastUpdate.action === 'delete') {
        console.log('Deleting client from state...');
        dispatch({ type: "DELETE_CLIENT", payload: lastUpdate.client.id });
        console.log('Client deleted from state successfully');
      }
      
      if (lastUpdate.userId && lastUpdate.userId !== currentUser?.id && lastUpdate.userName) {
        toast({
          title: "تحديث عميل جديد",
          description: `تمت إضافة/تعديل/حذف عميل بواسطة ${lastUpdate.userName}`
        });
      }
    }
  }, [clientUpdates, dispatch, state.clients, state.projects, currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "vip":
        return "destructive"
      case "government":
        return "secondary"
      case "inactive":
        return "outline"
      default:
        return "default"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط"
      case "vip":
        return "VIP"
      case "government":
        return "حكومي"
      case "inactive":
        return "غير نشط"
      default:
        return status
    }
  }

  const handleCreateClient = () => {
    if (!hasPermission(currentUser?.role || "", "create", "clients")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لإنشاء عملاء جدد" })
      return
    }
    const missingFields = {
      name: !formData.name.trim(),
      phone: !formData.phone.trim(),
    }
    setRequiredFieldsClient({ name: missingFields.name, email: false, phone: missingFields.phone });
    if (missingFields.name || missingFields.phone) {
      // لا تعرض alert عام، فقط أظهر الأخطاء تحت الحقول
      return
    }

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
      notes: formData.notes,
      projectsCount: 0,
      totalValue: 0,
      lastContact: new Date().toISOString(),
      status: formData.status,
      createdAt: new Date().toISOString(),
      avatar: formData.avatar,
    }

    dispatch({ type: "ADD_CLIENT", payload: newClient })
    
    // Save to localStorage
    const existingClients = JSON.parse(localStorage.getItem("clients") || "[]")
    existingClients.push(newClient)
    localStorage.setItem("clients", JSON.stringify(existingClients))
    
    // Broadcast realtime update
    broadcastClientUpdate('create', { client: newClient, userId: currentUser?.id, userName: currentUser?.name })
    
    // إرسال تحديث فوري
    if (typeof window !== 'undefined') {
      const { realtimeUpdates } = require('../../lib/realtime-updates');
      realtimeUpdates.sendClientUpdate({ action: 'create', client: newClient, userId: currentUser?.id, userName: currentUser?.name });
    }
    
    showSuccessToast("تم إنشاء العميل بنجاح", `تم إنشاء العميل "${newClient.name}" بنجاح`)
    setIsDialogOpen(false)
    resetForm()

    // Add notification to admin when client is created
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1", // Admin user ID
        title: "عميل جديد تم إضافته",
        message: `تم إضافة عميل جديد "${formData.name}" بواسطة ${currentUser?.name}`,
        type: "project",
        actionUrl: `/clients/${newClient.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  const handleUpdateClient = () => {
    if (!editingClient || !hasPermission(currentUser?.role || "", "edit", "clients")) {
      setAlert({ type: "error", message: "ليس لديك صلاحية لتعديل العملاء" })
      return
    }

    // تحقق من صحة رقم الهاتف
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError("رقم الهاتف يجب أن يكون على الصيغة 05XXXXXXXX");
      return;
    } else {
      setPhoneError("");
    }

    const updatedClient: Client = {
      ...editingClient,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      notes: formData.notes,
      status: formData.status,
      avatar: formData.avatar,
    }

    dispatch({ type: "UPDATE_CLIENT", payload: updatedClient })
    
    // Update in localStorage
    const existingClients = JSON.parse(localStorage.getItem("clients") || "[]")
    const updatedClients = existingClients.map((c: any) => c.id === editingClient.id ? updatedClient : c)
    localStorage.setItem("clients", JSON.stringify(updatedClients))
    
    // Broadcast realtime update
    broadcastClientUpdate('update', { client: updatedClient, userId: currentUser?.id, userName: currentUser?.name })
    
    showSuccessToast("تم تحديث العميل بنجاح", `تم تحديث العميل "${updatedClient.name}" بنجاح`)
    setIsDialogOpen(false)
    setEditingClient(null)
    resetForm()

    // Add notification to admin when client is updated
    if (currentUser?.role !== "admin") {
      addNotification({
        userId: "1", // Admin user ID
        title: "عميل تم تحديثه",
        message: `تم تحديث عميل "${formData.name}" بواسطة ${currentUser?.name}`,
        type: "project",
        actionUrl: `/clients/${editingClient?.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  const handleDeleteClient = (clientId: string) => {
    if (!hasPermission(currentUser?.role || "", "delete", "clients")) {
      setDeleteError("ليس لديك صلاحية لحذف العملاء")
      setClientToDelete(clientId)
      setDeleteDialogOpen(true)
      return
    }

    setClientToDelete(clientId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return

    try {
      const client = clients.find(c => c.id === clientToDelete)
      if (!client) {
        setDeleteError("العميل غير موجود")
        return
      }

      // Check if client has projects
      const clientProjects = projects.filter(p => p.clientId === clientToDelete)
      if (clientProjects.length > 0) {
        setDeleteError("لا يمكن حذف العميل لأنه مرتبط بمشاريع")
        return
      }

      dispatch({ type: "DELETE_CLIENT", payload: clientToDelete })

      // Remove from localStorage
      const existingClients = JSON.parse(localStorage.getItem("clients") || "[]")
      const filteredClients = existingClients.filter((c: any) => c.id !== clientToDelete)
      localStorage.setItem("clients", JSON.stringify(filteredClients))

      // Broadcast realtime update
      broadcastClientUpdate('delete', { ...client })

      showSuccessToast("تم حذف العميل بنجاح", `تم حذف العميل "${client.name}" بنجاح`)
      setDeleteDialogOpen(false)
      setClientToDelete(null)
      setDeleteError("")
    } catch (error) {
      setDeleteError("حدث خطأ أثناء حذف العميل")
    }
  }

  const openEditDialog = (client: Client) => {
    // التحقق من إمكانية التعديل
    if (!canEditItem('clients', client.id)) {
      const lockInfo = getEditingLockInfo('clients', client.id);
      if (lockInfo) {
        setAlert({ type: "error", message: `هذا العميل قيد التعديل بواسطة ${lockInfo.userName}` });
        return;
      }
    }
    
    // محاولة الحصول على قفل التعديل
    if (!acquireEditingLock('clients', client.id)) {
      setAlert({ type: "error", message: "هذا العميل قيد التعديل بواسطة مستخدم آخر" });
      return;
    }
    
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      status: client.status,
      notes: client.notes || "",
      avatar: client.avatar || "",
    })
    setIsDialogOpen(true)
  }

  const openDetailsDialog = (client: Client) => {
    // Calculate client statistics
    const clientProjects = projects.filter((p) => p.clientId === client.id)
    const updatedClient = {
      ...client,
      projectsCount: clientProjects.length,
      totalValue: clientProjects.reduce((sum, p) => sum + p.price, 0),
    }
    setSelectedClient(updatedClient)
    setIsDetailsDialogOpen(true)
  }

  const resetForm = () => {
    // إطلاق قفل التعديل إذا كان هناك عميل قيد التعديل
    if (editingClient) {
      releaseEditingLock('clients', editingClient.id);
    }
    
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      notes: "",
      avatar: "",
    })
    setEditingClient(null)
    setRequiredFieldsClient({ name: false, email: false, phone: false })
    setPhoneError("")
  }

  const canCreateClient = hasPermission(currentUser?.role || "", "create", "clients")
  const canEditClient = hasPermission(currentUser?.role || "", "edit", "clients")
  const canDeleteClient = hasPermission(currentUser?.role || "", "delete", "clients")

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
          <h1 className="text-3xl font-bold text-foreground mb-1">إدارة العملاء</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات العملاء ومشاريعهم</p>
        </div>
        {canCreateClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingClient(null)
                  resetForm()
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle>
                <DialogDescription>
                  {editingClient ? "قم بتعديل تفاصيل العميل" : "قم بإدخال تفاصيل العميل الجديد"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="flex items-center">
                    اسم العميل/الشركة
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                  <Input
                    id="client-name"
                    placeholder="اسم العميل"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {requiredFieldsClient.name && (
                    <p className="text-xs text-red-500 mt-1">هذا الحقل مطلوب</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone" className="flex items-center">
                    رقم الهاتف
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                  <Input
                    id="client-phone"
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    maxLength={10}
                  />
                  {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email" className="flex items-center">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="البريد الإلكتروني (اختياري)"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-10" // تأكد من أن الارتفاع متناسق مع باقي الحقول
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-status">حالة العميل</Label>
                  <div className="flex gap-2 items-end">
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as "active" | "inactive" | "vip" | "government" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="government">حكومي</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                        {/* إضافة الحالات الجديدة */}
                        {typeof formData.status === 'string' && !['active','vip','government','inactive'].includes(formData.status) && (
                          <SelectItem value={formData.status}>{formData.status}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="إضافة حالة جديدة"
                      value={showNewClientStatus || ""}
                      onChange={e => setShowNewClientStatus(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (showNewClientStatus.trim()) {
                          setFormData(prev => ({ ...prev, status: showNewClientStatus.trim() as "active" | "inactive" | "vip" | "government" }))
                          setShowNewClientStatus("")
                        }
                      }}
                      disabled={!showNewClientStatus || !showNewClientStatus.trim()}
                      className="shrink-0"
                      title="إضافة حالة جديدة"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="client-avatar">صورة العميل</Label>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="relative">
                      <input
                        id="client-avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              setFormData((prev) => ({ ...prev, avatar: ev.target?.result as string }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <label
                        htmlFor="client-avatar"
                        className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                      >
                        {formData.avatar ? (
                          <div className="relative">
                            <img 
                              src={formData.avatar} 
                              alt="صورة العميل" 
                              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm" 
                              loading="lazy"
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs text-gray-500 text-center">اضغط لرفع صورة</span>
                          </>
                        )}
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.avatar 
                          ? "تم رفع الصورة بنجاح. اضغط على الصورة لتغييرها." 
                          : "اختر صورة للعميل (اختياري). يفضل أن تكون الصورة مربعة الشكل."
                        }
                      </p>
                      {formData.avatar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, avatar: "" }))}
                          className="mt-2 text-red-600 hover:text-red-700"
                        >
                          إزالة الصورة
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={editingClient ? handleUpdateClient : handleCreateClient}>
                  {editingClient ? "تحديث العميل" : "حفظ العميل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في العملاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memoizedClients.map((client) => {
          const clientProjects = projects.filter((p) => p.clientId === client.id)
          const projectsCount = clientProjects.length
          const totalValue = clientProjects.reduce((sum, p) => p.price + sum, 0)

          return (
            <SwipeToDelete
              key={client.id}
              onDelete={() => handleDeleteClient(client.id)}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card text-card-foreground border border-border" onClick={() => openDetailsDialog(client)}>
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={client.avatar || "/placeholder.svg"} alt={client.name} />
                    <AvatarFallback>
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight truncate text-foreground">{client.name}</CardTitle>
                    <CardDescription className="truncate text-muted-foreground">{client.email}</CardDescription>
                    <Badge variant={getStatusColor(client.status)} className="text-xs mt-2">
                      {getStatusText(client.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>المشاريع</span>
                    <span className="font-bold text-foreground text-xl">{projectsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>المشاريع النشطة</span>
                    <span className="text-green-600 font-semibold text-sm">
                      {clientProjects.filter(p => p.status === "in-progress").length}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>إجمالي القيمة</span>
                    <span className="flex items-center gap-1 font-bold text-foreground text-lg">
                      <ArabicNumber value={totalValue} />
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-5 h-5 opacity-80 ml-1 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-5 h-5 opacity-80 ml-1 hidden dark:block" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>قيمة المشاريع المنفذة</span>
                    <span className="flex items-center gap-1 text-blue-600 font-semibold text-sm">
                      <ArabicNumber value={clientProjects.filter(p => p.status === "completed").reduce((sum, p) => sum + p.price, 0)} />
                      <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 block dark:hidden" />
                      <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 hidden dark:block" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </SwipeToDelete>
          )
        })}
      </div>

      {/* Empty State */}
      {memoizedClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد عملاء</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على عملاء يطابقون معايير البحث</p>
            {canCreateClient && (
              <Button
                onClick={() => {
                  setEditingClient(null)
                  resetForm()
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة عميل جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل العميل</DialogTitle>
            <DialogDescription>معلومات شاملة عن العميل ومشاريعه</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedClient.avatar || "/placeholder.svg"} alt={selectedClient.name} />
                      <AvatarFallback className="text-lg">
                        {selectedClient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedClient.name}</h3>
                      <Badge variant={getStatusColor(selectedClient.status)} className="mt-1">
                        {getStatusText(selectedClient.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          <ArabicNumber value={selectedClient.projectsCount} />
                        </p>
                        <p className="text-sm text-gray-600">مشروع</p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">المشاريع النشطة</p>
                          <p className="text-sm font-medium text-green-600">
                            {projects.filter(p => p.clientId === selectedClient.id && p.status === "in-progress").length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold flex items-center justify-center gap-1">
                          <ArabicNumber value={selectedClient.totalValue} />
                          <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-5 h-5 opacity-80 ml-1 block dark:hidden" />
                          <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-5 h-5 opacity-80 ml-1 hidden dark:block" />
                        </p>
                        <p className="text-sm text-gray-600">إجمالي القيمة</p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">قيمة المشاريع المنفذة</p>
                          <p className="text-sm font-medium text-blue-600 flex items-center justify-center gap-1">
                            <ArabicNumber value={projects.filter(p => p.clientId === selectedClient.id && p.status === "completed").reduce((sum, p) => sum + p.price, 0)} />
                            <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-3 h-3 opacity-80 ml-1 block dark:hidden" />
                            <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-3 h-3 opacity-80 ml-1 hidden dark:block" />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {selectedClient.notes && (
                    <div>
                      <h4 className="font-medium mb-2">ملاحظات:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedClient.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Projects */}
              <div>
                <h4 className="font-medium mb-4">المشاريع المرتبطة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects
                    .filter((p) => p.clientId === selectedClient.id)
                    .map((project) => (
                      <Card key={project.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{project.name}</h5>
                            <Badge variant="outline">
                              {project.status === "in-progress"
                                ? "قيد التنفيذ"
                                : project.status === "completed"
                                  ? "مكتمل"
                                  : project.status === "draft"
                                    ? "مسودة"
                                    : "ملغي"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <ArabicNumber value={project.price} />
                              <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 block dark:hidden" />
                              <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" className="inline align-middle w-4 h-4 opacity-80 ml-1 hidden dark:block" />
                            </span>
                            <span>{project.progress}% مكتمل</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
                {projects.filter((p) => p.clientId === selectedClient.id).length === 0 && (
                  <p className="text-gray-500 text-center py-8">لا توجد مشاريع مرتبطة بهذا العميل</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
                {canEditClient && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      openEditDialog(selectedClient)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل العميل
                  </Button>
                )}
                {canDeleteClient && projects.filter(p => p.clientId === selectedClient.id).length === 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsDialogOpen(false)
                      setClientToDelete(selectedClient.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف العميل
                  </Button>
                )}
                <Button
                  onClick={() => {
                    // Navigate to projects page filtered by this client
                    router.push(`/projects?client=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.name)}`)
                  }}
                >
                  <Building className="w-4 h-4 mr-2" />
                  عرض مشاريع {selectedClient.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Success Dialog */}
      <Dialog open={updateSuccessDialogOpen} onOpenChange={setUpdateSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تم التحديث بنجاح</DialogTitle>
            <DialogDescription className="text-right">
              تم تحديث العميل بنجاح
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

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="تأكيد حذف العميل"
        description="هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={clients.find(c => c.id === clientToDelete)?.name || "العميل"}
        type="client"
        error={deleteError}
      />
    </div>
  )
}
