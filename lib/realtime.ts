// Realtime updates using Server-Sent Events
export class RealtimeUpdates {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      this.eventSource = new EventSource(`${apiUrl}/api/realtime`);
      
      this.eventSource.onopen = () => {
        console.log('✅ Realtime connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing realtime message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.warn('⚠️ Realtime connection error:', error);
        this.isConnected = false;
        this.handleReconnect();
      };

      this.eventSource.addEventListener('error', (event) => {
        console.warn('⚠️ Realtime EventSource error:', event);
        this.isConnected = false;
        this.handleReconnect();
      });

    } catch (error) {
      console.error('❌ Failed to initialize realtime connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.cleanup();
        this.initialize();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    const { type, action, ...payload } = data;
    const eventKey = `${type}:${action}`;
    
    if (this.listeners.has(eventKey)) {
      this.listeners.get(eventKey)?.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      });
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public sendUpdate(type: string, action: string, data: any) {
    if (!this.isConnected) {
      console.warn('⚠️ Realtime not connected, update not sent');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';
      fetch(`${apiUrl}/api/realtime/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          action,
          data,
          timestamp: Date.now()
        })
      }).catch(error => {
        console.error('Error sending realtime update:', error);
      });
    } catch (error) {
      console.error('Error sending realtime update:', error);
    }
  }

  public cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  public getConnectionStatus() {
    return this.isConnected;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  const realtimeUpdates = new RealtimeUpdates();
  
  // تعيين مباشر بدون getter/setter
  (window as any).realtimeUpdates = realtimeUpdates;
  
  // Expose methods on window for compatibility
  (window as any).realtimeUpdates.on = realtimeUpdates.on.bind(realtimeUpdates);
  (window as any).realtimeUpdates.off = realtimeUpdates.off.bind(realtimeUpdates);
  (window as any).realtimeUpdates.sendUpdate = realtimeUpdates.sendUpdate.bind(realtimeUpdates);
  (window as any).realtimeUpdates.cleanup = realtimeUpdates.cleanup.bind(realtimeUpdates);
  (window as any).realtimeUpdates.getConnectionStatus = realtimeUpdates.getConnectionStatus.bind(realtimeUpdates);
}

// Export broadcastUpdate function
export const broadcastUpdate = async (data: any) => {
  if (typeof window !== 'undefined' && (window as any).realtimeUpdates) {
    const realtimeUpdates = (window as any).realtimeUpdates as RealtimeUpdates;
    realtimeUpdates.sendUpdate(data.type, data.action, data.data);
  }
};

// Export types
export type RealtimeDataType = any;
export type RealtimeUpdate = any;

// Export hook
export const useRealtime = (event: string, callback: Function) => {
  // Implementation for useRealtime hook
  return { realtimeManager: (window as any).realtimeUpdates };
};
