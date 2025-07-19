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
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	constructor() {
		// Only initialize on client side
		if (typeof window !== "undefined") {
			this.initializeEventSource();
		}
	}

	private initializeEventSource() {
		try {
			// Use Server-Sent Events for real-time updates
			this.eventSource = new EventSource("/api/realtime");

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
				this.handleReconnect();
			};

			this.eventSource.onopen = () => {
				console.log("Realtime connection established");
				this.reconnectAttempts = 0;
			};
		} catch (error) {
			console.error("Failed to initialize EventSource:", error);
			this.handleReconnect();
		}
	}

	private handleReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(
				`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
			);

			setTimeout(() => {
				this.initializeEventSource();
			}, this.reconnectDelay * this.reconnectAttempts);
		} else {
			console.error("Max reconnection attempts reached");
		}
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

	public disconnect() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
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
		await fetch("/api/realtime/broadcast", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(fullUpdate),
		});
	} catch (error) {
		console.error("Failed to broadcast update:", error);
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
