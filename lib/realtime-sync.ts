import { realtimeUpdates } from "./realtime-updates";
import { logger } from "./logger";
import { api } from "./api";

// نظام التحديثات الفورية والزامنة مع قاعدة البيانات
export class RealtimeSync {
  private static instance: RealtimeSync;
  private syncQueue: Array<{ type: string; data: any; timestamp: number }> = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): RealtimeSync {
    if (!RealtimeSync.instance) {
      RealtimeSync.instance = new RealtimeSync();
    }
    return RealtimeSync.instance;
  }

  constructor() {
    this.initializeSync();
  }

  private initializeSync() {
    // مراقبة حالة الاتصال
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
      logger.info('Connection restored, processing sync queue', {}, 'SYNC');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Connection lost, queuing updates', {}, 'SYNC');
    });

    // معالجة قائمة التحديثات كل 30 ثانية
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  // إضافة تحديث للقائمة
  addToSyncQueue(type: string, data: any) {
    this.syncQueue.push({
      type,
      data,
      timestamp: Date.now()
    });

    // حفظ القائمة في localStorage
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

    // إذا كان متصل بالإنترنت، معالجة فورية
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // معالجة قائمة التحديثات
  private async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const queueToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queueToProcess) {
      try {
        await this.syncItem(item);
      } catch (error) {
        // إعادة إضافة العنصر للقائمة إذا فشل
        this.syncQueue.push(item);
        logger.error('Failed to sync item', { error, item }, 'SYNC');
      }
    }

    // حفظ القائمة المحدثة
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  // مزامنة عنصر واحد
  private async syncItem(item: { type: string; data: any; timestamp: number }) {
    try {
      switch (item.type) {
        case 'user':
          if (item.data.action === 'create') {
            await api.users.create(item.data.user);
          } else if (item.data.action === 'update') {
            await api.users.update(item.data.user.id, item.data.user);
          } else if (item.data.action === 'delete') {
            await api.users.delete(item.data.userId);
          }
          break;

        case 'project':
          if (item.data.action === 'create') {
            await api.projects.create(item.data.project);
          } else if (item.data.action === 'update') {
            await api.projects.update(item.data.project.id, item.data.project);
          } else if (item.data.action === 'delete') {
            await api.projects.delete(item.data.projectId);
          }
          break;

        case 'task':
          if (item.data.action === 'create') {
            await api.tasks.create(item.data.task);
          } else if (item.data.action === 'update') {
            await api.tasks.update(item.data.task.id, item.data.task);
          } else if (item.data.action === 'delete') {
            await api.tasks.delete(item.data.taskId);
          }
          break;

        case 'client':
          if (item.data.action === 'create') {
            await api.clients.create(item.data.client);
          } else if (item.data.action === 'update') {
            await api.clients.update(item.data.client.id, item.data.client);
          } else if (item.data.action === 'delete') {
            await api.clients.delete(item.data.clientId);
          }
          break;

        case 'transaction':
          if (item.data.action === 'create') {
            // استخدام fetch مباشرة للمعاملات المالية
            await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.transaction),
            });
          } else if (item.data.action === 'update') {
            await fetch(`/api/transactions/${item.data.transaction.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.transaction),
            });
          } else if (item.data.action === 'delete') {
            await fetch(`/api/transactions/${item.data.transactionId}`, {
              method: 'DELETE',
            });
          }
          break;

        case 'notification':
          if (item.data.action === 'create') {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.notification),
            });
          } else if (item.data.action === 'update') {
            await fetch(`/api/notifications/${item.data.notification.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.notification),
            });
          } else if (item.data.action === 'delete') {
            await fetch(`/api/notifications/${item.data.notificationId}`, {
              method: 'DELETE',
            });
          }
          break;

        case 'companySettings':
          if (item.data.action === 'update') {
            await fetch('/api/companySettings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.settings),
            });
          }
          break;

        case 'userSettings':
          if (item.data.action === 'update') {
            await fetch('/api/userSettings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: item.data.userId,
                ...item.data.settings
              }),
            });
          }
          break;
      }

      logger.info('Item synced successfully', { type: item.type, action: item.data.action }, 'SYNC');
    } catch (error) {
      logger.error('Failed to sync item', { error, item }, 'SYNC');
      throw error;
    }
  }

  // تحميل قائمة التحديثات من localStorage
  loadSyncQueue() {
    try {
      const queueData = localStorage.getItem('syncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        logger.info('Sync queue loaded from localStorage', { queueLength: this.syncQueue.length }, 'SYNC');
      }
    } catch (error) {
      logger.error('Failed to load sync queue', { error }, 'SYNC');
    }
  }

  // إرسال تحديث فوري مع المزامنة
  async broadcastUpdate(type: string, data: any) {
    // إرسال التحديث الفوري
    await realtimeUpdates.broadcastUpdate(type, data);

    // إضافة للقائمة للمزامنة مع قاعدة البيانات
    this.addToSyncQueue(type, data);
  }

  // تنظيف القائمة
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// إنشاء instance واحد
export const realtimeSync = RealtimeSync.getInstance();

// Hook لاستخدام المزامنة
export function useRealtimeSync() {
  return realtimeSync;
} 