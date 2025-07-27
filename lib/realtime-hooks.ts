import { useEffect, useState } from 'react';
import { realtimeUpdates } from './realtime-updates';
import { realtimeSync } from './realtime-sync';
import { logger } from './logger';

// Hook للتحديثات الفورية للمستخدمين
export function useRealtimeUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      if (data.action === 'create') {
        setUsers(prev => [...prev, data.user]);
      } else if (data.action === 'update') {
        setUsers(prev => prev.map(user => user.id === data.user.id ? data.user : user));
      } else if (data.action === 'delete') {
        setUsers(prev => prev.filter(user => user.id !== data.userId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('user', handleUserUpdate);
    return unsubscribe;
  }, []);

  return users;
}

// Hook للتحديثات الفورية للمشاريع
export function useRealtimeProjects() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const handleProjectUpdate = (data: any) => {
      if (data.action === 'create') {
        setProjects(prev => [...prev, data.project]);
      } else if (data.action === 'update') {
        setProjects(prev => prev.map(project => project.id === data.project.id ? data.project : project));
      } else if (data.action === 'delete') {
        setProjects(prev => prev.filter(project => project.id !== data.projectId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('project', handleProjectUpdate);
    return unsubscribe;
  }, []);

  return projects;
}

// Hook للتحديثات الفورية للمهام
export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const handleTaskUpdate = (data: any) => {
      if (data.action === 'create') {
        setTasks(prev => [...prev, data.task]);
      } else if (data.action === 'update') {
        setTasks(prev => prev.map(task => task.id === data.task.id ? data.task : task));
      } else if (data.action === 'delete') {
        setTasks(prev => prev.filter(task => task.id !== data.taskId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('task', handleTaskUpdate);
    return unsubscribe;
  }, []);

  return tasks;
}

// Hook للتحديثات الفورية للعملاء
export function useRealtimeClients() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const handleClientUpdate = (data: any) => {
      if (data.action === 'create') {
        setClients(prev => [...prev, data.client]);
      } else if (data.action === 'update') {
        setClients(prev => prev.map(client => client.id === data.client.id ? data.client : client));
      } else if (data.action === 'delete') {
        setClients(prev => prev.filter(client => client.id !== data.clientId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('client', handleClientUpdate);
    return unsubscribe;
  }, []);

  return clients;
}

// Hook للتحديثات الفورية للإشعارات
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleNotificationUpdate = (data: any) => {
      if (data.action === 'create') {
        setNotifications(prev => [...prev, data.notification]);
      } else if (data.action === 'update') {
        setNotifications(prev => prev.map(notification => notification.id === data.notification.id ? data.notification : notification));
      } else if (data.action === 'delete') {
        setNotifications(prev => prev.filter(notification => notification.id !== data.notificationId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('notification', handleNotificationUpdate);
    return unsubscribe;
  }, []);

  return notifications;
}

// Hook للتحديثات الفورية لإعدادات المكتب
export function useRealtimeCompanySettings() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const handleSettingsUpdate = (data: any) => {
      if (data.action === 'update') {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('companySettings', handleSettingsUpdate);
    return unsubscribe;
  }, []);

  return settings;
}

// Hook للتحديثات الفورية لإعدادات المستخدم
export function useRealtimeUserSettings(userId?: string) {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (!userId) return;

    const handleUserSettingsUpdate = (data: any) => {
      if (data.action === 'update' && data.userId === userId) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('userSettings', handleUserSettingsUpdate);
    return unsubscribe;
  }, [userId]);

  return settings;
}

// Hook للتحديثات الفورية للأدوار
export function useRealtimeRoles() {
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const handleRoleUpdate = (data: any) => {
      if (data.action === 'create') {
        setRoles(prev => [...prev, data.role]);
      } else if (data.action === 'update') {
        setRoles(prev => prev.map(role => role._id === data.role._id ? data.role : role));
      } else if (data.action === 'delete') {
        setRoles(prev => prev.filter(role => role._id !== data.roleId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('role', handleRoleUpdate);
    return unsubscribe;
  }, []);

  return roles;
}

// Hook للتحديثات الفورية لأنواع المهام
export function useRealtimeTaskTypes() {
  const [taskTypes, setTaskTypes] = useState<any[]>([]);

  useEffect(() => {
    const handleTaskTypeUpdate = (data: any) => {
      if (data.action === 'create') {
        setTaskTypes(prev => [...prev, data.taskType]);
      } else if (data.action === 'update') {
        setTaskTypes(prev => prev.map(tt => tt._id === data.taskType._id ? data.taskType : tt));
      } else if (data.action === 'delete') {
        setTaskTypes(prev => prev.filter(tt => tt._id !== data.taskTypeId));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe('taskType', handleTaskTypeUpdate);
    return unsubscribe;
  }, []);

  return taskTypes;
}

// Hook عام للتحديثات الفورية
export function useRealtimeData(type: string) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const handleUpdate = (updateData: any) => {
      if (updateData.action === 'create') {
        setData(prev => [...prev, updateData[type.slice(0, -1)]]); // إزالة 's' من النهاية
      } else if (updateData.action === 'update') {
        setData(prev => prev.map(item => {
          const updatedItem = updateData[type.slice(0, -1)];
          return item.id === updatedItem.id || item._id === updatedItem._id ? updatedItem : item;
        }));
      } else if (updateData.action === 'delete') {
        const idField = type === 'users' ? 'userId' : `${type.slice(0, -1)}Id`;
        setData(prev => prev.filter(item => item.id !== updateData[idField] && item._id !== updateData[idField]));
      }
    };

    const unsubscribe = realtimeUpdates.subscribe(type, handleUpdate);
    return unsubscribe;
  }, [type]);

  return data;
}

// Hook لإرسال التحديثات الفورية
export function useRealtimeBroadcast() {
  const broadcastUpdate = async (type: string, data: any) => {
    try {
      await realtimeSync.broadcastUpdate(type, data);
      logger.info('Update broadcasted successfully', { type, action: data.action }, 'BROADCAST');
    } catch (error) {
      logger.error('Failed to broadcast update', { error, type, data }, 'BROADCAST');
    }
  };

  return { broadcastUpdate };
} 