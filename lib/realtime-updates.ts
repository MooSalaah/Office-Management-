import { useState, useEffect, useRef } from "react";

// نظام التحديثات الحية باستخدام localStorage events
export class RealtimeUpdates {
	private static instance: RealtimeUpdates;
	private listeners: Map<string, Set<(data: any) => void>> = new Map();
	private storageKey = "realtime_updates";
	private lastUpdateTime = 0;
	private lastProcessedUpdateId: string | null = null;

	static getInstance(): RealtimeUpdates {
		if (!RealtimeUpdates.instance) {
			RealtimeUpdates.instance = new RealtimeUpdates();
		}
		return RealtimeUpdates.instance;
	}

	constructor() {
		this.initializeStorageListener();
	}

	private initializeStorageListener() {
		if (typeof window === "undefined") return;

		window.addEventListener("storage", (event) => {
			if (event.key === this.storageKey && event.newValue) {
				try {
					const update = JSON.parse(event.newValue);
					// منع إعادة معالجة نفس التحديث
					const updateId = `${update.type}_${update.data?.id || ""}_${
						update.timestamp
					}_${update.userId}`;
					if (this.lastProcessedUpdateId === updateId) return;
					this.lastProcessedUpdateId = updateId;

					// إرسال التحديث للمستمعين المحليين فقط (بدون إعادة broadcast)
					this.notifyListeners(update.type, update.data);
				} catch (error) {
					console.error("Error parsing realtime update:", error);
				}
			}
		});
	}

	// إرسال تحديث لجميع المستخدمين
	broadcastUpdate(type: string, data: any) {
		const update = {
			type,
			data,
			timestamp: Date.now(),
			userId: this.getCurrentUserId(),
			userName: this.getCurrentUserName(),
		};

		// حفظ التحديث في localStorage
		localStorage.setItem(this.storageKey, JSON.stringify(update));

		// إرسال التحديث للمستمعين المحليين
		this.notifyListeners(type, data);
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
	const [updates, setUpdates] = useState<any[]>([]);

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
	const [updates, setUpdates] = useState<any[]>([]);
	const processedUpdatesRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const unsubscribe = realtimeUpdates.subscribe(type, (data) => {
			// منع إضافة نفس التحديث أكثر من مرة
			const updateId = `${data.type}_${data.data?.id || ""}_${data.timestamp}_${
				data.userId
			}`;
			if (processedUpdatesRef.current.has(updateId)) return;
			processedUpdatesRef.current.add(updateId);

			// إضافة التحديث للمصفوفة
			setUpdates((prev) => [...prev, data]);

			// تنظيف التحديثات القديمة (احتفظ بآخر 10 تحديثات فقط)
			if (updates.length > 10) {
				setUpdates((prev) => prev.slice(-10));
			}
		});

		return unsubscribe;
	}, [type]);

	return updates;
}
