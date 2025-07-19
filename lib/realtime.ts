// Real-time updates management
export interface RealtimeUpdate {
	type:
		| "project"
		| "task"
		| "client"
		| "transaction"
		| "notification"
		| "user"
		| "attendance";
	action: "create" | "update" | "delete";
	data: any;
	userId: string;
	timestamp: number;
}

class RealtimeManager {
	private listeners: Map<string, Set<(update: RealtimeUpdate) => void>> =
		new Map();
	private eventSource: EventSource | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 1000;
	private maxReconnectDelay = 30000;
	private isConnected = false;
	private connectionCheckInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Only initialize on client side
		if (typeof window !== "undefined") {
			this.initializeEventSource();
			this.startConnectionCheck();
		}
	}

	private initializeEventSource() {
		try {
			// Close existing connection if any
			if (this.eventSource) {
				this.eventSource.close();
			}

			// Use Server-Sent Events for real-time updates
			const apiUrl =
				process.env.NEXT_PUBLIC_API_URL ||
				"https://engineering-office-backend.onrender.com";
			this.eventSource = new EventSource(`${apiUrl}/api/realtime`);

			this.eventSource.onmessage = (event) => {
				try {
					const update: RealtimeUpdate = JSON.parse(event.data);
					this.notifyListeners(update);
				} catch (error) {
					console.error("Error parsing realtime update:", error);
				}
			};

			this.eventSource.onerror = (error) => {
				console.error("EventSource error:", error);
				this.isConnected = false;
				this.handleReconnect();
			};

			this.eventSource.onopen = () => {
				console.log("✅ Realtime connection established");
				this.isConnected = true;
				this.reconnectAttempts = 0;
			};
		} catch (error) {
			console.error("Failed to initialize EventSource:", error);
			this.isConnected = false;
			this.handleReconnect();
		}
	}

	private handleReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			const delay = Math.min(
				this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
				this.maxReconnectDelay
			);

			console.log(
				`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
			);

			setTimeout(() => {
				this.initializeEventSource();
			}, delay);
		} else {
			console.error("❌ Max reconnection attempts reached");
			this.fallbackToPolling();
		}
	}

	private fallbackToPolling() {
		console.log("🔄 Falling back to polling mode");
		// Implement polling as fallback
		this.startPolling();
	}

	private startPolling() {
		// Poll every 30 seconds as fallback
		setInterval(async () => {
			try {
				const response = await fetch("/api/realtime/poll");
				if (response.ok) {
					const updates = await response.json();
					updates.forEach((update: RealtimeUpdate) => {
						this.notifyListeners(update);
					});
				}
			} catch (error) {
				console.error("Polling error:", error);
			}
		}, 30000);
	}

	private startConnectionCheck() {
		// Check connection health every 30 seconds
		this.connectionCheckInterval = setInterval(() => {
			if (
				!this.isConnected &&
				this.reconnectAttempts < this.maxReconnectAttempts
			) {
				console.log("🔍 Connection check: attempting to reconnect...");
				this.initializeEventSource();
			}
		}, 30000);
	}

	private notifyListeners(update: RealtimeUpdate) {
		const listeners = this.listeners.get(update.type);
		if (listeners) {
			listeners.forEach((listener) => {
				try {
					listener(update);
				} catch (error) {
					console.error("Error in realtime listener:", error);
				}
			});
		}
	}

	public subscribe(type: string, listener: (update: RealtimeUpdate) => void) {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(listener);

		// Return unsubscribe function
		return () => {
			const listeners = this.listeners.get(type);
			if (listeners) {
				listeners.delete(listener);
				if (listeners.size === 0) {
					this.listeners.delete(type);
				}
			}
		};
	}

	public unsubscribe(type: string, listener: (update: RealtimeUpdate) => void) {
		const listeners = this.listeners.get(type);
		if (listeners) {
			listeners.delete(listener);
			if (listeners.size === 0) {
				this.listeners.delete(type);
			}
		}
	}

	public getConnectionStatus() {
		return {
			isConnected: this.isConnected,
			reconnectAttempts: this.reconnectAttempts,
			maxReconnectAttempts: this.maxReconnectAttempts,
		};
	}

	public disconnect() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		if (this.connectionCheckInterval) {
			clearInterval(this.connectionCheckInterval);
			this.connectionCheckInterval = null;
		}
		this.isConnected = false;
	}
}

// Create singleton instance only on client side
export const realtimeManager =
	typeof window !== "undefined" ? new RealtimeManager() : null;

// Helper function to broadcast updates
export const broadcastUpdate = async (
	update: Omit<RealtimeUpdate, "timestamp">
) => {
	const fullUpdate: RealtimeUpdate = {
		...update,
		timestamp: Date.now(),
	};

	try {
		// Send update to server
		const apiUrl =
			process.env.NEXT_PUBLIC_API_URL ||
			"https://engineering-office-backend.onrender.com";
		const response = await fetch(`${apiUrl}/api/realtime/broadcast`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
			body: JSON.stringify(fullUpdate),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Failed to broadcast update:", error);
		throw error;
	}
};

// Hook for using realtime updates in components
export const useRealtime = (
	type: string,
	callback: (update: RealtimeUpdate) => void
) => {
	const { useEffect } = require("react");

	useEffect(() => {
		if (!realtimeManager) return;

		const unsubscribe = realtimeManager.subscribe(type, callback);
		return unsubscribe;
	}, [type, callback]);
};

// Hook for connection status
export const useRealtimeConnection = () => {
	const { useState, useEffect } = require("react");
	const [status, setStatus] = useState({
		isConnected: false,
		reconnectAttempts: 0,
	});

	useEffect(() => {
		if (!realtimeManager) return;

		const updateStatus = () => {
			setStatus(realtimeManager.getConnectionStatus());
		};

		// Update status immediately
		updateStatus();

		// Update status every 5 seconds
		const interval = setInterval(updateStatus, 5000);

		return () => clearInterval(interval);
	}, []);

	return status;
};
