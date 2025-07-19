import { useState, useEffect, useRef } from "react";

// نظام التحديثات الحية المبسط
export class RealtimeUpdates {
	private static instance: RealtimeUpdates;
	private listeners: Map<string, Set<(data: any) => void>> = new Map();
	private processedUpdates: Set<string> = new Set();

	static getInstance(): RealtimeUpdates {
		if (!RealtimeUpdates.instance) {
			RealtimeUpdates.instance = new RealtimeUpdates();
		}
		return RealtimeUpdates.instance;
	}

	constructor() {
		// تهيئة النظام
		this.initializeStorageListener();
	}

	// تهيئة مراقب التغييرات في localStorage
	private initializeStorageListener() {
		if (typeof window === "undefined") return;

		// مراقبة التغييرات في localStorage
		const originalSetItem = localStorage.setItem;
		localStorage.setItem = (key: string, value: string) => {
			originalSetItem.call(localStorage, key, value);

			// إرسال حدث التحديث
			if (
				key === "projects" ||
				key === "tasks" ||
				key === "clients" ||
				key === "users" ||
				key === "notifications"
			) {
				try {
					const data = JSON.parse(value);
					const type = key.slice(0, -1); // إزالة 's' من النهاية
					this.notifyListeners(type, { action: "update", data });
				} catch (error) {
					console.error("Error parsing localStorage data:", error);
				}
			}
		};

		// مراقبة التغييرات من النوافذ الأخرى
		window.addEventListener("storage", (event) => {
			if (
				event.key &&
				(event.key === "projects" ||
					event.key === "tasks" ||
					event.key === "clients" ||
					event.key === "users" ||
					event.key === "notifications")
			) {
				try {
					const data = JSON.parse(event.newValue || "[]");
					const type = event.key.slice(0, -1);
					this.notifyListeners(type, { action: "update", data });
				} catch (error) {
					console.error("Error parsing storage event data:", error);
				}
			}
		});
	}

	// إضافة مستمع للتحديثات
	subscribe(type: string, callback: (data: any) => void) {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(callback);

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

	// إشعار المستمعين
	private notifyListeners(type: string, data: any) {
		const typeListeners = this.listeners.get(type);
		if (typeListeners) {
			typeListeners.forEach((callback) => {
				try {
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

	// إرسال تحديث فوري
	broadcastUpdate(type: string, data: any) {
		// إرسال التحديث للمستمعين المحليين
		this.notifyListeners(type, data);

		// حفظ التحديث في localStorage للتوافق مع النوافذ الأخرى
		const updateKey = `realtime_${type}_${Date.now()}`;
		localStorage.setItem(
			updateKey,
			JSON.stringify({
				type,
				data,
				timestamp: Date.now(),
				userId: this.getCurrentUserId(),
				userName: this.getCurrentUserName(),
			})
		);

		// تنظيف التحديثات القديمة
		setTimeout(() => {
			localStorage.removeItem(updateKey);
		}, 5000);
	}

	// إرسال إشعار فوري
	sendNotification(notification: any) {
		this.broadcastUpdate("notification", notification);
	}

	// إرسال تحديث مهمة
	sendTaskUpdate(task: any) {
		this.broadcastUpdate("task", task);
	}

	// إرسال تحديث مشروع
	sendProjectUpdate(project: any) {
		this.broadcastUpdate("project", project);
	}

	// إرسال تحديث معاملة مالية
	sendTransactionUpdate(transaction: any) {
		this.broadcastUpdate("transaction", transaction);
	}

	// إرسال تحديث مستخدم
	sendUserUpdate(user: any) {
		this.broadcastUpdate("user", user);
	}

	// إرسال تحديث عميل
	sendClientUpdate(client: any) {
		this.broadcastUpdate("client", client);
	}

	// إرسال تحديث حضور
	sendAttendanceUpdate(attendance: any) {
		this.broadcastUpdate("attendance", attendance);
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

// إنشاء instance عالمي
const realtimeUpdates = RealtimeUpdates.getInstance();

// Hook لاستخدام التحديثات الحية
export function useRealtimeUpdates() {
	const [updates, setUpdates] = useState<any[]>([]);

	useEffect(() => {
		const unsubscribe = realtimeUpdates.subscribe("all", (data) => {
			setUpdates((prev) => [...prev, data]);
		});

		return unsubscribe;
	}, []);

	return updates;
}

// Hook لاستخدام التحديثات الحية حسب النوع
export function useRealtimeUpdatesByType(type: string) {
	const [updates, setUpdates] = useState<any[]>([]);

	useEffect(() => {
		const unsubscribe = realtimeUpdates.subscribe(type, (data) => {
			setUpdates((prev) => [...prev, data]);
		});

		return unsubscribe;
	}, [type]);

	return updates;
}

// تصدير instance للاستخدام المباشر
export { realtimeUpdates };
