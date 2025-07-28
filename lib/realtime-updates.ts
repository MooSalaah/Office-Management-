import { useState, useEffect, useRef } from "react";
import { broadcastUpdate, useRealtime as useSSERealtime, RealtimeDataType, RealtimeUpdate } from "./realtime";
import { Project, Task, Client, Transaction, Notification, User, AttendanceRecord } from './types';

// نظام التحديثات الحية باستخدام SSE (Server-Sent Events)
export class RealtimeUpdates {
	private static instance: RealtimeUpdates;
	private listeners: Map<string, Set<(data: RealtimeDataType) => void>> = new Map();

	static getInstance(): RealtimeUpdates {
		if (!RealtimeUpdates.instance) {
			RealtimeUpdates.instance = new RealtimeUpdates();
		}
		return RealtimeUpdates.instance;
	}

	constructor() {
		// لا نحتاج initializeStorageListener لأننا نستخدم SSE
	}

	// إرسال تحديث لجميع المستخدمين عبر SSE
	async broadcastUpdate(type: string, data: RealtimeDataType) {
		try {
			// التحقق من وجود البيانات قبل الإرسال
			if (!data) {
				console.warn("Attempting to broadcast empty data");
				return;
			}

			// إرسال التحديث للمستمعين المحليين فقط
			this.notifyListeners(type, data);
			
			// إرسال عبر SSE إذا كان متاحاً
			if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
				const realtimeUpdates = (window as any).realtimeUpdates;
				if (realtimeUpdates.sendUpdate && typeof realtimeUpdates.sendUpdate === 'function') {
					realtimeUpdates.sendUpdate(type, data.action || "update", data);
				}
			}
		} catch (error) {
			console.error("ERROR [NOTIFICATIONS] Error broadcasting notification update | Data:", { error });
			// Fallback: إرسال للمستمعين المحليين فقط
			this.notifyListeners(type, data);
		}
	}

	// إضافة مستمع للتحديثات
	subscribe(type: string, callback: (data: RealtimeDataType) => void) {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(callback);

		// إضافة SSE listener إذا كان هذا أول مستمع لهذا النوع
		if (this.listeners.get(type)!.size === 1) {
			this.setupSSEListener(type);
		}

		// إرجاع دالة لإلغاء الاشتراك
		return () => {
			const typeListeners = this.listeners.get(type);
			if (typeListeners) {
				typeListeners.delete(callback);
				if (typeListeners.size === 0) {
					this.listeners.delete(type);
				}
			}
		};
	}

	// إعداد SSE listener
	private setupSSEListener(type: string) {
		if (typeof window === "undefined") return;

		// استخدام SSE من realtime.ts
		const { realtimeManager } = require("./realtime");
		if (realtimeManager) {
			realtimeManager.subscribe(type, (update: RealtimeUpdate) => {
				// إرسال التحديث لجميع المستمعين المحليين
				this.notifyListeners(type, update.data);
			});
		}
	}

	// إشعار المستمعين
	private notifyListeners(type: string, data: RealtimeDataType) {
		const typeListeners = this.listeners.get(type);
		if (typeListeners) {
			typeListeners.forEach((callback) => {
				try {
					// التحقق من وجود البيانات قبل إرسالها
					if (!data) {
						console.warn("Attempting to notify listeners with empty data");
						return;
					}
					callback(data);
				} catch (error) {
					console.error("Error in realtime update callback:", error);
				}
			});
		}
	}

	// الحصول على معرف المستخدم الحالي
	private getCurrentUserId(): string {
		if (typeof window === "undefined") return "";

		const userData = localStorage.getItem("currentUser");
		if (userData) {
			try {
				const user = JSON.parse(userData);
				return user.id || "";
			} catch (error) {
				console.error("Error parsing current user:", error);
			}
		}
		return "";
	}

	// الحصول على اسم المستخدم الحالي
	private getCurrentUserName(): string {
		if (typeof window === "undefined") return "";

		const userData = localStorage.getItem("currentUser");
		if (userData) {
			try {
				const user = JSON.parse(userData);
				return user.name || "";
			} catch (error) {
				console.error("Error parsing current user:", error);
			}
		}
		return "";
	}

	// إرسال إشعار فوري
	sendNotification(notification: Notification) {
		this.broadcastUpdate("notification", { action: "create", data: notification });
	}

	// إرسال تحديث مهمة
	sendTaskUpdate(task: Task) {
		this.broadcastUpdate("task", task);
	}

	// إرسال تحديث مشروع
	sendProjectUpdate(project: Project) {
		this.broadcastUpdate("project", project);
	}

	// إرسال تحديث معاملة مالية
	sendTransactionUpdate(transaction: Transaction) {
		this.broadcastUpdate("transaction", transaction);
	}

	// إرسال تحديث مستخدم
	sendUserUpdate(user: User) {
		this.broadcastUpdate("user", user);
	}

	// إرسال تحديث عميل
	sendClientUpdate(client: Client) {
		this.broadcastUpdate("client", client);
	}

	// إرسال تحديث حضور
	sendAttendanceUpdate(attendance: AttendanceRecord) {
		this.broadcastUpdate("attendance", attendance);
	}

	// إرسال تحديث بيانات المكتب
	sendCompanySettingsUpdate(settings: any) {
		this.broadcastUpdate("companySettings", settings);
	}

	// تنظيف التحديثات القديمة
	cleanup() {
		if (typeof window === "undefined") return;

		const now = Date.now();
		const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة

		// تنظيف localStorage من التحديثات القديمة
		const keys = Object.keys(localStorage);
		keys.forEach((key) => {
			if (key.startsWith("realtime_")) {
				try {
					const data = JSON.parse(localStorage.getItem(key) || "{}");
					if (data.timestamp && now - data.timestamp > maxAge) {
						localStorage.removeItem(key);
					}
				} catch (error) {
					// تجاهل الأخطاء
				}
			}
		});
	}
}

// إنشاء instance واحد للنظام
export const realtimeUpdates = RealtimeUpdates.getInstance();

// Hook لاستخدام التحديثات الحية
export function useRealtimeUpdates() {
	const [updates, setUpdates] = useState<RealtimeDataType[]>([]);

	useEffect(() => {
		const unsubscribe = realtimeUpdates.subscribe("*", (data) => {
			setUpdates((prev) => [...prev, data]);
		});

		return unsubscribe;
	}, []);

	return updates;
}

// Hook للتحديثات الحية حسب النوع
export function useRealtimeUpdatesByType(type: string) {
	const [updates, setUpdates] = useState<RealtimeDataType[]>([]);
	const processedUpdatesRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const unsubscribe = realtimeUpdates.subscribe(type, (data) => {
			try {
				// التحقق من وجود البيانات قبل الوصول إليها
				if (!data) {
					console.warn("Received empty data in realtime update");
					return;
				}

				// منع إضافة نفس التحديث أكثر من مرة
				const updateId = `${type}_${data.id || data.userId || data.user?.id || ""}_${Date.now()}`;
				if (processedUpdatesRef.current.has(updateId)) return;
				processedUpdatesRef.current.add(updateId);

				// إضافة التحديث للمصفوفة
				setUpdates((prev) => [...prev, data]);

				// تنظيف التحديثات القديمة (احتفظ بآخر 10 تحديثات فقط)
				if (updates.length > 10) {
					setUpdates((prev) => prev.slice(-10));
				}
			} catch (error) {
				console.error("Error in realtime update callback:", error);
			}
		});

		return unsubscribe;
	}, [type]);

	return updates;
}

// تعريف window.realtimeUpdates للوصول من الواجهة الأمامية
if (typeof window !== 'undefined') {
	// تعيين مباشر بدون getter/setter لتجنب التضارب
	(window as any).realtimeUpdates = realtimeUpdates;
}
