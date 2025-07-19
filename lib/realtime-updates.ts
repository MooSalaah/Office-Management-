import { useState, useEffect, useRef } from "react";
import { broadcastUpdate, useRealtime as useSSERealtime } from "./realtime";

// نظام التحديثات الحية باستخدام SSE (Server-Sent Events)
export class RealtimeUpdates {
	private static instance: RealtimeUpdates;
	private listeners: Map<string, Set<(data: any) => void>> = new Map();
	private baseUrl: string =
		process.env.NEXT_PUBLIC_API_URL ||
		"https://engineering-office-backend.onrender.com";
	private eventSource: EventSource | null = null;
	private pollingInterval: NodeJS.Timeout | null = null;
	private processedUpdates: Set<string> = new Set();
	private retryCount = 0;
	private maxRetries = 3;
	private retryDelay = 2000; // 2 seconds
	private isConnected = false;

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
	async broadcastUpdate(type: string, data: any) {
		try {
			await broadcastUpdate({
				type: type as any,
				action: data.action || "update",
				data: data,
				userId: this.getCurrentUserId(),
			});

			// إرسال التحديث للمستمعين المحليين أيضاً
			this.notifyListeners(type, data);
		} catch (error) {
			console.error("Failed to broadcast update:", error);
			// Fallback: إرسال للمستمعين المحليين فقط
			this.notifyListeners(type, data);
		}
	}

	// إضافة مستمع للتحديثات
	subscribe(type: string, callback: (data: any) => void) {
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
			realtimeManager.subscribe(type, (update: any) => {
				// إرسال التحديث لجميع المستمعين المحليين
				this.notifyListeners(type, update.data);
			});
		}
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

	// إضافة retry logic للاتصال
	private async retryConnection() {
		if (this.retryCount < this.maxRetries) {
			this.retryCount++;
			console.log(
				`Retrying connection... Attempt ${this.retryCount}/${this.maxRetries}`
			);

			setTimeout(() => {
				this.connect();
			}, this.retryDelay * this.retryCount);
		} else {
			console.error("Max retry attempts reached. Falling back to polling.");
			this.startPolling();
		}
	}

	// إيقاف polling
	private stopPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}
	}

	// تحسين الاتصال مع error handling
	private connect() {
		try {
			const eventSource = new EventSource(
				`${this.baseUrl}/api/realtime/stream`
			);

			eventSource.onopen = () => {
				console.log("SSE connection established");
				this.retryCount = 0;
				this.isConnected = true;
				this.stopPolling();
			};

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleUpdate(data);
				} catch (error) {
					console.error("Error parsing SSE message:", error);
				}
			};

			eventSource.onerror = (error) => {
				console.error("SSE connection error:", error);
				this.isConnected = false;
				eventSource.close();
				this.retryConnection();
			};

			this.eventSource = eventSource;
		} catch (error) {
			console.error("Error establishing SSE connection:", error);
			this.retryConnection();
		}
	}

	// تحسين polling مع exponential backoff
	private startPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
		}

		let pollDelay = 5000; // Start with 5 seconds

		this.pollingInterval = setInterval(async () => {
			try {
				const response = await fetch(`${this.baseUrl}/api/realtime/poll`);
				if (response.ok) {
					const data = await response.json();
					if (data.updates && data.updates.length > 0) {
						data.updates.forEach((update: any) => {
							this.handleUpdate(update);
						});
					}
					// Reset delay on successful poll
					pollDelay = 5000;
				} else {
					// Increase delay on error
					pollDelay = Math.min(pollDelay * 1.5, 30000); // Max 30 seconds
				}
			} catch (error) {
				console.error("Polling error:", error);
				pollDelay = Math.min(pollDelay * 1.5, 30000);
			}
		}, pollDelay);
	}

	// تحسين handleUpdate مع duplicate prevention
	private handleUpdate(data: any) {
		const updateId = `${data.type}_${data.action}_${
			data.timestamp || Date.now()
		}`;

		// منع التحديثات المكررة
		if (this.processedUpdates.has(updateId)) {
			return;
		}

		this.processedUpdates.add(updateId);

		// تنظيف التحديثات القديمة (احتفظ بآخر 1000 تحديث)
		if (this.processedUpdates.size > 1000) {
			const updatesArray = Array.from(this.processedUpdates);
			this.processedUpdates = new Set(updatesArray.slice(-500));
		}

		// إرسال التحديث للمستمعين
		const listeners = this.listeners.get(data.type);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error("Error in update callback:", error);
				}
			});
		}
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
