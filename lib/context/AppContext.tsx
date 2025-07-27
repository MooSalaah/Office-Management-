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
import { useToast } from "@/components/ui/use-toast"
import { realtimeUpdates } from "../realtime-updates"
import { api } from "../api";
import { logger } from "../logger";

// تعريف اختياري لـ window.realtimeUpdates لتفادي أخطاء linter
// @ts-ignore
interface Window { realtimeUpdates?: unknown }

declare global {
  interface Window {
    realtimeUpdates?: unknown;
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
  | { type: "UPDATE_COMPANY_INFO"; payload: Record<string, unknown> }
  | { type: "UPDATE_NOTIFICATION_SETTINGS"; payload: Record<string, unknown> }
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
          notificationSettings: {
            emailNotifications: (action.payload as any).emailNotifications ?? state.userSettings.notificationSettings?.emailNotifications ?? state.userSettings.emailNotifications,
            taskNotifications: (action.payload as any).taskNotifications ?? state.userSettings.notificationSettings?.taskNotifications ?? state.userSettings.taskNotifications,
            projectNotifications: (action.payload as any).projectNotifications ?? state.userSettings.notificationSettings?.projectNotifications ?? state.userSettings.projectNotifications,
            financeNotifications: (action.payload as any).financeNotifications ?? state.userSettings.notificationSettings?.financeNotifications ?? state.userSettings.financeNotifications,
            systemNotifications: (action.payload as any).systemNotifications ?? state.userSettings.notificationSettings?.systemNotifications ?? state.userSettings.systemNotifications,
            browserNotifications: (action.payload as any).browserNotifications ?? true,
          }
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
              (window as any).realtimeUpdates.on('notification', (notification: Notification) => {
        // تحقق إذا كان الإشعار موجود مسبقاً
        if (!state.notifications.some(n => n.id === notification.id)) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        }
      })
    }
    logger.info('Realtime updates disabled for SSR compatibility', undefined, 'REALTIME');
  }, [state.currentUser?.id, state.notifications])

  // جلب المستخدمين من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        dispatch({ type: "SET_LOADING_STATE", payload: { key: 'users', value: true } });
        const response = await api.users.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          logger.info("تم جلب المستخدمين من الباكند", { count: response.data.length }, 'USERS');
          // استبدال جميع المستخدمين ببيانات قاعدة البيانات
          dispatch({ type: "LOAD_USERS", payload: response.data });
          
          // تحديث المستخدم الحالي إذا كان موجوداً في قاعدة البيانات
          const currentUserData = localStorage.getItem("currentUser");
          if (currentUserData) {
            const currentUser = JSON.parse(currentUserData);
            const currentUserFromDB = response.data.find((u: User) => 
              u.email === currentUser.email || 
              u.name === currentUser.name ||
              u.id === currentUser.id
            );
            if (currentUserFromDB) {
              const updatedCurrentUser = updateUserPermissionsByRole(currentUserFromDB);
              dispatch({ type: "SET_CURRENT_USER", payload: updatedCurrentUser });
              localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
              logger.info("تم تحديث المستخدم الحالي ببيانات قاعدة البيانات", { user: updatedCurrentUser }, 'USERS');
            }
          }
          
          // حفظ في localStorage للاستخدام offline
          localStorage.setItem("users", JSON.stringify(response.data));
        } else {
          logger.warn("فشل جلب المستخدمين من الباكند، استخدام localStorage", { response }, 'USERS');
          // استخدام localStorage كبديل
          const usersData = localStorage.getItem("users");
          if (usersData) {
            const users = JSON.parse(usersData);
            dispatch({ type: "LOAD_USERS", payload: users });
          }
        }
      } catch (error) {
        logger.error("خطأ في جلب المستخدمين من الباكند", { error }, 'USERS');
        // استخدام localStorage كبديل
        const usersData = localStorage.getItem("users");
        if (usersData) {
          const users = JSON.parse(usersData);
          dispatch({ type: "LOAD_USERS", payload: users });
        }
      } finally {
        dispatch({ type: "SET_LOADING_STATE", payload: { key: 'users', value: false } });
      }
    };
    
    fetchUsers();
  }, []);

  // جلب المشاريع من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.projects.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          dispatch({ type: "LOAD_PROJECTS", payload: response.data });
        }
      } catch (error) {
        logger.error("فشل جلب المشاريع من الباكند", { error }, 'API');
        // في حال الفشل، تبقى المشاريع من localStorage أو mockProjects
      }
    };
    fetchProjects();
  }, []);

  // جلب العملاء من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.clients.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          dispatch({ type: "LOAD_CLIENTS", payload: response.data });
        }
      } catch (error) {
        logger.error("فشل جلب العملاء من الباكند", { error }, 'API');
        // في حال الفشل، تبقى العملاء من localStorage أو mockClients
      }
    };
    fetchClients();
  }, []);

  // جلب الإشعارات من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        dispatch({ type: "SET_LOADING_STATE", payload: { key: 'notifications', value: true } });
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const result = await response.json();
          if (result && result.success && Array.isArray(result.data)) {
            dispatch({ type: "LOAD_NOTIFICATIONS", payload: result.data });
            logger.info('Notifications loaded from database', { 
              count: result.data.length 
            }, 'NOTIFICATIONS');
          } else {
            logger.warn('Invalid notifications response format', { result }, 'NOTIFICATIONS');
          }
        } else {
          logger.error('Failed to fetch notifications from API', { 
            status: response.status 
          }, 'NOTIFICATIONS');
        }
      } catch (error) {
        logger.error('Error fetching notifications', { error }, 'NOTIFICATIONS');
      } finally {
        dispatch({ type: "SET_LOADING_STATE", payload: { key: 'notifications', value: false } });
      }
    };
    
    fetchNotifications();
  }, []);

  // تحديث الإشعارات تلقائياً كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const result = await response.json();
          if (result && result.success && Array.isArray(result.data)) {
            // تحديث الإشعارات فقط إذا كان هناك تغيير
            const currentNotifications = state.notifications;
            const newNotifications = result.data;
            
            // مقارنة عدد الإشعارات
            if (currentNotifications.length !== newNotifications.length) {
              dispatch({ type: "LOAD_NOTIFICATIONS", payload: newNotifications });
              logger.info('Notifications updated from database', { 
                oldCount: currentNotifications.length,
                newCount: newNotifications.length
              }, 'NOTIFICATIONS');
            } else {
              // مقارنة آخر إشعار
              const lastCurrentNotification = currentNotifications[0];
              const lastNewNotification = newNotifications[0];
              
              if (lastCurrentNotification?.id !== lastNewNotification?.id) {
                dispatch({ type: "LOAD_NOTIFICATIONS", payload: newNotifications });
                logger.info('New notifications detected, updated from database', { 
                  count: newNotifications.length
                }, 'NOTIFICATIONS');
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error updating notifications', { error }, 'NOTIFICATIONS');
      }
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [state.notifications.length]);

  // جلب المهام من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.tasks.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          logger.info("تم جلب المهام من الباكند", { count: response.data.length }, 'TASKS');
          dispatch({ type: "LOAD_TASKS", payload: response.data });
        }
      } catch (error) {
        logger.error("فشل جلب المهام من الباكند", { error }, 'API');
        // في حال الفشل، تبقى المهام من localStorage أو mockTasks
      }
    };
    fetchTasks();
  }, []);

  // جلب الأدوار من الباكند عند بدء التطبيق
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.roles.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          logger.info("تم جلب الأدوار من الباكند", { count: response.data.length }, 'ROLES');
          // حفظ الأدوار في localStorage للاستخدام في الإعدادات
          localStorage.setItem("jobRoles", JSON.stringify(response.data));
          
          // تحديث rolePermissions بناءً على الأدوار الجديدة
          const rolePermissions: any = {};
          response.data.forEach((role: any) => {
            rolePermissions[role.id] = {
              name: role.name,
              description: role.description,
              permissions: role.permissions,
              modules: role.modules || []
            };
          });
          localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));
        }
      } catch (error) {
        logger.error("فشل جلب الأدوار من الباكند", { error }, 'API');
        // في حال الفشل، تبقى الأدوار من localStorage
      }
    };
    fetchRoles();
  }, []);

  // Load all data from localStorage on mount
  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Initialize default roles first
        initializeDefaultRoles()
        
        // Load current user from localStorage first
        const userData = localStorage.getItem("currentUser")
        if (userData) {
          const user = JSON.parse(userData)
          const updatedUser = updateUserPermissionsByRole(user)
          dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
        }

        // Load users from database first, then fallback to localStorage
        try {
          const response = await fetch('/api/users');
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
              logger.debug("Loading users from database", { users: data.data }, 'DATABASE');
              // Replace all users with database data
              data.data.forEach((user: User) => {
                const updatedUser = updateUserPermissionsByRole(user)
                dispatch({ type: "UPDATE_USER", payload: updatedUser })
              })
              // Save to localStorage for offline access
              localStorage.setItem("users", JSON.stringify(data.data))
              
              // Update current user with database data if exists
              const currentUserData = localStorage.getItem("currentUser");
              if (currentUserData) {
                const currentUser = JSON.parse(currentUserData);
                const currentUserFromDB = data.data.find((u: User) => 
                  u.email === currentUser.email || 
                  u.name === currentUser.name ||
                  u.id === currentUser.id
                );
                if (currentUserFromDB) {
                  const updatedCurrentUser = updateUserPermissionsByRole(currentUserFromDB);
                  dispatch({ type: "SET_CURRENT_USER", payload: updatedCurrentUser });
                  localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
                  logger.debug("Updated current user with database data", { user: updatedCurrentUser }, 'DATABASE');
                }
              }
            }
          }
        } catch (error) {
          logger.error("Failed to load users from database, falling back to localStorage", { error }, 'DATABASE');
          // Fallback to localStorage
          const usersData = localStorage.getItem("users")
          if (usersData) {
            const users = JSON.parse(usersData)
            logger.debug("Loading users from localStorage", { users }, 'STORAGE');
            // Replace all users with localStorage data
            users.forEach((user: User) => {
              const updatedUser = updateUserPermissionsByRole(user)
              const existingUser = state.users.find(u => u.id === user.id)
              if (existingUser) {
                dispatch({ type: "UPDATE_USER", payload: updatedUser })
              } else {
                dispatch({ type: "ADD_USER", payload: updatedUser })
              }
            })
          }
        }

        // Load projects - always load from localStorage to ensure all users see all projects
        const projectsData = localStorage.getItem("projects")
        if (projectsData) {
          const projects = JSON.parse(projectsData)
          logger.debug("Loading projects from localStorage", { projects }, 'STORAGE');
          // Replace all projects with localStorage data to ensure consistency
          dispatch({ type: "LOAD_PROJECTS", payload: projects })
        }

        // Load clients - always load from localStorage to ensure all users see all clients
        const clientsData = localStorage.getItem("clients")
        if (clientsData) {
          const clients = JSON.parse(clientsData)
          logger.debug("Loading clients from localStorage", { clients }, 'STORAGE');
          // Replace all clients with localStorage data to ensure consistency
          dispatch({ type: "LOAD_CLIENTS", payload: clients })
        }

        // Load tasks - always load from localStorage to ensure all users see all tasks
        const tasksData = localStorage.getItem("tasks")
        if (tasksData) {
          const tasks = JSON.parse(tasksData)
          logger.debug("Loading tasks from localStorage", { tasks }, 'STORAGE');
          // Replace all tasks with localStorage data to ensure consistency
          dispatch({ type: "LOAD_TASKS", payload: tasks })
        }

        // Load transactions (only if not already loaded)
        const transactionsData = localStorage.getItem("transactions")
        if (transactionsData && state.transactions.length === mockTransactions.length) {
          const transactions = JSON.parse(transactionsData)
          transactions.forEach((transaction: Transaction) => {
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
          logger.debug("Loading notifications from localStorage", { notifications }, 'STORAGE');
          // Replace all notifications with localStorage data
          notifications.forEach((notification: Notification) => {
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
          logger.debug("Loading attendance records from localStorage", { attendanceRecords }, 'STORAGE');
          // Replace all attendance records with localStorage data to ensure consistency
          dispatch({ type: "LOAD_ATTENDANCE", payload: attendanceRecords })
        }

        // Load upcoming payments
        const paymentsData = localStorage.getItem("upcomingPayments")
        if (paymentsData) {
          const upcomingPayments = JSON.parse(paymentsData)
          upcomingPayments.forEach((payment: UpcomingPayment) => {
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
        logger.error("Error loading data from localStorage", { error }, 'STORAGE');
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
  const broadcastOrQueue = (type: string, data: unknown, isOnline: boolean, setPendingUpdates: React.Dispatch<React.SetStateAction<unknown[]>>) => {
    if (isOnline) {
      if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
        (window.realtimeUpdates as any).broadcastUpdate(type, data)
      }
    } else {
              setPendingUpdates((prev: unknown[]) => [...prev, { type, data }])
    }
  }

  // عند عودة الاتصال أرسل كل التحديثات المعلقة:
  useEffect(() => {
    if (isOnline && pendingUpdates.length > 0) {
      pendingUpdates.forEach(update => {
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
          (window.realtimeUpdates as any).broadcastUpdate(update.type, update.data)
        }
      })
      setPendingUpdates([])
    }
  }, [isOnline])

  // استقبل التحديثات من الخادم وحدث الحالة فورياً:
  useEffect(() => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).subscribe === 'function') {
      (window.realtimeUpdates as any).subscribe('*', (data: any) => {
        // مثال: إذا كان التحديث لمستخدم
        if (data && typeof data === 'object' && 'id' in data) {
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

  const addNotification = async (notification: Omit<Notification, "id" | "createdAt">) => {
    // التحقق من صحة البيانات
    if (!notification.userId || !notification.title || !notification.message || !notification.type) {
      logger.error('Invalid notification data', { notification }, 'NOTIFICATIONS');
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    // تحقق من إعدادات الإشعارات للمستخدم
    const userSettings = state.userSettings;
    if (userSettings?.notificationSettings) {
      const notificationType = notification.type;
      const notificationKey = `${notificationType}Notifications` as keyof typeof userSettings.notificationSettings;
      const isEnabled = userSettings.notificationSettings[notificationKey] !== false;
      
      if (!isEnabled) {
        logger.info(`Notification disabled for user ${notification.userId}`, { 
          type: notificationType, 
          userId: notification.userId 
        }, 'NOTIFICATIONS');
        return;
      }
    }
    
    // إضافة الإشعار إلى state أولاً
    dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });
    
    // حفظ الإشعار في قاعدة البيانات
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to save notification to database', { 
          status: response.status, 
          error: errorData.error,
          notification: newNotification 
        }, 'NOTIFICATIONS');
      } else {
        const result = await response.json();
        logger.info('Notification saved to database', { 
          id: newNotification.id, 
          type: newNotification.type,
          databaseId: result.data?._id
        }, 'NOTIFICATIONS');
      }
    } catch (error) {
      logger.error('Error saving notification to database', { error }, 'NOTIFICATIONS');
    }
    
    // إرسال تحديث فوري (إذا كان متاحاً)
    try {
      if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
        (window as any).realtimeUpdates.broadcastUpdate('notification', newNotification);
        logger.info('Notification broadcasted via realtime updates', { 
          id: newNotification.id 
        }, 'NOTIFICATIONS');
      }
    } catch (error) {
      logger.error('Error broadcasting notification update', { error }, 'NOTIFICATIONS');
    }
    
    // عرض إشعار المتصفح إذا كان مسموحاً
    try {
      if (userSettings?.notificationSettings?.browserNotifications && 
          'Notification' in window && 
          Notification.permission === 'granted') {
        // إنشاء إشعار المتصفح
        const browserNotification = new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: newNotification.id,
          requireInteraction: false,
          silent: false,
        });

        browserNotification.onclick = () => {
          window.focus();
          if (newNotification.actionUrl) {
            window.location.href = newNotification.actionUrl;
          }
          browserNotification.close();
        };

        // إغلاق تلقائي بعد 5 ثوانٍ
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
        
        logger.info('Browser notification shown', { 
          id: newNotification.id 
        }, 'NOTIFICATIONS');
      }
    } catch (error) {
      logger.error('Error showing browser notification', { error }, 'NOTIFICATIONS');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // تحديث الإشعار في state
    const updatedNotification = state.notifications.find(n => n.id === notificationId);
    if (updatedNotification && !updatedNotification.isRead) {
      const notification = { ...updatedNotification, isRead: true };
      dispatch({ type: "UPDATE_NOTIFICATION", payload: notification });
      
      // حفظ التحديث في قاعدة البيانات
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        });
        
        if (!response.ok) {
          logger.error('Failed to update notification in database', { 
            status: response.status, 
            notificationId 
          }, 'NOTIFICATIONS');
        } else {
          logger.info('Notification marked as read in database', { notificationId }, 'NOTIFICATIONS');
        }
      } catch (error) {
        logger.error('Error updating notification in database', { error, notificationId }, 'NOTIFICATIONS');
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // حذف الإشعار من state
    dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
    
    // حذف الإشعار من قاعدة البيانات
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        logger.error('Failed to delete notification from database', { 
          status: response.status, 
          notificationId 
        }, 'NOTIFICATIONS');
      } else {
        logger.info('Notification deleted from database', { notificationId }, 'NOTIFICATIONS');
      }
    } catch (error) {
      logger.error('Error deleting notification from database', { error, notificationId }, 'NOTIFICATIONS');
    }
  };

  const notifyProjectEngineers = async (project: Project, action: 'update' | 'delete', actorName: string) => {
    try {
      const engineers = state.users.filter(user => user.role === 'engineer' && user.isActive);
      for (const engineer of engineers) {
        await addNotification({
          userId: engineer.id,
          title: `تحديث مشروع: ${project.name}`,
          message: `تم ${action === 'update' ? 'تحديث' : 'حذف'} مشروع "${project.name}" بواسطة ${actorName}`,
          type: 'project',
          triggeredBy: state.currentUser?.id || 'system',
          actionUrl: '/projects',
          isRead: false
        });
      }
    } catch (error) {
      logger.error('فشل في إرسال إشعارات للمهندسين', { error }, 'NOTIFICATIONS');
    }
  };

  const updateProjectWithFinancialTransaction = async (project: Project) => {
    try {
      setLoadingState('projects', true);
      const response = await api.projects.update(project.id, project);
      if (response && response.success) {
        dispatch({ type: "UPDATE_PROJECT", payload: project });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendProjectUpdate === 'function') {
          (window.realtimeUpdates as any).sendProjectUpdate({ action: 'update', project });
        }
        await notifyProjectEngineers(project, 'update', state.currentUser?.name || 'مستخدم');
        showSuccessToast("تم تحديث المشروع بنجاح", `تم تحديث مشروع "${project.name}"`);
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

  const createProjectWithDownPayment = async (project: Project) => {
    try {
      setLoadingState('projects', true);
      const response = await api.projects.create(project);
      if (response && response.success) {
        const newProject = response.data as Project;
        dispatch({ type: "ADD_PROJECT", payload: newProject });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendProjectUpdate === 'function') {
          (window.realtimeUpdates as any).sendProjectUpdate({ action: 'create', project: newProject });
        }
        await notifyProjectEngineers(newProject, 'update', state.currentUser?.name || 'مستخدم');
        showSuccessToast("تم إنشاء المشروع بنجاح", `تم إنشاء مشروع "${newProject.name}"`);
      } else {
        showErrorToast("خطأ في إنشاء المشروع", response?.error || "فشل الإنشاء في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في إنشاء المشروع", "حدث خطأ أثناء إنشاء المشروع");
      console.error("Error creating project:", error);
    } finally {
      setLoadingState('projects', false);
    }
  };

  const updateProjectWithDownPayment = async (project: Project) => {
    try {
      setLoadingState('projects', true);
      const response = await api.projects.update(project.id, project);
      if (response && response.success) {
        dispatch({ type: "UPDATE_PROJECT", payload: project });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendProjectUpdate === 'function') {
          (window.realtimeUpdates as any).sendProjectUpdate({ action: 'update', project });
        }
        await notifyProjectEngineers(project, 'update', state.currentUser?.name || 'مستخدم');
        showSuccessToast("تم تحديث المشروع بنجاح", `تم تحديث مشروع "${project.name}"`);
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

  const deleteProject = async (projectId: string) => {
    try {
      setLoadingState('projects', true);
      const project = state.projects.find(p => p.id === projectId);
      if (!project) {
        showErrorToast("خطأ في حذف المشروع", "المشروع غير موجود");
        return;
      }
      const response = await api.projects.delete(projectId);
      if (response && response.success) {
        dispatch({ type: "DELETE_PROJECT", payload: projectId });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendProjectUpdate === 'function') {
          (window.realtimeUpdates as any).sendProjectUpdate({ action: 'delete', project });
        }
        await notifyProjectEngineers(project, 'delete', state.currentUser?.name || 'مستخدم');
        showSuccessToast("تم حذف المشروع بنجاح", `تم حذف مشروع "${project.name}"`);
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
      
      logger.debug("All data saved to localStorage successfully", undefined, 'STORAGE');
    } catch (error) {
      logger.error("Error saving data to localStorage", { error }, 'STORAGE');
      showErrorToast("خطأ في حفظ البيانات", "حدث خطأ أثناء حفظ البيانات")
    }
  }

  // Enhanced CRUD operations with loading states and toast notifications
  const createTask = async (task: Task) => {
    try {
      setLoadingState('tasks', true);
      const response = await api.tasks.create(task);
      if (response && response.success) {
        const newTask = response.data as Task;
        dispatch({ type: "ADD_TASK", payload: newTask });
        
        // إرسال إشعار للمستخدم المسند إليه المهمة
        if (task.assigneeId && task.assigneeId !== state.currentUser?.id) {
          await addNotification({
            userId: task.assigneeId,
            title: "مهمة جديدة مسندة إليك",
            message: `تم إسناد مهمة جديدة إليك: "${task.title}"`,
            type: "task",
            actionUrl: `/tasks?highlight=${newTask.id}`,
            triggeredBy: state.currentUser?.id || "system",
            isRead: false
          });
        }
        
        // إرسال إشعار عام عن إنشاء المهمة
        await addNotification({
          userId: state.currentUser?.id || "system",
          title: "مهمة جديدة تم إنشاؤها",
          message: `تم إنشاء مهمة "${task.title}" بواسطة ${state.currentUser?.name || "مستخدم"}`,
          type: "task",
          actionUrl: `/tasks?highlight=${newTask.id}`,
          triggeredBy: state.currentUser?.id || "system",
          isRead: false
        });
        
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTaskUpdate === 'function') {
          (window.realtimeUpdates as any).sendTaskUpdate({ action: 'create', task: newTask });
        }
        showSuccessToast("تم إنشاء المهمة بنجاح", `تم إنشاء مهمة "${newTask.title}"`);
      } else {
        showErrorToast("خطأ في إنشاء المهمة", response?.error || "فشل الإنشاء في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في إنشاء المهمة", "حدث خطأ أثناء إنشاء المهمة");
      console.error("Error creating task:", error);
    } finally {
      setLoadingState('tasks', false);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      setLoadingState('tasks', true);
      const response = await api.tasks.update(task.id, task);
      if (response && response.success) {
        dispatch({ type: "UPDATE_TASK", payload: task });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTaskUpdate === 'function') {
          (window.realtimeUpdates as any).sendTaskUpdate({ action: 'update', task });
        }
        showSuccessToast("تم تحديث المهمة بنجاح", `تم تحديث مهمة "${task.title}"`);
      } else {
        showErrorToast("خطأ في تحديث المهمة", response?.error || "فشل التحديث في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في تحديث المهمة", "حدث خطأ أثناء تحديث المهمة");
      console.error("Error updating task:", error);
    } finally {
      setLoadingState('tasks', false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setLoadingState('tasks', true);
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) {
        showErrorToast("خطأ في حذف المهمة", "المهمة غير موجودة");
        return;
      }
      const response = await api.tasks.delete(taskId);
      if (response && response.success) {
        dispatch({ type: "DELETE_TASK", payload: taskId });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTaskUpdate === 'function') {
          (window.realtimeUpdates as any).sendTaskUpdate({ action: 'delete', task });
        }
        showSuccessToast("تم حذف المهمة بنجاح", `تم حذف مهمة "${task.title}"`);
      } else {
        showErrorToast("خطأ في حذف المهمة", response?.error || "فشل الحذف في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في حذف المهمة", "حدث خطأ أثناء حذف المهمة");
      console.error("Error deleting task:", error);
    } finally {
      setLoadingState('tasks', false);
    }
  };

  const createClient = async (client: Client) => {
    try {
      setLoadingState('clients', true)
      
      // حفظ في قاعدة البيانات
      const response = await api.clients.create(client);
      if (!response.success) {
        throw new Error(response.error || 'فشل حفظ العميل في قاعدة البيانات');
      }
      
      // تحديث state
      dispatch({ type: "ADD_CLIENT", payload: response.data || client })
      
      // حفظ في localStorage كنسخة احتياطية
      saveDataToStorage()
      
      // إرسال تحديث فوري
      if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
        (window as any).realtimeUpdates.sendClientUpdate({ 
          action: 'create', 
          client: response.data || client, 
          userId: state.currentUser?.id, 
          userName: state.currentUser?.name 
        });
      }
      
      showSuccessToast("تم إنشاء العميل بنجاح", `تم إنشاء عميل "${client.name}"`)
    } catch (error) {
      logger.error("خطأ في إنشاء العميل", { error }, 'CLIENTS');
      showErrorToast("خطأ في إنشاء العميل", "حدث خطأ أثناء إنشاء العميل")
    } finally {
      setLoadingState('clients', false)
    }
  }

  const updateClient = async (client: Client) => {
    try {
      setLoadingState('clients', true)
      
      // تحديث في قاعدة البيانات
      const response = await api.clients.update(client.id, client);
      if (!response.success) {
        throw new Error(response.error || 'فشل تحديث العميل في قاعدة البيانات');
      }
      
      // تحديث state
      dispatch({ type: "UPDATE_CLIENT", payload: response.data || client })
      
      // حفظ في localStorage كنسخة احتياطية
      saveDataToStorage()
      
      // إرسال تحديث فوري
      if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
        (window as any).realtimeUpdates.sendClientUpdate({ 
          action: 'update', 
          client: response.data || client, 
          userId: state.currentUser?.id, 
          userName: state.currentUser?.name 
        });
      }
      
      showSuccessToast("تم تحديث العميل بنجاح", `تم تحديث عميل "${client.name}"`)
    } catch (error) {
      logger.error("خطأ في تحديث العميل", { error }, 'CLIENTS');
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

      // حذف من قاعدة البيانات
      const response = await api.clients.delete(clientId);
      if (!response.success) {
        throw new Error(response.error || 'فشل حذف العميل من قاعدة البيانات');
      }

      dispatch({ type: "DELETE_CLIENT", payload: clientId })
      saveDataToStorage()
      
      // إرسال تحديث فوري
      if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
        (window as any).realtimeUpdates.sendClientUpdate({ 
          action: 'delete', 
          client: client, 
          userId: state.currentUser?.id, 
          userName: state.currentUser?.name 
        });
      }
      
      showSuccessToast("تم حذف العميل بنجاح", `تم حذف عميل "${client.name}"`)
    } catch (error) {
      logger.error("خطأ في حذف العميل", { error }, 'CLIENTS');
      showErrorToast("خطأ في حذف العميل", "حدث خطأ أثناء حذف العميل")
    } finally {
      setLoadingState('clients', false)
    }
  }

  const createTransaction = async (transaction: Transaction) => {
    try {
      setLoadingState('transactions', true);
      const response = await api.transactions.create(transaction);
      if (response && response.success) {
        const newTransaction = response.data as Transaction;
        dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTransactionUpdate === 'function') {
          (window.realtimeUpdates as any).sendTransactionUpdate({ action: 'create', transaction: newTransaction });
        }
        showSuccessToast("تم إنشاء العملية المالية بنجاح", `تم إنشاء عملية "${newTransaction.description}"`);
      } else {
        showErrorToast("خطأ في إنشاء العملية المالية", response?.error || "فشل الإنشاء في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في إنشاء العملية المالية", "حدث خطأ أثناء إنشاء العملية المالية");
      console.error("Error creating transaction:", error);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      setLoadingState('transactions', true);
      const response = await api.transactions.update(transaction.id, transaction);
      if (response && response.success) {
        dispatch({ type: "UPDATE_TRANSACTION", payload: transaction });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTransactionUpdate === 'function') {
          (window.realtimeUpdates as any).sendTransactionUpdate({ action: 'update', transaction });
        }
        showSuccessToast("تم تحديث العملية المالية بنجاح", `تم تحديث عملية "${transaction.description}"`);
      } else {
        showErrorToast("خطأ في تحديث العملية المالية", response?.error || "فشل التحديث في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في تحديث العملية المالية", "حدث خطأ أثناء تحديث العملية المالية");
      console.error("Error updating transaction:", error);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      setLoadingState('transactions', true);
      const transaction = state.transactions.find(t => t.id === transactionId);
      if (!transaction) {
        showErrorToast("خطأ في حذف العملية المالية", "العملية غير موجودة");
        return;
      }
      const response = await api.transactions.delete(transactionId);
      if (response && response.success) {
        dispatch({ type: "DELETE_TRANSACTION", payload: transactionId });
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendTransactionUpdate === 'function') {
          (window.realtimeUpdates as any).sendTransactionUpdate({ action: 'delete', transaction });
        }
        showSuccessToast("تم حذف العملية المالية بنجاح", `تم حذف عملية "${transaction.description}"`);
      } else {
        showErrorToast("خطأ في حذف العملية المالية", response?.error || "فشل الحذف في الباكند");
      }
    } catch (error) {
      showErrorToast("خطأ في حذف العملية المالية", "حدث خطأ أثناء حذف العملية المالية");
      console.error("Error deleting transaction:", error);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  // Realtime broadcast functions
  const broadcastProjectUpdate = async (action: 'create' | 'update' | 'delete', data: Project) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('project', { action, data });
    }
  }

  const broadcastTaskUpdate = async (action: 'create' | 'update' | 'delete', data: Task) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('task', { action, data });
    }
  }

  const broadcastClientUpdate = async (action: 'create' | 'update' | 'delete', data: Client) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('client', { action, data });
    }
  }

  const broadcastTransactionUpdate = async (action: 'create' | 'update' | 'delete', data: Transaction) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('transaction', { action, data });
    }
  }

  const broadcastNotificationUpdate = async (action: 'create' | 'update' | 'delete', data: Notification) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('notification', { action, data });
    }
  }

  const broadcastUserUpdate = async (action: 'create' | 'update' | 'delete', data: User) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('user', { action, data });
    }
  }

  const broadcastAttendanceUpdate = async (action: 'create' | 'update', data: AttendanceRecord) => {
    if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).broadcastUpdate === 'function') {
      (window.realtimeUpdates as any).broadcastUpdate('attendance', { action, data });
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
