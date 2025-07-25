"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useState } from "react"
import type {
  User,
  Project,
  Client,
  Task,
  Transaction,
  Notification,
  AttendanceRecord,
  CompanySettings,
  UserSettings,
  UpcomingPayment,
} from "../types"
import {
  mockUsers,
  mockProjects,
  mockClients,
  mockTasks,
  mockTransactions,
  mockNotifications,
  mockAttendanceRecords,
  companySettings,
} from "../data"
import { getCurrentUser, initializeDefaultRoles, updateUserPermissionsByRole } from "../auth"
import { useToast } from "@/hooks/use-toast"
import { realtimeUpdates } from "../realtime-updates"
import { api } from "../api";

// تعريف اختياري لـ window.realtimeUpdates لتفادي أخطاء linter
// @ts-ignore
interface Window { realtimeUpdates?: any }

declare global {
  interface Window {
    realtimeUpdates?: any;
  }
}

interface AppState {
  currentUser: User | null
  users: User[]
  projects: Project[]
  clients: Client[]
  tasks: Task[]
  transactions: Transaction[]
  notifications: Notification[]
  attendanceRecords: AttendanceRecord[]
  upcomingPayments: UpcomingPayment[]
  companySettings: CompanySettings
  userSettings: UserSettings | null
  isLoading: boolean
  loadingStates: {
    projects: boolean
    tasks: boolean
    clients: boolean
    transactions: boolean
    users: boolean
    notifications: boolean
  }
}

type AppAction =
  | { type: "SET_CURRENT_USER"; payload: User | null }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "ADD_CLIENT"; payload: Client }
  | { type: "UPDATE_CLIENT"; payload: Client }
  | { type: "DELETE_CLIENT"; payload: string }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_UPCOMING_PAYMENT"; payload: UpcomingPayment }
  | { type: "UPDATE_UPCOMING_PAYMENT"; payload: UpcomingPayment }
  | { type: "DELETE_UPCOMING_PAYMENT"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "UPDATE_NOTIFICATION"; payload: Notification }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "ADD_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "DELETE_USER"; payload: string }
  | { type: "ADD_ATTENDANCE"; payload: AttendanceRecord }
  | { type: "UPDATE_ATTENDANCE"; payload: AttendanceRecord }
  | { type: "UPDATE_COMPANY_SETTINGS"; payload: CompanySettings }
  | { type: "UPDATE_USER_SETTINGS"; payload: UserSettings }
  | { type: "UPDATE_COMPANY_LOGO"; payload: string }
  | { type: "UPDATE_COMPANY_INFO"; payload: any }
  | { type: "UPDATE_NOTIFICATION_SETTINGS"; payload: any }
  | { type: "TOGGLE_DARK_MODE"; payload: boolean }
  | { type: "LOAD_USERS"; payload: User[] }
  | { type: "LOAD_PROJECTS"; payload: Project[] }
  | { type: "LOAD_CLIENTS"; payload: Client[] }
  | { type: "LOAD_TASKS"; payload: Task[] }
  | { type: "LOAD_TRANSACTIONS"; payload: Transaction[] }
  | { type: "LOAD_NOTIFICATIONS"; payload: Notification[] }
  | { type: "LOAD_ATTENDANCE"; payload: AttendanceRecord[] }
  | { type: "LOAD_UPCOMING_PAYMENTS"; payload: UpcomingPayment[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_STATE"; payload: { key: keyof AppState['loadingStates']; value: boolean } }
  | { type: "SET_USERS"; payload: User[] }

const initialState: AppState = {
  currentUser: null,
  users: mockUsers,
  projects: mockProjects,
  clients: mockClients,
  tasks: mockTasks,
  transactions: mockTransactions,
  notifications: mockNotifications,
  attendanceRecords: mockAttendanceRecords,
  upcomingPayments: [],
  companySettings: companySettings,
  userSettings: null,
  isLoading: false,
  loadingStates: {
    projects: false,
    tasks: false,
    clients: false,
    transactions: false,
    users: false,
    notifications: false,
  },
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload }

    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload] }

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }

    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
      }

    case "LOAD_PROJECTS":
      return {
        ...state,
        projects: action.payload,
      }

    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.payload] }

    case "UPDATE_CLIENT":
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }

    case "DELETE_CLIENT":
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
      }

    case "LOAD_CLIENTS":
      return {
        ...state,
        clients: action.payload,
      }

    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.payload] }

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }

    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      }

    case "LOAD_TASKS":
      return {
        ...state,
        tasks: action.payload,
      }

    case "ADD_TRANSACTION":
      return { ...state, transactions: [...state.transactions, action.payload] }

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }

    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      }

    case "ADD_UPCOMING_PAYMENT":
      return { ...state, upcomingPayments: [...state.upcomingPayments, action.payload] }

    case "UPDATE_UPCOMING_PAYMENT":
      return {
        ...state,
        upcomingPayments: state.upcomingPayments.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }

    case "DELETE_UPCOMING_PAYMENT":
      return {
        ...state,
        upcomingPayments: state.upcomingPayments.filter((p) => p.id !== action.payload),
      }

    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] }

    case "UPDATE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.payload.id ? action.payload : n)),
      }

    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }

    case "ADD_USER":
      if (state.users.some(u => u.id === action.payload.id || u.email === action.payload.email)) {
        return state;
      }
      return { ...state, users: [...state.users, action.payload] };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? action.payload : u)),
      }

    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      }

    case "ADD_ATTENDANCE":
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] }

    case "UPDATE_ATTENDANCE":
      return {
        ...state,
        attendanceRecords: state.attendanceRecords.map((a) => (a.id === action.payload.id ? action.payload : a)),
      }

    case "LOAD_ATTENDANCE":
      return {
        ...state,
        attendanceRecords: action.payload,
      }

    case "UPDATE_COMPANY_SETTINGS":
      return { ...state, companySettings: action.payload }

    case "UPDATE_USER_SETTINGS":
      return { ...state, userSettings: action.payload }

    case "UPDATE_COMPANY_LOGO":
      return { 
        ...state, 
        companySettings: { 
          ...state.companySettings, 
          logo: action.payload 
        } 
      }

    case "UPDATE_COMPANY_INFO":
      return { 
        ...state, 
        companySettings: { 
          ...state.companySettings, 
          ...action.payload 
        } 
      }

    case "UPDATE_NOTIFICATION_SETTINGS":
      return { 
        ...state, 
        userSettings: state.userSettings ? { 
          ...state.userSettings, 
          notificationSettings: action.payload 
        } : null
      }

    case "TOGGLE_DARK_MODE":
      return { 
        ...state, 
        userSettings: state.userSettings ? { 
          ...state.userSettings, 
          darkMode: action.payload 
        } : null
      }

    case "LOAD_USERS":
      return { ...state, users: action.payload }
    case "LOAD_PROJECTS":
      return { ...state, projects: action.payload }
    case "LOAD_CLIENTS":
      return { ...state, clients: action.payload }
    case "LOAD_TASKS":
      return { ...state, tasks: action.payload }
    case "LOAD_TRANSACTIONS":
      return { ...state, transactions: action.payload }
    case "LOAD_NOTIFICATIONS":
      return { ...state, notifications: action.payload }
    case "LOAD_ATTENDANCE":
      return { ...state, attendanceRecords: action.payload }
    case "LOAD_UPCOMING_PAYMENTS":
      return { ...state, upcomingPayments: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_LOADING_STATE":
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.value,
        },
      }
    case "SET_USERS": {
      // فلترة التكرار بناءً على id أو email
      const uniqueUsers: typeof action.payload = [];
      const seen = new Set();
      for (const user of action.payload) {
        if (!seen.has(user.id) && !seen.has(user.email)) {
          uniqueUsers.push(user);
          seen.add(user.id);
          seen.add(user.email);
        }
      }
      return { ...state, users: uniqueUsers };
    }

    default:
      return state
  }
}

export const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  isAuthLoading: boolean
} | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Initialize browser notifications and service worker
  useEffect(() => {
    const initializeNotifications = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js')
          } catch (error) {
            console.error('Service Worker registration failed:', error)
          }
        }
      }
    }

    initializeNotifications()
  }, [])

  // Function to show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false,
      })

      browserNotification.onclick = () => {
        window.focus()
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
        browserNotification.close()
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }

  // Initialize realtime updates
  useEffect(() => {
    // Realtime functionality temporarily disabled for SSR compatibility
    // استمع لتحديثات الإشعارات الفورية (عند تفعيلها)
    if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
      (window as any).realtimeUpdates.on('notification', (notification: any) => {
        // تحقق إذا كان الإشعار موجود مسبقاً
        if (!state.notifications.some(n => n.id === notification.id)) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        }
      })
    }
    console.log('Realtime updates disabled for SSR compatibility');
  }, [state.currentUser?.id, state.notifications])

  // جلب المشاريع من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.projects.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          dispatch({ type: "LOAD_PROJECTS", payload: response.data });
        }
      } catch (error) {
        console.error("فشل جلب المشاريع من الباكند:", error);
        // في حال الفشل، تبقى المشاريع من localStorage أو mockProjects
      }
    };
    fetchProjects();
  }, []);

  // Load all data from localStorage on mount
  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Initialize default roles first
        initializeDefaultRoles()
        
        // Load current user
        const userData = localStorage.getItem("currentUser")
        if (userData) {
          const user = JSON.parse(userData)
          const updatedUser = updateUserPermissionsByRole(user)
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        }

        // Load users from localStorage
        const usersData = localStorage.getItem("users")
        if (usersData) {
          const users = JSON.parse(usersData)
          console.log("Loading users from localStorage:", users)
          // Replace all users with localStorage data
          users.forEach((user: any) => {
            // Update user permissions based on current role
            const updatedUser = updateUserPermissionsByRole(user)
            const existingUser = state.users.find(u => u.id === user.id)
            if (existingUser) {
              // Update existing user
              dispatch({ type: "UPDATE_USER", payload: updatedUser })
            } else {
              // Add new user
              dispatch({ type: "ADD_USER", payload: updatedUser })
            }
          })
        }

        // Load projects - always load from localStorage to ensure all users see all projects
        const projectsData = localStorage.getItem("projects")
        if (projectsData) {
          const projects = JSON.parse(projectsData)
          console.log("Loading projects from localStorage:", projects)
          // Replace all projects with localStorage data to ensure consistency
          dispatch({ type: "LOAD_PROJECTS", payload: projects })
        }

        // Load clients - always load from localStorage to ensure all users see all clients
        const clientsData = localStorage.getItem("clients")
        if (clientsData) {
          const clients = JSON.parse(clientsData)
          console.log("Loading clients from localStorage:", clients)
          // Replace all clients with localStorage data to ensure consistency
          dispatch({ type: "LOAD_CLIENTS", payload: clients })
        }

        // Load tasks - always load from localStorage to ensure all users see all tasks
        const tasksData = localStorage.getItem("tasks")
        if (tasksData) {
          const tasks = JSON.parse(tasksData)
          console.log("Loading tasks from localStorage:", tasks)
          // Replace all tasks with localStorage data to ensure consistency
          dispatch({ type: "LOAD_TASKS", payload: tasks })
        }

        // Load transactions (only if not already loaded)
        const transactionsData = localStorage.getItem("transactions")
        if (transactionsData && state.transactions.length === mockTransactions.length) {
          const transactions = JSON.parse(transactionsData)
          transactions.forEach((transaction: any) => {
            // Check if transaction already exists
            const existingTransaction = state.transactions.find(t => t.id === transaction.id)
            if (!existingTransaction) {
              dispatch({ type: "ADD_TRANSACTION", payload: transaction })
            }
          })
        }

        // Load notifications from localStorage
        const notificationsData = localStorage.getItem("notifications")
        if (notificationsData) {
          const notifications = JSON.parse(notificationsData)
          console.log("Loading notifications from localStorage:", notifications)
          // Replace all notifications with localStorage data
          notifications.forEach((notification: any) => {
            // Check if notification already exists
            const existingNotification = state.notifications.find(n => n.id === notification.id)
            if (!existingNotification) {
              dispatch({ type: "ADD_NOTIFICATION", payload: notification })
            }
          })
        }

        // Load attendance records - always load from localStorage to ensure manager sees all records
        const attendanceData = localStorage.getItem("attendanceRecords")
        if (attendanceData) {
          const attendanceRecords = JSON.parse(attendanceData)
          console.log("Loading attendance records from localStorage:", attendanceRecords)
          // Replace all attendance records with localStorage data to ensure consistency
          dispatch({ type: "LOAD_ATTENDANCE", payload: attendanceRecords })
        }

        // Load upcoming payments
        const paymentsData = localStorage.getItem("upcomingPayments")
        if (paymentsData) {
          const upcomingPayments = JSON.parse(paymentsData)
          upcomingPayments.forEach((payment: any) => {
            // Check if payment already exists
            const existingPayment = state.upcomingPayments.find(p => p.id === payment.id)
            if (!existingPayment) {
              dispatch({ type: "ADD_UPCOMING_PAYMENT", payload: payment })
            }
          })
        }

        // Load company settings
        const settingsData = localStorage.getItem("companySettings")
        if (settingsData) {
          const companySettings = JSON.parse(settingsData)
          dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: companySettings })
        }

        // Load user settings
        const userSettingsData = localStorage.getItem("userSettings")
        if (userSettingsData) {
          const userSettings = JSON.parse(userSettingsData)
          const userId = state.currentUser?.id || "1"
          const userSettingsWithUserId: UserSettings = {
            ...userSettings,
            userId: userId,
            emailNotifications: userSettings.emailNotifications ?? true,
            taskNotifications: userSettings.taskNotifications ?? true,
            projectNotifications: userSettings.projectNotifications ?? true,
            financeNotifications: userSettings.financeNotifications ?? true,
            systemNotifications: userSettings.systemNotifications ?? true,
          }
          dispatch({ type: "UPDATE_USER_SETTINGS", payload: userSettingsWithUserId })
        }

        // Load role permissions
        const rolePermissionsData = localStorage.getItem("rolePermissions")
        if (rolePermissionsData) {
          const rolePermissions = JSON.parse(rolePermissionsData)
          // Update the rolePermissions in auth.ts
          Object.assign(require("../auth").rolePermissions, rolePermissions)
        }

        // Load job roles
        const jobRolesData = localStorage.getItem("jobRoles")
        if (jobRolesData) {
          const jobRoles = JSON.parse(jobRolesData)
          // Store job roles in localStorage for access in settings
          localStorage.setItem("jobRoles", JSON.stringify(jobRoles))
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error)
      } finally {
        setIsAuthLoading(false)
      }
    }

    loadDataFromStorage()
  }, [])

  // Save state changes to localStorage
  useEffect(() => {
    saveDataToStorage()
  }, [state.users, state.projects, state.clients, state.tasks, state.transactions, state.notifications, state.attendanceRecords, state.upcomingPayments, state.companySettings, state.userSettings])

  // تحسين حفظ البيانات في localStorage
  const saveDataToStorage = () => {
    if (typeof window === "undefined") return

    try {
      // حفظ البيانات مع timestamp للتأكد من التحديث
      const dataToSave = {
        users: state.users,
        projects: state.projects,
        clients: state.clients,
        tasks: state.tasks,
        transactions: state.transactions,
        notifications: state.notifications,
        attendanceRecords: state.attendanceRecords,
        upcomingPayments: state.upcomingPayments,
        companySettings: state.companySettings,
        userSettings: state.userSettings,
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem("appData", JSON.stringify(dataToSave))
      
      // حفظ البيانات بشكل منفصل أيضاً للتوافق
      localStorage.setItem("users", JSON.stringify(state.users))
      localStorage.setItem("projects", JSON.stringify(state.projects))
      localStorage.setItem("clients", JSON.stringify(state.clients))
      localStorage.setItem("tasks", JSON.stringify(state.tasks))
      localStorage.setItem("transactions", JSON.stringify(state.transactions))
      localStorage.setItem("notifications", JSON.stringify(state.notifications))
      localStorage.setItem("attendanceRecords", JSON.stringify(state.attendanceRecords))
      localStorage.setItem("upcomingPayments", JSON.stringify(state.upcomingPayments))
      localStorage.setItem("companySettings", JSON.stringify(state.companySettings))
      if (state.userSettings) {
        localStorage.setItem("userSettings", JSON.stringify(state.userSettings))
      }
    } catch (error) {
      console.error("خطأ في حفظ البيانات:", error)
    }
  }

  // تحسين تحميل البيانات من localStorage
  const loadDataFromStorage = () => {
    if (typeof window === "undefined") return

    try {
      // محاولة تحميل البيانات المجمعة أولاً
      const appData = localStorage.getItem("appData")
      if (appData) {
        const parsedData = JSON.parse(appData)
        if (parsedData.lastUpdated) {
          // تحميل البيانات المجمعة إذا كانت موجودة
          dispatch({ type: "SET_CURRENT_USER", payload: state.currentUser })
          if (parsedData.users) dispatch({ type: "LOAD_USERS", payload: parsedData.users })
          if (parsedData.projects) dispatch({ type: "LOAD_PROJECTS", payload: parsedData.projects })
          if (parsedData.clients) dispatch({ type: "LOAD_CLIENTS", payload: parsedData.clients })
          if (parsedData.tasks) dispatch({ type: "LOAD_TASKS", payload: parsedData.tasks })
          if (parsedData.transactions) dispatch({ type: "LOAD_TRANSACTIONS", payload: parsedData.transactions })
          if (parsedData.notifications) dispatch({ type: "LOAD_NOTIFICATIONS", payload: parsedData.notifications })
          if (parsedData.attendanceRecords) dispatch({ type: "LOAD_ATTENDANCE", payload: parsedData.attendanceRecords })
          if (parsedData.upcomingPayments) dispatch({ type: "LOAD_UPCOMING_PAYMENTS", payload: parsedData.upcomingPayments })
          if (parsedData.companySettings) dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: parsedData.companySettings })
          if (parsedData.userSettings) dispatch({ type: "UPDATE_USER_SETTINGS", payload: parsedData.userSettings })
          return
        }
      }

      // تحميل البيانات المنفصلة كبديل
      const users = localStorage.getItem("users")
      const projects = localStorage.getItem("projects")
      const clients = localStorage.getItem("clients")
      const tasks = localStorage.getItem("tasks")
      const transactions = localStorage.getItem("transactions")
      const notifications = localStorage.getItem("notifications")
      const attendanceRecords = localStorage.getItem("attendanceRecords")
      const upcomingPayments = localStorage.getItem("upcomingPayments")
      const companySettings = localStorage.getItem("companySettings")
      const userSettings = localStorage.getItem("userSettings")

      if (users) dispatch({ type: "LOAD_USERS", payload: JSON.parse(users) })
      if (projects) dispatch({ type: "LOAD_PROJECTS", payload: JSON.parse(projects) })
      if (clients) dispatch({ type: "LOAD_CLIENTS", payload: JSON.parse(clients) })
      if (tasks) dispatch({ type: "LOAD_TASKS", payload: JSON.parse(tasks) })
      if (transactions) dispatch({ type: "LOAD_TRANSACTIONS", payload: JSON.parse(transactions) })
      if (notifications) dispatch({ type: "LOAD_NOTIFICATIONS", payload: JSON.parse(notifications) })
      if (attendanceRecords) dispatch({ type: "LOAD_ATTENDANCE", payload: JSON.parse(attendanceRecords) })
      if (upcomingPayments) dispatch({ type: "LOAD_UPCOMING_PAYMENTS", payload: JSON.parse(upcomingPayments) })
      if (companySettings) dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: JSON.parse(companySettings) })
      if (userSettings) dispatch({ type: "UPDATE_USER_SETTINGS", payload: JSON.parse(userSettings) })
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error)
    }
  }

  // استمع لتغير حالة الاتصال:
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // عند أي تغيير في البيانات، إذا online أرسل broadcast، إذا offline أضف لقائمة الانتظار:
  const broadcastOrQueue = (type: string, data: any, isOnline: boolean, setPendingUpdates: any) => {
    if (isOnline) {
      if (window.realtimeUpdates) {
        window.realtimeUpdates.broadcastUpdate(type, data)
      }
    } else {
      setPendingUpdates((prev: any[]) => [...prev, { type, data }])
    }
  }

  // عند عودة الاتصال أرسل كل التحديثات المعلقة:
  useEffect(() => {
    if (isOnline && pendingUpdates.length > 0) {
      pendingUpdates.forEach(update => {
        if (window.realtimeUpdates) {
          window.realtimeUpdates.broadcastUpdate(update.type, update.data)
        }
      })
      setPendingUpdates([])
    }
  }, [isOnline])

  // استقبل التحديثات من الخادم وحدث الحالة فورياً:
  useEffect(() => {
    if (window.realtimeUpdates) {
      window.realtimeUpdates.subscribe('*', (data: any) => {
        // مثال: إذا كان التحديث لمستخدم
        if (data && data.id) {
          dispatch({ type: 'UPDATE_USER', payload: data })
        }
        // أضف منطق التحديث لباقي الأنواع حسب الحاجة
      })
    }
  }, [])

  // @ts-ignore
  if (typeof window !== 'undefined' && !window.realtimeUpdates) {
    window.realtimeUpdates = undefined;
  }

  return <AppContext.Provider value={{ state, dispatch, isAuthLoading }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Helper functions for common operations
export function useAppActions() {
  const { dispatch, state } = useApp()
  const currentUser = state.currentUser
  const { toast } = useToast()

  // Loading state management
  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading })
  }

  const setLoadingState = (key: keyof AppState['loadingStates'], value: boolean) => {
    dispatch({ type: "SET_LOADING_STATE", payload: { key, value } })
  }

  // Toast notification helpers
  const showSuccessToast = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  }

  const showErrorToast = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    })
  }

  const showWarningToast = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  }

  // دالة لإنشاء معاملة مالية تلقائياً عند إنشاء مشروع
  const createProjectWithFinancialTransaction = async (project: Project) => {
    try {
      setLoadingState('projects', true)
      
      // إضافة المشروع
      dispatch({ type: "ADD_PROJECT", payload: project })
      
      // إنشاء معاملة مالية للدفعة المقدمة
      if (project.downPayment > 0) {
        const downPaymentTransaction: Transaction = {
          id: Date.now().toString() + "_dp",
          type: "income",
          amount: project.downPayment,
          description: `دفعة مقدمة - مشروع ${project.name}`,
          clientId: project.clientId,
          clientName: project.client,
          projectId: project.id,
          projectName: project.name,
          category: "دفعة مقدمة",
          transactionType: "design",
          importance: project.importance,
          paymentMethod: "transfer",
          date: project.startDate,
          status: "completed",
          createdBy: currentUser?.id || "",
          createdAt: new Date().toISOString(),
        }
        
        dispatch({ type: "ADD_TRANSACTION", payload: downPaymentTransaction })
      }
      
      // حفظ البيانات
      saveDataToStorage()
      
      showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء مشروع "${project.name}" مع المعاملات المالية المرتبطة`)
    } catch (error) {
      showErrorToast("خطأ في إنشاء المشروع", "حدث خطأ أثناء إنشاء المشروع")
      console.error("Error creating project:", error)
    } finally {
      setLoadingState('projects', false)
    }
  }

  // دالة لتحديث معاملة مالية عند تحديث المشروع
  const updateProjectWithFinancialTransaction = async (project: Project) => {
    try {
      setLoadingState('projects', true);
      // تحديث المشروع في الباكند أولاً
      const response = await api.projects.update(project.id, project);
      if (response && response.success) {
        await updateProjectWithFinancialTransaction(project);
        // إرسال تحديث فوري
        if (window.realtimeUpdates) {
          window.realtimeUpdates.sendProjectUpdate({ action: 'update', project });
        }
        // إشعار للمهندس المسؤول إذا تم تغيير المهندس
        if (project.assignedEngineerId && project.assignedEngineerId !== currentUser?.id) {
          addNotification({
            userId: project.assignedEngineerId,
            title: "تم تحديث مشروع مُعيّن لك",
            message: `تم تحديث مشروع "${project.name}"`,
            type: "project",
            actionUrl: `/projects/${project.id}`,
            triggeredBy: currentUser?.id || "",
            isRead: false,
          });
        }
        showSuccessToast("تم تحديث المشروع بنجاح", `تم تحديث مشروع \"${project.name}\"`);
      } else {
        showErrorToast("خطأ في تحديث المشروع", response?.error || "فشل التحديث في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في تحديث المشروع", "حدث خطأ أثناء تحديث المشروع");
      console.error("Error updating project:", error);
    } finally {
      setLoadingState('projects', false);
    }
  };

  const addNotification = async (notification: Omit<Notification, "id" | "createdAt">) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      const data = await res.json();
      if (data.success) {
        const newNotification: Notification = data.data;
        dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });
        // إرسال إشعار فوري لجميع المستخدمين
        realtimeUpdates.sendNotification(newNotification);
        // Show browser notification if it's for the current user
        if (newNotification.userId === currentUser?.id && 'Notification' in window && Notification.permission === 'granted') {
          const browserNotification = new Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/logo.png",
            badge: "/logo.png",
            tag: newNotification.id,
            requireInteraction: true,
          });
          browserNotification.onclick = () => {
            if (newNotification.actionUrl) {
              window.focus();
              window.location.href = newNotification.actionUrl;
            }
            browserNotification.close();
          };
        }
      }
    } catch (err) {
      // fallback: dispatch محلي فقط
      const fallbackNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_NOTIFICATION", payload: fallbackNotification });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "UPDATE_NOTIFICATION", payload: data.data });
      }
    } catch (err) {
      // fallback: تحديث محلي فقط
      const notification = state.notifications.find((n) => n.id === notificationId);
      if (notification) {
        dispatch({ type: "UPDATE_NOTIFICATION", payload: { ...notification, isRead: true } });
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
      } else {
        // يمكن عرض رسالة خطأ للمستخدم هنا
        console.error("فشل حذف الإشعار من قاعدة البيانات", data.error);
      }
    } catch (err) {
      // fallback: حذف محلي فقط
      dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
      console.error("حدث خطأ أثناء حذف الإشعار من قاعدة البيانات", err);
    }
  };

  const createProjectWithDownPayment = async (project: Project) => {
    await createProjectWithFinancialTransaction(project)
    
    // إرسال تحديث فوري
    realtimeUpdates.sendProjectUpdate({ action: 'create', project })
    
    // إضافة إشعار للمهندس المسؤول
    if (project.assignedEngineerId && project.assignedEngineerId !== currentUser?.id) {
      addNotification({
        userId: project.assignedEngineerId,
        title: "مشروع جديد مُعيّن لك",
        message: `تم تعيين مشروع "${project.name}" لك`,
        type: "project",
        actionUrl: `/projects/${project.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  const updateProjectWithDownPayment = async (project: Project) => {
    await updateProjectWithFinancialTransaction(project)
    
    // إرسال تحديث فوري
    realtimeUpdates.sendProjectUpdate({ action: 'update', project })
    
    // إضافة إشعار للمهندس المسؤول إذا تم تغيير المهندس
    if (project.assignedEngineerId && project.assignedEngineerId !== currentUser?.id) {
      addNotification({
        userId: project.assignedEngineerId,
        title: "تم تحديث مشروع مُعيّن لك",
        message: `تم تحديث مشروع "${project.name}"`,
        type: "project",
        actionUrl: `/projects/${project.id}`,
        triggeredBy: currentUser?.id || "",
        isRead: false,
      })
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      setLoadingState('projects', true);
      // حذف المشروع من الباكند أولاً
      const response = await api.projects.delete(projectId);
      if (response && response.success) {
        dispatch({ type: "DELETE_PROJECT", payload: projectId });
        // Broadcast realtime update
        const project = state.projects.find(p => p.id === projectId);
        if (window.realtimeUpdates && project) {
          window.realtimeUpdates.sendProjectUpdate({ action: 'delete', project });
        }
        showSuccessToast("تم حذف المشروع بنجاح", project ? `تم حذف مشروع \"${project.name}\"` : "تم حذف المشروع");
      } else {
        showErrorToast("خطأ في حذف المشروع", response?.error || "فشل الحذف في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في حذف المشروع", "حدث خطأ أثناء حذف المشروع");
      console.error("Error deleting project:", error);
    } finally {
      setLoadingState('projects', false);
    }
  };

  const setCurrentUser = (user: User | null) => {
    dispatch({ type: "SET_CURRENT_USER", payload: user })
  }

  const logout = () => {
    // Clear only user-specific data from localStorage
    localStorage.removeItem("currentUser")
    localStorage.removeItem("attendanceRecords")

    // Keep important system data like roles, permissions, users, etc.
    // localStorage.removeItem("projects"); // Keep projects
    // localStorage.removeItem("tasks"); // Keep tasks
    // localStorage.removeItem("finance"); // Keep finance
    // localStorage.removeItem("clients"); // Keep clients
    // localStorage.removeItem("notifications"); // Keep notifications
    // localStorage.removeItem("rolePermissions"); // Keep role permissions
    // localStorage.removeItem("jobRoles"); // Keep job roles
    // localStorage.removeItem("users"); // Keep users

    // Clear any other session data
    sessionStorage.clear()

    // Force redirect to home page
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  const refreshCurrentUser = () => {
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      const updatedUser = updateUserPermissionsByRole(user)
      dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
    }
  }

  const saveDataToStorage = () => {
    try {
      // Save all data to localStorage
      localStorage.setItem("users", JSON.stringify(state.users))
      localStorage.setItem("projects", JSON.stringify(state.projects))
      localStorage.setItem("tasks", JSON.stringify(state.tasks))
      localStorage.setItem("transactions", JSON.stringify(state.transactions))
      localStorage.setItem("clients", JSON.stringify(state.clients))
      localStorage.setItem("notifications", JSON.stringify(state.notifications))
      localStorage.setItem("attendanceRecords", JSON.stringify(state.attendanceRecords))
      localStorage.setItem("upcomingPayments", JSON.stringify(state.upcomingPayments))
      
      if (state.currentUser) {
        localStorage.setItem("currentUser", JSON.stringify(state.currentUser))
      }
      
      console.log("All data saved to localStorage successfully")
    } catch (error) {
      console.error("Error saving data to localStorage:", error)
      showErrorToast("خطأ في حفظ البيانات", "حدث خطأ أثناء حفظ البيانات")
    }
  }

  // Enhanced CRUD operations with loading states and toast notifications
  const createTask = async (task: Task) => {
    try {
      setLoadingState('tasks', true)
      dispatch({ type: "ADD_TASK", payload: task })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTaskUpdate({ action: 'create', task })
      
      showSuccessToast("تم إنشاء المهمة بنجاح", `تم إنشاء مهمة "${task.title}"`)
    } catch (error) {
      showErrorToast("خطأ في إنشاء المهمة", "حدث خطأ أثناء إنشاء المهمة")
    } finally {
      setLoadingState('tasks', false)
    }
  }

  const updateTask = async (task: Task) => {
    try {
      setLoadingState('tasks', true)
      dispatch({ type: "UPDATE_TASK", payload: task })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTaskUpdate({ action: 'update', task })
      
      showSuccessToast("تم تحديث المهمة بنجاح", `تم تحديث مهمة "${task.title}"`)
    } catch (error) {
      showErrorToast("خطأ في تحديث المهمة", "حدث خطأ أثناء تحديث المهمة")
    } finally {
      setLoadingState('tasks', false)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      setLoadingState('tasks', true)
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) {
        showErrorToast("خطأ في حذف المهمة", "المهمة غير موجودة")
        return
      }

      dispatch({ type: "DELETE_TASK", payload: taskId })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTaskUpdate({ action: 'delete', task })
      
      showSuccessToast("تم حذف المهمة بنجاح", `تم حذف مهمة "${task.title}"`)
    } catch (error) {
      showErrorToast("خطأ في حذف المهمة", "حدث خطأ أثناء حذف المهمة")
    } finally {
      setLoadingState('tasks', false)
    }
  }

  const createClient = async (client: Client) => {
    try {
      setLoadingState('clients', true)
      dispatch({ type: "ADD_CLIENT", payload: client })
      saveDataToStorage()
      showSuccessToast("تم إنشاء العميل بنجاح", `تم إنشاء عميل "${client.name}"`)
    } catch (error) {
      showErrorToast("خطأ في إنشاء العميل", "حدث خطأ أثناء إنشاء العميل")
    } finally {
      setLoadingState('clients', false)
    }
  }

  const updateClient = async (client: Client) => {
    try {
      setLoadingState('clients', true)
      dispatch({ type: "UPDATE_CLIENT", payload: client })
      saveDataToStorage()
      showSuccessToast("تم تحديث العميل بنجاح", `تم تحديث عميل "${client.name}"`)
    } catch (error) {
      showErrorToast("خطأ في تحديث العميل", "حدث خطأ أثناء تحديث العميل")
    } finally {
      setLoadingState('clients', false)
    }
  }

  const deleteClient = async (clientId: string) => {
    try {
      setLoadingState('clients', true)
      const client = state.clients.find(c => c.id === clientId)
      if (!client) {
        showErrorToast("خطأ في حذف العميل", "العميل غير موجود")
        return
      }

      // Check if client has projects
      const clientProjects = state.projects.filter(p => p.clientId === clientId)
      if (clientProjects.length > 0) {
        showErrorToast("لا يمكن حذف العميل", "العميل مرتبط بمشاريع")
        return
      }

      dispatch({ type: "DELETE_CLIENT", payload: clientId })
      saveDataToStorage()
      showSuccessToast("تم حذف العميل بنجاح", `تم حذف عميل "${client.name}"`)
    } catch (error) {
      showErrorToast("خطأ في حذف العميل", "حدث خطأ أثناء حذف العميل")
    } finally {
      setLoadingState('clients', false)
    }
  }

  const createTransaction = async (transaction: Transaction) => {
    try {
      setLoadingState('transactions', true)
      dispatch({ type: "ADD_TRANSACTION", payload: transaction })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTransactionUpdate({ action: 'create', transaction })
      
      showSuccessToast("تم إنشاء المعاملة بنجاح", `تم إنشاء معاملة بقيمة ${transaction.amount} ريال`)
    } catch (error) {
      showErrorToast("خطأ في إنشاء المعاملة", "حدث خطأ أثناء إنشاء المعاملة")
    } finally {
      setLoadingState('transactions', false)
    }
  }

  const updateTransaction = async (transaction: Transaction) => {
    try {
      setLoadingState('transactions', true)
      dispatch({ type: "UPDATE_TRANSACTION", payload: transaction })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTransactionUpdate({ action: 'update', transaction })
      
      showSuccessToast("تم تحديث المعاملة بنجاح", `تم تحديث معاملة بقيمة ${transaction.amount} ريال`)
    } catch (error) {
      showErrorToast("خطأ في تحديث المعاملة", "حدث خطأ أثناء تحديث المعاملة")
    } finally {
      setLoadingState('transactions', false)
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      setLoadingState('transactions', true)
      const transaction = state.transactions.find(t => t.id === transactionId)
      if (!transaction) {
        showErrorToast("خطأ في حذف المعاملة", "المعاملة غير موجودة")
        return
      }

      dispatch({ type: "DELETE_TRANSACTION", payload: transactionId })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      realtimeUpdates.sendTransactionUpdate({ action: 'delete', transaction })
      
      showSuccessToast("تم حذف المعاملة بنجاح", `تم حذف معاملة بقيمة ${transaction.amount} ريال`)
    } catch (error) {
      showErrorToast("خطأ في حذف المعاملة", "حدث خطأ أثناء حذف المعاملة")
    } finally {
      setLoadingState('transactions', false)
    }
  }

  // Realtime broadcast functions
  const broadcastProjectUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      realtimeUpdates.sendProjectUpdate({ action, ...data })
    } catch (error) {
      console.error('Failed to broadcast project update:', error)
    }
  }

  const broadcastTaskUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      realtimeUpdates.sendTaskUpdate({ action, ...data })
    } catch (error) {
      console.error('Failed to broadcast task update:', error)
    }
  }

  const broadcastClientUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      realtimeUpdates.sendClientUpdate({ action, ...data })
    } catch (error) {
      console.error('Failed to broadcast client update:', error)
    }
  }

  const broadcastTransactionUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      console.log('Transaction update:', action, data);
      // Realtime functionality temporarily disabled for SSR compatibility
    } catch (error) {
      console.error('Failed to broadcast transaction update:', error)
    }
  }

  const broadcastNotificationUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      console.log('Notification update:', action, data);
      // Realtime functionality temporarily disabled for SSR compatibility
    } catch (error) {
      console.error('Failed to broadcast notification update:', error)
    }
  }

  const broadcastUserUpdate = async (action: 'create' | 'update' | 'delete', data: any) => {
    try {
      console.log('User update:', action, data);
      // Realtime functionality temporarily disabled for SSR compatibility
    } catch (error) {
      console.error('Failed to broadcast user update:', error)
    }
  }

  const broadcastAttendanceUpdate = async (action: 'create' | 'update', data: any) => {
    try {
      console.log('Attendance update:', action, data);
      // Realtime functionality temporarily disabled for SSR compatibility
    } catch (error) {
      console.error('Failed to broadcast attendance update:', error)
    }
  }

  return {
    // Loading state management
    setLoading,
    setLoadingState,
    
    // Toast notifications
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    
    // Enhanced CRUD operations
    createProjectWithFinancialTransaction,
    updateProjectWithFinancialTransaction,
    createProjectWithDownPayment,
    updateProjectWithDownPayment,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    createClient,
    updateClient,
    deleteClient,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Notification management
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    
    // User management
    setCurrentUser,
    logout,
    refreshCurrentUser,
    
    // Data persistence
    saveDataToStorage,
    
    // Realtime updates
    broadcastProjectUpdate,
    broadcastTaskUpdate,
    broadcastClientUpdate,
    broadcastTransactionUpdate,
    broadcastNotificationUpdate,
    broadcastUserUpdate,
    broadcastAttendanceUpdate,
  }
}
