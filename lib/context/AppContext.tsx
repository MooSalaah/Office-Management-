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
    | { type: "CLEAR_NOTIFICATIONS"; payload: string }

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
            if (!action.payload) return state;
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
            if (!action.payload) return state;
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
            if (!action.payload) return state;
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
            if (!action.payload) return state;
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
            if (!action.payload) return state;
            return {
                ...state,
                notifications: state.notifications.map((n) => (n.id === action.payload.id ? action.payload : n)),
            }

        case "DELETE_NOTIFICATION":
            return {
                ...state,
                notifications: state.notifications.filter((n) => n.id !== action.payload),
            }

        case "CLEAR_NOTIFICATIONS":
            return {
                ...state,
                notifications: state.notifications.filter((n) => n.userId !== action.payload),
            }

        case "ADD_USER":
            if (state.users.some(u => u.id === action.payload.id || u.email === action.payload.email)) {
                return state;
            }
            return { ...state, users: [...state.users, action.payload] };

        case "UPDATE_USER":
            if (!action.payload) return state;
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
            setTimeout(() => {
                browserNotification.close()
            }, 5000)
        }
    }

    // Initialize realtime updates
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
            const realtimeUpdates = (window as any).realtimeUpdates;
            if (realtimeUpdates && typeof realtimeUpdates.on === 'function') {
                realtimeUpdates.on('notification', (notification: any) => {
                    try {
                        if (!notification || !notification.id) {
                            console.warn('Invalid notification data received:', notification);
                            return;
                        }
                        if (!state.notifications.some(n => n.id === notification.id)) {
                            dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
                        }
                    } catch (error) {
                        console.error('Error in realtime update callback:', error);
                    }
                });
            }
        }
        logger.info('Realtime updates initialized', undefined, 'REALTIME');
    }, [state.currentUser?.id, state.notifications])

    // Consolidated Data Fetching and State Management
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            // 1. Load from LocalStorage (Fast Initial Load)
            try {
                initializeDefaultRoles()

                // Load current user
                const userData = localStorage.getItem("currentUser")
                if (userData) {
                    const user = JSON.parse(userData)
                    const updatedUser = updateUserPermissionsByRole(user)
                    dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
                }

                // Load other data from storage
                const keys: (keyof AppState)[] = ['users', 'projects', 'clients', 'tasks', 'transactions', 'notifications', 'attendanceRecords', 'upcomingPayments', 'companySettings', 'userSettings'];
                keys.forEach(key => {
                    const data = localStorage.getItem(key as string);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            switch (key) {
                                case 'users': dispatch({ type: "LOAD_USERS", payload: parsed }); break;
                                case 'projects': dispatch({ type: "LOAD_PROJECTS", payload: parsed }); break;
                                case 'clients': dispatch({ type: "LOAD_CLIENTS", payload: parsed }); break;
                                case 'tasks': dispatch({ type: "LOAD_TASKS", payload: parsed }); break;
                                case 'transactions': dispatch({ type: "LOAD_TRANSACTIONS", payload: parsed }); break;
                                case 'notifications': dispatch({ type: "LOAD_NOTIFICATIONS", payload: parsed }); break;
                                case 'attendanceRecords': dispatch({ type: "LOAD_ATTENDANCE", payload: parsed }); break;
                                case 'upcomingPayments': dispatch({ type: "LOAD_UPCOMING_PAYMENTS", payload: parsed }); break;
                                case 'companySettings': dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload: parsed }); break;
                                case 'userSettings': dispatch({ type: "UPDATE_USER_SETTINGS", payload: parsed }); break;
                            }
                        } catch (e) {
                            console.error(`Error parsing ${key} from storage`, e);
                        }
                    }
                });

            } catch (error) {
                logger.error("Error loading data from localStorage", { error }, 'STORAGE');
            }

            // 2. Fetch from Backend (Fresh Data)
            if (typeof window !== "undefined") {
                try {
                    setIsAuthLoading(true)

                    const [
                        usersRes,
                        projectsRes,
                        clientsRes,
                        tasksRes,
                        transactionsRes,
                        notificationsRes,
                        rolesRes
                    ] = await Promise.all([
                        api.users.getAll().catch(e => ({ success: false, error: e })),
                        api.projects.getAll().catch(e => ({ success: false, error: e })),
                        api.clients.getAll().catch(e => ({ success: false, error: e })),
                        api.tasks.getAll().catch(e => ({ success: false, error: e })),
                        api.transactions.getAll().catch(e => ({ success: false, error: e })),
                        api.notifications.getAll().catch(e => ({ success: false, error: e })),
                        api.roles.getAll().catch(e => ({ success: false, error: e }))
                    ]);

                    if (!isMounted) return;

                    if (usersRes.success && Array.isArray(usersRes.data)) {
                        const users = usersRes.data.map((user: User) => updateUserPermissionsByRole(user));
                        dispatch({ type: "LOAD_USERS", payload: users });
                        const currentUserData = localStorage.getItem("currentUser");
                        if (currentUserData) {
                            const currentUser = JSON.parse(currentUserData);
                            const currentUserFromDB = users.find((u: User) => u.id === currentUser.id);
                            if (currentUserFromDB) {
                                dispatch({ type: "SET_CURRENT_USER", payload: currentUserFromDB });
                            }
                        }
                    }

                    if (projectsRes.success && Array.isArray(projectsRes.data)) dispatch({ type: "LOAD_PROJECTS", payload: projectsRes.data });
                    if (clientsRes.success && Array.isArray(clientsRes.data)) dispatch({ type: "LOAD_CLIENTS", payload: clientsRes.data });
                    if (tasksRes.success && Array.isArray(tasksRes.data)) dispatch({ type: "LOAD_TASKS", payload: tasksRes.data });
                    if (transactionsRes.success && Array.isArray(transactionsRes.data)) dispatch({ type: "LOAD_TRANSACTIONS", payload: transactionsRes.data });
                    if (notificationsRes.success && Array.isArray(notificationsRes.data)) dispatch({ type: "LOAD_NOTIFICATIONS", payload: notificationsRes.data });

                    if (rolesRes.success && Array.isArray(rolesRes.data)) {
                        localStorage.setItem("jobRoles", JSON.stringify(rolesRes.data));
                        const rolePermissions: any = {};
                        rolesRes.data.forEach((role: any) => {
                            rolePermissions[role.id] = {
                                name: role.name,
                                description: role.description,
                                permissions: role.permissions,
                                modules: role.modules || []
                            };
                        });
                        localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));
                        Object.assign(require("../auth").rolePermissions, rolePermissions);
                    }

                    logger.info("Initial data fetch completed successfully", {}, 'API');

                    // Fetch current user specifically to ensure fresh data (avatar, etc.)
                    const storedUser = localStorage.getItem("currentUser");
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            if (parsedUser.id) {
                                const meRes = await api.users.get(parsedUser.id);
                                if (meRes.success && meRes.data) {
                                    const freshUser = {
                                        ...meRes.data,
                                        permissions: meRes.data.permissions || parsedUser.permissions || []
                                    };
                                    localStorage.setItem("currentUser", JSON.stringify(freshUser));
                                    dispatch({ type: "SET_CURRENT_USER", payload: updateUserPermissionsByRole(freshUser) });
                                }
                            }
                        } catch (e) {
                            console.error("Error refreshing current user", e);
                        }
                    }

                } catch (error) {
                    logger.error("Error fetching initial data from backend", { error }, 'API');
                } finally {
                    if (isMounted) setIsAuthLoading(false)
                }
            }
        }

        loadData()

        return () => { isMounted = false }
    }, [])

    // Auto-save to LocalStorage
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
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

            // Backward compatibility
            localStorage.setItem("users", JSON.stringify(state.users))
            localStorage.setItem("projects", JSON.stringify(state.projects))
            localStorage.setItem("clients", JSON.stringify(state.clients))
            localStorage.setItem("tasks", JSON.stringify(state.tasks))
            localStorage.setItem("transactions", JSON.stringify(state.transactions))
            localStorage.setItem("notifications", JSON.stringify(state.notifications))
            localStorage.setItem("attendanceRecords", JSON.stringify(state.attendanceRecords))
            localStorage.setItem("upcomingPayments", JSON.stringify(state.upcomingPayments))
            localStorage.setItem("companySettings", JSON.stringify(state.companySettings))
            if (state.userSettings) localStorage.setItem("userSettings", JSON.stringify(state.userSettings))

        } catch (error) {
            console.error("Error saving data to localStorage", error)
        }
    }, [state])

    return (
        <AppContext.Provider value={{ state, dispatch, isAuthLoading }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}

export function useAppActions() {
    const { dispatch, state } = useApp()
    const { toast } = useToast()

    const setLoading = (loading: boolean) => {
        dispatch({ type: "SET_LOADING", payload: loading })
    }

    const setLoadingState = (key: keyof AppState['loadingStates'], value: boolean) => {
        dispatch({ type: "SET_LOADING_STATE", payload: { key, value } })
    }

    const showSuccessToast = (title: string, description?: string) => {
        toast({ title, description, variant: "default" })
    }

    const showErrorToast = (title: string, description?: string) => {
        toast({ title, description, variant: "destructive" })
    }

    const showWarningToast = (title: string, description?: string) => {
        toast({ title, description, variant: "default" })
    }

    const saveDataToStorage = () => {
        try {
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
        } catch (e) {
            console.error("Error saving data", e)
        }
    }

    const addNotification = async (notification: Omit<Notification, "id" | "createdAt">) => {
        if (!notification.userId || !notification.title || !notification.message || !notification.type) {
            logger.error('Invalid notification data', { notification }, 'NOTIFICATIONS');
            return;
        }

        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };

        const userSettings = state.userSettings;
        if (userSettings?.notificationSettings) {
            const notificationType = notification.type;
            const notificationKey = `${notificationType}Notifications` as keyof typeof userSettings.notificationSettings;
            const isEnabled = userSettings.notificationSettings[notificationKey] !== false;

            if (!isEnabled) {
                return;
            }
        }

        dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
            await fetch(`${apiUrl}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(newNotification),
            });
        } catch (error) {
            logger.error('Error saving notification to database', { error }, 'NOTIFICATIONS');
        }

        try {
            if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
                const realtimeUpdates = (window as any).realtimeUpdates;
                if (realtimeUpdates.sendUpdate && typeof realtimeUpdates.sendUpdate === 'function') {
                    realtimeUpdates.sendUpdate('notification', 'create', newNotification);
                }
            }
        } catch (error) {
            logger.error('Error broadcasting notification update', { error }, 'NOTIFICATIONS');
        }

        try {
            if (userSettings?.notificationSettings?.browserNotifications &&
                'Notification' in window &&
                Notification.permission === 'granted') {
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

                setTimeout(() => {
                    browserNotification.close();
                }, 5000);
            }
        } catch (error) {
            logger.error('Error showing browser notification', { error }, 'NOTIFICATIONS');
        }
    };

    const markNotificationAsRead = async (notificationId: string) => {
        const updatedNotification = state.notifications.find(n => n.id === notificationId);
        if (updatedNotification && !updatedNotification.isRead) {
            const notification = { ...updatedNotification, isRead: true };
            dispatch({ type: "UPDATE_NOTIFICATION", payload: notification });

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
                await fetch(`${apiUrl}/api/notifications/${notificationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    body: JSON.stringify({ isRead: true }),
                });
            } catch (error) {
                logger.error('Error updating notification', { error }, 'NOTIFICATIONS');
            }
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!notificationId) return;
        dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
            await fetch(`${apiUrl}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
        } catch (error) {
            logger.error('Error deleting notification', { error }, 'NOTIFICATIONS');
        }
    };

    const clearAllNotifications = async (userId: string) => {
        if (!userId) return;
        dispatch({ type: "CLEAR_NOTIFICATIONS", payload: userId });
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
            await fetch(`${apiUrl}/api/notifications/clear`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ userId })
            });
            showSuccessToast("تم حذف الإشعارات", "تم حذف جميع الإشعارات بنجاح");
        } catch (error) {
            logger.error('Error clearing notifications', { error }, 'NOTIFICATIONS');
            showErrorToast("خطأ في الاتصال", "حدث خطأ أثناء حذف الإشعارات");
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

    const createProjectWithFinancialTransaction = async (project: Project) => {
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
        } finally {
            setLoadingState('projects', false);
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
        } finally {
            setLoadingState('projects', false);
        }
    };

    const setCurrentUser = (user: User | null) => {
        dispatch({ type: "SET_CURRENT_USER", payload: user })
        if (user?.role === "admin") {
            const refreshFinancialData = async () => {
                try {
                    const transactionsResponse = await api.transactions.getAll();
                    if (transactionsResponse && transactionsResponse.success && Array.isArray(transactionsResponse.data)) {
                        dispatch({ type: "LOAD_TRANSACTIONS", payload: transactionsResponse.data });
                    }
                    const projectsResponse = await api.projects.getAll();
                    if (projectsResponse && projectsResponse.success && Array.isArray(projectsResponse.data)) {
                        dispatch({ type: "LOAD_PROJECTS", payload: projectsResponse.data });
                    }
                    const clientsResponse = await api.clients.getAll();
                    if (clientsResponse && clientsResponse.success && Array.isArray(clientsResponse.data)) {
                        dispatch({ type: "LOAD_CLIENTS", payload: clientsResponse.data });
                    }
                } catch (error) {
                    logger.error('Error refreshing financial data for admin login', { error }, 'FINANCE');
                }
            };
            refreshFinancialData();
        }
    }

    const logout = () => {
        localStorage.removeItem("currentUser")
        localStorage.removeItem("attendanceRecords")
        sessionStorage.clear()
        if (typeof window !== "undefined") {
            window.location.href = "/"
        }
    }

    const refreshCurrentUser = async () => {
        const userData = localStorage.getItem("currentUser")
        if (userData) {
            const user = JSON.parse(userData)
            try {
                // Fetch fresh user data from API
                const response = await api.users.get(user.id)
                if (response.success && response.data) {
                    const freshUser = {
                        ...response.data,
                        // Ensure permissions are preserved or updated correctly
                        permissions: response.data.permissions || user.permissions || []
                    }

                    // Update localStorage with fresh data
                    localStorage.setItem("currentUser", JSON.stringify(freshUser))

                    // Update state
                    const updatedUser = updateUserPermissionsByRole(freshUser)
                    dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
                } else {
                    // Fallback to local data if API fails but token exists
                    const updatedUser = updateUserPermissionsByRole(user)
                    dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
                }
            } catch (error) {
                console.error("Failed to refresh user data:", error)
                // Fallback to local data
                const updatedUser = updateUserPermissionsByRole(user)
                dispatch({ type: "SET_CURRENT_USER", payload: updatedUser })
            }
        }
    }

    const createTask = async (task: Task) => {
        try {
            setLoadingState('tasks', true);
            const response = await api.tasks.create(task);
            if (response && response.success) {
                const newTask = response.data as Task;
                dispatch({ type: "ADD_TASK", payload: newTask });
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
        } finally {
            setLoadingState('tasks', false);
        }
    };

    const createClient = async (client: Client) => {
        try {
            setLoadingState('clients', true)
            const response = await api.clients.create(client);
            if (!response.success) {
                throw new Error(response.error || 'فشل حفظ العميل في قاعدة البيانات');
            }
            dispatch({ type: "ADD_CLIENT", payload: response.data || client })
            saveDataToStorage()
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
            const response = await api.clients.update(client.id, client);
            if (!response.success) {
                throw new Error(response.error || 'فشل تحديث العميل في قاعدة البيانات');
            }
            dispatch({ type: "UPDATE_CLIENT", payload: response.data || client })
            saveDataToStorage()
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
            const clientProjects = state.projects.filter(p => p.clientId === clientId)
            if (clientProjects.length > 0) {
                showErrorToast("لا يمكن حذف العميل", "العميل مرتبط بمشاريع")
                return
            }
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
            const response = await fetch(`${apiUrl}/api/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    deletedBy: state.currentUser?.id,
                    deletedByName: state.currentUser?.name
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل حذف العميل من قاعدة البيانات');
            }
            dispatch({ type: "DELETE_CLIENT", payload: clientId })
            saveDataToStorage()
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
        } finally {
            setLoadingState('transactions', false);
        }
    };

    const broadcastProjectUpdate = async (action: 'create' | 'update' | 'delete', data: Project) => {
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendUpdate === 'function') {
            (window.realtimeUpdates as any).sendUpdate('project', action, data);
        }
    }

    const broadcastTaskUpdate = async (action: 'create' | 'update' | 'delete', data: Task) => {
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendUpdate === 'function') {
            (window.realtimeUpdates as any).sendUpdate('task', action, data);
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
        if (typeof window !== 'undefined' && window.realtimeUpdates && typeof window.realtimeUpdates === 'object' && typeof (window.realtimeUpdates as any).sendUpdate === 'function') {
            (window.realtimeUpdates as any).sendUpdate('notification', action, data);
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
        setLoading,
        setLoadingState,
        showSuccessToast,
        showErrorToast,
        showWarningToast,
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
        addNotification,
        markNotificationAsRead,
        deleteNotification,
        clearAllNotifications,
        setCurrentUser,
        logout,
        refreshCurrentUser,
        saveDataToStorage,
        broadcastProjectUpdate,
        broadcastTaskUpdate,
        broadcastClientUpdate,
        broadcastTransactionUpdate,
        broadcastNotificationUpdate,
        broadcastUserUpdate,
        broadcastAttendanceUpdate,
    }
}
